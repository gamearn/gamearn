import 'package:flutter/material.dart';
import '../../theme.dart';

class WithdrawalManagementScreen extends StatelessWidget {
  const WithdrawalManagementScreen({super.key});

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
              Expanded(
                child: Text('Withdrawal Management',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('47 pending',
                    style: TextStyle(
                        color: kOrange,
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              ),
            ]),
          ),

          // Stats row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(children: [
              _miniStat(context, 'Total', '₦8.4M', kCyan),
              const SizedBox(width: 10),
              _miniStat(context, 'Pending', '₦890K', kOrange),
              const SizedBox(width: 10),
              _miniStat(context, 'Today', '₦1.2M', const Color(0xFF00E676)),
            ]),
          ),

          const SizedBox(height: 16),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 15,
              itemBuilder: (ctx, i) => _WithdrawalCard(
                userName: 'Player ${4500 - i}',
                amount: (25000 - i * 1500).toDouble(),
                bank: ['GTBank', 'Access Bank', 'First Bank', 'UBA'][i % 4],
                accountLast4: '${4521 - i}',
                timeAgo: '${i + 1}h ago',
                status: i < 8 ? 'pending' : 'completed',
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _miniStat(BuildContext context, String label, String value, Color color) {
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
                    fontSize: 15,
                    fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}

class _WithdrawalCard extends StatelessWidget {
  final String userName;
  final double amount;
  final String bank;
  final String accountLast4;
  final String timeAgo;
  final String status;

  const _WithdrawalCard({
    required this.userName,
    required this.amount,
    required this.bank,
    required this.accountLast4,
    required this.timeAgo,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = status == 'pending';
    final formatted =
        '₦${amount.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPending ? kOrange.withOpacity(0.3) : context.border,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: isPending
                  ? kOrange.withOpacity(0.12)
                  : const Color(0xFF00E676).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPending ? Icons.pending_outlined : Icons.check_circle_outline,
              color: isPending ? kOrange : const Color(0xFF00E676),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(userName,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
                Text('$bank •••• $accountLast4',
                    style: TextStyle(
                        color: context.txtSec, fontSize: 11)),
              ],
            ),
          ),
          Text(formatted,
              style: TextStyle(
                  color: isPending ? kOrange : const Color(0xFF00E676),
                  fontSize: 15,
                  fontWeight: FontWeight.w800)),
        ]),
        if (isPending) ...[
          const SizedBox(height: 12),
          Row(children: [
            Expanded(
              child: SizedBox(
                height: 36,
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: approve withdrawal
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E676),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Approve',
                      style: TextStyle(
                          color: Colors.black,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: SizedBox(
                height: 36,
                child: OutlinedButton(
                  onPressed: () {
                    // TODO: reject withdrawal
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Reject',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(timeAgo,
                style: TextStyle(
                    color: context.txtSec, fontSize: 10)),
          ]),
        ] else
          Align(
            alignment: Alignment.centerRight,
            child: Text(timeAgo,
                style: TextStyle(
                    color: context.txtSec, fontSize: 10)),
          ),
      ]),
    );
  }
}
