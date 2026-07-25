import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});
  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  static const _tabs = ['All', 'Credits', 'Debits'];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: _tabs.length, vsync: this);
    _tab.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
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
                    onTap: () => Navigator.maybePop(context),
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
                  Text('Transaction History',
                      style: context.titleStyle),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── Tab bar ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: context.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tab,
                  indicator: BoxDecoration(
                    color: context.cyan,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: context.bg,
                  unselectedLabelColor: context.subText,
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13),
                  tabs: _tabs.map((t) => Tab(text: t)).toList(),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── List ─────────────────────────────────────────────────
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
                  final filtered = docs.where((d) {
                    final data = d.data() as Map<String, dynamic>;
                    final type =
                        (data['type'] as String? ?? '').toLowerCase();
                    if (_tab.index == 1) return type == 'credit';
                    if (_tab.index == 2) return type == 'debit';
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_long_outlined,
                              color: context.subText, size: 64),
                          const SizedBox(height: 12),
                          Text('No transactions yet',
                              style: TextStyle(color: context.subText)),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final data =
                          filtered[i].data() as Map<String, dynamic>;
                      final isCredit =
                          (data['type'] as String? ?? '') == 'credit';
                      final amount =
                          (data['amount'] as num? ?? 0).toDouble();
                      final desc =
                          data['description'] as String? ?? 'Transaction';
                      final ts = data['createdAt'] as Timestamp?;
                      final date = ts != null
                          ? _formatDate(ts.toDate())
                          : '';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: context.cyan.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: context.cyan.withOpacity(0.15)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                color: isCredit
                                    ? const Color(0xFF22C55E)
                                        .withOpacity(0.15)
                                    : context.orange.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Icon(
                                isCredit
                                    ? Icons.arrow_downward_rounded
                                    : Icons.arrow_upward_rounded,
                                color: isCredit
                                    ? const Color(0xFF22C55E)
                                    : context.orange,
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(desc,
                                      style: TextStyle(
                                          color: context.txtPri,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14)),
                                  const SizedBox(height: 4),
                                  Text(date,
                                      style: TextStyle(
                                          color: context.subText,
                                          fontSize: 12)),
                                ],
                              ),
                            ),
                            Text(
                              '${isCredit ? '+' : '-'}₦${amount.toStringAsFixed(0)}',
                              style: TextStyle(
                                color: isCredit
                                    ? const Color(0xFF22C55E)
                                    : context.orange,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
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

  String _formatDate(DateTime d) {
    final months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${d.day} ${months[d.month - 1]} ${d.year}  '
        '${d.hour.toString().padLeft(2,'0')}:'
        '${d.minute.toString().padLeft(2,'0')}';
  }
}
