import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  CREATE TOURNAMENT SCREEN — Pixel-perfect Figma match
//  Node: 1585:6298
//
//  AppBar: pt=40 pb=16 px=24 | blur bg #0B0E1A90 | border-b #FFFFFF4D
//  Content: left=24 right=24 top=103
//  All asset URLs below are 7-day CDN links from Figma MCP.
// ════════════════════════════════════════════════════════════════

// ── Figma asset URLs ─────────────────────────────────────────────
const _kChevronDown =
    'https://www.figma.com/api/mcp/asset/da0cbe37-3148-42fa-97e2-04860a2031c2';
const _kIconTrophy =
    'https://www.figma.com/api/mcp/asset/427a0f9b-cd89-4ad0-a2a8-0629a8ee82eb';
const _kIconBarChart =
    'https://www.figma.com/api/mcp/asset/7da9c739-d1ab-4d19-b201-b46ed9504f29';
const _kIconWallet =
    'https://www.figma.com/api/mcp/asset/49a9966f-c161-4bb9-b8b8-88b727f3fdd2';
const _kIconArrowRight =
    'https://www.figma.com/api/mcp/asset/9a641e3a-1966-4eeb-a384-de9e358864f5';
const _kIconBack =
    'https://www.figma.com/api/mcp/asset/75c706da-ee4e-4db1-94be-0699c8c668e7';

class CreateTournamentScreen extends StatefulWidget {
  const CreateTournamentScreen({super.key});

  @override
  State<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends State<CreateTournamentScreen> {
  final _nameCtrl       = TextEditingController();
  final _maxPlayersCtrl = TextEditingController();
  final _winnersCtrl    = TextEditingController();

  String? _selectedGame;
  int _durationIdx = 1; // default: 7 Days
  int _typeIdx     = 0; // default: Win Tournament
  bool _saving     = false;

  static const _games = [
    {'key': 'whot',     'label': 'WHOT'},
    {'key': 'ludo',     'label': 'Lúdò'},
    {'key': 'ayo',      'label': 'Ayò'},
    {'key': 'draughts', 'label': 'Dráfù'},
  ];

  // Figma node 2222:1454 — exact values
  static const _durations = [
    {'value': '24', 'label': 'HOURS', 'key': '24h'},
    {'value': '7',  'label': 'DAYS',  'key': '7d'},
    {'value': '2',  'label': 'WEEKS', 'key': '2w'},
    {'value': '1',  'label': 'MONTH', 'key': '1m'},
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _maxPlayersCtrl.dispose();
    _winnersCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty || _selectedGame == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Fill in tournament name and select a game.')),
      );
      return;
    }
    HapticFeedback.mediumImpact();
    setState(() => _saving = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
      await FirebaseFirestore.instance.collection('tournaments').add({
        'title':          name,
        'gameType':       _selectedGame,
        'duration':       _durations[_durationIdx]['key'],
        'tournamentType': _typeIdx == 0 ? 'win' : 'plays',
        'maxPlayers':     int.tryParse(_maxPlayersCtrl.text) ?? 32,
        'topWinners':     int.tryParse(_winnersCtrl.text) ?? 3,
        'entryCost':      500,
        'creationFee':    200,
        'prizePool':      '0',
        'status':         'pending',
        'players':        [uid],
        'createdBy':      uid,
        'createdAt':      FieldValue.serverTimestamp(),
      });
      if (mounted) {
        HapticFeedback.heavyImpact();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tournament created! Waiting for players to join.'),
            backgroundColor: Color(0xFF22D1EE),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: context.bg,
      body: Column(
        children: [
          // ── AppBar — Figma: pt=40 pb=16 px=24, blur bg, border-b ──
          _buildAppBar(top),
          Expanded(
            child: SingleChildScrollView(
              // content starts at 103px from top = appbar height
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  // ── Header ─────────────────────────────────────
                  // Node 1631:849
                  const Text('Tournament Info',
                      style: TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          height: 25 / 20)),
                  const SizedBox(height: 5),
                  Text('Basic Info & Game Selection',
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                          height: 26 / 16)),
                  const SizedBox(height: 24),

                  // ── Fields group — gap=16 ───────────────────────
                  // Node 1624:825 Tournament Name
                  _fieldLabel('Tournament Name'),
                  const SizedBox(height: 8),
                  _inputBox(
                      ctrl: _nameCtrl,
                      hint: 'e.g. Draft Grandmaster Championship'),
                  const SizedBox(height: 16),

                  // Node 1624:832 Select Game
                  _fieldLabel('Select Game'),
                  const SizedBox(height: 8),
                  _gameDropdown(),
                  const SizedBox(height: 16),

                  // Node 2222:1452 Duration
                  // SemiBold label
                  const Text('Duration',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          height: 26 / 16)),
                  const SizedBox(height: 8),
                  _durationPills(),
                  const SizedBox(height: 16),

                  // Node 1631:851 Tournament Type
                  _fieldLabel('Tournament Type'), // Medium weight
                  const SizedBox(height: 12),
                  _typeToggle(),
                  const SizedBox(height: 16),

                  // Node 2230:1462
                  _fieldLabel('Number of Players (Max)'),
                  const SizedBox(height: 8),
                  _inputBox(
                      ctrl: _maxPlayersCtrl,
                      hint: 'e.g. 30, 50, 100...',
                      type: TextInputType.number),
                  const SizedBox(height: 16),

                  // Node 2230:1467
                  _fieldLabel('Number of winners (Top)'),
                  const SizedBox(height: 8),
                  _inputBox(
                      ctrl: _winnersCtrl,
                      hint: 'e.g. Top 3, Top 5, Top 10...',
                      type: TextInputType.number),
                  const SizedBox(height: 16),

                  // Node 2227:1475 Entry Fee
                  _entryFeeCard(),
                  const SizedBox(height: 16),

                  // Node 1686:825 Creation Fee
                  _creationFeeRow(),
                  const SizedBox(height: 32),

                  // Node 1657:832 Next Step
                  _nextButton(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── AppBar ─────────────────────────────────────────────────────
  Widget _buildAppBar(double safeTop) {
    return Container(
      padding: EdgeInsets.fromLTRB(24, safeTop + 16, 24, 16),
      decoration: const BoxDecoration(
        color: Color(0xE60B0E1A), // ~90% opacity
        border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF))),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Title
          const Text('Create Tournament',
              style: TextStyle(
                  color: Color(0xFFF1F5F9),
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.27,
                  height: 22.5 / 18)),
          // Back button — Figma 16×25 px
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

  // ── Helpers ────────────────────────────────────────────────────

  Widget _fieldLabel(String text) => Text(text,
      style: const TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w500,
          height: 24 / 16));

  // Node 1624:828 — bg rgba(30,41,59,0.5) border #1E293B rx=12 p=17
  Widget _inputBox({
    required TextEditingController ctrl,
    required String hint,
    TextInputType type = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x801E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: type,
        style: const TextStyle(
            color: Colors.white, fontSize: 16, fontWeight: FontWeight.w400),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
              color: Color(0x4DFFFFFF),
              fontSize: 16,
              fontWeight: FontWeight.w400,
              height: 26 / 16),
          contentPadding: const EdgeInsets.all(17),
          border: InputBorder.none,
        ),
      ),
    );
  }

  // Node 1624:836 — same styling as input, chevron right
  Widget _gameDropdown() {
    return Stack(
      alignment: Alignment.centerRight,
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0x801E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedGame,
              isExpanded: true,
              dropdownColor: context.card,
              // hide the default icon — we use custom asset
              icon: const SizedBox.shrink(),
              padding: const EdgeInsets.fromLTRB(17, 0, 44, 0),
              hint: const Text('Choose a game',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      height: 24 / 16)),
              style: const TextStyle(
                  color: Colors.white, fontSize: 16, fontWeight: FontWeight.w400),
              items: _games
                  .map((g) => DropdownMenuItem<String>(
                        value: g['key'],
                        child: Text(g['label']!),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _selectedGame = v),
            ),
          ),
        ),
        // Figma chevron 12×7.4px at right=16
        Positioned(
          right: 16,
          child: SizedBox(
            width: 12,
            height: 7.4,
            child: CachedNetworkImage(
              imageUrl: _kChevronDown,
              fit: BoxFit.contain,
              errorWidget: (_, __, ___) =>
                  const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  // Node 2222:1454 — 4 pills h=80 gap=8 rx=12
  Widget _durationPills() {
    return Row(
      children: List.generate(_durations.length, (i) {
        final active = i == _durationIdx;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _durationIdx = i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              height: 80,
              margin:
                  EdgeInsets.only(right: i < _durations.length - 1 ? 8 : 0),
              decoration: BoxDecoration(
                // Node: #16223F base
                color: const Color(0xFF16223F),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: active
                      ? const Color(0xFF00F2FF)  // active: #00F2FF w=2
                      : const Color(0xFF1E2E56), // inactive: #1E2E56 w=1
                  width: active ? 2 : 1,
                ),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: const Color(0xFF00F2FF).withOpacity(0.3),
                          blurRadius: 7.5,
                          spreadRadius: 0,
                        )
                      ]
                    : [],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _durations[i]['value']!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: active
                          ? const Color(0xFF00F2FF)
                          : const Color(0xFFF1F5F9),
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 25 / 20,
                    ),
                  ),
                  Text(
                    _durations[i]['label']!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: active
                          ? const Color(0xFF00F2FF)
                          : context.txtSec,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: active ? -0.5 : 0,
                      height: 15 / 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  // Node 1631:854 — bg rgba(30,41,59,0.8) rx=12 p=4 gap=12
  Widget _typeToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xCC1E293B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // Active: Node 1631:855 — bg #22D1EE rx=12 px=24 py=16
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _typeIdx = 0),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                decoration: BoxDecoration(
                  color: _typeIdx == 0
                      ? const Color(0xFF22D1EE)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Trophy icon — 18×18
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CachedNetworkImage(
                        imageUrl: _kIconTrophy,
                        fit: BoxFit.contain,
                        color: _typeIdx == 0 ? const Color(0xFF0B0E1A) : null,
                        colorBlendMode: _typeIdx == 0 ? BlendMode.srcIn : null,
                        errorWidget: (_, __, ___) => Icon(
                            Icons.emoji_events_outlined,
                            size: 18,
                            color: _typeIdx == 0
                                ? const Color(0xFF0B0E1A)
                                : Colors.white38),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('Win Tournament',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: _typeIdx == 0
                                ? const Color(0xFF0B0E1A)
                                : const Color(0x80FFFFFF),
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            height: 20 / 14)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Inactive: Node 1631:861 — transparent rx=16 px=24 py=16
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _typeIdx = 1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                decoration: BoxDecoration(
                  color: _typeIdx == 1
                      ? const Color(0xFF22D1EE)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CachedNetworkImage(
                        imageUrl: _kIconBarChart,
                        fit: BoxFit.contain,
                        color: _typeIdx == 1 ? const Color(0xFF0B0E1A) : null,
                        colorBlendMode: _typeIdx == 1 ? BlendMode.srcIn : null,
                        errorWidget: (_, __, ___) => Icon(
                            Icons.bar_chart_rounded,
                            size: 18,
                            color: _typeIdx == 1
                                ? const Color(0xFF0B0E1A)
                                : Colors.white38),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('Number of Plays',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: _typeIdx == 1
                                ? const Color(0xFF0B0E1A)
                                : const Color(0x80FFFFFF),
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            height: 20 / 14)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Node 2227:1475 — bg rgba(29,41,70,0.4) border rgba(30,41,59,0.5) rx=12 p=25
  Widget _entryFeeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: const Color(0x661D2946),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x801E293B)),
      ),
      child: Column(
        children: [
          // ENTRY FEE — #94A3B8 fs=12 fw=700 ls=2.4 uppercase
          Text('ENTRY FEE',
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2.4,
                  height: 16 / 12)),
          // ₦500.00 — inline baseline row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: const [
              Text('₦',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      height: 25 / 20)),
              Text('500',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 48,
                      fontWeight: FontWeight.w700,
                      height: 60 / 48)),
              Text('.00',
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

  // Node 1686:825 — gradient L→R rgba(34,209,238,0.2)→transparent
  //   border rgba(34,209,238,0.2) rx=12 p=21
  //   Circle 48×48 bg #22D1EE shadow 0,10,15,-3 rgba(0,242,255,0.4)
  Widget _creationFeeRow() {
    return Container(
      padding: const EdgeInsets.all(21),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0x3322D1EE), Color(0x0022D1EE)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x3322D1EE)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // "Creation Fee" — rgba(255,255,255,0.5) fs=12 fw=700 uppercase
              const Text('Creation Fee',
                  style: TextStyle(
                      color: Color(0x80FFFFFF),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      height: 16 / 12)),
              // "200 /UNITS"
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: const [
                  Text('200',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 2,
                          height: 25 / 20)),
                  SizedBox(width: 2),
                  Text('/UNITS',
                      style: TextStyle(
                          color: Color(0xFF22D1EE),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          height: 20 / 14)),
                ],
              ),
            ],
          ),
          // Circle 48×48 #22D1EE + shadow
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Color(0xFF22D1EE),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0x6600F2FF),
                  blurRadius: 15,
                  offset: Offset(0, 10),
                  spreadRadius: -3,
                ),
                BoxShadow(
                  color: Color(0x6600F2FF),
                  blurRadius: 6,
                  offset: Offset(0, 4),
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Center(
              // Node 1686:833 — wallet icon 23.55×18.3
              child: SizedBox(
                width: 23.55,
                height: 18.3,
                child: CachedNetworkImage(
                  imageUrl: _kIconWallet,
                  fit: BoxFit.contain,
                  errorWidget: (_, __, ___) => const Icon(
                      Icons.account_balance_wallet_outlined,
                      color: Color(0xFF0B0E1A),
                      size: 20),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Node 1657:832 — bg #FF5E00 rx=12 py=16 shadow 2,4,4 rgba(255,94,0,0.32)
  Widget _nextButton() {
    return GestureDetector(
      onTap: _saving ? null : _submit,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFF5E00),
          borderRadius: BorderRadius.circular(12),
          boxShadow: const [
            BoxShadow(
              color: Color(0x52FF5E00),
              blurRadius: 4,
              offset: Offset(2, 4),
            ),
          ],
        ),
        child: _saving
            ? const Center(
                child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2)))
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Next Step',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          height: 26 / 16)),
                  const SizedBox(width: 8),
                  // Arrow right icon — 16×16
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CachedNetworkImage(
                      imageUrl: _kIconArrowRight,
                      fit: BoxFit.contain,
                      errorWidget: (_, __, ___) => const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 16),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
