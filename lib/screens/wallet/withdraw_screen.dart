import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});
  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  final _bankCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _loading = false;
  int _step = 0; // 0=amount, 1=bank details, 2=confirm

  @override
  void dispose() {
    _amountCtrl.dispose();
    _accountCtrl.dispose();
    _bankCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (_step > 0) setState(() => _step--);
                      else Navigator.maybePop(context);
                    },
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: context.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new,
                          color: Colors.white, size: 16),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text('Withdraw', style: context.titleStyle),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── Progress bar ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: List.generate(3, (i) {
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                      decoration: BoxDecoration(
                        color: i <= _step
                            ? context.cyan
                            : context.surface,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 32),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _step == 0
                    ? _buildAmountStep(context)
                    : _step == 1
                        ? _buildBankStep(context)
                        : _buildConfirmStep(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountStep(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Balance card
        StreamBuilder<DocumentSnapshot>(
          stream: uid == null
              ? null
              : FirebaseFirestore.instance
                  .collection('wallets').doc(uid).snapshots(),
          builder: (context, snap) {
            final bal = (snap.data?.get('balance') as num? ?? 0).toDouble();
            return Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.cyan,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Available Balance',
                      style: TextStyle(
                          color: context.bg.withOpacity(0.7), fontSize: 13)),
                  const SizedBox(height: 8),
                  Text('₦${bal.toStringAsFixed(2)}',
                      style: TextStyle(
                          color: context.bg,
                          fontSize: 28,
                          fontWeight: FontWeight.w800)),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 28),
        Text('Enter Amount',
            style: TextStyle(color: context.subText, fontSize: 13)),
        const SizedBox(height: 8),
        _inputField(context, _amountCtrl, '₦ 0.00',
            keyboardType: TextInputType.number),
        const SizedBox(height: 32),
        _primaryBtn(context, 'Continue', () {
          if (_amountCtrl.text.isEmpty) return;
          setState(() => _step = 1);
        }),
      ],
    );
  }

  Widget _buildBankStep(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Bank Details',
            style: context.titleStyle.copyWith(fontSize: 20)),
        const SizedBox(height: 24),
        Text('Bank Name',
            style: TextStyle(color: context.subText, fontSize: 13)),
        const SizedBox(height: 8),
        _inputField(context, _bankCtrl, 'e.g. First Bank'),
        const SizedBox(height: 16),
        Text('Account Number',
            style: TextStyle(color: context.subText, fontSize: 13)),
        const SizedBox(height: 8),
        _inputField(context, _accountCtrl, '0000000000',
            keyboardType: TextInputType.number),
        const SizedBox(height: 16),
        Text('Account Name',
            style: TextStyle(color: context.subText, fontSize: 13)),
        const SizedBox(height: 8),
        _inputField(context, _nameCtrl, 'Full name'),
        const SizedBox(height: 32),
        _primaryBtn(context, 'Continue', () {
          if (_accountCtrl.text.isEmpty || _bankCtrl.text.isEmpty) return;
          setState(() => _step = 2);
        }),
      ],
    );
  }

  Widget _buildConfirmStep(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Confirm Withdrawal',
            style: context.titleStyle.copyWith(fontSize: 20)),
        const SizedBox(height: 24),
        _summaryRow(context, 'Amount', '₦${_amountCtrl.text}'),
        _summaryRow(context, 'Bank', _bankCtrl.text),
        _summaryRow(context, 'Account', _accountCtrl.text),
        _summaryRow(context, 'Name', _nameCtrl.text),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: context.orange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: context.orange.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: context.orange, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Withdrawals are processed within 24 hours.',
                  style: TextStyle(color: context.orange, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        _primaryBtn(context, _loading ? 'Processing...' : 'Withdraw Now',
            _loading ? null : _submit),
      ],
    );
  }

  Widget _summaryRow(BuildContext context, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: context.surface,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(color: context.subText, fontSize: 13)),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid;
      if (uid == null) return;
      final amount = double.tryParse(_amountCtrl.text) ?? 0;
      // Write withdrawal request — backend verifies via Paystack
      await FirebaseFirestore.instance
          .collection('withdrawal_requests')
          .add({
        'uid': uid,
        'amount': amount,
        'bank': _bankCtrl.text,
        'accountNumber': _accountCtrl.text,
        'accountName': _nameCtrl.text,
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Withdrawal request submitted!'),
            backgroundColor: context.cyan,
          ),
        );
        Navigator.maybePop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'),
              backgroundColor: context.orange),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _inputField(BuildContext context, TextEditingController ctrl,
      String hint, {TextInputType? keyboardType}) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: context.subText),
        filled: true,
        fillColor: context.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _primaryBtn(BuildContext context, String label, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 52,
        decoration: BoxDecoration(
          color: onTap == null
              ? context.orange.withOpacity(0.4)
              : context.orange,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Center(
          child: Text(label,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 15)),
        ),
      ),
    );
  }
}
