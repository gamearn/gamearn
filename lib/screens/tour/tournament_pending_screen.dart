import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'live_tournament_screen.dart';

// ════════════════════════════════════════════════════════════════
//  TOURNAMENT PENDING SCREEN — Pixel-perfect Figma match
//  Node: 2350:1754
//
//  AppBar: pt=40 pb=16 px=24 | blur bg #0B0E1A90 | w=390
//  Content: left=24 top=95 w=342 — gap=32 between sections
//
//  Hero image: h=213.75 rx=12 | img top=-30% h=160% (crop)
//  Title: left=29 top=35 | fs=32 fw=700 ls=-0.8 white
//  Win badge: w=147 rx=9999 bg rgba(34,209,238,0.2) blur=6
//  Participants badge: w=166 rx=9999 bg rgba(42,42,42,0.6) blur=6
//
//  Duration pill: full-width h=80 border-2 #00F2FF
//    drop-shadow 0,0,7.5 rgba(0,242,255,0.3)
//    value: fs=32 fw=700 ls=-0.8 cyan | label: fs=10 fw=700 ls=-0.5 cyan
//
//  Entry fee: h=125.5 bg rgba(29,41,70,0.4) border rgba(30,41,59,0.5) rx=12 p=25
//
//  Starts In: h=118 px=13 py=25 bg rgba(9,31,45,0.3) blur=10
//    border rgba(90,65,54,0.1) rx=12
//    time: fs=32 fw=700 ls=-0.8 cyan lh=40
//    label: fs=10 fw=400 rgba(255,255,255,0.7) lh=13.5
//    colon: Space Grotesk Bold fs=30 rgba(255,255,255,0.5) w=8.95 h=36
//
//  Invite: border-2 rgba(34,209,238,0.4) rx=12 px=2 py=18
//    icon 22×16 | text fw=600 fs=18 ls=-0.27 #22D1EE uppercase
//
//  Join Now: h=56 bg #FF5E00 rx=12 px=20
//    shadow 0,10,15,-3 rgba(255,94,0,0.2) + 0,4,6,-4 rgba(255,94,0,0.2)
//    bolt icon 11×14 | text fw=700 fs=18 ls=-0.27 white
// ════════════════════════════════════════════════════════════════

// ── Figma asset URLs (7-day CDN) ─────────────────────────────────
const _kHeroImage =
    'https://www.figma.com/api/mcp/asset/b5c7d33e-36cf-4cff-8947-d0554c62e463';
const _kIconShare =
    'https://www.figma.com/api/mcp/asset/26e233f2-9e66-48fc-8688-d39b21ee24f1';
const _kIconBolt =
    'https://www.figma.com/api/mcp/asset/6bb4bdc3-adcf-4aa5-b166-aaa85f153455';
const _kIconBack =
    'https://www.figma.com/api/mcp/asset/1280c03d-2bd3-41e7-a577-faf211809526';

class TournamentPendingScreen extends StatefulWidget {
  final String tournamentId;
  const TournamentPendingScreen({super.key, required this.tournamentId});

  @override
  State<TournamentPendingScreen> createState() =>
      _TournamentPendingScreenState();
}

class _TournamentPendingScreenState extends State<TournamentPendingScreen> {
  // Figma shows 12:48:12 — init to that, tick down
  int _totalSeconds = (12 * 3600) + (48 * 60) + 12;
  late Timer _timer;
  bool _joining = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _totalSeconds > 0) setState(() => _totalSeconds--);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _pad(int n) => n.toString().padLeft(2, '0');
  int get _h => _totalSeconds ~/ 3600;
  int get _m => (_totalSeconds % 3600) ~/ 60;
  int get _s => _totalSeconds % 60;

  Future<void> _join(String title) async {
    HapticFeedback.mediumImpact();
    setState(() => _joining = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      await FirebaseFirestore.instance
          .collection('tournaments')
          .doc(widget.tournamentId)
          .update({'players': FieldValue.arrayUnion([uid])});
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => LiveTournamentScreen(
            tournamentId: widget.tournamentId,
            tournamentTitle: title,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to join: $e')));
      }
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  void _invite(String title) {
    HapticFeedback.selectionClick();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Share link for "$title" coming soon!'),
      backgroundColor: const Color(0xFF22D1EE),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: context.bg,
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('tournaments')
            .doc(widget.tournamentId)
            .snapshots(),
        builder: (_, snap) {
          if (!snap.hasData) {
            return const Center(
                child: CircularProgressIndicator(
                    color: Color(0xFF22D1EE), strokeWidth: 2));
          }

          final data      = snap.data!.data() as Map<String, dynamic>? ?? {};
          final title     = data['title']       as String? ?? 'Tournament';
          final gameType  = data['gameType']    as String? ?? 'win';
          final players   = (data['players'] as List?)?.length ?? 47;
          final maxP      = data['maxPlayers']  as int? ?? 150;
          final entryFee  = data['entryCost']   as int? ?? 500;
          final durKey    = data['duration']    as String? ?? '7d';
          final durVal    = _durValue(durKey);
          final durLabel  = _durLabel(durKey);
          final typeLabel = gameType == 'win'
              ? 'Win-based Tournament'
              : 'Number of Plays';

          return Stack(
            children: [
              // ── Glow — node 2358:1543 — 256×256 circle centered blur=40 ──
              // Positioned center of screen
              Positioned(
                left: 0,
                right: 0,
                top: MediaQuery.of(context).size.height / 2 - 128,
                child: Center(
                  child: Container(
                    width: 256,
                    height: 256,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0x3322D1EE),
                      // simulate blur with large shadow
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x3322D1EE),
                          blurRadius: 40,
                          spreadRadius: 40,
                        )
                      ],
                    ),
                  ),
                ),
              ),

              Column(
                children: [
                  // ── AppBar — node 2358:1459 ──────────────────────────
                  _buildAppBar(safeTop),

                  Expanded(
                    child: SingleChildScrollView(
                      // Content starts at 95px from top
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const SizedBox(height: 16),

                          // ── gap=16 section 1 ─────────────────────────
                          Column(
                            children: [
                              // PENDING badge — node 2358:1473
                              // w=125 rx=100 bg rgba(22,34,63,0.8)
                              // border rgba(255,193,7,0.3) px=9 py=7
                              Container(
                                width: 125,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 9, vertical: 7),
                                decoration: BoxDecoration(
                                  color: const Color(0xCC16223F),
                                  borderRadius: BorderRadius.circular(100),
                                  border: Border.all(
                                      color: const Color(0x4DFFC107)),
                                ),
                                child: const Center(
                                  child: Text('PENDING',
                                      style: TextStyle(
                                          color: Color(0xFFFFC107),
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 2,
                                          height: 15 / 10)),
                                ),
                              ),
                              const SizedBox(height: 16),

                              // ── Hero Image — node 2358:1466 ────────────
                              // h=213.75 rx=12 overflow clip
                              _buildHeroImage(title, typeLabel, players, maxP),
                            ],
                          ),
                          const SizedBox(height: 32),

                          // ── gap=16 section 2 ─────────────────────────
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Duration — node 2358:1500
                              _buildDurationSection(durVal, durLabel),
                              const SizedBox(height: 16),

                              // Entry Fee — node 2358:1501
                              _buildEntryFeeCard(entryFee),
                              const SizedBox(height: 16),

                              // Starts In — node 2358:1532
                              _buildStartsIn(),
                              const SizedBox(height: 16),

                              // Invite Friends — node 2358:1533
                              _buildInviteButton(title),
                              const SizedBox(height: 16),

                              // Join Now — node 2369:1674
                              _buildJoinButton(title),
                            ],
                          ),
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

  // ── AppBar — node 2358:1459 ─────────────────────────────────────
  // pt=40 pb=16 px=24 backdrop-blur=6 bg rgba(11,14,26,0.9) border-b rgba(255,255,255,0.3)

  Widget _buildAppBar(double safeTop) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(24, safeTop + 16, 24, 16),
      decoration: const BoxDecoration(
        color: Color(0xE60B0E1A),
        border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF))),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          const Text('Tournament Pending',
              style: TextStyle(
                  color: Color(0xFFF1F5F9),
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.27,
                  height: 22.5 / 18)),
          // Back — node 2358:1462 — 16×25
          Positioned(
            left: 0,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              behavior: HitTestBehavior.opaque,
              child: SizedBox(
                width: 16,
                height: 25,
                child: CachedNetworkImage(
                  imageUrl: _kIconBack,
                  fit: BoxFit.contain,
                  errorWidget: (_, __, ___) => const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: Colors.white,
                      size: 18),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Hero Image — node 2358:1466 ─────────────────────────────────
  // h=213.75 rounded=12 | img: top=-30% h=160% (parallax crop to show mid)
  // Content: left=29 top=35 | title + 2 badges

  Widget _buildHeroImage(
      String title, String typeLabel, int players, int maxP) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        height: 213.75,
        width: double.infinity,
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            // Background image with parallax crop (top=-30% h=160%)
            Positioned.fill(
              child: OverflowBox(
                alignment: Alignment.topCenter,
                maxHeight: double.infinity,
                child: SizedBox(
                  height: 213.75 * 1.6,
                  child: Transform.translate(
                    offset: Offset(0, -213.75 * 0.3),
                    child: CachedNetworkImage(
                      imageUrl: _kHeroImage,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorWidget: (_, __, ___) => Container(
                        color: context.card,
                        child: const Center(
                            child: Icon(Icons.sports_esports_rounded,
                                color: Colors.white24, size: 48)),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Content — node 2358:1494 — left=29 top=35 gap=8
            Positioned(
              left: 29,
              top: 35,
              right: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title — fs=32 fw=700 ls=-0.8 white lh=40
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.8,
                          height: 40 / 32)),
                  const SizedBox(height: 8),

                  // Win-based badge — node 2358:1469
                  // w=147 rx=9999 bg rgba(34,209,238,0.2) blur=6
                  // border rgba(34,209,238,0.2) px=13 py=5
                  Container(
                    width: 147,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 13, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0x3322D1EE),
                      borderRadius: BorderRadius.circular(9999),
                      border: Border.all(color: const Color(0x3322D1EE)),
                    ),
                    child: Text(typeLabel.toUpperCase(),
                        style: const TextStyle(
                            color: Color(0xFF22D1EE),
                            fontSize: 10,
                            fontWeight: FontWeight.w400,
                            height: 13.5 / 10)),
                  ),
                  const SizedBox(height: 8),

                  // Participants badge — node 2358:1471
                  // w=166 rx=9999 bg rgba(42,42,42,0.6) blur=6
                  // border rgba(255,255,255,0.1) px=13 py=5
                  Container(
                    width: 166,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 13, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0x992A2A2A),
                      borderRadius: BorderRadius.circular(9999),
                      border:
                          Border.all(color: const Color(0x1AFFFFFF)),
                    ),
                    child: Text(
                        'PARTICIPANTS: $players / $maxP JOINED',
                        style: const TextStyle(
                            color: Color(0xCCFFFFFF),
                            fontSize: 10,
                            fontWeight: FontWeight.w400,
                            height: 13.5 / 10)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Duration — node 2358:1500 ───────────────────────────────────
  // label: fw=600 fs=16 lh=26 white
  // pill: full-width h=80 bg #16223F border-2 #00F2FF rx=12
  //   drop-shadow 0,0,7.5 rgba(0,242,255,0.3) p=2
  //   value: fs=32 fw=700 ls=-0.8 #00F2FF lh=40 text-center
  //   label: fs=10 fw=700 ls=-0.5 uppercase #00F2FF lh=15 text-center

  Widget _buildDurationSection(String value, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Duration',
            style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                height: 26 / 16)),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          height: 80,
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            color: const Color(0xFF16223F),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF00F2FF), width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x4D00F2FF),
                blurRadius: 7.5,
                spreadRadius: 0,
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(value,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: Color(0xFF00F2FF),
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.8,
                      height: 40 / 32)),
              Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      color: Color(0xFF00F2FF),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5,
                      height: 15 / 10)),
            ],
          ),
        ),
      ],
    );
  }

  // ── Entry Fee — node 2358:1501 ──────────────────────────────────
  // h=125.5 bg rgba(29,41,70,0.4) border rgba(30,41,59,0.5) rx=12 p=25

  Widget _buildEntryFeeCard(int fee) {
    return Container(
      width: double.infinity,
      height: 125.5,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: const Color(0x661D2946),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x801E293B)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // "ENTRY FEE" — #94A3B8 fs=12 fw=700 ls=2.4 uppercase lh=16
          Text('ENTRY FEE',
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2.4,
                  height: 16 / 12)),
          // ₦500.00 inline baseline
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              const Text('₦',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 25 / 20)),
              Text('$fee',
                  style: const TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 48,
                      fontWeight: FontWeight.w700,
                      height: 60 / 48)),
              const Text('.00',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 25 / 20)),
            ],
          ),
        ],
      ),
    );
  }

  // ── Starts In — node 2358:1508 + 2358:1531 ──────────────────────
  // Box: h=118 px=13 py=25 bg rgba(9,31,45,0.3) blur=10
  //   border rgba(90,65,54,0.1) rx=12
  // "STARTS IN": fs=10 fw=400 rgba(255,255,255,0.7) lh=13.5 uppercase center
  // Time row w=262 gap=16 justify-center
  //   Unit: value fs=32 fw=700 ls=-0.8 #22D1EE lh=40 | label fs=10 fw=400 rgba(255,255,255,0.7)
  //   Colon: Space Grotesk Bold fs=30 rgba(255,255,255,0.5) w=8.95 h=36 lh=36
  // Warning text: fs=12 fw=500 rgba(255,255,255,0.5) center lh=16

  Widget _buildStartsIn() {
    return Column(
      children: [
        Container(
          width: double.infinity,
          height: 118,
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 25),
          decoration: BoxDecoration(
            color: const Color(0x4D091F2D),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0x1A5A4136)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('STARTS IN',
                  style: TextStyle(
                      color: Color(0xB3FFFFFF),
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      height: 13.5 / 10)),
              const SizedBox(height: 4),
              // Time row — node 2358:1510 — w=262 gap=16 centered
              SizedBox(
                width: 262,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _timeUnit(_pad(_h), 'HRS'),
                    _colon(),
                    _timeUnit(_pad(_m), 'MIN'),
                    _colon(),
                    _timeUnit(_pad(_s), 'SEC'),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Warning text — node 2358:1531
        // fs=12 fw=500 rgba(255,255,255,0.5) center lh=16
        const Text(
          'if criteria is not meet within 24hrs, it will expire and be cancelled',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: Color(0x80FFFFFF),
              fontSize: 12,
              fontWeight: FontWeight.w500,
              height: 16 / 12),
        ),
      ],
    );
  }

  // Time unit — value (cyan) + label (white 70%)
  Widget _timeUnit(String value, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(value,
            style: const TextStyle(
                color: Color(0xFF22D1EE),
                fontSize: 32,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.8,
                height: 40 / 32,
                fontFamily: 'SplineSans')),
        Text(label,
            style: const TextStyle(
                color: Color(0xB3FFFFFF),
                fontSize: 10,
                fontWeight: FontWeight.w400,
                height: 13.5 / 10)),
      ],
    );
  }

  // Colon separator — node 2358:1519/1524
  // Space Grotesk Bold fs=30 rgba(255,255,255,0.5) w=8.95 h=36
  Widget _colon() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: SizedBox(
        width: 8.95,
        height: 36,
        child: Text(':',
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Color(0x80FFFFFF),
                fontSize: 30,
                fontWeight: FontWeight.w700,
                height: 36 / 30,
                // Space Grotesk for the colon — matches Figma exactly
                fontFamilyFallback: ['SpaceGrotesk'])),
      ),
    );
  }

  // ── Invite Friends — node 2358:1533 ────────────────────────────
  // border-2 rgba(34,209,238,0.4) rx=12 px=2 py=18 gap=8
  // icon 22×16 (share icon SVG) | text fw=600 fs=18 ls=-0.27 #22D1EE uppercase

  Widget _buildInviteButton(String title) {
    return GestureDetector(
      onTap: () => _invite(title),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0x6622D1EE), width: 2),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Share icon — node 2358:1534 — 22×16
            SizedBox(
              width: 22,
              height: 16,
              child: CachedNetworkImage(
                imageUrl: _kIconShare,
                fit: BoxFit.contain,
                errorWidget: (_, __, ___) => const Icon(
                    Icons.share_outlined,
                    color: Color(0xFF22D1EE),
                    size: 16),
              ),
            ),
            const SizedBox(width: 8),
            const Text('INVITE FRIENDS',
                style: TextStyle(
                    color: Color(0xFF22D1EE),
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    letterSpacing: -0.27,
                    height: 22.5 / 18)),
          ],
        ),
      ),
    );
  }

  // ── Join Now — node 2369:1674 ───────────────────────────────────
  // h=56 bg #FF5E00 rx=12 px=20 gap=8
  // shadow: 0,10,15,-3 rgba(255,94,0,0.2) + 0,4,6,-4 rgba(255,94,0,0.2)
  // bolt icon 11×14 | text fw=700 fs=18 ls=-0.27 white

  Widget _buildJoinButton(String title) {
    return GestureDetector(
      onTap: _joining ? null : () => _join(title),
      child: Container(
        width: double.infinity,
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFFF5E00),
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33FF5E00),
              blurRadius: 15,
              offset: Offset(0, 10),
              spreadRadius: -3,
            ),
            BoxShadow(
              color: Color(0x33FF5E00),
              blurRadius: 6,
              offset: Offset(0, 4),
              spreadRadius: -4,
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_joining)
              const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
            else ...[
              // Bolt icon — node 2369:1676 — 11×14
              SizedBox(
                width: 11,
                height: 14,
                child: CachedNetworkImage(
                  imageUrl: _kIconBolt,
                  fit: BoxFit.contain,
                  errorWidget: (_, __, ___) => const Icon(
                      Icons.bolt_rounded,
                      color: Colors.white,
                      size: 14),
                ),
              ),
              const SizedBox(width: 8),
              const Text('Join Now',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.27,
                      height: 22.5 / 18)),
            ],
          ],
        ),
      ),
    );
  }

  // ── Duration helpers ────────────────────────────────────────────
  String _durValue(String key) => switch (key) {
        '24h' => '24',
        '7d'  => '7',
        '2w'  => '2',
        '1m'  => '1',
        _     => '14',
      };

  String _durLabel(String key) => switch (key) {
        '24h' => 'HOURS',
        '7d'  => 'DAYS',
        '2w'  => 'WEEKS',
        '1m'  => 'MONTH',
        _     => 'DAYS',
      };
}
