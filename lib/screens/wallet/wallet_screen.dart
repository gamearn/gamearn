import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../theme.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

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

            final units   = wallet['units']    ?? 0;
            final usd     = wallet['usdEquiv'] ?? 0.0;
            final streak  = wallet['streakDays'] ?? 0;
            final level   = wallet['level']    ?? 1;

            return CustomScrollView(
              slivers: [
                // ── Title ────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Text('Wallet & Earnings',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 18,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                // ── Balance hero ──────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Column(
                      children: [
                        // Avatar circle with level badge
                        Stack(
                          alignment: Alignment.bottomCenter,
                          children: [
                            Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: kCyan, width: 2.5),
                                color: context.card,
                              ),
                              child: const Center(
                                child: Text('💰',
                                    style: TextStyle(fontSize: 42)),
                              ),
                            ),
                            Positioned(
                              bottom: -2,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: kCyan,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text('LEVEL $level',
                                    style: const TextStyle(
                                        color: kBgDeep,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Units
                        RichText(
                          text: TextSpan(
                            text: '${NumberFormat('#,##0').format(units)}',
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 38,
                                fontWeight: FontWeight.w900),
                            children: [
                              TextSpan(
                                text: '/Units',
                                style: TextStyle(
                                    color: kCyan,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text('\$${usd.toStringAsFixed(2)} USD Equivalent',
                            style: TextStyle(color: context.txtSec, fontSize: 13)),
                        const SizedBox(height: 10),

                        // Streak badge
                        if (streak >= 90)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 6),
                            decoration: BoxDecoration(
                              color: kOrange.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: kOrange.withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.local_fire_department,
                                    color: kOrange, size: 14),
                                const SizedBox(width: 6),
                                Text('${streak}-Day Streak Active',
                                    style: const TextStyle(
                                        color: kOrange,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                // ── Tab bar ───────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: TabBar(
                      controller: _tabCtrl,
                      isScrollable: true,
                      indicatorColor: kCyan,
                      indicatorSize: TabBarIndicatorSize.label,
                      labelColor: context.txtPri,
                      unselectedLabelColor: context.txtSec,
                      labelStyle: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 14),
                      dividerColor: kBorder,
                      tabs: const [
                        Tab(text: 'Overview'),
                        Tab(text: 'Buy'),
                        Tab(text: 'Sell'),
                        Tab(text: 'Withdraw'),
                      ],
                    ),
                  ),
                ),

                // ── Action buttons (Add Funds / Cash Out) ─────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () =>
                                _showComingSoon(context, 'Add Funds'),
                            icon: const Icon(Icons.add_circle_outline,
                                size: 18),
                            label: const Text('Add Funds'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kCyan,
                              foregroundColor: kBgDeep,
                              padding: const EdgeInsets.symmetric(
                                  vertical: 14),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              textStyle: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () =>
                                _showComingSoon(context, 'Cash Out'),
                            icon: const Icon(
                                Icons.account_balance_wallet_outlined,
                                size: 18),
                            label: const Text('Cash Out'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: kTextPri,
                              padding: const EdgeInsets.symmetric(
                                  vertical: 14),
                              side: const BorderSide(color: kBorder),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              textStyle: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Transaction History header ─────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Transaction History',
                            style: TextStyle(
                                color: context.txtPri,
                                fontWeight: FontWeight.w800,
                                fontSize: 16)),
                        TextButton(
                          onPressed: () {},
                          child: const Text('View All',
                              style: TextStyle(color: kCyan)),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Transactions ──────────────────────────────────────────
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
                      return const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history_toggle_off, color: kTextMuted, size: 48),
                              SizedBox(height: 12),
                              Text('No transactions yet',
                                  style: TextStyle(color: kTextSec, fontSize: 14)),
                              SizedBox(height: 4),
                              Text('Your gaming wins will appear here',
                                  style: TextStyle(color: kTextMuted, fontSize: 12)),
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
                          final credit = d['type'] == 'credit';
                          return _TxRow(mock: {
                            'icon': credit
                                ? Icons.emoji_events
                                : Icons.shopping_cart,
                            'color': credit ? kGreen : kOrange,
                            'title': d['description'] ?? '',
                            'date': _fmtDate(d['createdAt']),
                            'amount':
                                '${credit ? '+' : '-'}${d['units'] ?? 0} Units',
                            'usd':
                                '${credit ? '+' : '-'}\$${d['usdAmount'] ?? 0}',
                            'credit': credit,
                          });
                        },
                        childCount: docs.length,
                      ),
                    );
                  },
                ),

                const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showComingSoon(BuildContext ctx, String label) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text('$label — coming soon!'),
      backgroundColor: kBgCard,
      behavior: SnackBarBehavior.floating,
    ));
  }

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

class _TxRow extends StatelessWidget {
  final Map<String, dynamic> mock;
  const _TxRow({required this.mock});

  @override
  Widget build(BuildContext context) {
    final color  = mock['color'] as Color;
    final credit = mock['credit'] as bool;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(mock['icon'] as IconData, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(mock['title'] as String,
                    style: TextStyle(
                        color: context.txtPri,
                        fontWeight: FontWeight.w600,
                        fontSize: 13)),
                const SizedBox(height: 3),
                Text(mock['date'] as String,
                    style: TextStyle(color: context.txtSec, fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(mock['amount'] as String,
                  style: TextStyle(
                      color: credit ? kGreen : kOrange,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
              Text(mock['usd'] as String,
                  style: kSub.copyWith(fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}
