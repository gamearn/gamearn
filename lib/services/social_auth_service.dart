import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
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
      if (googleAuth.idToken == null) {
        debugPrint('[Auth] Google idToken is null (accessToken present: '
            '${googleAuth.accessToken != null}). Firebase needs an ID token, which '
            'is minted for the Web OAuth client (type 2) in google-services.json.');
        throw AuthException(
            'Google sign-in failed: no ID token returned. Ensure the Firebase '
            'Web OAuth client (type 2) is present in google-services.json.');
      }
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      return await _auth.signInWithCredential(credential);
    } on AuthException {
      rethrow;
    } on FirebaseAuthException catch (e) {
      debugPrint(
          '[Auth] Google FirebaseAuthException: ${e.code} — ${e.message}');
      throw AuthException(_googleError(e));
    } catch (e) {
      debugPrint('[Auth] Google sign-in unexpected error: $e');
      throw AuthException('Google sign-in failed. Please try again.');
    }
  }

  // ── Facebook ─────────────────────────────────────────────────────────────────
  Future<UserCredential> signInWithFacebook() async {
    try {
      final result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );
      debugPrint(
          '[Auth] Facebook result: ${result.status}; ${result.message ?? ''}');

      if (result.status == LoginStatus.cancelled) {
        throw AuthException(
            'Facebook could not return to Gamearn. Please try again.');
      }
      if (result.status != LoginStatus.success) {
        throw AuthException('Facebook sign-in failed: ${result.message}');
      }

      final token = result.accessToken?.tokenString;
      if (token == null) {
        throw AuthException('Facebook sign-in failed: no token received.');
      }

      final credential = FacebookAuthProvider.credential(token);
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
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        final provider = AppleAuthProvider()
          ..addScope('email')
          ..addScope('name');
        return await _auth.signInWithProvider(provider);
      }
      // Generate nonce for security
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);

      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
        webAuthenticationOptions: WebAuthenticationOptions(
          clientId: 'com.gamearn.service',
          redirectUri: Uri.parse(
            'https://gamearn-app.firebaseapp.com/__/auth/handler',
          ),
        ),
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

  // ── Re-authentication (withdrawal MFA, security changes) ─────────────────────
  // Social users have no password, so "re-confirm identity" = fresh provider
  // re-auth. Already-signed-in sessions resolve silently for Google/Facebook;
  // Apple always shows its system sheet.

  Future<void> reauthenticateWithGoogle() async {
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) throw AuthException('Google re-auth cancelled.');
      final googleAuth = await googleUser.authentication;
      if (googleAuth.idToken == null) {
        throw AuthException('Google re-auth failed: no ID token returned.');
      }
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final current = _auth.currentUser;
      if (current == null) throw AuthException('Not signed in.');
      await current.reauthenticateWithCredential(credential);
    } on AuthException {
      rethrow;
    } on FirebaseAuthException catch (e) {
      debugPrint(
          '[Auth] Google re-auth FirebaseAuthException: ${e.code} — ${e.message}');
      throw AuthException(_googleError(e));
    } catch (e) {
      debugPrint('[Auth] Google re-auth unexpected error: $e');
      throw AuthException('Google re-authentication failed: $e');
    }
  }

  Future<void> reauthenticateWithFacebook() async {
    try {
      final result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );
      if (result.status == LoginStatus.cancelled) {
        throw AuthException('Facebook re-auth cancelled.');
      }
      if (result.status != LoginStatus.success) {
        throw AuthException('Facebook re-auth failed: ${result.message}');
      }
      final token = result.accessToken?.tokenString;
      if (token == null) {
        throw AuthException('Facebook re-auth failed: no token received.');
      }
      final credential = FacebookAuthProvider.credential(token);
      final current = _auth.currentUser;
      if (current == null) throw AuthException('Not signed in.');
      await current.reauthenticateWithCredential(credential);
    } on AuthException {
      rethrow;
    } catch (e) {
      throw AuthException(
          'Facebook re-authentication failed. Please try again.');
    }
  }

  Future<void> reauthenticateWithApple() async {
    try {
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
        final current = _auth.currentUser;
        if (current == null) throw AuthException('Not signed in.');
        final provider = AppleAuthProvider()
          ..addScope('email')
          ..addScope('name');
        await current.reauthenticateWithProvider(provider);
        return;
      }
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);

      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
        webAuthenticationOptions: WebAuthenticationOptions(
          clientId: 'com.gamearn.service',
          redirectUri: Uri.parse(
            'https://gamearn-app.firebaseapp.com/__/auth/handler',
          ),
        ),
      );

      final oauthCredential = OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        rawNonce: rawNonce,
      );
      final current = _auth.currentUser;
      if (current == null) throw AuthException('Not signed in.');
      await current.reauthenticateWithCredential(oauthCredential);
    } on AuthException {
      rethrow;
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        throw AuthException('Apple re-auth cancelled.');
      }
      throw AuthException('Apple re-authentication failed. Please try again.');
    } catch (e) {
      throw AuthException('Apple re-authentication failed. Please try again.');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  String _googleError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-credential':
        return 'Google sign-in failed: credentials were rejected. Verify the Web '
            'OAuth client (type 2) is present in google-services.json.';
      case 'account-exists-with-different-credential':
        return 'An account with this email already exists using a different '
            'sign-in method. Sign in with that method first.';
      case 'user-disabled':
        return 'This Google account has been disabled.';
      case 'operation-not-allowed':
        return 'Google sign-in is not enabled in the Firebase console.';
      default:
        return 'Google sign-in failed. Please try again.';
    }
  }

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
