import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// Auth screen backgrounds matching Figma designs.
///
/// [AuthBackgroundType.hexNetwork] — bold hexagonal/purple network pattern
///   Used by: Login, Sign-up/Landing, Register (opacity 0.8)
///
/// [AuthBackgroundType.dottedCircuit] — muted dotted/circuit-line pattern
///   Used by: OTP, Forgot Password, Reset Password (opacity 0.5)
class AuthBackground extends StatelessWidget {
  final AuthBackgroundType type;
  final double opacity;
  final Widget child;

  const AuthBackground({
    super.key,
    required this.type,
    this.opacity = 1.0,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Solid dark base
        const ColoredBox(color: Color(0xFF0B0E1A)),
        // Pattern overlay from Figma PNG
        Opacity(
          opacity: opacity,
          child: Image.asset(
            type.assetPath,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
          ),
        ),
        // Bottom glow blur
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          height: 85.h,
          child: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Color(0xCC000000),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        // Content
        child,
      ],
    );
  }
}

enum AuthBackgroundType {
  hexNetwork,
  dottedCircuit,
}

extension _AssetPath on AuthBackgroundType {
  String get assetPath {
    switch (this) {
      case AuthBackgroundType.hexNetwork:
        return 'assets/auth/login_bg.png';
      case AuthBackgroundType.dottedCircuit:
        return 'assets/auth/otp_bg.png';
    }
  }
}
