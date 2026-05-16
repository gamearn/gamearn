import 'package:flutter/material.dart';
import '../../theme.dart';

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
  late Animation<double> _fadeIn;
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
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
          parent: _ctrl, curve: const Interval(0, 0.4, curve: Curves.easeIn)),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final logoAsset = isDark
        ? 'assets/logos/logo_dark.png'
        : 'assets/logos/logo_light.png';

    return Scaffold(
      backgroundColor: isDark ? kBgDeep : kLightBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(),

              // ── Logo ────────────────────────────────────────────────────
              FadeTransition(
                opacity: _fadeIn,
                child: Image.asset(
                  logoAsset,
                  width: 180,
                  height: 180,
                  fit: BoxFit.contain,
                ),
              ),

              const SizedBox(height: 20),
              FadeTransition(
                opacity: _fadeIn,
                child: Text(
                  'WHERE SKILL BECOMES REWARD',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? kTextSec : kLightSub,
                    fontSize: 12,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              const Spacer(),

              // ── Progress ─────────────────────────────────────────────────
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 500),
                        child: Text(
                          _statusText,
                          key: ValueKey(_statusText),
                          style: TextStyle(
                            color: isDark ? kTextSec : kLightSub,
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
                  Row(children: [
                    const Icon(Icons.wifi, color: kTextSec, size: 14),
                    const SizedBox(width: 6),
                    Text('SECURE CONNECTION ESTABLISHED', style: kLabel),
                  ]),
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
