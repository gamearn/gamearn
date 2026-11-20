import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  SELL COINS SCREEN — Figma matched (1568:6138, 390×844)
//  Responsive via flutter_screenutil
//
//  Header: standardized close icon + centered "Sell Coins" fs18
//  Balance cards 165×143 (gap 12):
//    Coin Balance  #22D1EE@10 r12 · Cashable #1E293B@40 r12
//  Amount to Convert · input · You will receive · exchange rate
//  Withdrawal Destination · Bank Transfer / PayPal
//  CTA: "Sell & Convert Now" 342×60 #FF5E00 r12
// ════════════════════════════════════════════════════════════════

class SellCoinsScreen extends StatefulWidget {
  const SellCoinsScreen({super.key});

  @override
  State<SellCoinsScreen> createState() => _SellCoinsScreenState();
}

class _SellCoinsScreenState extends State<SellCoinsScreen> {
  // 100 coins = ₦900
  static const _rate = 900.0;

  final _amountCtrl = TextEditingController();
  int _method = 0; // 0 = Bank Transfer, 1 = Digital Wallet
  bool _isLoading = false;

  static const _methods = [
    {'name': 'Bank Transfer', 'sub': 'Processing: 2-3 business days'},
    {'name': 'Digital Wallet', 'sub': 'Processing: Instant to 24 hours'},
  ];

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  double get _coins => double.tryParse(_amountCtrl.text.trim()) ?? 0;

  void _sell() {
    final coins = _coins;
    if (coins <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter an amount of coins to sell')),
      );
      return;
    }
    HapticFeedback.mediumImpact();
    _showConfirmDialog(coins);
  }

  void _showConfirmDialog(double coins) {
    final ngn = (coins / 100) * _rate;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.card,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56.w,
              height: 56.w,
              decoration: BoxDecoration(
                color: kGreen.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child:
                  Icon(Icons.check_circle_outline, color: kGreen, size: 32.w),
            ),
            SizedBox(height: 16.h),
            Text('Sell Order Placed!',
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w800)),
            SizedBox(height: 8.h),
            Text(
              '${_fmt(coins.toInt())} coins will be sold for ₦${ngn.round()} via ${_methods[_method]['name']}',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.txtSec, fontSize: 13.sp),
            ),
            SizedBox(height: 6.h),
            Text(
              _method == 0
                  ? 'Payout will be sent to your linked bank account.'
                  : 'Payout will be sent to your digital wallet.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.txtSec, fontSize: 12.sp),
            ),
            SizedBox(height: 20.h),
            SizedBox(
              width: double.infinity,
              height: 44.h,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: kCyan,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.r)),
                ),
                child: Text('Done',
                    style: TextStyle(
                        color: context.txtPri,
                        fontWeight: FontWeight.w800,
                        fontSize: 14.sp)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(int n) {
    final s = n.toString();
    if (n < 1000) return s;
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final ngn = (_coins / 100) * _rate;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // ── HEADER — Figma Frame 56 (standardized) ────────────────
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            decoration: BoxDecoration(
              color: context.bg,
              border:
                  Border(bottom: BorderSide(color: context.border, width: 1)),
            ),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Icon(Icons.close_rounded,
                    color: context.txtPri, size: 20.w),
              ),
              Expanded(
                child: Text('Sell Coins',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700)),
              ),
              SizedBox(width: 20.w),
            ]),
          ),

          Expanded(
            child: StreamBuilder<DocumentSnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('wallets')
                  .doc(uid)
                  .snapshots(),
              builder: (_, snap) {
                final w = (snap.data?.data() as Map?) ?? {};
                final units = w['units'] ?? 0;
                final usdBal = (w['usdEquiv'] as num?)?.toDouble() ?? 0;
                return ListView(
                  padding: EdgeInsets.symmetric(horizontal: 24.w),
                  children: [
                    SizedBox(height: 20.h),

                    // ── BALANCE CARDS — Figma Frame 92 (gap 12) ─────
                    Row(children: [
                      Expanded(
                        child: _balanceCard(
                          bg: kCyan.withOpacity(0.1),
                          stroke: kCyan.withOpacity(0.2),
                          label: 'Coin Balance',
                          labelColor: context.txtSec,
                          value: _fmt(units),
                          valueColor: kCyan,
                          sub: '₦${(usdBal * 900).round()}',
                          subColor: kCyan.withOpacity(0.6),
                        ),
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: _balanceCard(
                          bg: context.card,
                          stroke: context.border,
                          label: 'Cashable',
                          labelColor: context.txtSec,
                          value: '₦${(usdBal * 900).round()}',
                          valueColor: context.txtPri,
                          sub: 'Ready to withdraw',
                          subColor: context.txtSec,
                        ),
                      ),
                    ]),

                    SizedBox(height: 32.h),

                    // ── AMOUNT TO CONVERT — Figma Frame 94 ──────────
                    Text('Amount to Convert',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700)),
                    SizedBox(height: 16.h),
                    Text('Enter amount of coins',
                        style:
                            TextStyle(color: context.txtSec, fontSize: 14.sp)),
                    SizedBox(height: 8.h),
                    Container(
                      height: 64.h,
                      padding: EdgeInsets.symmetric(horizontal: 16.w),
                      alignment: Alignment.centerLeft,
                      decoration: BoxDecoration(
                        color: context.card,
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(color: context.border, width: 1.w),
                      ),
                      child: TextField(
                        controller: _amountCtrl,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        style:
                            TextStyle(color: context.txtPri, fontSize: 18.sp),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: 'e.g. 5,000',
                          hintStyle:
                              TextStyle(color: context.txtSec, fontSize: 16.sp),
                          suffixIcon: Padding(
                            padding: EdgeInsets.only(right: 4.w),
                            child: Icon(Icons.monetization_on_rounded,
                                color: kCyan, size: 22.w),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 20.h),
                    Text('You will receive',
                        style:
                            TextStyle(color: context.txtSec, fontSize: 14.sp)),
                    SizedBox(height: 8.h),
                    // Result box — 342×64 #22D1EE@5 stroke @30
                    Container(
                      height: 64.h,
                      padding: EdgeInsets.symmetric(horizontal: 16.w),
                      decoration: BoxDecoration(
                        color: kCyan.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(
                            color: kCyan.withOpacity(0.3), width: 1.w),
                      ),
                      child: Row(children: [
                        Expanded(
                          child: Text('₦${ngn.round()}',
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.w700)),
                        ),
                        Text('NGN',
                            style: TextStyle(
                                color: kCyan,
                                fontSize: 14.sp,
                                fontWeight: FontWeight.w700)),
                      ]),
                    ),
                    SizedBox(height: 8.h),
                    Text('Exchange Rate: 100 Coins = ₦900',
                        style:
                            TextStyle(color: context.txtSec, fontSize: 10.sp)),

                    SizedBox(height: 32.h),

                    // ── WITHDRAWAL DESTINATION — Figma Frame 95 ─────
                    Text('Withdrawal Destination',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700)),
                    SizedBox(height: 12.h),
                    for (var i = 0; i < _methods.length; i++)
                      _destinationRow(i, _methods[i]),

                    SizedBox(height: 24.h),

                    // ── CTA — 342×60 #FF5E00 r12 ───────────────────
                    GestureDetector(
                      onTap: _isLoading ? null : _sell,
                      child: Container(
                        height: 60.h,
                        decoration: BoxDecoration(
                          color:
                              _isLoading ? kOrange.withOpacity(0.5) : kOrange,
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Center(
                          child: _isLoading
                              ? SizedBox(
                                  width: 22.w,
                                  height: 22.w,
                                  child: const CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2.5))
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.currency_exchange_rounded,
                                        color: Colors.white, size: 22.w),
                                    SizedBox(width: 10.w),
                                    Text('Sell & Convert Now',
                                        style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 18.sp,
                                            fontWeight: FontWeight.w700)),
                                  ],
                                ),
                        ),
                      ),
                    ),
                    SizedBox(height: 10.h),
                    Text(
                      'By clicking convert, you agree to Gamearn\'s Terms\nof Exchange.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: context.txtSec, fontSize: 12.sp),
                    ),

                    SizedBox(height: 32.h),
                  ],
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  Widget _balanceCard({
    required Color bg,
    required Color stroke,
    required String label,
    required Color labelColor,
    required String value,
    required Color valueColor,
    required String sub,
    required Color subColor,
  }) {
    return Container(
      height: 143.h,
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: stroke, width: 1.w),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 12.w,
              height: 12.w,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: kCyan.withOpacity(0.3),
              ),
            ),
            SizedBox(width: 6.w),
            Text(label,
                style: TextStyle(
                    color: labelColor,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600)),
          ]),
          const Spacer(),
          Text(value,
              style: TextStyle(
                  color: valueColor,
                  fontSize: 32.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 2.h),
          Text(sub,
              style: TextStyle(
                  color: subColor,
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _destinationRow(int i, Map<String, dynamic> m) {
    final selected = _method == i;
    return GestureDetector(
      onTap: () => setState(() => _method = i),
      child: Container(
        margin: EdgeInsets.only(bottom: 10.h),
        height: 82.h,
        padding: EdgeInsets.symmetric(horizontal: 16.w),
        decoration: BoxDecoration(
          color: selected ? kCyan.withOpacity(0.05) : context.card,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: selected ? kCyan : context.border,
            width: 1.w,
          ),
        ),
        child: Row(children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(m['name'] as String,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600)),
                SizedBox(height: 4.h),
                Text(m['sub'] as String,
                    style: TextStyle(color: context.txtSec, fontSize: 12.sp)),
              ],
            ),
          ),
          Container(
            width: 24.w,
            height: 24.w,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: selected ? kCyan : Colors.transparent,
              border: Border.all(
                color: selected ? kCyan : context.border,
                width: 2.w,
              ),
            ),
            child: selected
                ? Icon(Icons.check_rounded, color: context.txtPri, size: 15.w)
                : null,
          ),
        ]),
      ),
    );
  }
}
