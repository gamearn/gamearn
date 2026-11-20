import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';
import '../../widgets/gamearn_icons.dart';
import 'tournament_entry_screen.dart';
import 'tournament_pending_screen.dart';
import 'tournament_results_screen.dart';
import 'live_tournament_screen.dart';
import 'create_tournament_screen.dart';

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT DETAILS SCREEN — Figma matched
//  Node: 1431:686
//
//  Frame 56: pt=12 pb=16 px=24 | bg #0B0E1A | border-b #FFFFFF
//    title fs18 w700 #F1F5F9 + back btn (16×25)
//
//  Hero Action (342×100 r12): "Host Your Own" fs12 #FFB693
//    "Create Tournament" fs20 w700 #E5E2E1 + 48×48 circle #FF6B00
//
//  Rank 1 (342×43 r8 stroke #22D1EE): "1" fs16 #22D1EE,
//    avatar 24×24 #375277, name fs12 #FFFFFF,
//    "78,450 XP" fs12 #22D1EE / "50 Wins" fs12 #FFFFFF
//
//  Pending card (342×227 r12 stroke #22D1EE):
//    dot + "Pending Entry" fs12 #FFC107 | title fs18 w700 #FFFFFF
//    pill 105×30 #313F55 r9999 "50 GC" fs16 #22D1EE
//    avatars 32×32 (last "+12" #1E293B border #0B0E1A)
//    "18 / 32 Players Joined" fs12 #FFFFFF
//    btn 108×32 #313F55 "View Details" fs12 #FFFFFF
//
//  Completed card (342×393 r12 stroke #5A4136 o75):
//    "Tournament Ended" fs12 #FFFFFF | title fs18 w700
//    "Total Prize: 2,500 GC" fs12 | pill 130×30 #313F55 "64 Players"
//    "Top 3 Winners" fs10 #FFC107 + 3× 292×40 winner rows
//    1st bg #313F55 avatar border #FFC107 / 2nd-3rd bg #343435 #37365A
//    btn 292×32 #313F55 "View Full Standings"
// ════════════════════════════════════════════════════════════════

class TournamentDetailsScreen extends StatelessWidget {
  final String? tournamentId;
  const TournamentDetailsScreen({super.key, this.tournamentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          _Header(
            onBack: () => Navigator.pop(context),
            onCreate: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => CreateTournamentScreen())),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 24.h),
              children: [
                _CreateHero(),
                SizedBox(height: 32.h),
                _RankCard(),
                SizedBox(height: 32.h),
                _TournamentList(),
              ],
            ),
          ),
        ]),
      ),
      bottomNavigationBar: GamearnBottomNav(
        currentIndex: 1,
        onTap: (i) {
          if (i != 1) Navigator.pop(context);
        },
      ),
    );
  }
}

// ── HEADER (Frame 56) ─────────────────────────────────────────────
class _Header extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onCreate;
  const _Header({required this.onBack, required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
      decoration: BoxDecoration(
        color: context.bg,
        border: Border(
            bottom: BorderSide(
                color: context.isDark ? Colors.white : context.border)),
      ),
      child: Row(children: [
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Icon(Icons.close_rounded,
              color: context.txtPri, size: 20.w),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Text('Tournament Details',
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w700)),
        ),
        GestureDetector(
          onTap: onCreate,
          child: Container(
            width: 36.w, height: 36.h,
            decoration: BoxDecoration(
              color: kOrange,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Icon(Icons.add_rounded,
                color: Colors.white, size: 22.w),
          ),
        ),
      ]),
    );
  }
}

// ── HERO ACTION: Create Tournament → ──────────────────────────────
class _CreateHero extends StatelessWidget {
  const _CreateHero();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100.h,
      padding: EdgeInsets.symmetric(horizontal: 20.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [const Color(0xFF161E33), const Color(0xFF0B0E1A)],
        ),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Row(children: [
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Host Your Own',
                  style: TextStyle(
                      color: const Color(0xFFFFB693),
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
              SizedBox(height: 4.h),
              GestureDetector(
                onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => CreateTournamentScreen())),
                child: Text('Create Tournament',
                    style: TextStyle(
                        color: const Color(0xFFE5E2E1),
                        fontSize: 20.sp,
                        fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
        Container(
          width: 48.w, height: 48.h,
          decoration: BoxDecoration(
            color: const Color(0xFFFF6B00),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.add_rounded,
              color: Colors.white, size: 24.w),
        ),
      ]),
    );
  }
}

// ── RANK 1 ────────────────────────────────────────────────────────
class _RankCard extends StatefulWidget {
  const _RankCard();
  @override
  State<_RankCard> createState() => _RankCardState();
}

class _RankCardState extends State<_RankCard> {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('leaderboard')
          .orderBy('allTimeScore', descending: true)
          .limit(1)
          .snapshots(),
      builder: (_, snap) {
        final name = 'Adebayo';
        final xp = '78,450';
        final wins = '50';

        final doc = snap.hasData && snap.data!.docs.isNotEmpty
            ? snap.data!.docs.first
            : null;
        if (doc != null) {
          final d = doc.data() as Map<String, dynamic>;
          final ws = Map<String, int>.from(d['wins'] ?? {});
          final totalWins = ws.values.fold<int>(0, (a, b) => a + b);
          return Container(
            height: 43.h,
            padding: EdgeInsets.symmetric(horizontal: 14.w),
            decoration: BoxDecoration(
              color: kCyan.withOpacity(0.06),
              borderRadius: BorderRadius.circular(8.r),
              border: Border.all(color: kCyan),
            ),
            child: Row(children: [
              Text('1',
                  style: TextStyle(
                      color: kCyan,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w400)),
              SizedBox(width: 16.w),
              Container(
                width: 24.w, height: 24.h,
                decoration: BoxDecoration(
                  color: const Color(0xFF375277),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                      (d['avatar'] as String? ?? '😀'),
                      style: TextStyle(fontSize: 12.sp)),
                ),
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(d['username'] as String? ?? 'Adebayo',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('$totalWins XP',
                      style: TextStyle(
                          color: kCyan,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500)),
                  Text('Wins',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500)),
                ],
              ),
            ]),
          );
        }

        return Container(
          height: 43.h,
          padding: EdgeInsets.symmetric(horizontal: 14.w),
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.06),
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: kCyan),
          ),
          child: Row(children: [
            Text('1',
                style: TextStyle(
                    color: kCyan,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w400)),
            SizedBox(width: 16.w),
            Container(
              width: 24.w, height: 24.h,
              decoration: BoxDecoration(
                color: const Color(0xFF375277),
                shape: BoxShape.circle,
              ),
              child: Center(
                  child: Text('😀', style: TextStyle(fontSize: 12.sp))),
            ),
            SizedBox(width: 10.w),
            Expanded(
              child: Text(name,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('$xp XP',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
                Text('$wins Wins',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ]),
        );
      },
    );
  }
}

// ── TOURNAMENT LIST (pending + completed cards) ───────────────────
class _TournamentList extends StatelessWidget {
  const _TournamentList();

  static const _assets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('tournaments')
          .orderBy('createdAt', descending: true)
          .snapshots(),
      builder: (_, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return Padding(
            padding: EdgeInsets.symmetric(vertical: 40.h),
            child: Center(
                child: CircularProgressIndicator(
                    color: kCyan, strokeWidth: 2)),
          );
        }
        final docs = snap.data?.docs ?? [];
        if (docs.isEmpty) {
          return Padding(
            padding: EdgeInsets.symmetric(vertical: 40.h),
            child: Center(
              child: Text('No tournaments yet — host your own!',
                  style: TextStyle(
                      color: const Color(0xFF9A9A9A), fontSize: 14.sp)),
            ),
          );
        }

        final pending = docs.where((d) {
          final s = (d.data() as Map<String, dynamic>)['status'] as String?;
          return s != 'completed';
        }).toList();
        final completed = docs.where((d) {
          final s = (d.data() as Map<String, dynamic>)['status'] as String?;
          return s == 'completed';
        }).toList();

        return Column(children: [
          ...pending.map((d) => _PendingCard(data: d, assets: _assets)),
          ...completed.map((d) => _CompletedCard(data: d, assets: _assets)),
        ]);
      },
    );
  }
}

// ── PENDING CARD ──────────────────────────────────────────────────
class _PendingCard extends StatelessWidget {
  final DocumentSnapshot data;
  final Map<String, String> assets;
  const _PendingCard({required this.data, required this.assets});

  @override
  Widget build(BuildContext context) {
    final d = data.data() as Map<String, dynamic>;
    final title = d['title'] as String? ?? 'Tournament';
    final prize = d['prizePool'] as String? ?? '0';
    final players = (d['players'] as List?)?.cast<String>() ?? [];
    final maxP = d['maxPlayers'] as int? ?? 32;
    final gameKey = (d['gameType'] as String? ?? 'whot').toLowerCase();
    final asset = assets.entries
        .firstWhere((e) => gameKey.contains(e.key),
            orElse: () => assets.entries.first)
        .value;
    final status = d['status'] as String? ?? 'upcoming';

    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: context.bg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: kCyan),
      ),
      child: Column(children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8.r),
            child: Image.asset(asset,
                width: 60.w, height: 60.h, fit: BoxFit.cover),
          ),
          SizedBox(width: 14.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 8.w, height: 8.h,
                    decoration: BoxDecoration(
                        color: const Color(0xFFFFC107),
                        shape: BoxShape.circle),
                  ),
                  SizedBox(width: 8.w),
                  Text('Pending Entry',
                      style: TextStyle(
                          color: const Color(0xFFFFC107),
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500)),
                ]),
                SizedBox(height: 6.h),
                Text(title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700)),
                SizedBox(height: 2.h),
                Text(gameKey.toUpperCase(),
                    style: TextStyle(
                        color: context.txtPri, fontSize: 12.sp)),
              ],
            ),
          ),
          SizedBox(width: 8.w),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
            decoration: BoxDecoration(
              color: const Color(0xFF313F55),
              borderRadius: BorderRadius.circular(15.r),
            ),
            child: Text('$prize GC',
                style: TextStyle(
                    color: kCyan,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600)),
          ),
        ]),
        SizedBox(height: 18.h),
        Row(children: [
          SizedBox(
            width: 130.w, height: 32.h,
            child: Stack(
              children: [
                ...List.generate(
                  (players.length).clamp(0, 3),
                  (i) => Positioned(
                    left: i * 20.0,
                    child: Container(
                      width: 32.w, height: 32.h,
                      decoration: BoxDecoration(
                        color: context.card,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF0B0E1A)),
                      ),
                      child: Center(
                          child: Text('👤',
                              style: TextStyle(fontSize: 14.sp))),
                    ),
                  ),
                ),
                if (players.length > 3)
                  Positioned(
                    left: 60.0,
                    child: Container(
                      width: 32.w, height: 32.h,
                      decoration: BoxDecoration(
                        color: context.card,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF0B0E1A)),
                      ),
                      child: Center(
                        child: Text('+${players.length - 3}',
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 10.sp,
                                fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(width: 10.w),
          Expanded(
            child: Text('${players.length} / $maxP Players Joined',
                style: TextStyle(
                    color: context.txtPri, fontSize: 12.sp)),
          ),
          GestureDetector(
            onTap: () {
              Widget dest;
              if (status == 'live') {
                dest = LiveTournamentScreen(
                    tournamentId: data.id, tournamentTitle: title);
              } else if (status == 'pending') {
                dest = TournamentPendingScreen(tournamentId: data.id);
              } else {
                dest = TournamentEntryScreen(
                    tournamentId: data.id,
                    title: title,
                    entryFee: int.tryParse(d['entryCost']?.toString() ?? '0') ?? 0);
              }
              Navigator.push(
                  context, MaterialPageRoute(builder: (_) => dest));
            },
            child: Container(
              width: 108.w, height: 32.h,
              decoration: BoxDecoration(
                color: const Color(0xFF313F55),
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Center(
                child: Text('View Details',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ),
            ),
          ),
        ]),
      ]),
    );
  }
}

// ── COMPLETED CARD ────────────────────────────────────────────────
class _CompletedCard extends StatelessWidget {
  final DocumentSnapshot data;
  final Map<String, String> assets;
  const _CompletedCard({required this.data, required this.assets});

  @override
  Widget build(BuildContext context) {
    final d = data.data() as Map<String, dynamic>;
    final title = d['title'] as String? ?? 'Tournament';
    final prize = d['prizePool'] as String? ?? '0';
    final players = (d['players'] as List?)?.cast<String>() ?? [];
    final gameKey = (d['gameType'] as String? ?? 'whot').toLowerCase();
    final asset = assets.entries
        .firstWhere((e) => gameKey.contains(e.key),
            orElse: () => assets.entries.first)
        .value;

    final total = int.tryParse(prize.replaceAll(',', '')) ?? 0;
    final winners = [
      ('🥇', '1st', (total * 0.5).toInt()),
      ('🥈', '2nd', (total * 0.3).toInt()),
      ('🥉', '3rd', (total * 0.2).toInt()),
    ];

    return Opacity(
      opacity: 0.75,
      child: Container(
        margin: EdgeInsets.only(bottom: 16.h),
        padding: EdgeInsets.all(24.r),
        decoration: BoxDecoration(
          color: context.bg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: const Color(0xFF5A4136)),
        ),
        child: Column(children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8.r),
              child: Image.asset(asset,
                  width: 60.w, height: 60.h, fit: BoxFit.cover),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tournament Ended',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500)),
                  SizedBox(height: 4.h),
                  Text(title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w700)),
                  SizedBox(height: 2.h),
                  Text('Total Prize: $prize GC',
                      style: TextStyle(
                          color: context.txtPri, fontSize: 12.sp)),
                ],
              ),
            ),
            SizedBox(width: 8.w),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
              decoration: BoxDecoration(
                color: const Color(0xFF313F55),
                borderRadius: BorderRadius.circular(15.r),
              ),
              child: Text('${players.length} Players',
                  style: TextStyle(
                      color: kCyan,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w600)),
            ),
          ]),
          SizedBox(height: 16.h),
          Align(
            alignment: Alignment.centerLeft,
            child: Text('Top 3 Winners',
                style: TextStyle(
                    color: const Color(0xFFFFC107), fontSize: 10.sp)),
          ),
          SizedBox(height: 12.h),
          ...winners.map((w) => Container(
            height: 40.h,
            margin: EdgeInsets.only(bottom: 12.h),
            padding: EdgeInsets.symmetric(horizontal: 14.w),
            decoration: BoxDecoration(
              color: w.$2 == '1st'
                  ? const Color(0xFF313F55)
                  : const Color(0xFF343435),
              borderRadius: BorderRadius.circular(20.r),
            ),
            child: Row(children: [
              Container(
                width: 32.w, height: 32.h,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: w.$2 == '1st'
                          ? const Color(0xFFFFC107)
                          : const Color(0xFF37365A)),
                ),
                child: Center(
                    child: Text(w.$1, style: TextStyle(fontSize: 14.sp))),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Text('${w.$2} Place',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ),
              Text('${w.$3} GC',
                  style: TextStyle(
                      color: const Color(0xFFFFC107),
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500)),
            ]),
          )),
          GestureDetector(
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) =>
                        TournamentResultsScreen(tournamentId: data.id))),
            child: Container(
              height: 32.h,
              decoration: BoxDecoration(
                color: const Color(0xFF313F55),
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Center(
                child: Text('View Full Standings',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
