import 'package:flutter/material.dart';
import '../../theme.dart';

class ActiveTournamentDetailScreen extends StatelessWidget {
  const ActiveTournamentDetailScreen({super.key});

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
                child: Text('Active Tournament',
                    style: TextStyle(
                        color: Colors.white,
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
                  const Text('LIVE',
                      style: TextStyle(
                          color: Color(0xFF00E676),
                          fontSize: 11,
                          fontWeight: FontWeight.w800)),
                ]),
              ),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              children: [
                // Tournament info card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF00E676).withOpacity(0.08),
                        kBgCard,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: const Color(0xFF00E676).withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    const Text('Weekly Ludo Championship #24',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info('Prize Pool', '₦50,000'),
                        _info('Players', '24/32'),
                        _info('Round', 'Semi-Final'),
                      ],
                    ),
                  ]),
                ),

                const SizedBox(height: 20),

                // Live bracket
                const Text('BRACKET',
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _MatchRow(
                      p1: 'Kofi_92', p2: 'Ada_Flow', score: '2 - 1', live: true),
                  _divider(),
                  _MatchRow(
                      p1: 'Chidi_Goat', p2: 'Bola_King', score: '1 - 0', live: true),
                  _divider(),
                  _MatchRow(
                      p1: 'Emeka_Pro', p2: 'Ngozi_Queen', score: '3 - 2', live: false),
                  _divider(),
                  _MatchRow(
                      p1: 'Tunde_Rush', p2: 'Amara_Win', score: '0 - 0', live: false),
                ]),

                const SizedBox(height: 20),

                // Admin actions
                const Text('ADMIN ACTIONS',
                    style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                const SizedBox(height: 10),
                _SectionCard(children: [
                  _ActionRow(
                    icon: Icons.pause_circle_outline,
                    label: 'Pause Tournament',
                    color: kOrange,
                    onTap: () {},
                  ),
                  _divider(),
                  _ActionRow(
                    icon: Icons.stop_circle_outlined,
                    label: 'Cancel Tournament',
                    color: Colors.redAccent,
                    onTap: () {},
                  ),
                  _divider(),
                  _ActionRow(
                    icon: Icons.edit_outlined,
                    label: 'Edit Settings',
                    color: kCyan,
                    onTap: () {},
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
              fontSize: 15,
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

class _MatchRow extends StatelessWidget {
  final String p1;
  final String p2;
  final String score;
  final bool live;

  const _MatchRow(
      {required this.p1,
      required this.p2,
      required this.score,
      required this.live});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      title: Row(children: [
        Expanded(
            child: Text(p1,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: live
                ? const Color(0xFF00E676).withOpacity(0.12)
                : kBgCardAlt,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(score,
              style: TextStyle(
                  color: live ? const Color(0xFF00E676) : kTextSec,
                  fontSize: 13,
                  fontWeight: FontWeight.w800)),
        ),
        const SizedBox(width: 8),
        if (live)
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: Color(0xFF00E676),
              shape: BoxShape.circle,
            ),
          ),
        const SizedBox(width: 8),
        Expanded(
            child: Text(p2,
                textAlign: TextAlign.end,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600))),
      ]),
    );
  }
}

class _ActionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionRow({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(label,
            style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: Color(0xFF475569), size: 20),
      );
}
