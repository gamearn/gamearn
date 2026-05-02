import 'package:flutter/material.dart';
import '../../theme.dart';

/// Full-screen animated splash shown during app load.
/// Call [SplashScreen.show] to display it, then navigate away when ready.
class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _progress;
  String _statusText = 'INITIALIZING ARENA...';

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    );
    _progress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );

    _ctrl.addListener(() {
      final pct = (_progress.value * 100).round();
      String status = 'INITIALIZING ARENA...';
      if (pct > 60) status = 'LOADING ASSETS...';
      if (pct > 85) status = 'SECURING CONNECTION...';
      if (status != _statusText) setState(() => _statusText = status);
    });

    _ctrl.forward().whenComplete(widget.onComplete);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(),
              // Logo icon
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
              const SizedBox(height: 28),
              const Text(
                'WELCOME TO\nGAMEARN',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: kTextPri,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                  height: 1.25,
                ),
              ),
              const Spacer(),
              // Progress section
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        child: Text(
                          _statusText,
                          key: ValueKey(_statusText),
                          style: const TextStyle(
                            color: kTextSec,
                            fontSize: 11,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      AnimatedBuilder(
                        animation: _progress,
                        builder: (_, __) => Text(
                          '${(_progress.value * 100).round()}%',
                          style: const TextStyle(
                            color: kOrange,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  AnimatedBuilder(
                    animation: _progress,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _progress.value,
                        backgroundColor: kBorder,
                        valueColor:
                            const AlwaysStoppedAnimation<Color>(kCyan),
                        minHeight: 4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.wifi, color: kTextSec, size: 14),
                      const SizedBox(width: 6),
                      Text(
                        'SECURE CONNECTION ESTABLISHED',
                        style: kLabel,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
