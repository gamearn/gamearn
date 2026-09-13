import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Decodes the backend's stable success/error envelope independently of the
/// transport, which keeps malformed server responses testable and predictable.
dynamic decodeApiResponse(int statusCode, String responseBody) {
  try {
    final decoded = jsonDecode(responseBody);
    final json =
        decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};

    if (statusCode >= 200 && statusCode < 300 && json['success'] == true) {
      return json['data'];
    }

    final error = json['error'];
    throw ApiException(
      code: error is Map && error['code'] is String
          ? error['code'] as String
          : 'API_ERROR',
      message: error is Map && error['message'] is String
          ? error['message'] as String
          : 'Request failed ($statusCode)',
      statusCode: statusCode,
    );
  } on ApiException {
    rethrow;
  } on FormatException {
    throw ApiException(
      code: 'INVALID_RESPONSE',
      message: 'The server returned an invalid response.',
      statusCode: statusCode,
    );
  }
}

/// Lightweight REST client for the Node.js backend.
///
/// Pattern matches MatchmakingService in socket_service.dart:
/// Firebase ID token sent as `Authorization: Bearer <token>`.
class ApiService {
  static String get _base => '${ApiConfig.nodeBaseUrl}/api/v1';

  /// POST to a backend path with the user's Firebase ID token.
  /// Returns the response `data` (Map or List depending on the endpoint).
  static Future<dynamic> post(
    String path,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    return _request('POST', path, body: body, auth: auth);
  }

  /// GET from a backend path with the user's Firebase ID token.
  static Future<dynamic> get(
    String path, {
    bool auth = true,
  }) async {
    return _request('GET', path, auth: auth);
  }

  /// PATCH a backend path with the user's Firebase ID token.
  static Future<dynamic> patch(
    String path,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    return _request('PATCH', path, body: body, auth: auth);
  }

  static Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (auth) {
        final user = FirebaseAuth.instance.currentUser;
        if (user == null) return null;
        final token = await user.getIdToken();
        headers['Authorization'] = 'Bearer $token';
      }

      final uri = Uri.parse('$_base$path');
      final res = switch (method) {
        'GET' => await http
            .get(uri, headers: headers)
            .timeout(const Duration(seconds: 20)),
        'PATCH' => await http
            .patch(uri, headers: headers, body: jsonEncode(body ?? {}))
            .timeout(const Duration(seconds: 20)),
        _ => await http
            .post(uri, headers: headers, body: jsonEncode(body ?? {}))
            .timeout(const Duration(seconds: 20)),
      };

      return decodeApiResponse(res.statusCode, res.body);
    } on ApiException {
      rethrow;
    } catch (e) {
      debugPrint('[Api] $method $path error: $e');
      throw ApiException(
          code: 'NETWORK_ERROR', message: 'Network error. Please try again.');
    }
  }

  // ── Auth / OTP ──────────────────────────────────────────────────────────────

  static Future<void> requestSignupEmailOtp(String email) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null)
      throw ApiException(code: 'AUTH_MISSING', message: 'Not signed in.');
    await post(
        '/auth/signup/email-otp/request',
        {
          'idToken': await user.getIdToken(true),
          'email': email,
        },
        auth: false);
  }

  static Future<void> verifySignupEmailOtp(String email, String code) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null)
      throw ApiException(code: 'AUTH_MISSING', message: 'Not signed in.');
    await post(
        '/auth/signup/email-otp/verify',
        {
          'idToken': await user.getIdToken(),
          'email': email,
          'code': code,
        },
        auth: false);
    await user.reload();
    await user.getIdToken(true);
  }

  static Future<Map<String, dynamic>> createTournament({
    required String name,
    required String gameType,
    required String duration,
    required String tournamentType,
    required int maxPlayers,
    required int topWinners,
  }) async {
    final data = await post('/tournaments', {
      'name': name,
      'gameType': gameType,
      'duration': duration,
      'tournamentType': tournamentType,
      'maxPlayers': maxPlayers,
      'topWinners': topWinners,
    });
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Register the signed-in user in the backend.
  /// Sends the Firebase ID token in the body (route has no Bearer auth).
  /// Throws [ApiException] with code `CONFLICT` if the user already exists.
  static Future<Map<String, dynamic>> registerBackendUser({
    required String phoneNumber,
    required String displayName,
    String? referralCode,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw ApiException(code: 'AUTH_MISSING', message: 'Not signed in.');
    }
    final idToken = await user.getIdToken(true);
    final data = await post(
        '/auth/register',
        {
          'phoneNumber': phoneNumber,
          'displayName': displayName,
          'idToken': idToken,
          if (referralCode != null && referralCode.isNotEmpty)
            'referralCode': referralCode,
        },
        auth: false);
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  // ── Wallet / payments ───────────────────────────────────────────────────────

  /// Initiate a Paystack top-up. Returns `{ txRef, paymentLink, amount, currency }`.
  static Future<Map<String, dynamic>> initiateTopUp({
    required double amount,
    String paymentMethod = 'card',
  }) async {
    final data = await post('/pay/initiate', {
      'amount': amount,
      'currency': 'NGN',
      'paymentMethod': paymentMethod,
      'metadata': {'purpose': 'wallet_topup'},
    });
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Poll the status of a pending transaction until it settles.
  static Future<Map<String, dynamic>> verifyTransaction(String txRef) async {
    final data = await get('/pay/verify/$txRef');
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  static Future<void> withdraw({
    required double amount,
    required String accountNumber,
    required String bankCode,
    required String accountName,
  }) async {
    await post('/wallet/withdraw', {
      'amount': amount,
      'accountNumber': accountNumber,
      'bankCode': bankCode,
      'accountName': accountName,
    });
  }

  /// Nigerian banks list from Paystack (for the withdrawal bank picker).
  static Future<List<Map<String, dynamic>>> getBanks() async {
    final data = await get('/pay/banks');
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const [];
  }

  // ── MFA (Multi-Factor Authentication) ──────────────────────────────────────

  /// Current MFA configuration + linked authenticators.
  static Future<Map<String, dynamic>> getMfaStatus() async {
    final data = await get('/auth/mfa/status');
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Begin enrolling a second factor.
  /// Type 'email'  -> sends a 6-digit code to [value].
  /// Type 'phone'  -> returns a hint; SMS delivered via Firebase on the client.
  static Future<Map<String, dynamic>> enrollMfa({
    required String factor,
    String? value,
  }) async {
    final data = await post('/auth/mfa/enroll', {
      'factor': factor,
      if (value != null) 'value': value,
    });
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Verify a second factor.
  /// Email factor: { email, code }.
  /// Phone factor: { phone, idToken } (firebase-verified SMS).
  static Future<Map<String, dynamic>> verifyMfa({
    required String factor,
    String? email,
    String? phone,
    String? code,
    String? idToken,
  }) async {
    final data = await post('/auth/mfa/verify', {
      'factor': factor,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (code != null) 'code': code,
      if (idToken != null) 'idToken': idToken,
    });
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  // ── Premium (server-side DB-backed pricing) ────────────────────────────────

  /// Active premium plans from the server: `{ code, name, priceNaira, price, durationDays }`.
  static Future<List<Map<String, dynamic>>> getPremiumPlans() async {
    final data = await get('/premium/plans');
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return const [];
  }

  /// Current user's premium status: `{ isPremium, premiumUntil }`.
  static Future<Map<String, dynamic>> getPremiumStatus() async {
    final data = await get('/premium/status');
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Start a Paystack premium purchase. Returns
  /// `{ txRef, paymentLink, plan, planName, amount }`.
  static Future<Map<String, dynamic>> initiatePremium({
    required String plan,
    String paymentMethod = 'card',
  }) async {
    final data = await post('/premium/initiate', {
      'plan': plan,
      'paymentMethod': paymentMethod,
    });
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  /// Verify a premium purchase and grant it if paid.
  static Future<Map<String, dynamic>> verifyPremium(String txRef) async {
    final data = await post('/premium/verify/$txRef', {});
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  // ── Account ────────────────────────────────────────────────────────────────

  /// Permanently delete the account. Sends the typed-confirmation string.
  static Future<Map<String, dynamic>> deleteAccount({
    required String confirmation,
  }) async {
    final data =
        await post('/auth/delete-account', {'confirmation': confirmation});
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  // ── Referral ───────────────────────────────────────────────────────────────

  /// User's referral code/link, referees count and total commission earned:
  /// `{ referralCode, referralLink, referees, totalCommission }`.
  static Future<Map<String, dynamic>> getReferralInfo() async {
    final data = await get('/referral/me');
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }
}

class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;
  ApiException({
    required this.code,
    required this.message,
    this.statusCode = 0,
  });

  @override
  String toString() => message;
}
