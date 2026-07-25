import 'package:flutter/material.dart';
import '../../theme.dart';

class LiveUsersScreen extends StatelessWidget {
  const LiveUsersScreen({super.key});

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
              Expanded(
                child: Text('Live Users',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF00E676).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: Color(0xFF00E676),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text('1,203 online',
                      style: TextStyle(
                          color: Color(0xFF00E676),
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ]),
              ),
            ]),
          ),

          // Game breakdown
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _gameChip('Ayo', '342', kCyan),
              const SizedBox(width: 8),
              _gameChip('Ludo', '498', kOrange),
              const SizedBox(width: 8),
              _gameChip('Whot', '218', const Color(0xFF00E676)),
              const SizedBox(width: 8),
              _gameChip('Draughts', '145', kYellowDot),
            ]),
          ),

          const SizedBox(height: 16),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 25,
              itemBuilder: (ctx, i) => _LiveUserRow(
                name: 'Player ${5000 - i * 20}',
                game: ['Ayo', 'Ludo', 'Whot', 'Draughts'][i % 4],
                duration: '${15 + i * 3}m',
                opponent: 'Player ${4999 - i * 20}',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _gameChip(String game, String count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(children: [
          Text(count,
              style: TextStyle(
                  color: color,
                  fontSize: 16,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(game,
              style: TextStyle(color: color, fontSize: 10)),
        ]),
      ),
    );
  }
}

class _LiveUserRow extends StatelessWidget {
  final String name;
  final String game;
  final String duration;
  final String opponent;

  const _LiveUserRow({
    required this.name,
    required this.game,
    required this.duration,
    required this.opponent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.border),
      ),
      child: Row(children: [
        // Live indicator
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: Color(0xFF00E676),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
              Text('vs $opponent',
                  style: TextStyle(
                      color: context.txtSec, fontSize: 11)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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
            const SizedBox(height: 3),
            Text(duration,
                style: TextStyle(
                    color: context.txtSec, fontSize: 10)),
          ],
        ),
      ]),
    );
  }
}
