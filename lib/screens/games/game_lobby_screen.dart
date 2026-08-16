import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
      body: LayoutBuilder(builder: (_, c) {
        final heroH = (c.maxHeight * 0.28).clamp(110.0, 220.0);
        return Column(children: [

        // ── HERO IMAGE (Figma Match) ───────────────────────────────────────────
        SizedBox(
          height: heroH,
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
                padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 0),
                child: Row(children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(Icons.close_rounded,
                        color: const Color(0xFFF1F5F9), size: 20.w),
                  ),
                  SizedBox(width: 12.w),
                  Text(widget.gameTitle,
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w900,
                          shadows: const [Shadow(blurRadius: 8)])),
                ]),
              ),
            ),
          ]),
        ),

        // ── SCROLLABLE OPTIONS AREA ─────────────────────────────────────────────
        Expanded(
          child: SingleChildScrollView(
            padding: EdgeInsets.fromLTRB(24.w, 16.h, 24.w, 24.h),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                // ── GAME MODE ROW (Figma: 342×48 rx=8 #0B0E1A) ──────────────────
                _sectionLabel('Game Mode'),
                  Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(8.r),
                      border: Border.all(color: context.border),
                    ),
                  child: Row(children: [
                    _modeChip('Vs Player', !_vsComputer,
                        () => setState(() => _vsComputer = false)),
                    _modeChip('Vs Computer', _vsComputer,
                        () => setState(() => _vsComputer = true)),
                  ]),
                ),

                SizedBox(height: 16.h),

                // ── DYNAMIC GAME-SPECIFIC CUSTOM CONFIGURATIONS ─────────────────
                if (widget.gameKey == 'whot') ...[
                  _sectionLabel('Hand Size'),
                  _optionRow(
                    options: _handOptions.map((h) => '$h').toList(),
                    selected: _whotHandSize.toString(),
                    onSelect: (v) => setState(() => _whotHandSize = int.parse(v)),
                  ),
                  SizedBox(height: 16.h),
                ] else if (widget.gameKey == 'ludo') ...[
                  _sectionLabel('Token Count'),
                  _optionRow(
                    options: _tokenOptions.map((t) => '$t Tokens').toList(),
                    selected: '$_ludoTokens Tokens',
                    onSelect: (v) => setState(() => _ludoTokens = int.parse(v.split(' ')[0])),
                  ),
                  SizedBox(height: 16.h),
                ],

                // ── PLAYER COUNT SELECTOR (Hidden in Vs Computer) ───────────────
                if (!_vsComputer) ...[
                  _sectionLabel('Players'),
                  _optionRow(
                    options: _playerOptions.map((p) => '$p').toList(),
                    selected: '$_selectedPlayers',
                    onSelect: (v) => setState(() => _selectedPlayers = int.parse(v)),
                  ),
                  SizedBox(height: 16.h),

                  // ── STAKE SELECTOR ROW (Figma: 342×48 rx=12 #0B0E1A) ──────────
                  _sectionLabel('Stake Amount'),
                  Container(
                    height: 48.h,
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(12.r),
                      border: Border.all(color: context.border),
                    ),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: EdgeInsets.symmetric(horizontal: 8.w),
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
                            margin: EdgeInsets.symmetric(horizontal: 4.w, vertical: 6.h),
                            padding: EdgeInsets.symmetric(horizontal: 16.w),
                            decoration: BoxDecoration(
                              color: active ? kCyan : Colors.transparent,
                              borderRadius: BorderRadius.circular(8.r),
                            ),
                            child: Center(
                              child: Text(_fmt(s),
                                  style: TextStyle(
                                      color: active ? const Color(0xFF0B0E1A) : Colors.white70,
                                      fontSize: 13.sp,
                                      fontWeight: active ? FontWeight.w900 : FontWeight.w500)),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  SizedBox(height: 16.h),
                ],

                // ── LIVE POT INFO CARD (Figma: 342×78 rx=12 #22D1EE) ───────────
                Container(
                  height: 78.h,
                  decoration: BoxDecoration(
                    color: kCyan,
                    borderRadius: BorderRadius.circular(12.r),
                    boxShadow: [
                      BoxShadow(
                        color: kCyan.withOpacity(0.15),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Total Pot',
                                style: TextStyle(
                                    color: const Color(0xFF0B0E1A),
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.5)),
                            SizedBox(height: 2.h),
                            Text(dynamicPotStr,
                                style: TextStyle(
                                    color: const Color(0xFF0B0E1A),
                                    fontSize: 24.sp,
                                    fontWeight: FontWeight.w900)),
                          ],
                        ),
                        Container(
                          width: 42.w, height: 42.w,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.emoji_events_rounded,
                            color: Colors.white,
                            size: 22.w),
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
          padding: EdgeInsets.fromLTRB(24.w, 0, 24.w, 28.h),
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
              height: 60.h,
              decoration: BoxDecoration(
                color: kOrange,
                borderRadius: BorderRadius.circular(12.r),
                boxShadow: [
                  BoxShadow(
                      color: kOrange.withOpacity(0.4),
                      blurRadius: 16, spreadRadius: 0,
                      offset: const Offset(0, 6)),
                ],
              ),
              child: Center(
                child: Text('Play Now',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8)),
              ),
              ),
            ),
          ),
        ]);
      }),
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
            padding: EdgeInsets.all(5.r),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                color: active ? kCyan : Colors.transparent,
                borderRadius: BorderRadius.circular(6.r),
              ),
              child: Center(
                child: Text(label,
                    style: TextStyle(
                        color: active ? const Color(0xFF0B0E1A) : const Color(0xFF9A9A9A),
                        fontSize: 13.sp,
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
        height: 48.h,
        padding: EdgeInsets.all(5.r),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(8.r),
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
                    borderRadius: BorderRadius.circular(6.r),
                  ),
                  child: Center(
                    child: Text(o,
                        style: TextStyle(
                            color: active ? const Color(0xFF0B0E1A) : const Color(0xFF9A9A9A),
                            fontSize: 12.sp,
                            fontWeight: active ? FontWeight.w900 : FontWeight.w600)),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      );

  Widget _sectionLabel(String t) => Padding(
    padding: EdgeInsets.only(top: 20.h, bottom: 8.h),
    child: Text(t,
        style: TextStyle(
            color: context.txtSec,
            fontSize: 11.sp,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2)),
  );
}
