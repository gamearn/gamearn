import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pinput/pinput.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../utils/error_utils.dart';
import 'profile_setup_screen.dart';

final _clipCodeRegex = RegExp(r'(^|\D)(\d{6})(\D|$)');

/// Email 6-digit OTP screen.
///
/// purpose == 'email_verification'  → verify during email registration, then
///                                    push ProfileSetup (user is signed in).
/// purpose == 'withdrawal'          → MFA step before withdrawing; pops with
///                                    the mfaProof string on success.
class EmailOtpScreen extends StatefulWidget {
  final String email;
  final String name;
  final String purpose; // 'email_verification' | 'withdrawal'

  const EmailOtpScreen({
    super.key,
    required this.email,
    required this.name,
    required this.purpose,
  });

  @override
  State<EmailOtpScreen> createState() => _EmailOtpScreenState();
}

class _EmailOtpScreenState extends State<EmailOtpScreen> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();

  int _secondsLeft = 60;
  Timer? _timer;
  Timer? _clipWatcher;
  String? _lastClipText;
  bool _loading = false;

  bool get _isWithdrawal => widget.purpose == 'withdrawal';

  @override
  void initState() {
    super.initState();
    _startTimer();
    _startClipWatcher();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  /// Watches the clipboard so the code auto-fills when copied from the email.
  void _startClipWatcher() {
    _clipWatcher = Timer.periodic(
        const Duration(milliseconds: 1500), (_) => _checkClipboard());
  }

  Future<void> _checkClipboard() async {
    if (_loading) return;
    if (_pinController.text.isNotEmpty) return;

    final data = await Clipboard.getData(Clipboard.kTextPlain);
    final text = data?.text?.trim() ?? '';
    if (text == _lastClipText) return;
    _lastClipText = text;
    if (text.isEmpty) return;

    final match = _clipCodeRegex.firstMatch(text);
    final code = match?.group(2);
    if (code == null) return;

    _pinController.text = code;
    if (mounted) {
      _showSnack('Code detected — verifying...', color: kCyan);
    }
    _verify(code);
  }

  @override
  void dispose() {
    _pinController.dispose();
    _focusNode.dispose();
    _timer?.cancel();
    _clipWatcher?.cancel();
    super.dispose();
  }

  String get _timerDisplay {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')} : ${s.toString().padLeft(2, '0')}';
  }

  void _showSnack(String message, {Color? color}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: color ?? Colors.redAccent,
      behavior: SnackBarBehavior.floating,
    ));
  }

  Future<void> _resendCode() async {
    if (_secondsLeft > 0) return;
    setState(() => _loading = true);
    try {
      await ApiService.sendEmailOtp(
          email: widget.email, purpose: widget.purpose);
      _startTimer();
      _showSnack('A new code was sent!', color: kCyan);
    } on ApiException catch (e) {
      showAppError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify(String pin) async {
    if (pin.length < 6) {
      _showSnack('Enter the full 6-digit code');
      return;
    }

    setState(() => _loading = true);
    try {
      final result = await ApiService.verifyEmailOtp(
        email: widget.email,
        purpose: widget.purpose,
        code: pin,
      );

      if (_isWithdrawal) {
        // Pop with the MFA proof so the withdraw screen can submit.
        if (!mounted) return;
        Navigator.pop(context, result);
        return;
      }

      // Email verified — user is already signed in via email/password.
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const ProfileSetupScreen()),
        (route) => false,
      );
    } on ApiException catch (e) {
      showAppError(context, e);
      _pinController.clear();
      _focusNode.requestFocus();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 58,
      height: 64,
      textStyle: TextStyle(
          fontSize: 24, color: context.txtPri, fontWeight: FontWeight.w700),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
    );

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
                child:
                    const Icon(Icons.mark_email_read_outlined,
                        color: kOrange, size: 34),
              ),
              const SizedBox(height: 24),
              Text(_isWithdrawal ? 'Secure Your Withdrawal' : 'Email Verification',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(
                'Enter the 6-digit code sent to\n${widget.email}',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 13),
              ),
              const SizedBox(height: 36),
              Pinput(
                length: 6,
                controller: _pinController,
                focusNode: _focusNode,
                defaultPinTheme: defaultPinTheme,
                focusedPinTheme: defaultPinTheme.copyWith(
                  decoration: defaultPinTheme.decoration!.copyWith(
                    border: Border.all(color: kCyan, width: 2),
                  ),
                ),
                onCompleted: _verify,
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.content_paste_go,
                      color: context.txtSec, size: 16),
                  const SizedBox(width: 6),
                  Text('Tip: copy the code from the email — it fills in automatically',
                      style: TextStyle(color: context.txtSec, fontSize: 12)),
                ],
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
                    Icon(Icons.timer_outlined, color: context.txtSec, size: 16),
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
                  Text("Didn't receive the code?  ",
                      style: TextStyle(color: context.txtSec, fontSize: 13)),
                  GestureDetector(
                    onTap: _secondsLeft == 0 ? _resendCode : null,
                    child: Text('Resend Email',
                        style: TextStyle(
                            color: _secondsLeft == 0 ? kCyan : context.txtSec,
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
                  onPressed:
                      _loading ? null : () => _verify(_pinController.text),
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
                            Text('Verify & Continue',
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
