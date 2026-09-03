import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  LOADING SCREEN — Figma matched (1187:137, "Loading Section
//  animation") — animated single progress bar
//
//  Row: "Initializing Arena..." fs12 #F1F5F9 w600 (left) · "15%"
//    fs12 #FF5E00 w500 (right) · bar 280×6 #1E293B@0.5 stroke
//    white@0.05 r9999 · cyan fill #22D1EE 4px
// ════════════════════════════════════════════════════════════════

class LoadingScreen extends StatefulWidget {
  final String message;
  const LoadingScreen({super.key, this.message = 'Initializing Arena...'});
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
          padding: EdgeInsets.all(40.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo glow
              Container(
                width: 120.w, height: 120.h,
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
                          fontSize: 56.sp,
                          fontWeight: FontWeight.w900)),
                ),
              ),
              SizedBox(height: 48.h),
              SizedBox(
                width: 280.w,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Label + percent — Figma: fs12 #F1F5F9 w600 /
                    // fs12 #FF5E00 w500
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(widget.message,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600)),
                        AnimatedBuilder(
                          animation: _progress,
                          builder: (_, __) {
                            return Text(
                                '${(_progress.value * 100).round()}%',
                                style: TextStyle(
                                    color: kOrange,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w500));
                          },
                        ),
                      ],
                    ),
                    SizedBox(height: 6.h),
                    // Bar — Figma: 280×6 #1E293B@0.5 stroke
                    // white@0.05, cyan fill 4px
                    Container(
                      height: 6.h,
                      decoration: BoxDecoration(
                        color: context.border.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(9999.r),
                        border: Border.all(
                            color: const Color(0x0DFFFFFF), width: 1),
                      ),
                      child: AnimatedBuilder(
                        animation: _progress,
                        builder: (_, __) {
                          return FractionallySizedBox(
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
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
