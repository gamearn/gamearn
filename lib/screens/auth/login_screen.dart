import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;

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
    return AuthBackground(
      type: AuthBackgroundType.hexNetwork,
      opacity: 0.8,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          children: [
            SafeArea(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 16.h),

                    // ── GAMEARN wordmark ─────────────────────
                    Center(
                      child: Text('GAMEARN',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 18.sp,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.27)),
                    ),
                    SizedBox(height: 16.h),

                    // ── Hero: avatar + title + subtitle ──────
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
                            'assets/auth/login_avatar.png',
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
                      child: Text('Welcome Back',
                          style: TextStyle(
                              color: Color(0xFFF1F5F9),
                              fontSize: 32.sp,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.8)),
                    ),
                    SizedBox(height: 8.h),
                    Center(
                      child: Text(
                        "Nigeria's premium destination for classic\ngames and rewards",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Color(0x80FFFFFF),
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w400),
                      ),
                    ),
                    SizedBox(height: 24.h),

                    // ── Form ─────────────────────────────────
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24.w),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Email
                          Text('Email Address',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w400,
                                  fontSize: 16.sp)),
                          SizedBox(height: 8.h),
                          TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            style: TextStyle(
                                color: Colors.white, fontSize: 16.sp),
                            decoration: InputDecoration(
                              hintText: 'e.g. name@example.com',
                              hintStyle: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 16.sp),
                              filled: true,
                              fillColor: Color(0x800F172A),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide:
                                    const BorderSide(color: kBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide:
                                    const BorderSide(color: kBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: const BorderSide(
                                    color: kCyan, width: 1.5),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 18.w, vertical: 15.h),
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // Password
                          Text('Password',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w400,
                                  fontSize: 16.sp)),
                          SizedBox(height: 8.h),
                          TextField(
                            controller: _passCtrl,
                            obscureText: _obscure,
                            style: TextStyle(
                                color: Colors.white, fontSize: 16.sp),
                            decoration: InputDecoration(
                              hintText: 'Enter your password',
                              hintStyle: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 16.sp),
                              suffixIcon: IconButton(
                                icon: SvgPicture.asset(
                                  'assets/icons/login_eye.svg',
                                  width: 22.w,
                                  height: 15.h,
                                  colorFilter: ColorFilter.mode(
                                      Color(0xFF64748B),
                                      BlendMode.srcIn),
                                ),
                                onPressed: () => setState(
                                    () => _obscure = !_obscure),
                              ),
                              filled: true,
                              fillColor: Color(0x800F172A),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide:
                                    const BorderSide(color: kBorder),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide:
                                    const BorderSide(color: kBorder),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12.r),
                                borderSide: const BorderSide(
                                    color: kCyan, width: 1.5),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 14.w, vertical: 19.h),
                            ),
                          ),

                          // Forgot Password?
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
                                    borderRadius:
                                        BorderRadius.circular(12.r)),
                              ),
                              child: _loading
                                  ? SizedBox(
                                      width: 22.w,
                                      height: 22.w,
                                      child:
                                          const CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2))
                                  : Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text('Login to Gamearn',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 18.sp,
                                                fontWeight:
                                                    FontWeight.w700,
                                                letterSpacing: -0.27)),
                                        SizedBox(width: 8.w),
                                        SvgPicture.asset(
                                          'assets/icons/login_arrow.svg',
                                          width: 18.w,
                                          height: 18.w,
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // OR divider
                          Row(children: [
                            const Expanded(
                                child: Divider(
                                    color: kBorder, height: 1)),
                            Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 16.w),
                              child: Text('OR',
                                  style: TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 12.sp,
                                      fontWeight: FontWeight.w500)),
                            ),
                            const Expanded(
                                child: Divider(
                                    color: kBorder, height: 1)),
                          ]),
                          SizedBox(height: 16.h),

                          // Create New Account
                          SizedBox(
                            width: double.infinity,
                            height: 48.h,
                            child: OutlinedButton(
                              onPressed: () {
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const RegisterScreen()),
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                    color: Color(0xFF334155)),
                                shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(12.r)),
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
                            padding: EdgeInsets.fromLTRB(
                                25.w, 25.h, 25.w, 18.h),
                            decoration: BoxDecoration(
                              color: Color(0x80161B30),
                              borderRadius:
                                  BorderRadius.circular(16.r),
                              border: Border.all(color: kBorder),
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                // Dots + Tutorial
                                Row(children: [
                                  Container(
                                    width: 24.w,
                                    height: 6.h,
                                    decoration: BoxDecoration(
                                      color: kOrange,
                                      borderRadius:
                                          BorderRadius.circular(
                                              9999.r),
                                    ),
                                  ),
                                  SizedBox(width: 6.w),
                                  _Dot(
                                      color: const Color(
                                          0xFF334155)),
                                  SizedBox(width: 6.w),
                                  _Dot(
                                      color: const Color(
                                          0xFF334155)),
                                  const Spacer(),
                                  Text('Tutorial',
                                      style: TextStyle(
                                          color: kCyan,
                                          fontSize: 12.sp,
                                          fontWeight:
                                              FontWeight.w500)),
                                ]),
                                SizedBox(height: 28.h),
                                Row(children: [
                                  Expanded(
                                    child: _TutorialItem(
                                      asset:
                                          'assets/icons/tutorial_play.svg',
                                      label: 'Play',
                                      sub: 'Ludo, Ayo & more',
                                      color: kCyan,
                                    ),
                                  ),
                                  Expanded(
                                    child: _TutorialItem(
                                      asset:
                                          'assets/icons/tutorial_earn.svg',
                                      label: 'Earn',
                                      sub: 'Win daily rewards',
                                      color: kOrange,
                                    ),
                                  ),
                                  Expanded(
                                    child: _TutorialItem(
                                      asset:
                                          'assets/icons/tutorial_wallet.svg',
                                      label: 'Wallet',
                                      sub: 'Instant withdrawal',
                                      color: kGreen,
                                    ),
                                  ),
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

            // ── Back button (top-left) ──────────────────────
            Positioned(
              top: 54.h,
              left: 8.w,
              child: GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: SvgPicture.asset(
                  'assets/icons/login_back.svg',
                  width: 48.w,
                  height: 39.h,
                ),
              ),
            ),
          ],
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
      width: 6.w,
      height: 6.w,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(9999.r),
      ),
    );
  }
}

class _TutorialItem extends StatelessWidget {
  final String asset;
  final String label;
  final String sub;
  final Color color;
  const _TutorialItem(
      {required this.asset,
      required this.label,
      required this.sub,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 40.w,
          height: 40.w,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: SvgPicture.asset(
              asset,
              width: 17.w,
              height: 17.w,
            ),
          ),
        ),
        SizedBox(height: 6.h),
        Text(label,
            style: TextStyle(
                color: Color(0xFFCBD5E1),
                fontSize: 10.sp,
                fontWeight: FontWeight.w400)),
        Text(sub,
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 10.sp,
                fontWeight: FontWeight.w400)),
      ],
    );
  }
}
