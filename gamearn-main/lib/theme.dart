import 'package:flutter/material.dart';

// ── Brand Colours ─────────────────────────────────────────────────────────────
const Color kBgDeep    = Color(0xFF0A0E1A);   // main dark bg
const Color kBgCard    = Color(0xFF111827);   // card surfaces
const Color kBgCardAlt = Color(0xFF0F1829);   // subtle alt card
const Color kBgTeal    = Color(0xFF0D2231);   // teal-tinted card bg
const Color kCyan      = Color(0xFF00E5FF);   // primary cyan accent
const Color kOrange    = Color(0xFFFF6D00);   // primary orange (CTAs)
const Color kGreen     = Color(0xFF00E676);   // success / live now
const Color kYellowDot = Color(0xFFFFC107);   // pending dot
const Color kTextPri   = Color(0xFFFFFFFF);
const Color kTextSec   = Color(0xFF8899AA);
const Color kTextMuted = Color(0xFF4A5568);
const Color kBorder    = Color(0xFF1A2744);
const Color kDivider   = Color(0xFF1F2937);

// Light-theme auth screens
const Color kLightBg   = Color(0xFFF5F7FA);
const Color kLightCard = Color(0xFFEAEDF1);
const Color kLightText = Color(0xFF1A1A2E);
const Color kLightSub  = Color(0xFF6B7280);

// ── Avatars (local asset names → replace with real images) ───────────────────
const List<Map<String, String>> kAvatars = [
  {'name': 'BOT',   'emoji': '🤖'},
  {'name': 'MAGE',  'emoji': '🧙'},
  {'name': 'CYBER', 'emoji': '🦾'},
  {'name': 'QUEEN', 'emoji': '👑'},
  {'name': 'CYBER2','emoji': '🦿'},
];

// ── TextStyles ────────────────────────────────────────────────────────────────
const TextStyle kTitle = TextStyle(
  color: kTextPri, fontSize: 20,
  fontWeight: FontWeight.w700, letterSpacing: 0.3,
);
const TextStyle kSub = TextStyle(
  color: kTextSec, fontSize: 13,
);
const TextStyle kLabel = TextStyle(
  color: kTextMuted, fontSize: 11, letterSpacing: 0.8,
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
  fontFamily: 'Roboto',
);

ThemeData get kLightTheme => ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: kLightBg,
  colorScheme: const ColorScheme.light(
    primary: kCyan,
    secondary: kOrange,
    surface: kLightCard,
    onSurface: kLightText,
  ),
  textTheme: const TextTheme(
    bodyLarge: TextStyle(color: kLightText),
    bodyMedium: TextStyle(color: kLightSub),
  ),
  useMaterial3: true,
  fontFamily: 'Roboto',
);

extension AppTheme on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get bg => Theme.of(this).scaffoldBackgroundColor;
  Color get card => Theme.of(this).colorScheme.surface;
  Color get txtPri => isDark ? kTextPri : kLightText;
  Color get txtSec => isDark ? kTextSec : kLightSub;
  Color get border => isDark ? kBorder : const Color(0xFFDDE1E7);
}

class ThemeNotifier extends ChangeNotifier {
  ThemeNotifier._();
  static final ThemeNotifier instance = ThemeNotifier._();

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
