import 'package:flutter/material.dart';
import '../../theme.dart';

class TournamentOverviewScreen extends StatelessWidget {
  const TournamentOverviewScreen({super.key});

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
              Text('Tournament Overview',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Filter tabs
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _tab(context, 'Live', true, const Color(0xFF00E676)),
              const SizedBox(width: 8),
              _tab(context, 'Upcoming', false, kOrange),
              const SizedBox(width: 8),
              _tab(context, 'Completed', false, kCyan),
            ]),
          ),

          const SizedBox(height: 12),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 12,
              itemBuilder: (ctx, i) => _TournamentCard(
                name: '${['Weekly Ludo', 'Ayo Masters', 'Whot Championship', 'Draughts Open'][i % 4]} #${24 - i}',
                game: ['Ludo', 'Ayo', 'Whot', 'Draughts'][i % 4],
                prizePool: 50000 - i * 3000,
                entryFee: 1000 - i * 50,
                players: '${20 + i * 5}/32',
                status: i < 3 ? 'live' : i < 7 ? 'upcoming' : 'completed',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _tab(BuildContext context, String label, bool selected, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.15) : context.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? color : context.border,
          ),
        ),
        child: Center(
          child: Text(label,
              style: TextStyle(
                  color: selected ? color : context.txtSec,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}

class _TournamentCard extends StatelessWidget {
  final String name;
  final String game;
  final int prizePool;
  final int entryFee;
  final String players;
  final String status;

  const _TournamentCard({
    required this.name,
    required this.game,
    required this.prizePool,
    required this.entryFee,
    required this.players,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final isLive = status == 'live';
    final isCompleted = status == 'completed';
    final statusColor = isLive
        ? const Color(0xFF00E676)
        : isCompleted
            ? kCyan
            : kOrange;
    final formatted =
        '₦${prizePool.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLive ? statusColor.withOpacity(0.3) : context.border,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(name,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 14,
                  fontWeight: FontWeight.w700)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(status.toUpperCase(),
                style: TextStyle(
                    color: statusColor,
                    fontSize: 9,
                    fontWeight: FontWeight.w800)),
          ),
        ]),
        const SizedBox(height: 10),
        Row(children: [
          _info(context, 'Game', game),
          const SizedBox(width: 16),
          _info(context, 'Prize', formatted),
          const SizedBox(width: 16),
          _info(context, 'Entry', '₦$entryFee'),
          const Spacer(),
          _info(context, 'Players', players),
        ]),
      ]),
    );
  }

  Widget _info(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style:
                TextStyle(color: context.txtSec, fontSize: 10)),
        Text(value,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}
