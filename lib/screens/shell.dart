import 'package:flutter/material.dart';
import '../theme.dart';
import '../widgets/gamearn_icons.dart';
import 'home/home_screen.dart';
import 'tour/tour_screen.dart';
import 'wallet/wallet_screen.dart';
import 'profile/profile_screen.dart';

class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _currentIndex = 0;

  static const _pages = [
    HomeScreen(),
    TourScreen(),
    WalletScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: GamearnBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}



// ── Logo Widget (reusable across the app) ─────────────────────────────────────
/// Use this anywhere you need the Gamearn logo.
/// Automatically picks dark/light variant based on current theme.
class GamearnLogo extends StatelessWidget {
  final double size;
  final bool iconOnly; // true = logo_icon.png (no text), false = full logo

  const GamearnLogo({
    super.key,
    this.size = 40,
    this.iconOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final String asset;
    if (iconOnly) {
      asset = 'assets/logos/logo_icon.png';
    } else {
      asset = isDark
          ? 'assets/logos/logo_dark.png'
          : 'assets/logos/logo_light.png';
    }

    return Image.asset(
      asset,
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }
}


