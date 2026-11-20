import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendReset() async {
    if (_emailCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(
        email: _emailCtrl.text.trim(),
      );
      if (mounted) setState(() => _sent = true);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Failed to send reset link'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthBackground(
      type: AuthBackgroundType.dottedCircuit,
      opacity: 0.5,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 32.h),

                // ── Hero: avatar + title + subtitle ──────────
                Center(
                  child: Container(
                    width: 80.w,
                    height: 80.w,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16.r),
                      border: Border.all(color: context.border, width: 1),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16.r),
                      child: Image.asset(
                        'assets/auth/forgot_avatar.png',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: context.isDark ? kBgDeep : kLightBg,
                          child: Center(
                            child: Text('G',
                                style: TextStyle(
                                    color: kCyan,
                                    fontSize: 40.sp,
                                    fontWeight: FontWeight.w900)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 8.h),
                Center(
                  child: Text('Forgot Password',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 32.sp,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.8)),
                ),
                SizedBox(height: 8.h),
                Center(
                  child: Text(
                    'Enter your email to receive a reset link.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400),
                  ),
                ),
                SizedBox(height: 40.h),

                if (!_sent) ...[
                  // ── Form ──────────────────────────────────
                  GaInput(
                    controller: _emailCtrl,
                    labelText: 'ACCOUNT IDENTIFIER',
                    hintText: 'e.g. name@example.com',
                    keyboardType: TextInputType.emailAddress,
                  ),
                  SizedBox(height: 24.h),

                  // ── Send button ───────────────────────────
                  GaButton.primary(
                    label: 'Send Reset Link',
                    isLoading: _loading,
                    onPressed: _sendReset,
                    trailing: SvgPicture.asset(
                      'assets/icons/forgot_send.svg',
                      width: 19.w,
                      height: 16.h,
                    ),
                  ),
                ] else ...[
                  // ── Success state ──────────────────────────
                  SizedBox(height: 48.h),
                  Center(
                    child: Container(
                      width: 80.w,
                      height: 80.w,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.mark_email_read_outlined,
                          color: const Color(0xFF22C55E), size: 40.w),
                    ),
                  ),
                  SizedBox(height: 24.h),
                  Center(
                    child: Text('Check Your Email',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      "We've sent a password reset link to\n${_emailCtrl.text.trim()}",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: context.txtSec, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 28.h),
                  GaButton.primary(
                    label: 'Back to Login',
                    onPressed: () => Navigator.pop(context),
                  ),
                  SizedBox(height: 16.h),
                  Center(
                    child: GaButton.text(
                      label: "Didn't receive it? Resend",
                      onPressed: () => setState(() => _sent = false),
                    ),
                  ),
                ],

                SizedBox(height: 265.h),

                // ── Return to Login link ────────────────────
                Center(
                  child: GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset(
                          'assets/icons/forgot_back_chevron.svg',
                          width: 6.87.w,
                          height: 11.67.h,
                        ),
                        SizedBox(width: 12.w),
                        Text('Return to Login',
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 32.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
