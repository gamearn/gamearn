import 'package:flutter/material.dart';
import '../../theme.dart';
import 'game_lobby_screen.dart';
import 'game_setup_screen.dart';

// ════════════════════════════════════════════════════════════════
//  GAME INFO SCREEN — Figma matched
//
//  Figma: Completed Games Screen (390×844)
//   y=98:  256×256 #22D1EE glow circle (right-shifted)
//   y=169: 342×32  rx=4 #16223F — tab bar
//   y=225: 342×190 rx=8 #16223F — main info card
//     inner win badge: 49×24 rx=4 #2AE500
//   y=439: 342×222 rx=8 #16223F — rules/details card
//   y=693: 342×437 rx=8 #16223F — leaderboard card
//     inner badge: 51×22 rx=4 #1E2E56
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
  int _tab = 0;
  static const _tabs = ['Overview', 'Rules', 'Leaderboard'];

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
      description:
          'WHOT is Nigeria\'s most beloved card game. Match cards by shape or number, use special cards to change the game, and be the first to empty your hand to win.',
      players: '2–5', duration: '15–30 min', difficulty: 'Easy',
      rules: [
        'Match the top card by suit or number',
        'Play a WHOT card to nominate any suit',
        'Pick Two forces next player to draw 2',
        'Hold On keeps your turn',
        'Suspension skips next player',
        'Call "Last Card!" when you have 1 card left',
        'Cannot win on a special card',
      ],
    ),
    'ludo': _GameMeta(
      title: 'Lúdò',
      tagline: 'The board game of strategy & luck',
      description:
          'Lúdò is a classic Nigerian board game where 2–4 players race their pieces around the board to get all four home. Roll dice, capture opponents, and use smart strategy to win.',
      players: '2–4', duration: '20–45 min', difficulty: 'Easy',
      rules: [
        'Roll 6 to move a piece out of base',
        'Move pieces clockwise around the board',
        'Landing on opponent sends them home',
        'Safety squares protect your pieces',
        'Get all 4 pieces home to win',
        'Roll 6 again for a bonus turn',
        '3 consecutive sixes loses your turn',
      ],
    ),
    'ayo': _GameMeta(
      title: 'Ayò Òpón',
      tagline: 'Ancient Nigerian strategy game',
      description:
          'Ayò Òpón is a traditional Nigerian Yoruba board game requiring strategy and forward thinking. Capture more seeds than your opponent across 12 pits.',
      players: '2', duration: '10–20 min', difficulty: 'Medium',
      rules: [
        'Each player controls 6 pits on their side',
        'Pick seeds from a pit and sow counter-clockwise',
        'Capture when last seed lands in opponent\'s pit with 2 or 3',
        'Player with most seeds at end wins',
        'Game ends when a player cannot move',
        'Grand slam: capturing all seeds wins',
      ],
    ),
    'draughts': _GameMeta(
      title: 'Draughts',
      tagline: 'Classic checkers with Nigerian flair',
      description:
          'Draughts (Checkers) is a two-player strategy game played on an 8×8 board. Capture all opponent pieces or leave them with no legal moves to win.',
      players: '2', duration: '15–30 min', difficulty: 'Medium',
      rules: [
        'Move diagonally forward one square',
        'Jump over opponent pieces to capture',
        'Multiple captures in one turn are allowed',
        'Reach the opponent\'s back row to become King',
        'Kings can move both forward and backward',
        'Mandatory captures must be made',
      ],
    ),
  };

  _GameMeta get _meta =>
      _gameMeta[widget.gameKey] ?? _gameMeta['whot']!;

  String get _asset =>
      _gameAssets[widget.gameKey] ?? _gameAssets['whot']!;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Stack(children: [
        // Glow circle — Figma: y=98 x=237 256×256 #22D1EE
        Positioned(
          top: 60, right: -40,
          child: Container(
            width: 256, height: 256,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kCyan.withOpacity(0.08),
              boxShadow: [BoxShadow(
                  color: kCyan.withOpacity(0.15),
                  blurRadius: 60, spreadRadius: 10)],
            ),
          ),
        ),

        SafeArea(
          child: Column(children: [

            // ── HEADER ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: context.border),
                    ),
                    child: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Colors.white, size: 16),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_meta.title,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w900)),
                      Text(_meta.tagline,
                          style: const TextStyle(
                              color: kCyan,
                              fontSize: 11)),
                    ],
                  ),
                ),
              ]),
            ),

            // ── GAME IMAGE BANNER ───────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  height: 140,
                  child: Stack(fit: StackFit.expand, children: [
                    Image.asset(_asset, fit: BoxFit.cover),
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color(0x220B0E1A),
                            Color(0xBB0B0E1A)
                          ],
                        ),
                      ),
                    ),
                    // Play count + win badge
                    Positioned(
                      bottom: 12, left: 14, right: 14,
                      child: Row(children: [
                        Text(
                          widget.playCount >= 1000
                              ? '${(widget.playCount / 1000).toStringAsFixed(1)}k playing'
                              : '${widget.playCount} playing',
                          style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12)),
                        const Spacer(),
                        // Win badge — Figma: 49×24 rx=4 #2AE500
                        Container(
                          height: 24,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2AE500),
                            borderRadius:
                                BorderRadius.circular(4),
                          ),
                          child: const Center(
                            child: Text('Win ₦',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight:
                                        FontWeight.w800)),
                          ),
                        ),
                      ]),
                    ),
                  ]),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ── TAB BAR — Figma: 342×32 rx=4 #16223F ───────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 36,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  // Figma: #16223F
                  color: const Color(0xFF16223F),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: List.generate(_tabs.length, (i) {
                    final active = i == _tab;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tab = i),
                        child: AnimatedContainer(
                          duration:
                              const Duration(milliseconds: 180),
                          decoration: BoxDecoration(
                            color: active
                                ? kCyan
                                : Colors.transparent,
                            borderRadius:
                                BorderRadius.circular(6),
                          ),
                          child: Center(
                            child: Text(_tabs[i],
                                style: TextStyle(
                                    color: active
                                        ? const Color(
                                            0xFF0B0E1A)
                                        : const Color(
                                            0xFF94A3B8),
                                    fontSize: 11,
                                    fontWeight:
                                        FontWeight.w700)),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ── TAB CONTENT ─────────────────────────────────────
            Expanded(
              child: IndexedStack(
                index: _tab,
                children: [
                  _OverviewTab(meta: _meta),
                  _RulesTab(meta: _meta),
                  _LeaderboardTab(gameKey: widget.gameKey),
                ],
              ),
            ),

            // ── PLAY CTA ────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              child: GestureDetector(
                onTap: () {
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
                    Navigator.push(context,
                        MaterialPageRoute(builder: (_) => dest));
                  },
                child: Container(
                  height: 56,
                  decoration: BoxDecoration(
                    color: kOrange,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(
                        color: kOrange.withOpacity(0.4),
                        blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: const Center(
                    child: Text('Play Game',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900)),
                  ),
                ),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

// ── GAME META ─────────────────────────────────────────────────────
class _GameMeta {
  final String title, tagline, description, players, duration, difficulty;
  final List<String> rules;
  const _GameMeta({
    required this.title, required this.tagline,
    required this.description, required this.players,
    required this.duration, required this.difficulty,
    required this.rules,
  });
}

// ── OVERVIEW TAB — Figma: 342×190 rx=8 #16223F ───────────────────
class _OverviewTab extends StatelessWidget {
  final _GameMeta meta;
  const _OverviewTab({required this.meta});

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    children: [
      // Main info card — Figma: 342×190 rx=8 #16223F
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF16223F),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(meta.description,
                style: const TextStyle(
                    color: Color(0xFFF1F5F9),
                    fontSize: 13, height: 1.6)),
            const SizedBox(height: 16),
            Row(children: [
              _InfoPill(label: 'Players', value: meta.players),
              const SizedBox(width: 10),
              _InfoPill(label: 'Duration', value: meta.duration),
              const SizedBox(width: 10),
              _InfoPill(label: 'Level', value: meta.difficulty),
            ]),
          ],
        ),
      ),
    ],
  );
}

class _InfoPill extends StatelessWidget {
  final String label, value;
  const _InfoPill({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.1),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: kCyan.withOpacity(0.25)),
    ),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(value,
          style: const TextStyle(
              color: kCyan, fontSize: 13, fontWeight: FontWeight.w800)),
      Text(label,
          style: TextStyle(
              color: context.txtSec, fontSize: 10)),
    ]),
  );
}

// ── RULES TAB — Figma: 342×222 rx=8 #16223F ──────────────────────
class _RulesTab extends StatelessWidget {
  final _GameMeta meta;
  const _RulesTab({required this.meta});

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    children: [
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF16223F),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('How to Play',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14, fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            ...meta.rules.asMap().entries.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 22, height: 22,
                    decoration: const BoxDecoration(
                        color: kCyan, shape: BoxShape.circle),
                    child: Center(
                      child: Text('${e.key + 1}',
                          style: const TextStyle(
                              color: Color(0xFF0B0E1A),
                              fontSize: 10,
                              fontWeight: FontWeight.w900)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(e.value,
                        style: const TextStyle(
                            color: Color(0xFFF1F5F9),
                            fontSize: 13, height: 1.5)),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    ],
  );
}

// ── LEADERBOARD TAB — Figma: 342×437 rx=8 #16223F ────────────────
// inner badge 51×22 rx=4 #1E2E56
class _LeaderboardTab extends StatelessWidget {
  final String gameKey;
  const _LeaderboardTab({required this.gameKey});

  @override
  Widget build(BuildContext context) {
    // Mock top players since per-game leaderboard needs
    // a separate Firestore collection populated by the backend
    final entries = List.generate(8, (i) => {
      'rank': i + 1,
      'name': ['Chukwudi', 'Amaka', 'Tunde', 'Ngozi',
                'Emeka', 'Bisi', 'Kemi', 'Femi'][i],
      'score': 5000 - (i * 420),
      'emoji': ['👑','⚡','🔥','💎','🏆','🎯','✨','🌟'][i],
    });

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF16223F),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: entries.map((e) {
              final rank  = e['rank'] as int;
              final isTop = rank <= 3;
              return Container(
                height: 52,
                decoration: BoxDecoration(
                  border: rank < entries.length
                       ? Border(
                           bottom: BorderSide(
                               color: context.border, width: 1))
                      : null,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16),
                  child: Row(children: [
                    SizedBox(
                      width: 28,
                      child: Text(
                        rank <= 3
                            ? ['🥇','🥈','🥉'][rank-1]
                            : '#$rank',
                        style: TextStyle(
                            color: isTop
                                ? kOrange
                                : context.txtSec,
                            fontSize: rank <= 3 ? 16 : 12,
                            fontWeight: FontWeight.w800),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(e['emoji'] as String,
                        style: const TextStyle(fontSize: 18)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(e['name'] as String,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600)),
                    ),
                    // Score badge — Figma: 51×22 rx=4 #1E2E56
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E2E56),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text('${e['score']} pts',
                          style: const TextStyle(
                              color: kCyan,
                              fontSize: 10,
                              fontWeight: FontWeight.w700)),
                    ),
                  ]),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
