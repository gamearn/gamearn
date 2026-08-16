import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  SPLASH SCREEN — Figma matched (1044:286 "iPhone 13 & 14 - 3")
//
//  bg #0B0E1A + bottom glow · Game icon 112×112 r25 (#0B0E1A +
//    logo) · "WELCOME TO GAMEARN" fs32 white w700 · loading
//    section 280 wide: "Initializing Arena..." fs12 #F1F5F9 w600 +
//    % fs12 #FF5E00 w500 · bar 280×6 #1E293B@0.5 stroke
//    white@0.05, cyan fill 4px · connectivity row: green wifi icon
//    #2BEE79 + "Secure Connection Established" fs9 w500
// ════════════════════════════════════════════════════════════════

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
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 55.w),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Game icon — Figma: 112×112 r25 ─────────────────────
              FadeTransition(
                opacity: _fadeIn,
                child: Container(
                  width: 112.w, height: 112.w,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(25.r),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Center(
                    child: Text('G',
                        style: TextStyle(
                            color: context.cyan,
                            fontSize: 56.sp,
                            fontWeight: FontWeight.w900)),
                  ),
                ),
              ),

              const Spacer(flex: 2),

              // ── Title — Figma: "WELCOME TO GAMEARN" fs32 w700 ─────
              FadeTransition(
                opacity: _fadeIn,
                child: Text(
                  'WELCOME TO\nGAMEARN',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32.sp,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),

              const Spacer(flex: 4),

              // ── Loading section — matches Figma Loading component ──
              SizedBox(
                width: 280.w,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Initializing Arena...',
                            style: TextStyle(
                                color: const Color(0xFFF1F5F9),
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600)),
                        AnimatedBuilder(
                          animation: _progress,
                          builder: (_, __) => Text(
                            '${(_progress.value * 100).round()}%',
                            style: TextStyle(
                                color: kOrange,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 6.h),
                    AnimatedBuilder(
                      animation: _progress,
                      builder: (_, __) => Container(
                        height: 6.h,
                        decoration: BoxDecoration(
                          color: const Color(0x801E293B),
                          borderRadius: BorderRadius.circular(9999.r),
                          border: Border.all(
                              color: const Color(0x0DFFFFFF), width: 1),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: _progress.value,
                          child: Container(
                            height: 4.h,
                            margin: EdgeInsets.all(1.r),
                            decoration: BoxDecoration(
                              color: kCyan,
                              borderRadius: BorderRadius.circular(9999.r),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 2),

              // ── Connectivity — Figma: green icon + fs9 text ────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wifi_rounded,
                      color: const Color(0xFF2BEE79), size: 14.w),
                  SizedBox(width: 6.w),
                  Text('Secure Connection Established',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9.sp,
                          fontWeight: FontWeight.w500)),
                ],
              ),
              SizedBox(height: 32.h),
            ],
          ),
        ),
      ),
    );
  }
}
