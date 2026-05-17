import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

class DailyStreakScreen extends StatelessWidget {
  const DailyStreakScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: uid == null
              ? null
              : FirebaseFirestore.instance
                  .collection('users').doc(uid).snapshots(),
          builder: (context, snap) {
            final data = snap.data?.data() as Map<String, dynamic>? ?? {};
            final streak = data['streak'] as int? ?? 0;
            final maxStreak = data['maxStreak'] as int? ?? 0;

            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.maybePop(context),
                        child: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: context.surface,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.arrow_back_ios_new,
                              color: Colors.white, size: 16),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text('Daily Streak', style: context.titleStyle),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Streak circle — cyan glow ring + orange fire badge
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 256, height: 256,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: context.cyan.withOpacity(0.3), width: 2),
                        gradient: RadialGradient(colors: [
                          context.cyan.withOpacity(0.08),
                          Colors.transparent,
                        ]),
                      ),
                    ),
                    Container(
                      width: 92, height: 97,
                      decoration: BoxDecoration(
                        color: context.orange,
                        borderRadius: BorderRadius.circular(46),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('🔥',
                              style: TextStyle(fontSize: 28)),
                          Text('$streak',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Streak pill
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: context.cyan,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Text(
                    streak == 1 ? '1 Day Streak!' : '$streak Days Streak!',
                    style: TextStyle(
                        color: context.bg,
                        fontWeight: FontWeight.w800,
                        fontSize: 15),
                  ),
                ),
                const SizedBox(height: 32),

                // Stats
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: _statCard(context, '🏆', 'Best Streak',
                            '$maxStreak days'),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _statCard(context, '📅', 'Current',
                            '$streak days'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Weekly grid
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(7, (i) {
                      final active = i < streak % 7;
                      final days = ['M','T','W','T','F','S','S'];
                      return Column(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: active
                                  ? context.orange
                                  : context.surface,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                active ? '🔥' : days[i],
                                style: TextStyle(
                                  fontSize: active ? 16 : 12,
                                  color: active
                                      ? Colors.white
                                      : context.subText,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(days[i],
                              style: TextStyle(
                                  color: context.subText, fontSize: 11)),
                        ],
                      );
                    }),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _statCard(BuildContext context, String emoji, String label,
      String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 6),
          Text(label,
              style: TextStyle(color: context.subText, fontSize: 11)),
          const SizedBox(height: 2),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 15)),
        ],
      ),
    );
  }
}
