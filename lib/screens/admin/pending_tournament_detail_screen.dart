import 'package:flutter/material.dart';
import '../../theme.dart';

class PendingTournamentDetailScreen extends StatelessWidget {
  const PendingTournamentDetailScreen({super.key});

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
              const Expanded(
                child: Text('Pending Tournament',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('PENDING',
                    style: TextStyle(
                        color: kOrange,
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
                        kOrange.withOpacity(0.08),
                        kBgCard,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: kOrange.withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    const Text('Ayo Masters Cup #12',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info('Prize Pool', '₦30,000'),
                        _info('Entry Fee', '₦500'),
                        _info('Players', '18/32'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info('Starts In', '2h 15m'),
                        _info('Game', 'Ayo'),
                        _info('Format', 'Single Elim'),
                      ],
                    ),
                  ]),
                ),

                const SizedBox(height: 20),

                // Registered players
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('REGISTERED PLAYERS (18)',
                        style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2)),
                    TextButton(
                      onPressed: () {},
                      child: const Text('View All',
                          style: TextStyle(color: kCyan, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                _SectionCard(children: [
                  for (int i = 0; i < 8; i++)
                    _PlayerRow(
                      name: 'Player ${1800 - i * 10}',
                      rank: i + 1,
                    ),
                ]),

                const SizedBox(height: 20),

                // Config review
                const Text('TOURNAMENT CONFIG',
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _ConfigRow('Max Players', '32'),
                  _divider(),
                  _ConfigRow('Entry Fee', '₦500'),
                  _divider(),
                  _ConfigRow('Prize Distribution', '1st: ₦20K, 2nd: ₦7K, 3rd: ₦3K'),
                  _divider(),
                  _ConfigRow('Match Timer', '120 seconds'),
                ]),

                const SizedBox(height: 20),

                // Admin actions
                Row(children: [
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: start tournament
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00E676),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Start Tournament',
                            style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w800,
                                fontSize: 14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: OutlinedButton(
                        onPressed: () {
                          // TODO: edit tournament
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: kBorder),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Edit',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14)),
                      ),
                    ),
                  ),
                ]),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _info(String label, String value) {
    return Column(children: [
      Text(label,
          style:
              const TextStyle(color: Color(0xFF64748B), fontSize: 10)),
      const SizedBox(height: 2),
      Text(value,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w800)),
    ]);
  }

  static Widget _divider() =>
      const Divider(height: 1, indent: 56, color: Color(0xFF334155));
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: children),
      );
}

class _PlayerRow extends StatelessWidget {
  final String name;
  final int rank;

  const _PlayerRow({required this.name, required this.rank});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: rank <= 3 ? kCyan.withOpacity(0.12) : kBgCardAlt,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text('$rank',
              style: TextStyle(
                  color: rank <= 3 ? kCyan : kTextSec,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ),
      ),
      title: Text(name,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right_rounded,
          color: Color(0xFF475569), size: 18),
    );
  }
}

class _ConfigRow extends StatelessWidget {
  final String label;
  final String value;

  const _ConfigRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      title: Text(label,
          style: const TextStyle(
              color: Color(0xFF94A3B8), fontSize: 13)),
      trailing: Text(value,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600)),
    );
  }
}
