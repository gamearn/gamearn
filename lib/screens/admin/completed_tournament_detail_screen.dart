import 'package:flutter/material.dart';
import '../../theme.dart';

class CompletedTournamentDetailScreen extends StatelessWidget {
  const CompletedTournamentDetailScreen({super.key});

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
                child: Text('Completed Tournament',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('COMPLETED',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 11,
                        fontWeight: FontWeight.w800)),
              ),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              children: [
                // Tournament info
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        kCyan.withOpacity(0.08),
                        context.card,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: kCyan.withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    Text('Whot Championship #8',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text('Completed 2 hours ago',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 12)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info(context, 'Prize Pool', '₦40,000'),
                        _info(context, 'Players', '28'),
                        _info(context, 'Matches', '27'),
                      ],
                    ),
                  ]),
                ),

                const SizedBox(height: 20),

                // Winners podium
                Text('WINNERS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _WinnerPodium('2nd', 'Ada_Flow', '₦7,000',
                        kCyan, 80),
                    const SizedBox(width: 8),
                    _WinnerPodium('1st', 'Kofi_92', '₦22,000',
                        kOrange, 100),
                    const SizedBox(width: 8),
                    _WinnerPodium('3rd', 'Chidi_Goat', '₦3,000',
                        const Color(0xFF00E676), 70),
                  ],
                ),

                const SizedBox(height: 20),

                // Prize distribution
                Text('PRIZE DISTRIBUTION',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _PrizeRow('1st Place', 'Kofi_92', '₦22,000', true),
                  _divider(context),
                  _PrizeRow('2nd Place', 'Ada_Flow', '₦7,000', false),
                  _divider(context),
                  _PrizeRow('3rd Place', 'Chidi_Goat', '₦3,000', false),
                  _divider(context),
                  _PrizeRow('4th Place', 'Bola_King', '₦2,000', false),
                  _divider(context),
                  _PrizeRow('5th-8th', 'Various', '₦750 each', false),
                ]),

                const SizedBox(height: 20),

                // Payout status
                Text('PAYOUT STATUS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _PayoutRow('Kofi_92', '₦22,000', 'paid'),
                  _divider(context),
                  _PayoutRow('Ada_Flow', '₦7,000', 'paid'),
                  _divider(context),
                  _PayoutRow('Chidi_Goat', '₦3,000', 'pending'),
                  _divider(context),
                  _PayoutRow('Bola_King', '₦2,000', 'pending'),
                ]),

                const SizedBox(height: 20),

                // Match history
                Text('MATCH HISTORY',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _MatchResult('Quarter-Final', 'Kofi_92', 'Bola_King', '3 - 1'),
                  _divider(context),
                  _MatchResult('Quarter-Final', 'Ada_Flow', 'Ngozi_Q', '2 - 0'),
                  _divider(context),
                  _MatchResult('Semi-Final', 'Kofi_92', 'Emeka_Pro', '2 - 1'),
                  _divider(context),
                  _MatchResult('Semi-Final', 'Ada_Flow', 'Tunde_R', '3 - 2'),
                  _divider(context),
                  _MatchResult('Final', 'Kofi_92', 'Ada_Flow', '4 - 3'),
                ]),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _info(BuildContext context, String label, String value) {
    return Column(children: [
      Text(label,
          style:
              TextStyle(color: context.txtSec, fontSize: 10)),
      const SizedBox(height: 2),
      Text(value,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 15,
              fontWeight: FontWeight.w800)),
    ]);
  }

  Widget _divider(BuildContext context) =>
      Divider(height: 1, indent: 56, color: context.border);
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: children),
      );
}

class _WinnerPodium extends StatelessWidget {
  final String place;
  final String name;
  final String prize;
  final Color color;
  final double height;

  const _WinnerPodium(
      this.place, this.name, this.prize, this.color, this.height);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
                child: Text(place,
                    style: TextStyle(
                        color: color,
                        fontSize: 16,
                        fontWeight: FontWeight.w900))),
          ),
          const SizedBox(height: 8),
          Text(name,
              style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(prize,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 13,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            height: height,
            decoration: BoxDecoration(
              color: color.withOpacity(0.06),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ]),
      ),
    );
  }
}

class _PrizeRow extends StatelessWidget {
  final String place;
  final String name;
  final String amount;
  final bool isWinner;

  const _PrizeRow(this.place, this.name, this.amount, this.isWinner);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Icon(
        isWinner ? Icons.emoji_events : Icons.emoji_events_outlined,
        color: isWinner ? kOrange : kTextSec,
        size: 20,
      ),
      title: Text(place,
          style: TextStyle(
              color: isWinner ? kOrange : context.txtPri,
              fontSize: 13,
              fontWeight:
                  isWinner ? FontWeight.w700 : FontWeight.w500)),
      subtitle:
          Text(name, style: TextStyle(color: context.txtSec, fontSize: 11)),
      trailing: Text(amount,
          style: TextStyle(
              color: isWinner ? kOrange : context.txtPri,
              fontSize: 13,
              fontWeight: FontWeight.w700)),
    );
  }
}

class _PayoutRow extends StatelessWidget {
  final String name;
  final String amount;
  final String status;

  const _PayoutRow(this.name, this.amount, this.status);

  @override
  Widget build(BuildContext context) {
    final paid = status == 'paid';
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      title: Text(name,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13,
              fontWeight: FontWeight.w500)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(amount,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
          decoration: BoxDecoration(
            color: paid
                ? const Color(0xFF00E676).withOpacity(0.12)
                : kOrange.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(status.toUpperCase(),
              style: TextStyle(
                  color: paid ? const Color(0xFF00E676) : kOrange,
                  fontSize: 9,
                  fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }
}

class _MatchResult extends StatelessWidget {
  final String round;
  final String p1;
  final String p2;
  final String score;

  const _MatchResult(this.round, this.p1, this.p2, this.score);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.08),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(round.split(' ').first,
            style: const TextStyle(
                color: kCyan, fontSize: 9, fontWeight: FontWeight.w600)),
      ),
      title: Text('$p1  vs  $p2',
          style: TextStyle(
              color: context.txtPri,
              fontSize: 12,
              fontWeight: FontWeight.w500)),
      trailing: Text(score,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13,
              fontWeight: FontWeight.w800)),
    );
  }
}
