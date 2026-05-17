import 'package:flutter/material.dart';
import '../../theme.dart';

class LoadingScreen extends StatefulWidget {
  final String message;
  const LoadingScreen({super.key, this.message = 'Loading...'});
  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat();
    _progress = Tween<double>(begin: 0, end: 1).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo glow
              Container(
                width: 120, height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [
                    context.cyan.withOpacity(0.3),
                    Colors.transparent,
                  ]),
                ),
                child: Center(
                  child: Text('G',
                      style: TextStyle(
                          color: context.cyan,
                          fontSize: 56,
                          fontWeight: FontWeight.w900)),
                ),
              ),
              const SizedBox(height: 40),
              // Progress bars — matches Figma loading section
              _progressBar(context, widget.message, _progress),
              const SizedBox(height: 16),
              _progressBar(context, 'Connecting to servers', _progress,
                  delay: 0.2),
              const SizedBox(height: 16),
              _progressBar(context, 'Setting up game', _progress,
                  delay: 0.4),
              const SizedBox(height: 32),
              Text(widget.message,
                  style: TextStyle(color: context.subText, fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _progressBar(BuildContext context, String label,
      Animation<double> anim,
      {double delay = 0}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: const TextStyle(color: Colors.white54, fontSize: 12)),
            AnimatedBuilder(
              animation: anim,
              builder: (_, __) {
                final v = ((anim.value - delay).clamp(0.0, 1.0));
                return Text('${(v * 100).toInt()}%',
                    style: TextStyle(
                        color: context.cyan,
                        fontSize: 12,
                        fontWeight: FontWeight.w600));
              },
            ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: 6,
          decoration: BoxDecoration(
            color: context.surface,
            borderRadius: BorderRadius.circular(3),
          ),
          child: AnimatedBuilder(
            animation: anim,
            builder: (_, __) {
              final v = ((anim.value - delay).clamp(0.0, 1.0));
              return FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: v,
                child: Container(
                  decoration: BoxDecoration(
                    color: context.cyan,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
