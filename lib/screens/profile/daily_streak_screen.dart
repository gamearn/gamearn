import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  DAILY STREAK SCREEN — Figma matched (390×844)
//
//  y=95:  256×256 rx=128 #22D1EE — glow circle centred
//  y=103: 96×101 rx=48 #FF5E00 — fire icon box
//  y=312: 170×30 rx=15 #22D1EE — streak badge "X Day Streak"
//  y=364: 342×142 rx=12 #22D1EE — reward card
//    y=442: progress bar 292×12 rx=6 white bg / 245×12 rx=6 #22D1EE fill
//  Reward rows:
//    y=572: icon 40×40 rx=20 #22D1EE + card 286×74 rx=12 #22D1EE (claimed)
//    y=660: icon 40×40 rx=20 #22D1EE + card 286×74 rx=12 #1E293B (unclaimed)
//    y=748: card 286×81 rx=12 gradient (locked)
//      inner badge 103×19 rx=10 #181818
// ════════════════════════════════════════════════════════════════

class DailyStreakScreen extends StatefulWidget {
  const DailyStreakScreen({super.key});
  @override
  State<DailyStreakScreen> createState() => _DailyStreakScreenState();
}

class _DailyStreakScreenState extends State<DailyStreakScreen> {
  bool _claiming = false;

  static const _rewards = [
    {'day': 1,  'coins': 50,   'label': 'Day 1',  'claimed': true},
    {'day': 2,  'coins': 75,   'label': 'Day 2',  'claimed': true},
    {'day': 3,  'coins': 100,  'label': 'Day 3',  'claimed': false},
    {'day': 4,  'coins': 150,  'label': 'Day 4',  'claimed': false},
    {'day': 5,  'coins': 200,  'label': 'Day 5',  'claimed': false},
    {'day': 6,  'coins': 300,  'label': 'Day 6',  'claimed': false},
    {'day': 7,  'coins': 500,  'label': 'Day 7 🎁','claimed': false},
  ];

  Future<void> _claimReward(int streak) async {
    if (_claiming) return;
    setState(() => _claiming = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      final reward = _rewards[(streak - 1).clamp(0, 6)];
      final coins  = reward['coins'] as int;

      await FirebaseFirestore.instance
          .collection('users').doc(uid).update({
        'dayStreak':   streak + 1,
        'lastClaimAt': FieldValue.serverTimestamp(),
      });
      await FirebaseFirestore.instance
          .collection('wallets').doc(uid).update({
        'coins': FieldValue.increment(coins),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('🎉 +$coins coins claimed!'),
          backgroundColor: kCyan.withOpacity(0.9),
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

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
            final user   = (snap.data?.data() as Map?) ?? {};
            final streak = user['dayStreak'] as int? ?? 0;
            final canClaim = _canClaimToday(user);
            final progress = (streak / 7).clamp(0.0, 1.0);

            return CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(children: [
                      GestureDetector(
                        onTap: () => Navigator.maybePop(context),
                          child: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: context.card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: context.border),
                          ),
                          child: Icon(
                              Icons.arrow_back_ios_new_rounded,
                              color: context.txtPri, size: 16),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Text('Daily Streak',
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 17,
                              fontWeight: FontWeight.w800)),
                    ]),
                  ),
                ),

                // ── GLOW + FIRE ICON ──────────────────────────────
                // Figma: 256×256 rx=128 #22D1EE glow
                //        96×101 rx=48 #FF5E00 fire box centred
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: Center(
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Glow circle
                          Container(
                            width: 256, height: 256,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: kCyan.withOpacity(0.1),
                              boxShadow: [BoxShadow(
                                  color: kCyan.withOpacity(0.2),
                                  blurRadius: 60, spreadRadius: 10)],
                            ),
                          ),
                          // Fire icon box — Figma: 96×101 rx=48 #FF5E00
                          Container(
                            width: 96, height: 101,
                            decoration: BoxDecoration(
                              color: kOrange,
                              borderRadius: BorderRadius.circular(48),
                            ),
                            child: const Center(
                              child: Text('🔥',
                                  style: TextStyle(fontSize: 48)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── STREAK BADGE — Figma: 170×30 rx=15 #22D1EE ───
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 14),
                    child: Center(
                      child: Container(
                        width: 170, height: 30,
                        decoration: BoxDecoration(
                          color: kCyan,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Center(
                          child: Text('$streak Day Streak 🔥',
                              style: const TextStyle(
                                  color: Color(0xFF0B0E1A),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ),
                  ),
                ),

                // ── REWARD CARD — Figma: 342×142 rx=12 #22D1EE ───
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Container(
                      height: 142,
                      decoration: BoxDecoration(
                        color: kCyan,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              const Text('Weekly Reward Progress',
                                  style: TextStyle(
                                      color: Color(0xFF0B0E1A),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800)),
                              const Spacer(),
                              Text('$streak / 7 days',
                                  style: TextStyle(
                                      color: const Color(0xFF0B0E1A)
                                          .withOpacity(0.7),
                                      fontSize: 12)),
                            ]),
                            const SizedBox(height: 14),
                            // Progress bar — Figma: 292×12 rx=6 white bg
                            //                fill 245×12 rx=6 #22D1EE
                            Stack(children: [
                              Container(
                                height: 12,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              FractionallySizedBox(
                                widthFactor: progress,
                                child: Container(
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0B0E1A)
                                        .withOpacity(0.4),
                                    borderRadius:
                                        BorderRadius.circular(6),
                                  ),
                                ),
                              ),
                            ]),
                            const Spacer(),
                            Text(
                              streak >= 7
                                  ? '🎉 Full week complete! Claim your bonus'
                                  : '${7 - streak} more day${7 - streak == 1 ? '' : 's'} for weekly bonus',
                              style: TextStyle(
                                  color: const Color(0xFF0B0E1A)
                                      .withOpacity(0.75),
                                  fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // ── DAILY REWARDS LIST ─────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                    child: Text('Daily Rewards',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 14,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) {
                      final r       = _rewards[i];
                      final day     = r['day'] as int;
                      final coins   = r['coins'] as int;
                      final label   = r['label'] as String;
                      final claimed = day <= streak;
                      final today   = day == streak + 1;
                      final locked  = day > streak + 1;

                      return Padding(
                        padding: const EdgeInsets.fromLTRB(
                            16, 0, 16, 10),
                        child: Row(children: [
                          // Step icon — Figma: 40×40 rx=20
                          // claimed = #22D1EE, today = #22D1EE, locked = #1E293B
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: locked
                                  ? context.card
                                  : kCyan,
                              border: today
                                  ? Border.all(
                                      color: kOrange, width: 2)
                                  : null,
                            ),
                            child: Center(
                              child: Text(
                                claimed ? '✓' : '$day',
                                style: TextStyle(
                                    color: locked
                                        ? context.txtSec
                                        : const Color(0xFF0B0E1A),
                                    fontSize: 14,
                                    fontWeight:
                                        FontWeight.w900),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),

                          // Reward card — Figma:
                          // claimed: 286×74 rx=12 #22D1EE
                          // unclaimed today: 286×74 rx=12 #1E293B + cyan border
                          // locked: 286×81 rx=12 gradient
                          Expanded(
                            child: Container(
                              height: locked ? 81 : 74,
                              decoration: BoxDecoration(
                                color: claimed
                                    ? kCyan
                                    : locked
                                        ? context.card
                                        : context.card,
                                borderRadius:
                                    BorderRadius.circular(12),
                                border: today
                                    ? Border.all(
                                        color: kOrange, width: 2)
                                    : locked
                                        ? Border.all(
                                        color: context.border)
                                        : null,
                                gradient: locked
                                    ? LinearGradient(
                                        colors: [
                                          context.card,
                                          context.card,
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      )
                                    : null,
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16),
                                child: Row(children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment:
                                        MainAxisAlignment.center,
                                    children: [
                                      Text(label,
                                          style: TextStyle(
                                              color: claimed
                                              ? const Color(
                                                       0xFF0B0E1A)
                                                   : locked
                                                       ? context.txtSec
                                                       : Colors.white,
                                              fontSize: 14,
                                              fontWeight:
                                                  FontWeight.w800)),
                                      const SizedBox(height: 3),
                                      Text('+$coins coins',
                                          style: TextStyle(
                                              color: claimed
                                                  ? const Color(
                                                          0xFF0B0E1A)
                                                      .withOpacity(
                                                          0.7)
                                                  : locked
                                                      ? context.txtSec
                                                      : kCyan,
                                              fontSize: 12)),
                                    ],
                                  ),
                                  const Spacer(),
                                  // Claimed ✓ | Claim btn | locked badge
                                  if (claimed)
                                    const Icon(
                                        Icons.check_circle_rounded,
                                        color: Color(0xFF0B0E1A),
                                        size: 22)
                                  else if (today && canClaim)
                                    GestureDetector(
                                      onTap: _claiming
                                          ? null
                                          : () => _claimReward(
                                              streak),
                                      child: Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 14,
                                                vertical: 7),
                                        decoration: BoxDecoration(
                                          color: kOrange,
                                          borderRadius:
                                              BorderRadius.circular(
                                                  8),
                                        ),
                                        child: _claiming
                                            ? const SizedBox(
                                                width: 14,
                                                height: 14,
                                                child:
                                                    CircularProgressIndicator(
                                                        color: Colors
                                                            .white,
                                                        strokeWidth:
                                                            2))
                                            : const Text('Claim',
                                                style: TextStyle(
                                                    color: Colors
                                                        .white,
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight
                                                            .w800)),
                                      ),
                                    )
                                  else if (locked)
                                    // Locked badge — Figma: 103×19 rx=10 #181818
                                    Container(
                                      padding:
                                          const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4),
                                      decoration: BoxDecoration(
                                        color:
                                            context.card,
                                        borderRadius:
                                            BorderRadius.circular(
                                                10),
                                      ),
                                      child: Text('🔒 Locked',
                                          style: TextStyle(
                                              color:
                                                  context.txtSec,
                                              fontSize: 10,
                                              fontWeight:
                                                  FontWeight.w700)),
                                    )
                                  else
                                    Text('Tomorrow',
                                        style: TextStyle(
                                            color: context.txtSec,
                                            fontSize: 11)),
                                ]),
                              ),
                            ),
                          ),
                        ]),
                      );
                    },
                    childCount: _rewards.length,
                  ),
                ),

                const SliverPadding(
                    padding: EdgeInsets.only(bottom: 32)),
              ],
            );
          },
        ),
      ),
    );
  }

  bool _canClaimToday(Map user) {
    final lastClaim = user['lastClaimAt'];
    if (lastClaim == null) return true;
    // Firestore Timestamp
    DateTime? last;
    try {
      last = (lastClaim as dynamic).toDate() as DateTime;
    } catch (_) {
      return true;
    }
    final now = DateTime.now();
    return now.difference(last).inHours >= 20;
  }
}
