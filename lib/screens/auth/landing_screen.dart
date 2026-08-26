import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../theme.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';
import '../../services/social_auth_service.dart';
import 'login_screen.dart';
import 'register_screen.dart';

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
  bool _googleLoading = false;
  bool _facebookLoading = false;
  bool _appleLoading = false;

  Future<void> _handleSocialSignIn(String provider) async {
    setState(() {
      if (provider == 'google') _googleLoading = true;
      if (provider == 'facebook') _facebookLoading = true;
      if (provider == 'apple') _appleLoading = true;
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
          _googleLoading = false;
          _facebookLoading = false;
          _appleLoading = false;
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
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10.r)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AuthBackground(
      type: AuthBackgroundType.hexNetwork,
      opacity: 0.8,
      child: Scaffold(
        backgroundColor: Colors.transparent,
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
                        SizedBox(height: 80.h),

                        // ── Hero: avatar + title + subtitle ──
                        Center(
                          child: Container(
                            width: 80.w,
                            height: 80.w,
                            decoration: BoxDecoration(
                              borderRadius:
                                  BorderRadius.circular(16.r),
                              border: Border.all(
                                  color: context.border, width: 1),
                            ),
                            child: ClipRRect(
                              borderRadius:
                                  BorderRadius.circular(16.r),
                              child: Image.asset(
                                'assets/auth/signup_avatar.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    Container(
                                  color: context.isDark ? kBgDeep : kLightBg,
                                  child: Center(
                                    child: Text('G',
                                        style: TextStyle(
                                            color: kCyan,
                                            fontSize: 40.sp,
                                            fontWeight:
                                                FontWeight.w900)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 16.h),
                        Text('GAMEARN',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 32.sp,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.8)),
                        SizedBox(height: 16.h),
                        Text('Elite Gaming Tournaments',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w400)),

                        const Spacer(flex: 3),

                        // ── Create Account (orange) ──────────
                        GaButton.primary(
                          label: 'Create Account',
                          onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const RegisterScreen())),
                        ),
                        SizedBox(height: 16.h),

                        // ── Log In (frosted glass) ───────────
                        GaButton.outline(
                          label: 'Log In',
                          onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const LoginScreen())),
                        ),
                        SizedBox(height: 28.h),

                        // ── "Or continue with" divider ───────
                        Row(children: [
                          Expanded(
                              child: Divider(
                                  color: context.border,
                                  height: 1)),
                          Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: 16.w),
                            child: Text('Or continue with',
                                style: TextStyle(
                                    color: context.txtSec,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500)),
                          ),
                          Expanded(
                              child: Divider(
                                  color: context.border,
                                  height: 1)),
                        ]),
                        SizedBox(height: 20.h),

                        // ── Google + Apple row ───────────────
                        Row(children: [
                          Expanded(
                            child: _FrostedSocialButton(
                              label: 'Google',
                              asset: 'assets/icons/social_google.svg',
                              loading: _googleLoading,
                              onTap: () =>
                                  _handleSocialSignIn('google'),
                            ),
                          ),
                          SizedBox(width: 12.w),
                          Expanded(
                            child: _FrostedSocialButton(
                              label: 'Apple',
                              asset: 'assets/icons/social_apple.svg',
                              loading: _appleLoading,
                              onTap: () =>
                                  _handleSocialSignIn('apple'),
                            ),
                          ),
                        ]),
                        SizedBox(height: 12.h),

                        // ── Facebook (full width) ────────────
                        _FrostedSocialButton(
                          label: 'Facebook',
                          asset: 'assets/icons/social_facebook.png',
                          loading: _facebookLoading,
                          onTap: () =>
                              _handleSocialSignIn('facebook'),
                          fullWidth: true,
                        ),

                        const Spacer(flex: 2),

                        // ── Terms banner (cyan border) ───────
                        Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 16.w, vertical: 10.h),
                          decoration: BoxDecoration(
                            color: context.isDark
                                ? const Color(0xC71C122C)
                                : Colors.white,
                            borderRadius:
                                BorderRadius.circular(8.r),
                            border: Border.all(color: kCyan),
                          ),
                          child: Text(
                            'By continuing, you agree to our Terms and Conditions and\nPrivacy Policy',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.txtSec,
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
      ),
    );
  }
}

class _FrostedSocialButton extends StatelessWidget {
  final String label;
  final String asset;
  final VoidCallback onTap;
  final bool fullWidth;
  final bool loading;

  const _FrostedSocialButton({
    required this.label,
    required this.asset,
    required this.onTap,
    this.fullWidth = false,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final btn = OutlinedButton(
      onPressed: loading ? null : onTap,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 56),
        backgroundColor: context.isDark
            ? const Color(0x08FFFFFF)
            : Colors.white,
        side: BorderSide(
            color: context.isDark
                ? const Color(0x14FFFFFF)
                : context.border),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r)),
        padding: EdgeInsets.symmetric(horizontal: 41.w, vertical: 15.h),
      ),
      child: loading
          ? SizedBox(
              width: 20.w,
              height: 20.h,
              child: const CircularProgressIndicator(
                  strokeWidth: 2, color: kCyan))
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (asset.endsWith('.svg'))
                  SvgPicture.asset(
                    asset,
                    width: 20.w,
                    height: 20.w,
                  )
                else
                  Image.asset(
                    asset,
                    width: 20.w,
                    height: 20.w,
                  ),
                SizedBox(width: 12.w),
                Text(label,
                    style: TextStyle(
                        color: context.txtPri,
                        fontWeight: FontWeight.w400,
                        fontSize: 16.sp)),
              ],
            ),
    );
    return fullWidth
        ? SizedBox(width: double.infinity, child: btn)
        : btn;
  }
}
