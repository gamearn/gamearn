import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';
import '../../widgets/brand_logo.dart';
import '../../services/social_auth_service.dart';
import 'login_screen.dart';
import 'register_screen.dart';

// ════════════════════════════════════════════════════════════════
//  LANDING SCREEN — Figma matched (1180:12 "Sign-up Details",
//  390×844)
//
//  bg #0B0E1A · hero: icon 80×80 r16 white stroke + 'G', "GAMEARN"
//  fs32 white w700, "Elite Gaming Tournaments" fs16 #94A3B8 ·
//  Create Account 342×60 #FF5E00 r12 fs16 w400 · Log In 342×62
//  white@0.03 stroke white@0.08 r12 fs18 w700 · "Or continue with"
//  fs12 #64748B w500 (dividers white@0.1) · Google 167×56 + Apple
//  163×56, Facebook 342×56 (all white@0.03 fill stroke white@0.08,
//  logo 20 + label fs16 w400) · terms banner 341×51 #1C122C@0.78
//  stroke kCyan r8 + terms fs12 w500 centered
// ════════════════════════════════════════════════════════════════

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LandingBody();
  }
}

class _LandingBody extends StatefulWidget {
  const _LandingBody();

  @override
  State<_LandingBody> createState() => _LandingBodyState();
}

class _LandingBodyState extends State<_LandingBody> {
  bool _googleLoading   = false;
  bool _facebookLoading = false;
  bool _appleLoading    = false;

  Future<void> _handleSocialSignIn(String provider) async {
    setState(() {
      if (provider == 'google')   _googleLoading   = true;
      if (provider == 'facebook') _facebookLoading = true;
      if (provider == 'apple')    _appleLoading    = true;
    });

    try {
      switch (provider) {
        case 'google':
          await SocialAuthService.instance.signInWithGoogle();
          break;
        case 'facebook':
          await SocialAuthService.instance.signInWithFacebook();
          break;
        case 'apple':
          await SocialAuthService.instance.signInWithApple();
          break;
      }
    } on AuthException catch (e) {
      if (!mounted) return;
      _showError(e.message);
    } catch (e) {
      if (!mounted) return;
      _showError('Something went wrong. Please try again.');
    } finally {
      if (mounted) {
        setState(() {
          _googleLoading   = false;
          _facebookLoading = false;
          _appleLoading    = false;
        });
      }
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.r)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: LayoutBuilder(builder: (_, c) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: c.maxHeight),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Spacer(flex: 2),

                      // ── Hero ──────────────────────────────────────
                      Center(
                        child: Container(
                          width: 80.w, height: 80.w,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16.r),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Image.asset(
                            'assets/logos/logo_icon.png',
                            width: 80.w,
                            height: 80.w,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      SizedBox(height: 16.h),
                      Text('GAMEARN',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 32.sp,
                              fontWeight: FontWeight.w700)),
                      SizedBox(height: 8.h),
                      Text('Elite Gaming Tournaments',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: const Color(0xFF94A3B8),
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w400)),

                      const Spacer(flex: 3),

                      // ── Create Account ────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 60.h,
                        child: ElevatedButton(
                          onPressed: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const RegisterScreen())),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kOrange,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12.r)),
                          ),
                          child: Text('Create Account',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.w400)),
                        ),
                      ),
                      SizedBox(height: 14.h),

                      // ── Log In ────────────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 62.h,
                        child: OutlinedButton(
                          onPressed: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const LoginScreen())),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: const Color(0x08FFFFFF),
                            side: const BorderSide(
                                color: Color(0x14FFFFFF)),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12.r)),
                          ),
                          child: Text('Log In',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ),
                      SizedBox(height: 28.h),

                      // ── Or continue with ──────────────────────────
                      Row(children: [
                        const Expanded(
                            child: Divider(
                                color: Color(0x1AFFFFFF), height: 1)),
                        Padding(
                          padding:
                              EdgeInsets.symmetric(horizontal: 12.w),
                          child: Text('Or continue with',
                              style: kLabel.copyWith(
                                  color: const Color(0xFF64748B))),
                        ),
                        const Expanded(
                            child: Divider(
                                color: Color(0x1AFFFFFF), height: 1)),
                      ]),
                      SizedBox(height: 20.h),

                      // ── Google + Apple ────────────────────────────
                      Row(children: [
                        Expanded(
                          child: _SocialButton(
                            label: 'Google',
                            logoType: BrandType.google,
                            loading: _googleLoading,
                            onTap: () => _handleSocialSignIn('google'),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        if (Theme.of(context).platform ==
                            TargetPlatform.iOS)
                          Expanded(
                            child: _SocialButton(
                              label: 'Apple',
                              logoType: BrandType.apple,
                              loading: _appleLoading,
                              onTap: () => _handleSocialSignIn('apple'),
                            ),
                          ),
                      ]),
                      SizedBox(height: 12.h),

                      // ── Facebook ──────────────────────────────────
                      _SocialButton(
                        label: 'Facebook',
                        logoType: BrandType.facebook,
                        loading: _facebookLoading,
                        onTap: () => _handleSocialSignIn('facebook'),
                        fullWidth: true,
                      ),

                      const Spacer(flex: 2),

                      // ── Terms banner ──────────────────────────────
                      Container(
                        padding:
                            EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
                        decoration: BoxDecoration(
                          color: const Color(0xC71C122C),
                          borderRadius: BorderRadius.circular(8.r),
                          border: Border.all(color: kCyan),
                        ),
                        child: Text(
                          'By continuing, you agree to our Terms and Conditions and\nPrivacy Policy',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: const Color(0x80FFFFFF),
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                      SizedBox(height: 24.h),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final String label;
  final BrandType logoType;
  final VoidCallback onTap;
  final bool fullWidth;
  final bool loading;

  const _SocialButton({
    required this.label,
    required this.logoType,
    required this.onTap,
    this.fullWidth = false,
    this.loading = false,
  });

  Widget _buildContent(BuildContext context) {
    if (loading) {
      return SizedBox(
        width: 20.w, height: 20.h,
        child: const CircularProgressIndicator(strokeWidth: 2, color: kCyan),
      );
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandLogo(type: logoType, size: 20),
        SizedBox(width: 10.w),
        Text(label,
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w400,
                fontSize: 16.sp)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final btn = OutlinedButton(
      onPressed: loading ? null : onTap,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 56),
        backgroundColor: const Color(0x08FFFFFF),
        side: const BorderSide(color: Color(0x14FFFFFF)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
      ),
      child: _buildContent(context),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}
