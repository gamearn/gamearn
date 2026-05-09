import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR SCREEN (list)
// ─────────────────────────────────────────────────────────────────────────────
class TourScreen extends StatefulWidget {
  const TourScreen({super.key});

  @override
  State<TourScreen> createState() => _TourScreenState();
}

class _TourScreenState extends State<TourScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  static const _tabs = ['All', 'Live', 'Upcoming', 'Closed'];

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

  Query _query(String filter) {
    final base = FirebaseFirestore.instance
        .collection('tournaments')
        .orderBy('createdAt', descending: true);
    switch (filter) {
      case 'Live':
        return base.where('active', isEqualTo: true);
      case 'Upcoming':
        return base.where('pending', isEqualTo: true);
      case 'Closed':
        return base
            .where('active', isEqualTo: false)
            .where('pending', isEqualTo: false);
      default:
        return base;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: NestedScrollView(
          headerSliverBuilder: (ctx, _) => [
            // ── Header ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Row(children: [
                  const Text('Tournaments',
                      style: TextStyle(
                          color: kTextPri,
                          fontSize: 22,
                          fontWeight: FontWeight.w800)),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: kOrange.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: kOrange.withOpacity(0.3)),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.emoji_events, color: kOrange, size: 14),
                      SizedBox(width: 5),
                      Text('WIN BIG',
                          style: TextStyle(
                              color: kOrange,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5)),
                    ]),
                  ),
                ]),
              ),
            ),

            // ── Top 3 leaderboard ────────────────────────────────────────────
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
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0D1F3C), Color(0xFF0A1628)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            const Icon(Icons.leaderboard,
                                color: kCyan, size: 15),
                            const SizedBox(width: 6),
                            Text('TOP PLAYERS',
                                style: kLabel.copyWith(color: kCyan)),
                          ]),
                          const SizedBox(height: 10),
                          ...List.generate(docs.length, (i) {
                            final d = docs[i].data() as Map<String, dynamic>;
                            final rankColors = [
                              const Color(0xFFFFD700),
                              const Color(0xFFC0C0C0),
                              const Color(0xFFCD7F32),
                            ];
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 5),
                              child: Row(children: [
                                Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: rankColors[i].withOpacity(0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text('${i + 1}',
                                        style: TextStyle(
                                            color: rankColors[i],
                                            fontWeight: FontWeight.w800,
                                            fontSize: 11)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(d['username'] ?? 'Player',
                                    style: const TextStyle(
                                        color: kTextPri,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13)),
                                const Spacer(),
                                Text('${d['totalPoints'] ?? 0} GC',
                                    style: TextStyle(
                                        color: rankColors[i],
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13)),
                              ]),
                            );
                          }),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () {},
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: kBorder),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('VIEW FULL STANDINGS',
                                  style: TextStyle(
                                      color: kTextSec,
                                      fontSize: 11,
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

            // ── Tab bar ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                child: Container(
                  height: 38,
                  decoration: BoxDecoration(
                    color: kBgCard,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TabBar(
                    controller: _tab,
                    indicatorSize: TabBarIndicatorSize.tab,
                    indicator: BoxDecoration(
                      color: kCyan,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    labelColor: kBgDeep,
                    unselectedLabelColor: kTextSec,
                    labelStyle: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 12),
                    dividerColor: Colors.transparent,
                    tabs: _tabs.map((t) => Tab(text: t, height: 34)).toList(),
                  ),
                ),
              ),
            ),
          ],
          body: TabBarView(
            controller: _tab,
            children: _tabs.map((filter) {
              return StreamBuilder<QuerySnapshot>(
                stream: _query(filter).snapshots(),
                builder: (ctx, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(
                        child: CircularProgressIndicator(color: kCyan));
                  }
                  final docs = snap.data?.docs ?? [];
                  if (docs.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.emoji_events_outlined,
                              color: kTextMuted, size: 48),
                          const SizedBox(height: 12),
                          Text('No $filter tournaments',
                              style: const TextStyle(
                                  color: kTextSec, fontSize: 14)),
                        ],
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                    itemCount: docs.length,
                    itemBuilder: (_, i) {
                      final d = docs[i].data() as Map<String, dynamic>;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _TourCard(id: docs[i].id, data: d),
                      );
                    },
                  );
                },
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
class _TourCard extends StatelessWidget {
  final String id;
  final Map<String, dynamic> data;
  const _TourCard({required this.id, required this.data});

  @override
  Widget build(BuildContext context) {
    final active = data['active'] == true;
    final pending = data['pending'] == true;
    final free = (data['entryFee'] ?? 0) == 0;
    final entryFee = data['entryFee'] ?? 0;
    final title = data['title'] ?? 'Tournament';
    final gameType = data['gameType'] ?? data['game_type'] ?? 'WIN-BASED';
    final maxPlayers = data['maxPlayers'] ?? 0;
    final currPlayers = data['currentPlayers'] ?? 0;
    final prize = data['prize'] ?? data['total_pool'] ?? '0';

    final statusColor = active
        ? kGreen
        : pending
            ? kYellowDot
            : kTextMuted;
    final statusLabel = active
        ? 'LIVE NOW'
        : pending
            ? 'UPCOMING'
            : 'CLOSED';

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => TournamentDetailScreen(id: id, data: data)),
      ),
      child: Container(
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
            // Status + entry fee
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                        color: statusColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 5),
                  Text(statusLabel,
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5)),
                ]),
              ),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: free
                      ? kGreen.withOpacity(0.12)
                      : kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  free ? 'FREE ENTRY' : '$entryFee GC',
                  style: TextStyle(
                      color: free ? kGreen : kOrange,
                      fontWeight: FontWeight.w800,
                      fontSize: 11),
                ),
              ),
            ]),
            const SizedBox(height: 10),

            Text(title,
                style: const TextStyle(
                    color: kTextPri,
                    fontWeight: FontWeight.w800,
                    fontSize: 15)),
            const SizedBox(height: 3),
            Text(gameType.toString().toUpperCase(),
                style: kLabel.copyWith(color: kTextMuted)),
            const SizedBox(height: 12),

            Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('PRIZE POOL', style: kLabel.copyWith(fontSize: 10)),
                Text('₦$prize',
                    style: const TextStyle(
                        color: kCyan,
                        fontWeight: FontWeight.w800,
                        fontSize: 16)),
              ]),
              const Spacer(),
              if (maxPlayers > 0)
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('PLAYERS', style: kLabel.copyWith(fontSize: 10)),
                  Text('$currPlayers / $maxPlayers',
                      style: const TextStyle(
                          color: kTextPri,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                ]),
              const SizedBox(width: 14),
              ElevatedButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) =>
                          TournamentDetailScreen(id: id, data: data)),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: active ? kGreen : kCyan,
                  foregroundColor: kBgDeep,
                  elevation: 0,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(
                  active ? 'JOIN NOW' : 'DETAILS',
                  style: const TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w800),
                ),
              ),
            ]),

            if (maxPlayers > 0) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (currPlayers / maxPlayers).clamp(0.0, 1.0),
                  backgroundColor: kBorder,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(active ? kGreen : kCyan),
                  minHeight: 3,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT DETAIL SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class TournamentDetailScreen extends StatelessWidget {
  final String id;
  final Map<String, dynamic> data;
  const TournamentDetailScreen(
      {super.key, required this.id, required this.data});

  @override
  Widget build(BuildContext context) {
    final active = data['active'] == true;
    final pending = data['pending'] == true;
    final free = (data['entryFee'] ?? 0) == 0;
    final entryFee = data['entryFee'] ?? 0;
    final title = data['title'] ?? 'Tournament';
    final prize = data['prize'] ?? data['total_pool'] ?? '0';
    final maxPlayers = data['maxPlayers'] ?? 0;
    final currPlayers = data['currentPlayers'] ?? 0;
    final gameType = data['gameType'] ?? 'WIN-BASED';
    final rules = (data['rules'] as List?)?.cast<String>() ??
        [
          'Players must complete all matches',
          'Disconnections count as a loss',
          'No cheating or exploits allowed',
          'Prize distributed within 24 hours',
          'Tournament bracket is single elimination',
        ];
    final startTime = data['startTime'] != null
        ? (data['startTime'] as Timestamp).toDate()
        : null;

    final canJoin =
        (active || pending) && (maxPlayers == 0 || currPlayers < maxPlayers);

    return Scaffold(
      backgroundColor: kBgDeep,
      body: CustomScrollView(
        slivers: [
          // ── Hero header ───────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: kBgDeep,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new,
                  color: kTextPri, size: 18),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: active
                        ? [kGreen.withOpacity(0.3), kBgDeep]
                        : [kCyan.withOpacity(0.2), kBgDeep],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: kBgCard,
                          border: Border.all(
                              color: active ? kGreen : kCyan, width: 2),
                        ),
                        child: Icon(Icons.emoji_events,
                            color: active ? kGreen : kCyan, size: 36),
                      ),
                      const SizedBox(height: 12),
                      Text(title,
                          style: const TextStyle(
                              color: kTextPri,
                              fontSize: 18,
                              fontWeight: FontWeight.w800)),
                      Text(gameType.toString().toUpperCase(),
                          style: kLabel.copyWith(color: kTextSec)),
                    ],
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Stats row ──────────────────────────────────────────
                  Row(children: [
                    Expanded(
                        child: _StatTile(
                            icon: Icons.attach_money,
                            label: 'PRIZE POOL',
                            value: '₦$prize',
                            color: kCyan)),
                    const SizedBox(width: 10),
                    Expanded(
                        child: _StatTile(
                            icon: Icons.account_balance_wallet_outlined,
                            label: 'ENTRY FEE',
                            value: free ? 'FREE' : '$entryFee GC',
                            color: free ? kGreen : kOrange)),
                    const SizedBox(width: 10),
                    Expanded(
                        child: _StatTile(
                            icon: Icons.group_outlined,
                            label: 'PLAYERS',
                            value: '$currPlayers/$maxPlayers',
                            color: kTextPri)),
                  ]),
                  const SizedBox(height: 20),

                  // ── Countdown ──────────────────────────────────────────
                  if (startTime != null && pending) ...[
                    _CountdownCard(startTime: startTime),
                    const SizedBox(height: 20),
                  ],

                  // ── Fill bar ───────────────────────────────────────────
                  if (maxPlayers > 0) ...[
                    Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('LOBBY CAPACITY',
                              style: kLabel.copyWith(color: kTextSec)),
                          Text(
                              '${((currPlayers / maxPlayers) * 100).round()}% FULL',
                              style: kLabel.copyWith(
                                  color: currPlayers >= maxPlayers
                                      ? kOrange
                                      : kGreen)),
                        ]),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: (currPlayers / maxPlayers).clamp(0.0, 1.0),
                        backgroundColor: kBorder,
                        valueColor: AlwaysStoppedAnimation<Color>(
                            currPlayers >= maxPlayers ? kOrange : kGreen),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ── Rules ──────────────────────────────────────────────
                  Text('TOURNAMENT RULES',
                      style: kLabel.copyWith(color: kCyan)),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: kBgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      children: rules.asMap().entries.map((e) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: kCyan.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text('${e.key + 1}',
                                      style: const TextStyle(
                                          color: kCyan,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700)),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(e.value,
                                    style: const TextStyle(
                                        color: kTextSec, fontSize: 13)),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // ── CTA button ──────────────────────────────────────────────────────
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: SizedBox(
            height: 54,
            child: ElevatedButton(
              onPressed: canJoin
                  ? () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                              JoinLobbyScreen(tournamentId: id, data: data),
                        ),
                      )
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    canJoin ? (active ? kGreen : kCyan) : kTextMuted,
                foregroundColor: kBgDeep,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: Text(
                canJoin
                    ? (free ? 'JOIN FOR FREE' : 'JOIN FOR $entryFee GC')
                    : 'TOURNAMENT CLOSED',
                style:
                    const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOIN LOBBY SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class JoinLobbyScreen extends StatefulWidget {
  final String tournamentId;
  final Map<String, dynamic> data;
  const JoinLobbyScreen(
      {super.key, required this.tournamentId, required this.data});

  @override
  State<JoinLobbyScreen> createState() => _JoinLobbyScreenState();
}

class _JoinLobbyScreenState extends State<JoinLobbyScreen> {
  bool _joining = false;

  Future<void> _confirmJoin() async {
    setState(() => _joining = true);
    try {
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final entryFee = widget.data['entryFee'] ?? 0;
      final free = entryFee == 0;

      // Check wallet balance
      if (!free) {
        final walletSnap = await FirebaseFirestore.instance
            .collection('wallets')
            .doc(uid)
            .get();
        final balance = (walletSnap.data()?['balance'] ?? 0) as num;
        if (balance < entryFee) {
          _showError('Insufficient GC balance. Top up your wallet first.');
          return;
        }
      }

      // Atomic batch write
      final batch = FirebaseFirestore.instance.batch();

      final lobbyRef = FirebaseFirestore.instance
          .collection('tournaments')
          .doc(widget.tournamentId)
          .collection('lobby')
          .doc(uid);
      batch.set(lobbyRef, {
        'uid': uid,
        'joinedAt': FieldValue.serverTimestamp(),
        'status': 'waiting',
      });

      final tourRef = FirebaseFirestore.instance
          .collection('tournaments')
          .doc(widget.tournamentId);
      batch.update(tourRef, {
        'currentPlayers': FieldValue.increment(1),
      });

      if (!free) {
        final walletRef =
            FirebaseFirestore.instance.collection('wallets').doc(uid);
        batch.update(walletRef, {
          'balance': FieldValue.increment(-entryFee),
        });
      }

      await batch.commit();

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => WaitingRoomScreen(
              tournamentId: widget.tournamentId, data: widget.data),
        ),
      );
    } catch (e) {
      _showError('Failed to join. Please try again.');
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: Colors.redAccent,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final free = (widget.data['entryFee'] ?? 0) == 0;
    final entryFee = widget.data['entryFee'] ?? 0;
    final prize = widget.data['prize'] ?? widget.data['total_pool'] ?? '0';
    final title = widget.data['title'] ?? 'Tournament';

    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: kBgDeep,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Confirm Entry',
            style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          const Spacer(),

          // Trophy
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kCyan.withOpacity(0.1),
              border: Border.all(color: kCyan.withOpacity(0.3), width: 2),
            ),
            child: const Icon(Icons.emoji_events, color: kCyan, size: 44),
          ),
          const SizedBox(height: 20),
          Text(title,
              style: const TextStyle(
                  color: kTextPri, fontSize: 20, fontWeight: FontWeight.w800),
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          const Text('Review your entry details below',
              style: TextStyle(color: kTextSec, fontSize: 13)),

          const Spacer(),

          // Summary card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(children: [
              _SummaryRow(
                  label: 'Tournament', value: title, valueColor: kTextPri),
              const Divider(color: kBorder, height: 24),
              _SummaryRow(
                  label: 'Entry Fee',
                  value: free ? 'FREE' : '$entryFee GC',
                  valueColor: free ? kGreen : kOrange),
              const Divider(color: kBorder, height: 24),
              _SummaryRow(
                  label: 'Prize Pool', value: '₦$prize', valueColor: kCyan),
              const Divider(color: kBorder, height: 24),
              _SummaryRow(
                  label: 'Deducted From',
                  value: free ? 'Nothing' : 'GC Wallet',
                  valueColor: kTextSec),
            ]),
          ),
          const SizedBox(height: 16),

          if (!free)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: kOrange.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: kOrange.withOpacity(0.2)),
              ),
              child: const Row(children: [
                Icon(Icons.info_outline, color: kOrange, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Entry fee is non-refundable once you join the lobby.',
                    style: TextStyle(color: kOrange, fontSize: 12),
                  ),
                ),
              ]),
            ),

          const Spacer(),

          // Confirm button
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: _joining ? null : _confirmJoin,
              style: ElevatedButton.styleFrom(
                backgroundColor: kCyan,
                foregroundColor: kBgDeep,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _joining
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: kBgDeep),
                    )
                  : Text(
                      free
                          ? 'CONFIRM — JOIN FREE'
                          : 'CONFIRM — PAY $entryFee GC',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 15),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel',
                style: TextStyle(color: kTextSec, fontSize: 14)),
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WAITING ROOM SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class WaitingRoomScreen extends StatefulWidget {
  final String tournamentId;
  final Map<String, dynamic> data;
  const WaitingRoomScreen(
      {super.key, required this.tournamentId, required this.data});

  @override
  State<WaitingRoomScreen> createState() => _WaitingRoomScreenState();
}

class _WaitingRoomScreenState extends State<WaitingRoomScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulse;
  Timer? _countdownTimer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _pulse =
        AnimationController(vsync: this, duration: const Duration(seconds: 1))
          ..repeat(reverse: true);
    _startCountdown();
  }

  void _startCountdown() {
    final startTime = widget.data['startTime'] != null
        ? (widget.data['startTime'] as Timestamp).toDate()
        : null;
    if (startTime == null) return;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final diff = startTime.difference(DateTime.now());
      if (mounted) {
        setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
      }
    });
  }

  @override
  void dispose() {
    _pulse.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  String _fmt(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return d.inHours > 0 ? '$h:$m:$s' : '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.data['title'] ?? 'Tournament';
    final maxPlayers = widget.data['maxPlayers'] ?? 0;
    final hasTimer = widget.data['startTime'] != null;
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: kBgDeep,
        appBar: AppBar(
          backgroundColor: kBgDeep,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: const Text('Waiting Room',
              style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
          actions: [
            TextButton(
              onPressed: () => _confirmLeave(context),
              child: const Text('Leave',
                  style: TextStyle(color: Colors.redAccent, fontSize: 13)),
            ),
          ],
        ),
        body: Column(children: [
          // Status card
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [kCyan.withOpacity(0.15), kBgCard],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kCyan.withOpacity(0.2)),
            ),
            child: Column(children: [
              AnimatedBuilder(
                animation: _pulse,
                builder: (_, __) => Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: kGreen.withOpacity(0.1 + _pulse.value * 0.15),
                    border: Border.all(
                        color: kGreen.withOpacity(0.3 + _pulse.value * 0.4),
                        width: 2),
                  ),
                  child:
                      const Icon(Icons.emoji_events, color: kGreen, size: 28),
                ),
              ),
              const SizedBox(height: 10),
              Text(title,
                  style: const TextStyle(
                      color: kTextPri,
                      fontSize: 16,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                        color: kGreen, shape: BoxShape.circle)),
                const SizedBox(width: 6),
                const Text("YOU'RE IN THE LOBBY",
                    style: TextStyle(
                        color: kGreen,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5)),
              ]),
            ]),
          ),

          // Countdown
          if (hasTimer)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kBorder),
                ),
                child: Column(children: [
                  Text('MATCH STARTS IN',
                      style: kLabel.copyWith(color: kTextSec)),
                  const SizedBox(height: 6),
                  Text(
                    _remaining == Duration.zero
                        ? 'STARTING...'
                        : _fmt(_remaining),
                    style: const TextStyle(
                        color: kCyan,
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2),
                  ),
                ]),
              ),
            ),

          // Players header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
            child: Row(children: [
              Text('PLAYERS IN LOBBY', style: kLabel.copyWith(color: kTextSec)),
              const Spacer(),
              StreamBuilder<QuerySnapshot>(
                stream: FirebaseFirestore.instance
                    .collection('tournaments')
                    .doc(widget.tournamentId)
                    .collection('lobby')
                    .snapshots(),
                builder: (ctx, snap) {
                  final count = snap.data?.docs.length ?? 0;
                  return Text(
                    '$count${maxPlayers > 0 ? '/$maxPlayers' : ''}',
                    style: const TextStyle(
                        color: kCyan,
                        fontWeight: FontWeight.w700,
                        fontSize: 13),
                  );
                },
              ),
            ]),
          ),

          // Player list
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('tournaments')
                  .doc(widget.tournamentId)
                  .collection('lobby')
                  .orderBy('joinedAt')
                  .snapshots(),
              builder: (ctx, snap) {
                final docs = snap.data?.docs ?? [];
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final d = docs[i].data() as Map<String, dynamic>;
                    final isMe = d['uid'] == uid;
                    return FutureBuilder<DocumentSnapshot>(
                      future: FirebaseFirestore.instance
                          .collection('users')
                          .doc(d['uid'])
                          .get(),
                      builder: (ctx, uSnap) {
                        final user =
                            uSnap.data?.data() as Map<String, dynamic>?;
                        final username = user?['username'] ?? 'Player';
                        final avatar = user?['avatar'] ?? 'BOT';
                        final emoji = kAvatars.firstWhere(
                                (a) => a['name'] == avatar,
                                orElse: () => kAvatars[0])['emoji'] ??
                            '🤖';

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isMe ? kCyan.withOpacity(0.08) : kBgCard,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: isMe ? kCyan.withOpacity(0.3) : kBorder),
                          ),
                          child: Row(children: [
                            Text(emoji, style: const TextStyle(fontSize: 22)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                isMe ? '$username (You)' : username,
                                style: TextStyle(
                                    color: isMe ? kCyan : kTextPri,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14),
                              ),
                            ),
                            if (i == 0)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: kOrange.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text('FIRST IN',
                                    style: TextStyle(
                                        color: kOrange,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800)),
                              ),
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(left: 8),
                              decoration: const BoxDecoration(
                                  color: kGreen, shape: BoxShape.circle),
                            ),
                          ]),
                        );
                      },
                    );
                  },
                );
              },
            ),
          ),

          // Bottom info
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: kBgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kBorder),
              ),
              child: const Row(children: [
                Icon(Icons.info_outline, color: kTextSec, size: 16),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Stay on this screen. The match starts automatically when the lobby fills or the timer ends.',
                    style: TextStyle(color: kTextSec, fontSize: 12),
                  ),
                ),
              ]),
            ),
          ),
        ]),
      ),
    );
  }

  void _confirmLeave(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Leave Lobby?',
            style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
        content: const Text(
          'Leaving removes you from the lobby. Entry fees are non-refundable.',
          style: TextStyle(color: kTextSec),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Stay',
                style: TextStyle(color: kCyan, fontWeight: FontWeight.w700)),
          ),
          TextButton(
            onPressed: () async {
              final uid = FirebaseAuth.instance.currentUser?.uid;
              if (uid != null) {
                await FirebaseFirestore.instance
                    .collection('tournaments')
                    .doc(widget.tournamentId)
                    .collection('lobby')
                    .doc(uid)
                    .delete();
                await FirebaseFirestore.instance
                    .collection('tournaments')
                    .doc(widget.tournamentId)
                    .update({'currentPlayers': FieldValue.increment(-1)});
              }
              if (context.mounted) {
                Navigator.of(context).popUntil((r) => r.isFirst);
              }
            },
            child: const Text('Leave',
                style: TextStyle(
                    color: Colors.redAccent, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED WIDGETS
// ─────────────────────────────────────────────────────────────────────────────
class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatTile(
      {required this.icon,
      required this.label,
      required this.value,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(height: 6),
        Text(label, style: kLabel.copyWith(fontSize: 9)),
        const SizedBox(height: 2),
        Text(value,
            style: TextStyle(
                color: color, fontWeight: FontWeight.w800, fontSize: 14)),
      ]),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  const _SummaryRow(
      {required this.label, required this.value, required this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: kTextSec, fontSize: 13)),
        Text(value,
            style: TextStyle(
                color: valueColor, fontWeight: FontWeight.w700, fontSize: 14)),
      ],
    );
  }
}

class _CountdownCard extends StatefulWidget {
  final DateTime startTime;
  const _CountdownCard({required this.startTime});

  @override
  State<_CountdownCard> createState() => _CountdownCardState();
}

class _CountdownCardState extends State<_CountdownCard> {
  late Timer _timer;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final diff = widget.startTime.difference(DateTime.now());
    if (mounted) {
      setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
    }
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final h = _remaining.inHours;
    final m = _remaining.inMinutes % 60;
    final s = _remaining.inSeconds % 60;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kYellowDot.withOpacity(0.3)),
      ),
      child: Column(children: [
        Text('STARTS IN', style: kLabel.copyWith(color: kYellowDot)),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _TimeUnit(value: h, label: 'HRS'),
            const _Colon(),
            _TimeUnit(value: m, label: 'MIN'),
            const _Colon(),
            _TimeUnit(value: s, label: 'SEC'),
          ],
        ),
      ]),
    );
  }
}

class _TimeUnit extends StatelessWidget {
  final int value;
  final String label;
  const _TimeUnit({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: 58,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: kBgDeep,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: kBorder),
        ),
        child: Center(
          child: Text(
            value.toString().padLeft(2, '0'),
            style: const TextStyle(
                color: kYellowDot, fontSize: 24, fontWeight: FontWeight.w900),
          ),
        ),
      ),
      const SizedBox(height: 4),
      Text(label, style: kLabel.copyWith(fontSize: 9)),
    ]);
  }
}

class _Colon extends StatelessWidget {
  const _Colon();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(6, 0, 6, 14),
      child: Text(':',
          style: TextStyle(
              color: kYellowDot, fontSize: 24, fontWeight: FontWeight.w900)),
    );
  }
}
