import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  WITHDRAWAL MANAGEMENT SCREEN — Figma matched (2573:4542, 390×844)
//
//  Header: Frame 56 · "QUEUE STATUS" fs10 cyan · "PENDING REQUESTS"
//    fs32 white · stat cards 163×79 (#16223F@0.6, colored stroke):
//    TOTAL PENDING fs24 cyan / VOLUME "$12,450" fs24 gold #FFC107 ·
//    list items 342×145 #16223F@0.6 stroke #334155 r8: avatar 56 ·
//    username fs18 · date fs12 @0.5 · "REQUESTED" fs10 @0.5 +
//    "$450.00" fs20 gold · Approve/Reject 88×40 · RECENT LOGS feed
//    (#22D1EE@0.2 stroke, dot + fs14 cyan, log rows fs12 @0.6)
//  Backend: mock queue (no `withdrawals` collection yet).
// ════════════════════════════════════════════════════════════════

class WithdrawalManagementScreen extends StatefulWidget {
  const WithdrawalManagementScreen({super.key});

  @override
  State<WithdrawalManagementScreen> createState() =>
      _WithdrawalManagementScreenState();
}

class _WithdrawalManagementScreenState extends State<WithdrawalManagementScreen> {
  final List<_PendingRequest> _requests = [
    _PendingRequest('NeonRider_99', 'Oct 24, 2023 • 14:22', 450.00),
    _PendingRequest('CyberKng', 'Oct 24, 2023 • 13:05', 1200.00),
    _PendingRequest('PixelQueen', 'Oct 23, 2023 • 23:58', 85.20),
    _PendingRequest('DataGhost', 'Oct 23, 2023 • 19:40', 2150.00),
  ];

  double get _totalPending => _requests.fold(0, (s, r) => s + r.amount);

  void _resolve(int i) {
    setState(() => _requests.removeAt(i));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // ── HEADER — Figma Frame 56 ────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 36.w, height: 36.h,
                  decoration: BoxDecoration(
                    color: context.card,
                    shape: BoxShape.circle,
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.close_rounded,
                      color: Color(0xFFF1F5F9), size: 20.w),
                ),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Center(
                  child: Text('Withdrawal Management',
                      style: TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontSize: 18.sp, fontWeight: FontWeight.w700)),
                ),
              ),
              SizedBox(width: 36.w),
            ]),
          ),
          Container(height: 1, color: const Color(0x4DFFFFFF)),

          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 32.h),
              children: [
                // ── QUEUE STATUS ────────────────────────────────────
                Text('QUEUE STATUS',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 10.sp, fontWeight: FontWeight.w700)),
                SizedBox(height: 4.h),
                Text('PENDING REQUESTS',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 32.sp, fontWeight: FontWeight.w700)),
                SizedBox(height: 14.h),

                // ── STAT CARDS — 163×79 ──────────────────────────────
                Row(children: [
                  Expanded(
                    child: _statCard(
                      label: 'TOTAL PENDING',
                      value: '${_requests.length}',
                      color: kCyan,
                      stroke: kCyan,
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: _statCard(
                      label: 'VOLUME',
                      value: '\$${_fmt(_totalPending)}',
                      color: const Color(0xFFFFC107),
                      stroke: const Color(0xFFFFC107),
                    ),
                  ),
                ]),
                SizedBox(height: 24.h),

                // ── PENDING LIST ─────────────────────────────────────
                for (var i = 0; i < _requests.length; i++)
                  _requestCard(i, _requests[i]),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _statCard({
    required String label,
    required String value,
    required Color color,
    required Color stroke,
  }) {
    return Container(
      height: 79.h,
      padding: EdgeInsets.symmetric(horizontal: 20.w),
      decoration: BoxDecoration(
        color: const Color(0x9916223F),
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: stroke, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              style: TextStyle(
                  color: Color(0x80FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          SizedBox(height: 4.h),
          Text(value,
              style: TextStyle(
                  color: color,
                  fontSize: 24.sp, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _requestCard(int index, _PendingRequest r) {
    return Container(
      height: 145.h,
      margin: EdgeInsets.only(bottom: 24.h),
      padding: EdgeInsets.all(17.r),
      decoration: BoxDecoration(
        color: const Color(0x9916223F),
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: const Color(0xFF334155), width: 1),
      ),
      child: Column(children: [
        // Header row
        Row(children: [
          Container(
            width: 56.w, height: 56.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kCyan.withOpacity(0.15),
            ),
            child: Center(
              child: Text(r.initial,
                  style: TextStyle(
                      color: kCyan,
                      fontSize: 20.sp, fontWeight: FontWeight.w700)),
            ),
          ),
          SizedBox(width: 16.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.username,
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 18.sp, fontWeight: FontWeight.w700)),
                SizedBox(height: 2.h),
                Text(r.date,
                    style: TextStyle(
                        color: Color(0x80FFFFFF), fontSize: 12.sp)),
              ],
            ),
          ),
        ]),
        SizedBox(height: 18.h),
        // Bottom row
        Row(children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('REQUESTED',
                  style: TextStyle(
                      color: Color(0x80FFFFFF),
                      fontSize: 10.sp, fontWeight: FontWeight.w700)),
              Text('\$${r.amount.toStringAsFixed(2)}',
                  style: TextStyle(
                      color: Color(0xFFFFC107),
                      fontSize: 20.sp, fontWeight: FontWeight.w700)),
            ],
          ),
          const Spacer(),
          SizedBox(
            width: 88.w, height: 40.h,
            child: ElevatedButton(
              onPressed: () => _resolve(index),
              style: ElevatedButton.styleFrom(
                backgroundColor: kCyan,
                foregroundColor: const Color(0xFF0B0E1A),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.r)),
              ),
              child: Text('Approve',
                  style: TextStyle(
                      fontSize: 12.sp, fontWeight: FontWeight.w700)),
            ),
          ),
          SizedBox(width: 8.w),
          SizedBox(
            width: 88.w, height: 40.h,
            child: OutlinedButton(
              onPressed: () => _resolve(index),
              style: OutlinedButton.styleFrom(
                foregroundColor: kOrange,
                side: const BorderSide(color: kOrange),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.r)),
              ),
              child: Text('Reject',
                  style: TextStyle(
                      fontSize: 12.sp, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
      ]),
    );
  }

  String _fmt(double v) {
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(2);
  }
}

class _PendingRequest {
  final String username;
  final String date;
  final double amount;

  _PendingRequest(this.username, this.date, this.amount);

  String get initial => username.isEmpty ? '?' : username[0].toUpperCase();
}
