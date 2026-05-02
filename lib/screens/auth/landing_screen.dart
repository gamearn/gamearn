import 'package:flutter/material.dart';
import '../../theme.dart';
import 'splash_screen.dart';
import 'login_screen.dart';
import 'register_screen.dart';

/// The first screen a user sees after the splash.
/// Matches Figma: logo, "GAMEARN / Elite Gaming Tournaments",
/// orange "Create Account" button, outlined "Log In", then 3 social buttons.
class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  bool _showSplash = true;

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(
        onComplete: () => setState(() => _showSplash = false),
      );
    }
    return _LandingBody();
  }
}

class _LandingBody extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const Spacer(flex: 2),
              // Logo
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A2340),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Center(
                  child: Text('G⚡', style: TextStyle(fontSize: 40)),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'GAMEARN',
                style: TextStyle(
                  color: kTextPri,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Elite Gaming Tournaments',
                style: TextStyle(color: kTextSec, fontSize: 15),
              ),
              const Spacer(flex: 3),
              // Create Account (orange filled)
              _LandingButton(
                label: 'Create Account',
                filled: true,
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterScreen())),
              ),
              const SizedBox(height: 14),
              // Log In (outlined)
              _LandingButton(
                label: 'Log In',
                filled: false,
                onTap: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const LoginScreen())),
              ),
              const SizedBox(height: 32),
              // Or continue with divider
              Row(children: [
                const Expanded(child: Divider(color: kBorder)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('Or continue with', style: kSub),
                ),
                const Expanded(child: Divider(color: kBorder)),
              ]),
              const SizedBox(height: 20),
              // Google + Apple
              Row(children: [
                Expanded(
                  child: _SocialButton(
                    label: 'Google',
                    icon: Icons.g_mobiledata,
                    onTap: () {}, // TODO: Google sign-in
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _SocialButton(
                    label: 'Apple',
                    icon: Icons.apple,
                    onTap: () {}, // TODO: Apple sign-in
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              // Facebook full width
              _SocialButton(
                label: 'Facebook',
                icon: Icons.facebook,
                onTap: () {}, // TODO: Facebook sign-in
                fullWidth: true,
              ),
              const SizedBox(height: 20),
              // T&C
              Text(
                'By continuing, you agree to our Terms and Conditions\nand Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: kTextMuted,
                  fontSize: 11,
                ),
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
  const _LandingButton({required this.label, required this.filled, required this.onTap});

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
  final IconData icon;
  final VoidCallback onTap;
  final bool fullWidth;
  const _SocialButton(
      {required this.label,
      required this.icon,
      required this.onTap,
      this.fullWidth = false});

  @override
  Widget build(BuildContext context) {
    final btn = OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: kTextSec, size: 20),
      label: Text(label,
          style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w600)),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        side: const BorderSide(color: kBorder),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}
