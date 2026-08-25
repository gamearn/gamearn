import 'package:flutter/material.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as sh;
import '../theme.dart';

// ── Gamearn Dark ColorScheme for shadcn_flutter ──────────────────────────────
// GTBank-inspired: clean, minimal, generous spacing. Dark-first.
const sh.ColorScheme kGamearnDarkScheme = sh.ColorScheme(
  brightness: Brightness.dark,
  background: kBgDeep,           // #0B0E1A
  foreground: kTextPri,          // #F1F5F9
  card: kBgCard,                 // #0F172A
  cardForeground: kTextPri,      // #F1F5F9
  popover: kBgCard,
  popoverForeground: kTextPri,
  primary: kOrange,              // #FF5E00 — main CTA
  primaryForeground: Colors.white,
  secondary: kCyan,              // #22D1EE — accent
  secondaryForeground: kBgDeep,
  muted: Color(0xFF1E293B),      // subtle muted surface
  mutedForeground: kTextSec,     // #94A3B8
  accent: kBgCardAlt,            // #16223F
  accentForeground: kTextPri,
  destructive: Color(0xFFEF4444),
  border: kBorder,               // #1E293B
  input: Color(0xFF1E293B),
  ring: kCyan,                   // focus ring = cyan
  chart1: kOrange,
  chart2: kCyan,
  chart3: kGreen,
  chart4: kYellowDot,
  chart5: Color(0xFF8B5CF6),
);

// ── Gamearn Light ColorScheme for shadcn_flutter ─────────────────────────────
const sh.ColorScheme kGamearnLightScheme = sh.ColorScheme(
  brightness: Brightness.light,
  background: kLightBg,          // #EFF5FF
  foreground: kLightText,        // #0B0E1A
  card: Colors.white,
  cardForeground: kLightText,
  popover: Colors.white,
  popoverForeground: kLightText,
  primary: kOrange,
  primaryForeground: Colors.white,
  secondary: kCyan,
  secondaryForeground: kBgDeep,
  muted: Color(0xFFF1F5F9),
  mutedForeground: kLightSub,
  accent: Color(0xFFE2E8F0),
  accentForeground: kLightText,
  destructive: Color(0xFFEF4444),
  border: Color(0xFFE2E8F0),
  input: Color(0xFFE2E8F0),
  ring: kCyan,
  chart1: kOrange,
  chart2: kCyan,
  chart3: kGreen,
  chart4: kYellowDot,
  chart5: Color(0xFF8B5CF6),
);

// ── Shadcn ThemeData builders ────────────────────────────────────────────────
// ignore: prefer_const_constructors
sh.ThemeData kGamearnDarkShadcnTheme = sh.ThemeData(
  colorScheme: kGamearnDarkScheme,
  radius: 0.75,
  scaling: 1.0,
);

// ignore: prefer_const_constructors
sh.ThemeData kGamearnLightShadcnTheme = sh.ThemeData(
  colorScheme: kGamearnLightScheme,
  radius: 0.75,
  scaling: 1.0,
);
