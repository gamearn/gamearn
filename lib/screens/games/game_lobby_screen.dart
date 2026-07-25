import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';
import 'ludo_game_screen.dart';
import 'ayo_game_screen.dart';
import 'draughts_game_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAME LOBBY SCREEN — Figma matched & Dynamic State Injection
// ════════════════════════════════════════════════════════════════

class GameLobbyScreen extends StatefulWidget {
  final String gameTitle;
  final Widget gameScreen; // Maintained as a fallback option
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
  bool   _vsComputer     = false;
  int    _selectedPlayers = 2;
  double _stakeAmount    = 1000;
  int    _whotHandSize   = 5;
  int    _ludoTokens     = 4;

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

  String get _asset => _gameAssets[widget.gameKey] ?? _gameAssets['whot']!;

  String _fmt(double v) => v >= 1000
      ? '₦${(v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1)}k'
      : '₦${v.toStringAsFixed(0)}';

  @override
  Widget build(BuildContext context) {
    // Math formulation for calculating the live potential prize pool
    final dynamicPotStr = _vsComputer
        ? 'Practice Mode'
        : _fmt(_stakeAmount * _selectedPlayers);

    return Scaffold(
      backgroundColor: context.bg,
      body: Column(children: [

        // ── HERO IMAGE (Figma Match) ───────────────────────────────────────────
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
                        border: Border.all(color: Colors.white24),
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

        // ── SCROLLABLE OPTIONS AREA ─────────────────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                // ── GAME MODE ROW (Figma: 342×48 rx=8 #0B0E1A) ──────────────────
                _sectionLabel('Game Mode'),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: context.border),
                    ),
                  child: Row(children: [
                    _modeChip('Vs Player', !_vsComputer,
                        () => setState(() => _vsComputer = false)),
                    _modeChip('Vs Computer', _vsComputer,
                        () => setState(() => _vsComputer = true)),
                  ]),
                ),

                const SizedBox(height: 16),

                // ── DYNAMIC GAME-SPECIFIC CUSTOM CONFIGURATIONS ─────────────────
                if (widget.gameKey == 'whot') ...[
                  _sectionLabel('Hand Size'),
                  _optionRow(
                    options: _handOptions.map((h) => '$h').toList(),
                    selected: _whotHandSize.toString(),
                    onSelect: (v) => setState(() => _whotHandSize = int.parse(v)),
                  ),
                  const SizedBox(height: 16),
                ] else if (widget.gameKey == 'ludo') ...[
                  _sectionLabel('Token Count'),
                  _optionRow(
                    options: _tokenOptions.map((t) => '$t Tokens').toList(),
                    selected: '$_ludoTokens Tokens',
                    onSelect: (v) => setState(() => _ludoTokens = int.parse(v.split(' ')[0])),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── PLAYER COUNT SELECTOR (Hidden in Vs Computer) ───────────────
                if (!_vsComputer) ...[
                  _sectionLabel('Players'),
                  _optionRow(
                    options: _playerOptions.map((p) => '$p').toList(),
                    selected: '$_selectedPlayers',
                    onSelect: (v) => setState(() => _selectedPlayers = int.parse(v)),
                  ),
                  const SizedBox(height: 16),

                  // ── STAKE SELECTOR ROW (Figma: 342×48 rx=12 #0B0E1A) ──────────
                  _sectionLabel('Stake Amount'),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: context.border),
                    ),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      itemCount: _stakeOptions.length,
                      physics: const BouncingScrollPhysics(),
                      itemBuilder: (context, index) {
                        final s = _stakeOptions[index];
                        final active = _stakeAmount == s;
                        return GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _stakeAmount = s);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 140),
                            margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: active ? kCyan : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(_fmt(s),
                                  style: TextStyle(
                                      color: active ? const Color(0xFF0B0E1A) : Colors.white70,
                                      fontSize: 13,
                                      fontWeight: active ? FontWeight.w900 : FontWeight.w500)),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── LIVE POT INFO CARD (Figma: 342×78 rx=12 #22D1EE) ───────────
                Container(
                  height: 78,
                  decoration: BoxDecoration(
                    color: kCyan,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: kCyan.withOpacity(0.15),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('Total Pot',
                                style: TextStyle(
                                    color: Color(0xFF0B0E1A),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5)),
                            const SizedBox(height: 2),
                            Text(dynamicPotStr,
                                style: const TextStyle(
                                    color: Color(0xFF0B0E1A),
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900)),
                          ],
                        ),
                        Container(
                          width: 42, height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
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

        // ── ACTION PLAY CTA (Figma: 342×60 rx=12 #FF5E00) ───────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
          child: GestureDetector(
            onTap: () {
              HapticFeedback.vibrate();
              Widget activeGameScreen;

              // Explicit Dynamic Constructor Mapping to inject state selections
              switch (widget.gameKey) {
                case 'ludo':
                  activeGameScreen = LudoGameScreen(tokenCount: _ludoTokens);
                  break;
                case 'ayo':
                  activeGameScreen = AyoGameScreen(
                    roomId: _vsComputer ? 'practice_bot' : 'match_room_${DateTime.now().millisecondsSinceEpoch}',
                    playerId: 'player_main',
                    opponentName: _vsComputer ? 'Gamearn AI Bot' : 'Challenger',
                    prizePool: dynamicPotStr,
                    onBack: () => Navigator.pop(context),
                  );
                  break;
                case 'draughts':
                  activeGameScreen = DraughtsGameScreen(
                    roomId: _vsComputer ? 'practice_bot' : 'match_room_${DateTime.now().millisecondsSinceEpoch}',
                    playerId: 'player_main',
                    opponentName: _vsComputer ? 'Gamearn AI Bot' : 'Challenger',
                    prizePool: dynamicPotStr,
                    onBack: () => Navigator.pop(context),
                  );
                  break;
                default:
                  activeGameScreen = widget.gameScreen;
              }

              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => activeGameScreen),
              );
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
                        letterSpacing: 0.8)),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  // ── Mode Chip Widget Refinement ───────────────────────────────────────────
  Widget _modeChip(String label, bool active, VoidCallback onTap) =>
      Expanded(
        child: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          child: Padding(
            padding: const EdgeInsets.all(5),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                color: active ? kCyan : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: Text(label,
                    style: TextStyle(
                        color: active ? const Color(0xFF0B0E1A) : const Color(0xFF9A9A9A),
                        fontSize: 13,
                        fontWeight: active ? FontWeight.w900 : FontWeight.w600)),
              ),
            ),
          ),
        ),
      );

  // ── Option Row Widget Refinement ──────────────────────────────────────────
  Widget _optionRow({
    required List<String> options,
    required String selected,
    required ValueChanged<String> onSelect,
  }) =>
      Container(
        height: 48,
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.border),
        ),
        child: Row(
          children: options.map((o) {
            final active = o == selected;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onSelect(o);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 140),
                  decoration: BoxDecoration(
                    color: active ? kCyan : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Center(
                    child: Text(o,
                        style: TextStyle(
                            color: active ? const Color(0xFF0B0E1A) : const Color(0xFF9A9A9A),
                            fontSize: 12,
                            fontWeight: active ? FontWeight.w900 : FontWeight.w600)),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      );

  Widget _sectionLabel(String t) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 8),
    child: Text(t,
        style: TextStyle(
            color: context.txtSec,
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2)),
  );
}
