import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';
import 'login_screen.dart';
import 'otp_screen.dart';
import 'email_verify_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _agreed = false;

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

    if (email.isEmpty ||
        password.isEmpty ||
        name.isEmpty ||
        phoneRaw.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please fill all fields'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _loading = true);

    if (phoneRaw.length < 10) {
      try {
        await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
        await FirebaseAuth.instance.currentUser
            ?.updateDisplayName(name);
        await FirebaseAuth.instance.currentUser
            ?.sendEmailVerification(
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
            builder: (_) =>
                EmailVerifyScreen(email: email, name: name),
          ),
        );
      } on FirebaseAuthException catch (e) {
        if (!mounted) return;
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content:
              Text(e.message ?? 'Registration failed'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      }
      return;
    }

    final formattedPhone = _formatNigerianNumber(phoneRaw);

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: formattedPhone,
      verificationCompleted:
          (PhoneAuthCredential credential) async {
        try {
          final userCred = await FirebaseAuth.instance
              .signInWithCredential(credential);
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
          content: Text(
              e.message ?? 'Phone verification failed'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      },
      codeSent:
          (String verificationId, int? resendToken) {
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
      codeAutoRetrievalTimeout:
          (String verificationId) {
        if (mounted) setState(() => _loading = false);
      },
      timeout: const Duration(seconds: 60),
    );
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
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: 16.h),

                    // ── Top bar: back + "Create Account" ──
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                          16.w, 0, 16.w, 0),
                      child: Row(children: [
                        GestureDetector(
                          onTap: () =>
                              Navigator.maybePop(context),
                          child: SvgPicture.asset(
                            'assets/icons/back_button.svg',
                            width: 48.w,
                            height: 39.h,
                          ),
                        ),
                        Expanded(
                          child: Center(
                            child: Text('Create Account',
                                style: TextStyle(
                                    color:
                                        context.txtPri,
                                    fontSize: 18.sp,
                                    fontWeight:
                                        FontWeight.w700,
                                    letterSpacing:
                                        -0.27)),
                          ),
                        ),
                        SizedBox(width: 48.w),
                      ]),
                    ),
                    SizedBox(height: 8.h),

                    // ── Hero: avatar + title + subtitle ──
                    Center(
                      child: Container(
                        width: 80.w,
                        height: 80.w,
                        decoration: BoxDecoration(
                          borderRadius:
                              BorderRadius.circular(16.r),
                          border: Border.all(
                              color: context.border,
                              width: 1),
                        ),
                        child: ClipRRect(
                          borderRadius:
                              BorderRadius.circular(16.r),
                          child: Image.asset(
                            'assets/auth/signup_avatar.png',
                            fit: BoxFit.cover,
                            errorBuilder:
                                (_, __, ___) => Container(
                              color: context.isDark ? kBgDeep : kLightBg,
                              child: Center(
                                child: Text('G',
                                    style: TextStyle(
                                        color: kCyan,
                                        fontSize: 40.sp,
                                        fontWeight:
                                            FontWeight
                                                .w900)),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Center(
                      child: Text('Join GAMEARN',
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 32.sp,
                              fontWeight:
                                  FontWeight.w700,
                              letterSpacing: -0.8)),
                    ),
                    SizedBox(height: 8.h),
                    Center(
                      child: Text(
                        'Experience premium Nigerian gaming\nand earn rewards',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: context.txtSec,
                            fontSize: 16.sp,
                            fontWeight:
                                FontWeight.w400),
                      ),
                    ),
                    SizedBox(height: 24.h),

                    // ── Form ─────────────────────────────
                    Padding(
                      padding: EdgeInsets.symmetric(
                          horizontal: 24.w),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          // Full Name
                          GaInput(
                            controller: _nameCtrl,
                            labelText: 'Full Name',
                            hintText: 'e.g. Chinelo Adebayo',
                            prefixIcon: SvgPicture.asset(
                              'assets/icons/field_name.svg',
                              width: 13.w,
                              height: 13.w,
                              colorFilter: ColorFilter.mode(
                                  context.txtSec, BlendMode.srcIn),
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // Email
                          GaInput(
                            controller: _emailCtrl,
                            labelText: 'Email Address',
                            hintText: 'name@example.com',
                            keyboardType: TextInputType.emailAddress,
                            prefixIcon: SvgPicture.asset(
                              'assets/icons/field_email.svg',
                              width: 13.w,
                              height: 13.w,
                              colorFilter: ColorFilter.mode(
                                  context.txtSec, BlendMode.srcIn),
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // Phone Number (compound)
                          Text('Phone Number',
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontWeight: FontWeight.w400,
                                  fontSize: 16.sp)),
                          SizedBox(height: 8.h),
                          Row(children: [
                            Container(
                              width: 63.w,
                              height: 56.h,
                              decoration: BoxDecoration(
                                color: context.isDark
                                    ? const Color(0x800F172A)
                                    : Colors.white,
                                borderRadius:
                                    BorderRadius.circular(12.r),
                                border: Border.all(color: context.border),
                              ),
                              alignment: Alignment.center,
                              child: Text('+234',
                                  style: TextStyle(
                                      color: context.txtSec,
                                      fontSize: 16.sp)),
                            ),
                            SizedBox(width: 8.w),
                            Expanded(
                              child: GaInput(
                                controller: _phoneCtrl,
                                hintText: '801 234 5678',
                                keyboardType: TextInputType.phone,
                              ),
                            ),
                          ]),
                          SizedBox(height: 16.h),

                          // Password
                          GaInput(
                            controller: _passCtrl,
                            labelText: 'Password',
                            hintText: '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
                            obscureText: _obscure,
                            prefixIcon: SvgPicture.asset(
                              'assets/icons/field_password.svg',
                              width: 13.w,
                              height: 13.w,
                              colorFilter: ColorFilter.mode(
                                  context.txtSec, BlendMode.srcIn),
                            ),
                            suffix: IconButton(
                              icon: SvgPicture.asset(
                                'assets/icons/eye_toggle.svg',
                                width: 22.w,
                                height: 15.h,
                                colorFilter: ColorFilter.mode(
                                    context.txtSec, BlendMode.srcIn),
                              ),
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // T&C checkbox
                          Row(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              GestureDetector(
                                onTap: () => setState(
                                    () => _agreed =
                                        !_agreed),
                                child: Container(
                                  width: 24.w,
                                  height: 24.w,
                                  decoration:
                                      BoxDecoration(
                                    color: _agreed
                                        ? kOrange
                                        : (context.isDark ? kBgDeep : Colors.white),
                                    borderRadius:
                                        BorderRadius
                                            .circular(
                                                4.r),
                                    border: Border.all(
                                        color: _agreed
                                            ? kOrange
                                            : context.border),
                                  ),
                                  child: _agreed
                                      ? const Icon(
                                          Icons
                                              .check_rounded,
                                          color: Colors
                                              .white,
                                          size: 16)
                                      : null,
                                ),
                              ),
                              SizedBox(width: 12.w),
                              Expanded(
                                child: Padding(
                                  padding:
                                      EdgeInsets.only(
                                          top: 4.h),
                                  child: Text(
                                    'By creating an account, you agree to our Terms of Service and Privacy Policy.',
                                    style: TextStyle(
                                        color: context.txtSec,
                                        fontSize: 12.sp,
                                        fontWeight:
                                            FontWeight
                                                .w500),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 28.h),

                          // Create Account button
                          GaButton.primary(
                            label: 'Create Account',
                            isLoading: _loading,
                            onPressed: _register,
                            trailing: SvgPicture.asset(
                              'assets/icons/button_arrow.svg',
                              width: 20.w,
                              height: 20.w,
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // Already have account
                          Center(
                            child: GaButton.text(
                              label: 'Already have an account? Login',
                              onPressed: () =>
                                  Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                    builder: (_) =>
                                        const LoginScreen()),
                              ),
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

            // ── Back button (top-left) ──────────────
            Positioned(
              top: 54.h,
              left: 8.w,
              child: GestureDetector(
                onTap: () =>
                    Navigator.maybePop(context),
                child: SvgPicture.asset(
                  'assets/icons/back_button.svg',
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
