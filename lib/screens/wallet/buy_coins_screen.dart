import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';
import '../../services/api_service.dart';

// ════════════════════════════════════════════════════════════════
//  BUY COINS SCREEN — Figma matched (1538:1155, 390×844)
//  Responsive via flutter_screenutil
//
//  Header: standardized close icon + centered "Buy Coins" fs18
//  Balance card 342×115 #22D1EE@10 r12: coin icon 80×80 cyan
//    · "Current Balance" fs14 #22D1EE@80 · units fs32 + /Units fs18
//  Packs 2×2 grid (163×266 r12 #22D1EE@5):
//    icon overlay 129×129 r8 #22D1EE@20 (/@30 selected)
//    · pack name fs16-18 Bold · coins fs14 #22D1EE@60
//    · price button 129×36 r8 #FF5E00 fs14 Bold
//  Payment: 3 rows 342×58 r12 #22D1EE@5, radio fs16
//  CTA: "Buy Coins" 342×60 #FF5E00 r12
// ════════════════════════════════════════════════════════════════

class BuyCoinsScreen extends StatefulWidget {
  const BuyCoinsScreen({super.key});

  @override
  State<BuyCoinsScreen> createState() => _BuyCoinsScreenState();
}

class _BuyCoinsScreenState extends State<BuyCoinsScreen> {
  static const _usdToNgn = 900.0;

  final List<Map<String, dynamic>> _packs = [
    {'name': 'Starter Pack', 'coins': 500, 'usd': 4.99,
     'best': true},
    {'name': 'Pro Pack', 'coins': 1500, 'usd': 12.99,
     'best': false},
    {'name': 'Elite Pack', 'coins': 2500, 'usd': 19.99,
     'best': false},
    {'name': 'Champion Pack', 'coins': 5000, 'usd': 39.99,
     'best': false},
  ];

  final List<String> _methods = [
    'Credit or Debit Card',
    'Apple Pay',
    'Google Pay',
  ];

  int _packIndex = 1;
  int _methodIndex = 0;
  bool _isLoading = false;

  void _selectPack(int i) {
    HapticFeedback.selectionClick();
    setState(() => _packIndex = i);
  }

  void _selectMethod(int i) {
    HapticFeedback.selectionClick();
    setState(() => _methodIndex = i);
  }

  Future<void> _purchase() async {
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    final pack = _packs[_packIndex];
    final method = _methods[_methodIndex];
    try {
      final init = await ApiService.initiateTopUp(
        amount: (pack['usd'] as double) * _usdToNgn,
        paymentMethod: method.contains('Card') ? 'card' : 'card',
      );
      final paymentLink = init['paymentLink'] as String?;
      final txRef = init['txRef'] as String?;
      if (paymentLink == null || txRef == null) {
        throw ApiException(
          code: 'INIT_FAILED',
          message: 'Could not start payment. Please try again.',
        );
      }

      final launched = await launchUrl(
        Uri.parse(paymentLink),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw ApiException(
          code: 'LAUNCH_FAILED',
          message: 'Could not open the payment page.',
        );
      }

      const attempts = 30;
      for (var i = 0; i < attempts; i++) {
        await Future.delayed(const Duration(seconds: 3));
        final status = await ApiService.verifyTransaction(txRef);
        final state = status['status'] as String?;
        if (state == 'completed') {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Top-up of ${pack['coins']} coins successful!'),
              backgroundColor: kGreen,
            ),
          );
          Navigator.maybePop(context);
          return;
        }
        if (state == 'failed') {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Payment failed. Please try again.')),
          );
          return;
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Payment still pending. Check your wallet shortly.')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: kOrange),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // ── HEADER — Figma Frame 56 (standardized) ────────────────
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            decoration: const BoxDecoration(
              color: Color(0xE60B0E1A),
              border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF), width: 1)),
            ),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Icon(Icons.close_rounded,
                    color: const Color(0xFFF1F5F9), size: 20.w),
              ),
              Expanded(
                child: Text('Buy Coins',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: const Color(0xFFF1F5F9),
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700)),
              ),
              SizedBox(width: 20.w),
            ]),
          ),

          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              children: [
                SizedBox(height: 20.h),

                // ── BALANCE CARD — 342×115 #22D1EE@10 r12 ──────────
                StreamBuilder<DocumentSnapshot>(
                  stream: FirebaseFirestore.instance
                      .collection('wallets').doc(uid).snapshots(),
                  builder: (_, snap) {
                    final w = (snap.data?.data() as Map?) ?? {};
                    final units = w['units'] ?? 24500;
                    final usd = (w['usdEquiv'] ?? 245.0).toDouble();
                    return Container(
                      padding: EdgeInsets.all(20.r),
                      decoration: BoxDecoration(
                        color: kCyan.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(
                            color: kCyan.withOpacity(0.2), width: 1.w),
                      ),
                      child: Row(children: [
                        Container(
                          width: 80.w, height: 80.w,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: kCyan.withOpacity(0.1),
                          ),
                          child: Icon(Icons.monetization_on_rounded,
                              color: kCyan, size: 44.w),
                        ),
                        SizedBox(width: 16.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Current Balance',
                                  style: TextStyle(
                                      color: kCyan.withOpacity(0.8),
                                      fontSize: 14.sp,
                                      fontWeight: FontWeight.w600)),
                              SizedBox(height: 4.h),
                              RichText(
                                text: TextSpan(
                                  text: '$units',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 32.sp,
                                      fontWeight: FontWeight.w700),
                                  children: [
                                    TextSpan(
                                        text: '/Units',
                                        style: TextStyle(
                                            color: kCyan,
                                            fontSize: 18.sp,
                                            fontWeight:
                                                FontWeight.w700)),
                                  ],
                                ),
                              ),
                              Text('\$${usd.toStringAsFixed(2)}',
                                  style: TextStyle(
                                      color: kCyan.withOpacity(0.6),
                                      fontSize: 12.sp)),
                            ],
                          ),
                        ),
                      ]),
                    );
                  },
                ),

                SizedBox(height: 24.h),

                // ── SELECT A COIN PACK ──────────────────────────────
                Row(children: [
                  Expanded(
                    child: Text('Select a Coin Pack',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 18.sp,
                            fontWeight: FontWeight.w700)),
                  ),
                  Text('Limited Offers',
                      style: TextStyle(
                          color: kCyan,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w500)),
                ]),
                SizedBox(height: 14.h),

                // ── PACKS GRID — 2×2, 163×266 r12 ──────────────────
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate:
                      SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.62,
                    crossAxisSpacing: 16.w,
                    mainAxisSpacing: 16.h,
                  ),
                  itemCount: _packs.length,
                  itemBuilder: (ctx, i) => _PackCard(
                    pack: _packs[i],
                    selected: _packIndex == i,
                    onTap: () => _selectPack(i),
                  ),
                ),

                SizedBox(height: 24.h),

                // ── PAYMENT METHOD ──────────────────────────────────
                Text('Payment Method',
                    style: TextStyle(
                        color: const Color(0xFFF1F5F9),
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700)),
                SizedBox(height: 12.h),
                for (var i = 0; i < _methods.length; i++)
                  _methodRow(i, _methods[i]),

                SizedBox(height: 28.h),

                // ── CTA — 342×60 #FF5E00 r12 ───────────────────────
                GestureDetector(
                  onTap: _isLoading ? null : _purchase,
                  child: Container(
                    height: 60.h,
                    decoration: BoxDecoration(
                      color: _isLoading
                          ? kOrange.withOpacity(0.5)
                          : kOrange,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Center(
                      child: _isLoading
                          ? SizedBox(
                              width: 22.w, height: 22.w,
                              child: const CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2.5))
                          : Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.shopping_cart_outlined,
                                    color: Colors.white, size: 22.w),
                                SizedBox(width: 10.w),
                                Text('Buy Coins',
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
                Center(
                  child: Text('Secured by Paystack  •  Instant credit',
                      style: TextStyle(
                          color: const Color(0x61FFFFFF),
                          fontSize: 11.sp)),
                ),

                SizedBox(height: 32.h),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _methodRow(int i, String label) {
    final selected = _methodIndex == i;
    return GestureDetector(
      onTap: () => _selectMethod(i),
      child: Container(
        margin: EdgeInsets.only(bottom: 10.h),
        height: 58.h,
        padding: EdgeInsets.symmetric(horizontal: 16.w),
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
              color: kCyan.withOpacity(0.1), width: 1.w),
        ),
        child: Row(children: [
          Icon(switch (label) {
            'Apple Pay' => Icons.apple_rounded,
            'Google Pay' => Icons.g_mobiledata_rounded,
            _ => Icons.credit_card_rounded,
          }, color: kCyan, size: 22.w),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: Colors.white, fontSize: 16.sp,
                    fontWeight: FontWeight.w500)),
          ),
          Container(
            width: 22.w, height: 22.w,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: selected ? kCyan : Colors.transparent,
              border: Border.all(
                  color: selected ? kCyan : const Color(0x80FFFFFF),
                  width: 2.w),
            ),
            child: selected
                ? Icon(Icons.check_rounded,
                    color: const Color(0xFF0B0E1A), size: 14.w)
                : null,
          ),
        ]),
      ),
    );
  }
}

// ── PACK CARD — Figma: 163×266 r12 #22D1EE@5 ──────────────────────
//  icon overlay 129×129 r8 · text · price button 129×36 r8 #FF5E00
class _PackCard extends StatelessWidget {
  final Map<String, dynamic> pack;
  final bool selected;
  final VoidCallback onTap;
  const _PackCard({
    required this.pack,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isBest = pack['best'] == true;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: selected
                ? kCyan.withOpacity(0.4)
                : kCyan.withOpacity(0.1),
            width: 1.w,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // BEST VALUE badge — Figma: fs10 Bold on Pro Pack
            if (isBest)
              Container(
                margin: EdgeInsets.fromLTRB(10.w, 10.h, 0, 0),
                padding: EdgeInsets.symmetric(
                    horizontal: 8.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: kOrange,
                  borderRadius: BorderRadius.circular(9999.r),
                ),
                child: Text('BEST VALUE',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 10.sp,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5.w)),
              ),

            // Icon overlay — Figma: 129×129 r8 #22D1EE@20 (/@30 selected)
            Container(
              margin: EdgeInsets.fromLTRB(12.w, isBest ? 8.h : 12.h, 12.w, 0),
              height: 129.h,
              decoration: BoxDecoration(
                color: kCyan.withOpacity(selected ? 0.3 : 0.2),
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Center(
                child: Icon(Icons.monetization_on_rounded,
                    color: selected ? kCyan : kOrange,
                    size: 40.w),
              ),
            ),

            // Pack name + coins — Figma: vertical spacing 0
            Padding(
              padding: EdgeInsets.fromLTRB(12.w, 12.h, 12.w, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pack['name'] as String,
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: isBest ? 18.sp : 16.sp,
                          fontWeight: FontWeight.w700)),
                  SizedBox(height: 2.h),
                  Text('${pack['coins']} Coins',
                      style: TextStyle(
                          color: kCyan.withOpacity(0.6),
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w400)),
                ],
              ),
            ),

            const Spacer(),

            // Price button — Figma: 129×36 r8 #FF5E00
            Container(
              margin: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
              height: 36.h,
              decoration: BoxDecoration(
                color: kOrange,
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Center(
                child: Text(
                    '\$${(pack['usd'] as double).toStringAsFixed(2)}',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
