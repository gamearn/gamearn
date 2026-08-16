import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'login_screen.dart';
import 'otp_screen.dart';
import 'email_verify_screen.dart';

// ════════════════════════════════════════════════════════════════
//  REGISTER SCREEN — Figma matched (1052:381 "GAMEARN User
//  Registration", 390×994)
//
//  bg #0B0E1A · back btn 48×39 r9999 · "Create Account" fs18
//  #F1F5F9 w700 · hero: icon 80×80 r16, "Join GAMEARN" fs32 w700,
//  "Experience premium Nigerian gaming and earn rewards" fs16
//  white@0.5 · inputs 342×56 #0F172A@0.5 stroke #1E293B r12 (label
//  fs16 white, hint fs16 white@0.4, prefix icon white@0.6) · phone
//  has +234 box 63×56 + input 271×56 · password lock + eye ·
//  T&C checkbox 24×24 stroke white@0.5 · CTA 342×56 #FF5E00 r12 ·
//  "Already have an account? Login" fs12
//  Behavior: phone filled → OTP flow, else email-verify flow.
// ════════════════════════════════════════════════════════════════

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _loading    = false;
  bool _obscure    = true;
  bool _agreed     = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  String _formatNigerianNumber(String raw) {
    raw = raw.replaceAll(RegExp(r'\s+'), '');
    if (raw.startsWith('0')) return '+234${raw.substring(1)}';
    if (raw.startsWith('+234')) return raw;
    return '+234$raw';
  }

  Future<void> _register() async {
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please agree to the Terms of Service'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;
    final name = _nameCtrl.text.trim();
    final phoneRaw = _phoneCtrl.text.trim();

    if (email.isEmpty || password.isEmpty || name.isEmpty ||
        phoneRaw.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all fields'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _loading = true);

    // ── Email + password flow: verify email via Firebase link ──
    if (phoneRaw.length < 10) {
      try {
        await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
        await FirebaseAuth.instance.currentUser?.updateDisplayName(name);
        await FirebaseAuth.instance.currentUser?.sendEmailVerification(
          ActionCodeSettings(
            url: 'https://gamearn-app.web.app/verify',
            handleCodeInApp: true,
            androidPackageName: 'com.gamearn',
          ),
        );
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => EmailVerifyScreen(email: email, name: name),
          ),
        );
      } on FirebaseAuthException catch (e) {
        if (!mounted) return;
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.message ?? 'Registration failed'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      }
      return;
    }

    // ── Phone flow: SMS OTP via Firebase ──
    final formattedPhone = _formatNigerianNumber(phoneRaw);

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: formattedPhone,
      verificationCompleted: (PhoneAuthCredential credential) async {
        try {
          final userCred =
              await FirebaseAuth.instance.signInWithCredential(credential);
          if (userCred.user != null) {
            await userCred.user!.updateEmail(email);
            await userCred.user!.updatePassword(password);
          }
        } catch (e) {
          debugPrint('Auto verification failed: $e');
        }
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!mounted) return;
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.message ?? 'Phone verification failed'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!mounted) return;
        setState(() => _loading = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => OtpScreen(
              verificationId: verificationId,
              email: email,
              password: password,
              phone: formattedPhone,
              name: name,
            ),
          ),
        );
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        if (mounted) setState(() => _loading = false);
      },
      timeout: const Duration(seconds: 60),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Top bar: back + title ─────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(16.w, 8.h, 16.w, 0),
                child: Row(children: [
                  GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Container(
                      width: 48.w, height: 39.h,
                      decoration: const BoxDecoration(
                        color: Colors.transparent,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.close_rounded,
                          color: Color(0xFFF1F5F9), size: 20.w),
                    ),
                  ),
                  Expanded(
                    child: Center(
                      child: Text('Create Account',
                          style: TextStyle(
                              color: Color(0xFFF1F5F9),
                              fontSize: 18.sp, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  SizedBox(width: 48.w),
                ]),
              ),
              SizedBox(height: 8.h),

              // ── Hero ──────────────────────────────────────────────
              Center(
                child: Container(
                  width: 80.w, height: 80.w,
                  decoration: BoxDecoration(
                    color: kBgDeep,
                    borderRadius: BorderRadius.circular(16.r),
                    border: Border.all(color: Colors.white, width: 1),
                  ),
                  child: Center(
                    child: Text('G',
                        style: TextStyle(
                            color: kCyan,
                            fontSize: 40.sp,
                            fontWeight: FontWeight.w900)),
                  ),
                ),
              ),
              SizedBox(height: 8.h),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Text('Join GAMEARN',
                    style: TextStyle(
                        color: Color(0xFFF1F5F9),
                        fontSize: 32.sp, fontWeight: FontWeight.w700)),
              ),
              SizedBox(height: 8.h),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Text('Experience premium Nigerian gaming\nand earn rewards',
                    style: TextStyle(
                        color: Color(0x80FFFFFF),
                        fontSize: 16.sp, fontWeight: FontWeight.w400)),
              ),
              SizedBox(height: 28.h),

              // ── Form ──────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Label('Full Name'),
                    _Field(
                        controller: _nameCtrl,
                        hint: 'e.g. Chinelo Adebayo',
                        icon: Icons.person_outline),
                    SizedBox(height: 16.h),

                    _Label('Email Address'),
                    _Field(
                        controller: _emailCtrl,
                        hint: 'name@example.com',
                        icon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress),
                    SizedBox(height: 16.h),

                    _Label('Phone Number'),
                    Row(children: [
                      Container(
                        width: 63.w, height: 56.h,
                        decoration: BoxDecoration(
                          color: const Color(0x800F172A),
                          borderRadius: BorderRadius.circular(12.r),
                          border: Border.all(color: kBorder),
                        ),
                        alignment: Alignment.center,
                        child: Text('+234',
                            style: TextStyle(
                                color: Color(0xFFCBD5E1), fontSize: 16.sp)),
                      ),
                      SizedBox(width: 8.w),
                      Expanded(
                        child: _Field(
                            controller: _phoneCtrl,
                            hint: '801 234 5678',
                            icon: null,
                            keyboardType: TextInputType.phone),
                      ),
                    ]),
                    SizedBox(height: 16.h),

                    _Label('Password'),
                    TextField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      style: TextStyle(
                          color: Colors.white, fontSize: 16.sp),
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        hintStyle:
                            TextStyle(color: Color(0xFF475569), fontSize: 16.sp),
                        prefixIcon: Padding(
                          padding: EdgeInsets.all(15.r),
                          child: Icon(Icons.lock_outline,
                              color: Color(0xFF64748B), size: 18.w),
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                              _obscure
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: const Color(0xFF64748B)),
                          onPressed: () =>
                              setState(() => _obscure = !_obscure),
                        ),
                        filled: true,
                        fillColor: const Color(0x800F172A),
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
                            horizontal: 16.w, vertical: 18.h),
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // T&C checkbox
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        GestureDetector(
                          onTap: () =>
                              setState(() => _agreed = !_agreed),
                          child: Container(
                            width: 24.w, height: 24.w,
                            decoration: BoxDecoration(
                              color: _agreed ? kOrange : kBgDeep,
                              borderRadius: BorderRadius.circular(4.r),
                              border: Border.all(
                                  color: _agreed
                                      ? kOrange
                                      : const Color(0x80FFFFFF)),
                            ),
                            child: _agreed
                                ? Icon(Icons.check_rounded,
                                    color: Colors.white, size: 16.w)
                                : null,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(top: 4.h),
                            child: Text(
                              'By creating an account, you agree to our Terms of\nService and Privacy Policy.',
                              style: TextStyle(
                                  color: kTextSec,
                                  fontSize: 12.sp,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 28.h),

                    // Create Account button
                    SizedBox(
                      width: double.infinity,
                      height: 56.h,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _register,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kOrange,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r)),
                        ),
                        child: _loading
                            ? SizedBox(
                                width: 22.w, height: 22.w,
                                child: const CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Create Account',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16.sp)),
                                  SizedBox(width: 8.w),
                                  Icon(Icons.arrow_forward_rounded,
                                      color: Colors.white, size: 20.w),
                                ],
                              ),
                      ),
                    ),
                    SizedBox(height: 16.h),

                    // Already have account
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.pushReplacement(context,
                            MaterialPageRoute(
                                builder: (_) => const LoginScreen())),
                        child: Text.rich(TextSpan(
                          text: 'Already have an account? ',
                          style: TextStyle(
                              color: kTextSec, fontSize: 12.sp),
                          children: [
                            TextSpan(
                                text: 'Login',
                                style: TextStyle(
                                    color: context.cyan,
                                    fontWeight: FontWeight.w700)),
                          ],
                        )),
                      ),
                    ),
                    SizedBox(height: 32.h),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.h),
      child: Text(text,
          style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w400,
              fontSize: 16.sp)),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData? icon;
  final TextInputType? keyboardType;

  const _Field(
      {required this.controller,
      required this.hint,
      required this.icon,
      this.keyboardType});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: TextStyle(color: Colors.white, fontSize: 16.sp),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
            color: Color(0x66FFFFFF), fontSize: 16.sp),
        prefixIcon: icon != null
            ? Padding(
                padding: EdgeInsets.all(15.r),
                child: Icon(icon,
                    color: const Color(0x99FFFFFF), size: 18.w),
              )
            : null,
        filled: true,
        fillColor: const Color(0x800F172A),
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
            EdgeInsets.symmetric(horizontal: 16.w, vertical: 18.h),
      ),
    );
  }
}
