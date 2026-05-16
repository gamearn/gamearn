import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pinput/pinput.dart';
import '../../theme.dart';

class OtpScreen extends StatefulWidget {
  final String verificationId;
  final String email;
  final String password;
  final String phone;
  final String name;

  const OtpScreen({
    super.key,
    required this.verificationId,
    required this.email,
    required this.password,
    required this.phone,
    required this.name,
  });

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _pinController = TextEditingController();
  final _focusNode = FocusNode();
  
  late String _currentVerificationId;
  int _secondsLeft = 60;
  Timer? _timer;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _currentVerificationId = widget.verificationId;
    _startTimer();
    // Auto-focus the pinput
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _pinController.dispose();
    _focusNode.dispose();
    _timer?.cancel();
    super.dispose();
  }

  String get _timerDisplay {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')} : ${s.toString().padLeft(2, '0')}';
  }

  Future<void> _resendCode() async {
    if (_secondsLeft > 0) return;
    setState(() => _loading = true);

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: widget.phone,
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Handled by Pinput auto-fill usually, but we can verify here as fallback
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!mounted) return;
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.message ?? 'Resend failed'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _currentVerificationId = verificationId;
        });
        _startTimer();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Verification code resent!'),
          backgroundColor: kCyan,
          behavior: SnackBarBehavior.floating,
        ));
      },
      codeAutoRetrievalTimeout: (_) {},
      timeout: const Duration(seconds: 60),
    );
  }

  Future<void> _verify(String pin) async {
    if (pin.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Enter the full 6-digit code'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    
    setState(() => _loading = true);

    try {
      // 1. Create phone credential from SMS code
      final credential = PhoneAuthProvider.credential(
        verificationId: _currentVerificationId,
        smsCode: pin,
      );
      
      // 2. Sign in with Phone
      final userCred = await FirebaseAuth.instance.signInWithCredential(credential);
      
      // 3. We now have a Phone Auth user.
      // Link email/password credential so they can also log in via LoginScreen later.
      // One user, two providers (phone + email/password).
      if (userCred.user != null) {
        try {
          final emailCred = EmailAuthProvider.credential(
            email: widget.email,
            password: widget.password,
          );
          await userCred.user!.linkWithCredential(emailCred);
        } catch (e) {
          debugPrint('Failed to link email/password: $e');
          // We can proceed even if it fails, they are still logged in via Phone!
        }
      }
      
      // SUCCESS! 
      // Main.dart AuthGate will automatically detect the authState change
      // and redirect the user to ProfileSetupScreen. We don't need to push!
      
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.message ?? 'Invalid verification code'),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ));
        _pinController.clear();
        _focusNode.requestFocus();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 58,
      height: 64,
      textStyle: const TextStyle(
        fontSize: 24, 
        color: kTextPri, 
        fontWeight: FontWeight.w700
      ),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
    );

    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              const Spacer(),
              
              // SMS Icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.sms_outlined, color: kOrange, size: 34),
              ),
              const SizedBox(height: 24),
              
              const Text('SMS Verification',
                  style: TextStyle(color: kTextPri, fontSize: 24, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(
                'Enter the 6-digit code sent to\n${widget.phone}',
                textAlign: TextAlign.center,
                style: kSub,
              ),
              const SizedBox(height: 36),
              
              // Pinput Widget!
              Pinput(
                length: 6,
                controller: _pinController,
                focusNode: _focusNode,
                defaultPinTheme: defaultPinTheme,
                focusedPinTheme: defaultPinTheme.copyWith(
                  decoration: defaultPinTheme.decoration!.copyWith(
                    border: Border.all(color: kCyan, width: 2),
                  ),
                ),
                onCompleted: _verify, // auto-submit when 6 digits are entered
              ),
              
              const SizedBox(height: 32),
              
              // Countdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.timer_outlined, color: kTextSec, size: 16),
                    const SizedBox(width: 6),
                    Text(_timerDisplay,
                        style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w700, fontSize: 15)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Resend Action
              Row(
                mainAxisAlignment: MainAxisAlignment.center, 
                children: [
                  Text("Didn't receive the code?  ", style: kSub),
                  GestureDetector(
                    onTap: _secondsLeft == 0 ? _resendCode : null,
                    child: Text('Resend SMS',
                        style: TextStyle(
                            color: _secondsLeft == 0 ? kCyan : kTextMuted,
                            fontWeight: FontWeight.w700,
                            fontSize: 13)),
                  ),
                ]
              ),
              
              const Spacer(),
              
              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading ? null : () => _verify(_pinController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kOrange,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22, height: 22, 
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Verify & Continue', 
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Text('SECURED BY GAMEARN SHIELD',
                  style: kLabel.copyWith(color: kTextMuted)),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
