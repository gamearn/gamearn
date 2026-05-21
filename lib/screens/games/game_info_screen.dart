import 'package:flutter/material.dart';
import '../../theme.dart';
import 'game_lobby_screen.dart';

// ─────────────────────────────────────────────────────────────────
//  GAME INFO SCREEN
//  Shown when user taps a game card on HomeScreen.
//  Shows: full game image banner, game description, rules,
//         stats — then a "Play Now" CTA → GameLobbyScreen.
// ─────────────────────────────────────────────────────────────────

// Per-game static content
const Map<String, _GameMeta> kGameMeta = {
  'whot': _GameMeta(
    title: 'WHOT',
    subtitle: 'Nigeria\'s favourite card game',
    assetPath: 'assets/games/whot.jpg',
    description:
        'Whot is Nigeria\'s most beloved card game. Race to empty your hand '
        'before your opponents by matching cards by shape or number. '
        'Use special cards like General Market, Hold On, and Pick Two to '
        'turn the game in your favour.',
    rules: [
      'Match by shape OR number to play a card',
      'Whot 20 is wild — call any shape',
      'Cannot end the game on a Whot 20 card',
      '1 = Hold On  ·  2 = Pick Two  ·  5 = Pick Three',
      '8 = Suspension  ·  14 = General Market',
    ],
    players: '2 – 5',
    avgTime: '10 – 20 min',
    difficulty: 'Easy',
    difficultyColor: Color(0xFF2AE500),
  ),
  'ludo': _GameMeta(
    title: 'Lúdò',
    subtitle: 'Roll, race and dominate the board',
    assetPath: 'assets/games/ludo.png',
    description:
        'The classic Nigerian board game. Roll the die and race all your tokens '
        'from base to home before your rivals. Send opponents back to base, '
        'land on safety squares, and be the first to crown all tokens.',
    rules: [
      'Roll a 6 to bring a token out of base',
      'Roll a 6 → you get a bonus roll',
      '3 consecutive sixes = turn cancelled',
      'Land on opponent = send them home',
      'Must land exactly on home square to finish',
    ],
    players: '2 – 4',
    avgTime: '20 – 40 min',
    difficulty: 'Easy',
    difficultyColor: Color(0xFF2AE500),
  ),
  'ayo': _GameMeta(
    title: 'Ayò Òpón',
    subtitle: 'The ancient West African strategy game',
    assetPath: 'assets/games/ayo.jpg',
    description:
        'Ayò Òpón (Mancala) is a centuries-old Nigerian strategy game. '
        'Scoop seeds from your pits, sow them counter-clockwise, and capture '
        'your opponent\'s seeds when conditions are right. Outwit and outlast '
        'to claim the most seeds.',
    rules: [
      'Pick all seeds from any of your 6 holes',
      'Sow one seed per hole, counter-clockwise',
      'Capture when last seed lands in opponent\'s hole with 2 or 3 seeds',
      'Chain captures backward if conditions match',
      'You must feed opponent if they have no seeds',
    ],
    players: '2',
    avgTime: '10 – 30 min',
    difficulty: 'Medium',
    difficultyColor: Color(0xFFF59E0B),
  ),
  'draughts': _GameMeta(
    title: 'Draughts',
    subtitle: 'Classic checkers, Nigerian style',
    assetPath: 'assets/games/draughts.jpg',
    description:
        'Nigerian Draughts is a tactical battle of wits on an 8×8 board. '
        'Capture all your opponent\'s pieces or block them completely. '
        'Crown your men to kings for full board mobility.',
    rules: [
      'Men move diagonally forward only',
      'Capture by jumping over an opponent\'s piece',
      'If a capture is available, you MUST take it',
      'Multiple jumps allowed in one turn',
      'Reach back row → crowned King (moves any direction)',
    ],
    players: '2',
    avgTime: '15 – 45 min',
    difficulty: 'Hard',
    difficultyColor: Color(0xFFFF5E00),
  ),
};

class _GameMeta {
  final String title;
  final String subtitle;
  final String assetPath;
  final String description;
  final List<String> rules;
  final String players;
  final String avgTime;
  final String difficulty;
  final Color difficultyColor;

  const _GameMeta({
    required this.title,
    required this.subtitle,
    required this.assetPath,
    required this.description,
    required this.rules,
    required this.players,
    required this.avgTime,
    required this.difficulty,
    required this.difficultyColor,
  });
}

class GameInfoScreen extends StatelessWidget {
  final String gameKey; // 'whot' | 'ludo' | 'ayo' | 'draughts'
  final Widget gameScreen;
  final int playCount;

  const GameInfoScreen({
    super.key,
    required this.gameKey,
    required this.gameScreen,
    this.playCount = 0,
  });

  @override
  Widget build(BuildContext context) {
    final meta = kGameMeta[gameKey] ?? kGameMeta['whot']!;

    return Scaffold(
      backgroundColor: kBgDeep,
      body: CustomScrollView(
        slivers: [
          // ── Hero banner ───────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: kBgDeep,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Game image
                  Image.asset(
                    meta.assetPath,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _PlaceholderBanner(
                        title: meta.title),
                  ),
                  // Gradient overlay so text stays readable
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.transparent, Color(0xCC0B0E1A)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        stops: [0.4, 1.0],
                      ),
                    ),
                  ),
                  // Title overlay
                  Positioned(
                    left: 20,
                    bottom: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(meta.title,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.3)),
                        const SizedBox(height: 4),
                        Text(meta.subtitle,
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Body ─────────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Quick stats row ────────────────────────────────────
                  Row(children: [
                    _StatPill(
                      icon: Icons.people_outline_rounded,
                      label: '${meta.players} Players',
                      color: kCyan,
                    ),
                    const SizedBox(width: 10),
                    _StatPill(
                      icon: Icons.timer_outlined,
                      label: meta.avgTime,
                      color: kCyan,
                    ),
                    const SizedBox(width: 10),
                    _StatPill(
                      icon: Icons.bar_chart_rounded,
                      label: meta.difficulty,
                      color: meta.difficultyColor,
                    ),
                  ]),
                  const SizedBox(height: 8),
                  _StatPill(
                    icon: Icons.sports_esports_outlined,
                    label: playCount >= 1000
                        ? '${(playCount / 1000).toStringAsFixed(1)}k Playing'
                        : '$playCount Playing',
                    color: kOrange,
                  ),

                  const SizedBox(height: 24),

                  // ── About ──────────────────────────────────────────────
                  const Text('About',
                      style: TextStyle(
                          color: kTextPri,
                          fontWeight: FontWeight.w800,
                          fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(meta.description,
                      style: const TextStyle(
                          color: kTextSec,
                          fontSize: 14,
                          height: 1.6)),

                  const SizedBox(height: 24),

                  // ── Rules ──────────────────────────────────────────────
                  const Text('Rules',
                      style: TextStyle(
                          color: kTextPri,
                          fontWeight: FontWeight.w800,
                          fontSize: 16)),
                  const SizedBox(height: 10),
                  ...meta.rules.map((r) => _RuleRow(rule: r)),

                  const SizedBox(height: 100), // space for bottom button
                ],
              ),
            ),
          ),
        ],
      ),

      // ── Play Now button ───────────────────────────────────────────────────
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(
            20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
        decoration: const BoxDecoration(
          color: Color(0xFF0F1220),
          border: Border(top: BorderSide(color: kBorder)),
        ),
        child: SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => GameLobbyScreen(
                  gameTitle: meta.title,
                  gameScreen: gameScreen,
                  gameKey: gameKey,
                ),
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: kOrange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
            child: const Text(
              'Play Now',
              style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.3),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _StatPill({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _RuleRow extends StatelessWidget {
  final String rule;
  const _RuleRow({required this.rule});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 5),
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
                color: kCyan, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(rule,
                style: const TextStyle(
                    color: kTextSec, fontSize: 13, height: 1.5)),
          ),
        ],
      ),
    );
  }
}

class _PlaceholderBanner extends StatelessWidget {
  final String title;
  const _PlaceholderBanner({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0E2A4A), Color(0xFF0B0E1A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          title[0],
          style: const TextStyle(
              color: kCyan,
              fontSize: 80,
              fontWeight: FontWeight.w900),
        ),
      ),
    );
  }
}
