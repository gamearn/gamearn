import 'package:flutter/material.dart';
import '../theme.dart';
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
      backgroundColor: kBgDeep,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: _GamearnBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
class _GamearnBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  const _GamearnBottomNav(
      {required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    const items = [
      _NavItem(
          icon: Icons.home_outlined,
          activeIcon: Icons.home_rounded,
          label: 'Home'),
      _NavItem(
          icon: Icons.emoji_events_outlined,
          activeIcon: Icons.emoji_events,
          label: 'Tour'),
      _NavItem(
          icon: Icons.account_balance_wallet_outlined,
          activeIcon: Icons.account_balance_wallet,
          label: 'Wallet'),
      _NavItem(
          icon: Icons.person_outline,
          activeIcon: Icons.person,
          label: 'Profile'),
    ];

    return Container(
      decoration: const BoxDecoration(
        color: kBgCard,
        border: Border(top: BorderSide(color: kBorder, width: 0.5)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: List.generate(items.length, (i) {
              final selected = i == currentIndex;
              return Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => onTap(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        selected ? items[i].activeIcon : items[i].icon,
                        color: selected ? kOrange : kTextSec,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        items[i].label,
                        style: TextStyle(
                          color: selected ? kOrange : kTextSec,
                          fontSize: 10,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
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

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(
      {required this.icon, required this.activeIcon, required this.label});
}
