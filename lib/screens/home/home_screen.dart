import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../theme.dart';
import '../games/game_info_screen.dart';
import '../games/whot_game_screen.dart';
import '../games/ludo_game_screen.dart';
import '../games/ayo_game_screen.dart';
import '../games/draughts_game_screen.dart';
import '../../data/welcome_messages.dart';
import 'notifications_screen.dart';
import '../profile/settings_screen.dart';
import '../profile/daily_streak_screen.dart';

// ── Avatar map ──────────────────────────────────────────────────────────────
String _avatarEmoji(String avatar) =>
    kAvatars.firstWhere((a) => a['name'] == avatar,
        orElse: () => kAvatars[0])['emoji'] ?? '🤖';

// ── Game routing ─────────────────────────────────────────────────────────────
const Map<String, String> kGameAssets = {
  'whot':      'assets/games/whot.jpg',
  'ludo':      'assets/games/ludo.png',
  'ayo':       'assets/games/ayo.jpg',
  'draughts': 'assets/games/draughts.jpg',
};

String? _assetFor(String key) {
  for (final k in kGameAssets.keys) {
    if (key.contains(k)) return kGameAssets[k];
  }
  if (key.contains('draft')) return kGameAssets['draughts'];
  return null;
}

// ════════════════════════════════════════════════════════════════
//  HOME SCREEN
// ════════════════════════════════════════════════════════════════
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final String _welcomeMsg;

  @override
  void initState() {
    super.initState();
    final msgs = List<String>.from(kWelcomeMessages)..shuffle();
    _welcomeMsg = msgs.first;
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance.collection('users').doc(uid).snapshots(),
          builder: (_, userSnap) {
            final user = (userSnap.data?.data() as Map<String, dynamic>?) ?? {};
            final username = user['username'] as String? ?? 'Player';
            final avatar   = user['avatar']   as String? ?? 'BOT';
            final status   = user['memberStatus'] as String? ?? 'Active Member';

            return StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance.collection('wallets').doc(uid).snapshots(),
              builder: (_, walSnap) {
                final wallet  = (walSnap.data?.data() as Map<String, dynamic>?) ?? {};
                final balance = wallet['balance'] ?? 0;
                final streak  = user['dayStreak'] ?? 0;

                return CustomScrollView(
                  slivers: [
                    // ── TOP NAV BAR ────────────────────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                        child: Row(
                          children: [
                            // Avatar
                            Container(
                              width: 38, height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: kOrange, width: 2),
                                color: context.card,
                              ),
                              child: Center(
                                child: Text(_avatarEmoji(avatar),
                                    style: const TextStyle(fontSize: 20)),
                              ),
                            ),
                            const SizedBox(width: 10),
                            // Name + status
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(username,
                                      style: TextStyle(
                                          color: context.txtPri,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14)),
                                  Text(status,
                                      style: const TextStyle(
                                          color: kCyan, fontSize: 11,
                                          fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                            // Notification btn
                            _TopBtn(
                              icon: Icons.notifications_outlined,
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                              badge: true,
                            ),
                            const SizedBox(width: 8),
                            // Settings btn
                            _TopBtn(
                              icon: Icons.settings_outlined,
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const SettingsScreen())),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ── WELCOME TEXT ───────────────────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('$_welcomeMsg $username! 👋',
                                style: TextStyle(
                                    color: context.txtPri,
                                    fontSize: 21,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3)),
                            const SizedBox(height: 4),
                            Text('Keep your streak going to earn more rewards.',
                                style: TextStyle(
                                    color: context.txtSec,
                                    fontSize: 13)),
                          ],
                        ),
                      ),
                    ),

                    // ── STAT CARDS ─────────────────────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                        child: Row(children: [
                          Expanded(child: _StatCard(
                            label: 'Wallet Balance',
                            value: '₦$balance',
                            sub: '+500 / day',
                            icon: Icons.account_balance_wallet_rounded,
                          )),
                          const SizedBox(width: 12),
                          Expanded(child: GestureDetector(
                            onTap: () => Navigator.push(context,
                                MaterialPageRoute(builder: (_) => const DailyStreakScreen())),
                            child: _StatCard(
                              label: 'Daily Streak',
                              value: '$streak Days',
                              sub: 'Tap to claim',
                              icon: Icons.local_fire_department_rounded,
                            ),
                          )),
                        ]),
                      ),
                    ),

                    // ── FEATURED TOURNAMENTS ────────────────────────────────
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 10),
                        child: _SectionHeader(title: 'All Tournaments', showAll: true),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 168,
                        child: StreamBuilder<QuerySnapshot>(
                          stream: FirebaseFirestore.instance
                              .collection('tournaments')
                              .orderBy('createdAt', descending: true)
                              .limit(10)
                              .snapshots(),
                          builder: (_, snap) {
                            final docs = snap.data?.docs ?? [];
                            final items = docs.isNotEmpty
                                ? docs.map((d) => d.data() as Map<String, dynamic>).toList()
                                : _mockTournaments();
                            return ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: items.length,
                              itemBuilder: (_, i) => _TournamentCard(data: items[i]),
                            );
                          },
                        ),
                      ),
                    ),

                    // ── GAMES GRID ─────────────────────────────────────────
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: _SectionHeader(title: 'Play Games', showAll: false),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: StreamBuilder<QuerySnapshot>(
                        stream: FirebaseFirestore.instance
                            .collection('arena')
                            .where('active', isEqualTo: true)
                            .limit(6)
                            .snapshots(),
                        builder: (_, snap) {
                          final docs = snap.data?.docs ?? [];
                          final games = docs.isNotEmpty
                              ? docs.map((d) => d.data() as Map<String, dynamic>).toList()
                              : _mockGames();
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: _GamesGrid(games: games, uid: uid),
                          );
                        },
                      ),
                    ),

                    // ── LEADERBOARD MINI ────────────────────────────────────
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 10),
                        child: _SectionHeader(title: 'Global Leaderboard', showAll: true),
                      ),
                    ),
                    const SliverToBoxAdapter(child: _LeaderboardSection()),
                    const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _mockTournaments() => [
    {'title': 'WHOT Championship', 'prizePool': '50,000', 'playerCount': 128, 'active': true,  'assetKey': 'whot'},
    {'title': 'Lúdò Grand Prix',   'prizePool': '25,000', 'playerCount': 64,  'active': false, 'assetKey': 'ludo'},
    {'title': 'Ayò Masters',       'prizePool': '15,000', 'playerCount': 32,  'active': true,  'assetKey': 'ayo'},
  ];

  List<Map<String, dynamic>> _mockGames() => [
    {'title': 'WHOT',     'playCount': 2100, 'assetKey': 'whot'},
    {'title': 'Lúdò',     'playCount': 1200, 'assetKey': 'ludo'},
    {'title': 'Ayò Òpón', 'playCount': 850,  'assetKey': 'ayo'},
    {'title': 'Draughts', 'playCount': 420,  'assetKey': 'draughts'},
  ];
}

// ════════════════════════════════════════════════════════════════
//  TOP BUTTON
// ════════════════════════════════════════════════════════════════
class _TopBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool badge;
  const _TopBtn({required this.icon, required this.onTap, this.badge = false});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Stack(clipBehavior: Clip.none, children: [
      Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: kCyan,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: const Color(0xFF0B0E1A), size: 18),
      ),
      if (badge) Positioned(
        top: -1, right: -1,
        child: Container(
          width: 11, height: 11,
          decoration: BoxDecoration(
            color: kOrange,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF0B0E1A), width: 1.5),
          ),
        ),
      ),
    ]),
  );
}

// ════════════════════════════════════════════════════════════════
//  STAT CARD
// ════════════════════════════════════════════════════════════════
class _StatCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  const _StatCard({required this.label, required this.value,
      required this.sub, required this.icon});

  @override
  Widget build(BuildContext context) => Container(
    height: 78,
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(
      color: kCyan,
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 18),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label,
                style: TextStyle(
                    color: Colors.white.withOpacity(0.75),
                    fontSize: 10, fontWeight: FontWeight.w500)),
            const SizedBox(height: 2),
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16, fontWeight: FontWeight.w800),
                maxLines: 1, overflow: TextOverflow.ellipsis),
            Text(sub,
                style: TextStyle(
                    color: Colors.white.withOpacity(0.65), fontSize: 10)),
          ],
        ),
      ),
    ]),
  );
}

// ════════════════════════════════════════════════════════════════
//  SECTION HEADER
// ════════════════════════════════════════════════════════════════
class _SectionHeader extends StatelessWidget {
  final String title;
  final bool showAll;
  const _SectionHeader({required this.title, required this.showAll});

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(title, style: TextStyle(
          color: context.txtPri, fontSize: 16, fontWeight: FontWeight.w800)),
      if (showAll)
        Text('See all', style: TextStyle(
            color: kCyan, fontSize: 12, fontWeight: FontWeight.w600)),
    ],
  );
}

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT CARD
// ════════════════════════════════════════════════════════════════
class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TournamentCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final title     = data['title']       as String? ?? 'Tournament';
    final prize     = data['prizePool']   as String? ?? '0';
    final players   = data['playerCount'] as int?     ?? 0;
    final active    = data['active']      as bool?    ?? false;
    final assetKey  = (data['assetKey']   as String? ?? 'whot').toLowerCase();
    final asset     = _assetFor(assetKey) ?? kGameAssets['whot']!;

    return Container(
      width: 270,
      height: 160,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Stack(fit: StackFit.expand, children: [
          Image.asset(asset, fit: BoxFit.cover),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x220F172A),
                  Color(0xDD0F172A),
                  Color(0xFF0F172A),
                ],
                stops: [0.0, 0.55, 1.0],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  if (active) _Chip(label: '● Live', color: const Color(0xFF2AE500)),
                  if (active) const SizedBox(width: 8),
                  _Chip(label: '$players Players', color: Colors.white),
                ]),
                const Spacer(),
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 15, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Row(children: [
                  Text('Prize Pool  ',
                      style: TextStyle(color: context.txtSec, fontSize: 11)),
                  Text('₦$prize',
                      style: const TextStyle(
                          color: kCyan, fontSize: 14, fontWeight: FontWeight.w800)),
                ]),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withOpacity(0.15),
      borderRadius: BorderRadius.circular(9),
      border: Border.all(color: color.withOpacity(0.6)),
    ),
    child: Text(label, style: TextStyle(
      color: color, fontSize: 10, fontWeight: FontWeight.w700)),
  );
}

// ════════════════════════════════════════════════════════════════
//  GAMES GRID
// ════════════════════════════════════════════════════════════════
class _GamesGrid extends StatelessWidget {
  final List<Map<String, dynamic>> games;
  final String uid;
  const _GamesGrid({required this.games, required this.uid});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 149 / 149,
      ),
      itemCount: games.length,
      itemBuilder: (_, i) => _GameTile(data: games[i], uid: uid),
    );
  }
}

class _GameTile extends StatelessWidget {
  final Map<String, dynamic> data;
  final String uid;
  const _GameTile({required this.data, required this.uid});

  @override
  Widget build(BuildContext context) {
    final title    = data['title']     as String? ?? 'Game';
    final assetKey = (data['assetKey'] as String? ?? '').toLowerCase();
    final count    = data['playCount'] as int? ?? 0;
    final asset    = _assetFor(assetKey);

    String gameKey = 'whot';
    Widget gameScreen = WhotGameScreen(
      roomId: 'single_player_ai_room',
      playerId: uid,
      playerName: 'You',
      opponentName: 'Gamearn Bot',
    );
    if (assetKey.contains('ludo')) {
      gameKey = 'ludo'; gameScreen = const LudoGameScreen();
    } else if (assetKey.contains('ayo')) {
      gameKey = 'ayo'; 
      gameScreen = AyoGameScreen(
        roomId: 'single_player_ai_room',
        playerId: uid,
        playerName: 'You',
        opponentName: 'Gamearn Bot',
      );
    } else if (assetKey.contains('draft')) {
      gameKey = 'draughts'; 
      gameScreen = DraughtsGameScreen(
        roomId: 'single_player_ai_room',
        playerId: uid,
        playerName: 'You',
        opponentName: 'Gamearn Bot',
      );
    }

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(
          builder: (_) => GameInfoScreen(
              gameKey: gameKey, gameScreen: gameScreen,
              playCount: count))),
      child: Container(
        decoration: BoxDecoration(
          color: kCyan,
          borderRadius: BorderRadius.circular(12),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(fit: StackFit.expand, children: [
            if (asset != null)
              Image.asset(asset, fit: BoxFit.cover),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x00000000), Color(0xCC000000)],
                  stops: [0.4, 1.0],
                ),
              ),
            ),
            Positioned(
              left: 8, right: 8, bottom: 8,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12, fontWeight: FontWeight.w800),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(
                    count >= 1000
                        ? '${(count / 1000).toStringAsFixed(1)}k playing'
                        : '$count playing',
                    style: const TextStyle(
                        color: kCyan, fontSize: 10),
                  ),
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
//  LEADERBOARD SECTION
// ════════════════════════════════════════════════════════════════
class _LeaderboardSection extends StatefulWidget {
  const _LeaderboardSection();
  @override
  State<_LeaderboardSection> createState() => _LeaderboardSectionState();
}

class _LeaderboardSectionState extends State<_LeaderboardSection> {
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: active ? kCyan : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                            child: Text(_tabs[i],
                                style: TextStyle(
                                    color: active ? const Color(0xFF0B0E1A) : context.txtSec,
                                fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
        const SizedBox(height: 12),

        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('leaderboard')
              .orderBy(_field, descending: true)
              .limit(5)
              .snapshots(),
          builder: (_, snap) {
            final docs = snap.data?.docs ?? [];
            if (snap.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: kCyan, strokeWidth: 2)),
              );
            }
            if (docs.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Center(child: Text('No data yet.',
                    style: TextStyle(color: context.txtSec))),
              );
            }
            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: docs.length,
              itemBuilder: (_, i) {
                final d    = docs[i].data() as Map<String, dynamic>;
                final name  = d['username'] as String? ?? 'Player';
                final score = d[_field] ?? 0;
                final emoji = _avatarEmoji(d['avatar'] as String? ?? 'BOT');
                final top   = i < 3;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: top ? kOrange.withOpacity(0.3) : Colors.transparent),
                  ),
                  child: Row(children: [
                    SizedBox(width: 26,
                        child: Text(_rankLabel(i),
                            style: TextStyle(
                                color: top ? kOrange : const Color(0xFF9A9A9A),
                                fontSize: 13, fontWeight: FontWeight.w900),
                            textAlign: TextAlign.center)),
                    const SizedBox(width: 10),
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF0F172A),
                          border: Border.all(
                              color: top ? kOrange.withOpacity(0.5) : context.border)),
                      child: Center(child: Text(emoji,
                          style: const TextStyle(fontSize: 16))),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(name,
                        style: TextStyle(
                            color: context.txtPri, fontSize: 13,
                            fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis)),
                    Text('$score pts',
                        style: const TextStyle(
                            color: kCyan, fontSize: 13, fontWeight: FontWeight.w700)),
                  ]),
                );
              },
            );
          },
        ),

        const SizedBox(height: 16),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(children: [
            Container(
              width: double.infinity, height: 43,
              decoration: BoxDecoration(
                color: kCyan, borderRadius: BorderRadius.circular(8)),
              child: const Center(
                child: Text('View Full Leaderboard',
                    style: TextStyle(
                        color: Color(0xFF0B0E1A),
                        fontSize: 14, fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity, height: 43,
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: context.border),
              ),
              child: Center(
                child: Text('My Rankings',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
      ],
    );
  }

  String _rankLabel(int i) => switch (i) {
    0 => '🥇', 1 => '🥈', 2 => '🥉', _ => '#${i + 1}'
  };
}
