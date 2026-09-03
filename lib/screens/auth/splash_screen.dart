import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:http/http.dart' as http;
import '../../theme.dart';
import '../../config/api_config.dart';
import 'dart:convert';

// ════════════════════════════════════════════════════════════════
//  SPLASH SCREEN — Figma matched (1044:286 "iPhone 13 & 14 - 3")
//
//  bg #0B0E1A + bottom glow · Game icon 112×112 r25 (#0B0E1A +
//    logo) · "WELCOME TO GAMEARN" fs32 white w700 · loading
//    section 280 wide: "Initializing Arena..." fs12 #F1F5F9 w600 +
//    % fs12 #FF5E00 w500 · bar 280×6 #1E293B@0.5 stroke
//    white@0.05, cyan fill 4px · connectivity row: green wifi icon
//    #2BEE79 + "Secure Connection Established" fs9 w500
//
//  Plays on EVERY launch. While the 2.8s animation runs it also does
//  real bootstrap in parallel — pings the backend /health endpoint
//  and preloads the interstitial/rewarded ads — so the arena is warm
//  before gameplay. onComplete fires only after the animation AND the
//  bootstrap (or a hard 5s timeout) both finish.
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

  // Bootstrap state surfaced on the connectivity row.
  String _bootstrapStatus = 'Connecting to Arena...';
  bool _bootDone = false;

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

    _ctrl.forward();
    _runBootstrap();
  }

  /// Run real startup work in parallel with the animation:
  ///  - ping the backend /health endpoint (doubles as the network check)
  /// Completes only after the animation AND the ping settle, but never
  /// blocks longer than a ~4s hard cap so a down backend can't stall launch.
  ///
  /// (Ads are already initialised + preloaded in main() before runApp, so the
  /// splash only handles connectivity/bootstrap here to avoid double loads.)
  Future<void> _runBootstrap() async {
    try {
      // Race animation + backend ping against a hard 4s cap so a slow or
      // unreachable backend can never stall the splash indefinitely.
      final readys = <Future<void>>[
        _ctrl.forward().orCancel,
        _pingBackend(),
      ];
      await Future.any<void>([
        Future.wait(readys).then((_) {}),
        Future<void>.delayed(const Duration(milliseconds: 4000)),
      ]).catchError((_) {});
    } catch (e) {
      debugPrint('[Splash] bootstrap error: $e');
    } finally {
      if (!mounted) return;
      widget.onComplete();
    }
  }

  Future<void> _pingBackend() async {
    final stopwatch = Stopwatch()..start();
    try {
      final uri = Uri.parse('${ApiConfig.nodeBaseUrl}/health');
      final res = await http
          .get(uri)
          .timeout(const Duration(seconds: 8));
      final decoded = res.body.isNotEmpty ? jsonDecode(res.body) : null;
      final healthy = res.statusCode == 200 &&
          decoded is Map<String, dynamic> &&
          decoded['success'] == true;
      _markConnectivity(
          healthy ? 'Secure Connection Established' : 'Backend degraded');
    } catch (e) {
      debugPrint('[Splash] backend ping failed: $e');
      _markConnectivity('Reconnecting...');
    }
    stopwatch.stop();
    // Debug-only timing note (no user-visible text).
    debugPrint('[Splash] backend ping: ${stopwatch.elapsedMilliseconds}ms');
  }

  void _markConnectivity(String status) {
    if (!mounted) return;
    setState(() {
      _bootstrapStatus = status;
      _bootDone = true;
    });
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
                    borderRadius: BorderRadius.circular(25.r),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset(
                    'assets/logos/logo_icon.png',
                    width: 112.w,
                    height: 112.w,
                    fit: BoxFit.cover,
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

              // ── Connectivity — Figma: icon + fs9 text ───────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wifi_rounded,
                      color: _bootDone
                          ? (_bootstrapStatus == 'Secure Connection Established'
                              ? const Color(0xFF2BEE79)
                              : kOrange)
                          : const Color(0xFF2BEE79),
                      size: 14.w),
                  SizedBox(width: 6.w),
                  Text(_bootstrapStatus,
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
