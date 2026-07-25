import 'package:flutter/material.dart';
import '../../theme.dart';

class CompletedGamesScreen extends StatelessWidget {
  const CompletedGamesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
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
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.arrow_back_ios_new_rounded,
                      color: context.txtPri, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              Text('Completed Games',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Filter chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _filterChip(context, 'All', true),
              const SizedBox(width: 8),
              _filterChip(context, 'Ayo', false),
              const SizedBox(width: 8),
              _filterChip(context, 'Ludo', false),
              const SizedBox(width: 8),
              _filterChip(context, 'Whot', false),
              const SizedBox(width: 8),
              _filterChip(context, 'Draughts', false),
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

  Widget _filterChip(BuildContext context, String label, bool selected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: selected ? kCyan.withOpacity(0.15) : context.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: selected ? kCyan : context.border,
        ),
      ),
      child: Text(label,
          style: TextStyle(
              color: selected ? kCyan : context.txtSec,
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
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
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
                                p1Won ? const Color(0xFF00E676) : context.txtPri,
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
          Text('VS',
              style: TextStyle(
                  color: context.txtSec,
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
                                : context.txtPri,
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
              style: TextStyle(
                  color: context.txtSec, fontSize: 10)),
        ),
      ]),
    );
  }
}
