import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

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
        'GET' => await http.get(uri, headers: headers),
        'PATCH' => await http.patch(uri, headers: headers, body: jsonEncode(body ?? {})),
        _ => await http.post(uri, headers: headers, body: jsonEncode(body ?? {})),
      };

      final decoded = jsonDecode(res.body);
      final json = decoded is Map<String, dynamic>
          ? decoded
          : <String, dynamic>{};

      if (res.statusCode >= 200 && res.statusCode < 300 && json['success'] == true) {
        return json['data'];
      }

      final err = json['error'];
      final message = err is Map ? err['message'] : null;
      throw ApiException(
        code: (err is Map ? err['code'] : null) as String? ?? 'API_ERROR',
        message: message as String? ?? 'Request failed (${res.statusCode})',
        statusCode: res.statusCode,
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      debugPrint('[Api] $method $path error: $e');
      throw ApiException(code: 'NETWORK_ERROR', message: 'Network error. Please try again.');
    }
  }

  // ── Auth / OTP ──────────────────────────────────────────────────────────────

  /// Register the signed-in user in the backend.
  /// Sends the Firebase ID token in the body (route has no Bearer auth).
  /// Throws [ApiException] with code `CONFLICT` if the user already exists.
  static Future<Map<String, dynamic>> registerBackendUser({
    required String phoneNumber,
    required String displayName,
  }) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      throw ApiException(code: 'AUTH_MISSING', message: 'Not signed in.');
    }
    final idToken = await user.getIdToken(true);
    final data = await post('/auth/register', {
      'phoneNumber': phoneNumber,
      'displayName': displayName,
      'idToken': idToken,
    }, auth: false);
    return data is Map<String, dynamic> ? data : <String, dynamic>{};
  }

  // ── Wallet / payments ───────────────────────────────────────────────────────

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

  /// Nigerian banks list from Flutterwave (for the withdrawal bank picker).
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
