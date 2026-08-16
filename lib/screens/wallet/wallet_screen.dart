import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../theme.dart';
import 'withdraw_screen.dart';
import 'transaction_history_screen.dart';
import 'buy_coins_screen.dart';
import 'sell_coins_screen.dart';

// ════════════════════════════════════════════════════════════════
//  WALLET & EARNINGS SCREEN — Figma matched (1485:848, 390×844)
//  Responsive via flutter_screenutil
//
//  Header 390×79 #0B0E1A@90 + bottom stroke white@30 · centered
//    "Wallet & Earnings" fs18 #F1F5F9 (tab body — no back icon)
//  Hero: glow 256×256 #22D1EE@20 · avatar 128×128 gradient ring
//    (#00A7C2→#22D1EE) + inner 120×120 #0B0E1A · LEVEL pill 61×27
//    #22D1EE rx=9999 · "24,500" fs32 + "/Units" fs20 #22D1EE ·
//    "$245.00 USD Equivalent" fs16 #FFFFFF@50 · streak pill 192×34
//    #22D1EE@20 rx=8 "90-Day Streak Active" fs12 #22D1EE
//  Tabs: plain text row — Overview (cyan) · Buy · Sell · Withdraw
//    (white@60) → push screens
//  Actions: Add Funds 163×58 (gradient) · Cash Out #22D1EE@10
//  Tx History: fs18 #F1F5F9 + View All fs14 #22D1EE Bold · items
//    342×80 #22D1EE@5 r12 · overlay 48×48 r16 · title fs12 · date fs10
// ════════════════════════════════════════════════════════════════

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('wallets')
              .doc(uid)
              .snapshots(),
          builder: (ctx, walSnap) {
            final wallet = walSnap.hasData && walSnap.data!.exists
                ? walSnap.data!.data() as Map<String, dynamic>
                : <String, dynamic>{};

            final units  = wallet['units']    ?? 0;
            final usd    = wallet['usdEquiv'] ?? 0.0;
            final streak = wallet['streakDays'] ?? 90;
            final level  = wallet['level']    ?? 42;

            return CustomScrollView(
              slivers: [
                // ── HEADER — Figma Frame 56 (390×79, bg@90, stroke @30) ──
                SliverToBoxAdapter(
                  child: Container(
                    color: const Color(0xE60B0E1A),
                    child: Column(children: [
                      Padding(
                        padding: EdgeInsets.fromLTRB(24.w, 28.h, 24.w, 16.h),
                        child: Center(
                          child: Text('Wallet & Earnings',
                              style: TextStyle(
                                  color: const Color(0xFFF1F5F9),
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ),
                      Container(height: 1.h, color: const Color(0x4DFFFFFF)),
                    ]),
                  ),
                ),

                // ── HERO — glow + avatar + balance + streak ──────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 40.h),
                    child: Column(children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          // Decorative Glow — Figma: 256×256 #22D1EE@20
                          Container(
                            width: 256.w, height: 256.w,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: kCyan.withOpacity(0.2),
                              boxShadow: [BoxShadow(
                                  color: kCyan.withOpacity(0.2),
                                  blurRadius: 70.r, spreadRadius: 14.r)],
                            ),
                          ),
                          Column(children: [
                            // Avatar 128 + LEVEL pill — Figma Frame 71
                            SizedBox(
                              width: 128.w, height: 128.w,
                              child: Stack(
                                alignment: Alignment.bottomCenter,
                                children: [
                                  // Gradient ring — Figma: gradient #00A7C2→#22D1EE
                                  Container(
                                    width: 128.w, height: 128.w,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: const LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [
                                          Color(0xFF00A7C2),
                                          Color(0xFF22D1EE),
                                        ],
                                      ),
                                    ),
                                    child: Center(
                                      child: Container(
                                        width: 120.w, height: 120.w,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: const Color(0xFF0B0E1A),
                                        ),
                                        child: Center(
                                          child: Text('🏆',
                                              style: TextStyle(
                                                  fontSize: 52.sp)),
                                        ),
                                      ),
                                    ),
                                  ),
                                  // LEVEL pill — Figma: 61×27 #22D1EE rx=9999
                                  Positioned(
                                    bottom: 0,
                                    child: Container(
                                      padding: EdgeInsets.symmetric(
                                          horizontal: 10.w, vertical: 6.h),
                                      decoration: BoxDecoration(
                                        color: kCyan,
                                        borderRadius: BorderRadius.circular(9999.r),
                                        border: Border.all(
                                            color: const Color(0xFF0B0E1A),
                                            width: 2.w),
                                      ),
                                      child: Text('LEVEL $level',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 10.sp,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: 16.h),

                            // Balance — Figma: fs32 + /Units fs20 #22D1EE
                            RichText(
                              text: TextSpan(
                                text:
                                    '${NumberFormat('#,##0').format(units)} ',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 32.sp,
                                    fontWeight: FontWeight.w700),
                                children: [
                                  TextSpan(
                                    text: '/Units',
                                    style: TextStyle(
                                        color: kCyan,
                                        fontSize: 20.sp,
                                        fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text('\$${usd.toStringAsFixed(2)} USD Equivalent',
                                style: TextStyle(
                                    color: const Color(0x80FFFFFF),
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.w400)),
                            SizedBox(height: 16.h),

                            // Streak pill — Figma: 192×34 #22D1EE@20 rx=8
                            if (streak >= 90)
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 16.w, vertical: 8.h),
                                decoration: BoxDecoration(
                                  color: kCyan.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8.r),
                                  border: Border.all(
                                      color: kCyan.withOpacity(0.3),
                                      width: 1.w),
                                ),
                                child: Text(
                                    '$streak-Day Streak Active',
                                    style: TextStyle(
                                        color: kCyan,
                                        fontSize: 12.sp,
                                        fontWeight: FontWeight.w500)),
                              )
                            else
                              Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 16.w, vertical: 8.h),
                                decoration: BoxDecoration(
                                  color: kCyan.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(8.r),
                                  border: Border.all(
                                      color: kCyan.withOpacity(0.3),
                                      width: 1.w),
                                ),
                                child: Text(
                                    '$streak-Day Streak Active',
                                    style: TextStyle(
                                        color: kCyan,
                                        fontSize: 12.sp,
                                        fontWeight: FontWeight.w500)),
                              ),
                          ]),
                        ],
                      ),
                    ]),
                  ),
                ),

                // ── TABS + ACTIONS — Figma Frame 73 (342×108) ───────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 32.h, 24.w, 0),
                    child: Column(children: [
                      // Plain text tabs — Figma: no pill backgrounds
                      Row(children: [
                        _TabPill(
                            label: 'Overview', selected: true,
                            onTap: () {}),
                        SizedBox(width: 0.w),
                        _TabPill(label: 'Buy', selected: false,
                            onTap: _pushBuy),
                        SizedBox(width: 0.w),
                        _TabPill(label: 'Sell', selected: false,
                            onTap: _pushSell),
                        SizedBox(width: 0.w),
                        _TabPill(label: 'Withdraw', selected: false,
                            onTap: _pushWithdraw),
                      ]),
                      SizedBox(height: 16.h),
                      // Action buttons — Figma: 163×58 × 2 (gap 16)
                      Row(children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: _pushBuy,
                            child: Container(
                              height: 58.h,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                // Figma: gradient #00A7C2→#22D1EE
                                gradient: const LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Color(0xFF00A7C2),
                                    Color(0xFF22D1EE),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_circle_outline,
                                      color: Colors.white, size: 18.w),
                                  SizedBox(width: 8.w),
                                  Text('Add Funds',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.w700)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 16.w),
                        Expanded(
                          child: GestureDetector(
                            onTap: _pushWithdraw,
                            child: Container(
                              height: 58.h,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: kCyan.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12.r),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.currency_exchange_rounded,
                                      color: const Color(0xB3FFFFFF), size: 18.w),
                                  SizedBox(width: 8.w),
                                  Text('Cash Out',
                                      style: TextStyle(
                                          color: const Color(0xB3FFFFFF),
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.w700)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ]),
                    ]),
                  ),
                ),

                // ── TRANSACTION HISTORY HEADER ───────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24.w, 28.h, 24.w, 14.h),
                    child: Row(
                      children: [
                        Text('Transaction History',
                            style: TextStyle(
                                color: const Color(0xFFF1F5F9),
                                fontWeight: FontWeight.w700,
                                fontSize: 18.sp)),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const TransactionHistoryScreen()),
                          ),
                          child: Text('View All',
                              style: TextStyle(
                                  color: kCyan,
                                  fontSize: 14.sp,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── TRANSACTIONS ─────────────────────────────────────────
                StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance
                      .collection('wallets')
                      .doc(uid)
                      .collection('transactions')
                      .orderBy('createdAt', descending: true)
                      .limit(20)
                      .snapshots(),
                  builder: (ctx, txSnap) {
                    final docs = txSnap.data?.docs ?? [];
                    if (docs.isEmpty) {
                      return SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_toggle_off,
                                  color: kTextMuted, size: 48.w),
                              SizedBox(height: 12.h),
                              Text('No transactions yet',
                                  style: TextStyle(
                                      color: context.txtSec,
                                      fontSize: 14.sp)),
                              SizedBox(height: 4.h),
                              Text('Your gaming wins will appear here',
                                  style: TextStyle(
                                      color: kTextMuted, fontSize: 12.sp)),
                            ],
                          ),
                        ),
                      );
                    }
                    return SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) {
                          final d = docs[i].data()
                              as Map<String, dynamic>;
                          final desc = (d['description'] ?? '')
                              .toString()
                              .toLowerCase();
                          final credit = d['type'] == 'credit';
                          final isStreak = desc.contains('streak');
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
                          return _TxRow(mock: {
                            'ov': ov,
                            'icon': ic,
                            'title': d['description'] ?? '',
                            'date': _fmtDate(d['createdAt']),
                            'amount': isStreak
                                ? '+\$${d['usdAmount'] ?? 0}'
                                : '${credit ? '+' : '-'}${d['units'] ?? 0} Units',
                            'usd': isStreak
                                ? ''
                                : '${credit ? '+' : '-'}\$${d['usdAmount'] ?? 0}',
                            'credit': credit,
                          });
                        },
                        childCount: docs.length,
                      ),
                    );
                  },
                ),

                SliverPadding(padding: EdgeInsets.only(bottom: 32.h)),
              ],
            );
          },
        ),
      ),
    );
  }

  void _pushBuy() => Navigator.push(context,
      MaterialPageRoute(builder: (_) => const BuyCoinsScreen()));
  void _pushSell() => Navigator.push(context,
      MaterialPageRoute(builder: (_) => const SellCoinsScreen()));
  void _pushWithdraw() => Navigator.push(context,
      MaterialPageRoute(builder: (_) => const WithdrawScreen()));

  String _fmtDate(dynamic ts) {
    if (ts == null) return '';
    try {
      final dt = (ts as dynamic).toDate() as DateTime;
      return DateFormat('MMM d, y • HH:mm').format(dt);
    } catch (_) {
      return '';
    }
  }
}

// ── TAB PILL — Figma: plain text, no pill bg ─────────────────────
class _TabPill extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _TabPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 12.w),
        child: Text(label,
            style: TextStyle(
                color: selected ? kCyan : const Color(0x99FFFFFF),
                fontSize: 12.sp,
                fontWeight: FontWeight.w500)),
      ),
    );
  }
}

// ── TX ROW — Figma: 342×80 #22D1EE@5, overlay 48×48 r16 ─────────
class _TxRow extends StatelessWidget {
  final Map<String, dynamic> mock;
  const _TxRow({required this.mock});

  @override
  Widget build(BuildContext context) {
    final ov     = mock['ov'] as Color;
    final credit = mock['credit'] as bool;

    return Container(
      margin: EdgeInsets.fromLTRB(24.w, 0, 24.w, 12.h),
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: kCyan.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Row(
        children: [
          Container(
            width: 48.w, height: 48.w,
            decoration: BoxDecoration(
              color: ov.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16.r),
            ),
            child: Icon(mock['icon'] as IconData, color: ov, size: 22.w),
          ),
          SizedBox(width: 16.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(mock['title'] as String,
                    style: TextStyle(
                        color: const Color(0xFFF1F5F9),
                        fontWeight: FontWeight.w600,
                        fontSize: 12.sp)),
                SizedBox(height: 5.h),
                Text(mock['date'] as String,
                    style: TextStyle(
                        color: const Color(0x80FFFFFF), fontSize: 10.sp)),
              ],
            ),
          ),
          SizedBox(width: 8.w),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(mock['amount'] as String,
                  style: TextStyle(
                      color: credit ? kGreen : const Color(0xFFF1F5F9),
                      fontWeight: FontWeight.w700,
                      fontSize: 12.sp)),
              if ((mock['usd'] as String).isNotEmpty)
                Text(mock['usd'] as String,
                    style: TextStyle(
                        color: const Color(0x80FFFFFF), fontSize: 10.sp)),
            ],
          ),
        ],
      ),
    );
  }
}
