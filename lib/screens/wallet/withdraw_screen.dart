import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import '../../services/api_service.dart';
import '../auth/email_otp_screen.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});
  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _loading = false;
  int _step = 0; // 0=amount, 1=bank details, 2=confirm

  List<Map<String, dynamic>> _banks = const [];
  bool _banksLoading = false;
  String? _selectedBankCode;
  String? _selectedBankName;

  @override
  void dispose() {
    _amountCtrl.dispose();
    _accountCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

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
                      child: Icon(Icons.arrow_back_ios_new,
                          color: context.txtPri, size: 16),
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
          _loadBanks();
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
        _banksLoading
            ? Container(
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: context.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const SizedBox(
                  width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            : _banks.isEmpty
                ? _inputField(context, null, 'Loading banks failed — try again',
                    readOnly: true)
                : DropdownButtonFormField<String>(
                    value: _selectedBankCode,
                    dropdownColor: context.card,
                    style: TextStyle(color: context.txtPri),
                    decoration: InputDecoration(
                      hintText: 'Select bank',
                      hintStyle: TextStyle(color: context.subText),
                      filled: true,
                      fillColor: context.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
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
                        _selectedBankName = _banks
                            .firstWhere(
                              (b) => b['code'] == code,
                              orElse: () => const {'name': 'Unknown bank'},
                            )['name'] as String?;
                      });
                    },
                  ),
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
          if (_selectedBankCode == null ||
              _accountCtrl.text.isEmpty ||
              _nameCtrl.text.isEmpty) return;
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
        _summaryRow(context, 'Bank', _selectedBankName ?? ''),
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
                  'A verification code will be sent to your email before processing.',
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
              style: TextStyle(
                  color: context.txtPri,
                  fontWeight: FontWeight.w600,
                  fontSize: 14)),
        ],
      ),
    );
  }

  /// MFA gate → backend withdrawal.
  ///
  /// 1. Send a 6-digit OTP to the user's email (purpose: withdrawal)
  /// 2. Collect the code via [EmailOtpScreen] → returns an mfaProof
  /// 3. POST /wallet/withdraw with the mfaProof + bank details
  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      final email = user?.email;
      if (user == null) return;
      if (email == null || email.isEmpty) {
        throw ApiException(
          code: 'NO_EMAIL',
          message: 'Add an email to your account to withdraw.',
        );
      }

      // 1. Send verification code to the user's email.
      await ApiService.sendEmailOtp(email: email, purpose: 'withdrawal');

      if (!mounted) {
        setState(() => _loading = false);
        return;
      }

      // 2. Collect the 6-digit code. Screen pops with the mfaProof on success.
      final mfaProof = await Navigator.push<String>(
        context,
        MaterialPageRoute(
          builder: (_) => EmailOtpScreen(
            email: email,
            name: user.displayName ?? '',
            purpose: 'withdrawal',
          ),
        ),
      );

      if (!mounted) return;
      if (mfaProof == null || mfaProof.isEmpty) {
        setState(() => _loading = false);
        return; // cancelled / failed verification
      }

      // 3. Submit the withdrawal to the backend.
      final amount = double.tryParse(_amountCtrl.text.trim()) ?? 0;
      await ApiService.withdraw(
        amount: amount,
        accountNumber: _accountCtrl.text.trim(),
        bankCode: _selectedBankCode ?? '',
        accountName: _nameCtrl.text.trim(),
        mfaProof: mfaProof,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Withdrawal request submitted!'),
          backgroundColor: context.cyan,
        ),
      );
      Navigator.maybePop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message),
          backgroundColor: context.orange,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: context.orange,
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _inputField(BuildContext context, TextEditingController? ctrl,
      String hint, {TextInputType? keyboardType, bool readOnly = false}) {
    return TextField(
      controller: ctrl,
      readOnly: readOnly,
      keyboardType: keyboardType,
      style: TextStyle(color: context.txtPri),
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
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 15)),
        ),
      ),
    );
  }
}
