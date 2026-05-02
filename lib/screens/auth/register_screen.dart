import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'login_screen.dart';
import 'otp_screen.dart';

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

  Future<void> _register() async {
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please agree to the Terms of Service'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    if (_emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) return;

    setState(() => _loading = true);
    try {
      final cred = await FirebaseAuth.instance
          .createUserWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );

      // Send email OTP / verification
      await cred.user?.sendEmailVerification();

      if (!mounted) return;
      // Navigate to OTP screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => OtpScreen(email: _emailCtrl.text.trim()),
        ),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Registration failed'),
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
      ),
      child: Scaffold(
        backgroundColor: kLightBg,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 24, bottom: 4),
                    child: Text('G⚡',
                        style: TextStyle(fontSize: 36, color: kLightText)),
                  ),
                ),
                const Center(
                  child: Text('Join GAMEARN',
                      style: TextStyle(
                          color: kLightText,
                          fontSize: 26,
                          fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 6),
                const Center(
                  child: Text(
                    'Experience premium Nigerian gaming\nand earn rewards',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: kLightSub, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 32),

                // Full Name
                _Label('Full Name'),
                _Field(
                    controller: _nameCtrl,
                    hint: 'e.g. Chinelo Adebayo',
                    icon: Icons.person_outline),
                const SizedBox(height: 16),

                // Email
                _Label('Email Address'),
                _Field(
                    controller: _emailCtrl,
                    hint: 'name@example.com',
                    icon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),

                // Phone with +234 prefix
                _Label('Phone Number'),
                Row(children: [
                  Container(
                    width: 64,
                    height: 52,
                    decoration: BoxDecoration(
                      color: kLightCard,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Text('+234',
                        style: TextStyle(
                            color: kLightText,
                            fontWeight: FontWeight.w600,
                            fontSize: 14)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _Field(
                        controller: _phoneCtrl,
                        hint: '801 234 5678',
                        icon: null,
                        keyboardType: TextInputType.phone),
                  ),
                ]),
                const SizedBox(height: 16),

                // Password
                _Label('Password'),
                TextField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  style: const TextStyle(color: kLightText, fontSize: 15),
                  decoration: InputDecoration(
                    hintText: '••••••••',
                    hintStyle: TextStyle(color: kLightSub),
                    prefixIcon: const Icon(Icons.lock_outline,
                        color: kLightSub, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(
                          _obscure
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          color: kLightSub),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                    filled: true,
                    fillColor: kLightCard,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                // T&C checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreed,
                      onChanged: (v) => setState(() => _agreed = v ?? false),
                      activeColor: kOrange,
                    ),
                    const Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(top: 10),
                        child: Text.rich(
                          TextSpan(
                            text: 'By creating an account, you agree to our ',
                            style:
                                TextStyle(color: kLightSub, fontSize: 13),
                            children: [
                              TextSpan(
                                  text: 'Terms of Service',
                                  style: TextStyle(
                                      color: kCyan,
                                      decoration: TextDecoration.underline)),
                              TextSpan(text: ' and '),
                              TextSpan(
                                  text: 'Privacy Policy',
                                  style: TextStyle(
                                      color: kCyan,
                                      decoration: TextDecoration.underline)),
                              TextSpan(text: '.'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Create Account button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _register,
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
                              Text('Create Account',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16)),
                              SizedBox(width: 8),
                              Icon(Icons.rocket_launch,
                                  color: Colors.white, size: 18),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                // Already have account
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pushReplacement(context,
                        MaterialPageRoute(
                            builder: (_) => const LoginScreen())),
                    child: const Text.rich(TextSpan(
                      text: 'Already have an account? ',
                      style: TextStyle(color: kLightSub),
                      children: [
                        TextSpan(
                            text: 'Log In',
                            style: TextStyle(
                                color: kOrange,
                                fontWeight: FontWeight.w700))
                      ],
                    )),
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

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(
              color: kLightText,
              fontWeight: FontWeight.w600,
              fontSize: 14)),
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
      style: const TextStyle(color: kLightText, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: kLightSub, fontSize: 14),
        prefixIcon:
            icon != null ? Icon(icon, color: kLightSub, size: 20) : null,
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
