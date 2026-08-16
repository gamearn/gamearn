import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  TRANSACTIONS OVERVIEW SCREEN — Figma matched (2652:1910, 390×844)
//
//  Header Frame 56 · "SECURITY LEVEL: OMEGA" fs10 cyan@0.8 + dot
//    #00F2FF · "TOTAL TRANSACTIONS" fs32 · sync bar 342×32
//    #16223F@0.6 stroke cyan@0.1 ("REAL-TIME SYNC: ACTIVE") · search
//    244×40 + FILTER 94×40 · stat cards 163×99 #16223F@0.6 stroke
//    cyan@0.2: VOL_24H cyan / ACTIVE_NODES white / AVG_FEE gold /
//    NETWORK_LOAD white · tx cards 342×273 #16223F@0.4 r12: avatar
//    40×40 #004D52 · id chip 74×22 #22D1EE@0.1 · amount fs18 gold ·
//    type chips (DEPOSIT cyan / WITHDRAWAL #94A3B8) · status pills
//    (ACTIVE #00F2FF / APPROVED cyan / PENDING gold / REJECTED
//    #93000A+#FFB4AB) · timestamp orange · pagination 1 2 3
//  Backend: mock list (no `transactions` admin collection yet).
// ════════════════════════════════════════════════════════════════

class TransactionsOverviewScreen extends StatelessWidget {
  const TransactionsOverviewScreen({super.key});

  static const _bright = Color(0xFF00F2FF);
  static const _gold = Color(0xFFFFC107);
  static const _slate = Color(0xFF94A3B8);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // ── HEADER — Figma Frame 56 ───────────────────────────────
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
                  child: Text('Transactions Overview',
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
              padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 32.h),
              children: [
                // ── SECURITY LEVEL ───────────────────────────────────
                Row(children: [
                  Text('SECURITY LEVEL: OMEGA',
                      style: TextStyle(
                          color: Color(0xCC22D1EE),
                          fontSize: 10.sp, fontWeight: FontWeight.w700)),
                  SizedBox(width: 6.w),
                  Container(
                    width: 8.w, height: 8.h,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: _bright,
                    ),
                  ),
                ]),
                SizedBox(height: 2.h),
                Text('TOTAL TRANSACTIONS',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 32.sp, fontWeight: FontWeight.w700)),
                SizedBox(height: 12.h),

                // ── REAL-TIME SYNC bar ───────────────────────────────
                Container(
                  height: 32.h,
                  padding: EdgeInsets.symmetric(horizontal: 17.w),
                  decoration: BoxDecoration(
                    color: const Color(0x9916223F),
                    borderRadius: BorderRadius.circular(4.r),
                    border:
                        Border.all(color: kCyan.withOpacity(0.1)),
                  ),
                  child: Row(children: [
                    Icon(Icons.circle, color: kCyan, size: 11.w),
                    SizedBox(width: 8.w),
                    Text('REAL-TIME SYNC: ACTIVE',
                        style: TextStyle(
                            color: Color(0x80FFFFFF),
                            fontSize: 10.sp, fontWeight: FontWeight.w700)),
                  ]),
                ),
                SizedBox(height: 14.h),

                // ── SEARCH + FILTER ──────────────────────────────────
                Row(children: [
                  Expanded(
                    child: Container(
                      height: 40.h,
                      padding: EdgeInsets.symmetric(horizontal: 12.w),
                      decoration: BoxDecoration(
                        color: const Color(0x9916223F),
                        borderRadius: BorderRadius.circular(8.r),
                        border: Border.all(
                            color: const Color(0xFF1E2E56)),
                      ),
                      child: Row(children: [
                        Icon(Icons.search_rounded,
                            color: kCyan.withOpacity(0.5), size: 18.w),
                        SizedBox(width: 8.w),
                        Expanded(
                          child: Text('SEARCH BY USERNAME OR ID...',
                              style: TextStyle(
                                  color: Color(0x66FFFFFF),
                                  fontSize: 12.sp, fontWeight: FontWeight.w500)),
                        ),
                      ]),
                    ),
                  ),
                  SizedBox(width: 10.w),
                  Container(
                    height: 40.h,
                    padding: EdgeInsets.symmetric(horizontal: 12.w),
                    decoration: BoxDecoration(
                      color: const Color(0x9916223F),
                      borderRadius: BorderRadius.circular(8.r),
                      border: Border.all(color: const Color(0xFF1E2E56)),
                    ),
                    child: Row(children: [
                      Icon(Icons.tune_rounded,
                          color: kCyan.withOpacity(0.5), size: 18.w),
                      SizedBox(width: 6.w),
                      Text('FILTER',
                          style: TextStyle(
                              color: Color(0x66FFFFFF),
                              fontSize: 12.sp, fontWeight: FontWeight.w500)),
                    ]),
                  ),
                ]),
                SizedBox(height: 16.h),

                // ── STAT CARDS 2×2 ───────────────────────────────────
                Row(children: [
                  Expanded(child: _statCard('VOL_24H', '\$492,031',
                      kCyan, trailing: _trend('+12.4%', _green))),
                  SizedBox(width: 16.w),
                  Expanded(child: _statCard('ACTIVE_NODES', '1,842',
                      Colors.white, trailing: _tag('STABLE', kCyan))),
                ]),
                SizedBox(height: 16.h),
                Row(children: [
                  Expanded(child: _statCard('AVG_FEE', '0.0024',
                      _gold, trailing: Text('CYAN_UNITS',
                          style: TextStyle(
                              color: _slate,
                              fontSize: 10.sp, fontWeight: FontWeight.w400)))),
                  SizedBox(width: 16.w),
                  Expanded(child: _statCard('NETWORK_LOAD', '42%',
                      Colors.white, trailing: _tag('OPTIMAL', kCyan))),
                ]),
                SizedBox(height: 24.h),

                // ── TX CARDS ─────────────────────────────────────────
                for (final tx in _txs) _txCard(tx),
                SizedBox(height: 8.h),

                // ── PAGINATION ───────────────────────────────────────
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  _pageBtn(Icons.chevron_left_rounded, stroke: true),
                  SizedBox(width: 12.w),
                  _pageNum('1', active: true),
                  SizedBox(width: 8.w),
                  _pageNum('2'),
                  SizedBox(width: 8.w),
                  _pageNum('3'),
                  SizedBox(width: 12.w),
                  _pageBtn(Icons.chevron_right_rounded, stroke: true),
                ]),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _statCard(String label, String value, Color color,
      {Widget? trailing}) {
    return Container(
      height: 99.h,
      padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 0.h),
      decoration: BoxDecoration(
        color: const Color(0x9916223F),
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: kCyan.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: Color(0x80FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          SizedBox(height: 4.h),
          Text(value,
              style: TextStyle(
                  color: color,
                  fontSize: 20.sp, fontWeight: FontWeight.w700)),
          SizedBox(height: 6.h),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  Widget _trend(String text, Color color) {
    return Row(children: [
      Icon(Icons.arrow_drop_up_rounded, color: color, size: 16.w),
      Text(text,
          style: TextStyle(
              color: color, fontSize: 10.sp, fontWeight: FontWeight.w400)),
    ]);
  }

  Widget _tag(String text, Color color) {
    return Text(text,
        style: TextStyle(
            color: color, fontSize: 10.sp, fontWeight: FontWeight.w400));
  }

  Widget _txCard(_TxMock tx) {
    final typeChip = tx.withdrawal
        ? _Chip('WITHDRAWAL', const Color(0x1A94A3B8), const Color(0x4D94A3B8),
            _slate)
        : _Chip('DEPOSIT', const Color(0x1A22D1EE), const Color(0x4D22D1EE), kCyan);

    return Container(
      margin: EdgeInsets.only(bottom: 24.h),
      padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 22.h),
      decoration: BoxDecoration(
        color: const Color(0x6616223F),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // header row
        Row(children: [
          Text('USER OPERATOR',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          const Spacer(),
          Text('TRANSACTION ID',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
        ]),
        SizedBox(height: 12.h),
        // user + id chip
        Row(children: [
          Container(
            width: 40.w, height: 40.h,
            decoration: BoxDecoration(
              color: const Color(0xFF004D52),
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Center(
              child: Text(tx.initials,
                  style: TextStyle(
                      color: kCyan, fontSize: 14.sp, fontWeight: FontWeight.w700)),
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(tx.user,
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 16.sp, fontWeight: FontWeight.w600)),
          ),
          Container(
            height: 22.h,
            padding: EdgeInsets.symmetric(horizontal: 10.w),
            decoration: BoxDecoration(
              color: kCyan.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4.r),
            ),
            child: Center(
              child: Text(tx.id,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 10.sp, fontWeight: FontWeight.w700)),
            ),
          ),
        ]),
        SizedBox(height: 18.h),
        // amount
        Row(children: [
          Text('AMOUNT (UNITS)',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          const Spacer(),
          Text(tx.amount,
              style: TextStyle(
                  color: _gold,
                  fontSize: 18.sp, fontWeight: FontWeight.w700)),
        ]),
        SizedBox(height: 10.h),
        // type
        Row(children: [
          Text('TYPE',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          SizedBox(width: 24.w),
          Text('STREAK: 12 WINS',
              style: TextStyle(
                  color: _bright,
                  fontSize: 10.sp, fontWeight: FontWeight.w900)),
          const Spacer(),
          typeChip,
        ]),
        SizedBox(height: 10.h),
        // status
        Row(children: [
          Text('STATUS',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          SizedBox(width: 24.w),
          const _Pill('ACTIVE', _bright),
          const Spacer(),
          _StatusChip(tx.status),
        ]),
        SizedBox(height: 14.h),
        // timestamp
        Row(children: [
          Text('TIMESTAMP',
              style: TextStyle(
                  color: Color(0xB3FFFFFF),
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
          const Spacer(),
          Text(tx.timestamp,
              style: TextStyle(
                  color: kOrange,
                  fontSize: 10.sp, fontWeight: FontWeight.w700)),
        ]),
      ]),
    );
  }

  Widget _pageBtn(IconData icon, {bool stroke = false}) {
    return Container(
      width: 25.w, height: 30.h,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(8.r),
        border: stroke ? Border.all(color: const Color(0xFF1E2E56)) : null,
      ),
      child: Icon(icon, color: const Color(0x99FFFFFF), size: 16.w),
    );
  }

  Widget _pageNum(String n, {bool active = false}) {
    return Container(
      width: active ? 37.w : 38.w,
      height: 41.h,
      decoration: BoxDecoration(
        color: active ? kCyan : const Color(0x9916223F),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Center(
        child: Text(n,
            style: TextStyle(
                color: active
                    ? const Color(0xFF0A1128)
                    : Colors.white,
                fontSize: 10.sp, fontWeight: FontWeight.w700)),
      ),
    );
  }

  static const _green = Color(0xFF2AE500);

  static const List<_TxMock> _txs = [
    _TxMock('NeonRider_99', 'NR', 'TX-A7F2', '2,450.00', false, 'APPROVED',
        'OCT 24, 09:42'),
    _TxMock('CyberKng', 'CK', 'TX-B19C', '8,120.45', true, 'PENDING',
        'OCT 24, 09:38'),
    _TxMock('PixelQueen', 'PQ', 'TX-C4E1', '540.00', true, 'REJECTED',
        'vOCT 24, 09:15'),
    _TxMock('DataGhost', 'DG', 'TX-D7AA', '12,500.00', false, 'APPROVED',
        'OCT 23, 23:59'),
    _TxMock('ShadowReap', 'SR', 'TX-E91B', '3,200.12', true, 'PENDING',
        'OCT 23, 22:45'),
  ];
}

class _TxMock {
  final String user;
  final String initials;
  final String id;
  final String amount;
  final bool withdrawal;
  final String status;
  final String timestamp;

  const _TxMock(this.user, this.initials, this.id, this.amount,
      this.withdrawal, this.status, this.timestamp);
}

class _Chip extends StatelessWidget {
  final String label;
  final Color fill;
  final Color border;
  final Color text;

  const _Chip(this.label, this.fill, this.border, this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24.h,
      padding: EdgeInsets.symmetric(horizontal: 12.w),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(4.r),
        border: Border.all(color: border),
      ),
      child: Center(
        child: Text(label,
            style: TextStyle(
                color: text,
                fontSize: 10.sp, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final Color color;

  const _Pill(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 20.h,
      padding: EdgeInsets.symmetric(horizontal: 12.w),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 6.w, height: 6.h,
          decoration: BoxDecoration(
            shape: BoxShape.circle, color: color),
        ),
        SizedBox(width: 6.w),
        Text(label,
            style: TextStyle(
                color: color,
                fontSize: 10.sp, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip(this.status);

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'PENDING':
        return const _Chip('PENDING', Color(0x33FFC107),
            Color(0x80FFC107), Color(0xFFFFC107));
      case 'REJECTED':
        return const _Chip('REJECTED', Color(0xFF93000A),
            Color(0x4DFFB4AB), Color(0xFFFFB4AB));
      default:
        return const _Chip('APPROVED', Color(0x3322D1EE), kCyan, kCyan);
    }
  }
}
