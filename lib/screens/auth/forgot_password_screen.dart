import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

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

                if (!_sent) ...[
                  // Title
                  Center(
                    child: Text('Forgot Password?',
                        style: TextStyle(
                            color: kLightText,
                            fontSize: 24.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      "No worries! Enter your email address and\nwe'll send you a link to reset your password.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kLightSub, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 36.h),

                  // Email
                  Text('Email Address',
                      style: TextStyle(
                          color: kLightText,
                          fontWeight: FontWeight.w600,
                          fontSize: 14.sp)),
                  SizedBox(height: 8.h),
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    style: TextStyle(color: kLightText, fontSize: 15.sp),
                    decoration: InputDecoration(
                      hintText: 'e.g. name@example.com',
                      hintStyle: TextStyle(color: kLightSub, fontSize: 14.sp),
                      prefixIcon:
                          Icon(Icons.email_outlined, color: kLightSub, size: 20.w),
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
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
                    ),
                  ),
                  SizedBox(height: 28.h),

                  // Send button
                  SizedBox(
                    width: double.infinity,
                    height: 54.h,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _sendReset,
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
                          : Text('Send Reset Link',
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
                      child: Icon(Icons.mark_email_read_outlined,
                          color: Color(0xFF22C55E), size: 40.w),
                    ),
                  ),
                  SizedBox(height: 24.h),
                  Center(
                    child: Text('Check Your Email',
                        style: TextStyle(
                            color: kLightText,
                            fontSize: 22.sp,
                            fontWeight: FontWeight.w800)),
                  ),
                  SizedBox(height: 8.h),
                  Center(
                    child: Text(
                      "We've sent a password reset link to\n${_emailCtrl.text.trim()}",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kLightSub, fontSize: 14.sp),
                    ),
                  ),
                  SizedBox(height: 28.h),
                  SizedBox(
                    width: double.infinity,
                    height: 54.h,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
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
                  SizedBox(height: 16.h),
                  Center(
                    child: TextButton(
                      onPressed: () => setState(() => _sent = false),
                      child: Text('Didn\'t receive it? Resend',
                          style: TextStyle(color: kCyan, fontSize: 14.sp)),
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
