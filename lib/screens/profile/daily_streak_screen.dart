import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../services/ads_service.dart';

// ════════════════════════════════════════════════════════════════
//  DAILY STREAK SCREEN — Figma matched (1450:948, 390×844)
//
//  Hero: glow 256×256 #22D1EE@20 · fire box 96×101 #FF5E00@10 ·
//    streak fs56 w700 #FFFFFF · "Days Active" fs18 w700 #FF5E00 ·
//    badge 170×30 #22D1EE@20 "Streak Maintained"
//  Progress: 342×142 #22D1EE@5 · "Next Milestone" fs12 · "50 Day
//    Badge" fs20 w700 · "8 DAYS LEFT" fs12 #22D1EE · bar 292×12
//    (#FFFFFF@10 track / #22D1EE fill)
//  Rewards Journey: completed card #22D1EE@10 · current #1E293B@50
//    · locked #1E293B 286×81
//  Streak Protection 342×253 #0F172A · Watch Ad (#FFFFFF@10) ·
//    Buy Now (#029FB9)
//  Rules Info 342×95 #FF5E00@5
// ════════════════════════════════════════════════════════════════

class DailyStreakScreen extends StatefulWidget {
  const DailyStreakScreen({super.key});

  @override
  State<DailyStreakScreen> createState() => _DailyStreakScreenState();
}

class _DailyStreakScreenState extends State<DailyStreakScreen> {
  static const _milestones = [
    {'label': 'Day 30 Badge', 'reward': '+500 coins', 'target': 30},
    {'label': 'Day 50 Badge', 'reward': '+1,000 coins', 'target': 50},
    {'label': 'Day 100 Badge', 'reward': 'Legendary chest', 'target': 100},
  ];

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users').doc(uid).snapshots(),
          builder: (_, snap) {
            final user = (snap.data?.data() as Map?) ?? {};
            final streak = user['dayStreak'] as int? ?? 0;

            return CustomScrollView(
              slivers: [
                // ── HEADER ──────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Container(
                    width: double.infinity,
                    padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
                    decoration: BoxDecoration(
                      color: context.bg,
                      border: Border(bottom: BorderSide(color: context.border, width: 1)),
                    ),
                    child: Row(children: [
                      GestureDetector(
                        onTap: () => Navigator.maybePop(context),
                        child: Icon(Icons.close_rounded,
                            color: context.txtPri, size: 20.w),
                      ),
                      Expanded(
                        child: Text('Daily Streak',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 18.sp, fontWeight: FontWeight.w700)),
                      ),
                      SizedBox(width: 20.w),
                    ]),
                  ),
                ),

                // ── HERO ────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 24.h),
                    child: Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Glow — Figma: 256×256 #22D1EE@20
                          Container(
                            width: 256.w, height: 256.h,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: kCyan.withOpacity(0.2),
                              boxShadow: [BoxShadow(
                                  color: kCyan.withOpacity(0.2),
                                  blurRadius: 70, spreadRadius: 14)],
                            ),
                          ),
                          Column(children: [
                            // Fire box — Figma: 96×101 #FF5E00@10
                            Container(
                              width: 96.w, height: 101.h,
                              decoration: BoxDecoration(
                                color: kOrange.withOpacity(0.1),
                                borderRadius:
                                    BorderRadius.circular(48.r),
                              ),
                              child: Icon(Icons.local_fire_department,
                                  color: kOrange, size: 44.w),
                            ),
                            SizedBox(height: 18.h),
                            // Streak — Figma: fs56 w700
                            Text('$streak',
                                style: TextStyle(
                                    color: context.txtPri,
                                    fontSize: 56.sp,
                                    fontWeight: FontWeight.w700)),
                            SizedBox(height: 4.h),
                            Text('Days Active',
                                style: TextStyle(
                                    color: kOrange,
                                    fontSize: 18.sp,
                                    fontWeight: FontWeight.w700)),
                            SizedBox(height: 12.h),
                            // Badge — Figma: 170×30 #22D1EE@20
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 16.w, vertical: 7.h),
                              decoration: BoxDecoration(
                                color: kCyan.withOpacity(0.2),
                                borderRadius:
                                    BorderRadius.circular(15.r),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.circle,
                                      color: kCyan, size: 8.w),
                                  SizedBox(width: 8.w),
                                  Text('Streak Maintained',
                                      style: TextStyle(
                                          color: kCyan,
                                          fontSize: 12.sp,
                                          fontWeight:
                                              FontWeight.w700)),
                                ],
                              ),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── PROGRESS SECTION — Figma: 342×142 #22D1EE@5 ──────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 22.h, 24.w, 0),
                    child: Container(
                      padding: EdgeInsets.all(24.r),
                      decoration: BoxDecoration(
                        color: kCyan.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text('Next Milestone',
                                      style: TextStyle(
                                          color: context.txtSec,
                                          fontSize: 12.sp,
                                          fontWeight:
                                              FontWeight.w500)),
                                  SizedBox(height: 4.h),
                                  Text('50 Day Badge',
                                      style: TextStyle(
                                          color: context.txtPri,
                                          fontSize: 20.sp,
                                          fontWeight:
                                              FontWeight.w700)),
                                ],
                              ),
                            ),
                            Text('${(50 - streak).clamp(0, 50)} DAYS LEFT',
                                style: TextStyle(
                                    color: kCyan,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w700)),
                          ]),
                          SizedBox(height: 14.h),
                          // Bar — Figma: 292×12 #FFFFFF@10 / #22D1EE
                          Stack(children: [
                            Container(
                              height: 12.h,
                              decoration: BoxDecoration(
                                color: const Color(0x1AFFFFFF),
                                borderRadius:
                                    BorderRadius.circular(6.r),
                              ),
                            ),
                            FractionallySizedBox(
                              widthFactor:
                                  (streak / 50).clamp(0.0, 1.0),
                              child: Container(
                                height: 12.h,
                                decoration: BoxDecoration(
                                  color: kCyan,
                                  borderRadius:
                                      BorderRadius.circular(6.r),
                                ),
                              ),
                            ),
                          ]),
                          SizedBox(height: 10.h),
                          Row(children: [
                            Expanded(
                              child: Text('Day ${streak >= 30 ? 30 : streak} Reached',
                                  style: TextStyle(
                                      color: context.txtSec,
                                      fontSize: 10.sp,
                                      fontWeight: FontWeight.w700)),
                            ),
                            Text('Day 50 Milestone',
                                style: TextStyle(
                                    color: context.txtSec,
                                    fontSize: 10.sp,
                                    fontWeight: FontWeight.w700)),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── REWARDS JOURNEY ─────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 22.h, 24.w, 0),
                    child: Text('Rewards Journey',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 18.sp, fontWeight: FontWeight.w700)),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 14.h),
                    child: Column(children: [
                      for (final m in _milestones)
                        _milestoneRow(
                          label: m['label'] as String,
                          reward: m['reward'] as String,
                          target: m['target'] as int,
                          streak: streak,
                          isLast: m['target'] == 100,
                        ),
                    ]),
                  ),
                ),

                // ── STREAK PROTECTION — Figma: 342×253 #0F172A ────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 22.h, 24.w, 0),
                    child: Container(
                      padding: EdgeInsets.all(24.r),
                      decoration: BoxDecoration(
                        color: context.card,
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 56.w, height: 56.h,
                            decoration: BoxDecoration(
                              color: const Color(0x1AFFFFFF),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.shield_outlined,
                                color: kCyan, size: 26.w),
                          ),
                          SizedBox(height: 12.h),
                          Text('Protect Your Streak',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.w700)),
                          SizedBox(height: 6.h),
                          Text(
                            'Missed a day? Use a Streak Freeze to keep\nyour progress safe.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w500,
                                height: 1.4),
                          ),
                          SizedBox(height: 12.h),
                          Row(children: [
                            Expanded(
                              child: _protectButton(
                                top: 'FREE',
                                main: 'Watch Ad',
                                bg: const Color(0x1AFFFFFF),
                                mainColor: Colors.white,
                              ),
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: _protectButton(
                                top: '150 COINS',
                                main: 'Buy Now',
                                bg: const Color(0xFF029FB9),
                                mainColor: Colors.white,
                              ),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── RULES INFO — Figma: 342×95 #FF5E00@5 ──────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 22.h, 24.w, 0),
                    child: Container(
                      padding: EdgeInsets.all(16.r),
                      decoration: BoxDecoration(
                        color: kOrange.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Streak Rules',
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w700)),
                          SizedBox(height: 4.h),
                          Text(
                            'Play at least one tournament match every 24 hours\nto maintain your streak. Streaks reset at 00:00 UTC.',
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w400,
                                height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                SliverPadding(
                    padding: EdgeInsets.only(bottom: 32.h)),
              ],
            );
          },
        ),
      ),
    );
  }

  // ── MILESTONE ROW — Figma: step 40 + card 286×74/81 ─────────────
  Widget _milestoneRow({
    required String label,
    required String reward,
    required int target,
    required int streak,
    required bool isLast,
  }) {
    final completed = streak >= target;
    final isCurrent = !completed && streak >= (target - 30);

    return Padding(
      padding: EdgeInsets.only(left: 24.w, right: 24.w, bottom: 12.h),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Step + divider
        Column(children: [
          Container(
            width: 40.w, height: 40.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: completed
                  ? kCyan
                  : const Color(0xFF1E293B),
              border: isCurrent
                  ? Border.all(color: kOrange, width: 2)
                  : null,
            ),
            child: Center(
              child: completed
                  ? Icon(Icons.check_rounded,
                      color: const Color(0xFF0B0E1A), size: 20.w)
                  : Text('$target',
                      style: TextStyle(
                          color: Colors.white, fontSize: 13.sp,
                          fontWeight: FontWeight.w800)),
            ),
          ),
          if (!isLast)
            Container(
              width: 2,
              height: 34.h,
              color: completed
                  ? kCyan
                  : const Color(0xFF334155),
            ),
        ]),
        SizedBox(width: 14.w),

        // Card
        Expanded(
          child: Container(
            height: 74.h,
            padding: EdgeInsets.symmetric(horizontal: 16.w),
            decoration: BoxDecoration(
              color: completed
                  ? kCyan.withOpacity(0.1)
                  : const Color(0x802B3B4D),
              borderRadius: BorderRadius.circular(12.r),
              border: isCurrent
                  ? Border.all(color: kOrange, width: 1.5)
                  : null,
            ),
            child: Row(children: [
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: TextStyle(
                            color: completed
                                ? context.txtPri
                                : context.txtPri.withOpacity(0.8),
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w700)),
                    SizedBox(height: 3.h),
                    Text(reward,
                        style: TextStyle(
                            color: completed
                                ? kCyan
                                : const Color(0x99FFFFFF),
                            fontSize: 12.sp)),
                  ],
                ),
              ),
              if (completed)
                Icon(Icons.check_circle_rounded,
                    color: kCyan, size: 20.w)
              else if (isCurrent)
                Text('Ready',
                    style: TextStyle(
                        color: kOrange, fontSize: 12.sp,
                        fontWeight: FontWeight.w800))
              else
                Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: 10.w, vertical: 5.h),
                  decoration: BoxDecoration(
                    color: context.border,
                    borderRadius: BorderRadius.circular(10.r),
                  ),
                  child: Text('🔒 Locked',
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 10.sp,
                          fontWeight: FontWeight.w700)),
                ),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _protectButton({
    required String top,
    required String main,
    required Color bg,
    required Color mainColor,
  }) => GestureDetector(
    onTap: () async {
      if (main == 'Watch Ad') {
        await AdsService.instance.preloadRewarded();
        final earned = await AdsService.instance.showRewarded();
        if (!mounted) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(
            content: Text(earned ? 'Streak protected!' : 'No credit earned this time'),
            backgroundColor: earned ? kGreen : kCyan,
            behavior: SnackBarBehavior.floating,
          ));
      } else {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(
            content: Text('$main — coming soon'),
            backgroundColor: bg,
            behavior: SnackBarBehavior.floating,
          ));
      }
    },
    child: Container(
      height: 56.h,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(top,
              style: TextStyle(
                  color: context.txtSec, fontSize: 10.sp,
                  fontWeight: FontWeight.w700)),
          Text(main,
              style: TextStyle(
                  color: context.txtPri, fontSize: 14.sp,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    ),
  );
}
