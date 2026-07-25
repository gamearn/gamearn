import 'package:flutter/material.dart';
import '../../theme.dart';
import 'admin_dashboard_screen.dart';
import 'users_management_screen.dart';
import 'withdrawal_management_screen.dart';
import 'tournament_overview_screen.dart';
import 'transactions_overview_screen.dart';

// ---------------------------------------------------------------------------
// AdminShell — role-gated admin module with its own bottom nav
// Only accessible when user.role == 'admin'
// ---------------------------------------------------------------------------

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _currentIndex = 0;

  static const _pages = [
    AdminDashboardScreen(),
    UsersManagementScreen(),
    WithdrawalManagementScreen(),
    TournamentOverviewScreen(),
    TransactionsOverviewScreen(),
  ];

  static const _labels = [
    'Dashboard',
    'Users',
    'Withdrawals',
    'Tournaments',
    'Finance',
  ];

  static const _icons = [
    Icons.dashboard_outlined,
    Icons.people_outline_rounded,
    Icons.account_balance_outlined,
    Icons.emoji_events_outlined,
    Icons.receipt_long_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        height: 72,
        decoration: const BoxDecoration(
          color: Color(0xFF0B0E1A),
          border: Border(
            top: BorderSide(color: Color(0xFF1E293B), width: 1),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(_labels.length, (i) {
            final active = _currentIndex == i;
            return GestureDetector(
              onTap: () => setState(() => _currentIndex = i),
              behavior: HitTestBehavior.opaque,
              child: SizedBox(
                width: 64,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AnimatedScale(
                      scale: active ? 1.15 : 1.0,
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOut,
                      child: Icon(
                        _icons[i],
                        color: active ? kOrange : Colors.white54,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _labels[i],
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight:
                            active ? FontWeight.w600 : FontWeight.w400,
                        color:
                            active ? const Color(0xFFFF5E00) : Colors.white54,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
