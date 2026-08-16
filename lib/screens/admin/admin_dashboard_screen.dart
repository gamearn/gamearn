import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ---------------------------------------------------------------------------
// AdminDashboardScreen — overview stats + recent activity
// ---------------------------------------------------------------------------

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            child: Row(children: [
              Container(
                width: 40.w,
                height: 40.h,
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(Icons.admin_panel_settings_outlined,
                    color: kOrange, size: 22.w),
              ),
              SizedBox(width: 14.w),
              Text('Admin Dashboard',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          SizedBox(height: 20.h),

          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              children: [
                // Stats — Figma: vertical stack, full width (342×128 each, r8, padding 24)
                _StatCard(
                  icon: Icons.people_outline_rounded,
                  label: 'Total Users',
                  value: '12,847',
                  change: '+234 this week',
                  color: kCyan,
                ),
                SizedBox(height: 16.h),
                _StatCard(
                  icon: Icons.circle_outlined,
                  label: 'Live Now',
                  value: '1,203',
                  change: 'Currently active',
                  color: Color(0xFF22C55E),
                ),
                SizedBox(height: 16.h),
                _StatCard(
                  icon: Icons.monetization_on_outlined,
                  label: 'Revenue',
                  value: '₦4.2M',
                  change: '+18% this month',
                  color: kOrange,
                ),
                SizedBox(height: 16.h),
                _StatCard(
                  icon: Icons.pending_outlined,
                  label: 'Pending Payouts',
                  value: '₦890K',
                  change: '47 requests',
                  color: kYellowDot,
                ),

                SizedBox(height: 24.h),

                // Quick actions
                Text('QUICK ACTIONS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _ActionRow(
                    icon: Icons.check_circle_outline,
                    label: 'Review Withdrawals',
                    subtitle: '47 pending',
                    color: kOrange,
                    onTap: () {},
                  ),
                  _divider(context),
                  _ActionRow(
                    icon: Icons.people_outline_rounded,
                    label: 'Manage Users',
                    subtitle: '12,847 total',
                    color: kCyan,
                    onTap: () {},
                  ),
                  _divider(context),
                  _ActionRow(
                    icon: Icons.emoji_events_outlined,
                    label: 'Tournament Overview',
                    subtitle: '12 active',
                    color: const Color(0xFF22C55E),
                    onTap: () {},
                  ),
                ]),

                SizedBox(height: 24.h),

                // Recent activity
                Text('RECENT ACTIVITY',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _ActivityRow(
                    icon: Icons.person_add_outlined,
                    title: 'New user registered',
                    subtitle: 'kofi_92 joined via Google',
                    time: '2m ago',
                  ),
                  _divider(context),
                  _ActivityRow(
                    icon: Icons.emoji_events,
                    title: 'Tournament completed',
                    subtitle: 'Weekly Ludo #24 — ₦50K prize',
                    time: '15m ago',
                  ),
                  _divider(context),
                  _ActivityRow(
                    icon: Icons.account_balance_wallet_outlined,
                    title: 'Withdrawal processed',
                    subtitle: '₦25,000 to GTBank •••• 4521',
                    time: '32m ago',
                  ),
                  _divider(context),
                  _ActivityRow(
                    icon: Icons.sports_esports_outlined,
                    title: 'Game completed',
                    subtitle: 'Ayo — player1 vs player2',
                    time: '1h ago',
                  ),
                  _divider(context),
                  _ActivityRow(
                    icon: Icons.warning_amber_outlined,
                    title: 'Report filed',
                    subtitle: 'Fair play violation report #847',
                    time: '2h ago',
                  ),
                ]),

                SizedBox(height: 32.h),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _divider(BuildContext context) =>
      Divider(height: 1, indent: 56, color: context.border);
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
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: context.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 36.w,
            height: 36.h,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Icon(icon, color: color, size: 20.w),
          ),
          SizedBox(height: 10.h),
          Text(value,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 22.sp,
                  fontWeight: FontWeight.w800)),
          SizedBox(height: 2.h),
          Text(label,
              style: TextStyle(
                  color: context.txtSec, fontSize: 11.sp)),
          SizedBox(height: 2.h),
          Text(change,
              style: TextStyle(color: color, fontSize: 10.sp)),
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
          color: context.card,
          borderRadius: BorderRadius.circular(12.r),
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
            EdgeInsets.symmetric(horizontal: 14.w, vertical: 4.h),
        leading: Container(
          width: 40.w,
          height: 40.h,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Icon(icon, color: color, size: 20.w),
        ),
        title: Text(label,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 14.sp,
                fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle,
            style: TextStyle(
                color: context.txtSec, fontSize: 11.sp)),
        trailing: Icon(Icons.chevron_right_rounded,
            color: context.txtSec, size: 20.w),
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
            EdgeInsets.symmetric(horizontal: 14.w, vertical: 4.h),
        leading: Container(
          width: 40.w,
          height: 40.h,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Icon(icon, color: kCyan, size: 20.w),
        ),
        title: Text(title,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 13.sp,
                fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle,
            style: TextStyle(
                color: context.txtSec, fontSize: 11.sp)),
        trailing: Text(time,
            style: TextStyle(
                color: context.txtSec, fontSize: 10.sp)),
      );
}
