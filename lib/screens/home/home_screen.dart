import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:gamearn/l10n/app_localizations.dart';

import '../../services/firestore_cache.dart';
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

// ════════════════════════════════════════════════════════════════
//  HOME / GAME DASHBOARD — Figma matched (1485:542, 390×844)
//  Responsive via flutter_screenutil
//
//  Header: avatar (40×40 r9999) + name/status left,
//          two 40×40 r9999 #22D1EE@10 icon buttons right
//  Welcome: fs28 Bold #F1F5F9, subtitle fs16 white@50
//  Stats: 163×107 r12 #22D1EE@5 (Wallet Balance / Daily Streak)
//  Tournaments: horizontal scroll cards (342×195, gap 16)
//  Games: 2×2 grid, 163×163 r12 tiles with image+overlay+gradient
//  Leaderboard: tabbed (Daily/Weekly/Monthly/Yearly)
//  Bottom nav: Home(orange) | Tournament | Wallet | Profile
// ════════════════════════════════════════════════════════════════

String _avatarEmoji(String avatar) =>
    kAvatars.firstWhere((a) => a['name'] == avatar,
        orElse: () => kAvatars[0])['emoji'] ?? '🤖';

const Map<String, String> kGameAssets = {
  'whot':     'assets/games/whot.jpg',
  'ludo':     'assets/games/ludo.png',
  'ayo':      'assets/games/ayo.jpg',
  'draughts': 'assets/games/draughts.jpg',
};

String? _assetFor(String key) {
  for (final k in kGameAssets.keys) {
    if (key.contains(k)) return kGameAssets[k];
  }
  if (key.contains('draft')) return kGameAssets['draughts'];
  return null;
}

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
    final l10n = AppLocalizations.of(context)!;
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: FutureBuilder<Map<String, dynamic>>(
          future: FirestoreCache.instance.doc('users', uid),
          builder: (_, userSnap) {
            final user = userSnap.data ?? {};
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
                    // ── TOP HEADER — Figma 1485:720 ──────────────────────
                    SliverToBoxAdapter(
                      child: Container(
                        width: double.infinity,
                        padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 0),
                        child: Column(children: [
                          Row(children: [
                            // Avatar 40×40 r9999
                            Container(
                              width: 40.w, height: 40.w,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: kOrange, width: 2.w),
                                color: context.card,
                              ),
                              child: Center(
                                child: Text(_avatarEmoji(avatar),
                                    style: TextStyle(fontSize: 20.w)),
                              ),
                            ),
                            SizedBox(width: 12.w),
                            // Name + status
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(username,
                                      style: TextStyle(
                                          color: context.txtPri,
                                          fontWeight: FontWeight.w400,
                                          fontSize: 16.sp)),
                                  Text(status,
                                      style: TextStyle(
                                          color: kCyan,
                                          fontSize: 12.sp,
                                          fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                            // Notification btn — 40×40 r9999 #22D1EE@10
                            _TopBtn(
                              icon: Icons.notifications_outlined,
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                              badge: true,
                            ),
                            SizedBox(width: 12.w),
                            // Settings btn
                            _TopBtn(
                              icon: Icons.settings_outlined,
                              onTap: () => Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => const SettingsScreen())),
                            ),
                          ]),
                          SizedBox(height: 12.h),
                          Container(height: 1, color: kCyan),
                        ]),
                      ),
                    ),

                    // ── WELCOME TEXT — Figma 1485:561 ────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('$_welcomeMsg $username!',
                                style: TextStyle(
                                    color: context.txtPri,
                                    fontSize: 28.sp,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.3)),
                            SizedBox(height: 2.h),
                            Text(l10n.homeEarnByKeepingStreak,
                                style: TextStyle(
                                    color: context.txtSec,
                                    fontSize: 16.sp)),
                          ],
                        ),
                      ),
                    ),

                    // ── STAT CARDS — Figma 1485:546 ──────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 0),
                        child: Row(children: [
                          Expanded(child: _StatCard(
                            label: l10n.homeWalletBalance,
                            value: '₦$balance',
                            sub: '+500 / day',
                            icon: Icons.account_balance_wallet_rounded,
                          )),
                          SizedBox(width: 16.w),
                          Expanded(child: GestureDetector(
                            onTap: () => Navigator.push(context,
                                MaterialPageRoute(builder: (_) => const DailyStreakScreen())),
                            child: _StatCard(
                              label: l10n.homeDailyStreak,
                              value: '$streak Days',
                              sub: l10n.homeTapToClaim,
                              icon: Icons.local_fire_department_rounded,
                            ),
                          )),
                        ]),
                      ),
                    ),

                    // ── TOURNAMENTS — Figma 1485:564 ─────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 10.h),
                        child: _SectionHeader(title: l10n.homeActiveTournaments),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 150.h,
                        child: FutureBuilder<List<Map<String, dynamic>>>(
                          future: FirestoreCache.instance.query('home/tournaments',
                            ttl: const Duration(minutes: 5),
                            build: () => FirebaseFirestore.instance
                                .collection('tournaments')
                                .orderBy('createdAt', descending: true)
                                .limit(10),
                          ),
                          builder: (_, snap) {
                            final items = (snap.data?.isNotEmpty ?? false)
                                ? snap.data!
                                : _mockTournaments();
                            return ListView.builder(
                              scrollDirection: Axis.horizontal,
                              padding: EdgeInsets.symmetric(horizontal: 24.w),
                              itemCount: items.length,
                              itemBuilder: (_, i) => _TournamentCard(data: items[i]),
                            );
                          },
                        ),
                      ),
                    ),

                    // ── GAMES GRID — reduced sizes ─────────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 12.h),
                        child: _SectionHeader(title: l10n.homeGames),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: FutureBuilder<List<Map<String, dynamic>>>(
                        future: FirestoreCache.instance.query('home/arena',
                          ttl: const Duration(minutes: 5),
                          build: () => FirebaseFirestore.instance
                              .collection('arena')
                              .where('active', isEqualTo: true)
                              .limit(6),
                        ),
                        builder: (_, snap) {
                          final games = (snap.data?.isNotEmpty ?? false)
                              ? snap.data!
                              : _mockGames();
                          return Padding(
                            padding: EdgeInsets.symmetric(horizontal: 24.w),
                            child: _GamesGrid(games: games, uid: uid),
                          );
                        },
                      ),
                    ),

                    // ── LEADERBOARD — Figma 1485:666 ─────────────────────
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 10.h),
                        child:                         Text(l10n.homeGlobalLeaderboard,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 18.sp,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SliverToBoxAdapter(child: _LeaderboardSection()),
                    SliverPadding(padding: EdgeInsets.only(bottom: 32.h)),
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
//  TOP BUTTON — Figma 40×40 r9999 #22D1EE@10
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
        width: 40.w, height: 40.w,
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: kCyan, size: 20.w),
      ),
      if (badge) Positioned(
        top: -1, right: -1,
        child: Container(
          width: 11.w, height: 11.w,
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
//  STAT CARD — Figma 163×107 r12 #22D1EE@5
// ════════════════════════════════════════════════════════════════
class _StatCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  const _StatCard({required this.label, required this.value,
      required this.sub, required this.icon});

  @override
  Widget build(BuildContext context) => Container(
    height: 90.h,
    padding: EdgeInsets.all(16.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.05),
      borderRadius: BorderRadius.circular(12.r),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(children: [
          Icon(icon, color: kCyan, size: 13.w),
          SizedBox(width: 6.w),
          Flexible(
            child: Text(label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 12.sp, fontWeight: FontWeight.w500)),
          ),
        ]),
        SizedBox(height: 8.h),
        Text(value,
            maxLines: 1, overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 20.sp, fontWeight: FontWeight.w700)),
        SizedBox(height: 8.h),
        Text(sub,
            style: TextStyle(
                color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w500)),
      ],
    ),
  );
}

// ════════════════════════════════════════════════════════════════
//  SECTION HEADER — Figma fs18 w700
// ════════════════════════════════════════════════════════════════
class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Text(title, style: TextStyle(
      color: context.txtPri, fontSize: 18.sp, fontWeight: FontWeight.w700));
}

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT CARD — Figma 342×195 r12
// ════════════════════════════════════════════════════════════════
class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TournamentCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final title     = data['title']       as String? ?? 'Tournament';
    final prize     = data['prizePool']   as String? ?? '0';
    final players   = data['playerCount'] as int?     ?? 0;
    final active    = data['active']      as bool?    ?? false;
    final assetKey  = (data['assetKey']   as String? ?? 'whot').toLowerCase();
    final asset     = _assetFor(assetKey) ?? kGameAssets['whot']!;

    return Container(
      width: 342.w,
      height: 150.h,
      margin: EdgeInsets.only(right: 16.w),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12.r),
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
            padding: EdgeInsets.all(14.r),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  if (active) _Chip(label: '● ${l10n.homeLive}', color: const Color(0xFF2AE500)),
                  if (active) SizedBox(width: 8.w),
                  _Chip(label: l10n.homePlayersCount(players), color: Colors.white),
                ]),
                const Spacer(),
                Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 15.sp, fontWeight: FontWeight.w800)),
                SizedBox(height: 4.h),
                Row(children: [
                  Text(l10n.homePrizePool,
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11.sp)),
                  Text('₦$prize',
                      style: TextStyle(
                          color: kCyan, fontSize: 14.sp, fontWeight: FontWeight.w800)),
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
    padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
    decoration: BoxDecoration(
      color: color.withOpacity(0.15),
      borderRadius: BorderRadius.circular(9.r),
      border: Border.all(color: color.withOpacity(0.6)),
    ),
    child: Text(label, style: TextStyle(
      color: color, fontSize: 10.sp, fontWeight: FontWeight.w700)),
  );
}

// ════════════════════════════════════════════════════════════════
//  GAMES GRID — Figma 2×2, each 163×163 r12
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
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 15.w,
        mainAxisSpacing: 15.w,
        childAspectRatio: 0.75,
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
    final l10n = AppLocalizations.of(context)!;
    final title    = data['title']     as String? ?? 'Game';
    final assetKey = (data['assetKey'] as String? ?? '').toLowerCase();
    final count    = data['playCount'] as int? ?? 0;
    final asset    = _assetFor(assetKey);
    final playLabel = count >= 1000 ? '${(count / 1000).toStringAsFixed(1)}k' : '$count';

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
    } else if (assetKey.contains('draught')) {
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
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: context.border, width: 1.w),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12.r),
          child: Stack(fit: StackFit.expand, children: [
            if (asset != null)
              Image.asset(asset, fit: BoxFit.cover),
            // Figma: #22D1EE@10 overlay
            Container(
              color: kCyan.withOpacity(0.1),
            ),
            // Figma: gradient overlay
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x22222118), Color(0x00222118), Color(0x00222118), Color(0x22222118)],
                  stops: [0.0, 0.5, 0.5, 1.0],
                ),
              ),
            ),
            Positioned(
              left: 8.w, right: 8.w, bottom: 8.h,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(title,
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 12.sp, fontWeight: FontWeight.w800),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(l10n.homePlayingCount(playLabel),
                    style: TextStyle(
                        color: kCyan, fontSize: 10.sp),
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

  String get _field => switch (_tab) {
    1 => 'weeklyScore',
    2 => 'monthlyScore',
    3 => 'yearlyScore',
    _ => 'dailyScore',
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tabs = [l10n.homeLbDaily, l10n.homeLbWeekly, l10n.homeLbMonthly, l10n.homeLbYearly];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Container(
            height: 36.h,
            padding: EdgeInsets.all(4.r),
            decoration: BoxDecoration(
              color: context.card,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Row(
              children: List.generate(tabs.length, (i) {
                final active = i == _tab;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _tab = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      decoration: BoxDecoration(
                        color: active ? kCyan : Colors.transparent,
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Center(
                            child: Text(tabs[i],
                                style: TextStyle(
                                    color: active ? const Color(0xFF0B0E1A) : context.txtSec,
                                fontSize: 11.sp, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
        SizedBox(height: 12.h),

        FutureBuilder<List<Map<String, dynamic>>>(
          future: FirestoreCache.instance.query('home/leaderboard/${_field}',
            ttl: const Duration(minutes: 5),
            build: () => FirebaseFirestore.instance
                .collection('leaderboard')
                .orderBy(_field, descending: true)
                .limit(5),
          ),
          builder: (_, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return Padding(
                padding: EdgeInsets.all(24.r),
                child: const Center(child: CircularProgressIndicator(color: kCyan, strokeWidth: 2)),
              );
            }
            final docs = snap.data ?? [];
            if (docs.isEmpty) {
              return Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 16.h),
                child: Center(child: Text(l10n.homeNoDataYet,
                    style: TextStyle(color: context.txtSec))),
              );
            }
            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              itemCount: docs.length,
              itemBuilder: (_, i) {
                final d    = docs[i];
                final name  = d['username'] as String? ?? 'Player';
                final score = d[_field] ?? 0;
                final emoji = _avatarEmoji(d['avatar'] as String? ?? 'BOT');
                final top   = i < 3;
                return Container(
                  margin: EdgeInsets.only(bottom: 8.h),
                  padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10.r),
                    border: Border.all(
                        color: top ? kOrange.withOpacity(0.3) : Colors.transparent),
                  ),
                  child: Row(children: [
                    SizedBox(width: 26.w,
                        child: Text(_rankLabel(i),
                            style: TextStyle(
                                color: top ? kOrange : const Color(0xFF9A9A9A),
                                fontSize: 13.sp, fontWeight: FontWeight.w900),
                            textAlign: TextAlign.center)),
                    SizedBox(width: 10.w),
                    Container(
                      width: 32.w, height: 32.w,
                      decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: context.card,
                          border: Border.all(
                              color: top ? kOrange.withOpacity(0.5) : context.border)),
                      child: Center(child: Text(emoji,
                          style: TextStyle(fontSize: 16.w))),
                    ),
                    SizedBox(width: 10.w),
                    Expanded(child: Text(name,
                        style: TextStyle(
                            color: context.txtPri, fontSize: 13.sp,
                            fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis)),
                    Text(l10n.homeScorePts((score as num).toInt()),
                        style: TextStyle(
                            color: kCyan, fontSize: 13.sp, fontWeight: FontWeight.w700)),
                  ]),
                );
              },
            );
          },
        ),

        SizedBox(height: 16.h),

        Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(children: [
            Container(
              width: double.infinity, height: 43.h,
              decoration: BoxDecoration(
                color: kCyan, borderRadius: BorderRadius.circular(8.r)),
              child: Center(
                child: Text(l10n.homeViewFullLeaderboard,
                    style: TextStyle(
                        color: const Color(0xFF0B0E1A),
                        fontSize: 14.sp, fontWeight: FontWeight.w800)),
              ),
            ),
            SizedBox(height: 8.h),
            Container(
              width: double.infinity, height: 43.h,
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(8.r),
                border: Border.all(color: context.border),
              ),
              child: Center(
                child: Text(l10n.homeMyRankings,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14.sp, fontWeight: FontWeight.w700)),
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
