import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../services/api_service.dart';
import '../services/social_auth_service.dart';

/// Convert any thrown error into a short, human-friendly message.
String friendlyMessage(Object e) {
  if (e is AuthException) return e.message;
  if (e is FirebaseAuthException) {
    switch (e.code) {
      case 'too-many-requests':
        return 'Too many attempts. Please wait and try again later.';
      case 'network-request-failed':
        return 'Can\'t reach the server. Check your connection and try again.';
      case 'invalid-verification-code':
        return 'The code you entered is incorrect.';
      case 'invalid-verification-id':
      case 'session-expired':
        return 'This code has expired. Please request a new one.';
      case 'email-already-in-use':
        return 'That email is already in use. Try signing in instead.';
      case 'invalid-email':
        return 'That email address is not valid.';
      case 'weak-password':
        return 'Password must be at least 6 characters.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'user-not-found':
        return 'No account found for that email.';
      case 'account-exists-with-different-credential':
        return 'An account already exists with this email. Sign in using the other method.';
      case 'operation-not-allowed':
        return 'This sign-in option is not enabled yet.';
      default:
        return e.message ?? 'Something went wrong. Please try again.';
    }
  }
  if (e is ApiException) {
    switch (e.code) {
      case 'NETWORK_ERROR':
        return 'Can\'t reach the server. Check your connection and try again.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'VALIDATION_ERROR':
      case 'NOT_FOUND':
        return e.message.isEmpty ? 'Please check your details and try again.' : e.message;
      case 'CONFLICT':
        return e.message.isEmpty ? 'This is already registered.' : e.message;
      default:
        if (e.statusCode >= 500) {
          return 'Something went wrong on our end. Please try again shortly.';
        }
        return e.message.isEmpty ? 'Something went wrong. Please try again.' : e.message;
    }
  }
  if (e is TimeoutException) {
    return 'The request took too long. Check your connection and try again.';
  }
  if (e is SocketException || e is http.ClientException) {
    return 'Can\'t reach the server. Check your connection and try again.';
  }
  final s = e.toString();
  if (s.startsWith('Connection failed') || s.contains('SocketException')) {
    return 'Can\'t reach game servers. Check your connection and try again.';
  }
  if (e is String) return s;
  return 'Something went wrong. Please try again.';
}

/// Whether the error is transient and worth offering a Retry action for.
bool isRetryable(Object e) {
  if (e is ApiException) {
    return e.code == 'NETWORK_ERROR' || e.statusCode >= 500;
  }
  return e is TimeoutException || e is SocketException || e is http.ClientException;
}

/// Show a consistent, themed error snackbar. Optionally attach a Retry action
/// for transient failures.
void showAppError(
  BuildContext context,
  Object e, {
  VoidCallback? onRetry,
  bool autoDismiss = true,
}) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.clearSnackBars();
  messenger.showSnackBar(
    SnackBar(
      content: Text(
        friendlyMessage(e),
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      backgroundColor: const Color(0xFFB3261E),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: Duration(seconds: onRetry != null ? 6 : 3),
      action: onRetry != null
          ? SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: autoDismiss ? onRetry : () {},
            )
          : null,
    ),
  );
}
