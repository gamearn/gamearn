import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pinput/pinput.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';

// ════════════════════════════════════════════════════════════════
//  OTP SCREEN — Figma matched (1172:10 "OTP Verification", 390×844)
//
//  bg #0B0E1A + dotted/circuit PNG 50% opacity · back btn 48×39
//  r9999 · hero: envelope in orange@0.1 circle 80, "OTP
//  Verification" fs32 #F1F5F9 w700, "Enter the code sent to your
//  email..." fs16 #94A3B8 · pin boxes 48×56 #1A2238 stroke
//  #1E293B (focused kCyan + blue shadow) r12 · countdown pill
//  107×38 #1A2238@0.5 stroke #1E293B r9999 (timer icon 12
//  #64748B + 01:59 fs14 w500) · "Didn't receive the code? "
//  #94A3B8 fs14 + Resend Code #FF5E00 w700 fs14 · CTA 342×56
//  #FF5E00 r12 "Verify & Continue" fs16 w700 + arrow ·
//  "Secured by Gamearn Shield" fs12 #475569 uppercase
//  letterSpacing 1.2
//
//  Note: design shows 4 boxes but Firebase SMS OTP is 6 digits,
//  so 6 boxes are kept (design is a visual mock).
// ════════════════════════════════════════════════════════════════

class OtpScreen extends StatefulWidget {
  final String verificationId;
  final String email;
  final String password;
  final String phone;
  final String name;

  const OtpScreen({
    super.key,
    required this.verificationId,
    required this.email,
    required this.password,
    required this.phone,
    required this.name,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();

  late String _currentVerificationId;
  int _secondsLeft = 60;
  Timer? _timer;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _currentVerificationId = widget.verificationId;
    _startTimer();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _focusNode.requestFocus());
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

  @override
  void dispose() {
    _pinController.dispose();
    _focusNode.dispose();
    _timer?.cancel();
    super.dispose();
  }

  String get _minutes => (_secondsLeft ~/ 60).toString().padLeft(2, '0');
  String get _seconds => (_secondsLeft % 60).toString().padLeft(2, '0');

  Future<void> _resendCode() async {
    if (_secondsLeft > 0) return;
    setState(() => _loading = true);

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: widget.phone,
      verificationCompleted: (PhoneAuthCredential credential) {},
      verificationFailed: (FirebaseAuthException e) {
        if (!mounted) return;
        setState(() => _loading = false);
        showAppError(context, e);
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _currentVerificationId = verificationId;
        });
        _startTimer();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Verification code resent!'),
          backgroundColor: kCyan,
          behavior: SnackBarBehavior.floating,
        ));
      },
      codeAutoRetrievalTimeout: (_) {},
      timeout: const Duration(seconds: 60),
    );
  }

  Future<void> _verify(String pin) async {
    if (pin.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Enter the full 6-digit code'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _loading = true);

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _currentVerificationId,
        smsCode: pin,
      );

      final userCred =
          await FirebaseAuth.instance.signInWithCredential(credential);

      if (userCred.user != null) {
        try {
          final emailCred = EmailAuthProvider.credential(
            email: widget.email,
            password: widget.password,
          );
          await userCred.user!.linkWithCredential(emailCred);
        } catch (e) {
          debugPrint('Failed to link email/password: $e');
        }
      }

      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showAppError(context, e);
        _pinController.clear();
        _focusNode.requestFocus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 48.w,
      height: 56.h,
      textStyle: TextStyle(
        fontSize: 24.sp,
        color: kTextPri,
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: kOtpBox,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: kBorder, width: 2),
      ),
    );

    return AuthBackground(
      type: AuthBackgroundType.dottedCircuit,
      opacity: 0.5,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // ── Top bar: back ─────────────────────────────
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: SvgPicture.asset(
                      'assets/icons/otp_back.svg',
                      width: 48.w,
                      height: 39.h,
                    ),
                  ),
                ),
                SizedBox(height: 24.h),

                // ── Hero ──────────────────────────────────────
                Container(
                  width: 80.w,
                  height: 80.w,
                  decoration: BoxDecoration(
                    color: kOrange.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: SvgPicture.asset(
                    'assets/icons/otp_envelope.svg',
                    width: 32.w,
                    height: 27.h,
                  ),
                ),
                SizedBox(height: 16.h),
                Text('OTP Verification',
                    style: TextStyle(
                        color: Color(0xFFF1F5F9),
                        fontSize: 32.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.8)),
                SizedBox(height: 16.h),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8.w),
                  child: Text(
                    'Enter the code sent to your email to\ncontinue your gaming journey.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400,
                        height: 1.625),
                  ),
                ),
                const Spacer(),

                // ── PIN boxes ─────────────────────────────────
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Pinput(
                    length: 6,
                    controller: _pinController,
                    focusNode: _focusNode,
                    separatorBuilder: (_) => SizedBox(width: 12.w),
                    defaultPinTheme: defaultPinTheme,
                    focusedPinTheme: defaultPinTheme.copyWith(
                      decoration: defaultPinTheme.decoration!.copyWith(
                        border: Border.all(color: kCyan, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFF2563EB).withOpacity(0.3),
                            blurRadius: 0,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                    ),
                    onCompleted: _verify,
                  ),
                ),
                SizedBox(height: 28.h),

                // ── Countdown pill ────────────────────────────
                Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 21.w, vertical: 9.h),
                  decoration: BoxDecoration(
                    color: Color(0x801A2238),
                    borderRadius: BorderRadius.circular(9999.r),
                    border: Border.all(color: kBorder),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SvgPicture.asset(
                        'assets/icons/otp_clock.svg',
                        width: 11.67.w,
                        height: 11.67.h,
                      ),
                      SizedBox(width: 12.w),
                      Text.rich(TextSpan(
                        children: [
                          TextSpan(
                            text: _minutes,
                            style: TextStyle(
                                color: Color(0xFFF1F5F9),
                                fontWeight: FontWeight.w500,
                                fontSize: 14.sp),
                          ),
                          TextSpan(
                            text: ':',
                            style: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontWeight: FontWeight.w500,
                                fontSize: 14.sp),
                          ),
                          TextSpan(
                            text: _seconds,
                            style: TextStyle(
                                color: Color(0xFFF1F5F9),
                                fontWeight: FontWeight.w500,
                                fontSize: 14.sp),
                          ),
                        ],
                      )),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // ── Resend ────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Didn't receive the code? ",
                        style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w400)),
                    GaButton.text(
                      label: 'Resend Code',
                      onPressed: _secondsLeft == 0 ? _resendCode : null,
                    ),
                  ],
                ),
                const Spacer(),

                // ── Verify button ─────────────────────────────
                GaButton.primary(
                  label: 'Verify & Continue',
                  isLoading: _loading,
                  onPressed: () => _verify(_pinController.text),
                  trailing: SvgPicture.asset(
                    'assets/icons/otp_verify_arrow.svg',
                    width: 16.w,
                    height: 16.h,
                  ),
                ),
                SizedBox(height: 16.h),
                Text('Secured by Gamearn Shield',
                    style: TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w400,
                        letterSpacing: 1.2)),
                SizedBox(height: 24.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
