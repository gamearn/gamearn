import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';

// ════════════════════════════════════════════════════════════════
//  LOGIN SCREEN — Figma matched (1078:411 "GAMEARN Login &
//  Onboarding", 390×994)
//
//  bg #0B0E1A · top bar: back 48×39 r9999 + "GAMEARN" fs18 #F1F5F9
//  w700 · hero: icon 80×80 r16, "Welcome Back" fs32 #F1F5F9 w700,
//  "Nigeria's premium destination..." fs16 white@0.5 · inputs 342
//  #0F172A@0.5 stroke #1E293B r12 (label fs16 white, hint fs16
//  #64748B, eye suffix on password) · "Forgot Password?" fs12 kCyan
//  w500 right · CTA 342×56 #FF5E00 r12 "Login to Gamearn" fs18 w700
//  + arrow · OR divider #1E293B / #64748B · "Create New Account"
//  342×48 stroke #334155 r12 fs16 #F1F5F9 · onboarding carousel
//  342×150 #161B30@0.5 stroke #1E293B r16 (dots + Tutorial + Play /
//  Earn / Wallet) · terms fs12 white@0.5
//  Behavior: Firebase email+password sign-in kept; social row not in
//  design so removed.
// ════════════════════════════════════════════════════════════════

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _loading    = false;
  bool _obscure    = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      // AuthGate handles navigation — pop back to the root route so the
      // auth-gated home (profile setup / shell) is what the user sees.
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Login failed'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
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
              // ── Top bar: back + GAMEARN ──────────────────────────
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
                      child: Text('GAMEARN',
                          style: TextStyle(
                              color: Color(0xFFF1F5F9),
                              fontSize: 18.sp, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  SizedBox(width: 48.w),
                ]),
              ),
              SizedBox(height: 16.h),

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
                child: Text('Welcome Back',
                    style: TextStyle(
                        color: Color(0xFFF1F5F9),
                        fontSize: 32.sp, fontWeight: FontWeight.w700)),
              ),
              SizedBox(height: 8.h),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: Text("Nigeria's premium destination for classic\ngames and rewards",
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
                    _Label('Email Address'),
                    _Field(
                        controller: _emailCtrl,
                        hint: 'e.g. name@example.com',
                        keyboardType: TextInputType.emailAddress),
                    SizedBox(height: 20.h),

                    _Label('Password'),
                    TextField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      style: TextStyle(
                          color: Colors.white, fontSize: 16.sp),
                      decoration: InputDecoration(
                        hintText: 'Enter your password',
                        hintStyle: TextStyle(
                            color: Color(0xFF64748B), fontSize: 16.sp),
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

                    // Forgot password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const ForgotPasswordScreen()),
                          );
                        },
                        child: Text('Forgot Password?',
                            style: TextStyle(
                                color: kCyan,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w500)),
                      ),
                    ),
                    SizedBox(height: 8.h),

                    // Login button
                    SizedBox(
                      width: double.infinity,
                      height: 56.h,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _login,
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
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Text('Login to Gamearn',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 18.sp,
                                          fontWeight: FontWeight.w700)),
                                  SizedBox(width: 8.w),
                                  Icon(Icons.arrow_forward_rounded,
                                      color: Colors.white, size: 18.w),
                                ],
                              ),
                      ),
                    ),
                    SizedBox(height: 20.h),

                    // OR divider
                    Row(children: [
                      const Expanded(
                          child: Divider(color: kBorder, height: 1)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12.w),
                        child: Text('OR',
                            style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w500)),
                      ),
                      const Expanded(
                          child: Divider(color: kBorder, height: 1)),
                    ]),
                    SizedBox(height: 20.h),

                    // Create New Account
                    SizedBox(
                      width: double.infinity,
                      height: 48.h,
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const RegisterScreen()),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(
                              color: Color(0xFF334155)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r)),
                        ),
                        child: Text('Create New Account',
                            style: TextStyle(
                                color: Color(0xFFF1F5F9),
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w400)),
                      ),
                    ),
                    SizedBox(height: 24.h),

                    // Onboarding carousel
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.fromLTRB(25.w, 25.h, 25.w, 18.h),
                      decoration: BoxDecoration(
                        color: const Color(0x80161B30),
                        borderRadius: BorderRadius.circular(16.r),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Dots + Tutorial
                          Row(children: [
                            Container(
                              width: 24.w, height: 6.h,
                              decoration: BoxDecoration(
                                color: kOrange,
                                borderRadius: BorderRadius.circular(9999.r),
                              ),
                            ),
                            SizedBox(width: 6.w),
                            _Dot(color: const Color(0xFF334155)),
                            SizedBox(width: 6.w),
                            _Dot(color: const Color(0xFF334155)),
                            const Spacer(),
                            Text('Tutorial',
                                style: TextStyle(
                                    color: kCyan,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500)),
                          ]),
                          SizedBox(height: 28.h),
                          Row(children: [
                            Expanded(
                                child: _TutorialItem(
                                    icon: Icons.play_arrow_rounded,
                                    label: 'Play',
                                    sub: 'Ludo, Ayo & more',
                                    color: kCyan)),
                            Expanded(
                                child: _TutorialItem(
                                    icon: Icons.military_tech_rounded,
                                    label: 'Earn',
                                    sub: 'Win daily rewards',
                                    color: kOrange)),
                            Expanded(
                                child: _TutorialItem(
                                    icon: Icons.account_balance_wallet_outlined,
                                    label: 'Wallet',
                                    sub: 'Instant withdrawal',
                                    color: kGreen)),
                          ]),
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),
                    Center(
                      child: Text(
                        'By continuing, you agree to our Terms & Privacy Policy',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Color(0x80FFFFFF),
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w500),
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

class _Dot extends StatelessWidget {
  final Color color;
  const _Dot({required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 6.w, height: 6.w,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(9999.r),
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
  final TextInputType? keyboardType;

  const _Field(
      {required this.controller,
      required this.hint,
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
            color: Color(0xFF64748B), fontSize: 16.sp),
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

class _TutorialItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final Color color;
  const _TutorialItem(
      {required this.icon,
      required this.label,
      required this.sub,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 40.w, height: 40.w,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 17.w),
        ),
        SizedBox(height: 6.h),
        Text(label,
            style: TextStyle(
                color: Color(0xFFCBD5E1),
                fontSize: 10.sp, fontWeight: FontWeight.w400)),
        Text(sub,
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 10.sp, fontWeight: FontWeight.w400)),
      ],
    );
  }
}
