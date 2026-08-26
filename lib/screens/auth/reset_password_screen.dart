import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _loading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _reset = false;

  @override
  void dispose() {
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    final newPass = _newPassCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (newPass.isEmpty || confirm.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill in both fields'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    if (newPass != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Passwords do not match'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    if (newPass.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Password must be at least 6 characters'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _loading = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await user.updatePassword(newPass);
      }
      if (mounted) setState(() => _reset = true);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Failed to reset password'),
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
                        'assets/auth/reset_avatar.png',
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
                  child: Text('Reset Password',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 32.sp,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.8)),
                ),
                SizedBox(height: 8.h),
                Center(
                  child: Text(
                    'Create a new, strong password for your account.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400),
                  ),
                ),
                SizedBox(height: 24.h),

                if (!_reset) ...[
                  // ── New Password ──────────────────────────
                  GaInput(
                    controller: _newPassCtrl,
                    labelText: 'New Password',
                    hintText: 'Enter new password',
                    obscureText: _obscureNew,
                    suffix: IconButton(
                      icon: SvgPicture.asset(
                        'assets/icons/reset_eye.svg',
                        width: 22.w,
                        height: 15.h,
                        colorFilter: ColorFilter.mode(
                            context.txtSec, BlendMode.srcIn),
                      ),
                      onPressed: () =>
                          setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                  SizedBox(height: 16.h),

                  // ── Confirm New Password ──────────────────
                  GaInput(
                    controller: _confirmPassCtrl,
                    labelText: 'Confirm New Password',
                    hintText: 'Confirm your password',
                    obscureText: _obscureConfirm,
                    suffix: IconButton(
                      icon: SvgPicture.asset(
                        'assets/icons/reset_eye.svg',
                        width: 22.w,
                        height: 15.h,
                        colorFilter: ColorFilter.mode(
                            context.txtSec, BlendMode.srcIn),
                      ),
                      onPressed: () => setState(
                          () => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  SizedBox(height: 28.h),

                  // ── Update Password button ────────────────
                  GaButton.primary(
                    label: 'Update Password',
                    isLoading: _loading,
                    onPressed: _resetPassword,
                  ),
                  SizedBox(height: 16.h),
                  Center(
                    child: Text(
                      'Password must be at least 8 characters and include a\nnumber and symbol.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w400,
                          height: 1.428),
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
                      child: Icon(Icons.check_circle_outline,
                          color: const Color(0xFF22C55E), size: 40.w),
                    ),
                  ),
                  SizedBox(height: 24.h),
                  Center(
                    child: Text('Password Reset!',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      'Your password has been updated successfully.\nYou can now log in with your new password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: context.txtSec, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 28.h),
                  GaButton.primary(
                    label: 'Back to Login',
                    onPressed: () {
                      Navigator.popUntil(
                          context, (route) => route.isFirst);
                    },
                  ),
                ],

                SizedBox(height: 32.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
