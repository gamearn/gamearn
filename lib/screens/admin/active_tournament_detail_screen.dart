import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

class ActiveTournamentDetailScreen extends StatelessWidget {
  const ActiveTournamentDetailScreen({super.key});

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
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40.w,
                  height: 40.w,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10).r,
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Text('Active Tournament',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8).r,
                ),
                child: Row(children: [
                  Container(
                    width: 7.w,
                    height: 7.w,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E),
                      shape: BoxShape.circle,
                    ),
                  ),
                  SizedBox(width: 6.w),
                  Text('LIVE',
                      style: TextStyle(
                          color: const Color(0xFF22C55E),
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w800)),
                ]),
              ),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0),
              children: [
                // Tournament info card
                Container(
                  padding: EdgeInsets.all(16.r),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF22C55E).withOpacity(0.08),
                        context.card,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14).r,
                    border: Border.all(
                        color: const Color(0xFF22C55E).withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    Text('Weekly Ludo Championship #24',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17.sp,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 12.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info(context, 'Prize Pool', '\u20A650,000'),
                        _info(context, 'Players', '24/32'),
                        _info(context, 'Round', 'Semi-Final'),
                      ],
                    ),
                  ]),
                ),

                SizedBox(height: 20.h),

                // Live bracket
                Text('BRACKET',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _MatchRow(
                      p1: 'Kofi_92', p2: 'Ada_Flow', score: '2 - 1', live: true),
                  _divider(context),
                  _MatchRow(
                      p1: 'Chidi_Goat', p2: 'Bola_King', score: '1 - 0', live: true),
                  _divider(context),
                  _MatchRow(
                      p1: 'Emeka_Pro', p2: 'Ngozi_Queen', score: '3 - 2', live: false),
                  _divider(context),
                  _MatchRow(
                      p1: 'Tunde_Rush', p2: 'Amara_Win', score: '0 - 0', live: false),
                ]),

                SizedBox(height: 20.h),

                // Admin actions
                Text('ADMIN ACTIONS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _ActionRow(
                    icon: Icons.pause_circle_outline,
                    label: 'Pause Tournament',
                    color: kOrange,
                    onTap: () {},
                  ),
                  _divider(context),
                  _ActionRow(
                    icon: Icons.stop_circle_outlined,
                    label: 'Cancel Tournament',
                    color: Colors.redAccent,
                    onTap: () {},
                  ),
                  _divider(context),
                  _ActionRow(
                    icon: Icons.edit_outlined,
                    label: 'Edit Settings',
                    color: kCyan,
                    onTap: () {},
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

  Widget _info(BuildContext context, String label, String value) {
    return Column(children: [
      Text(label,
          style:
              TextStyle(color: context.txtSec, fontSize: 10.sp)),
      SizedBox(height: 2.h),
      Text(value,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 15.sp,
              fontWeight: FontWeight.w800)),
    ]);
  }

  Widget _divider(BuildContext context) =>
      Divider(height: 1, indent: 56, color: context.border);
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(12).r,
        ),
        child: Column(children: children),
      );
}

class _MatchRow extends StatelessWidget {
  final String p1;
  final String p2;
  final String score;
  final bool live;

  const _MatchRow(
      {required this.p1,
      required this.p2,
      required this.score,
      required this.live});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      title: Row(children: [
        Expanded(
            child: Text(p1,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600))),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
          decoration: BoxDecoration(
            color: live
                ? const Color(0xFF22C55E).withOpacity(0.12)
                : kBgCardAlt,
            borderRadius: BorderRadius.circular(6).r,
          ),
          child: Text(score,
              style: TextStyle(
                  color: live ? const Color(0xFF22C55E) : kTextSec,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w800)),
        ),
        SizedBox(width: 8.w),
        if (live)
          Container(
            width: 6.w,
            height: 6.w,
            decoration: const BoxDecoration(
              color: Color(0xFF22C55E),
              shape: BoxShape.circle,
            ),
          ),
        SizedBox(width: 8.w),
        Expanded(
            child: Text(p2,
                textAlign: TextAlign.end,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 13.sp,
                    fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionRow({
    required this.icon,
    required this.label,
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
          height: 40.w,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8).r,
          ),
          child: Icon(icon, color: color, size: 20.w),
        ),
        title: Text(label,
            style: TextStyle(
                color: color,
                fontSize: 14.sp,
                fontWeight: FontWeight.w500)),
        trailing: Icon(Icons.chevron_right_rounded,
            color: context.txtSec, size: 20.w),
      );
}
