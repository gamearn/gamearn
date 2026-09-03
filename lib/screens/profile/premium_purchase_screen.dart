import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import '../../theme.dart';
import '../../services/premium_service.dart';
import '../../services/api_service.dart';

// ════════════════════════════════════════════════════════════════
//  PREMIUM PURCHASE SCREEN — mirrors BuyCoinsScreen patterns
//
//  Header: standardized close icon + centered "Go Premium" fs18
//  Status: if already premium, show expiry + "Manage" note
//  Plans: server-driven cards (name, price, duration)
//  Payment: radio rows matching BuyCoinsScreen method rows
//  CTA: initiate -> launch paymentLink -> poll verifyPremium
// ════════════════════════════════════════════════════════════════

class PremiumPurchaseScreen extends StatefulWidget {
  const PremiumPurchaseScreen({super.key});

  @override
  State<PremiumPurchaseScreen> createState() => _PremiumPurchaseScreenState();
}

class _PremiumPurchaseScreenState extends State<PremiumPurchaseScreen> {
  final _service = PremiumService();
  final _dateFormat = DateFormat('dd MMM yyyy');

  List<Map<String, dynamic>> _plans = [];
  int _selectedPlanIndex = 1;
  int _methodIndex = 0;
  bool _isLoading = false;
  bool _isInitialLoading = true;

  bool _isPremium = false;
  String? _premiumUntil;

  static const _methods = [
    'Credit or Debit Card',
    'Bank Transfer',
    'USSD',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        _service.status(),
        _service.fetchPlans(),
      ]);

      final status = results[0] as Map<String, dynamic>;
      final plans = results[1] as List<Map<String, dynamic>>;

      if (!mounted) return;
      setState(() {
        _isPremium = status['isPremium'] == true;
        _premiumUntil = status['premiumUntil'] as String?;
        _plans = plans;
        _isInitialLoading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _isInitialLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: kOrange),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isInitialLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _selectPlan(int i) {
    HapticFeedback.selectionClick();
    setState(() => _selectedPlanIndex = i);
  }

  void _selectMethod(int i) {
    HapticFeedback.selectionClick();
    setState(() => _methodIndex = i);
  }

  String _durationLabel(dynamic durationDays) {
    final days = durationDays as int? ?? 0;
    if (days >= 3650) return 'Lifetime';
    return '$days days';
  }

  Future<void> _purchase() async {
    if (_plans.isEmpty) return;
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    final plan = _plans[_selectedPlanIndex];
    final method = _methods[_methodIndex];
    final paymentMethod = method.contains('Card') ? 'card' : 'bank';

    try {
      final init = await _service.purchase(
        plan: plan['code'] as String,
        paymentMethod: paymentMethod,
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

      final premiumGranted = await _service.verifyPoll(txRef);

      if (!mounted) return;
      if (premiumGranted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Premium activated successfully!'),
            backgroundColor: kGreen,
          ),
        );
        _loadData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Payment still processing. Check your status shortly.'),
          ),
        );
      }
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
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: _isInitialLoading
            ? Center(
                child: SizedBox(
                  width: 28.w,
                  height: 28.w,
                  child: CircularProgressIndicator(
                      color: kCyan, strokeWidth: 2.5),
                ),
              )
            : Column(children: [
                // ── HEADER ────────────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
                  decoration: BoxDecoration(
                    color: context.bg,
                    border: Border(
                        bottom: BorderSide(
                            color: context.border, width: 1)),
                  ),
                  child: Row(children: [
                    GestureDetector(
                      onTap: () => Navigator.maybePop(context),
                      child: Icon(Icons.close_rounded,
                          color: context.txtPri, size: 20.w),
                    ),
                    Expanded(
                      child: Text('Go Premium',
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
                  child: ListView(
                    padding: EdgeInsets.symmetric(horizontal: 24.w),
                    children: [
                      SizedBox(height: 20.h),

                      // ── PREMIUM STATUS ──────────────────────────
                      if (_isPremium) _buildStatusBanner(),

                      // ── PERKS LIST ──────────────────────────────
                      _buildPerksList(),

                      SizedBox(height: 24.h),

                      // ── SELECT A PLAN ───────────────────────────
                      Text('Select a Plan',
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 18.sp,
                              fontWeight: FontWeight.w700)),
                      SizedBox(height: 14.h),

                      for (var i = 0; i < _plans.length; i++)
                        _PlanCard(
                          plan: _plans[i],
                          selected: _selectedPlanIndex == i,
                          isBestValue: _plans[i]['code'] == 'monthly',
                          durationLabel: _durationLabel(
                              _plans[i]['durationDays']),
                          onTap: () => _selectPlan(i),
                        ),

                      SizedBox(height: 24.h),

                      // ── PAYMENT METHOD ──────────────────────────
                      Text('Payment Method',
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 18.sp,
                              fontWeight: FontWeight.w700)),
                      SizedBox(height: 12.h),
                      for (var i = 0; i < _methods.length; i++)
                        _methodRow(i, _methods[i]),

                      SizedBox(height: 28.h),

                      // ── CTA ─────────────────────────────────────
                      GestureDetector(
                        onTap: _isLoading || _plans.isEmpty
                            ? null
                            : _purchase,
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
                                    width: 22.w,
                                    height: 22.w,
                                    child:
                                        const CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5))
                                : Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                          Icons
                                              .workspace_premium_rounded,
                                          color: Colors.white,
                                          size: 22.w),
                                      SizedBox(width: 10.w),
                                      Text('Go Premium',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 18.sp,
                                              fontWeight:
                                                  FontWeight.w700)),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.h),
                      Center(
                        child: Text(
                            'Secured by Paystack  \u2022  Instant activation',
                            style: TextStyle(
                                color: context.txtSec,
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

  Widget _buildStatusBanner() {
    String dateText = '';
    if (_premiumUntil != null) {
      try {
        final dt = DateTime.parse(_premiumUntil!);
        dateText = _dateFormat.format(dt);
      } catch (_) {
        dateText = _premiumUntil!;
      }
    }

    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 20.h),
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: kGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: kGreen.withOpacity(0.3), width: 1.w),
      ),
      child: Row(children: [
        Icon(Icons.check_circle_rounded,
            color: kGreen, size: 24.w),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('You\'re Premium',
                  style: TextStyle(
                      color: kGreen,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w700)),
              if (dateText.isNotEmpty) ...[
                SizedBox(height: 2.h),
                Text('Expires $dateText',
                    style: TextStyle(
                        color: context.txtSec, fontSize: 12.sp)),
              ],
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildPerksList() {
    const perks = [
      'Exclusive premium tournaments',
      'Priority payouts',
      '0% withdrawal fees',
      'Priority customer support',
    ];

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: context.card.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 44.w,
              height: 44.w,
              decoration: BoxDecoration(
                color: kYellowDot.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.workspace_premium_rounded,
                  color: kYellowDot, size: 24.w),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gamearn Premium',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w800)),
                  SizedBox(height: 2.h),
                  Text('Exclusive rewards',
                      style: TextStyle(
                          color: kCyan,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ]),
          SizedBox(height: 16.h),
          ...perks.map((p) => Padding(
                padding: EdgeInsets.only(bottom: 10.h),
                child: Row(children: [
                  Icon(Icons.check_circle_rounded,
                      color: kCyan, size: 16.w),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(p,
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w600)),
                  ),
                ]),
              )),
        ],
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
          Icon(
              switch (label) {
                'Bank Transfer' => Icons.account_balance_rounded,
                'USSD' => Icons.dialpad_rounded,
                _ => Icons.credit_card_rounded,
              },
              color: kCyan,
              size: 22.w),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(label,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w500)),
          ),
          Container(
            width: 22.w,
            height: 22.w,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: selected ? kCyan : Colors.transparent,
              border: Border.all(
                  color: selected ? kCyan : context.border,
                  width: 2.w),
            ),
            child: selected
                ? Icon(Icons.check_rounded,
                    color: context.txtPri, size: 14.w)
                : null,
          ),
        ]),
      ),
    );
  }
}

// ── PLAN CARD ─────────────────────────────────────────────────
class _PlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  final bool selected;
  final bool isBestValue;
  final String durationLabel;
  final VoidCallback onTap;

  const _PlanCard({
    required this.plan,
    required this.selected,
    required this.isBestValue,
    required this.durationLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final name = plan['name'] as String? ?? '';
    final price = plan['price'] as String? ?? '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(bottom: 12.h),
        padding: EdgeInsets.all(20.r),
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: selected
                ? kCyan.withOpacity(0.4)
                : kCyan.withOpacity(0.1),
            width: 1.w,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: kCyan.withOpacity(0.1),
                    blurRadius: 12,
                    spreadRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Row(children: [
          Container(
            width: 48.w,
            height: 48.w,
            decoration: BoxDecoration(
              color: kCyan.withOpacity(selected ? 0.3 : 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.workspace_premium_rounded,
                color: selected ? kCyan : kOrange, size: 24.w),
          ),
          SizedBox(width: 14.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(name,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w700)),
                  if (isBestValue) ...[
                    SizedBox(width: 8.w),
                    Container(
                      padding: EdgeInsets.symmetric(
                          horizontal: 8.w, vertical: 2.h),
                      decoration: BoxDecoration(
                        color: kOrange,
                        borderRadius:
                            BorderRadius.circular(9999.r),
                      ),
                      child: Text('BEST VALUE',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 9.sp,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5.w)),
                    ),
                  ],
                ]),
                SizedBox(height: 2.h),
                Text(durationLabel,
                    style: TextStyle(
                        color: kCyan.withOpacity(0.6),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w400)),
              ],
            ),
          ),
          Text(price,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 16.sp,
                  fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }
}
