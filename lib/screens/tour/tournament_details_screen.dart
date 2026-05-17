import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'tournament_entry_screen.dart';

// ---------------------------------------------------------------------------
// TournamentDetailsScreen
// Stack: Flutter + Firestore (tournament doc) + Socket.io (live participant count)
// Routing: Navigator.push(ctx, MaterialPageRoute(builder: (_) =>
//   TournamentDetailsScreen(tournamentId: id)))
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class TournamentDetailsScreen extends StatefulWidget {
  final String tournamentId;

  const TournamentDetailsScreen({super.key, required this.tournamentId});

  @override
  State<TournamentDetailsScreen> createState() =>
      _TournamentDetailsScreenState();
}

class _TournamentDetailsScreenState extends State<TournamentDetailsScreen>
    with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFF0B0E1A);
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);
  static const _surface = Color(0xFF141827);
  static const _border = Color(0xFF1E2438);

  late TabController _tabCtrl;

  // Mock tournament data — replace with Firestore stream
  final Map<String, dynamic> _tournament = {
    'title': 'Whot Championship',
    'game': 'Whot',
    'status': 'open', // open | live | ended
    'entryFee': 500,
    'prizePool': 25000,
    'maxPlayers': 32,
    'registeredPlayers': 21,
    'startsIn': '2h 40m',
    'startTime': 'Today, 8:00 PM',
    'duration': '~3 hours',
    'format': 'Single Elimination',
    'rounds': 5,
    'bannerGradient': [const Color(0xFF0E2A4A), const Color(0xFF0B0E1A)],
  };

  final List<Map<String, dynamic>> _prizes = [
    {'place': '1st', 'prize': '₦15,000', 'icon': '🥇'},
    {'place': '2nd', 'prize': '₦6,000', 'icon': '🥈'},
    {'place': '3rd', 'prize': '₦2,500', 'icon': '🥉'},
    {'place': 'Top 8', 'prize': '₦500', 'icon': '🏅'},
  ];

  final List<Map<String, dynamic>> _participants = List.generate(
    21,
    (i) => {
      'name': [
        'Chukwuemeka',
        'Amaka',
        'Babatunde',
        'Ngozi',
        'Emeka',
        'Fatima',
        'Kelechi',
        'Aisha',
        'Tunde',
        'Chisom',
        'Uche',
        'Halima',
        'Ifeanyi',
        'Zainab',
        'Obinna',
        'Rukayat',
        'Chidi',
        'Blessing',
        'Adaeze',
        'Musa',
        'Greatman',
      ][i],
      'rating': 1200 + (i * 37) % 800,
      'wins': (i * 13) % 40,
      'avatar': String.fromCharCode(0x41 + i % 26),
    },
  );

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    // TODO: Firestore.instance.collection('tournaments')
    //   .doc(widget.tournamentId).snapshots().listen(...)
    // TODO: Socket.io join room `tournament:${widget.tournamentId}`
    //   listen to 'player_joined' / 'player_left' events
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isOpen = _tournament['status'] == 'open';
    final bool isFull = _tournament['registeredPlayers'] >=
        _tournament['maxPlayers'];
    final double fillRatio = (_tournament['registeredPlayers'] as int) /
        (_tournament['maxPlayers'] as int);

    return Scaffold(
      backgroundColor: _bg,
      body: CustomScrollView(
        slivers: [
          // ── Hero App Bar ─────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: _bg,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon:
                    const Icon(Icons.share_rounded, color: Colors.white, size: 22),
                onPressed: () {
                  // TODO: Share.share('Join ${_tournament['title']} on Gamearn!')
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _TournamentHero(
                tournament: _tournament,
                fillRatio: fillRatio,
              ),
            ),
          ),

          // ── Tab bar ──────────────────────────────────────────────────
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(
              TabBar(
                controller: _tabCtrl,
                labelColor: _cyan,
                unselectedLabelColor: Colors.white38,
                indicatorColor: _cyan,
                indicatorSize: TabBarIndicatorSize.label,
                labelStyle: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 13),
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Prizes'),
                  Tab(text: 'Players'),
                ],
              ),
            ),
          ),

          // ── Tab content ──────────────────────────────────────────────
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _OverviewTab(tournament: _tournament),
                _PrizesTab(prizes: _prizes, prizePool: _tournament['prizePool']),
                _PlayersTab(participants: _participants),
              ],
            ),
          ),
        ],
      ),

      // ── Bottom CTA ───────────────────────────────────────────────────
      bottomNavigationBar: _BottomCTA(
        isOpen: isOpen,
        isFull: isFull,
        entryFee: _tournament['entryFee'],
        onEnter: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TournamentEntryScreen(
              tournamentId: widget.tournamentId,
              entryFee: _tournament['entryFee'],
              title: _tournament['title'],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

class _TournamentHero extends StatelessWidget {
  final Map<String, dynamic> tournament;
  final double fillRatio;

  const _TournamentHero({required this.tournament, required this.fillRatio});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: tournament['bannerGradient'] as List<Color>,
          begin: Alignment.topLeft,
          end: Alignment.bottomCenter,
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 90, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _StatusChip(status: tournament['status']),
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFF5E00).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                      color: const Color(0xFFFF5E00).withOpacity(0.4)),
                ),
                child: Text(
                  '₦${(tournament['prizePool'] as int).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Pool',
                  style: const TextStyle(
                      color: Color(0xFFFF5E00),
                      fontWeight: FontWeight.w800,
                      fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            tournament['title'],
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 22,
                letterSpacing: 0.2),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fillRatio,
                    backgroundColor: Colors.white12,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF22D1EE)),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${tournament['registeredPlayers']}/${tournament['maxPlayers']}',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final Color color = status == 'live'
        ? Colors.redAccent
        : status == 'open'
            ? Colors.greenAccent
            : Colors.white38;
    final String label =
        status == 'live' ? '● LIVE' : status.toUpperCase();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 11,
              letterSpacing: 0.5)),
    );
  }
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

class _OverviewTab extends StatelessWidget {
  final Map<String, dynamic> tournament;
  const _OverviewTab({required this.tournament});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _InfoGrid(tournament: tournament),
        const SizedBox(height: 16),
        _InfoRow(
            label: 'Format', value: tournament['format']),
        _InfoRow(label: 'Rounds', value: '${tournament['rounds']}'),
        _InfoRow(label: 'Duration', value: tournament['duration']),
        _InfoRow(label: 'Start Time', value: tournament['startTime']),
        const SizedBox(height: 16),
        _RulesCard(),
      ],
    );
  }
}

class _InfoGrid extends StatelessWidget {
  final Map<String, dynamic> tournament;
  const _InfoGrid({required this.tournament});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _GridStat(
          label: 'Entry Fee',
          value: '${tournament['entryFee']} coins',
          icon: Icons.monetization_on_rounded,
          color: const Color(0xFF22D1EE),
        ),
        const SizedBox(width: 10),
        _GridStat(
          label: 'Starts In',
          value: tournament['startsIn'],
          icon: Icons.timer_outlined,
          color: const Color(0xFFFF5E00),
        ),
      ],
    );
  }
}

class _GridStat extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _GridStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF141827),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1E2438)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          color: Colors.white38, fontSize: 11)),
                  Text(value,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(color: Colors.white54, fontSize: 13)),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13)),
        ],
      ),
    );
  }
}

class _RulesCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E2438)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Rules',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14)),
          const SizedBox(height: 10),
          ...[
            'Standard Whot rules apply.',
            'Each round is best-of-1.',
            'No disconnections allowed — forfeiture after 60s.',
            'Prize credited within 24h of tournament end.',
          ].map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ',
                        style: TextStyle(color: Color(0xFF22D1EE))),
                    Expanded(
                        child: Text(r,
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 13))),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}

class _PrizesTab extends StatelessWidget {
  final List<Map<String, dynamic>> prizes;
  final int prizePool;
  const _PrizesTab({required this.prizes, required this.prizePool});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(
            children: [
              const Icon(Icons.emoji_events_rounded,
                  color: Color(0xFFFF5E00), size: 48),
              const SizedBox(height: 6),
              Text(
                '₦${prizePool.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 32),
              ),
              const Text('Total Prize Pool',
                  style: TextStyle(color: Colors.white38, fontSize: 13)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        ...prizes.map((p) => _PrizeRow(prize: p)),
      ],
    );
  }
}

class _PrizeRow extends StatelessWidget {
  final Map<String, dynamic> prize;
  const _PrizeRow({required this.prize});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E2438)),
      ),
      child: Row(
        children: [
          Text(prize['icon'], style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 14),
          Text(prize['place'],
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 15)),
          const Spacer(),
          Text(prize['prize'],
              style: const TextStyle(
                  color: Color(0xFFFF5E00),
                  fontWeight: FontWeight.w800,
                  fontSize: 16)),
        ],
      ),
    );
  }
}

class _PlayersTab extends StatelessWidget {
  final List<Map<String, dynamic>> participants;
  const _PlayersTab({required this.participants});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: participants.length,
      itemBuilder: (ctx, i) {
        final p = participants[i];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: const Color(0xFF22D1EE).withOpacity(0.15),
            child: Text(p['avatar'],
                style: const TextStyle(
                    color: Color(0xFF22D1EE), fontWeight: FontWeight.w700)),
          ),
          title: Text(p['name'],
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
          subtitle: Text('${p['wins']} wins  ·  Rating ${p['rating']}',
              style: const TextStyle(color: Colors.white38, fontSize: 12)),
          trailing: Text('#${i + 1}',
              style: const TextStyle(color: Colors.white38, fontSize: 13)),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

class _BottomCTA extends StatelessWidget {
  final bool isOpen;
  final bool isFull;
  final int entryFee;
  final VoidCallback onEnter;

  const _BottomCTA({
    required this.isOpen,
    required this.isFull,
    required this.entryFee,
    required this.onEnter,
  });

  @override
  Widget build(BuildContext context) {
    final bool canEnter = isOpen && !isFull;

    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: const BoxDecoration(
        color: Color(0xFF0F1220),
        border: Border(top: BorderSide(color: Color(0xFF1E2438))),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: canEnter ? onEnter : null,
          style: ElevatedButton.styleFrom(
            backgroundColor:
                canEnter ? const Color(0xFFFF5E00) : Colors.white12,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
          ),
          child: Text(
            isFull
                ? 'Tournament Full'
                : !isOpen
                    ? 'Registration Closed'
                    : 'Enter for $entryFee Coins',
            style: TextStyle(
              color: canEnter ? Colors.white : Colors.white38,
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SliverPersistentHeader delegate for tab bar
// ---------------------------------------------------------------------------

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFF0B0E1A),
      child: tabBar,
    );
  }

  @override
  double get maxExtent => tabBar.preferredSize.height;
  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) => false;
}
