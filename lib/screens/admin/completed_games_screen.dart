import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
              Text('Completed Games',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Filter chips
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                _filterChip(context, 'All', true),
                SizedBox(width: 8.w),
                _filterChip(context, 'Ayo', false),
                SizedBox(width: 8.w),
                _filterChip(context, 'Ludo', false),
                SizedBox(width: 8.w),
                _filterChip(context, 'Whot', false),
                SizedBox(width: 8.w),
                _filterChip(context, 'Draughts', false),
              ]),
            ),
          ),

          SizedBox(height: 12.h),

          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
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
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 7.h),
      decoration: BoxDecoration(
        color: selected ? kCyan.withOpacity(0.15) : context.card,
        borderRadius: BorderRadius.circular(20).r,
        border: Border.all(
          color: selected ? kCyan : context.border,
        ),
      ),
      child: Text(label,
          style: TextStyle(
              color: selected ? kCyan : context.txtSec,
              fontSize: 12.sp,
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
        '\u20A6${prize.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12).r,
        border: Border.all(color: context.border),
      ),
      child: Column(children: [
        Row(children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
            decoration: BoxDecoration(
              color: kCyan.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4).r,
            ),
            child: Text(game,
                style: TextStyle(
                    color: kCyan,
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w600)),
          ),
          const Spacer(),
          Text(formatted,
              style: TextStyle(
                  color: kOrange,
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w800)),
        ]),
        SizedBox(height: 12.h),
        Row(children: [
          // Player 1
          Expanded(
            child: Row(children: [
              Container(
                width: 32.w,
                height: 32.w,
                decoration: BoxDecoration(
                  color: p1Won
                      ? const Color(0xFF22C55E).withOpacity(0.12)
                      : kCyan.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.person_outline,
                    color: p1Won ? const Color(0xFF22C55E) : kCyan,
                    size: 18.w),
              ),
              SizedBox(width: 8.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(player1,
                        style: TextStyle(
                            color:
                                p1Won ? const Color(0xFF22C55E) : context.txtPri,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w600)),
                    if (p1Won)
                      Text('WINNER',
                          style: TextStyle(
                              color: const Color(0xFF22C55E),
                              fontSize: 8.sp,
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
                  fontSize: 11.sp,
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
                                ? const Color(0xFF22C55E)
                                : context.txtPri,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w600)),
                    if (!p1Won)
                      Text('WINNER',
                          style: TextStyle(
                              color: const Color(0xFF22C55E),
                              fontSize: 8.sp,
                              fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              SizedBox(width: 8.w),
              Container(
                width: 32.w,
                height: 32.w,
                decoration: BoxDecoration(
                  color: !p1Won
                      ? const Color(0xFF22C55E).withOpacity(0.12)
                      : kCyan.withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.person_outline,
                    color: !p1Won ? const Color(0xFF22C55E) : kCyan,
                    size: 18.w),
              ),
            ]),
          ),
        ]),
        SizedBox(height: 8.h),
        Align(
          alignment: Alignment.centerRight,
          child: Text(timeAgo,
              style: TextStyle(
                  color: context.txtSec, fontSize: 10.sp)),
        ),
      ]),
    );
  }
}
