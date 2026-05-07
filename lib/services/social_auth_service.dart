import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

/// Centralised social auth service for Gamearn.
/// All three providers return a [UserCredential] on success.
/// On failure they throw a readable [AuthException].
class SocialAuthService {
  SocialAuthService._();
  static final instance = SocialAuthService._();

  final _auth = FirebaseAuth.instance;

  // ── Google ──────────────────────────────────────────────────────────────────
  Future<UserCredential> signInWithGoogle() async {
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) throw AuthException('Google sign-in cancelled.');

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      return await _auth.signInWithCredential(credential);
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException('Google sign-in failed. Please try again.');
    }
  }

  // ── Facebook ─────────────────────────────────────────────────────────────────
  Future<UserCredential> signInWithFacebook() async {
    try {
      final result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );

      if (result.status == LoginStatus.cancelled) {
        throw AuthException('Facebook sign-in cancelled.');
      }
      if (result.status != LoginStatus.success) {
        throw AuthException('Facebook sign-in failed: ${result.message}');
      }

      final credential =
          FacebookAuthProvider.credential(result.accessToken!.tokenString);
      return await _auth.signInWithCredential(credential);
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException('Facebook sign-in failed. Please try again.');
    }
  }

  // ── Apple ─────────────────────────────────────────────────────────────────────
  Future<UserCredential> signInWithApple() async {
    try {
      // Generate nonce for security
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);

      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
      );

      final oauthCredential = OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      );

      return await _auth.signInWithCredential(oauthCredential);
    } on AuthException {
      rethrow;
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        throw AuthException('Apple sign-in cancelled.');
      }
      throw AuthException('Apple sign-in failed. Please try again.');
    } catch (e) {
      throw AuthException('Apple sign-in failed. Please try again.');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  String _generateNonce([int length = 32]) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  String _sha256ofString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}
