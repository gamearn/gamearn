import 'package:flutter/material.dart';
import '../../theme.dart';

class TransactionsOverviewScreen extends StatelessWidget {
  const TransactionsOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.border),
                  ),
                  child: Icon(Icons.arrow_back_ios_new_rounded,
                      color: context.txtPri, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              Text('Transactions',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17,
                      fontWeight: FontWeight.w800)),
            ]),
          ),

          // Stats row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _stat(context, 'Inflow', '+₦12.4M', const Color(0xFF00E676)),
              const SizedBox(width: 10),
              _stat(context, 'Outflow', '-₦8.1M', kOrange),
              const SizedBox(width: 10),
              _stat(context, 'Net', '+₦4.3M', kCyan),
            ]),
          ),

          // Filter
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              _filterChip(context, 'All', true),
              const SizedBox(width: 8),
              _filterChip(context, 'Deposits', false),
              const SizedBox(width: 8),
              _filterChip(context, 'Withdrawals', false),
              const SizedBox(width: 8),
              _filterChip(context, 'Sales', false),
            ]),
          ),

          const SizedBox(height: 12),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 20,
              itemBuilder: (ctx, i) => _TxRow(
                type: ['deposit', 'withdrawal', 'sale', 'purchase'][i % 4],
                user: 'Player ${6000 - i * 10}',
                amount: (15000 - i * 800).toDouble(),
                timeAgo: '${i + 1}h ago',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _stat(BuildContext context, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: context.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style:
                    TextStyle(color: context.txtSec, fontSize: 10)),
            const SizedBox(height: 2),
            Text(value,
                style: TextStyle(
                    color: color,
                    fontSize: 14,
                    fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(BuildContext context, String label, bool selected) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: selected ? kCyan.withOpacity(0.15) : context.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: selected ? kCyan : context.border),
      ),
      child: Text(label,
          style: TextStyle(
              color: selected ? kCyan : context.txtSec,
              fontSize: 11,
              fontWeight: FontWeight.w600)),
    );
  }
}

class _TxRow extends StatelessWidget {
  final String type;
  final String user;
  final double amount;
  final String timeAgo;

  const _TxRow({
    required this.type,
    required this.user,
    required this.amount,
    required this.timeAgo,
  });

  @override
  Widget build(BuildContext context) {
    final isCredit = type == 'deposit' || type == 'sale';
    final icon = type == 'deposit'
        ? Icons.add_circle_outline
        : type == 'withdrawal'
            ? Icons.account_balance_outlined
            : type == 'sale'
                ? Icons.sell_outlined
                : Icons.shopping_cart_outlined;
    final label = type[0].toUpperCase() + type.substring(1);
    final formatted =
        '${isCredit ? '+' : '-'}₦${amount.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.border),
      ),
      child: Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: (isCredit ? const Color(0xFF00E676) : kOrange)
                .withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon,
              color: isCredit ? const Color(0xFF00E676) : kOrange, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(user,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
              Text(label,
                  style: TextStyle(
                      color: context.txtSec, fontSize: 11)),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(formatted,
                style: TextStyle(
                    color: isCredit
                        ? const Color(0xFF00E676)
                        : kOrange,
                    fontSize: 13,
                    fontWeight: FontWeight.w800)),
            Text(timeAgo,
                style: TextStyle(
                    color: context.txtSec, fontSize: 10)),
          ],
        ),
      ]),
    );
  }
}
