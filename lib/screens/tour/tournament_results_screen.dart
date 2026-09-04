import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT RESULTS SCREEN — Pixel-perfect Figma match
//  Node: 2273:2793
//
//  AppBar: pt=40 pb=16 px=24 | blur bg #0B0E1A90 | border-b #FFFFFF4D
//  Glow: absolute top=95 left=67 right=67 h=256 blur=40 rgba(34,209,238,0.2)
//  Content: left=24 top=95 w=342
//  Podium: 2nd (rotate +3°, border #94A3B8) | 1st (crown, border #FFC107)
//          | 3rd (rotate -3°, border #CD7F32)
//  Leaderboard rows: user #16223F glow | others #0A1128 50%
// ════════════════════════════════════════════════════════════════

// ── Figma asset URLs (7-day CDN) ─────────────────────────────────
const _kAvatar2nd  = 'https://www.figma.com/api/mcp/asset/27f0a18e-3051-4c9e-8216-5f815e990f04';
const _kAvatarWin  = 'https://www.figma.com/api/mcp/asset/7c133bf9-71f9-40d7-8455-1fe66df8b16a';
const _kAvatar3rd  = 'https://www.figma.com/api/mcp/asset/b5c22d96-f837-4a48-93a8-dce323f2030f';
const _kAvatarUser = 'https://www.figma.com/api/mcp/asset/d77c3908-e41a-4c09-be62-228bae66c10d';
const _kAvatarP1   = 'https://www.figma.com/api/mcp/asset/b686b276-99d3-4e95-a53a-eab1806ad7ee';
const _kAvatarP2   = 'https://www.figma.com/api/mcp/asset/3abe1b04-a1e6-455b-bdef-215acb29939f';
const _kIconCrown  = 'https://www.figma.com/api/mcp/asset/de62c9a1-fdcd-45b2-bdc6-466a9c14be24';

class TournamentResultsScreen extends StatelessWidget {
  final String tournamentId;
  const TournamentResultsScreen({super.key, required this.tournamentId});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: context.bg,
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('tournaments')
            .doc(tournamentId)
            .snapshots(),
        builder: (_, snap) {
          if (!snap.hasData) {
            return Center(
                child: CircularProgressIndicator(
                    color: const Color(0xFF22D1EE), strokeWidth: 2.w));
          }

          final data    = snap.data!.data() as Map<String, dynamic>? ?? {};
          final title   = data['title']     as String? ?? 'Tournament';
          final prize   = data['prizePool'] as String? ?? '0';
          final results = (data['results'] as List?)
              ?.cast<Map<String, dynamic>>() ??
              const <Map<String, dynamic>>[];

          final totalNaira =
              int.tryParse(prize.replaceAll(',', '').replaceAll('₦', '')) ?? 0;
          final prizes = [
            (totalNaira * 0.5).round(),
            (totalNaira * 0.3).round(),
            (totalNaira * 0.2).round(),
          ];

          final myIdx  = results.indexWhere((r) => r['uid'] == uid);
          final myRank = myIdx >= 0 ? myIdx + 1 : null;
          final myPts  = myIdx >= 0 ? (results[myIdx]['points'] as int? ?? 0) : 0;
          final myEarned =
              myIdx >= 0 && myIdx < prizes.length ? prizes[myIdx] : 0;

          return Stack(
            children: [
              // ── Decorative glow — absolute top=95 left=67 right=67 h=256 blur=40 ──
              Positioned(
                top: top + 95,
                left: 67,
                right: 67,
                child: Container(
                  height: 256.h,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(9999.r),
                    color: const Color(0x3322D1EE),
                  ),
                  // blur via ImageFilter would need BackdropFilter — use BoxShadow glow instead
                ),
              ),

              Column(
                children: [
                  _AppBar(safeTop: top),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 40.h),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          SizedBox(height: 24.h),

                          // ── COMPLETED badge — node 2322:2799 ──────────
                          // w=125 rx=100 px=9 py=7 bg rgba(22,34,63,0.8)
                          // border rgba(42,229,0,0.3)
                          Container(
                            width: 125.w,
                            padding: EdgeInsets.symmetric(
                                horizontal: 9.w, vertical: 7.h),
                            decoration: BoxDecoration(
                              color: const Color(0xCC16223F),
                              borderRadius: BorderRadius.circular(100.r),
                              border: Border.all(
                                  color: const Color(0x4D2AE500)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Dot 8×8 #2AE500 shadow 0,0,8 rgba(42,229,0,0.6)
                                Container(
                                  width: 8.w,
                                  height: 8.h,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF2AE500),
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                          color: const Color(0x992AE500),
                                          blurRadius: 8.w)
                                    ],
                                  ),
                                ),
                                SizedBox(width: 6.w),
                                Text('COMPLETED',
                                    style: TextStyle(
                                        color: const Color(0xCC2AE500),
                                        fontSize: 10.sp,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 2,
                                        height: 15 / 10)),
                              ],
                            ),
                          ),
                          SizedBox(height: 12.h),

                          // ── Title — node 2322:2804 ────────────────────
                          // fs=32 fw=700 lh=40 ls=-0.8 white center
                          Text(title,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 32.sp,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.8,
                                  height: 40 / 32)),
                          SizedBox(height: 4.h),

                          // ── Prize pool — node 2322:2805 ───────────────
                          Text('Total Prize Pool',
                              style: TextStyle(
                                  color: const Color(0x99FFFFFF),
                                  fontSize: 10.sp,
                                  fontWeight: FontWeight.w700,
                                  height: 13.5 / 10)),
                          SizedBox(height: 2.h),
                          Text('₦${_fmt(totalNaira)}.00',
                              style: TextStyle(
                                  color: const Color(0xFFFFC107),
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 2,
                                  height: 25 / 20)),
                          SizedBox(height: 32.h),

                          // ── Podium — node 2322:2810 ───────────────────
                          // py=16 gap=16 items-end justify-center
                          if (results.isEmpty)
                            Padding(
                              padding: EdgeInsets.symmetric(vertical: 16.h),
                              child: Text(
                                'Results will appear here once the tournament finishes',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: context.txtSec, fontSize: 12.sp),
                              ),
                            )
                          else
                            _Podium(results: results, prizes: prizes),
                          SizedBox(height: 16.h),

                          // ── User Performance card — node 2326:1464 ────
                          if (myRank != null)
                            _UserCard(rank: myRank, pts: myPts, earned: myEarned),
                          if (myRank != null) SizedBox(height: 16.h),

                          // ── Leaderboard — node 2327:1521 ─────────────
                          if (results.isNotEmpty)
                            _Leaderboard(results: results, uid: uid),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  static String _fmt(int n) => n == 0
      ? '0'
      : n.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

// ── AppBar ──────────────────────────────────────────────────────────────────

class _AppBar extends StatelessWidget {
  final double safeTop;
  const _AppBar({required this.safeTop});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24.w, safeTop + 16.h, 24.w, 16.h),
      decoration: BoxDecoration(
        color: context.bg,
        border: const Border(bottom: BorderSide(color: Color(0x4DFFFFFF))),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Text('Tournament Results',
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 18.sp,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.27,
                  height: 22.5 / 18)),
          Positioned(
            left: 0,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Icon(Icons.close_rounded,
                  color: context.txtPri, size: 20.w),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Podium ──────────────────────────────────────────────────────────────────

class _Podium extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final List<int> prizes;
  const _Podium({required this.results, required this.prizes});

  @override
  Widget build(BuildContext context) {
    final p1 = results.isNotEmpty ? results[0] : null;
    final p2 = results.length > 1 ? results[1] : null;
    final p3 = results.length > 2 ? results[2] : null;

    return Padding(
      padding: EdgeInsets.symmetric(vertical: 16.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // 2nd — node 2322:2811 — w=79.36 rotate=+3
          if (p2 != null)
            _PodiumSlot(
              rank: 2,
              name: p2['username'] as String? ?? 'Player',
              prize: prizes.length > 1 ? prizes[1] : 0,
              avatarUrl: p2['avatar'] as String?,
              staticAvatarUrl: _kAvatar2nd,
              borderColor: context.txtSec,
              rankBg: context.txtSec,
              nameColor: context.txtSec,
              rotateDeg: 3,
              avatarSize: 64,
            ),
          // 1st — node 2322:2823
          if (p1 != null)
            _FirstPlace(
              name: p1['username'] as String? ?? 'TBD',
              prize: prizes.isNotEmpty ? prizes[0] : 0,
              avatarUrl: p1['avatar'] as String?,
            ),
          // 3rd — node 2322:2837 — w=64 rotate=-3
          if (p3 != null)
            _PodiumSlot(
              rank: 3,
              name: p3['username'] as String? ?? 'Player',
              prize: prizes.length > 2 ? prizes[2] : 0,
              avatarUrl: p3['avatar'] as String?,
              staticAvatarUrl: _kAvatar3rd,
              borderColor: const Color(0xFFCD7F32),
              rankBg: const Color(0xFFCD7F32),
              nameColor: const Color(0xFFCD7F32),
              rotateDeg: -3,
              avatarSize: 64,
            ),
        ],
      ),
    );
  }
}

class _FirstPlace extends StatelessWidget {
  final String name;
  final int prize;
  final String? avatarUrl;
  const _FirstPlace({required this.name, required this.prize, this.avatarUrl});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // pb=16 to push avatar down vs 2nd/3rd
        Padding(
          padding: EdgeInsets.only(bottom: 16.h),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Crown icon — node 2322:2830-2831 — 30×27 top=-32 center-x
              Positioned(
                top: -32.h,
                left: 0,
                right: 0,
                child: Center(
                  child: SizedBox(
                    width: 30.w,
                    height: 27.h,
                    child: CachedNetworkImage(
                      imageUrl: _kIconCrown,
                      fit: BoxFit.contain,
                      errorWidget: (_, __, ___) =>
                          Text('👑', style: TextStyle(fontSize: 24.sp)),
                    ),
                  ),
                ),
              ),
              // Avatar — node 2322:2832 — 112×112 rx=24 border #FFC107 w=4
              // shadow 0,0,12,0 rgba(255,193,7,0.6)
              Container(
                width: 112.w,
                height: 112.h,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24.r),
                  border: Border.all(color: const Color(0xFFFFC107), width: 4.w),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0x99FFC107), blurRadius: 12.w, spreadRadius: 0)
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20.r),
                  child: CachedNetworkImage(
                    imageUrl: avatarUrl ?? _kAvatarWin,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                        color: const Color(0xFF2A3B66),
                        child: Icon(Icons.person,
                            color: Colors.white54, size: 48.w)),
                  ),
                ),
              ),
              // Rank badge — node 2322:2834 — 40×40 rx=12 bg #FFC107
              // border #0B0E1A w=2 bottom=-20 right=-8.32
              Positioned(
                bottom: -20.h,
                right: -8.w,
                child: Container(
                  width: 40.w,
                  height: 40.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFC107),
                    borderRadius: BorderRadius.circular(12.r),
                    border:
                        Border.all(color: const Color(0xFF0B0E1A), width: 2.w),
                  ),
                  child: Center(
                    child: Text('1',
                        style: TextStyle(
                            color: const Color(0xFF0B0E1A),
                            fontSize: 20.sp,
                            fontWeight: FontWeight.w700,
                            height: 28 / 20)),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 4.h),
        // Name — #FFC107 fs=14 fw=700 ls=1.4 uppercase
        Text(name.toUpperCase(),
            style: TextStyle(
                color: const Color(0xFFFFC107),
                fontSize: 14.sp,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.4,
                height: 20 / 14)),
        SizedBox(height: 2.h),
        // Prize — #FFC107 fs=12 fw=700
        Text(prize > 0 ? '₦${_fmt(prize)}' : '',
            style: TextStyle(
                color: const Color(0xFFFFC107),
                fontSize: 12.sp,
                fontWeight: FontWeight.w700,
                height: 16 / 12)),
      ],
    );
  }
}

class _PodiumSlot extends StatelessWidget {
  final int rank;
  final String name;
  final int prize;
  final String? avatarUrl;
  final String staticAvatarUrl;
  final Color borderColor;
  final Color rankBg;
  final Color nameColor;
  final double rotateDeg;
  final double avatarSize;

  const _PodiumSlot({
    required this.rank,
    required this.name,
    required this.prize,
    this.avatarUrl,
    required this.staticAvatarUrl,
    required this.borderColor,
    required this.rankBg,
    required this.nameColor,
    required this.rotateDeg,
    required this.avatarSize,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Avatar with rank badge — h=76 (incl badge overflow)
        SizedBox(
          width: avatarSize + 12, // room for badge overflow
          height: 76,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Rotated avatar — border rx=16
              Positioned(
                top: 0,
                left: 0,
                child: Transform.rotate(
                  angle: rotateDeg * 3.14159265 / 180,
                  child: Container(
                    width: avatarSize,
                    height: avatarSize,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16.r),
                      border: Border.all(color: borderColor, width: 2.w),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(14.r),
                      child: CachedNetworkImage(
                        imageUrl: avatarUrl ?? staticAvatarUrl,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                            color: const Color(0xFF2A3B66),
                            child: Icon(Icons.person,
                                color: Colors.white54, size: 28.w)),
                      ),
                    ),
                  ),
                ),
              ),
              // Rank badge — 32×32 rx=8, bottom=-6.37 right=-6.37
              Positioned(
                bottom: -6.h,
                right: -6.w,
                child: Container(
                  width: 32.w,
                  height: 32.h,
                  decoration: BoxDecoration(
                    color: rankBg,
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Center(
                    child: Text('$rank',
                        style: TextStyle(
                            color: const Color(0xFF0B0E1A),
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w700,
                            height: 20 / 14)),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 2.h),
        Text(name.toUpperCase(),
            textAlign: TextAlign.center,
            style: TextStyle(
                color: nameColor,
                fontSize: 12.sp,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                height: 16 / 12)),
        SizedBox(height: 2.h),
        Text(prize > 0 ? '₦${_fmt(prize)}' : '',
            style: TextStyle(
                color: const Color(0xFFFFC107),
                fontSize: 10.sp,
                fontWeight: FontWeight.w700,
                height: 15 / 10)),
      ],
    );
  }
}

String _fmt(int n) => n == 0
    ? '0'
    : n.toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');

// ── User Performance Card ────────────────────────────────────────────────────
// Node 2326:1464 — backdrop-blur-2 bg rgba(30,46,86,0.6) border-l-4 #22D1EE
// rx=br-12 rx=tr-12 pl=28 pr=24 py=24

class _UserCard extends StatelessWidget {
  final int rank;
  final int pts;
  final int earned;
  const _UserCard({required this.rank, required this.pts, required this.earned});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(28.w, 24.h, 24.w, 24.h),
      decoration: BoxDecoration(
        color: const Color(0x991E2E56),
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(12.r),
          bottomRight: Radius.circular(12.r),
        ),
        border: Border(left: BorderSide(color: const Color(0xFF22D1EE), width: 4.w)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('YOUR FINAL RANK',
                  style: TextStyle(
                      color: const Color(0xFF22D1EE),
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 15 / 10)),
              SizedBox(height: 2.h),
              Text('#$rank',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 32.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.8,
                      height: 40 / 32)),
            ],
          ),
          // Vertical divider — node 2326:1471 — 1px h=48 rgba(51,65,85,0.5)
          Container(width: 1.w, height: 48.h, color: const Color(0x80334155)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('EARNED REWARDS',
                  style: TextStyle(
                      color: const Color(0xB3FFFFFF),
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 15 / 10)),
              SizedBox(height: 2.h),
              Text(
                earned > 0 ? '₦${_fmt(earned)}.00' : '₦0.00',
                style: TextStyle(
                    color: const Color(0xFFFFC107),
                    fontSize: 20.sp,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                    height: 25 / 20),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
// Node 2327:1521 — gap=16

class _Leaderboard extends StatelessWidget {
  final List<Map<String, dynamic>> results;
  final String uid;
  const _Leaderboard({required this.results, required this.uid});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        Row(
          children: [
            Expanded(
              child: Text('Leaderboard',
                  style: TextStyle(
                      color: context.txtSec,
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.4,
                      height: 20 / 14)),
            ),
            Text('Points',
                style: TextStyle(
                    color: const Color(0xFF22D1EE),
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                    height: 15 / 10)),
          ],
        ),
        SizedBox(height: 16.h),
        // Rows — gap=10
        ...results.asMap().entries.map((e) {
          final i    = e.key;
          final r    = e.value;
          final isMe = r['uid'] == uid;
          return Padding(
            padding: EdgeInsets.only(bottom: 10.h),
            child: _LeaderboardRow(
              rank: i + 1,
              name: r['username'] as String? ?? 'Player',
              points: r['points'] as int? ?? 0,
              avatarUrl: r['avatar'] as String?,
              initials: (r['username'] as String? ?? 'P').substring(0, 2).toUpperCase(),
              isCurrentUser: isMe,
            ),
          );
        }),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final int rank;
  final String name;
  final int points;
  final String? avatarUrl;
  final String initials;
  final bool isCurrentUser;

  const _LeaderboardRow({
    required this.rank,
    required this.name,
    required this.points,
    this.avatarUrl,
    required this.initials,
    required this.isCurrentUser,
  });

  @override
  Widget build(BuildContext context) {
    // User highlight — node 2327:1528
    // bg #16223F border rgba(34,209,238,0.4) rx=12 shadow 0,0,8,0 rgba(34,209,238,0.4)
    // Others — node 2327:1538
    // bg rgba(10,17,40,0.5) border transparent rx=12
    return Container(
      padding: EdgeInsets.all(17.r),
      decoration: BoxDecoration(
        color: isCurrentUser ? const Color(0xFF16223F) : const Color(0x800A1128),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isCurrentUser
              ? const Color(0x6622D1EE)
              : const Color(0x00000000),
        ),
        boxShadow: isCurrentUser
            ? [
                BoxShadow(
                    color: const Color(0x6622D1EE), blurRadius: 8.w, spreadRadius: 0)
              ]
            : [],
      ),
      child: Row(
        children: [
          // Rank — user: #22D1EE fs=12 fw=500 | other: #94A3B8
          SizedBox(
            width: 24.w,
            child: Text('$rank',
                style: TextStyle(
                    color: isCurrentUser
                        ? const Color(0xFF22D1EE)
                        : context.txtSec,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w500,
                    height: 16 / 12)),
          ),
          SizedBox(width: 16.w),

          // Avatar
          // User: 40×40 circle border rgba(34,209,238,0.3) w=2 bg #2A3B66
          // Others: 36×36 circle no border bg #2A3B66
          _buildAvatar(),
          SizedBox(width: 16.w),

          // Name
          Expanded(
            child: Text(
              isCurrentUser ? 'YOU ($name)' : name,
              style: TextStyle(
                  color: isCurrentUser
                      ? const Color(0xFF22D1EE)
                      : context.txtSec,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.35,
                  height: 20 / 14),
              overflow: TextOverflow.ellipsis,
            ),
          ),

          // Points
          Text(_fmt(points),
              style: TextStyle(
                  color: isCurrentUser
                      ? const Color(0xFF22D1EE)
                       : context.txtSec,
                   fontSize: 16.sp,
                   fontWeight: FontWeight.w700,
                   letterSpacing: 0.8,
                   height: 24 / 16)),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    final size = isCurrentUser ? 40.0 : 36.0;
    final border = isCurrentUser
        ? Border.all(color: const Color(0x4D22D1EE), width: 2.w)
        : null;

    if (avatarUrl != null) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: border,
          color: const Color(0xFF2A3B66),
        ),
        child: ClipOval(
          child: CachedNetworkImage(
            imageUrl: avatarUrl!,
            fit: BoxFit.cover,
            // Figma: user avatar has 5% inset (left=5% top=5% size=90%)
            alignment: isCurrentUser ? Alignment.center : Alignment.center,
            errorWidget: (_, __, ___) => Center(
                child: Text(initials,
                    style: TextStyle(
                        color: const Color(0xFFF1F5F9),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w700))),
          ),
        ),
      );
    }

    // Initials fallback — node 2327:1557 bg #2A3B66 circle
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFF2A3B66),
        shape: BoxShape.circle,
        border: border,
      ),
      child: Center(
        child: Text(initials,
            style: TextStyle(
                color: const Color(0xFFF1F5F9),
                fontSize: 12.sp,
                fontWeight: FontWeight.w700,
                height: 16 / 12)),
      ),
    );
  }
}
