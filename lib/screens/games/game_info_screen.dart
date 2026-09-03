import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../theme.dart';
import 'game_lobby_screen.dart';
import 'game_setup_screen.dart';
import '../tour/tour_screen.dart';
import '../tour/tournament_details_screen.dart';
import '../profile/premium_purchase_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAME SECTION SCREEN — Figma matched
//
//  Figma: GAME SECTION (AYO 1305:687 · LUDO 1331:270 ·
//         WHOT 1350:341 · DRAFT 1360:599) 390×844, scrollable hub:
//   header      — back + "{Game} GAME" fs20 w700 #F1F5F9, bg #0B0E1A
//   hero        342×224 r12 (Featured Classic fs10 / title fs20
//                 #FF5E00 / tagline fs12 #CBD5E1)
//   stat cards  2×163×107 r12 fill #22D1EE@5 stroke #22D1EE
//                 (prize + units, duration + next reward)
//   carousels   All Tournaments + Tournaments (View All fs12 #22D1EE)
//   Play Now    342×56 r12 #FF5E00 fs18 w700
//   secondary   Challenge / Tournament 165×48 r12 #22D1EE@5 + stroke
//   leaderboard "{Game} Game Leaderboard" + tabs 342×28 r8 #1E293B@60
//   premium     Go Premium card 342×242 r16 stroke #FFC107
// ════════════════════════════════════════════════════════════════

class GameInfoScreen extends StatefulWidget {
  final String  gameKey;
  final Widget  gameScreen;
  final int     playCount;

  const GameInfoScreen({
    super.key,
    required this.gameKey,
    required this.gameScreen,
    this.playCount = 0,
  });

  @override
  State<GameInfoScreen> createState() => _GameInfoScreenState();
}

class _GameInfoScreenState extends State<GameInfoScreen> {
  static const _gameAssets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  static const _gameMeta = {
    'whot': _GameMeta(
      title: 'WHOT',
      tagline: 'The classic Nigerian card game',
    ),
    'ludo': _GameMeta(
      title: 'Lúdò',
      tagline: 'The board game of strategy & luck',
    ),
    'ayo': _GameMeta(
      title: 'Ayò Òpón',
      tagline: 'Ancient Nigerian strategy game',
    ),
    'draughts': _GameMeta(
      title: 'Draughts',
      tagline: 'Classic checkers with Nigerian flair',
    ),
  };

  static const _sectionData = {
    'whot': _SectionMeta(
      heroTitle: 'Wọ́t Game',
      prize: '#4,500.00', prizeSub: '+600/units',
      days: '12 Days', daysSub: 'Next reward in 7 days',
      mockTournaments: [
        {'title': 'WHOT Championship', 'prize': '4,500', 'players': 128, 'active': true},
        {'title': 'WHOT Masters', 'prize': '2,000', 'players': 64, 'active': false},
      ],
    ),
    'ludo': _SectionMeta(
      heroTitle: 'Lúùdò Game',
      prize: '#2,500.00', prizeSub: '+250/units',
      days: '5 Days', daysSub: 'Next reward in 5 days',
      mockTournaments: [
        {'title': 'Lúdò Grand Prix', 'prize': '2,500', 'players': 64, 'active': true},
        {'title': 'Lúdò Classic', 'prize': '1,200', 'players': 32, 'active': false},
      ],
    ),
    'ayo': _SectionMeta(
      heroTitle: 'Ayò Ọ̀pọ́n',
      prize: '#3,500.00', prizeSub: '+350/units',
      days: '10 Days', daysSub: 'Next reward in 5 days',
      mockTournaments: [
        {'title': 'Ayò Masters', 'prize': '3,500', 'players': 32, 'active': true},
        {'title': 'Ayò Showdown', 'prize': '1,500', 'players': 16, 'active': false},
      ],
    ),
    'draughts': _SectionMeta(
      heroTitle: 'Dráfù Game',
      prize: '#1,500.00', prizeSub: '+75/units',
      days: '5 Days', daysSub: 'Next reward in 7 days',
      mockTournaments: [
        {'title': 'Draughts Open', 'prize': '1,500', 'players': 24, 'active': true},
        {'title': 'Draughts Cup', 'prize': '800', 'players': 16, 'active': false},
      ],
    ),
  };

  _GameMeta get _meta =>
      _gameMeta[widget.gameKey] ?? _gameMeta['whot']!;

  _SectionMeta get _section =>
      _sectionData[widget.gameKey] ?? _sectionData['whot']!;

  String get _asset =>
      _gameAssets[widget.gameKey] ?? _gameAssets['whot']!;

  void _openSetup() {
    Widget dest;
    switch (widget.gameKey) {
      case 'ludo':
        dest = const LudoSetupScreen();
        break;
      case 'draughts':
        dest = const DrafuSetupScreen();
        break;
      case 'ayo':
        dest = const AyoSetupScreen();
        break;
      case 'whot':
        dest = const WhotSetupScreen();
        break;
      default:
        dest = GameLobbyScreen(
            gameTitle: _meta.title,
            gameScreen: widget.gameScreen,
            gameKey: widget.gameKey);
    }
    Navigator.push(context, MaterialPageRoute(builder: (_) => dest));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          _buildHeader(context),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 32.h),
              children: [
                _buildHero(context),
                SizedBox(height: 20.h),
                _buildStats(context),
                SizedBox(height: 24.h),
                _sectionTitle(context, 'All Tournaments'),
                SizedBox(height: 10.h),
                _buildTournamentCarousel(context, tall: true),
                SizedBox(height: 24.h),
                _sectionHeaderRow(context, 'Tournaments'),
                SizedBox(height: 10.h),
                _buildTournamentCarousel(context, tall: false),
                SizedBox(height: 24.h),
                _buildPlayNow(context),
                SizedBox(height: 16.h),
                _buildSecondaryButtons(context),
                SizedBox(height: 24.h),
                _sectionTitle(context, '${_meta.title} Game Leaderboard'),
                SizedBox(height: 10.h),
                _LeaderboardCard(gameKey: widget.gameKey),
                SizedBox(height: 24.h),
                _sectionTitle(context, 'Go Premium'),
                SizedBox(height: 10.h),
                _PremiumCard(),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      color: context.card,
      padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 12.h),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: context.border, width: 1)),
      ),
      child: Row(children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Icon(Icons.close_rounded,
              color: context.txtPri, size: 20.w),
        ),
        SizedBox(width: 14.w),
        Expanded(
          child: Text('${_meta.title.toUpperCase()} GAME',
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 20.sp, fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }

  Widget _buildHero(BuildContext context) {
    final s = _section;
    return ClipRRect(
      borderRadius: BorderRadius.circular(12.r),
      child: SizedBox(
        height: 224.h,
        width: double.infinity,
        child: Stack(fit: StackFit.expand, children: [
          Image.asset(_asset, fit: BoxFit.cover),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x110F172A), Color(0xE60F172A)],
                stops: [0.0, 1.0],
              ),
            ),
          ),
          Positioned(
            left: 20.w, right: 20.w, bottom: 20.h,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Featured Classic',
                    style: TextStyle(
                        color: Colors.white, fontSize: 10.sp,
                        fontWeight: FontWeight.w400)),
                SizedBox(height: 2.h),
                Text(s.heroTitle,
                    style: TextStyle(
                        color: kOrange, fontSize: 20.sp,
                        fontWeight: FontWeight.w700)),
                SizedBox(height: 2.h),
                Text(_meta.tagline,
                    style: TextStyle(
                        color: const Color(0xFFCBD5E1), fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildStats(BuildContext context) {
    final s = _section;
    return Row(children: [
      Expanded(child: _GameStatCard(
        label: 'Prize Pool',
        icon: Icons.emoji_events_rounded,
        value: s.prize,
        sub: s.prizeSub,
      )),
      SizedBox(width: 16.w),
      Expanded(child: _GameStatCard(
        label: 'Duration',
        icon: Icons.schedule_rounded,
        value: s.days,
        sub: s.daysSub,
      )),
    ]);
  }

  Widget _buildTournamentCarousel(BuildContext context, {required bool tall}) {
    return SizedBox(
      height: tall ? 168.h : 140.h,
      child: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('tournaments')
            .orderBy('createdAt', descending: true)
            .limit(12)
            .snapshots(),
        builder: (_, snap) {
          final docs = snap.data?.docs ?? [];
          final key = widget.gameKey;
          var items = docs
              .map((d) {
                final data = Map<String, dynamic>.from(d.data() as Map<String, dynamic>)
                  ..['_id'] = d.id;
                return data;
              })
              .where((t) {
                final gt = (t['gameType'] as String? ?? '').toLowerCase();
                return gt.isEmpty ||
                    gt == key ||
                    gt.contains(key) ||
                    key.contains(gt);
              })
              .toList();
          if (items.isEmpty) items = _section.mockTournaments;
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            itemBuilder: (_, i) => _TournamentCard(
              data: items[i],
              compact: !tall,
              onTap: () {
                final id = items[i]['_id'] as String?;
                if (id != null) {
                  Navigator.push(context, MaterialPageRoute(
                      builder: (_) => TournamentDetailsScreen(tournamentId: id)));
                }
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlayNow(BuildContext context) {
    return GestureDetector(
      onTap: _openSetup,
      child: Container(
        height: 56.h,
        decoration: BoxDecoration(
          color: kOrange,
          borderRadius: BorderRadius.circular(12.r),
          boxShadow: [BoxShadow(
              color: kOrange.withOpacity(0.4),
              blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Center(
          child: Text('Play Now',
              style: TextStyle(
                  color: Colors.white, fontSize: 18.sp,
                  fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _buildSecondaryButtons(BuildContext context) {
    return Row(children: [
      Expanded(child: _SecondaryButton(
        icon: Icons.sports_kabaddi_rounded,
        label: 'Challenge',
        onTap: () => Navigator.push(context, MaterialPageRoute(
            builder: (_) => GameLobbyScreen(
                gameTitle: _meta.title,
                gameScreen: widget.gameScreen,
                gameKey: widget.gameKey))),
      )),
      SizedBox(width: 16.w),
      Expanded(child: _SecondaryButton(
        icon: Icons.emoji_events_rounded,
        label: 'Tournament',
        onTap: () => Navigator.push(context,
            MaterialPageRoute(builder: (_) => const TourScreen())),
      )),
    ]);
  }

  Widget _sectionTitle(BuildContext context, String title) {
    return Text(title,
        style: TextStyle(
            color: context.txtPri, fontSize: 18.sp, fontWeight: FontWeight.w700));
  }

  Widget _sectionHeaderRow(BuildContext context, String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 18, fontWeight: FontWeight.w700)),
        const Text('View All',
            style: TextStyle(
                color: kCyan, fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

// ── META ──────────────────────────────────────────────────────────
class _GameMeta {
  final String title, tagline;
  const _GameMeta({required this.title, required this.tagline});
}

class _SectionMeta {
  final String heroTitle, prize, prizeSub, days, daysSub;
  final List<Map<String, dynamic>> mockTournaments;
  const _SectionMeta({
    required this.heroTitle, required this.prize, required this.prizeSub,
    required this.days, required this.daysSub,
    required this.mockTournaments,
  });
}

// ── STAT CARD — Figma: 163×107 r12 #22D1EE@5 stroke #22D1EE ──────
class _GameStatCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  const _GameStatCard({required this.label, required this.icon,
      required this.value, required this.sub});

  @override
  Widget build(BuildContext context) => Container(
    height: 107.h,
    padding: EdgeInsets.all(16.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.05),
      borderRadius: BorderRadius.circular(12.r),
      border: Border.all(color: kCyan),
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
                maxLines: 1, overflow: TextOverflow.ellipsis,
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
            maxLines: 1, overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w600)),
      ],
    ),
  );
}

// ── TOURNAMENT CARD ───────────────────────────────────────────────
class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final bool compact;
  final VoidCallback? onTap;
  const _TournamentCard({required this.data, this.compact = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    final title   = data['title']       as String? ?? 'Tournament';
    final prize   = data['prizePool']   as String? ?? (data['prize'] as String? ?? '0');
    final players = data['playerCount'] as int?     ?? (data['players'] as int? ?? 0);
    final active  = data['active']      as bool?    ?? false;
    final assetKey = (data['assetKey']  as String? ?? '').toLowerCase();
    final asset = _assetFor(assetKey);

    final h = compact ? 132.0.h : 160.0.h;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: compact ? 250.w : 270.w,
        height: h,
        margin: EdgeInsets.only(right: 12.w),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8.r),
          child: Stack(fit: StackFit.expand, children: [
            if (asset != null)
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
                    if (active) _Chip(label: '● Live', color: const Color(0xFF2AE500)),
                    if (active) SizedBox(width: 8.w),
                    _Chip(label: '$players Players', color: Colors.white),
                  ]),
                  const Spacer(),
                  Text(title,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 15.sp, fontWeight: FontWeight.w800)),
                  SizedBox(height: 4.h),
                  Row(children: [
                    Text('Prize Pool  ',
                        style: TextStyle(color: context.txtSec, fontSize: 11.sp)),
                    Text('₦$prize',
                        style: TextStyle(
                            color: kCyan, fontSize: 14.sp, fontWeight: FontWeight.w800)),
                  ]),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }

  static const _assets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  static String? _assetFor(String key) {
    if (key.isEmpty) return null;
    for (final k in _assets.keys) {
      if (key.contains(k)) return _assets[k];
    }
    if (key.contains('draft')) return _assets['draughts'];
    return null;
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

// ── SECONDARY BUTTON — Figma: 165×48 r12 #22D1EE@5 stroke ────────
class _SecondaryButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SecondaryButton({required this.icon, required this.label,
      required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      height: 48.h,
      decoration: BoxDecoration(
        color: kCyan.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: kCyan),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: kCyan, size: 16.w),
          SizedBox(width: 8.w),
          Text(label,
              style: TextStyle(
                  color: kCyan, fontSize: 14.sp, fontWeight: FontWeight.w700)),
        ],
      ),
    ),
  );
}

// ── LEADERBOARD — Figma: tabs 342×28 r8 #1E293B@60 ────────────────
class _LeaderboardCard extends StatefulWidget {
  final String gameKey;
  const _LeaderboardCard({required this.gameKey});
  @override
  State<_LeaderboardCard> createState() => _LeaderboardCardState();
}

class _LeaderboardCardState extends State<_LeaderboardCard> {
  int _tab = 0;
  static const _tabs = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  String get _field => switch (_tab) {
    1 => 'weeklyScore',
    2 => 'monthlyScore',
    3 => 'yearlyScore',
    _ => 'dailyScore',
  };

  static const _mock = [
    {'name': 'Chukwudi', 'score': 5000, 'emoji': '👑'},
    {'name': 'Amaka',    'score': 4580, 'emoji': '⚡'},
    {'name': 'Tunde',    'score': 4160, 'emoji': '🔥'},
    {'name': 'Ngozi',    'score': 3740, 'emoji': '💎'},
    {'name': 'Emeka',    'score': 3320, 'emoji': '🏆'},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Tabs — Figma: 342×28 r8 fill #1E293B@60
      Container(
        height: 28.h,
        padding: EdgeInsets.all(2.r),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Row(
          children: List.generate(_tabs.length, (i) {
            final active = i == _tab;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _tab = i),
                child: Container(
                  decoration: BoxDecoration(
                    color: active ? kCyan : Colors.transparent,
                    borderRadius: BorderRadius.circular(6.r),
                  ),
                  child: Center(
                    child: Text(_tabs[i],
                        style: TextStyle(
                            color: active
                                ? const Color(0xFF0B0E1A)
                                : context.txtSec,
                            fontSize: 10.sp, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
      SizedBox(height: 10.h),

      StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('leaderboard')
            .orderBy(_field, descending: true)
            .limit(5)
            .snapshots(),
        builder: (_, snap) {
          final docs = snap.data?.docs ?? [];
          if (docs.isEmpty) {
            return Column(children: List.generate(_mock.length, (i) {
              final m = _mock[i];
              return _LeaderboardRow(
                rank: i,
                emoji: m['emoji'] as String,
                name: m['name'] as String,
                score: m['score'] as int,
              );
            }));
          }
          return Column(children: docs.asMap().entries.map((e) {
            final d = e.value.data() as Map<String, dynamic>;
            return _LeaderboardRow(
              rank: e.key,
              emoji: d['avatar'] as String? ?? '🤖',
              name: d['username'] as String? ?? 'Player',
              score: d[_field] ?? 0,
            );
          }).toList());
        },
      ),
    ]);
  }
}

// ── LEADERBOARD ROW — Figma: rank 1 #22D1EE@10, rest #1E293B@20 ──
class _LeaderboardRow extends StatelessWidget {
  final int rank;
  final String emoji, name;
  final dynamic score;
  const _LeaderboardRow({required this.rank, required this.emoji,
      required this.name, required this.score});

  @override
  Widget build(BuildContext context) {
    final top = rank == 0;
    return Container(
      height: 56.h,
      margin: EdgeInsets.only(bottom: 8.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w),
      decoration: BoxDecoration(
        color: top ? kCyan.withOpacity(0.10) : const Color(0x331E293B),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Row(children: [
        SizedBox(
          width: 30.w,
          child: Text(
            rank <= 2
                ? ['🥇', '🥈', '🥉'][rank]
                : '#${rank + 1}',
            style: TextStyle(
                color: rank < 3 ? kOrange : const Color(0xFF9A9A9A),
                fontSize: rank < 3 ? 15.sp : 11.sp,
                fontWeight: FontWeight.w900),
            textAlign: TextAlign.center,
          ),
        ),
        SizedBox(width: 10.w),
        Container(
          width: 32.w, height: 32.w,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: context.card,
            border: Border.all(
                color: top ? kOrange.withOpacity(0.5) : context.border),
          ),
          child: Center(
            child: Text(emoji, style: TextStyle(fontSize: 16.sp)),
          ),
        ),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(name,
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 13.sp, fontWeight: FontWeight.w600)),
        ),
        Text('$score pts',
            style: TextStyle(
                color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

// ── PREMIUM CARD — Figma: 342×242 r16 stroke #FFC107 ──────────────
class _PremiumCard extends StatelessWidget {
  const _PremiumCard();

  static const _perks = [
    'Exclusive premium tournaments',
    '0% withdrawal fees',
    'Priority customer support',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFFFFC107), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 44.w, height: 44.w,
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.workspace_premium_rounded,
                  color: const Color(0xFFFFC107), size: 24.w),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gamearn Premium',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 18.sp, fontWeight: FontWeight.w800)),
                  SizedBox(height: 2.h),
                  Text('Exclusive rewards',
                      style: TextStyle(
                          color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 16),
          Text(
              'Unlock bigger prize pools, private tournaments and priority '
              'payouts — the premium experience for serious players.',
              style: TextStyle(
                  color: context.txtSec, fontSize: 13, height: 1.5)),
          const SizedBox(height: 16),
          ..._perks.map((p) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              const Icon(Icons.check_circle_rounded, color: kCyan, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(p,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ]),
          )),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const PremiumPurchaseScreen())),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text('Go Premium',
                    style: TextStyle(
                        color: Color(0xFF0B0E1A),
                        fontSize: 14, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
