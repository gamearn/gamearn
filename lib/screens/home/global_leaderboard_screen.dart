import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  GLOBAL LEADERBOARD SCREEN — Figma matched
//
//  Tab bar: 342×28 rx=8 #1E293B, active pill 83.5×20 rx=6 #22D1EE
//  #1 row:  342×43 rx=8 #22D1EE  (gold)
//  #2+ rows: 342×43 rx=8 #1E293B
//  Each row: rank medal | avatar circle | name | score chip
// ════════════════════════════════════════════════════════════════

class GlobalLeaderboardScreen extends StatefulWidget {
  const GlobalLeaderboardScreen({super.key});
  @override
  State<GlobalLeaderboardScreen> createState() =>
      _GlobalLeaderboardScreenState();
}

class _GlobalLeaderboardScreenState
    extends State<GlobalLeaderboardScreen> {
  int _tab = 0;
  static const _tabs = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  String get _field => switch (_tab) {
    1 => 'weeklyScore',
    2 => 'monthlyScore',
    3 => 'yearlyScore',
    _ => 'dailyScore',
  };

  @override
  Widget build(BuildContext context) {
    final myUid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [

          // ── HEADER ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.border),
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              Text('Global Leaderboard',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17, fontWeight: FontWeight.w800)),
            ]),
          ),

          const SizedBox(height: 16),

          // ── TAB BAR — Figma: 342×28 rx=8 #1E293B
          //              active 83.5×20 rx=6 #22D1EE ───────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              height: 36,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: List.generate(_tabs.length, (i) {
                  final active = i == _tab;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _tab = i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        decoration: BoxDecoration(
                          // Figma: active pill #22D1EE rx=6
                          color: active ? kCyan : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                              child: Text(_tabs[i],
                                  style: TextStyle(
                                      color: active
                                          ? const Color(0xFF0B0E1A)
                                          : context.txtSec,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── ROWS LIST ─────────────────────────────────────────
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('leaderboard')
                  .orderBy(_field, descending: true)
                  .limit(50)
                  .snapshots(),
              builder: (_, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(
                      color: kCyan, strokeWidth: 2));
                }
                final docs = snap.data?.docs ?? [];
                if (docs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🏆',
                            style: TextStyle(fontSize: 48)),
                        const SizedBox(height: 12),
                        Text('No rankings yet for ${_tabs[_tab]}',
                            style: TextStyle(
                                color: context.txtSec)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final d = docs[i].data() as Map<String, dynamic>;
                    final uid    = docs[i].id;
                    final name   = d['username'] as String? ?? 'Player';
                    final score  = d[_field] ?? 0;
                    final avatar = d['avatar']   as String? ?? 'BOT';
                    final emoji  = kAvatars.firstWhere(
                        (a) => a['name'] == avatar,
                        orElse: () => kAvatars[0])['emoji'] ?? '🤖';
                    final isMe   = uid == myUid;
                    final isTop  = i == 0;

                    return Container(
                      height: 43,
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        // Figma: #1 = 342×43 #22D1EE, rest = #1E293B
                        color: isTop
                            ? kCyan
                            : isMe
                                ? kCyan.withOpacity(0.12)
                                : context.card,
                        borderRadius: BorderRadius.circular(8),
                        border: isMe && !isTop
                            ? Border.all(
                                color: kCyan.withOpacity(0.4))
                            : null,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12),
                        child: Row(children: [
                          // Rank
                          SizedBox(
                            width: 28,
                            child: Text(
                              _rankLabel(i),
                              style: TextStyle(
                                  color: isTop
                                      ? const Color(0xFF0B0E1A)
                                      : context.txtSec,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Avatar
                          Container(
                            width: 28, height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isTop
                                  ? const Color(0xFF0B0E1A)
                                  : const Color(0xFF0F172A),
                            ),
                            child: Center(
                              child: Text(emoji,
                                  style:
                                      const TextStyle(fontSize: 14)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Name
                          Expanded(
                            child: Text(
                              isMe ? '$name (You)' : name,
                              style: TextStyle(
                                  color: isTop
                                      ? const Color(0xFF0B0E1A)
                                      : context.txtPri,
                                  fontSize: 13,
                                  fontWeight: isTop
                                      ? FontWeight.w800
                                      : FontWeight.w600),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          // Score chip — Figma: #375277 bg
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: isTop
                                  ? const Color(0xFF0B0E1A)
                                      .withOpacity(0.2)
                                  : const Color(0xFF375277),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text('$score pts',
                                style: TextStyle(
                                    color: isTop
                                        ? const Color(0xFF0B0E1A)
                                        : kCyan,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700)),
                          ),
                        ]),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  String _rankLabel(int i) => switch (i) {
    0 => '🥇', 1 => '🥈', 2 => '🥉', _ => '#${i + 1}'
  };
}
