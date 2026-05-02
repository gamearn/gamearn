import 'dart:async';
import 'package:flutter/material.dart';
import '../../theme.dart';

class OtpScreen extends StatefulWidget {
  final String email;
  const OtpScreen({super.key, required this.email});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> _ctrls =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes =
      List.generate(4, (_) => FocusNode());
  int _secondsLeft = 119; // 01:59
  Timer? _timer;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
    // Auto-focus first box
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _focusNodes[0].requestFocus());
  }

  void _startTimer() {
    _timer?.cancel();
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
    for (final c in _ctrls) c.dispose();
    for (final f in _focusNodes) f.dispose();
    _timer?.cancel();
    super.dispose();
  }

  String get _timerDisplay {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')} : ${s.toString().padLeft(2, '0')}';
  }

  Future<void> _verify() async {
    final code = _ctrls.map((c) => c.text).join();
    if (code.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Enter the full 4-digit code'),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    setState(() => _loading = true);
    // TODO: verify OTP against Firebase / backend
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) setState(() => _loading = false);
    // On success, AuthGate will redirect to ProfileSetup or Shell
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Back button
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      color: kTextPri, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),

              const Spacer(),

              // Mail icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.mark_email_read_outlined,
                    color: kOrange, size: 34),
              ),
              const SizedBox(height: 24),

              const Text('OTP Verification',
                  style: TextStyle(
                      color: kTextPri,
                      fontSize: 24,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(
                'Enter the code sent to your email to\ncontinue your gaming journey.',
                textAlign: TextAlign.center,
                style: kSub,
              ),
              const SizedBox(height: 36),

              // 4 OTP boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(4, (i) {
                  return Container(
                    width: 58,
                    height: 62,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    decoration: BoxDecoration(
                      color: kBgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color:
                            _focusNodes[i].hasFocus ? kCyan : kBorder,
                        width: _focusNodes[i].hasFocus ? 2 : 1,
                      ),
                    ),
                    child: TextField(
                      controller: _ctrls[i],
                      focusNode: _focusNodes[i],
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(
                          color: kTextPri,
                          fontSize: 22,
                          fontWeight: FontWeight.w700),
                      decoration: const InputDecoration(
                        counterText: '',
                        border: InputBorder.none,
                      ),
                      onChanged: (v) {
                        if (v.length == 1 && i < 3) {
                          _focusNodes[i + 1].requestFocus();
                        }
                        if (v.isEmpty && i > 0) {
                          _focusNodes[i - 1].requestFocus();
                        }
                        setState(() {}); // refresh border
                      },
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),

              // Countdown
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.timer_outlined,
                        color: kTextSec, size: 16),
                    const SizedBox(width: 6),
                    Text(_timerDisplay,
                        style: const TextStyle(
                            color: kTextPri,
                            fontWeight: FontWeight.w700,
                            fontSize: 15)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Resend
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text("Didn't receive the code?  ", style: kSub),
                GestureDetector(
                  onTap: _secondsLeft == 0
                      ? () {
                          setState(() => _secondsLeft = 119);
                          _startTimer();
                        }
                      : null,
                  child: Text('Resend Code',
                      style: TextStyle(
                          color:
                              _secondsLeft == 0 ? kCyan : kTextMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 13)),
                ),
              ]),

              const Spacer(),

              // Verify & Continue
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading ? null : _verify,
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
                            Text('Verify & Continue',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16)),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward,
                                color: Colors.white, size: 18),
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
