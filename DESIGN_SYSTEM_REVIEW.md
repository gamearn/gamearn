# Gamearn Design System — What We Did & What's Next

**Date:** 25 August 2026
**Author:** Victor (dev) — for Larry (design) review
**Repo:** https://github.com/gamearn/gamearn

---

## 1. Context & Direction

The client specifically asked for **simplicity** — inspired by GTBank's mobile app. The philosophy:

> "With such a simple design, the app can do many things."

This means: clean surfaces, generous whitespace, one strong primary action per screen, minimal visual noise. We are **not** trying to match the Figma pixel-for-pixel anymore — we are upgrading the UI to be better, simpler, and more production-ready.

---

## 2. What We Did (Completed)

### 2a. Integrated `shadcn_flutter` (v0.0.47)

**Why:** A lightweight, shadcn/ui-inspired Flutter component library. Gives us production-grade buttons, cards, inputs, badges, dialogs, tabs, etc. — all themed automatically from a single `ColorScheme`. No Material bloat.

**How it's wired:** `ShadcnLayer` wraps the existing `MaterialApp` in `main.dart`. This is **non-breaking** — all existing Material widgets continue to work. We adopt shadcn components gradually, screen by screen.

### 2b. Created Gamearn ColorScheme (`lib/theme/gamearn_shadcn.dart`)

All **existing brand colors** are mapped into shadcn's color slots:

| Color Slot | Dark Theme | Light Theme | Source |
|---|---|---|---|
| `background` | `#0B0E1A` (kBgDeep) | `#EFF5FF` (kLightBg) | Existing |
| `foreground` (text) | `#F1F5F9` (kTextPri) | `#0B0E1A` (kLightText) | Existing |
| `card` | `#0F172A` (kBgCard) | `#FFFFFF` | Existing |
| `primary` (CTA) | `#FF5E00` (kOrange) | `#FF5E00` (kOrange) | Existing |
| `secondary` (accent) | `#22D1EE` (kCyan) | `#22D1EE` (kCyan) | Existing |
| `border` | `#1E293B` (kBorder) | `#E2E8F0` | Existing |
| `ring` (focus) | `#22D1EE` (kCyan) | `#22D1EE` (kCyan) | Existing |
| `destructive` (error) | `#EF4444` | `#EF4444` | Existing (error red) |
| `muted` | `#1E293B` | `#F1F5F9` | Derived from existing |
| `accent` | `#16223F` (kBgCardAlt) | `#E2E8F0` | Existing |

**No new colors were introduced.** Every value comes from `theme.dart`.

### 2c. Created Reusable Components (`lib/widgets/`)

All components live in `lib/widgets/` and can be imported via:
```dart
import 'package:gamearn/widgets/gamearn_ui.dart';
```

---

#### GaButton (`ga_button.dart`)

Six variants, all automatically themed from the ColorScheme:

| Variant | Appearance | When to Use |
|---|---|---|
| `GaButton.primary()` | Solid orange fill, white text | Main CTA (Play, Submit, Verify) |
| `GaButton.secondary()` | Solid cyan fill, dark text | Secondary action (Cancel, Back) |
| `GaButton.outline()` | Border only, no fill | Tertiary action (Create Account) |
| `GaButton.ghost()` | No background, no border | Minimal action (Skip, Forgot Password?) |
| `GaButton.destructive()` | Solid red fill | Delete/remove actions |
| `GaButton.text()` | Just text, no container | Inline links (Already have account?) |

**Features:**
- `isLoading` — shows spinner, disables tap
- `isSmall` — compact variant for tight spaces
- `isWide` — full-width (default) or inline
- `leading` / `trailing` — optional icon widgets

**Example:**
```dart
GaButton.primary(
  label: 'Play Now',
  onPressed: () {},
  isLoading: _loading,
)
```

---

#### GaCard (`ga_card.dart`)

| Component | Appearance |
|---|---|
| `GaCard` | Flat surface, `kBgCard` background, subtle `kBorder` border, 16px radius |
| `GaCardElevated` | Gradient surface (kBgCard → kBgCardAlt), same border |

**Features:**
- `onTap` — optional tap handler
- `padding` / `margin` — customizable
- `color` — override background color

---

#### GaInput (`ga_input.dart`)

Clean text input with:
- Optional `labelText` above the field
- `hintText` placeholder
- `prefixIcon` / `suffix` widgets
- `obscureText` for passwords
- `validator` for form validation
- Focus state: cyan border
- Error state: red border
- Disabled state: dimmed fill

---

#### GaBadge (`ga_badge.dart`)

Status indicators with optional animated dot:

| Variant | Color | Dot |
|---|---|---|
| `GaBadge.live(label: 'Live')` | Green (`kGreen`) | Yes |
| `GaBadge.pending(label: 'Pending')` | Yellow (`kYellowDot`) | Yes |
| `GaBadge.error(label: 'Failed')` | Red (`#EF4444`) | No |
| `GaBadge.accent(label: 'VIP')` | Cyan (`kCyan`) | No |
| `GaBadge(label: 'Draft')` | Muted | No |

---

## 3. What Needs Doing (Next Steps)

### 3a. Replace Buttons in Auth Screens (Priority: HIGH)

| Screen | Current | Replace With |
|---|---|---|
| **Login** (line 255) | `ElevatedButton` (orange) | `GaButton.primary` |
| **Login** (line 228) | `TextButton` ("Forgot Password?") | `GaButton.ghost` |
| **Login** (line 318) | `OutlinedButton` ("Create New Account") | `GaButton.outline` |
| **Landing** (line 154) | `ElevatedButton` ("Create Account") | `GaButton.primary` |
| **Landing** (line 179) | `OutlinedButton` ("Log In") | `GaButton.outline` |
| **Landing** (lines 229-258) | `_FrostedSocialButton` (3x) | `GaButton.outline` with social icons |
| **Register** (line 671) | `ElevatedButton` ("Create Account") | `GaButton.primary` |
| **Register** (line 722) | `TextButton` ("Already have account?") | `GaButton.text` |
| **OTP** (line 345) | `ElevatedButton` ("Verify & Continue") | `GaButton.primary` |
| **OTP** (line 327) | `GestureDetector` ("Resend Code") | `GaButton.text` |
| **Forgot Password** (line 152) | `ElevatedButton` ("Send Reset Link") | `GaButton.primary` |
| **Forgot Password** (line 219) | `ElevatedButton` ("Back to Login") | `GaButton.primary` |
| **Forgot Password** (line 235) | `TextButton` ("Didn't receive it?") | `GaButton.text` |
| **Reset Password** (line 246) | `ElevatedButton` ("Update Password") | `GaButton.primary` |
| **Reset Password** (line 314) | `ElevatedButton` ("Back to Login") | `GaButton.primary` |

**Total: 15 button replacements across 6 screens**

### 3b. Replace Text Inputs in Auth Screens (Priority: MEDIUM)

| Screen | Count | Fields |
|---|---|---|
| **Login** | 2 | email, password |
| **Register** | 4 | name, email, phone, password |
| **Forgot Password** | 1 | email |
| **Reset Password** | 2 | new password, confirm password |

**Total: 9 input replacements across 4 screens**

OTP uses `Pinput` (specialized pin widget) — keep as-is.

### 3c. Clean Up Pre-existing Lint Warnings (Priority: LOW)

- `lib/widgets/brand_logo.dart` — `unused_import` (dart:math)
- Game/tournament screens — `unused_element`, `unused_field`
- `pubspec.yaml` line 106 — stale `packages/intl_phone_number_input/assets/flags/` entry

### 3d. Build, Test & Release (Priority: HIGH)

After steps 3a-3b:
1. `dart analyze` — zero errors
2. Push to `main` → CI runs analyze + debug APK build
3. Tag `v2.0.17` for release
4. Test on physical device (Android + iOS)

---

## 4. Design Principles (For Larry's Review)

1. **One primary action per screen.** The orange CTA should be the most prominent element. Everything else is secondary/ghost/outline.

2. **No heavy shadows.** Cards use subtle 0.5px borders, not drop shadows.

3. **Generous touch targets.** All buttons minimum 48px tall (WCAG 2.5.8). Inputs 56px. Padding 16-24px.

4. **Consistent border radius.** All elements 12-16px. No sharp corners except badges (fully rounded).

5. **Color restraint.** Only 2 brand colors: orange (primary) and cyan (accent). Everything else neutral. Red only for errors.

6. **Typography.** Spline Sans only. Bold (700) headings, Medium (500) labels, Regular (400) body.

7. **Dark theme is primary.** Dark is the default and should look best.

---

## 5. File Inventory

| File | Status | Description |
|---|---|---|
| `lib/theme/gamearn_shadcn.dart` | **NEW** | shadcn ColorScheme + ThemeData |
| `lib/widgets/ga_button.dart` | **NEW** | 6-variant button component |
| `lib/widgets/ga_card.dart` | **NEW** | Flat + elevated card components |
| `lib/widgets/ga_input.dart` | **NEW** | Themed text input component |
| `lib/widgets/ga_badge.dart` | **NEW** | Status badge component |
| `lib/widgets/gamearn_ui.dart` | **NEW** | Barrel export |
| `lib/main.dart` | **MODIFIED** | Added ShadcnLayer wrapper |
| `pubspec.yaml` | **MODIFIED** | Added `shadcn_flutter` |
| `lib/theme.dart` | **UNCHANGED** | Existing brand colors intact |
| All `lib/screens/auth/*.dart` | **UNCHANGED** | Buttons/inputs NOT yet replaced |

---

## 6. Questions for Larry

1. **Button style:** Solid orange CTA — right? Or prefer gradient / outlined primary?
2. **Card borders:** 0.5px `kBorder` (#1E293B). Too subtle? Too visible?
3. **Social login buttons:** Currently frosted glass. Standard `GaButton.outline` or keep glass?
4. **Avatar containers:** Left as-is (80x80 white border). Confirm OK?
5. **OTP pin boxes:** Kept as-is (6 boxes). Keep or replace with shadcn `InputOTP`?
6. **Additional components needed?** shadcn has tabs, dialogs, bottom sheets, steppers, etc. available.

---

*Document generated 25 August 2026. Commit `1dcadf9` on main.*
