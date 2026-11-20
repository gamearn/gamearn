import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:pinput/pinput.dart';

import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../widgets/gamearn_ui.dart';

class PhoneLoginCodeScreen extends StatefulWidget {
  const PhoneLoginCodeScreen({
    super.key,
    required this.phone,
    required this.verificationId,
    this.resendToken,
  });

  final String phone;
  final String verificationId;
  final int? resendToken;

  @override
  State<PhoneLoginCodeScreen> createState() => _PhoneLoginCodeScreenState();
}

class _PhoneLoginCodeScreenState extends State<PhoneLoginCodeScreen> {
  final _code = TextEditingController();
  late String _verificationId;
  int? _resendToken;
  Timer? _timer;
  int _seconds = 60;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _verificationId = widget.verificationId;
    _resendToken = widget.resendToken;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _seconds = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _seconds == 0) return timer.cancel();
      setState(() => _seconds--);
    });
  }

  Future<void> _verify() async {
    if (_code.text.trim().length != 6 || _loading) return;
    setState(() => _loading = true);
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId,
        smsCode: _code.text.trim(),
      );
      await FirebaseAuth.instance.signInWithCredential(credential);
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on FirebaseAuthException catch (error) {
      if (mounted) showAppError(context, error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    if (_seconds > 0 || _loading) return;
    setState(() => _loading = true);
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: widget.phone,
      forceResendingToken: _resendToken,
      verificationCompleted: (credential) async {
        await FirebaseAuth.instance.signInWithCredential(credential);
        if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
      },
      verificationFailed: (error) {
        if (!mounted) return;
        setState(() => _loading = false);
        showAppError(context, error);
      },
      codeSent: (verificationId, resendToken) {
        if (!mounted) return;
        setState(() {
          _verificationId = verificationId;
          _resendToken = resendToken;
          _loading = false;
        });
        _startTimer();
      },
      codeAutoRetrievalTimeout: (verificationId) {
        _verificationId = verificationId;
        if (mounted) setState(() => _loading = false);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final pinTheme = PinTheme(
      width: 48.w,
      height: 56.h,
      textStyle: TextStyle(
        color: context.txtPri,
        fontSize: 22.sp,
        fontWeight: FontWeight.w700,
      ),
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
            Icon(Icons.sms_outlined, color: kCyan, size: 54.w),
            SizedBox(height: 18.h),
            Text('Enter SMS code',
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 28.sp,
                    fontWeight: FontWeight.w800)),
            SizedBox(height: 10.h),
            Text('We sent a 6-digit code to ${widget.phone}',
                textAlign: TextAlign.center,
                style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
            SizedBox(height: 34.h),
            FittedBox(
              child: Pinput(
                controller: _code,
                length: 6,
                autofocus: true,
                defaultPinTheme: pinTheme,
                focusedPinTheme: pinTheme.copyWith(
                  decoration: pinTheme.decoration?.copyWith(
                    border: Border.all(color: kCyan, width: 2),
                  ),
                ),
                onCompleted: (_) => _verify(),
              ),
            ),
            SizedBox(height: 28.h),
            GaButton.primary(
              label: 'Verify and sign in',
              isLoading: _loading,
              onPressed: _verify,
            ),
            SizedBox(height: 12.h),
            TextButton(
              onPressed: _seconds == 0 ? _resend : null,
              child: Text(_seconds == 0
                  ? 'Resend SMS code'
                  : 'Resend in $_seconds seconds'),
            ),
          ]),
        ),
      ),
    );
  }
}
