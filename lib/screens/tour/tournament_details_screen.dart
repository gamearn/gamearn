import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'tournament_entry_screen.dart';
import 'live_tournament_screen.dart';

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT DETAILS SCREEN — Figma matched
// ════════════════════════════════════════════════════════════════

class TournamentDetailsScreen extends StatefulWidget {
  final String tournamentId;
  const TournamentDetailsScreen({super.key, required this.tournamentId});
  @override
  State<TournamentDetailsScreen> createState() =>
      _TournamentDetailsScreenState();
}

class _TournamentDetailsScreenState
    extends State<TournamentDetailsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('tournaments')
            .doc(widget.tournamentId)
            .snapshots(),
        builder: (_, snap) {
          if (!snap.hasData) {
            return Scaffold(
              backgroundColor: context.bg,
              body: Center(
                  child: CircularProgressIndicator(
                      color: kCyan, strokeWidth: 2)),
            );
          }

          final data   = snap.data!.data() as Map<String, dynamic>? ?? {};
          final title  = data['title']      as String? ?? 'Tournament';
          final prize  = data['prizePool']  as String? ?? '0';
          final status = data['status']     as String? ?? 'upcoming';
          final maxP   = data['maxPlayers'] as int?    ?? 32;
          final players= (data['players']   as List?)?.cast<String>() ?? [];
          final gameKey= (data['gameType']  as String? ?? 'whot').toLowerCase();
          final isLive  = status == 'live';
          final isDone  = status == 'completed';
          final joined  = players.contains(uid);
          final int entryFee = int.tryParse(data['entryCost']?.toString() ?? '0') ?? 0;

          return SafeArea(
            child: Column(children: [
              // ── HERO ─────────────────────────────────────────────
              Stack(children: [
                Container(
                  height: 140,
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: kCyan.withOpacity(0.2)),
                  ),
                  child: Stack(children: [
                    Positioned(
                      right: -30, top: -60,
                      child: Container(
                        width: 180, height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: kCyan.withOpacity(0.12),
                          boxShadow: [BoxShadow(
                              color: kCyan.withOpacity(0.2),
                              blurRadius: 40)],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                width: 36, height: 36,
                                decoration: BoxDecoration(
                                  color: context.card,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color: context.border),
                                ),
                                child: const Icon(
                                    Icons.arrow_back_ios_new_rounded,
                                    color: Colors.white, size: 14),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(title,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800),
                                  overflow: TextOverflow.ellipsis),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isLive
                                    ? kCyan
                                    : isDone
                                        ? const Color(0xFF313F55)
                                        : kOrange.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(11),
                              ),
                              child: Text(
                                isLive ? '● Live' : status.toUpperCase(),
                                style: TextStyle(
                                    color: isLive
                                        ? const Color(0xFF0B0E1A)
                                        : Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800),
                              ),
                            ),
                          ]),
                          const Spacer(),
                          Row(children: [
                            const Icon(Icons.emoji_events_rounded,
                                color: kCyan, size: 16),
                            const SizedBox(width: 6),
                            Text('₦$prize',
                                style: const TextStyle(
                                    color: kCyan,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900)),
                            const Spacer(),
                            Text('${players.length}/$maxP players',
                                style: const TextStyle(
                                    color: Color(0xFF9A9A9A),
                                    fontSize: 12)),
                          ]),
                        ],
                      ),
                    ),
                  ]),
                ),
              ]),

              const SizedBox(height: 10),

              // ── JOIN BAR ────────────────────────────────────────
              if (!isDone)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: GestureDetector(
                    onTap: joined
                        ? isLive
                            ? () => Navigator.push(context,
                                MaterialPageRoute(
                                    builder: (_) => LiveTournamentScreen(
                                        tournamentId: widget.tournamentId,
                                        tournamentTitle: title))) // Fixed: added title
                            : null
                        : () => Navigator.push(context,
                            MaterialPageRoute(
                                builder: (_) => TournamentEntryScreen(
                                    tournamentId: widget.tournamentId,
                                    title: title, // Fixed: passed title
                                    entryFee: entryFee))), // Fixed: passed entryFee
                    child: Container(
                      height: 43,
                      decoration: BoxDecoration(
                        color: joined && isLive ? kCyan : kOrange,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          joined
                              ? isLive
                                  ? 'Enter Tournament →'
                                  : 'Joined — Waiting to start'
                              : 'Join Tournament',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ),
                ),

              const SizedBox(height: 12),

              // ── TABS ─────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 36,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: TabBar(
                    controller: _tabs,
                    indicator: BoxDecoration(
                      color: kCyan,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    padding: const EdgeInsets.all(3),
                    labelColor: const Color(0xFF0B0E1A),
                    unselectedLabelColor: const Color(0xFF9A9A9A),
                    labelStyle: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700),
                    tabs: const [
                      Tab(text: 'Overview'),
                      Tab(text: 'Players'),
                      Tab(text: 'Prizes'),
                    ],
                  ),
                ),
              ),

              Expanded(
                child: TabBarView(
                  controller: _tabs,
                  children: [
                    _OverviewTab(data: data),
                    _PlayersTab(
                        players: players,
                        maxPlayers: maxP),
                    _PrizesTab(prize: prize),
                  ],
                ),
              ),
            ]),
          );
        },
      ),
    );
  }
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────
class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> data;
  const _OverviewTab({required this.data});

  @override
  Widget build(BuildContext context) {
    final rules = data['rules'] as String? ?? 'Standard tournament rules apply.';
    final start = data['startTime'] as String? ?? 'TBD';
    final game  = data['gameType']  as String? ?? 'whot';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.border),
          ),
          child: Column(children: [
            Row(children: [
              Expanded(child: _InfoTile(label: 'Game', value: game.toUpperCase(), icon: Icons.sports_esports_rounded)),
              Expanded(child: _InfoTile(label: 'Start', value: start, icon: Icons.schedule_rounded)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _InfoTile(label: 'Format', value: 'Single Elim.', icon: Icons.account_tree_rounded)),
              Expanded(child: _InfoTile(label: 'Entry', value: '${data['entryCost'] ?? 0} coins', icon: Icons.monetization_on_outlined)),
            ]),
          ]),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Rules', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(rules, style: const TextStyle(color: Color(0xFF9A9A9A), fontSize: 13, height: 1.6)),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label, value;
  final IconData icon;
  const _InfoTile({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 32, height: 32, decoration: BoxDecoration(color: kCyan.withOpacity(0.12), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: kCyan, size: 16)),
    const SizedBox(width: 10),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Color(0xFF9A9A9A), fontSize: 10)),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
    ]),
  ]);
}

// ── PLAYERS TAB ───────────────────────────────────────────────────
class _PlayersTab extends StatelessWidget {
  final List<String> players;
  final int maxPlayers;
  const _PlayersTab({required this.players, required this.maxPlayers});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Text('${players.length} / $maxPlayers players joined', style: const TextStyle(color: Color(0xFF9A9A9A), fontSize: 12)),
        const SizedBox(height: 12),
        ...players.map((uid) => _PlayerRow(uid: uid)),
        ...List.generate(
          (maxPlayers - players.length).clamp(0, 8),
          (i) => Container(
            height: 64, margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: context.border)),
            child: Center(child: Text('Open slot', style: TextStyle(color: context.txtSec, fontSize: 12))),
          ),
        ),
      ],
    );
  }
}

class _PlayerRow extends StatelessWidget {
  final String uid;
  const _PlayerRow({required this.uid});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64, margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: context.border)),
      child: FutureBuilder<DocumentSnapshot>(
        future: FirebaseFirestore.instance.collection('users').doc(uid).get(),
        builder: (_, snap) {
          final u = (snap.data?.data() as Map?) ?? {};
          final name = u['username'] as String? ?? 'Player';
          final emoji = kAvatars.firstWhere((a) => a['name'] == (u['avatar'] ?? 'BOT'), orElse: () => kAvatars[0])['emoji'] ?? '🤖';
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(children: [
              Container(width: 36, height: 36, decoration: BoxDecoration(shape: BoxShape.circle, color: context.card), child: Center(child: Text(emoji, style: const TextStyle(fontSize: 18)))),
              const SizedBox(width: 12),
              Text(name, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
            ]),
          );
        },
      ),
    );
  }
}

// ── PRIZES TAB ────────────────────────────────────────────────────
class _PrizesTab extends StatelessWidget {
  final String prize;
  const _PrizesTab({required this.prize});

  @override
  Widget build(BuildContext context) {
    final total = int.tryParse(prize.replaceAll(',', '')) ?? 0;
    final prizes = [
      ('🥇 1st Place', (total * 0.5).toInt()),
      ('🥈 2nd Place', (total * 0.3).toInt()),
      ('🥉 3rd Place', (total * 0.2).toInt()),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: prizes.map((p) => Container(
        height: 64, margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: context.border)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            Text(p.$1, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
            const Spacer(),
            Text('₦${p.$2}', style: const TextStyle(color: kCyan, fontSize: 16, fontWeight: FontWeight.w900)),
          ]),
        ),
      )).toList(),
    );
  }
}
