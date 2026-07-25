import 'package:flutter/material.dart';
import '../../theme.dart';

// ---------------------------------------------------------------------------
// AdminDashboardScreen — overview stats + recent activity
// ---------------------------------------------------------------------------

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.admin_panel_settings_outlined,
                    color: kOrange, size: 22),
              ),
              const SizedBox(width: 14),
              const Text('Admin Dashboard',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          const SizedBox(height: 20),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                // Stats grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: const [
                    _StatCard(
                      icon: Icons.people_outline_rounded,
                      label: 'Total Users',
                      value: '12,847',
                      change: '+234 this week',
                      color: kCyan,
                    ),
                    _StatCard(
                      icon: Icons.circle_outlined,
                      label: 'Live Now',
                      value: '1,203',
                      change: 'Currently active',
                      color: Color(0xFF00E676),
                    ),
                    _StatCard(
                      icon: Icons.monetization_on_outlined,
                      label: 'Revenue',
                      value: '₦4.2M',
                      change: '+18% this month',
                      color: kOrange,
                    ),
                    _StatCard(
                      icon: Icons.pending_outlined,
                      label: 'Pending Payouts',
                      value: '₦890K',
                      change: '47 requests',
                      color: kYellowDot,
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Quick actions
                const Text('QUICK ACTIONS',
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _ActionRow(
                    icon: Icons.check_circle_outline,
                    label: 'Review Withdrawals',
                    subtitle: '47 pending',
                    color: kOrange,
                    onTap: () {},
                  ),
                  _divider(),
                  _ActionRow(
                    icon: Icons.people_outline_rounded,
                    label: 'Manage Users',
                    subtitle: '12,847 total',
                    color: kCyan,
                    onTap: () {},
                  ),
                  _divider(),
                  _ActionRow(
                    icon: Icons.emoji_events_outlined,
                    label: 'Tournament Overview',
                    subtitle: '12 active',
                    color: const Color(0xFF00E676),
                    onTap: () {},
                  ),
                ]),

                const SizedBox(height: 24),

                // Recent activity
                const Text('RECENT ACTIVITY',
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _ActivityRow(
                    icon: Icons.person_add_outlined,
                    title: 'New user registered',
                    subtitle: 'kofi_92 joined via Google',
                    time: '2m ago',
                  ),
                  _divider(),
                  _ActivityRow(
                    icon: Icons.emoji_events,
                    title: 'Tournament completed',
                    subtitle: 'Weekly Ludo #24 — ₦50K prize',
                    time: '15m ago',
                  ),
                  _divider(),
                  _ActivityRow(
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'Withdrawal processed',
                    subtitle: '₦25,000 to GTBank •••• 4521',
                    time: '32m ago',
                  ),
                  _divider(),
                  _ActivityRow(
                    icon: Icons.sports_esports_outlined,
                    title: 'Game completed',
                    subtitle: 'Ayo — player1 vs player2',
                    time: '1h ago',
                  ),
                  _divider(),
                  _ActivityRow(
                    icon: Icons.warning_amber_outlined,
                    title: 'Report filed',
                    subtitle: 'Fair play violation report #847',
                    time: '2h ago',
                  ),
                ]),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  static Widget _divider() =>
      const Divider(height: 1, indent: 56, color: Color(0xFF334155));
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String change;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.change,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  color: Color(0xFF94A3B8), fontSize: 11)),
          const SizedBox(height: 2),
          Text(change,
              style: TextStyle(color: color, fontSize: 10)),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: children),
      );
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle,
            style: const TextStyle(
                color: Color(0xFF64748B), fontSize: 11)),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: Color(0xFF475569), size: 20),
      );
}

class _ActivityRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;

  const _ActivityRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: kCyan, size: 20),
        ),
        title: Text(title,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle,
            style: const TextStyle(
                color: Color(0xFF64748B), fontSize: 11)),
        trailing: Text(time,
            style: const TextStyle(
                color: Color(0xFF475569), fontSize: 10)),
      );
}
