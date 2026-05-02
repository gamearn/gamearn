import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

class TourScreen extends StatelessWidget {
  const TourScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Header ────────────────────────────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Text('Tournaments',
                    style: TextStyle(
                        color: kTextPri,
                        fontSize: 22,
                        fontWeight: FontWeight.w800)),
              ),
            ),

            // ── Top leaderboard snippet ───────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance
                      .collection('users')
                      .orderBy('totalPoints', descending: true)
                      .limit(3)
                      .snapshots(),
                  builder: (ctx, snap) {
                    final docs = snap.data?.docs ?? [];
                    if (docs.isEmpty) return const SizedBox.shrink();
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: kBgCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        children: [
                          ...List.generate(docs.length, (i) {
                            final d = docs[i].data()
                                as Map<String, dynamic>;
                            final pts = d['totalPoints'] ?? 0;
                            return Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 4),
                              child: Row(children: [
                                Text('${i + 1}.',
                                    style: TextStyle(
                                        color: i == 0
                                            ? const Color(0xFFFFD700)
                                            : i == 1
                                                ? const Color(0xFFC0C0C0)
                                                : const Color(0xFFCD7F32),
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13)),
                                const SizedBox(width: 10),
                                Text(d['username'] ?? 'Player',
                                    style: const TextStyle(
                                        color: kTextPri,
                                        fontWeight: FontWeight.w600)),
                                const Spacer(),
                                Text('$pts GC',
                                    style: const TextStyle(
                                        color: kOrange,
                                        fontWeight: FontWeight.w700)),
                              ]),
                            );
                          }),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: kBorder),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('VIEW FULL STANDINGS',
                                  style: TextStyle(
                                      color: kTextSec,
                                      fontSize: 12,
                                      letterSpacing: 1)),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),

            // ── Tournament list ───────────────────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Text('Tournament Details',
                    style: TextStyle(
                        color: kTextPri,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
            ),

            StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('tournaments')
                  .orderBy('createdAt', descending: true)
                  .snapshots(),
              builder: (ctx, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child:
                          Center(child: CircularProgressIndicator(color: kCyan)),
                    ),
                  );
                }
                final docs = snap.data?.docs ?? [];
                if (docs.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(
                          child: Text('No tournaments yet.',
                              style: TextStyle(color: kTextSec))),
                    ),
                  );
                }
                return SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final d =
                          docs[i].data() as Map<String, dynamic>;
                      return Padding(
                        padding:
                            const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: _TourCard(data: d),
                      );
                    },
                    childCount: docs.length,
                  ),
                );
              },
            ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
          ],
        ),
      ),
    );
  }
}

class _TourCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TourCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final active    = data['active'] == true;
    final pending   = data['pending'] == true;
    final free      = (data['entryFee'] ?? 0) == 0;
    final entryFee  = data['entryFee'] ?? 0;
    final title     = data['title']   ?? 'Tournament';
    final gameType  = data['gameType'] ?? data['game_type'] ?? 'WIN-BASED';
    final maxPlayers = data['maxPlayers'] ?? 0;
    final currPlayers = data['currentPlayers'] ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active
              ? kGreen.withOpacity(0.3)
              : pending
                  ? kYellowDot.withOpacity(0.3)
                  : kBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status + entry fee badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (active
                          ? kGreen
                          : pending
                              ? kYellowDot
                              : kTextMuted)
                      .withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: active
                          ? kGreen
                          : pending
                              ? kYellowDot
                              : kTextMuted,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    active
                        ? 'LIVE NOW'
                        : pending
                            ? 'PENDING ENTRY'
                            : 'CLOSED',
                    style: TextStyle(
                        color: active
                            ? kGreen
                            : pending
                                ? kYellowDot
                                : kTextMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5),
                  ),
                ]),
              ),
              const Spacer(),
              // Free or entry fee badge
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: free
                      ? kGreen.withOpacity(0.15)
                      : kOrange.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.account_balance_wallet_outlined,
                      size: 12,
                      color: kTextSec),
                  const SizedBox(width: 4),
                  Text(
                    free ? 'FREE' : '$entryFee GC',
                    style: TextStyle(
                        color: free ? kGreen : kOrange,
                        fontWeight: FontWeight.w800,
                        fontSize: 11),
                  ),
                ]),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Title
          Text(title,
              style: const TextStyle(
                  color: kTextPri,
                  fontWeight: FontWeight.w800,
                  fontSize: 15)),
          const SizedBox(height: 4),
          Text(gameType.toString().toUpperCase(),
              style: kLabel.copyWith(color: kTextMuted)),
          const SizedBox(height: 12),

          // Players joining progress
          if (maxPlayers > 0) ...[
            Row(
              children: [
                // avatar stack placeholder
                SizedBox(
                  width: 60,
                  height: 24,
                  child: Stack(
                    children: List.generate(
                        (currPlayers > 3 ? 3 : currPlayers),
                        (i) => Positioned(
                              left: i * 16.0,
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: kBgTeal,
                                  border: Border.all(
                                      color: kBgCard, width: 1.5),
                                ),
                                child: const Center(
                                    child: Text('👤',
                                        style:
                                            TextStyle(fontSize: 10))),
                              ),
                            )),
                  ),
                ),
                const SizedBox(width: 8),
                Text('$currPlayers / $maxPlayers PLAYERS ACTIVE',
                    style: kLabel.copyWith(color: kTextSec)),
                const Spacer(),
                // View Details
                ElevatedButton(
                  onPressed: () {}, // TODO: tournament detail page
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kBgTeal,
                    foregroundColor: kTextPri,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                    side: const BorderSide(color: kBorder),
                  ),
                  child: const Text('VIEW DETAILS',
                      style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
