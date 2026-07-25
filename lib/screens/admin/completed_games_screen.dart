import 'package:flutter/material.dart';
import '../../theme.dart';

class CompletedGamesScreen extends StatelessWidget {
  const CompletedGamesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              const Text('Completed Games',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Filter chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _filterChip('All', true),
              const SizedBox(width: 8),
              _filterChip('Ayo', false),
              const SizedBox(width: 8),
              _filterChip('Ludo', false),
              const SizedBox(width: 8),
              _filterChip('Whot', false),
              const SizedBox(width: 8),
              _filterChip('Draughts', false),
            ]),
          ),

          const SizedBox(height: 12),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 20,
              itemBuilder: (ctx, i) => _GameCard(
                game: ['Ayo', 'Ludo', 'Whot', 'Draughts'][i % 4],
                player1: 'Player ${4000 + i}',
                player2: 'Player ${3999 + i}',
                winner: i % 3 == 0 ? 'player1' : 'player2',
                prize: 5000 - i * 200,
                timeAgo: '${i + 1}h ago',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _filterChip(String label, bool selected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: selected ? kCyan.withOpacity(0.15) : kBgCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: selected ? kCyan : kBorder,
        ),
      ),
      child: Text(label,
          style: TextStyle(
              color: selected ? kCyan : const Color(0xFF94A3B8),
              fontSize: 12,
              fontWeight: FontWeight.w600)),
    );
  }
}

class _GameCard extends StatelessWidget {
  final String game;
  final String player1;
  final String player2;
  final String winner;
  final int prize;
  final String timeAgo;

  const _GameCard({
    required this.game,
    required this.player1,
    required this.player2,
    required this.winner,
    required this.prize,
    required this.timeAgo,
  });

  @override
  Widget build(BuildContext context) {
    final p1Won = winner == 'player1';
    final formatted =
        '₦${prize.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: kCyan.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(game,
                style: const TextStyle(
                    color: kCyan,
                    fontSize: 10,
                    fontWeight: FontWeight.w600)),
          ),
          const Spacer(),
          Text(formatted,
              style: const TextStyle(
                  color: kOrange,
                  fontSize: 13,
                  fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          // Player 1
          Expanded(
            child: Row(children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: p1Won
                      ? const Color(0xFF00E676).withOpacity(0.12)
                      : kCyan.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.person_outline,
                    color: p1Won ? const Color(0xFF00E676) : kCyan,
                    size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(player1,
                        style: TextStyle(
                            color:
                                p1Won ? const Color(0xFF00E676) : Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    if (p1Won)
                      const Text('WINNER',
                          style: TextStyle(
                              color: Color(0xFF00E676),
                              fontSize: 8,
                              fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
            ]),
          ),
          // VS
          const Text('VS',
              style: TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 11,
                  fontWeight: FontWeight.w800)),
          // Player 2
          Expanded(
            child: Row(children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(player2,
                        style: TextStyle(
                            color: !p1Won
                                ? const Color(0xFF00E676)
                                : Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    if (!p1Won)
                      const Text('WINNER',
                          style: TextStyle(
                              color: Color(0xFF00E676),
                              fontSize: 8,
                              fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: !p1Won
                      ? const Color(0xFF00E676).withOpacity(0.12)
                      : kCyan.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.person_outline,
                    color: !p1Won ? const Color(0xFF00E676) : kCyan,
                    size: 18),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerRight,
          child: Text(timeAgo,
              style: const TextStyle(
                  color: Color(0xFF475569), fontSize: 10)),
        ),
      ]),
    );
  }
}
