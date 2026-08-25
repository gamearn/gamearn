import 'package:flutter/material.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as sh;
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// Gamearn buttons — thin wrappers around shadcn themed buttons.
/// Colors come from the shadcn ColorScheme already configured in gamearn_shadcn.dart.
///
/// Usage:
/// ```dart
/// GaButton.primary(label: 'Play', onPressed: () {})
/// GaButton(label: 'Skip', onPressed: () {}, variant: GaButtonVariant.ghost)
/// ```
class GaButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String label;
  final Widget? leading;
  final Widget? trailing;
  final bool isLoading;
  final bool isSmall;
  final bool isWide;
  final GaButtonVariant variant;

  const GaButton({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
    this.variant = GaButtonVariant.primary,
  });

  const GaButton.primary({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
  }) : variant = GaButtonVariant.primary;

  const GaButton.secondary({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
  }) : variant = GaButtonVariant.secondary;

  const GaButton.outline({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
  }) : variant = GaButtonVariant.outline;

  const GaButton.ghost({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
  }) : variant = GaButtonVariant.ghost;

  const GaButton.destructive({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = true,
  }) : variant = GaButtonVariant.destructive;

  const GaButton.text({
    super.key,
    required this.onPressed,
    required this.label,
    this.leading,
    this.trailing,
    this.isLoading = false,
    this.isSmall = false,
    this.isWide = false,
  }) : variant = GaButtonVariant.text;

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? SizedBox(
            width: 18.w,
            height: 18.w,
            child: const sh.CircularProgressIndicator(strokeWidth: 2),
          )
        : Row(
            mainAxisSize: isWide ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (leading != null) ...[leading!, SizedBox(width: 8.w)],
              Text(label),
              if (trailing != null) ...[SizedBox(width: 8.w), trailing!],
            ],
          );

    return sh.Button(
      onPressed: isLoading ? null : onPressed,
      style: _style(),
      child: child,
    );
  }

  sh.ButtonStyle _style() {
    final size = isSmall ? sh.ButtonSize.small : sh.ButtonSize.normal;
    return switch (variant) {
      GaButtonVariant.primary =>
        sh.ButtonStyle(variance: sh.ButtonVariance.primary, size: size),
      GaButtonVariant.secondary =>
        sh.ButtonStyle(variance: sh.ButtonVariance.secondary, size: size),
      GaButtonVariant.outline =>
        sh.ButtonStyle(variance: sh.ButtonVariance.outline, size: size),
      GaButtonVariant.ghost =>
        sh.ButtonStyle(variance: sh.ButtonVariance.ghost, size: size),
      GaButtonVariant.destructive =>
        sh.ButtonStyle(variance: sh.ButtonVariance.destructive, size: size),
      GaButtonVariant.text =>
        sh.ButtonStyle(variance: sh.ButtonVariance.text, size: size),
    };
  }
}

enum GaButtonVariant { primary, secondary, outline, ghost, destructive, text }
