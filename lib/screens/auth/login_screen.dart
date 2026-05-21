import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../widgets/brand_logo.dart';
import '../../services/social_auth_service.dart';
import 'register_screen.dart';

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
      // AuthGate handles navigation
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
    // Light theme for auth screens — matches Figma
    return Theme(
      data: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: kLightBg,
        useMaterial3: true,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: kLightCard,
          hintStyle: TextStyle(color: kLightSub, fontSize: 14),
          prefixIconColor: kLightSub,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: kLightBg,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo at top
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 24, bottom: 8),
                    child: Text('G⚡',
                        style: TextStyle(fontSize: 36, color: kLightText)),
                  ),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: Text('Welcome Back',
                      style: TextStyle(
                          color: kLightText,
                          fontSize: 26,
                          fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    "Nigeria's premium destination for classic\ngames and rewards",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kLightSub, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 36),

                // Email
                const Text('Email Address',
                    style: TextStyle(
                        color: kLightText,
                        fontWeight: FontWeight.w600,
                        fontSize: 14)),
                const SizedBox(height: 8),
                _AuthField(
                  controller: _emailCtrl,
                  hint: 'e.g. name@example.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 20),

                // Password
                const Text('Password',
                    style: TextStyle(
                        color: kLightText,
                        fontWeight: FontWeight.w600,
                        fontSize: 14)),
                const SizedBox(height: 8),
                _AuthField(
                  controller: _passCtrl,
                  hint: 'Enter your password',
                  prefixIcon: Icons.lock_outline,
                  obscureText: _obscure,
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: kLightSub),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // TODO: password reset
                    },
                    child: const Text('Forgot Password?',
                        style: TextStyle(color: kCyan, fontSize: 13)),
                  ),
                ),
                const SizedBox(height: 8),

                // Login button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kOrange,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('Login to Gamearn',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16)),
                              SizedBox(width: 8),
                              Icon(Icons.login, color: Colors.white, size: 18),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                // OR divider
                Row(children: [
                  const Expanded(
                      child: Divider(color: Color(0xFFDDE1E7))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('OR',
                        style: TextStyle(color: kLightSub, fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                  const Expanded(
                      child: Divider(color: Color(0xFFDDE1E7))),
                ]),
                const SizedBox(height: 16),

                // Social Logins
                Row(children: [
                  Expanded(
                    child: _SocialLoginBtn(
                      type: BrandType.google,
                      onTap: () async {
                        setState(() => _loading = true);
                        try {
                          await SocialAuthService.instance.signInWithGoogle();
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                          }
                        } finally {
                          if (mounted) setState(() => _loading = false);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (Theme.of(context).platform == TargetPlatform.iOS) ...[
                    Expanded(
                      child: _SocialLoginBtn(
                        type: BrandType.apple,
                        onTap: () async {
                          setState(() => _loading = true);
                          try {
                            await SocialAuthService.instance.signInWithApple();
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                            }
                          } finally {
                            if (mounted) setState(() => _loading = false);
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: _SocialLoginBtn(
                      type: BrandType.facebook,
                      onTap: () async {
                        setState(() => _loading = true);
                        try {
                          await SocialAuthService.instance.signInWithFacebook();
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                          }
                        } finally {
                          if (mounted) setState(() => _loading = false);
                        }
                      },
                    ),
                  ),
                ]),
                const SizedBox(height: 24),

                // Create new account
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const RegisterScreen()));
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFFDDE1E7)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Create New Account',
                        style: TextStyle(
                            color: kLightText,
                            fontWeight: FontWeight.w700,
                            fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 20),

                // Tutorial strip (Play / Earn / Wallet)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: kLightCard,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                          child: _TutorialItem(
                              icon: Icons.sports_esports_outlined,
                              label: 'Play',
                              sub: 'Ludo, Ayo & more',
                              color: kTextMuted)),
                      Expanded(
                          child: _TutorialItem(
                              icon: Icons.account_balance_wallet_outlined,
                              label: 'Earn',
                              sub: 'Win daily rewards',
                              color: kOrange)),
                      Expanded(
                          child: _TutorialItem(
                              icon: Icons.payments_outlined,
                              label: 'Wallet',
                              sub: 'Instant withdrawal',
                              color: kCyan)),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SocialLoginBtn extends StatelessWidget {
  final BrandType type;
  final VoidCallback onTap;
  const _SocialLoginBtn({required this.type, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 54,
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFDDE1E7)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: BrandLogo(type: type, size: 22),
        ),
      ),
    );
  }
}

class _AuthField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;

  const _AuthField({
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: const TextStyle(color: kLightText, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: kLightSub, fontSize: 14),
        prefixIcon: Icon(prefixIcon, color: kLightSub, size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: kLightCard,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(height: 6),
        Text(label,
            style: const TextStyle(
                color: kLightText,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
        Text(sub,
            textAlign: TextAlign.center,
            style: TextStyle(color: kLightSub, fontSize: 10)),
      ],
    );
  }
}
