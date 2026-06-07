import 'package:flutter/material.dart';
import '../../theme.dart';
import 'ludo_game_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAME LOBBY SCREEN — Figma matched
//
//  Layout from all 4 Game Set-up SVGs (390×844):
//   Hero: full-width game image + gradient overlay + back btn
//   Mode row: 342×48 rx=8 #0B0E1A, active chip 79×34 rx=6 #22D1EE
//   Options row: 342×48 rx=8 #0B0E1A, active chip rx=8 #22D1EE
//   Bet row: 342×48 rx=12 #0B0E1A
//   Info card: 342×78 rx=12 #22D1EE
//   Play CTA: 342×60 rx=12 #FF5E00
// ════════════════════════════════════════════════════════════════

class GameLobbyScreen extends StatefulWidget {
  final String gameTitle;
  final Widget gameScreen;
  final String gameKey;

  const GameLobbyScreen({
    super.key,
    required this.gameTitle,
    required this.gameScreen,
    required this.gameKey,
  });

  @override
  State<GameLobbyScreen> createState() => _GameLobbyScreenState();
}

class _GameLobbyScreenState extends State<GameLobbyScreen> {
  bool   _vsComputer   = false;
  int    _selectedPlayers = 2;
  double _stakeAmount  = 1000;
  int    _whotHandSize = 5;
  int    _ludoTokens   = 4;

  static const _playerOptions = [2, 3, 4];
  static const _stakeOptions  = [500.0, 1000.0, 2000.0, 5000.0, 10000.0];
  static const _handOptions   = [4, 5, 6, 7];
  static const _tokenOptions  = [2, 4];

  static const _gameAssets = {
    'whot':     'assets/games/whot.jpg',
    'ludo':     'assets/games/ludo.png',
    'ayo':      'assets/games/ayo.jpg',
    'draughts': 'assets/games/draughts.jpg',
  };

  String get _asset =>
      _gameAssets[widget.gameKey] ?? _gameAssets['whot']!;

  String _fmt(double v) => v >= 1000
      ? '₦${(v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1)}k'
      : '₦${v.toStringAsFixed(0)}';

  @override
  Widget build(BuildContext context) {
    final pot = _vsComputer
        ? 'Practice Mode'
        : _fmt(_stakeAmount * _selectedPlayers);

    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      body: Column(children: [

        // ── HERO IMAGE ───────────────────────────────────────────
        SizedBox(
          height: 220,
          child: Stack(fit: StackFit.expand, children: [
            Image.asset(_asset, fit: BoxFit.cover),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x440B0E1A), Color(0xFF0B0E1A)],
                  stops: [0.2, 1.0],
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(
                        color: Colors.black38,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: Colors.white24),
                      ),
                      child: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white, size: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(widget.gameTitle,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          shadows: [Shadow(blurRadius: 8)])),
                ]),
              ),
            ),
          ]),
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                // ── MODE ROW — Figma: 342×48 rx=8 #0B0E1A ────────
                // active chip 79×34 rx=6 #22D1EE (left-aligned)
                _sectionLabel('Game Mode'),
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B0E1A),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(children: [
                    _modeChip('Vs Player',   !_vsComputer,
                        () => setState(() => _vsComputer = false)),
                    _modeChip('Vs Computer', _vsComputer,
                        () => setState(() => _vsComputer = true)),
                  ]),
                ),

                const SizedBox(height: 16),

                // ── GAME-SPECIFIC OPTIONS ─────────────────────────
                if (widget.gameKey == 'whot') ...[
                  _sectionLabel('Hand Size'),
                  _optionRow(
                    options: _handOptions.map((h) => '$h').toList(),
                    selected: _whotHandSize.toString(),
                    onSelect: (v) =>
                        setState(() => _whotHandSize = int.parse(v)),
                  ),
                  const SizedBox(height: 16),
                ] else if (widget.gameKey == 'ludo') ...[
                  _sectionLabel('Token Count'),
                  _optionRow(
                    options: _tokenOptions
                        .map((t) => '$t Tokens')
                        .toList(),
                    selected: '$_ludoTokens Tokens',
                    onSelect: (v) => setState(() =>
                        _ludoTokens = int.parse(v.split(' ')[0])),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── PLAYERS (vs Player only) ──────────────────────
                if (!_vsComputer) ...[
                  _sectionLabel('Players'),
                  _optionRow(
                    options: _playerOptions
                        .map((p) => '$p')
                        .toList(),
                    selected: '$_selectedPlayers',
                    onSelect: (v) => setState(
                        () => _selectedPlayers = int.parse(v)),
                  ),
                  const SizedBox(height: 16),

                  // ── STAKE ───────────────────────────────────────
                  _sectionLabel('Stake Amount'),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _stakeOptions.map((s) {
                      final active = _stakeAmount == s;
                      return GestureDetector(
                        onTap: () =>
                            setState(() => _stakeAmount = s),
                        child: AnimatedContainer(
                          duration:
                              const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 10),
                          decoration: BoxDecoration(
                            color: active
                                ? kCyan
                                : const Color(0xFF0F172A),
                            borderRadius:
                                BorderRadius.circular(20),
                            border: Border.all(
                              color: active
                                  ? kCyan
                                  : const Color(0xFF334155),
                            ),
                          ),
                          child: Text(_fmt(s),
                              style: TextStyle(
                                  color: active
                                      ? const Color(0xFF0B0E1A)
                                      : Colors.white70,
                                  fontSize: 13,
                                  fontWeight: active
                                      ? FontWeight.w800
                                      : FontWeight.w400)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── INFO CARD — Figma: 342×78 rx=12 #22D1EE ──────
                Container(
                  height: 78,
                  decoration: BoxDecoration(
                    color: kCyan,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20),
                    child: Row(
                      mainAxisAlignment:
                          MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          mainAxisAlignment:
                              MainAxisAlignment.center,
                          children: [
                            const Text('Total Pot',
                                style: TextStyle(
                                    color: Color(0xFF0B0E1A),
                                    fontSize: 12,
                                    fontWeight:
                                        FontWeight.w500)),
                            const SizedBox(height: 4),
                            Text(pot,
                                style: const TextStyle(
                                    color: Color(0xFF0B0E1A),
                                    fontSize: 22,
                                    fontWeight:
                                        FontWeight.w900)),
                          ],
                        ),
                        Container(
                          width: 42, height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white
                                .withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                              Icons.emoji_events_rounded,
                              color: Colors.white,
                              size: 22),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── PLAY CTA — Figma: 342×60 rx=12 #FF5E00 ───────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
          child: GestureDetector(
            onTap: () {
              Widget screen = widget.gameScreen;
              if (widget.gameKey == 'ludo') {
                screen = LudoGameScreen(tokenCount: _ludoTokens);
              }
              Navigator.pushReplacement(context,
                  MaterialPageRoute(builder: (_) => screen));
            },
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                color: kOrange,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                      color: kOrange.withOpacity(0.4),
                      blurRadius: 16, spreadRadius: 0,
                      offset: const Offset(0, 6)),
                ],
              ),
              child: const Center(
                child: Text('Play Now',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5)),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  // ── Mode chip ─────────────────────────────────────────────────
  Widget _modeChip(String label, bool active, VoidCallback onTap) =>
      Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(5),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              // Figma: active chip 79×34 rx=6 #22D1EE
              decoration: BoxDecoration(
                color: active ? kCyan : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: Text(label,
                    style: TextStyle(
                        color: active
                            ? const Color(0xFF0B0E1A)
                            : const Color(0xFF9A9A9A),
                        fontSize: 13,
                        fontWeight: active
                            ? FontWeight.w800
                            : FontWeight.w500)),
              ),
            ),
          ),
        ),
      );

  // ── Option row — Figma: 342×48 rx=8, chips inside ────────────
  Widget _optionRow({
    required List<String> options,
    required String selected,
    required ValueChanged<String> onSelect,
  }) =>
      Container(
        height: 48,
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: const Color(0xFF0B0E1A),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Row(
          children: options.map((o) {
            final active = o == selected;
            return Expanded(
              child: GestureDetector(
                onTap: () => onSelect(o),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  // Figma: active chip rx=8 #22D1EE for options
                  decoration: BoxDecoration(
                    color: active ? kCyan : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Center(
                    child: Text(o,
                        style: TextStyle(
                            color: active
                                ? const Color(0xFF0B0E1A)
                                : const Color(0xFF9A9A9A),
                            fontSize: 12,
                            fontWeight: active
                                ? FontWeight.w800
                                : FontWeight.w500)),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      );

  Widget _sectionLabel(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(t,
        style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.1)),
  );
}
