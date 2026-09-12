import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pinput/pinput.dart';

import '../../services/api_service.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../widgets/gamearn_ui.dart';

class SignupEmailOtpScreen extends StatefulWidget {
  const SignupEmailOtpScreen(
      {super.key,
      required this.email,
      required this.name,
      this.allowImmediateResend = false});
  final String email;
  final String name;
  final bool allowImmediateResend;

  @override
  State<SignupEmailOtpScreen> createState() => _SignupEmailOtpScreenState();
}

class _SignupEmailOtpScreenState extends State<SignupEmailOtpScreen> {
  final _code = TextEditingController();
  Timer? _timer;
  int _seconds = 120;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.allowImmediateResend) {
      _seconds = 0;
    } else {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _seconds = 120);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _seconds == 0) return timer.cancel();
      setState(() => _seconds--);
    });
  }

  Future<void> _verify() async {
    if (_code.text.trim().length != 6 || _loading) return;
    setState(() => _loading = true);
    try {
      await ApiService.verifySignupEmailOtp(widget.email, _code.text.trim());
      await FirebaseAuth.instance.currentUser?.reload();
      await FirebaseAuth.instance.currentUser?.getIdToken(true);
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (error) {
      if (mounted) showAppError(context, error);
      _code.clear();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    if (_seconds > 0 || _loading) return;
    setState(() => _loading = true);
    try {
      await ApiService.requestSignupEmailOtp(widget.email);
      _startTimer();
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('A new code was sent to your email.'),
          behavior: SnackBarBehavior.floating,
        ));
    } catch (error) {
      if (mounted) showAppError(context, error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _useAnotherAccount() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.signOut();
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pin = PinTheme(
      width: 48.w,
      height: 56.h,
      textStyle: TextStyle(
          color: context.txtPri, fontSize: 22.sp, fontWeight: FontWeight.w700),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border),
      ),
    );
    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(backgroundColor: Colors.transparent),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 28.h),
          child: Column(children: [
            Icon(Icons.mark_email_unread_outlined, color: kOrange, size: 58.w),
            SizedBox(height: 18.h),
            Text('Verify your email',
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 28.sp,
                    fontWeight: FontWeight.w800)),
            SizedBox(height: 10.h),
            Text('Enter the 6-digit code sent to\n${widget.email}',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
            SizedBox(height: 34.h),
            FittedBox(
                child: Pinput(
              controller: _code,
              autofocus: true,
              length: 6,
              defaultPinTheme: pin,
              focusedPinTheme: pin.copyWith(
                  decoration: pin.decoration
                      ?.copyWith(border: Border.all(color: kCyan, width: 2))),
              onCompleted: (_) => _verify(),
            )),
            SizedBox(height: 28.h),
            GaButton.primary(
                label: 'Verify email', isLoading: _loading, onPressed: _verify),
            SizedBox(height: 12.h),
            TextButton(
              onPressed: _seconds == 0 ? _resend : null,
              child: Text(_seconds == 0
                  ? 'Resend code'
                  : 'Resend in $_seconds seconds'),
            ),
            SizedBox(height: 6.h),
            TextButton.icon(
              onPressed: _loading ? null : _useAnotherAccount,
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Use another account'),
            ),
          ]),
        ),
      ),
    );
  }
}
