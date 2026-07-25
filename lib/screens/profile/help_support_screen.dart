import 'package:flutter/material.dart';
import '../../theme.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  int? _expandedFaq;

  final _faqs = const [
    {
      'q': 'How do I earn coins on Gamearn?',
      'a':
          'You earn coins by winning games (Ludo, Ayo, Whot, Draughts), completing daily streaks, winning tournaments, and referring friends. Coins can be used to enter tournaments or withdrawn as cash.',
    },
    {
      'q': 'How do I withdraw my earnings?',
      'a':
          'Go to Wallet → Cash Out. Enter the amount, select your bank account, and confirm. Withdrawals are processed within 24 hours via bank transfer.',
    },
    {
      'q': 'What payment methods are supported?',
      'a':
          'We support bank transfers, debit/credit cards (Visa, Mastercard), and USSD payments. All payments are processed securely through Flutterwave.',
    },
    {
      'q': 'How do tournaments work?',
      'a':
          'Tournaments are competitive events where players pay an entry fee to compete for a prize pool. Join a tournament, play your matches, and climb the leaderboard to win.',
    },
    {
      'q': 'My account was flagged for suspension. Why?',
      'a':
          'Accounts may be flagged for suspicious activity, multiple accounts, or fair play violations. Contact support with your account details for a review.',
    },
    {
      'q': 'How do I enable two-factor authentication?',
      'a':
          'Go to Profile → Settings → Account Security → Enable 2FA. Scan the QR code with an authenticator app (Google Authenticator, Authy) and enter the verification code.',
    },
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFF0B0E1A),
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
                const Text('Help & Support',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ]),
            ),

            const SizedBox(height: 20),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // Search bar
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: const Row(children: [
                      Icon(Icons.search_outlined,
                          color: Color(0xFF64748B), size: 20),
                      SizedBox(width: 10),
                      Text('Search for help...',
                          style: TextStyle(
                              color: Color(0xFF64748B), fontSize: 14)),
                    ]),
                  ),
                  const SizedBox(height: 20),

                  // FAQs
                  _sectionLabel('Frequently Asked Questions'),
                  ...List.generate(_faqs.length, (i) {
                    final expanded = _expandedFaq == i;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Theme(
                        data: Theme.of(context)
                            .copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          tilePadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 2),
                          childrenPadding: const EdgeInsets.fromLTRB(
                              14, 0, 14, 14),
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: kCyan.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.help_outline_rounded,
                                color: kCyan, size: 20),
                          ),
                          title: Text(_faqs[i]['q']!,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600)),
                          trailing: Icon(
                            expanded
                                ? Icons.keyboard_arrow_up_rounded
                                : Icons.keyboard_arrow_down_rounded,
                            color: const Color(0xFF64748B),
                          ),
                          onExpansionChanged: (open) {
                            setState(
                                () => _expandedFaq = open ? i : null);
                          },
                          children: [
                            Text(_faqs[i]['a']!,
                                style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 13,
                                    height: 1.5)),
                          ],
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 14),

                  // Contact section
                  _sectionLabel('Contact Us'),
                  _SectionCard(children: [
                    _ContactRow(
                      icon: Icons.email_outlined,
                      label: 'Email Support',
                      subtitle: 'support@gamearn.com',
                      onTap: () {
                        // TODO: launch email
                      },
                    ),
                    _divider(),
                    _ContactRow(
                      icon: Icons.chat_bubble_outline_rounded,
                      label: 'Live Chat',
                      subtitle: 'Available 9am - 6pm WAT',
                      onTap: () {
                        // TODO: open chat
                      },
                    ),
                    _divider(),
                    _ContactRow(
                      icon: Icons.bug_report_outlined,
                      label: 'Report a Bug',
                      subtitle: 'Help us improve Gamearn',
                      onTap: () {
                        // TODO: bug report form
                      },
                    ),
                  ]),

                  const SizedBox(height: 14),

                  // Social links
                  _sectionLabel('Community'),
                  _SectionCard(children: [
                    _ContactRow(
                      icon: Icons.language_outlined,
                      label: 'Visit our Website',
                      onTap: () {
                        // TODO: launch URL
                      },
                    ),
                    _divider(),
                    _ContactRow(
                      icon: Icons.group_outlined,
                      label: 'Join our Discord',
                      onTap: () {
                        // TODO: launch Discord
                      },
                    ),
                  ]),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ]),
        ),
      );

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 8),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2)),
      );

  Widget _divider() =>
      const Divider(height: 1, indent: 72, color: Color(0xFF334155));
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(children: children),
      );
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  const _ContactRow({
    required this.icon,
    required this.label,
    this.subtitle,
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
            color: kCyan,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF0B0E1A), size: 20),
        ),
        title: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
        subtitle: subtitle != null
            ? Text(subtitle!,
                style:
                    const TextStyle(color: Color(0xFF64748B), fontSize: 11))
            : null,
        trailing: const Icon(Icons.chevron_right_rounded,
            color: Color(0xFF475569), size: 20),
      );
}
