import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  HELP & SUPPORT SCREEN — Figma matched (2095:2847, 390×844)
//
//  Hero: "Center of Operations" fs12 w700 #22D1EE · "HOW CAN WE
//    HELP YOU?" fs48 w700 · Tournament Rules card 342×320
//    #22D1EE@10 (icon 135×143, title fs20 w700, body fs16
//    #FFFFFF@60)
//  Topics: card 342×136 #22D1EE@5 (payments) · 342×102 #22D1EE@5
//    (Account Recovery fs16 w600) · 342×106 #22D1EE@5 (support)
//  FAQ: "Frequently Asked" fs24 w700 + "View All" fs12 #22D1EE ·
//    items 342×var #22D1EE@10
// ════════════════════════════════════════════════════════════════

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  int? _expandedFaq;

  final _faqs = const [
    {
      'q': 'How do I enter a tournament?',
      'a':
          'Open the Tournaments tab, pick a tournament, tap PAY & JOIN and confirm your entry fee from your wallet balance.',
    },
    {
      'q': 'When do I get my winnings?',
      'a':
          'Winnings are credited to your wallet immediately after the tournament ends and the leaderboard is verified.',
    },
    {
      'q': 'What are the rules of each game?',
      'a':
          'Fair play and scoring rules are listed in the Tournament Rules section above. Violations may lead to disqualification.',
    },
    {
      'q': 'How do I withdraw my earnings?',
      'a':
          'Go to Wallet → Cash Out, enter the amount, select your bank account and confirm. Transfers process within 24 hours.',
    },
    {
      'q': 'My account was flagged. What do I do?',
      'a':
          'Contact support from this page with your username. Our team reviews flagged accounts within 48 hours.',
    },
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
        // Header — Figma Frame 56
        Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
          decoration: BoxDecoration(
            color: context.bg,
            border: Border(bottom: BorderSide(color: context.border, width: 1)),
          ),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Icon(Icons.close_rounded,
                  color: context.txtPri, size: 20.w),
            ),
            Expanded(
              child: Text('Help & Support',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 18.sp, fontWeight: FontWeight.w700)),
            ),
            SizedBox(width: 20.w),
          ]),
        ),

        Expanded(
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            children: [

              SizedBox(height: 32.h),

              // ── HERO ──────────────────────────────────────────────────
              Text('Center of Operations',
                  style: TextStyle(
                      color: kCyan, fontSize: 12.sp,
                      fontWeight: FontWeight.w700)),
              SizedBox(height: 8.h),
              Text('HOW CAN WE\nHELP YOU?',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 38.sp, fontWeight: FontWeight.w700,
                      height: 1.1)),
              SizedBox(height: 20.h),

              // Tournament Rules card — Figma: 342×320 rx12 pad[32,32,32,32]
              Container(
                padding: EdgeInsets.all(32.r),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 72.w, height: 72.h,
                      decoration: BoxDecoration(
                        color: kCyan.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20.r),
                      ),
                      child: Icon(Icons.emoji_events_outlined,
                          color: kCyan, size: 40.w),
                    ),
                    SizedBox(height: 18.h),
                    Text('Tournament Rules',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 20.sp, fontWeight: FontWeight.w700)),
                    SizedBox(height: 8.h),
                    Text(
                      'Master the arena. Everything you\nneed to know about fair play and\nscoring.',
                      style: TextStyle(
                          color: context.txtSec, fontSize: 16.sp,
                          fontWeight: FontWeight.w400, height: 1.45),
                    ),
                  ],
                ),
              ),

              SizedBox(height: 24.h),

              // ── TOPIC CARDS ───────────────────────────────────────────
              _TopicCard(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Payments & Withdrawals',
                sub: 'Secure withdrawals and credit\nprocessing.',
              ),
              SizedBox(height: 12.h),
              _TopicCard(
                icon: Icons.restore_outlined,
                title: 'Account Recovery',
                sub: 'Reset your password or recover a\nlocked account.',
                compact: true,
              ),
              SizedBox(height: 12.h),
              _TopicCard(
                icon: Icons.support_agent_outlined,
                title: 'Game Support',
                sub: 'Report a bug or talk to our\nsupport team.',
                compact: true,
              ),

              SizedBox(height: 24.h),

              // ── FAQ — Figma: "Frequently Asked" fs24 w700 CENTER ────
              Text('Frequently Asked',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24.sp, fontWeight: FontWeight.w700)),
              SizedBox(height: 14.h),

              ...List.generate(_faqs.length, (i) {
                final expanded = _expandedFaq == i;
                return Container(
                  margin: EdgeInsets.only(bottom: 12.h),
                  decoration: BoxDecoration(
                    color: kCyan.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Theme(
                    data: Theme.of(context)
                        .copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      tilePadding: EdgeInsets.symmetric(
                          horizontal: 16.w, vertical: 2.h),
                      childrenPadding:
                          EdgeInsets.fromLTRB(16.w, 0.h, 16.w, 16.h),
                      title: Text(_faqs[i]['q']!,
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600)),
                      trailing: Icon(
                        expanded
                            ? Icons.keyboard_arrow_up_rounded
                            : Icons.keyboard_arrow_down_rounded,
                        color: context.txtSec,
                      ),
                      onExpansionChanged: (open) {
                        setState(() =>
                            _expandedFaq = open ? i : null);
                      },
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(_faqs[i]['a']!,
                              style: TextStyle(
                                  color: context.txtSec,
                                  fontSize: 13.sp, height: 1.5)),
                        ),
                      ],
                    ),
                  ),
                );
              }),

              SizedBox(height: 32.h),
            ],
          ),
        ),
      ]),
    ),
  );
}

// ── TOPIC CARD — Figma: 342×136/102 #22D1EE@5 ────────────────────
class _TopicCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final bool compact;

  const _TopicCard({
    required this.icon,
    required this.title,
    required this.sub,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.symmetric(
        horizontal: (compact ? 16 : 16).w, vertical: (compact ? 24 : 16).h),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.05),
      borderRadius: BorderRadius.circular(8.r),
    ),
    child: Row(children: [
      Container(
        width: 48.w, height: 48.h,
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Icon(icon, color: kCyan, size: 24.w),
      ),
      SizedBox(width: 16.w),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 16.sp, fontWeight: FontWeight.w600)),
            SizedBox(height: 4.h),
            Text(sub,
                style: TextStyle(
                    color: context.txtSec, fontSize: 12.sp,
                    fontWeight: FontWeight.w500, height: 1.4)),
          ],
        ),
      ),
      Icon(Icons.chevron_right_rounded, color: context.txtSec),
    ]),
  );
}
