import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../theme.dart';
import '../games/game_lobby_screen.dart';
import '../games/whot_game_screen.dart';
import '../games/ludo_game_screen.dart';
import '../games/ayo_game_screen.dart';
import '../games/draughts_game_screen.dart';
import '../games/game_setup_screen.dart';
import '../games/game_info_screen.dart';
import '../../data/welcome_messages.dart';
import 'notifications_screen.dart';
import '../profile/settings_screen.dart';
import '../profile/daily_streak_screen.dart';

// ── Game asset map ─────────────────────────────────────────────────────────────
const Map<String, String> kGameAssets = {
  'whot':     'assets/games/whot.jpg',
  'ludo':     'assets/games/ludo.png',
  'ayo':      'assets/games/ayo.jpg',
  'draughts': 'assets/games/draughts.jpg',
};

// ── Game icon map ─────────────────────────────────────────────────────────────
const Map<String, IconData> kGameIcons = {
  'whot':     Icons.style_rounded,        
  'ludo':     Icons.casino_rounded,       
  'ayo':      Icons.circle_outlined,      
  'draughts': Icons.grid_on_rounded,      
};

String? _assetForGame(Map<String, dynamic> data) {
  final key = (data['assetKey'] ?? data['id'] ?? data['gameId'])?.toString().toLowerCase();
  if (key != null) {
    for (final k in kGameAssets.keys) {
      if (key.contains(k)) return kGameAssets[k];
    }
    if (key.contains('draft')) return kGameAssets['draughts'];
  }
  final title = (data['title'] ?? data['name'] ?? data['game'] ?? '').toString().toLowerCase();
  for (final k in kGameAssets.keys) {
    if (title.contains(k)) return kGameAssets[k];
  }
  if (title.contains('draft') || title.contains('drafu')) return kGameAssets['draughts'];
  return null;
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late String _welcomeMsg;

  @override
  void initState() {
    super.initState();
    final msgs = List<String>.from(kWelcomeMessages);
    msgs.shuffle();
    _welcomeMsg = msgs.first;
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .snapshots(),
          builder: (ctx, userSnap) {
            final user = userSnap.hasData && userSnap.data!.exists
                ? userSnap.data!.data() as Map<String, dynamic>
                : <String, dynamic>{};
            final username = user['username'] ?? 'Player';
            final avatar   = user['avatar']   ?? 'BOT';
            final status   = user['memberStatus'] ?? 'Active Member';

            return CustomScrollView(
              slivers: [
                // ── Top bar ────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Row(
                      children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: kOrange, width: 2),
                            color: context.card,
                          ),
                          child: Center(
                            child: Text(_avatarEmoji(avatar),
                                style: const TextStyle(fontSize: 22)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(username,
                                style: TextStyle(
                                    color: context.txtPri,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15)),
                            Text(status,
                                style: const TextStyle(
                                    color: kCyan, fontSize: 11)),
                          ],
                        ),
                        const Spacer(),
                        _IconBtn(
                          icon: Icons.notifications_outlined,
                          badge: true,
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const NotificationsScreen())),
                        ),
                        const SizedBox(width: 8),
                        _IconBtn(
                          icon: Icons.settings_outlined,
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const SettingsScreen())),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Welcome ────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$_welcomeMsg $username!',
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 20,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(
                            'You can earn points by keeping your streak.',
                            style: TextStyle(color: context.txtSec, fontSize: 13)),
                      ],
                    ),
                  ),
                ),

                // ── Wallet + Streak ────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: StreamBuilder<DocumentSnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('wallets')
                          .doc(uid)
                          .snapshots(),
                      builder: (ctx, walSnap) {
                        final wallet =
                            walSnap.hasData && walSnap.data!.exists
                                ? walSnap.data!.data() as Map<String, dynamic>
                                : <String, dynamic>{};
                        final balance = wallet['balance'] ?? 0;
                        final streak  = user['dayStreak'] ?? 0;

                        return Row(children: [
                          Expanded(
                            child: _StatCard(
                              icon: Icons.account_balance_wallet_outlined,
                              label: 'Wallet Balance',
                              value: '₦${balance.toString()}',
                              sub: '+500/units',
                              iconColor: kCyan,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const DailyStreakScreen()),
                              ),
                              child: _StatCard(
                                icon: Icons.local_fire_department_outlined,
                                label: 'Daily Streak',
                                value: '$streak Days',
                                sub: 'Next reward in 2 days',
                                iconColor: kOrange,
                              ),
                            ),
                          ),
                        ]);
                      },
                    ),
                  ),
                ),

                // ── Tournaments header ─────────────────────────────────────
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Text('All Tournaments',
                        style: TextStyle(
                            color: kTextPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                // ── Tournament horizontal scroll ───────────────────────────
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 170,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('tournaments')
                          .orderBy('createdAt', descending: true)
                          .limit(10)
                          .snapshots(),
                      builder: (ctx, snap) {
                        final docs = snap.data?.docs ?? [];
                        if (docs.isEmpty) {
                          return Center(
                              child: Text('No tournaments yet.', style: kSub));
                        }
                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: docs.length,
                          itemBuilder: (_, i) {
                            final d = docs[i].data() as Map<String, dynamic>;
                            return _TournamentCard(
                                data: d, active: d['active'] == true);
                          },
                        );
                      },
                    ),
                  ),
                ),

                // ── GAMES header ───────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Row(children: [
                      const Icon(Icons.sports_esports_outlined,
                          color: kOrange, size: 20),
                      const SizedBox(width: 8),
                      const Text('GAMES',
                          style: TextStyle(
                              color: kTextPri,
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2)),
                    ]),
                  ),
                ),

                // ── Games horizontal scroll ────────────────────────────────
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 170,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('arena')
                          .where('active', isEqualTo: true)
                          .limit(6)
                          .snapshots(),
                      builder: (ctx, snap) {
                        final docs = snap.data?.docs ?? [];
                        final gamesData = docs.isNotEmpty
                            ? docs.map((d) => d.data() as Map<String, dynamic>).toList()
                            : _mockGames();

                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: gamesData.length,
                          itemBuilder: (_, i) {
                            return _GameCard(data: gamesData[i], currentUserId: uid ?? 'player_dev');
                          },
                        );
                      },
                    ),
                  ),
                ),

                // ── Global Leaderboard ─────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Text('Global Leaderboard',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                SliverToBoxAdapter(child: _LeaderboardSection()),

                const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
              ],
            );
          },
        ),
      ),
    );
  }

  String _avatarEmoji(String avatar) {
    return kAvatars
            .firstWhere((a) => a['name'] == avatar,
                orElse: () => kAvatars[0])['emoji'] ??
        '🤖';
  }

  List<Map<String, dynamic>> _mockGames() => [
    {'title': 'WHOT',     'playCount': 2100, 'assetKey': 'whot'},
    {'title': 'Lúdò',     'playCount': 1200, 'assetKey': 'ludo'},
    {'title': 'Ayò Òpón', 'playCount': 850,  'assetKey': 'ayo'},
    {'title': 'Draughts', 'playCount': 420,  'assetKey': 'draughts'},
  ];
}

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final String currentUserId;
  const _GameCard({required this.data, required this.currentUserId});

  @override
  Widget build(BuildContext context) {
    final title     = data['title'] ?? data['name'] ?? data['game'] ?? 'Game';
    final playCount = data['playCount'] ?? data['players'] ?? 0;
    final assetKey  = (data['assetKey'] ?? data['id'] ?? '').toString().toLowerCase();

    String gameKey = 'whot';
    Widget gameScreen = WhotGameScreen(
      roomId: "single_player_ai_room",
      playerId: currentUserId,
      playerName: "You",
      opponentName: "Gamearn Bot",
    );

    if (assetKey.contains('ludo') || title.toLowerCase().contains('ludo')) {
      gameKey = 'ludo';
      gameScreen = const LudoGameScreen();
    } else if (assetKey.contains('ayo') || title.toLowerCase().contains('ayo')) {
      gameKey = 'ayo';
      gameScreen = const AyoGameScreen();
    } else if (assetKey.contains('draft') || title.toLowerCase().contains('draft')) {
      gameKey = 'draughts';
      gameScreen = const DraughtsGameScreen();
    }

    final icon = kGameIcons[gameKey] ?? Icons.sports_esports_rounded;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => GameInfoScreen(
            gameKey: gameKey,
            gameScreen: gameScreen,
            playCount: playCount is int ? playCount : 0,
          ),
        ),
      ),
      child: Container(
        width: 130,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: kCyan.withOpacity(0.08),
                border: Border.all(color: kCyan.withOpacity(0.25), width: 1.5),
              ),
              child: Icon(icon, color: kCyan, size: 30),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                title,
                style: const TextStyle(
                    color: kTextPri, fontWeight: FontWeight.w700, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              playCount >= 1000 ? '${(playCount / 1000).toStringAsFixed(1)}k Playing' : '$playCount Playing',
              style: const TextStyle(color: kOrange, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
