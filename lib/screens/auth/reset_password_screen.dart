import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

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
    return Theme(
      data: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: kLightBg,
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: kLightCard,
          hintStyle: TextStyle(color: kLightSub, fontSize: 14.sp),
          prefixIconColor: kLightSub,
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
            borderSide: const BorderSide(color: kCyan, width: 1.5),
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: kLightBg,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back button
                Padding(
                  padding: EdgeInsets.only(top: 12.h),
                  child: GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Container(
                      width: 40.w,
                      height: 40.w,
                      decoration: BoxDecoration(
                        color: kLightCard,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Icon(Icons.close_rounded,
                          color: Color(0xFFF1F5F9), size: 20.w),
                    ),
                  ),
                ),
                SizedBox(height: 32.h),

                // Logo
                Center(
                  child: Text('G⚡',
                      style: TextStyle(fontSize: 36.sp, color: kLightText)),
                ),
                SizedBox(height: 24.h),

                if (!_reset) ...[
                  Center(
                    child: Text('Reset Password',
                        style: TextStyle(
                            color: kLightText,
                            fontSize: 24.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      'Create a new password for your account.\nMake sure it\'s at least 6 characters.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kLightSub, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 36.h),

                  // New password
                  Text('New Password',
                      style: TextStyle(
                          color: kLightText,
                          fontWeight: FontWeight.w600,
                          fontSize: 14.sp)),
                  SizedBox(height: 8.h),
                  TextField(
                    controller: _newPassCtrl,
                    obscureText: _obscureNew,
                    style: TextStyle(color: kLightText, fontSize: 15.sp),
                    decoration: InputDecoration(
                      hintText: 'Enter new password',
                      hintStyle: TextStyle(color: kLightSub, fontSize: 14.sp),
                      prefixIcon: Icon(Icons.lock_outline,
                          color: kLightSub, size: 20.w),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureNew
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          color: kLightSub,
                        ),
                        onPressed: () =>
                            setState(() => _obscureNew = !_obscureNew),
                      ),
                      filled: true,
                      fillColor: kLightCard,
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
                        borderSide: const BorderSide(color: kCyan, width: 1.5),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 16.w, vertical: 14.h),
                    ),
                  ),
                  SizedBox(height: 20.h),

                  // Confirm password
                  Text('Confirm Password',
                      style: TextStyle(
                          color: kLightText,
                          fontWeight: FontWeight.w600,
                          fontSize: 14.sp)),
                  SizedBox(height: 8.h),
                  TextField(
                    controller: _confirmPassCtrl,
                    obscureText: _obscureConfirm,
                    style: TextStyle(color: kLightText, fontSize: 15.sp),
                    decoration: InputDecoration(
                      hintText: 'Re-enter new password',
                      hintStyle: TextStyle(color: kLightSub, fontSize: 14.sp),
                      prefixIcon: Icon(Icons.lock_outline,
                          color: kLightSub, size: 20.w),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscureConfirm
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          color: kLightSub,
                        ),
                        onPressed: () =>
                            setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                      filled: true,
                      fillColor: kLightCard,
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
                        borderSide: const BorderSide(color: kCyan, width: 1.5),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 16.w, vertical: 14.h),
                    ),
                  ),
                  SizedBox(height: 28.h),

                  // Reset button
                  SizedBox(
                    width: double.infinity,
                    height: 54.h,
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
                          : Text('Reset Password',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16.sp)),
                    ),
                  ),
                ] else ...[
                  // Success state
                  SizedBox(height: 48.h),
                  Center(
                    child: Container(
                      width: 80.w,
                      height: 80.w,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E).withOpacity(0.12),
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
                            color: kLightText,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      'Your password has been updated successfully.\nYou can now log in with your new password.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kLightSub, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 28.h),
                  SizedBox(
                    width: double.infinity,
                    height: 54.h,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.popUntil(context, (route) => route.isFirst);
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
