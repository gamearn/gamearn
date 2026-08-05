import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'profile_setup_screen.dart';

/// Firebase link-based email verification screen.
///
/// Waits for the user to click the verification link Firebase emailed them.
/// - Listens for the App-Links deep link and applies the oobCode directly.
/// - Falls back to polling [User.reload] so browser-based verification also
///   gets picked up.
/// On verified, pushes [ProfileSetupScreen] (user is already signed in).
class EmailVerifyScreen extends StatefulWidget {
  final String email;
  final String name;

  const EmailVerifyScreen({super.key, required this.email, required this.name});

  @override
  State<EmailVerifyScreen> createState() => _EmailVerifyScreenState();
}

class _EmailVerifyScreenState extends State<EmailVerifyScreen> {
  static const _continueUrl = 'https://gamearn-app.web.app/verify';
  static const _androidPackageName = 'com.gamearn';

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSub;
  Timer? _pollTimer;
  Timer? _cooldownTimer;

  int _secondsLeft = 60;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _startCooldown();
    _startPolling();
    _listenForDeepLinks();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _linkSub?.cancel();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  ActionCodeSettings get _actionCodeSettings => ActionCodeSettings(
        url: _continueUrl,
        handleCodeInApp: true,
        androidPackageName: _androidPackageName,
      );

  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _secondsLeft = 60);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer =
        Timer.periodic(const Duration(seconds: 3), (_) => _checkVerified());
  }

  void _listenForDeepLinks() {
    _appLinks.getInitialLink().then(_handleLink);
    _linkSub = _appLinks.uriLinkStream.listen(_handleLink);
  }

  Future<void> _handleLink(Uri? uri) async {
    if (uri == null) return;
    final params = uri.queryParameters;
    if (params['mode'] != 'verifyEmail') return;
    final oobCode = params['oobCode'];
    if (oobCode == null || oobCode.isEmpty) return;
    if (_loading) return;

    setState(() => _loading = true);
    try {
      final auth = FirebaseAuth.instance;
      final user = auth.currentUser;
      if (user == null) return;
      await auth.checkActionCode(oobCode);
      await auth.applyActionCode(oobCode);
      await user.reload();
    } on FirebaseAuthException catch (e) {
      // The code may already have been applied (e.g. verified in browser).
      debugPrint('[EmailVerify] applyActionCode failed: ${e.code}');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
    await _checkVerified();
  }

  Future<void> _checkVerified() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      await user.reload();
    } catch (_) {
      return;
    }
    if (user.emailVerified) {
      _navigateToSetup();
    }
  }

  void _navigateToSetup() {
    _pollTimer?.cancel();
    _linkSub?.cancel();
    _cooldownTimer?.cancel();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const ProfileSetupScreen()),
      (route) => false,
    );
  }

  Future<void> _resend() async {
    if (_secondsLeft > 0 || _loading) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      await user.sendEmailVerification(_actionCodeSettings);
      _startCooldown();
      _showSnack('A new verification link was sent!', color: kCyan);
    } on FirebaseAuthException catch (e) {
      _showSnack(e.message ?? 'Could not send verification email');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _continueManually() async {
    setState(() => _loading = true);
    await _checkVerified();
    if (!mounted) return;
    setState(() => _loading = false);
    final verified = FirebaseAuth.instance.currentUser?.emailVerified ?? false;
    if (!verified) {
      _showSnack('Not verified yet. Check your inbox and click the link.');
    }
  }

  void _showSnack(String message, {Color? color}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: color ?? Colors.redAccent,
      behavior: SnackBarBehavior.floating,
    ));
  }

  String get _timerDisplay {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')} : ${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: Icon(Icons.arrow_back_ios_new,
                      color: context.txtPri, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const Spacer(),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.mark_email_read_outlined,
                    color: kOrange, size: 34),
              ),
              const SizedBox(height: 24),
              Text('Verify Your Email',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(
                'We sent a verification link to\n${widget.email}',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 13),
              ),
              const SizedBox(height: 14),
              Text(
                'Tap the link in the email and you will come back here to continue automatically.',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 12),
              ),
              const SizedBox(height: 32),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: context.card,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.timer_outlined,
                        color: context.txtSec, size: 16),
                    const SizedBox(width: 6),
                    Text(_timerDisplay,
                        style: TextStyle(
                            color: context.txtPri,
                            fontWeight: FontWeight.w700,
                            fontSize: 15)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Didn't get the email?  ",
                      style: TextStyle(color: context.txtSec, fontSize: 13)),
                  GestureDetector(
                    onTap: _secondsLeft == 0 ? _resend : null,
                    child: Text('Resend Email',
                        style: TextStyle(
                            color: _secondsLeft == 0
                                ? kCyan
                                : context.txtSec,
                            fontWeight: FontWeight.w700,
                            fontSize: 13)),
                  ),
                ],
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading ? null : _continueManually,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kOrange,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('I\'ve Verified — Continue',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16)),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward,
                                color: Colors.white, size: 18),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Text('SECURED BY GAMEARN SHIELD',
                  style: kLabel.copyWith(color: context.txtSec)),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
