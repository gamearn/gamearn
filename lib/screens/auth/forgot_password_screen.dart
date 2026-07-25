import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendReset() async {
    if (_emailCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(
        email: _emailCtrl.text.trim(),
      );
      if (mounted) setState(() => _sent = true);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Failed to send reset link'),
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
                // Back button
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: kLightCard,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: kLightText, size: 18),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Logo
                const Center(
                  child: Text('G⚡',
                      style: TextStyle(fontSize: 36, color: kLightText)),
                ),
                const SizedBox(height: 24),

                if (!_sent) ...[
                  // Title
                  const Center(
                    child: Text('Forgot Password?',
                        style: TextStyle(
                            color: kLightText,
                            fontSize: 24,
                            fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      "No worries! Enter your email address and\nwe'll send you a link to reset your password.",
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
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: kLightText, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'e.g. name@example.com',
                      hintStyle: TextStyle(color: kLightSub, fontSize: 14),
                      prefixIcon:
                          Icon(Icons.email_outlined, color: kLightSub, size: 20),
                      filled: true,
                      fillColor: kLightCard,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Send button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _loading ? null : _sendReset,
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
                          : const Text('Send Reset Link',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16)),
                    ),
                  ),
                ] else ...[
                  // Success state
                  const SizedBox(height: 48),
                  Center(
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E676).withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.mark_email_read_outlined,
                          color: Color(0xFF00E676), size: 40),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Center(
                    child: Text('Check Your Email',
                        style: TextStyle(
                            color: kLightText,
                            fontSize: 22,
                            fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      "We've sent a password reset link to\n${_emailCtrl.text.trim()}",
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: kLightSub, fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kOrange,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Back to Login',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: TextButton(
                      onPressed: () => setState(() => _sent = false),
                      child: const Text('Didn\'t receive it? Resend',
                          style: TextStyle(color: kCyan, fontSize: 14)),
                    ),
                  ),
                ],

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
