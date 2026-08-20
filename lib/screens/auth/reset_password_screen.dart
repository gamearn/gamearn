import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';

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
                      border: Border.all(color: Colors.white, width: 1),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16.r),
                      child: Image.asset(
                        'assets/auth/reset_avatar.png',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: kBgDeep,
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
                          color: Color(0xFFF1F5F9),
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
                        color: Color(0x80FFFFFF),
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w400),
                  ),
                ),
                SizedBox(height: 24.h),

                if (!_reset) ...[
                  // ── New Password ──────────────────────────
                  Text('New Password',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w400,
                          fontSize: 16.sp)),
                  SizedBox(height: 8.h),
                  TextField(
                    controller: _newPassCtrl,
                    obscureText: _obscureNew,
                    style: TextStyle(color: Colors.white, fontSize: 16.sp),
                    decoration: InputDecoration(
                      hintText: 'Enter new password',
                      hintStyle: TextStyle(
                          color: Color(0xFF64748B), fontSize: 16.sp),
                      suffixIcon: IconButton(
                        icon: SvgPicture.asset(
                          _obscureNew
                              ? 'assets/icons/reset_eye.svg'
                              : 'assets/icons/reset_eye.svg',
                          width: 22.w,
                          height: 15.h,
                          colorFilter: ColorFilter.mode(
                              Color(0xFF64748B), BlendMode.srcIn),
                        ),
                        onPressed: () =>
                            setState(() => _obscureNew = !_obscureNew),
                      ),
                      filled: true,
                      fillColor: Color(0x800F172A),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide:
                            const BorderSide(color: kCyan, width: 1.5),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 14.w, vertical: 19.h),
                    ),
                  ),
                  SizedBox(height: 16.h),

                  // ── Confirm New Password ──────────────────
                  Text('Confirm New Password',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w400,
                          fontSize: 16.sp)),
                  SizedBox(height: 8.h),
                  TextField(
                    controller: _confirmPassCtrl,
                    obscureText: _obscureConfirm,
                    style: TextStyle(color: Colors.white, fontSize: 16.sp),
                    decoration: InputDecoration(
                      hintText: 'Confirm your password',
                      hintStyle: TextStyle(
                          color: Color(0xFF64748B), fontSize: 16.sp),
                      suffixIcon: IconButton(
                        icon: SvgPicture.asset(
                          'assets/icons/reset_eye.svg',
                          width: 22.w,
                          height: 15.h,
                          colorFilter: ColorFilter.mode(
                              Color(0xFF64748B), BlendMode.srcIn),
                        ),
                        onPressed: () => setState(
                            () => _obscureConfirm = !_obscureConfirm),
                      ),
                      filled: true,
                      fillColor: Color(0x800F172A),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide: const BorderSide(color: kBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12.r),
                        borderSide:
                            const BorderSide(color: kCyan, width: 1.5),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 14.w, vertical: 19.h),
                    ),
                  ),
                  SizedBox(height: 28.h),

                  // ── Update Password button ────────────────
                  SizedBox(
                    width: double.infinity,
                    height: 56.h,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _resetPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kOrange,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: _loading
                          ? SizedBox(
                              width: 22.w,
                              height: 22.w,
                              child: const CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : Text('Update Password',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 18.sp,
                                  letterSpacing: -0.27)),
                    ),
                  ),
                  SizedBox(height: 16.h),
                  Center(
                    child: Text(
                      'Password must be at least 8 characters and include a\nnumber and symbol.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Color(0xFF64748B),
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
                        color: Color(0xFF22C55E).withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.check_circle_outline,
                          color: Color(0xFF22C55E), size: 40.w),
                    ),
                  ),
                  SizedBox(height: 24.h),
                  Center(
                    child: Text('Password Reset!',
                        style: TextStyle(
                            color: kTextPri,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      'Your password has been updated successfully.\nYou can now log in with your new password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kTextSec, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 28.h),
                  SizedBox(
                    width: double.infinity,
                    height: 54.h,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.popUntil(
                            context, (route) => route.isFirst);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kOrange,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: Text('Back to Login',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 16.sp)),
                    ),
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
