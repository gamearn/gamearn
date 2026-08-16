import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40.w,
                  height: 40.h,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10.r),
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Text('Tournament Overview',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Filter tabs
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0.h),
            child: Row(children: [
              _tab(context, 'Live', true, const Color(0xFF22C55E)),
              SizedBox(width: 8.w),
              _tab(context, 'Upcoming', false, kOrange),
              SizedBox(width: 8.w),
              _tab(context, 'Completed', false, kCyan),
            ]),
          ),

          SizedBox(height: 12.h),

          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
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
        padding: EdgeInsets.symmetric(vertical: 10.h),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.15) : context.card,
          borderRadius: BorderRadius.circular(10.r),
          border: Border.all(
            color: selected ? color : context.border,
          ),
        ),
        child: Center(
          child: Text(label,
              style: TextStyle(
                  color: selected ? color : context.txtSec,
                  fontSize: 13.sp,
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
        ? const Color(0xFF22C55E)
        : isCompleted
            ? kCyan
            : kOrange;
    final formatted =
        '₦${prizePool.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: isLive ? statusColor.withOpacity(0.3) : context.border,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Text(name,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w700)),
          const Spacer(),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(4.r),
            ),
            child: Text(status.toUpperCase(),
                style: TextStyle(
                    color: statusColor,
                    fontSize: 9.sp,
                    fontWeight: FontWeight.w800)),
          ),
        ]),
        SizedBox(height: 10.h),
        Row(children: [
          _info(context, 'Game', game),
          SizedBox(width: 16.w),
          _info(context, 'Prize', formatted),
          SizedBox(width: 16.w),
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
                TextStyle(color: context.txtSec, fontSize: 10.sp)),
        Text(value,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 12.sp,
                fontWeight: FontWeight.w600)),
      ],
    );
  }
}
