import 'package:flutter/material.dart';

// ── Brand Colours ─────────────────────────────────────────────────────────────
const Color kBgDeep = Color(0xFF0B0E1A); // main dark bg
const Color kBgCard = Color(0xFF0F172A); // card surfaces
const Color kBgCardAlt = Color(0xFF16223F); // subtle alt card
const Color kBgTeal = Color(0xFF0D2231); // teal-tinted card bg
const Color kCyan = Color(0xFF22D1EE); // primary cyan accent
const Color kOrange = Color(0xFFFF5E00); // primary orange (CTAs)
const Color kGreen = Color(0xFF22C55E); // success / live now
const Color kYellowDot = Color(0xFFFFC107); // pending dot
const Color kTextPri = Color(0xFFF1F5F9);
const Color kTextSec = Color(0xFF94A3B8);
const Color kTextMuted = Color(0xFF64748B);
const Color kBorder = Color(0xFF1E293B);
const Color kDivider = Color(0xFF1E293B);
const Color kOtpBox = Color(0xFF1A2238); // OTP pin input boxes

// Light-theme auth screens
const Color kLightBg = Color(0xFFEFF5FF);
const Color kLightCard = Color(0xFFFFFFFF);
const Color kLightText = Color(0xFF0B0E1A);
const Color kLightSub = Color(0xFF64748B);

// ── Avatars (local asset names → replace with real images) ───────────────────
const List<Map<String, String>> kAvatars = [
  {'name': 'BOT', 'emoji': '🤖'},
  {'name': 'Mage', 'emoji': '🧙'},
  {'name': 'Cyber', 'emoji': '🦾'},
  {'name': 'Queen', 'emoji': '👑'},
  {'name': 'Cyborg', 'emoji': '🦿'},
  {'name': 'Knight', 'emoji': '🗡️'},
  {'name': 'Hunter', 'emoji': '🏹'},
  {'name': 'Ninja', 'emoji': '🥷'},
  {'name': 'Xeno', 'emoji': '👾'},
];

// ── TextStyles ────────────────────────────────────────────────────────────────
const TextStyle kTitle = TextStyle(
  color: kTextPri,
  fontSize: 20,
  fontWeight: FontWeight.w700,
  letterSpacing: 0.3,
);
const TextStyle kSub = TextStyle(
  color: kTextSec,
  fontSize: 13,
);
const TextStyle kLabel = TextStyle(
  color: kTextMuted,
  fontSize: 11,
  letterSpacing: 0.8,
  fontWeight: FontWeight.w600,
);

// ── ThemeData ─────────────────────────────────────────────────────────────────
ThemeData get kDarkTheme => ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: kBgDeep,
      colorScheme: const ColorScheme.dark(
        primary: kCyan,
        secondary: kOrange,
        surface: kBgCard,
        onSurface: kTextPri,
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: kTextPri),
        bodyMedium: TextStyle(color: kTextSec),
      ),
      useMaterial3: true,
      fontFamily: 'SplineSans',
    );

ThemeData get kLightTheme => ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: kLightBg,
      colorScheme: const ColorScheme.light(
        primary: kCyan,
        secondary: kOrange,
        surface: kLightCard,
        onSurface: kLightText,
        onPrimary: Colors.white, // text ON cyan buttons
        onSecondary: Colors.white, // text ON orange buttons
      ),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: kLightText),
        bodyMedium: TextStyle(color: kLightSub),
        titleLarge: TextStyle(color: kLightText, fontWeight: FontWeight.w700),
      ),
      iconTheme: const IconThemeData(color: kLightText),
      appBarTheme: const AppBarTheme(
        backgroundColor: kLightBg,
        foregroundColor: kLightText,
        elevation: 0,
      ),
      useMaterial3: true,
      fontFamily: 'SplineSans',
    );

extension AppTheme on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get bg => Theme.of(this).scaffoldBackgroundColor;
  Color get card => Theme.of(this).colorScheme.surface;
  Color get txtPri => isDark ? kTextPri : kLightText;
  Color get txtSec => isDark ? kTextSec : kLightSub;
  Color get border => isDark ? kBorder : const Color(0xFFC2C9D4);

  // Mappings for the new screens to maintain strict color safety
  Color get surface => card;
  Color get subText => txtSec;
  Color get cyan => kCyan;
  Color get orange => kOrange;
  TextStyle get titleStyle => kTitle;
}

class ThemeNotifier extends ChangeNotifier {
  ThemeNotifier._();
  static final ThemeNotifier instance = ThemeNotifier._();

  // null = follow system, true = force dark, false = force light.
  // Starts as null so the app respects the device theme on first launch.
  bool? _forceDark;

  bool? get forceDark => _forceDark;

  ThemeMode get themeMode {
    if (_forceDark == null) return ThemeMode.system;
    return _forceDark! ? ThemeMode.dark : ThemeMode.light;
  }

  void setTheme(bool? val) {
    _forceDark = val;
    notifyListeners();
  }
}
