import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

class LiveUsersScreen extends StatelessWidget {
  const LiveUsersScreen({super.key});

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
                child: Text('Live Users',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17.sp,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8).r,
                ),
                child: Row(children: [
                  Container(
                    width: 7.w,
                    height: 7.w,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E),
                      shape: BoxShape.circle,
                    ),
                  ),
                  SizedBox(width: 6.w),
                  Text('1,203 online',
                      style: TextStyle(
                          color: const Color(0xFF22C55E),
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w700)),
                ]),
              ),
            ]),
          ),

          // Game breakdown
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0),
            child: Row(children: [
              _gameChip('Ayo', '342', kCyan),
              SizedBox(width: 8.w),
              _gameChip('Ludo', '498', kOrange),
              SizedBox(width: 8.w),
              _gameChip('Whot', '218', const Color(0xFF22C55E)),
              SizedBox(width: 8.w),
              _gameChip('Draughts', '145', kYellowDot),
            ]),
          ),

          SizedBox(height: 16.h),

          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              itemCount: 25,
              itemBuilder: (ctx, i) => _LiveUserRow(
                name: 'Player ${5000 - i * 20}',
                game: ['Ayo', 'Ludo', 'Whot', 'Draughts'][i % 4],
                duration: '${15 + i * 3}m',
                opponent: 'Player ${4999 - i * 20}',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _gameChip(String game, String count, Color color) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 8.h),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8).r,
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Column(children: [
          Text(count,
              style: TextStyle(
                  color: color,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w800)),
          SizedBox(height: 2.h),
          Text(game,
              style: TextStyle(color: color, fontSize: 10.sp)),
        ]),
      ),
    );
  }
}

class _LiveUserRow extends StatelessWidget {
  final String name;
  final String game;
  final String duration;
  final String opponent;

  const _LiveUserRow({
    required this.name,
    required this.game,
    required this.duration,
    required this.opponent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(10).r,
        border: Border.all(color: context.border),
      ),
      child: Row(children: [
        // Live indicator
        Container(
          width: 8.w,
          height: 8.w,
          decoration: const BoxDecoration(
            color: Color(0xFF22C55E),
            shape: BoxShape.circle,
          ),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600)),
              Text('vs $opponent',
                  style: TextStyle(
                      color: context.txtSec, fontSize: 11.sp)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding:
                  EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
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
            SizedBox(height: 3.h),
            Text(duration,
                style: TextStyle(
                    color: context.txtSec, fontSize: 10.sp)),
          ],
        ),
      ]),
    );
  }
}
