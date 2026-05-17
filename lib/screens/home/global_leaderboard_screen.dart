import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class GlobalLeaderboardScreen extends StatefulWidget {
  const GlobalLeaderboardScreen({super.key});
  @override
  State<GlobalLeaderboardScreen> createState() =>
      _GlobalLeaderboardScreenState();
}

class _GlobalLeaderboardScreenState extends State<GlobalLeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  static const _tabs = ['Global', 'Weekly', 'Friends'];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: _tabs.length, vsync: this);
    _tab.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final me = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────
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
                  Text('Leaderboard', style: context.titleStyle),
                  const Spacer(),
                  Icon(Icons.emoji_events_outlined,
                      color: context.orange, size: 28),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── Tabs ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: context.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tab,
                  indicator: BoxDecoration(
                    color: context.cyan,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: context.bg,
                  unselectedLabelColor: context.subText,
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13),
                  tabs: _tabs.map((t) => Tab(text: t)).toList(),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── List ─────────────────────────────────────────────────
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('users')
                    .orderBy('totalPoints', descending: true)
                    .limit(50)
                    .snapshots(),
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final docs = snap.data?.docs ?? [];
                  if (docs.isEmpty) {
                    return Center(
                      child: Text('No players yet',
                          style: TextStyle(color: context.subText)),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: docs.length,
                    itemBuilder: (context, i) {
                      final data =
                          docs[i].data() as Map<String, dynamic>;
                      final uid = docs[i].id;
                      final isMe = uid == me;
                      final rank = i + 1;
                      final name =
                          data['displayName'] as String? ?? 'Player';
                      final points =
                          (data['totalPoints'] as num? ?? 0).toInt();
                      final avatar = data['photoURL'] as String?;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isMe
                              ? context.cyan.withOpacity(0.12)
                              : context.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: isMe
                              ? Border.all(
                                  color: context.cyan.withOpacity(0.4))
                              : null,
                        ),
                        child: Row(
                          children: [
                            // Rank
                            SizedBox(
                              width: 32,
                              child: rank <= 3
                                  ? Text(
                                      ['🥇', '🥈', '🥉'][rank - 1],
                                      style: const TextStyle(fontSize: 22),
                                    )
                                  : Text(
                                      '#$rank',
                                      style: TextStyle(
                                          color: context.subText,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13),
                                    ),
                            ),
                            const SizedBox(width: 12),

                            // Avatar
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: context.cyan.withOpacity(0.2),
                              backgroundImage: avatar != null
                                  ? NetworkImage(avatar)
                                  : null,
                              child: avatar == null
                                  ? Text(
                                      name[0].toUpperCase(),
                                      style: TextStyle(
                                          color: context.cyan,
                                          fontWeight: FontWeight.w700),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),

                            // Name
                            Expanded(
                              child: Text(
                                isMe ? '$name (You)' : name,
                                style: TextStyle(
                                  color: isMe ? context.cyan : Colors.white,
                                  fontWeight: isMe
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  fontSize: 14,
                                ),
                              ),
                            ),

                            // Points
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$points pts',
                                  style: TextStyle(
                                    color: context.orange,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
