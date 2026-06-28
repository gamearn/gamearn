import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'ludo_game_screen.dart';
import 'ayo_game_screen.dart';
import 'draughts_game_screen.dart';
import 'whot_game_screen.dart';
import '../../services/socket_service.dart';

// ════════════════════════════════════════════════════════════════
//  GAME SETUP SCREENS — Pixel-perfect Figma match × 4 games
//
//  Ludo  node 1838:4129 — Players (2/4) + Token Count (1-4) + Turn Timer
//  Dráfù node 1863:1495 — Turn Timer only
//  Ayò   node 1870:1675 — Turn Timer only
//  Whot  node 1860:1290 — Players (2-5) + Play Options + Starting Cards
//                         + Turn Timer + Special Cards (6 rules)
//
//  All share: AppBar, header, stats card, START GAME button, footer
//  Timer slider: track #334155 h=8 | fill #22D1EE w=223/342 | thumb 24×24
//    thumb: bg #22D1EE border-4 #101622 | labels 30s/1m/2m/3m
//  Stats card: bg rgba(34,209,238,0.05) border rgba(34,209,238,0.2) rx=12 p=17
//  START GAME: bg #FF5E00 rx=12 py=16 shadow 0,8,16,-12 #FF5E00
//  Footer logo: 83.18×24.777
// ════════════════════════════════════════════════════════════════

// ── Shared asset URLs ─────────────────────────────────────────────
// Ludo assets
const _kLudoBack     = 'https://www.figma.com/api/mcp/asset/bb8b2764-8103-432e-92e4-9e1ac4466cd6';
const _kLudoPlayers  = 'https://www.figma.com/api/mcp/asset/429eabdc-a963-4ec2-8dee-f8f1d869d82c';
const _kLudoTokens   = 'https://www.figma.com/api/mcp/asset/b34db2cf-a0bb-4722-b016-d73f3070e024';
const _kLudoLbIcon   = 'https://www.figma.com/api/mcp/asset/4e4904eb-9bc2-45cb-8d57-a3d09160d768';
const _kLudoBolt     = 'https://www.figma.com/api/mcp/asset/b751ed5d-09d8-4d1f-a78b-9f77a3a723c9';
const _kLudoLogo     = 'https://www.figma.com/api/mcp/asset/4eefd18d-13ba-4b71-baa0-8739de92c815';
// Dráfù assets
const _kDrafuBack    = 'https://www.figma.com/api/mcp/asset/9cc58704-bfb1-4b03-a7a4-d8b0dbad3119';
const _kDrafuLbIcon  = 'https://www.figma.com/api/mcp/asset/a96280b5-5111-4475-94d9-8afce2805f76';
const _kDrafuBolt    = 'https://www.figma.com/api/mcp/asset/4a5c1ed0-3db5-4bb4-a34b-4d5ef3522d74';
const _kDrafuLogo    = 'https://www.figma.com/api/mcp/asset/592b3b8b-1c31-4842-a8db-9ea423b88945';
// Ayò assets
const _kAyoBack      = 'https://www.figma.com/api/mcp/asset/d4f04b85-5df4-495a-aa7a-ab76493ea492';
const _kAyoLbIcon    = 'https://www.figma.com/api/mcp/asset/4ca719a9-2343-4a31-88c4-655af276d6f9';
const _kAyoBolt      = 'https://www.figma.com/api/mcp/asset/fad30569-f3b1-4128-a8e3-0323a6b1bcbe';
const _kAyoLogo      = 'https://www.figma.com/api/mcp/asset/7bbd9e21-be04-4f63-a181-8755a224e617';
// Whot assets
const _kWhotBack     = 'https://www.figma.com/api/mcp/asset/9885af57-556f-4e30-ad04-743cf1aa9a49';
const _kWhotCheck    = 'https://www.figma.com/api/mcp/asset/0d8d7288-a45f-45ce-8e97-ef8bf5d16c6c';
const _kWhotPlayers  = 'https://www.figma.com/api/mcp/asset/baa92c9f-913b-4079-a489-584263b0aee2';
const _kWhotCards    = 'https://www.figma.com/api/mcp/asset/65d6465f-8688-43b3-91c3-5f75241d7306';
const _kWhotStar     = 'https://www.figma.com/api/mcp/asset/eaeed254-77c1-40da-a9ef-f3024a4f56dc';
const _kWhotLbIcon   = 'https://www.figma.com/api/mcp/asset/445d7002-4ca7-41c6-964c-f608430a6f59';
const _kWhotBolt     = 'https://www.figma.com/api/mcp/asset/cf4d065c-e9da-4aea-8496-3c16673c36fa';
const _kWhotLogo     = 'https://www.figma.com/api/mcp/asset/156e6fd3-dd54-4e58-bf89-7ace90912639';

// ════════════════════════════════════════════════════════════════
//  LUDO GAME SET-UP
//  Sections: Players (2 | 4) + Token Count (1 2 3 4) + Turn Timer
// ════════════════════════════════════════════════════════════════

class LudoSetupScreen extends StatefulWidget {
  const LudoSetupScreen({super.key});
  @override
  State<LudoSetupScreen> createState() => _LudoSetupScreenState();
}

class _LudoSetupScreenState extends State<LudoSetupScreen> {
  int _players    = 4;   // 2 or 4
  int _tokens     = 4;   // 1-4
  double _timer   = 2.0; // 0.5=30s 1=1m 2=2m 3=3m

  @override
  Widget build(BuildContext context) {
    return _SetupBase(
      title: 'Lúùdò Game Set-up',
      backUrl: _kLudoBack,
      lbIconUrl: _kLudoLbIcon,
      boltUrl: _kLudoBolt,
      logoUrl: _kLudoLogo,
      lbPosition: '3,450',
      entryFee: '\$70.00',
      onStart: _startGame,
      sections: [
        // ── Players Selection ─────────────────────────────────────
        // node 1850:6246 — Players icon 24×12, h=48 bg rgba(30,41,59,0.5)
        // active: bg #22D1EE rx=6 text #0B0E1A | inactive: transparent rx=8 text white
        _SectionContainer(
          iconUrl: _kLudoPlayers,
          iconW: 24, iconH: 12,
          title: 'Players Selection',
          child: _SegmentedPicker(
            options: const ['2', '4'],
            selected: _players.toString(),
            activeColor: const Color(0xFF22D1EE),
            activeTextColor: const Color(0xFF0B0E1A),
            containerRx: 8,
            activeRx: 6,
            onChanged: (v) => setState(() => _players = int.parse(v)),
          ),
        ),
        const SizedBox(height: 24),

        // ── Token Count ───────────────────────────────────────────
        // node 1850:6252 — Token icon 18×20, h=48 bg rgba(30,41,59,0.5) rx=12
        // active: bg #FFC107 rx=8 text #0B0E1A | inactive: transparent text white 90%
        _SectionContainer(
          iconUrl: _kLudoTokens,
          iconW: 18, iconH: 20,
          title: 'Token Count',
          child: _SegmentedPicker(
            options: const ['1', '2', '3', '4'],
            selected: _tokens.toString(),
            activeColor: const Color(0xFFFFC107),
            activeTextColor: const Color(0xFF0B0E1A),
            inactiveTextColor: const Color(0xE6FFFFFF),
            containerRx: 12,
            activeRx: 8,
            onChanged: (v) => setState(() => _tokens = int.parse(v)),
          ),
        ),
        const SizedBox(height: 24),

        // ── Turn Timer ────────────────────────────────────────────
        _TurnTimerSection(
          value: _timer,
          onChanged: (v) => setState(() => _timer = v),
        ),
      ],
    );
  }

  Future<void> _startGame() async {
    HapticFeedback.heavyImpact();
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LudoGameScreen(tokenCount: _tokens),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  DRÁFÙ GAME SET-UP
//  Sections: Turn Timer only
// ════════════════════════════════════════════════════════════════

class DrafuSetupScreen extends StatefulWidget {
  const DrafuSetupScreen({super.key});
  @override
  State<DrafuSetupScreen> createState() => _DrafuSetupScreenState();
}

class _DrafuSetupScreenState extends State<DrafuSetupScreen> {
  double _timer = 2.0;

  @override
  Widget build(BuildContext context) {
    return _SetupBase(
      title: 'Dráfù Game Set-up',
      backUrl: _kDrafuBack,
      lbIconUrl: _kDrafuLbIcon,
      boltUrl: _kDrafuBolt,
      logoUrl: _kDrafuLogo,
      lbPosition: '2,625',
      entryFee: '\$70.00',
      onStart: _startGame,
      topGap: 40, // Figma: gap=40 between header and sections
      sections: [
        _TurnTimerSection(
          value: _timer,
          onChanged: (v) => setState(() => _timer = v),
        ),
      ],
    );
  }

  Future<void> _startGame() async {
    HapticFeedback.heavyImpact();
    final roomId = 'match_room_${DateTime.now().millisecondsSinceEpoch}';
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DraughtsGameScreen(
          roomId: roomId,
          playerId: 'player_main',
          opponentName: 'Challenger',
          prizePool: '\$70.00',
          onBack: () => Navigator.pop(context),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  AYÒ GAME SET-UP
//  Sections: Turn Timer only
// ════════════════════════════════════════════════════════════════

class AyoSetupScreen extends StatefulWidget {
  const AyoSetupScreen({super.key});
  @override
  State<AyoSetupScreen> createState() => _AyoSetupScreenState();
}

class _AyoSetupScreenState extends State<AyoSetupScreen> {
  double _timer = 2.0;

  @override
  Widget build(BuildContext context) {
    return _SetupBase(
      title: 'Ayò Ọ̀pọ́n Game Set-up',
      backUrl: _kAyoBack,
      lbIconUrl: _kAyoLbIcon,
      boltUrl: _kAyoBolt,
      logoUrl: _kAyoLogo,
      lbPosition: '1,525',
      entryFee: '\$70.00',
      onStart: _startGame,
      topGap: 40,
      sections: [
        _TurnTimerSection(
          value: _timer,
          onChanged: (v) => setState(() => _timer = v),
        ),
      ],
    );
  }

  Future<void> _startGame() async {
    HapticFeedback.heavyImpact();
    final roomId = 'match_room_${DateTime.now().millisecondsSinceEpoch}';
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AyoGameScreen(
          roomId: roomId,
          playerId: 'player_main',
          opponentName: 'Challenger',
          prizePool: '\$70.00',
          onBack: () => Navigator.pop(context),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  WHOT GAME SET-UP — Most complex
//  Sections: Players (2/3/4/5) + Play Options toggle
//            + Starting Cards slider (4-8)
//            + Turn Timer
//            + Special Cards (6 rules, Null/Remove toggles)
// ════════════════════════════════════════════════════════════════

class WhotSetupScreen extends StatefulWidget {
  const WhotSetupScreen({super.key});
  @override
  State<WhotSetupScreen> createState() => _WhotSetupScreenState();
}

class _WhotSetupScreenState extends State<WhotSetupScreen> {
  int    _players       = 3;       // 2/3/4/5 — default 3 (active in Figma)
  bool   _continuous    = true;    // Continuous | Finish and count
  double _startCards    = 6.0;     // 4-8 — default 6
  double _timer         = 2.0;

  // Special cards: {label, cardNumber, color, nulled, removed}
  // node 2138:1632 — 6 cards
  final List<Map<String, dynamic>> _specials = [
    {'label': 'Hold On',          'num': '1',  'orange': false, 'nulled': false, 'removed': false},
    {'label': 'Pick Two',         'num': '2',  'orange': false, 'nulled': false, 'removed': false},
    {'label': 'Pick Three',       'num': '5',  'orange': false, 'nulled': false, 'removed': false},
    {'label': 'Suspension',       'num': '8',  'orange': false, 'nulled': false, 'removed': false},
    {'label': 'General Market',   'num': '14', 'orange': false, 'nulled': false, 'removed': false},
    {'label': 'Whot (Call Any)',   'num': '20', 'orange': true,  'nulled': false, 'removed': false},
  ];

  @override
  Widget build(BuildContext context) {
    return _SetupBase(
      title: 'Wọ́t Game Set-up',
      backUrl: _kWhotBack,
      lbIconUrl: _kWhotLbIcon,
      boltUrl: _kWhotBolt,
      logoUrl: _kWhotLogo,
      lbPosition: '1,425',
      entryFee: '\$30.00',
      onStart: _startGame,
      sections: [
        // ── Players Selection ─────────────────────────────────────
        // node 1863:1300 — icon 18.333×13.333
        // Players toggle: h=48 bg rgba(30,41,59,0.5) border #334155 rx=8 p=7
        // active bg #22D1EE rx=6 | options: 2/3/4/5
        _SectionContainer(
          iconUrl: _kWhotPlayers,
          iconW: 18.333, iconH: 13.333,
          title: 'Players Selection',
          titleSize: 16,
          child: _SegmentedPicker(
            options: const ['2', '3', '4', '5'],
            selected: _players.toString(),
            activeColor: const Color(0xFF22D1EE),
            activeTextColor: const Color(0xFF0B0E1A),
            inactiveTextColor: const Color(0x99FFFFFF),
            containerRx: 8,
            activeRx: 6,
            inactiveFw: FontWeight.w600,
            onChanged: (v) => setState(() => _players = int.parse(v)),
          ),
        ),
        const SizedBox(height: 24),

        // ── Play Options ──────────────────────────────────────────
        // node 1881:1067 — label fs=16 fw=700 ls=-0.24
        // toggle: h=48 bg rgba(34,209,238,0.05) border rgba(34,209,238,0.1) rx=12 p=5
        // active bg #22D1EE rx=8 text #0B0E1A fs=14 fw=600
        // inactive transparent text rgba(255,255,255,0.5)
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Play Options',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.24,
                    height: 20 / 16)),
            const SizedBox(height: 8),
            Container(
              height: 48,
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: const Color(0x0D22D1EE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1A22D1EE)),
              ),
              child: Row(
                children: [
                  _playOption('Continuous', _continuous, () => setState(() => _continuous = true)),
                  const SizedBox(width: 8),
                  _playOption('Finish and count', !_continuous, () => setState(() => _continuous = false)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // ── Starting Cards ────────────────────────────────────────
        // node 1863:1319 — icon 16.699×15.889
        // label: "Cards per player" + cyan value "6"
        // slider 4-8 ticks: 4/5/6/7/8
        _SectionContainer(
          iconUrl: _kWhotCards,
          iconW: 16.699, iconH: 15.889,
          title: 'Starting Cards',
          titleSize: 16,
          child: Column(
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Cards per player',
                        style: TextStyle(
                            color: Color(0x99FFFFFF),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            height: 16 / 12)),
                  ),
                  Text(_startCards.round().toString(),
                      style: const TextStyle(
                          color: Color(0xFF22D1EE),
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          height: 26 / 16)),
                ],
              ),
              _SliderTrack(
                value: _startCards,
                min: 4, max: 8,
                // w=171 at value=6 out of full 342 = 50%
                onChanged: (v) => setState(() => _startCards = v.roundToDouble()),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: ['4', '5', '6', '7', '8'].map((l) =>
                  Text(l,
                      style: const TextStyle(
                          color: Color(0x80FFFFFF),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          height: 15 / 10)),
                ).toList(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Turn Timer ────────────────────────────────────────────
        _TurnTimerSection(
          value: _timer,
          onChanged: (v) => setState(() => _timer = v),
        ),
        const SizedBox(height: 56), // Figma gap=56 before special cards

        // ── Special Cards ─────────────────────────────────────────
        // node 2138:1624 — star icon 16.667×15.833
        // Header: "Special Cards" + "Null  Remove" right labels
        // Rows: h=58 bg rgba(30,41,59,0.3) border rgba(51,65,85,0.5) rx=12 pl=13 pr=15 py=13
        Column(
          children: [
            Row(
              children: [
                SizedBox(
                  width: 16.667,
                  height: 15.833,
                  child: CachedNetworkImage(
                    imageUrl: _kWhotStar,
                    fit: BoxFit.contain,
                    errorWidget: (_, __, ___) => const Icon(
                        Icons.star_outline_rounded,
                        color: Color(0xFFFF5E00), size: 16),
                  ),
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Special Cards',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          height: 20 / 16)),
                ),
                const Text('Null',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        height: 20 / 16)),
                const SizedBox(width: 12),
                const Text('Remove',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        height: 20 / 16)),
              ],
            ),
            const SizedBox(height: 8),
            Column(
              children: _specials.asMap().entries.map((e) {
                final i = e.key;
                final s = e.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _SpecialCardRow(
                    cardNum: s['num'] as String,
                    label: s['label'] as String,
                    isOrange: s['orange'] as bool,
                    nulled: s['nulled'] as bool,
                    removed: s['removed'] as bool,
                    onNullToggle: () => setState(() => _specials[i]['nulled'] = !s['nulled']),
                    onRemoveToggle: () => setState(() => _specials[i]['removed'] = !s['removed']),
                    checkUrl: _kWhotCheck,
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _playOption(String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          height: double.infinity,
          decoration: BoxDecoration(
            color: active ? const Color(0xFF22D1EE) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(label,
              style: TextStyle(
                  color: active
                      ? const Color(0xFF0B0E1A)
                      : const Color(0x80FFFFFF),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  height: 20 / 14)),
        ),
      ),
    );
  }

  Future<void> _startGame() async {
    HapticFeedback.heavyImpact();
    final uid  = FirebaseAuth.instance.currentUser?.uid  ?? 'player_main';
    final name = FirebaseAuth.instance.currentUser?.displayName ?? 'Player';
    final roomId = 'match_room_${DateTime.now().millisecondsSinceEpoch}';
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => WhotGameScreen(
          roomId:        roomId,
          playerId:      uid,
          playerName:    name,
          opponentName:  'Challenger',
          prizePool:     '\$30.00',
          socketService: GamearnSocketService(), // real socket — not _DummySocket
          onBack: () => Navigator.pop(context),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  SHARED: _SetupBase
//  Handles AppBar + scrollable content + stats card + START button
// ════════════════════════════════════════════════════════════════

class _SetupBase extends StatelessWidget {
  final String title;
  final String backUrl;
  final String lbIconUrl;
  final String boltUrl;
  final String logoUrl;
  final String lbPosition;
  final String entryFee;
  final Future<void> Function() onStart;
  final List<Widget> sections;
  final double topGap; // gap after header before sections

  const _SetupBase({
    required this.title,
    required this.backUrl,
    required this.lbIconUrl,
    required this.boltUrl,
    required this.logoUrl,
    required this.lbPosition,
    required this.entryFee,
    required this.onStart,
    required this.sections,
    this.topGap = 24,
  });

  @override
  Widget build(BuildContext context) {
    final safeTop = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      body: Column(
        children: [
          // ── AppBar — pt=40 pb=16 px=24 blur bg border-b ──────────
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(24, safeTop + 16, 24, 16),
            decoration: const BoxDecoration(
              color: Color(0xE60B0E1A),
              border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF))),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text(title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Color(0xFFF1F5F9),
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.27,
                        height: 22.5 / 18)),
                Positioned(
                  left: 0,
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    behavior: HitTestBehavior.opaque,
                    child: SizedBox(
                      width: 16, height: 25,
                      child: CachedNetworkImage(
                        imageUrl: backUrl,
                        fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const Icon(
                            Icons.arrow_back_ios_new_rounded,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),

                  // ── Header ────────────────────────────────────────
                  // node 1848:6230 — gap=4
                  const Text('Game Setup',
                      style: TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          height: 25 / 20)),
                  const SizedBox(height: 4),
                  const Text('Configure your match settings',
                      style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          height: 16 / 12)),
                  SizedBox(height: topGap),

                  // ── Game-specific sections ─────────────────────────
                  ...sections,
                  const SizedBox(height: 40),

                  // ── Stats Card ─────────────────────────────────────
                  // bg rgba(34,209,238,0.05) border rgba(34,209,238,0.2) rx=12 p=17
                  _StatsCard(
                    lbIconUrl: lbIconUrl,
                    lbPosition: lbPosition,
                    entryFee: entryFee,
                  ),
                  const SizedBox(height: 16),

                  // ── START GAME button ──────────────────────────────
                  // bg #FF5E00 rx=12 py=16 shadow 0,8,16,-12 #FF5E00
                  _StartButton(boltUrl: boltUrl, onStart: onStart),
                  const SizedBox(height: 16),

                  // ── Terms text ─────────────────────────────────────
                  // node 1850:6312 — #64748B fs=10 fw=400 center lh=13.5
                  const Text(
                    'By starting, you agree to the Game Rules and Terms of Service.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 10,
                        fontWeight: FontWeight.w400,
                        height: 13.5 / 10),
                  ),
                  const SizedBox(height: 16),

                  // ── Logo footer ────────────────────────────────────
                  // node 1852:1010 — 83.18×24.777
                  Center(
                    child: SizedBox(
                      width: 83.18, height: 24.777,
                      child: CachedNetworkImage(
                        imageUrl: logoUrl,
                        fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const Text('GAMEARN',
                            style: TextStyle(
                                color: Color(0xFF22D1EE),
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
//  SHARED WIDGETS
// ════════════════════════════════════════════════════════════════

// ── Section container with icon + title ──────────────────────────
class _SectionContainer extends StatelessWidget {
  final String iconUrl;
  final double iconW, iconH;
  final String title;
  final double titleSize;
  final Widget child;

  const _SectionContainer({
    required this.iconUrl,
    required this.iconW,
    required this.iconH,
    required this.title,
    this.titleSize = 18,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            SizedBox(
              width: iconW, height: iconH,
              child: CachedNetworkImage(
                imageUrl: iconUrl,
                fit: BoxFit.contain,
                errorWidget: (_, __, ___) => const Icon(
                    Icons.settings, color: Color(0xFF22D1EE), size: 16),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(title,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: titleSize,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.27,
                      height: 22.5 / titleSize)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }
}

// ── Segmented picker (shared by Players + Token Count + Whot Players) ─
class _SegmentedPicker extends StatelessWidget {
  final List<String> options;
  final String selected;
  final Color activeColor;
  final Color activeTextColor;
  final Color inactiveTextColor;
  final double containerRx;
  final double activeRx;
  final FontWeight inactiveFw;
  final ValueChanged<String> onChanged;

  const _SegmentedPicker({
    required this.options,
    required this.selected,
    required this.activeColor,
    required this.activeTextColor,
    this.inactiveTextColor = Colors.white,
    required this.containerRx,
    required this.activeRx,
    this.inactiveFw = FontWeight.w400,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0x801E293B),
        borderRadius: BorderRadius.circular(containerRx),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        children: options.map((opt) {
          final active = opt == selected;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(opt),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                height: double.infinity,
                decoration: BoxDecoration(
                  color: active ? activeColor : Colors.transparent,
                  borderRadius: BorderRadius.circular(active ? activeRx : containerRx),
                ),
                alignment: Alignment.center,
                child: Text(opt,
                    style: TextStyle(
                        color: active ? activeTextColor : inactiveTextColor,
                        fontSize: 16,
                        fontWeight: active ? FontWeight.w400 : inactiveFw,
                        height: 26 / 16)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Turn Timer slider ─────────────────────────────────────────────
// node 1877:1028/1877:1012 — same across all screens
// track: h=8 bg #334155 rx=9999 | fill: #22D1EE shadow 0,0,10 rgba(43,108,238,0.5)
// thumb: 24×24 bg #22D1EE border-4 #101622 rx=9999
// slider range: 0.5 (30s) → 3.0 (3m) — Figma shows 2m selected (w=223/342≈65%)

class _TurnTimerSection extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;

  const _TurnTimerSection({required this.value, required this.onChanged});

  String get _label {
    if (value <= 0.5) return '30s';
    if (value <= 1.0) return '1 min';
    if (value <= 2.0) return '2 min';
    return '3 min';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label row — "Turn Timer" rgba(255,255,255,0.6) + cyan value right
        Row(
          children: [
            Expanded(
              child: Text('Turn Timer',
                  style: const TextStyle(
                      color: Color(0x99FFFFFF),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.27,
                      height: 22.5 / 18)),
            ),
            Text(_label,
                style: const TextStyle(
                    color: Color(0xFF22D1EE),
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 26 / 16)),
          ],
        ),
        const SizedBox(height: 8),
        _SliderTrack(
          value: value,
          min: 0.5, max: 3.0,
          onChanged: onChanged,
        ),
        // Tick labels
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('30s', style: _tickStyle),
            Text('1m',  style: _tickStyle),
            Text('2m',  style: _tickStyle),
            Text('3m',  style: _tickStyle),
          ],
        ),
      ],
    );
  }

  static const _tickStyle = TextStyle(
      color: Color(0x80FFFFFF),
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 16 / 12);
}

// ── Custom slider track (pixel-perfect) ──────────────────────────
// track: h=8 bg #334155 | fill: #22D1EE glow | thumb: 24×24 border-4 #101622

class _SliderTrack extends StatelessWidget {
  final double value, min, max;
  final ValueChanged<double> onChanged;

  const _SliderTrack({
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SliderTheme(
      data: SliderTheme.of(context).copyWith(
        trackHeight: 8,
        activeTrackColor: const Color(0xFF22D1EE),
        inactiveTrackColor: const Color(0xFF334155),
        thumbColor: const Color(0xFF22D1EE),
        thumbShape: _CyanThumbShape(),
        overlayShape: SliderComponentShape.noOverlay,
        trackShape: const RoundedRectSliderTrackShape(),
      ),
      child: Slider(
        value: value.clamp(min, max),
        min: min,
        max: max,
        onChanged: onChanged,
      ),
    );
  }
}

class _CyanThumbShape extends SliderComponentShape {
  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) => const Size(24, 24);

  @override
  void paint(PaintingContext context, Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) {
    final canvas = context.canvas;
    // Border circle #101622
    canvas.drawCircle(
        center, 12,
        Paint()..color = const Color(0xFF101622));
    // Inner fill #22D1EE (border = 4px so inner r = 8)
    canvas.drawCircle(
        center, 8,
        Paint()..color = const Color(0xFF22D1EE));
  }
}

// ── Stats card ────────────────────────────────────────────────────
// bg rgba(34,209,238,0.05) border rgba(34,209,238,0.2) rx=12 p=17
// Left: "LEADERBOARD POSITION" + icon 12×12 + cyan score
// Right: "ENTRY FEE" + white price

class _StatsCard extends StatelessWidget {
  final String lbIconUrl;
  final String lbPosition;
  final String entryFee;

  const _StatsCard({
    required this.lbIconUrl,
    required this.lbPosition,
    required this.entryFee,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: const Color(0x0D22D1EE),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x3322D1EE)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('LEADERBOARD POSITION',
                    style: TextStyle(
                        color: Color(0x80FFFFFF),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        height: 16 / 12)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    SizedBox(
                      width: 12, height: 12,
                      child: CachedNetworkImage(
                        imageUrl: lbIconUrl,
                        fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const Icon(
                            Icons.emoji_events_outlined,
                            color: Color(0xFF22D1EE), size: 12),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(lbPosition,
                        style: const TextStyle(
                            color: Color(0xFF22D1EE),
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.27,
                            height: 22.5 / 18)),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('ENTRY FEE',
                  style: TextStyle(
                      color: Color(0x80FFFFFF),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      height: 16 / 12)),
              const SizedBox(height: 0.5),
              Text(entryFee,
                  style: const TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      height: 28 / 18)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Start Game button ─────────────────────────────────────────────
// bg #FF5E00 rx=12 py=16 shadow 0,8,16,-12 #FF5E00
// bolt icon 11×14 | "START GAME" fw=700 fs=18 lh=28

class _StartButton extends StatefulWidget {
  final String boltUrl;
  final Future<void> Function() onStart;
  const _StartButton({required this.boltUrl, required this.onStart});
  @override
  State<_StartButton> createState() => _StartButtonState();
}

class _StartButtonState extends State<_StartButton> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _loading ? null : () async {
        setState(() => _loading = true);
        try { await widget.onStart(); }
        finally { if (mounted) setState(() => _loading = false); }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFF5E00),
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(color: Color(0xFFFF5E00), blurRadius: 16, offset: Offset(0, 8), spreadRadius: -12),
          ],
        ),
        child: _loading
            ? const Center(child: SizedBox(width: 20, height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('START GAME',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          height: 28 / 18)),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 11, height: 14,
                    child: CachedNetworkImage(
                      imageUrl: widget.boltUrl,
                      fit: BoxFit.contain,
                      errorWidget: (_, __, ___) => const Icon(
                          Icons.bolt_rounded, color: Colors.white, size: 14),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Special card row (Whot only) ──────────────────────────────────
// h=58 bg rgba(30,41,59,0.3) border rgba(51,65,85,0.5) rx=12 pl=13 pr=15 py=13
// Card badge: 32×32 rx=8 bg rgba(34,209,238,0.2) | orange card: rgba(255,94,0,0.2)
// Right: Null radio (circle) + Remove checkbox (square)

class _SpecialCardRow extends StatelessWidget {
  final String cardNum, label;
  final bool isOrange, nulled, removed;
  final VoidCallback onNullToggle, onRemoveToggle;
  final String checkUrl;

  const _SpecialCardRow({
    required this.cardNum,
    required this.label,
    required this.isOrange,
    required this.nulled,
    required this.removed,
    required this.onNullToggle,
    required this.onRemoveToggle,
    required this.checkUrl,
  });

  @override
  Widget build(BuildContext context) {
    final badgeBg   = isOrange ? const Color(0x33FF5E00) : const Color(0x3322D1EE);
    final badgeText = isOrange ? const Color(0xFFFF5E00) : const Color(0xFF22D1EE);

    return Container(
      height: 58,
      padding: const EdgeInsets.fromLTRB(13, 13, 15, 13),
      decoration: BoxDecoration(
        color: const Color(0x4D1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x80334155)),
      ),
      child: Row(
        children: [
          // Card number badge — 32×32 rx=8
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
                color: badgeBg, borderRadius: BorderRadius.circular(8)),
            alignment: Alignment.center,
            child: Text(cardNum,
                style: TextStyle(
                    color: badgeText,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 24 / 16)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    height: 16 / 12)),
          ),
          // Null — circle radio (24×24)
          // Active: bg #22D1EE glow + check icon
          // Inactive: border-2 rgba(255,255,255,0.35) circle
          GestureDetector(
            onTap: onNullToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              width: 24, height: 24,
              decoration: BoxDecoration(
                color: nulled ? const Color(0xFF22D1EE) : Colors.transparent,
                shape: BoxShape.circle,
                border: nulled ? null
                    : Border.all(color: const Color(0x59FFFFFF), width: 2),
                boxShadow: nulled
                    ? const [BoxShadow(
                        color: Color(0x8022D1EE), blurRadius: 5)]
                    : [],
              ),
              alignment: Alignment.center,
              child: nulled
                  ? SizedBox(
                      width: 10.442, height: 7.963,
                      child: CachedNetworkImage(
                        imageUrl: checkUrl, fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const Icon(
                            Icons.check, color: Color(0xFF0B0E1A), size: 10),
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(width: 31),
          // Remove — square checkbox (24×24)
          // Active: bg #22D1EE + check | Inactive: border #0B0E1A bg #0B0E1A rx=4
          GestureDetector(
            onTap: onRemoveToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              width: 24, height: 24,
              decoration: BoxDecoration(
                color: removed ? const Color(0xFF22D1EE) : const Color(0xFF0B0E1A),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: removed
                      ? const Color(0xFF22D1EE)
                      : const Color(0x80FFFFFF),
                ),
              ),
              alignment: Alignment.center,
              child: removed
                  ? SizedBox(
                      width: 10.442, height: 7.963,
                      child: CachedNetworkImage(
                        imageUrl: checkUrl, fit: BoxFit.contain,
                        errorWidget: (_, __, ___) => const Icon(
                            Icons.check, color: Color(0xFF0B0E1A), size: 10),
                      ),
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────

int _timerSeconds(double v) {
  if (v <= 0.5) return 30;
  if (v <= 1.0) return 60;
  if (v <= 2.0) return 120;
  return 180;
}
