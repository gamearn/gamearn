import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../theme.dart';

/// Clean status badges for Gamearn.
/// Used for: live status, win/loss, pending, etc.
class GaBadge extends StatelessWidget {
  final String label;
  final GaBadgeVariant variant;
  final bool showDot;

  const GaBadge({
    super.key,
    required this.label,
    this.variant = GaBadgeVariant.default$,
    this.showDot = false,
  });

  const GaBadge.live({
    super.key,
    required this.label,
  })  : variant = GaBadgeVariant.success,
        showDot = true;

  const GaBadge.pending({
    super.key,
    required this.label,
  })  : variant = GaBadgeVariant.warning,
        showDot = true;

  const GaBadge.error({
    super.key,
    required this.label,
  })  : variant = GaBadgeVariant.destructive,
        showDot = false;

  const GaBadge.accent({
    super.key,
    required this.label,
  })  : variant = GaBadgeVariant.accent,
        showDot = false;

  @override
  Widget build(BuildContext context) {
    final (bgColor, textColor, dotColor) = _colors();

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6.w,
              height: 6.w,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
              ),
            ),
            SizedBox(width: 5.w),
          ],
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 11.sp,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color, Color) _colors() {
    switch (variant) {
      case GaBadgeVariant.default$:
        return (kBgCardAlt, kTextSec, kTextSec);
      case GaBadgeVariant.success:
        return (kGreen.withValues(alpha: 0.15), kGreen, kGreen);
      case GaBadgeVariant.warning:
        return (kYellowDot.withValues(alpha: 0.15), kYellowDot, kYellowDot);
      case GaBadgeVariant.destructive:
        return (const Color(0xFFEF4444).withValues(alpha: 0.15), const Color(0xFFEF4444), const Color(0xFFEF4444));
      case GaBadgeVariant.accent:
        return (kCyan.withValues(alpha: 0.15), kCyan, kCyan);
      case GaBadgeVariant.primary:
        return (kOrange.withValues(alpha: 0.15), kOrange, kOrange);
    }
  }
}

enum GaBadgeVariant { default$, success, warning, destructive, accent, primary }
