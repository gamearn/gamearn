import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  TRANSACTION HISTORY SCREEN — Figma matched (1499:910, list of
//  items 342×80) — pushed from Wallet "View All"
//
//  Item: 342×80 #22D1EE@0.05 r12 (NO border) · icon overlay 48×48
//    r16 — win #22C55E@0.2 / purchase #22D1EE@0.2 / streak
//    #FF5E00@0.2 · title fs12 #F1F5F9 w700 · date fs10 @0.5
//    "Oct 24, 2023 • 14:20" · "+500 Units" fs12 (+green / white)
//    w700 · "+$5.00" fs10 @0.5
// ════════════════════════════════════════════════════════════════

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  static const _months = ['Jan','Feb','Mar','Apr','May','Jun',
                          'Jul','Aug','Sep','Oct','Nov','Dec'];

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── HEADER — Figma (standardized) ──────────────────────────
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
                  child: Text('Transaction History',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w700)),
                ),
                SizedBox(width: 20.w),
              ]),
            ),
            SizedBox(height: 16.h),

            // ── LIST ────────────────────────────────────────────────
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: uid == null
                    ? null
                    : FirebaseFirestore.instance
                        .collection('wallets')
                        .doc(uid)
                        .collection('transactions')
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final docs = snap.data?.docs ?? [];

                  if (docs.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_long_outlined,
                              color: context.subText, size: 64.w),
                          SizedBox(height: 12.h),
                          Text('No transactions yet',
                              style: TextStyle(color: context.subText)),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 32.h),
                    itemCount: docs.length,
                    itemBuilder: (context, i) {
                      final d = docs[i].data() as Map<String, dynamic>;
                      final desc = (d['description'] ?? '')
                          .toString()
                          .toLowerCase();
                      final credit = d['type'] == 'credit';
                      final isStreak = desc.contains('streak');
                      final units = d['units'] ?? 0;
                      final usdAmt = d['usdAmount'] ?? 0;
                      final ts = d['createdAt'] as Timestamp?;

                      final Color ov;
                      final IconData ic;
                      if (isStreak) {
                        ov = kOrange;
                        ic = Icons.local_fire_department;
                      } else if (credit) {
                        ov = kGreen;
                        ic = Icons.emoji_events;
                      } else {
                        ov = kCyan;
                        ic = Icons.shopping_bag_outlined;
                      }

                      return Container(
                        height: 80.h,
                        margin: EdgeInsets.only(bottom: 12.h),
                        padding: EdgeInsets.symmetric(horizontal: 16.w),
                        decoration: BoxDecoration(
                          color: kCyan.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48.w,
                              height: 48.w,
                              decoration: BoxDecoration(
                                color: ov.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(16.r),
                              ),
                              child: Icon(ic, color: ov, size: 20.w),
                            ),
                            SizedBox(width: 16.w),
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(d['description'] ?? '',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          color: context.txtPri,
                                          fontSize: 12.sp,
                                          fontWeight: FontWeight.w700)),
                                  SizedBox(height: 2.h),
                                  Text(ts != null
                                          ? _fmtDate(ts.toDate())
                                          : '',
                                      style: TextStyle(
                                          color: context.txtSec,
                                          fontSize: 10.sp)),
                                ],
                              ),
                            ),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${credit ? '+' : '-'}${_fmtNum(units)} Units',
                                  style: TextStyle(
                                    color: credit
                                        ? kGreen
                                        : context.txtPri,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 2.h),
                                Text(
                                  '${credit ? '+' : '-'}₦${_fmtNum(usdAmt)}',
                                  style: TextStyle(
                                      color: context.txtSec,
                                      fontSize: 10.sp),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmtDate(DateTime d) {
    return '${_months[d.month - 1]} ${d.day}, ${d.year} • '
        '${d.hour.toString().padLeft(2, '0')}:'
        '${d.minute.toString().padLeft(2, '0')}';
  }

  String _fmtNum(dynamic v) {
    if (v is num) return v.toStringAsFixed(v is int ? 0 : 2);
    return '${v ?? 0}';
  }
}
