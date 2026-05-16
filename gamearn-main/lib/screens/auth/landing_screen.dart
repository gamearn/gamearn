import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../widgets/brand_logo.dart';
import '../../services/social_auth_service.dart';
import 'splash_screen.dart';
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final logoAsset = isDark
        ? 'assets/logos/logo_dark.png'
        : 'assets/logos/logo_light.png';

    return Scaffold(
      backgroundColor: isDark ? kBgDeep : kLightBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Logo ────────────────────────────────────────────────────
              Image.asset(
                logoAsset,
                width: 200,
                height: 200,
                fit: BoxFit.contain,
              ),

              const Spacer(flex: 3),

              _LandingButton(
                label: 'Create Account',
                filled: true,
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen())),
              ),
              const SizedBox(height: 14),
              _LandingButton(
                label: 'Log In',
                filled: false,
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const LoginScreen())),
              ),
              const SizedBox(height: 32),

              Row(children: [
                const Expanded(child: Divider(color: kBorder)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('Or continue with', style: kSub),
                ),
                const Expanded(child: Divider(color: kBorder)),
              ]),
              const SizedBox(height: 20),

              Row(children: [
                Expanded(
                  child: _SocialButton(
                    label: 'Google',
                    svgAsset: 'google',
                    loading: _googleLoading,
                    onTap: () => _handleSocialSignIn('google'),
                  ),
                ),
                if (Theme.of(context).platform == TargetPlatform.iOS) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SocialButton(
                      label: 'Apple',
                      svgAsset: 'apple',
                      loading: _appleLoading,
                      onTap: () => _handleSocialSignIn('apple'),
                    ),
                  ),
                ],
              ]),
              const SizedBox(height: 12),
              _SocialButton(
                label: 'Facebook',
                svgAsset: 'facebook',
                loading: _facebookLoading,
                onTap: () => _handleSocialSignIn('facebook'),
                fullWidth: true,
              ),

              const SizedBox(height: 20),
              const Text(
                'By continuing, you agree to our Terms and Conditions\nand Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(color: kTextMuted, fontSize: 11),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _LandingButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _LandingButton(
      {required this.label, required this.filled, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 54,
      child: filled
          ? ElevatedButton(
              onPressed: onTap,
              style: ElevatedButton.styleFrom(
                backgroundColor: kOrange,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
            )
          : OutlinedButton(
              onPressed: onTap,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: kBorder),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(label,
                  style: const TextStyle(
                      color: kTextPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
            ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final String label;
  final String svgAsset;
  final VoidCallback onTap;
  final bool fullWidth;
  final bool loading;

  const _SocialButton({
    required this.label,
    required this.svgAsset,
    required this.onTap,
    this.fullWidth = false,
    this.loading = false,
  });

  BrandType get _logoType {
    switch (svgAsset) {
      case 'apple':    return BrandType.apple;
      case 'facebook': return BrandType.facebook;
      default:         return BrandType.google;
    }
  }

  Widget _buildContent(BuildContext context) {
    if (loading) {
      return const SizedBox(
        width: 20, height: 20,
        child: CircularProgressIndicator(strokeWidth: 2, color: kCyan),
      );
    }
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandLogo(type: _logoType, size: 20),
        const SizedBox(width: 10),
        Text(label,
            style: TextStyle(
                color: isDark ? kTextPri : kLightText, 
                fontWeight: FontWeight.w600, 
                fontSize: 14)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final btn = OutlinedButton(
      onPressed: loading ? null : onTap,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: BorderSide(color: isDark ? kBorder : const Color(0xFFDDE1E7)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: _buildContent(context),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}
