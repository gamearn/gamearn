import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  LEGAL CONTENT SCREEN
//
//  Reusable in-app viewer for Terms & Conditions and Privacy Policy.
//  Open one by passing a [LegalDoc]. Content is grouped into
//  [{heading, body}] sections rendered as cyan-accented cards.
//
//  NOTE: The legal text below is a starting template. Have it
//  reviewed by counsel and tailor it to Gamearn's real practices
//  before relying on it.
// ════════════════════════════════════════════════════════════════

/// Which legal document to display.
enum LegalDoc { terms, privacy }

/// A single titled block of legal text.
class _LegalSection {
  final String heading;
  final String body;
  const _LegalSection(this.heading, this.body);
}

class LegalContentScreen extends StatelessWidget {
  final LegalDoc doc;
  const LegalContentScreen({super.key, required this.doc});

  String get _title => doc == LegalDoc.terms
      ? 'Terms & Conditions'
      : 'Privacy Policy';

  List<_LegalSection> get _sections => doc == LegalDoc.terms
      ? _termsSections
      : _privacySections;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
        // Header
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
              child: Text(_title,
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
            padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
            children: [
              Container(
                padding: EdgeInsets.all(24.r),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Effective date: 1 September 2026',
                          style: TextStyle(
                              color: kCyan, fontSize: 12.sp,
                              fontWeight: FontWeight.w500)),
                      SizedBox(height: 16.h),
                      for (final s in _sections) ...[
                        if (s != _sections.first) SizedBox(height: 20.h),
                        Text(s.heading,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w700)),
                        SizedBox(height: 8.h),
                        Text(s.body,
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 13.sp,
                                fontWeight: FontWeight.w400,
                                height: 1.6)),
                      ],
                    ]),
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ]),
    ),
  );
}

const List<_LegalSection> _termsSections = [
  _LegalSection('1. Acceptance of Terms',
      'By creating an account or using Gamearn, you agree to these Terms and '
      'Conditions and our Privacy Policy. If you do not agree, do not use the '
      'app.'),
  _LegalSection('2. Eligibility',
      'You must be at least 18 years old, or the legal age of majority in your '
      'jurisdiction, to play for real money on Gamearn. You must comply with '
      'all laws and regulations governing online play and payments where you '
      'live.'),
  _LegalSection('3. Real-Money Play',
      'You may buy coins, enter paid tournaments and games, and be credited '
      'winnings on the accounts and payment methods you provide. All winnings '
      'and payouts are subject to verification and to the payment processors '
      'we use. You are responsible for any taxes on winnings under your laws.'),
  _LegalSection('4. Account & Security',
      'You are responsible for keeping your login credentials and account '
      'secure. You may not share, sell, or transfer your account to anyone '
      'else. Notify us immediately of any unauthorised use.'),
  _LegalSection('5. Fair Play',
      'Collusion, botting, abuse, chargeback fraud, or any attempt to '
      'manipulate games, tournaments, or rewards is prohibited and may result '
      'in suspension, forfeiture of balance, or permanent ban.'),
  _LegalSection('6. Payments & Refunds',
      'Purchases are final once delivered. Refunds are handled by the relevant '
      'payment provider and are not guaranteed after coins or entries are '
      'credited.'),
  _LegalSection('7. Intellectual Property',
      'The Gamearn name, logos, and app content are our property or the '
      'property of our licensors. You may not copy, modify, or resell them.'),
  _LegalSection('8. Termination & Deletion',
      'You may delete your account at any time in Settings. We may suspend or '
      'terminate accounts that violate these Terms. Deleting your account '
      'permanently removes your data and balance as described in our Privacy '
      'Policy.'),
  _LegalSection('9. Limitation of Liability',
      'To the maximum extent permitted by law, Gamearn and its partners are not '
      'liable for indirect, incidental, or consequential damages arising from '
      'your use of the app.'),
  _LegalSection('10. Changes to These Terms',
      'We may update these Terms from time to time. Material changes will be '
      'notified in the app. Continued use after changes means you accept the '
      'updated Terms.'),
];

const List<_LegalSection> _privacySections = [
  _LegalSection('1. Information We Collect',
      'We collect information you provide (name, email, phone), data from '
      'social sign-in when you choose it, and technical data such as device '
      'type, IP address, and app usage. For real-money play we process '
      'payments through trusted providers and do not store your full card '
      'details.'),
  _LegalSection('2. How We Use Information',
      'We use your information to operate your account, process payments and '
      'payouts, run games and tournaments, prevent fraud, comply with legal '
      'obligations, and improve the app. With your consent we may send '
      'promotional communications.'),
  _LegalSection('3. Advertising',
      'We use third-party advertising services, including Google AdMob, to '
      'serve ads. These providers may use device identifiers to deliver '
      'relevant ads and measure performance. You can opt out of personalised '
      'ads through your device settings.'),
  _LegalSection('4. Sharing of Information',
      'We do not sell your personal information. We share data only with '
      'service providers who help us operate (payments, hosting, analytics, '
      'ads, fraud prevention) and where required by law or to protect rights '
      'and safety.'),
  _LegalSection('5. Data Storage & Security',
      'Your data is stored securely in the cloud and protected with industry-'
      'standard safeguards. While we take reasonable measures to protect your '
      'data, no method of transmission or storage is completely secure.'),
  _LegalSection('6. Your Rights',
      'You may access, correct, or request deletion of your personal data. To '
      'delete your account, use the Delete Account option in Settings. You may '
      'also contact us to exercise your privacy rights.'),
  _LegalSection('7. Data Retention',
      'We retain your data for as long as your account is active or as needed '
      'to provide services, comply with legal obligations, resolve disputes, '
      'and enforce agreements.'),
  _LegalSection('8. Children’s Privacy',
      'Gamearn is not intended for users under 18 or the legal age of '
      'majority where they live. We do not knowingly collect personal '
      'information from children.'),
  _LegalSection('9. Contact Us',
      'If you have questions about these policies, please contact us at '
      'support@gamearn.gg.'),
];
