import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../../services/social_auth_service.dart';

// ════════════════════════════════════════════════════════════════
//  WITHDRAW SCREEN — Figma matched (1504:948 / 1511:1072 /
//  1703:1078, 390×844) — 3-step flow
//
//  STEP 1 (1504:948): progress bar 342×4 (cyan + @20) · "Step 1:
//    Amount & Method" fs10 cyan · balance card 342×146 #22D1EE@10
//    stroke @20 r12 ("Available Cash Balance" fs14 cyan@70 ·
//    "$245.00" fs32 white · "12,500 Coins" fs14 cyan@60) ·
//    "Withdrawal Amount" fs18 · "Enter Amount" fs14 @50 +
//    "Min $10.00 / Max $500.00" fs12 cyan · input 342×64
//    #22D1EE@5 stroke @20 r12 ($ fs20 @50 + 150.00 fs20 white) ·
//    "Conversion rate: 100 Coins = $1.00" fs12 @50 · "Payout
//    Method" fs18 · Bank Transfer / PayPal / Digital Wallet (fs16 +
//    fee sub fs12 @50) · "Total to Withdraw" fs14 @60 + "$150.00"
//    fs20 · CTA "Continue to Review" 342×56 #FF5E00 fs16 ·
//    "Secure Financial Transaction" fs10
//  STEP 2 (1511:1072): review rows + warning + Confirm/Cancel
//  STEP 3 (1703:1078): "Withdrawal Status" + $150.00 fs48 gold +
//    tx id + arrival/destination + verification 85% + Back to Wallet
//  Backend: Paystack bank withdrawal + MFA re-auth on submit.
// ════════════════════════════════════════════════════════════════

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});

  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _submitting = false;
  int _step = 0; // 0 = amount & method, 1 = review, 2 = status

  int _method = 0; // 0 bank · 1 paypal · 2 digital wallet

  List<Map<String, dynamic>> _banks = const [];
  bool _banksLoading = false;
  String? _selectedBankCode;
  String? _selectedBankName;

  static const _methods = [
    {
      'name': 'Bank Transfer',
      'feeLabel': '2-3 Business Days • Free',
      'fee': 0.0,
      'arrival': '2-3 Business Days'
    },
    {
      'name': 'Digital Wallet',
      'feeLabel': 'Instant • Free',
      'fee': 0.0,
      'arrival': 'Instant'
    },
  ];

  @override
  void dispose() {
    _amountCtrl.dispose();
    _accountCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  double get _amount => double.tryParse(_amountCtrl.text.trim()) ?? 0;

  double get _total => _amount - (_methods[_method]['fee'] as double);

  Future<void> _loadBanks() async {
    if (_banks.isNotEmpty || _banksLoading) return;
    setState(() => _banksLoading = true);
    try {
      final banks = await ApiService.getBanks();
      if (!mounted) return;
      setState(() => _banks = banks);
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Could not load banks: ${e.message}'),
          backgroundColor: context.orange,
        ));
      }
    } finally {
      if (mounted) setState(() => _banksLoading = false);
    }
  }

  void _continue() {
    final amt = _amount;
    if (amt < 1000 || amt > 450000) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Enter an amount between ₦1,000 and ₦450,000')),
      );
      return;
    }
    if (_method == 0 &&
        (_selectedBankCode == null ||
            _accountCtrl.text.isEmpty ||
            _nameCtrl.text.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Complete your bank details to continue')),
      );
      return;
    }
    setState(() => _step = 1);
  }

  Future<void> _confirm() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _submitting = true);
    try {
      final tokenResult = await user.getIdTokenResult();
      final authTime =
          tokenResult.authTime ?? DateTime.fromMillisecondsSinceEpoch(0);
      final isFresh = DateTime.now().difference(authTime).inSeconds < 10 * 60;
      if (!isFresh) {
        final reauthed = await _reauthenticate(user);
        if (!reauthed) {
          if (mounted) setState(() => _submitting = false);
          return;
        }
        await user.getIdToken(true);
      }

      await ApiService.withdraw(
        amount: _total,
        accountNumber: _accountCtrl.text.trim(),
        bankCode: _selectedBankCode ?? '',
        accountName: _nameCtrl.text.trim(),
      );

      if (!mounted) return;
      setState(() => _step = 2);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: context.orange),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: context.orange),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<bool> _reauthenticate(User user) async {
    final providers = user.providerData.map((p) => p.providerId).toSet();

    if (providers.contains('password')) {
      final email = user.email;
      if (email == null || email.isEmpty) {
        _showSnack('Add an email to your account to withdraw.');
        return false;
      }
      final password = await _promptPassword(context);
      if (password == null) return false;
      try {
        final credential =
            EmailAuthProvider.credential(email: email, password: password);
        await user.reauthenticateWithCredential(credential);
        return true;
      } on FirebaseAuthException catch (e) {
        _showSnack(e.message ?? 'Incorrect password.');
        return false;
      }
    }

    try {
      if (providers.contains('google.com')) {
        await SocialAuthService.instance.reauthenticateWithGoogle();
        return true;
      }
      if (providers.contains('facebook.com')) {
        await SocialAuthService.instance.reauthenticateWithFacebook();
        return true;
      }
      if (providers.contains('apple.com')) {
        await SocialAuthService.instance.reauthenticateWithApple();
        return true;
      }
      return true;
    } on AuthException catch (e) {
      _showSnack(e.message);
      return false;
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: context.orange),
    );
  }

  Future<String?> _promptPassword(BuildContext context) {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.card,
        title: Text('Confirm Password',
            style:
                TextStyle(color: context.txtPri, fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter your password to confirm this withdrawal.',
              style: TextStyle(color: context.subText, fontSize: 13.sp),
            ),
            SizedBox(height: 16.h),
            TextField(
              controller: ctrl,
              autofocus: true,
              obscureText: true,
              style: TextStyle(color: context.txtPri),
              decoration: InputDecoration(
                hintText: '••••••••',
                hintStyle: TextStyle(color: context.subText),
                filled: true,
                fillColor: context.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
              ),
              onSubmitted: (value) => Navigator.pop(ctx, value),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text),
              child: Text('Confirm',
                  style: TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // ── HEADER — Figma (standardized) ──────────────────────────
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
                onTap: () {
                  if (_step > 0 && _step < 2) {
                    setState(() => _step--);
                  } else {
                    Navigator.maybePop(context);
                  }
                },
                child: Icon(Icons.close_rounded,
                    color: context.txtPri, size: 20.w),
              ),
              Expanded(
                child: Text(_step == 2 ? 'Withdrawal Status' : 'Withdraw',
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
            child: _step == 0
                ? _buildAmountMethod(context, uid)
                : _step == 1
                    ? _buildReview(context)
                    : _buildStatus(context),
          ),
        ]),
      ),
    );
  }

  // ── STEP 1 — Amount & Method (1504:948) ────────────────────────
  Widget _buildAmountMethod(BuildContext context, String? uid) {
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 32.h),
      children: [
        _progressBar(step: 0),
        SizedBox(height: 8.h),
        Text('Step 1: Amount & Method',
            style: TextStyle(
                color: kCyan, fontSize: 10.sp, fontWeight: FontWeight.w600)),
        SizedBox(height: 20.h),

        // Balance card — 342×146 #22D1EE@10
        StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('wallets')
              .doc(uid)
              .snapshots(),
          builder: (_, snap) {
            final w = (snap.data?.data() as Map?) ?? {};
            final usd = (w['usdEquiv'] as num?)?.toDouble() ?? 0;
            final units = w['units'] ?? 0;
            return Container(
              padding: EdgeInsets.all(24.r),
              decoration: BoxDecoration(
                color: kCyan.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12.r),
                border: Border.all(color: kCyan.withOpacity(0.2), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Available Cash Balance',
                      style: TextStyle(
                          color: kCyan.withOpacity(0.7),
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600)),
                  SizedBox(height: 6.h),
                  Text('₦${(usd * 900).round()}',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 32.sp,
                          fontWeight: FontWeight.w700)),
                  SizedBox(height: 6.h),
                  Row(children: [
                    Container(
                      width: 12.w,
                      height: 12.h,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: kCyan.withOpacity(0.3),
                      ),
                    ),
                    SizedBox(width: 6.w),
                    Text('${_unitsText(units)} Coins',
                        style: TextStyle(
                            color: kCyan.withOpacity(0.6),
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w500)),
                  ]),
                ],
              ),
            );
          },
        ),
        SizedBox(height: 24.h),

        // Withdrawal Amount
        Text('Withdrawal Amount',
            style: TextStyle(
                color: context.txtPri,
                fontSize: 18.sp,
                fontWeight: FontWeight.w700)),
        SizedBox(height: 14.h),
        Row(children: [
          Expanded(
            child: Text('Enter Amount',
                style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
          ),
          Text('Min ₦1,000 / Max ₦450,000',
              style: TextStyle(
                  color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w600)),
        ]),
        SizedBox(height: 8.h),
        // Input — 342×64 #22D1EE@5 stroke @20
        Container(
          height: 64.h,
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: kCyan.withOpacity(0.2), width: 1),
          ),
          child: TextField(
            controller: _amountCtrl,
            keyboardType: TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
            style: TextStyle(color: context.txtPri, fontSize: 20.sp),
            decoration: InputDecoration(
              border: InputBorder.none,
              prefixIcon:
                  Icon(Icons.attach_money, color: context.txtSec, size: 22.w),
              hintText: '0.00',
              hintStyle: TextStyle(color: context.txtSec, fontSize: 20.sp),
            ),
          ),
        ),
        SizedBox(height: 8.h),
        Text('Conversion rate: 100 Coins = ₦900',
            style: TextStyle(color: context.txtSec, fontSize: 12.sp)),
        SizedBox(height: 24.h),

        // Payout Method
        Text('Payout Method',
            style: TextStyle(
                color: context.txtPri,
                fontSize: 18.sp,
                fontWeight: FontWeight.w700)),
        SizedBox(height: 12.h),
        for (var i = 0; i < _methods.length; i++) _methodRow(i, _methods[i]),
        SizedBox(height: 8.h),

        // Bank details — only for Bank Transfer (keeps backend working)
        if (_method == 0) _bankDetails(),

        // Total
        SizedBox(height: 16.h),
        Row(children: [
          Text('Total to Withdraw',
              style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
          Spacer(),
          Text('₦${_total.round()}',
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 20.sp,
                  fontWeight: FontWeight.w700)),
        ]),
        SizedBox(height: 16.h),

        // CTA
        GestureDetector(
          onTap: _continue,
          child: Container(
            height: 56.h,
            decoration: BoxDecoration(
              color: kOrange,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Center(
              child: Text('Continue to Review',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16.sp,
                      fontWeight: FontWeight.w700)),
            ),
          ),
        ),
        SizedBox(height: 10.h),
        Center(
          child: Text('Secure Financial Transaction',
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  // ── STEP 2 — Confirm withdrawal (1511:1072) ─────────────────────
  Widget _buildReview(BuildContext context) {
    final method = _methods[_method];
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 32.h),
      children: [
        _progressBar(step: 1),
        SizedBox(height: 8.h),
        Text('Step 2: Confirm withdrawal',
            style: TextStyle(
                color: kCyan, fontSize: 10.sp, fontWeight: FontWeight.w600)),
        SizedBox(height: 20.h),
        Text('Review Details',
            style: TextStyle(
                color: context.txtPri,
                fontSize: 14.sp,
                fontWeight: FontWeight.w600)),
        SizedBox(height: 16.h),
        _reviewRow('Withdrawal Amount', '₦${_amount.round()}', big: true),
        _reviewRow('Service Fee', '₦${(method['fee'] as double).round()}'),
        _reviewRow('Estimated Arrival', method['arrival'] as String,
            accent: true),
        _reviewRow('Destination', _destinationLabel()),
        SizedBox(height: 20.h),
        Container(
          padding: EdgeInsets.all(14.r),
          decoration: BoxDecoration(
            color: kOrange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10.r),
            border: Border.all(color: kOrange.withOpacity(0.3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline, color: kOrange, size: 18.w),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  'Please ensure your account information is\ncorrect. Withdrawals to incorrect accounts may\nnot be reversible.',
                  style: TextStyle(
                      color: context.txtSec, fontSize: 12.sp, height: 1.4),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 24.h),
        GestureDetector(
          onTap: _submitting ? null : _confirm,
          child: Container(
            height: 56.h,
            decoration: BoxDecoration(
              color: _submitting ? kOrange.withOpacity(0.5) : kOrange,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Center(
              child: _submitting
                  ? SizedBox(
                      width: 22.w,
                      height: 22.h,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5))
                  : Text('Confirm Withdrawal',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w700)),
            ),
          ),
        ),
        SizedBox(height: 10.h),
        GestureDetector(
          onTap: _submitting ? null : () => setState(() => _step = 0),
          child: Center(
            child: Text('Cancel',
                style: TextStyle(
                    color: context.txtSec,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600)),
          ),
        ),
      ],
    );
  }

  // ── STEP 3 — Withdrawal Status (1703:1078) ──────────────────────
  Widget _buildStatus(BuildContext context) {
    final method = _methods[_method];
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 32.h, 16.w, 32.h),
      children: [
        Center(
          child: Text('Processing',
              style: TextStyle(
                  color: kCyan, fontSize: 14.sp, fontWeight: FontWeight.w600)),
        ),
        SizedBox(height: 12.h),
        Center(
          child: Text('₦${_total.round()}',
              style: TextStyle(
                  color: Color(0xFFFFC107),
                  fontSize: 48.sp,
                  fontWeight: FontWeight.w700)),
        ),
        SizedBox(height: 8.h),
        Center(
          child: Text('Transaction ID: #GE-99201-AX',
              style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
        ),
        SizedBox(height: 36.h),
        _statusRow('Estimated Arrival', method['arrival'] as String),
        _statusRow(
            'Destination Bank',
            _method == 0
                ? (_selectedBankName ?? 'Bank Transfer')
                : _methods[_method]['name'] as String),
        if (_method == 0 && _accountCtrl.text.isNotEmpty)
          Padding(
            padding: EdgeInsets.only(left: 110.w, bottom: 20.h),
            child: Text(
                '**** ${_accountCtrl.text.trim().length >= 4 ? _accountCtrl.text.trim().substring(_accountCtrl.text.trim().length - 4) : ''}',
                style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
          ),
        SizedBox(height: 16.h),
        Container(
          padding: EdgeInsets.all(18.r),
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12.r),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Text('Verification Progress',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600)),
                Spacer(),
                Text('85%',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w700)),
              ]),
              SizedBox(height: 10.h),
              ClipRRect(
                borderRadius: BorderRadius.circular(6.r),
                child: Stack(children: [
                  Container(height: 8.h, color: context.border),
                  FractionallySizedBox(
                    widthFactor: 0.85,
                    child: Container(height: 8.h, color: kCyan),
                  ),
                ]),
              ),
              SizedBox(height: 10.h),
              Text('Securing your funds via GAMEARN Vault...',
                  style: TextStyle(color: context.txtSec, fontSize: 12.sp)),
            ],
          ),
        ),
        SizedBox(height: 28.h),
        GestureDetector(
          onTap: () => Navigator.maybePop(context),
          child: Center(
            child: Text('Back to Wallet',
                style: TextStyle(
                    color: kCyan,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }

  // ── SHARED WIDGETS ──────────────────────────────────────────────
  Widget _progressBar({required int step}) {
    return Row(children: [
      Expanded(
        child: Container(
          height: 4.h,
          decoration: BoxDecoration(
            color: kCyan,
            borderRadius: BorderRadius.circular(2.r),
          ),
        ),
      ),
      SizedBox(width: 16.w),
      Expanded(
        child: Container(
          height: 4.h,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(step >= 1 ? 1 : 0.2),
            borderRadius: BorderRadius.circular(2.r),
          ),
        ),
      ),
    ]);
  }

  Widget _methodRow(int i, Map<String, dynamic> m) {
    final selected = _method == i;
    return GestureDetector(
      onTap: () {
        setState(() => _method = i);
        if (i == 0) _loadBanks();
      },
      child: Container(
        height: 74.h,
        margin: EdgeInsets.only(bottom: 8.h),
        padding: EdgeInsets.symmetric(horizontal: 16.w),
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: selected ? kCyan.withOpacity(0.4) : kCyan.withOpacity(0.1),
            width: 1,
          ),
        ),
        child: Row(children: [
          Container(
            width: 40.w,
            height: 40.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kCyan.withOpacity(0.1),
            ),
            child: Icon(
              switch (i) {
                0 => Icons.account_balance_rounded,
                _ => Icons.account_balance_wallet_rounded,
              },
              color: kCyan,
              size: 20.w,
            ),
          ),
          SizedBox(width: 12.w),
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
                SizedBox(height: 2.h),
                Text(m['feeLabel'] as String,
                    style: TextStyle(color: context.txtSec, fontSize: 12.sp)),
              ],
            ),
          ),
          Container(
            width: 22.w,
            height: 22.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: selected ? kCyan : Colors.transparent,
              border: Border.all(
                  color: selected ? kCyan : context.border, width: 2),
            ),
            child: selected
                ? Icon(Icons.check_rounded, color: context.txtPri, size: 14.w)
                : null,
          ),
        ]),
      ),
    );
  }

  Widget _bankDetails() {
    return Container(
      padding: EdgeInsets.all(14.r),
      margin: EdgeInsets.only(bottom: 8.h),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Bank Details',
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 12.h),
          _banksLoading
              ? SizedBox(
                  width: 52.w,
                  height: 28.h,
                  child: Center(
                    child: SizedBox(
                      width: 18.w,
                      height: 18.h,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ))
              : DropdownButtonFormField<String>(
                  value: _selectedBankCode,
                  dropdownColor: context.card,
                  style: TextStyle(color: context.txtPri),
                  decoration: InputDecoration(
                    hintText: 'Select bank',
                    hintStyle: TextStyle(color: context.txtSec),
                    filled: true,
                    fillColor: context.card,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12.r),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
                    isDense: true,
                  ),
                  items: _banks
                      .map((b) => DropdownMenuItem(
                            value: b['code'] as String?,
                            child: Text(
                              b['name'] as String? ?? 'Unknown bank',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ))
                      .toList(),
                  onChanged: (code) {
                    if (code == null) return;
                    setState(() {
                      _selectedBankCode = code;
                      _selectedBankName = _banks.firstWhere(
                        (b) => b['code'] == code,
                        orElse: () => const {'name': 'Unknown bank'},
                      )['name'] as String?;
                    });
                  },
                ),
          SizedBox(height: 10.h),
          _bankField(_accountCtrl, 'Account Number', number: true),
          SizedBox(height: 10.h),
          _bankField(_nameCtrl, 'Account Name'),
        ],
      ),
    );
  }

  Widget _bankField(TextEditingController ctrl, String hint,
      {bool number = false}) {
    return TextField(
      controller: ctrl,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      style: TextStyle(color: context.txtPri, fontSize: 14.sp),
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: context.txtSec),
        filled: true,
        fillColor: context.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.r),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
        isDense: true,
      ),
    );
  }

  Widget _reviewRow(String label, String value,
      {bool big = false, bool accent = false}) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(10.r),
      ),
      child: Row(
        children: [
          Text(label,
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: big ? 14.sp : 14.sp,
                  fontWeight: FontWeight.w500)),
          Spacer(),
          Text(value,
              style: TextStyle(
                  color: accent ? kCyan : context.txtPri,
                  fontSize: big ? 20.sp : 14.sp,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _statusRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 20.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110.w,
            child: Text(label,
                style: TextStyle(color: context.txtSec, fontSize: 12.sp)),
          ),
          Expanded(
            child: Text(value,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  String _unitsText(dynamic units) {
    if (units is num) {
      final n = units.toInt();
      if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
      return '$n';
    }
    return '12.5K';
  }

  String _destinationLabel() {
    if (_method == 0) {
      final name = _selectedBankName ?? 'Bank Transfer';
      return name;
    }
    return _methods[_method]['name'] as String;
  }
}
