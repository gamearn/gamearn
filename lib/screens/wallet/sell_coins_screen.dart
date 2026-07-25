import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ---------------------------------------------------------------------------
// SellCoinsScreen
// Mirror of BuyCoinsScreen — user sells coins back for cash
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class SellCoinsScreen extends StatefulWidget {
  const SellCoinsScreen({super.key});

  @override
  State<SellCoinsScreen> createState() => _SellCoinsScreenState();
}

class _SellCoinsScreenState extends State<SellCoinsScreen>
    with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFF0B0E1A);
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);

  int _selectedIndex = -1;
  bool _isLoading = false;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  // Sell tiers: {coins, payout (NGN), rate per coin}
  final List<Map<String, dynamic>> _tiers = [
    {'coins': 100, 'payout': 180, 'rate': 1.80},
    {'coins': 500, 'payout': 925, 'rate': 1.85},
    {'coins': 1000, 'payout': 1900, 'rate': 1.90, 'popular': true},
    {'coins': 2500, 'payout': 4875, 'rate': 1.95},
    {'coins': 5000, 'payout': 10000, 'rate': 2.00},
    {'coins': 10000, 'payout': 21000, 'rate': 2.10},
  ];

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  void _selectTier(int index) {
    HapticFeedback.selectionClick();
    setState(() => _selectedIndex = index);
  }

  Future<void> _sell() async {
    if (_selectedIndex < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a sell tier first')),
      );
      return;
    }
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    // TODO: call backend → POST /api/payments/initiate-coin-sell
    // Body: { tier_id: _selectedIndex, coins: tier['coins'], payout: tier['payout'] }
    // Backend queues payout to user's linked bank account
    await Future.delayed(const Duration(seconds: 2)); // placeholder

    if (mounted) {
      setState(() => _isLoading = false);
      _showConfirmDialog();
    }
  }

  void _showConfirmDialog() {
    final tier = _tiers[_selectedIndex];
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFF00E676).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline,
                  color: Color(0xFF00E676), size: 32),
            ),
            const SizedBox(height: 16),
            const Text('Sell Order Placed!',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              '${_formatNum(tier['coins'] as int)} coins will be sold for ₦${_formatNum(tier['payout'] as int)}',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
            ),
            const SizedBox(height: 6),
            const Text(
              'Payout will be sent to your linked bank account within 24 hours.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _cyan,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Done',
                    style: TextStyle(
                        color: Color(0xFF0B0E1A),
                        fontWeight: FontWeight.w800,
                        fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tier = _selectedIndex >= 0 ? _tiers[_selectedIndex] : null;

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Sell Coins',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                const Icon(Icons.monetization_on_rounded,
                    color: _cyan, size: 18),
                const SizedBox(width: 4),
                // TODO: pull from Firestore wallet stream
                const Text('1,240',
                    style: TextStyle(
                        color: _cyan,
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Header banner
          _HeaderBanner(pulseAnim: _pulseAnim),
          // Info strip
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _orange.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _orange.withOpacity(0.25)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded,
                      color: _orange, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Higher sell amounts get better rates. Payouts arrive within 24 hours.',
                      style: TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Grid of tiers
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                padding: const EdgeInsets.only(top: 4, bottom: 120),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _tiers.length,
                itemBuilder: (ctx, i) => _TierCard(
                  tier: _tiers[i],
                  selected: _selectedIndex == i,
                  onTap: () => _selectTier(i),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _BottomBar(
        tier: tier,
        isLoading: _isLoading,
        onSell: _sell,
      ),
    );
  }

  String _formatNum(int n) {
    if (n >= 1000) {
      final s = n.toString();
      final buf = StringBuffer();
      for (int i = 0; i < s.length; i++) {
        if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
        buf.write(s[i]);
      }
      return buf.toString();
    }
    return n.toString();
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _HeaderBanner extends StatelessWidget {
  final Animation<double> pulseAnim;
  const _HeaderBanner({required this.pulseAnim});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A3A2A), Color(0xFF0B0E1A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF00E676).withOpacity(0.25)),
      ),
      child: Row(
        children: [
          ScaleTransition(
            scale: pulseAnim,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF00E676).withOpacity(0.12),
              ),
              child: const Icon(Icons.account_balance_wallet_outlined,
                  color: Color(0xFF00E676), size: 28),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cash Out Your Coins',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15)),
                SizedBox(height: 4),
                Text(
                  'Convert your game earnings to cash. Higher amounts get better rates.',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TierCard extends StatelessWidget {
  final Map<String, dynamic> tier;
  final bool selected;
  final VoidCallback onTap;

  static const _cyan = Color(0xFF22D1EE);
  static const _green = Color(0xFF00E676);
  static const _surface = Color(0xFF141827);
  static const _border = Color(0xFF1E2438);

  const _TierCard({
    required this.tier,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bool popular = tier['popular'] == true;
    final double rate = tier['rate'] as double;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: selected ? _green.withOpacity(0.08) : _surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? _green
                : popular
                    ? _cyan.withOpacity(0.5)
                    : _border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Stack(
          children: [
            if (popular)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: const BoxDecoration(
                    color: _cyan,
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(14),
                      bottomLeft: Radius.circular(8),
                    ),
                  ),
                  child: const Text('BEST RATE',
                      style: TextStyle(
                          color: Color(0xFF0B0E1A),
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Icon(Icons.monetization_on_rounded,
                          color: selected ? _green : Colors.amber, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        _formatNum(tier['coins'] as int),
                        style: TextStyle(
                          color: selected ? _green : Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _cyan.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('₦${rate.toStringAsFixed(2)}/coin',
                        style: const TextStyle(
                            color: _cyan,
                            fontSize: 10,
                            fontWeight: FontWeight.w600)),
                  ),
                  const Spacer(),
                  Text(
                    '₦${_formatNum(tier['payout'] as int)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            if (selected)
              Positioned(
                bottom: 10,
                right: 10,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(
                      color: _green, shape: BoxShape.circle),
                  child: const Icon(Icons.check_rounded,
                      color: Colors.black, size: 14),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatNum(int n) {
    if (n >= 1000) {
      final s = n.toString();
      final buf = StringBuffer();
      for (int i = 0; i < s.length; i++) {
        if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
        buf.write(s[i]);
      }
      return buf.toString();
    }
    return n.toString();
  }
}

class _BottomBar extends StatelessWidget {
  final Map<String, dynamic>? tier;
  final bool isLoading;
  final VoidCallback onSell;

  static const _cyan = Color(0xFF22D1EE);

  const _BottomBar({
    required this.tier,
    required this.isLoading,
    required this.onSell,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: const BoxDecoration(
        color: Color(0xFF0F1220),
        border: Border(top: BorderSide(color: Color(0xFF1E2438))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (tier != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${tier!['coins']} coins → ₦${tier!['payout']}',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                Text(
                  '₦${(tier!['rate'] as double).toStringAsFixed(2)}/coin',
                  style: const TextStyle(
                      color: _cyan,
                      fontWeight: FontWeight.w700,
                      fontSize: 14),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : onSell,
              style: ElevatedButton.styleFrom(
                backgroundColor: _cyan,
                disabledBackgroundColor: _cyan.withOpacity(0.4),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          color: Colors.black, strokeWidth: 2.5))
                  : Text(
                      tier == null
                          ? 'Select a Tier'
                          : 'Sell ${tier!['coins']} Coins',
                      style: const TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        letterSpacing: 0.3,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          const Text('Payout via bank transfer  •  Within 24 hours',
              style: TextStyle(color: Colors.white38, fontSize: 11)),
        ],
      ),
    );
  }
}
