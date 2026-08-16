import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40.w,
                  height: 40.w,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10).r,
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Text('Completed Tournament',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8).r,
                ),
                child: Text('COMPLETED',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w800)),
              ),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0),
              children: [
                // Tournament info
                Container(
                  padding: EdgeInsets.all(16.r),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        kCyan.withOpacity(0.08),
                        context.card,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14).r,
                    border: Border.all(color: kCyan.withOpacity(0.25)),
                  ),
                  child: Column(children: [
                    Text('Whot Championship #8',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17.sp,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 8.h),
                    Text('Completed 2 hours ago',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 12.sp)),
                    SizedBox(height: 12.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _info(context, 'Prize Pool', '\u20A640,000'),
                        _info(context, 'Players', '28'),
                        _info(context, 'Matches', '27'),
                      ],
                    ),
                  ]),
                ),

                SizedBox(height: 20.h),

                // Winners podium
                Text('WINNERS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                Row(
                  children: [
                    _WinnerPodium('2nd', 'Ada_Flow', '\u20A67,000',
                        kCyan, 80),
                    SizedBox(width: 8.w),
                    _WinnerPodium('1st', 'Kofi_92', '\u20A622,000',
                        kOrange, 100),
                    SizedBox(width: 8.w),
                    _WinnerPodium('3rd', 'Chidi_Goat', '\u20A63,000',
                        const Color(0xFF22C55E), 70),
                  ],
                ),

                SizedBox(height: 20.h),

                // Prize distribution
                Text('PRIZE DISTRIBUTION',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _PrizeRow('1st Place', 'Kofi_92', '\u20A622,000', true),
                  _divider(context),
                  _PrizeRow('2nd Place', 'Ada_Flow', '\u20A67,000', false),
                  _divider(context),
                  _PrizeRow('3rd Place', 'Chidi_Goat', '\u20A63,000', false),
                  _divider(context),
                  _PrizeRow('4th Place', 'Bola_King', '\u20A62,000', false),
                  _divider(context),
                  _PrizeRow('5th-8th', 'Various', '\u20A6750 each', false),
                ]),

                SizedBox(height: 20.h),

                // Payout status
                Text('PAYOUT STATUS',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
                _SectionCard(children: [
                  _PayoutRow('Kofi_92', '\u20A622,000', 'paid'),
                  _divider(context),
                  _PayoutRow('Ada_Flow', '\u20A67,000', 'paid'),
                  _divider(context),
                  _PayoutRow('Chidi_Goat', '\u20A63,000', 'pending'),
                  _divider(context),
                  _PayoutRow('Bola_King', '\u20A62,000', 'pending'),
                ]),

                SizedBox(height: 20.h),

                // Match history
                Text('MATCH HISTORY',
                    style: TextStyle(
                        color: context.txtSec,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2)),
                SizedBox(height: 10.h),
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

                SizedBox(height: 32.h),
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
              TextStyle(color: context.txtSec, fontSize: 10.sp)),
      SizedBox(height: 2.h),
      Text(value,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 15.sp,
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
          borderRadius: BorderRadius.circular(12).r,
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
        padding: EdgeInsets.all(12.r),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12).r,
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(children: [
          Container(
            width: 48.w,
            height: 48.w,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
                child: Text(place,
                    style: TextStyle(
                        color: color,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w900))),
          ),
          SizedBox(height: 8.h),
          Text(name,
              style: TextStyle(
                  color: color,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 2.h),
          Text(prize,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w800)),
          SizedBox(height: 6.h),
          Container(
            width: double.infinity,
            height: height,
            decoration: BoxDecoration(
              color: color.withOpacity(0.06),
              borderRadius: BorderRadius.circular(8).r,
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
          EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      leading: Icon(
        isWinner ? Icons.emoji_events : Icons.emoji_events_outlined,
        color: isWinner ? kOrange : kTextSec,
        size: 20.w,
      ),
      title: Text(place,
          style: TextStyle(
              color: isWinner ? kOrange : context.txtPri,
              fontSize: 13.sp,
              fontWeight:
                  isWinner ? FontWeight.w700 : FontWeight.w500)),
      subtitle:
          Text(name, style: TextStyle(color: context.txtSec, fontSize: 11.sp)),
      trailing: Text(amount,
          style: TextStyle(
              color: isWinner ? kOrange : context.txtPri,
              fontSize: 13.sp,
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
          EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      title: Text(name,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13.sp,
              fontWeight: FontWeight.w500)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(amount,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 13.sp,
                fontWeight: FontWeight.w600)),
        SizedBox(width: 8.w),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 3.h),
          decoration: BoxDecoration(
            color: paid
                ? const Color(0xFF22C55E).withOpacity(0.12)
                : kOrange.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4).r,
          ),
          child: Text(status.toUpperCase(),
              style: TextStyle(
                  color: paid ? const Color(0xFF22C55E) : kOrange,
                  fontSize: 9.sp,
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
          EdgeInsets.symmetric(horizontal: 14.w, vertical: 2.h),
      leading: Container(
        padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 3.h),
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.08),
          borderRadius: BorderRadius.circular(4).r,
        ),
        child: Text(round.split(' ').first,
            style: TextStyle(
                color: kCyan, fontSize: 9.sp, fontWeight: FontWeight.w600)),
      ),
      title: Text('$p1  vs  $p2',
          style: TextStyle(
              color: context.txtPri,
              fontSize: 12.sp,
              fontWeight: FontWeight.w500)),
      trailing: Text(score,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 13.sp,
              fontWeight: FontWeight.w800)),
    );
  }
}
