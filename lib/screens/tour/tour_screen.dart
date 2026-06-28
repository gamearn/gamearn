import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'tournament_details_screen.dart';
import 'tournament_entry_screen.dart';
import 'create_tournament_screen.dart';
import 'tournament_pending_screen.dart';
import 'tournament_results_screen.dart';

// ════════════════════════════════════════════════════════════════
//  TOUR SCREEN  — Figma matched (390×844)
//
//  Header: title + Create btn (40×40 rx=8 #FF5E00)
//  Tab bar: 342×36 rx=8 #1E293B, active pill rx=6 #22D1EE
//  Cards: 342×100 rx=12 gradient overlay
//    — hero image full width, gradient #0B0E1A bottom
//    — status chip 68×22 rx=11 #22D1EE (live) / #313F55 (upcoming)
//    — prize badge 105×30 rx=15 #313F55 right
//    — player avatars 30×30 rx=15 overlapping + "+N" badge 30×32 rx=16 #313F55
// ════════════════════════════════════════════════════════════════

class TourScreen extends StatefulWidget {
  const TourScreen({super.key});
  @override
  State<TourScreen> createState() => _TourScreenState();
}

class _TourScreenState extends State<TourScreen> {
  int _tab = 0;
  static const _tabs = ['All', 'Live', 'Upcoming', 'Completed'];

  String? get _statusFilter => switch (_tab) {
    1 => 'live',
    2 => 'upcoming',
    3 => 'completed',
    _ => null,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      body: SafeArea(
        child: Column(children: [

          // ── HEADER ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              const Text('Tournaments',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20, fontWeight: FontWeight.w900)),
              const Spacer(),
              // Create btn — 40×40 rx=8 #FF5E00
              GestureDetector(
                onTap: () => _showCreateSheet(context),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: kOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.add_rounded,
                      color: Colors.white, size: 22),
                ),
              ),
            ]),
          ),

          const SizedBox(height: 14),

          // ── TAB BAR — Figma: 342×36 rx=8 #1E293B ─────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              height: 36,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
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
                          color: active ? kCyan : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text(_tabs[i],
                              style: TextStyle(
                                  color: active
                                      ? const Color(0xFF0B0E1A)
                                      : const Color(0xFF9A9A9A),
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

          // ── CARDS LIST ────────────────────────────────────────────
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _statusFilter == null
                  ? FirebaseFirestore.instance
                      .collection('tournaments')
                      .orderBy('createdAt', descending: true)
                      .snapshots()
                  : FirebaseFirestore.instance
                      .collection('tournaments')
                      .where('status', isEqualTo: _statusFilter)
                      .orderBy('createdAt', descending: true)
                      .snapshots(),
              builder: (_, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator(
                          color: kCyan, strokeWidth: 2));
                }
                final docs = snap.data?.docs ?? [];
                if (docs.isEmpty) {
                  return _emptyState();
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: docs.length,
                  itemBuilder: (_, i) {
                    final data =
                        docs[i].data() as Map<String, dynamic>;
                    data['id'] = docs[i].id;
                    final tStatus = data['status'] as String? ?? 'upcoming';
                    final tId     = docs[i].id;
                    final tTitle  = data['title'] as String? ?? 'Tournament';
                    return _TourCard(
                      data: data,
                      onTap: () {
                        Widget dest;
                        if (tStatus == 'pending') {
                          dest = TournamentPendingScreen(tournamentId: tId);
                        } else if (tStatus == 'completed') {
                          dest = TournamentResultsScreen(tournamentId: tId);
                        } else {
                          dest = TournamentDetailsScreen(tournamentId: tId);
                        }
                        Navigator.push(context,
                            MaterialPageRoute(builder: (_) => dest));
                      },
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

  Widget _emptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Text('🏆', style: TextStyle(fontSize: 52)),
      const SizedBox(height: 12),
      Text(
        _tab == 0
            ? 'No tournaments yet'
            : 'No ${_tabs[_tab].toLowerCase()} tournaments',
        style: const TextStyle(color: Color(0xFF9A9A9A), fontSize: 15),
      ),
      if (_tab == 0) ...[
        const SizedBox(height: 20),
        GestureDetector(
          onTap: () => _showCreateSheet(context),
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 28, vertical: 12),
            decoration: BoxDecoration(
              color: kOrange,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text('Create Tournament',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ),
      ],
    ]),
  );

  void _showCreateSheet(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreateTournamentScreen()),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT CARD
//  Figma: 342×100 rx=12 gradient, hero image, status chip, prize badge
//  player avatars 30×30 rx=15, "+N" 30×32 rx=16 #313F55
// ════════════════════════════════════════════════════════════════
class _TourCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onTap;
  const _TourCard({required this.data, required this.onTap});

  static const _assets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  @override
  Widget build(BuildContext context) {
    final title      = data['title']       as String? ?? 'Tournament';
    final prize      = data['prizePool']   as String? ?? '0';
    final players    = (data['players']    as List?)?.length ?? 0;
    final maxP       = data['maxPlayers']  as int?    ?? 32;
    final status     = data['status']      as String? ?? 'upcoming';
    final gameKey    = (data['gameType']   as String? ?? 'whot').toLowerCase();
    final asset      = _assets.entries
        .firstWhere((e) => gameKey.contains(e.key),
            orElse: () => _assets.entries.first)
        .value;

    final isLive = status == 'live';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 160,
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(12),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(fit: StackFit.expand, children: [
            // Hero image
            Image.asset(asset, fit: BoxFit.cover),
            // Gradient overlay
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x330B0E1A), Color(0xEE0B0E1A)],
                  stops: [0.0, 0.85],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top row: status chip + prize badge
                  Row(children: [
                    // Status chip — Figma: 68×22 rx=11 #22D1EE live / #313F55 upcoming
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isLive
                            ? kCyan
                            : const Color(0xFF313F55),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Text(
                        isLive ? '● Live' : status.toUpperCase(),
                        style: TextStyle(
                            color: isLive
                                ? const Color(0xFF0B0E1A)
                                : Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w800),
                      ),
                    ),
                    const Spacer(),
                    // Prize badge — Figma: 105×30 rx=15 #313F55
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF313F55),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Text('₦$prize',
                          style: const TextStyle(
                              color: kCyan,
                              fontSize: 12,
                              fontWeight: FontWeight.w800)),
                    ),
                  ]),
                  const Spacer(),
                  // Title
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15, fontWeight: FontWeight.w800),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 6),
                  // Bottom row: avatars + player count badge
                  Row(children: [
                    // Player avatars stacked — Figma: 30×30 rx=15 overlapping
                    SizedBox(
                      width: 70, height: 24,
                      child: Stack(
                        children: List.generate(
                          (players).clamp(0, 3),
                          (i) => Positioned(
                            left: i * 16.0,
                            child: Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF1E293B),
                                border: Border.all(
                                    color: const Color(0xFF0B0E1A),
                                    width: 1.5),
                              ),
                              child: const Center(
                                  child: Text('👤',
                                      style: TextStyle(fontSize: 11))),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // "+N" badge — Figma: 30×32 rx=16 #313F55
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF313F55),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text('$players/$maxP players',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10)),
                    ),
                  ]),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  CREATE TOURNAMENT SHEET
//  Figma: fields 341×59 rx=12 #1E293B
//         game picker 4× 78×79 rx=12 #16223F
//         prize toggle 161×74 rx=12 #22D1EE (active) / #16223F
// ════════════════════════════════════════════════════════════════
class _CreateTournamentSheet extends StatefulWidget {
  const _CreateTournamentSheet();
  @override
  State<_CreateTournamentSheet> createState() =>
      _CreateTournamentSheetState();
}

class _CreateTournamentSheetState extends State<_CreateTournamentSheet> {
  final _titleCtrl  = TextEditingController();
  final _prizeCtrl  = TextEditingController();
  int  _gameIdx     = 0;
  int  _prizeMode   = 0; // 0=coins 1=naira
  int  _maxPlayers  = 8;
  bool _saving      = false;

  static const _games = [
    {'key': 'whot',     'label': 'WHOT',     'emoji': '🃏'},
    {'key': 'ludo',     'label': 'Lúdò',     'emoji': '🎲'},
    {'key': 'ayo',      'label': 'Ayò',      'emoji': '🪨'},
    {'key': 'draughts', 'label': 'Draughts', 'emoji': '🔴'},
  ];

  static const _sizes = [4, 8, 16, 32];

  @override
  void dispose() {
    _titleCtrl.dispose(); _prizeCtrl.dispose(); super.dispose();
  }

  Future<void> _create() async {
    if (_titleCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      await FirebaseFirestore.instance.collection('tournaments').add({
        'title':      _titleCtrl.text.trim(),
        'prizePool':  _prizeCtrl.text.trim(),
        'gameType':   _games[_gameIdx]['key'],
        'maxPlayers': _maxPlayers,
        'players':    [uid],
        'status':     'upcoming',
        'createdBy':  uid,
        'createdAt':  FieldValue.serverTimestamp(),
      });
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0B0E1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: ListView(
          controller: ctrl,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Create Tournament',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18, fontWeight: FontWeight.w900)),
            const SizedBox(height: 20),

            // Title field — Figma: 341×59 rx=12 #1E293B
            _field(_titleCtrl, 'Tournament Name',
                Icons.emoji_events_outlined),
            const SizedBox(height: 10),

            // Prize field
            _field(_prizeCtrl, 'Prize Pool (e.g. 50000)',
                Icons.monetization_on_outlined),
            const SizedBox(height: 20),

            // Game picker — Figma: 4× 78×79 rx=12 #16223F
            const Text('Select Game',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Row(
              children: List.generate(_games.length, (i) {
                final active = _gameIdx == i;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _gameIdx = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      height: 79,
                      margin: EdgeInsets.only(
                          right: i < _games.length - 1 ? 8 : 0),
                      decoration: BoxDecoration(
                        // Figma: #16223F base, active adds cyan border
                        color: const Color(0xFF16223F),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: active
                              ? kCyan
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(_games[i]['emoji'] as String,
                              style: const TextStyle(fontSize: 26)),
                          const SizedBox(height: 4),
                          Text(_games[i]['label'] as String,
                              style: TextStyle(
                                  color: active ? kCyan : Colors.white54,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),

            const SizedBox(height: 20),

            // Prize mode toggle — Figma: 342×82 rx=12 #1E293B
            // active half: 161×74 rx=12 #22D1EE
            const Text('Prize Type',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Container(
              height: 82,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(children: [
                Expanded(child: _prizeToggle(0, '🪙 Coins')),
                const SizedBox(width: 4),
                Expanded(child: _prizeToggle(1, '₦ Naira')),
              ]),
            ),

            const SizedBox(height: 20),

            // Max players
            const Text('Max Players',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14, fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            Row(
              children: _sizes.map((s) {
                final active = _maxPlayers == s;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _maxPlayers = s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      height: 48,
                      margin: EdgeInsets.only(
                          right: s != _sizes.last ? 8 : 0),
                      decoration: BoxDecoration(
                        color: active ? kCyan : const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: active
                                ? kCyan
                                : const Color(0xFF334155)),
                      ),
                      child: Center(
                        child: Text('$s',
                            style: TextStyle(
                                color: active
                                    ? const Color(0xFF0B0E1A)
                                    : Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w800)),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 28),

            // Create button
            GestureDetector(
              onTap: _saving ? null : _create,
              child: Container(
                height: 54,
                decoration: BoxDecoration(
                  color: kOrange,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: _saving
                      ? const CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2)
                      : const Text('Create Tournament',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w800)),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _prizeToggle(int idx, String label) {
    final active = _prizeMode == idx;
    return GestureDetector(
      onTap: () => setState(() => _prizeMode = idx),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        decoration: BoxDecoration(
          // Figma: active 161×74 rx=12 #22D1EE
          color: active ? kCyan : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(label,
              style: TextStyle(
                  color: active
                      ? const Color(0xFF0B0E1A)
                      : const Color(0xFF9A9A9A),
                  fontSize: 14,
                  fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon) =>
      Container(
        height: 59,
        decoration: BoxDecoration(
          // Figma: 341×59 rx=12 #1E293B
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            Icon(icon, color: kCyan, size: 18),
            const SizedBox(width: 12),
            Expanded(child: TextField(
              controller: ctrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: Color(0xFF9A9A9A)),
                border: InputBorder.none,
              ),
            )),
          ]),
        ),
      );
}
