import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';
import '../../services/api_service.dart';

// ---------------------------------------------------------------------------
// BuyCoinsScreen
// Stack: Flutter + Paystack (backend handles charge initiation + webhook)
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class BuyCoinsScreen extends StatefulWidget {
  const BuyCoinsScreen({super.key});

  @override
  State<BuyCoinsScreen> createState() => _BuyCoinsScreenState();
}

class _BuyCoinsScreenState extends State<BuyCoinsScreen>
    with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFF0B0E1A);
  static const _cyan = Color(0xFF22D1EE);


  int _selectedIndex = -1;
  bool _isLoading = false;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  // Coin bundles: {coins, price (NGN), bonus, popular}
  final List<Map<String, dynamic>> _bundles = [
    {'coins': 100, 'price': 200, 'bonus': 0, 'popular': false},
    {'coins': 500, 'price': 900, 'bonus': 50, 'popular': false},
    {'coins': 1000, 'price': 1700, 'bonus': 150, 'popular': true},
    {'coins': 2500, 'price': 4000, 'bonus': 500, 'popular': false},
    {'coins': 5000, 'price': 7500, 'bonus': 1200, 'popular': false},
    {'coins': 10000, 'price': 14000, 'bonus': 3000, 'popular': false},
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

  void _selectBundle(int index) {
    HapticFeedback.selectionClick();
    setState(() => _selectedIndex = index);
  }

  Future<void> _purchase() async {
    if (_selectedIndex < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a coin bundle first')),
      );
      return;
    }
    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    final bundle = _bundles[_selectedIndex];
    try {
      // 1. Initiate Paystack payment on the backend
      final init = await ApiService.initiateTopUp(
        amount: (bundle['price'] as int).toDouble(),
        paymentMethod: 'card',
      );
      final paymentLink = init['paymentLink'] as String?;
      final txRef = init['txRef'] as String?;
      if (paymentLink == null || txRef == null) {
        throw ApiException(
          code: 'INIT_FAILED',
          message: 'Could not start payment. Please try again.',
        );
      }

      // 2. Open the Paystack hosted page
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

      // 3. Poll backend until the payment settles (or times out)
      const attempts = 30; // ~90s
      for (var i = 0; i < attempts; i++) {
        await Future.delayed(const Duration(seconds: 3));
        final status = await ApiService.verifyTransaction(txRef);
        final state = status['status'] as String?;
        if (state == 'completed') {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Top-up of ${bundle['coins']} coins successful!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.maybePop(context);
          return;
        }
        if (state == 'failed') {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment failed. Please try again.')),
          );
          return;
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Payment still pending. Check your wallet shortly.')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
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
    final bundle =
        _selectedIndex >= 0 ? _bundles[_selectedIndex] : null;

    return Scaffold(
      backgroundColor: context.bg,
      appBar: AppBar(
        backgroundColor: context.bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: context.txtPri, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Buy Coins',
          style: TextStyle(
            color: context.txtPri,
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
          // Grid of bundles
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                padding: const EdgeInsets.only(top: 8, bottom: 120),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _bundles.length,
                itemBuilder: (ctx, i) => _BundleCard(
                  bundle: _bundles[i],
                  selected: _selectedIndex == i,
                  onTap: () => _selectBundle(i),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _BottomBar(
        bundle: bundle,
        isLoading: _isLoading,
        onPurchase: _purchase,
      ),
    );
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
          colors: [Color(0xFF0E3A4A), Color(0xFF0B0E1A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF22D1EE).withOpacity(0.25)),
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
                color: const Color(0xFF22D1EE).withOpacity(0.12),
              ),
              child: const Icon(Icons.monetization_on_rounded,
                  color: Color(0xFF22D1EE), size: 30),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Power Up Your Game',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 15)),
                SizedBox(height: 4),
                Text(
                  'Coins unlock tournaments, power-ups, and exclusive rewards.',
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

class _BundleCard extends StatelessWidget {
  final Map<String, dynamic> bundle;
  final bool selected;
  final VoidCallback onTap;

  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);
  static const _surface = Color(0xFF141827);
  static const _border = Color(0xFF1E2438);

  const _BundleCard({
    required this.bundle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bool popular = bundle['popular'] as bool;
    final int bonus = bundle['bonus'] as int;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: selected
              ? _cyan.withOpacity(0.08)
              : context.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected
                ? _cyan
                : popular
                    ? _orange.withOpacity(0.5)
                    : context.border,
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
                    color: _orange,
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(14),
                      bottomLeft: Radius.circular(8),
                    ),
                  ),
                  child: const Text('BEST',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
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
                          color: selected ? _cyan : Colors.amber, size: 20),
                      const SizedBox(width: 6),
                      Text(
                        _formatNum(bundle['coins'] as int),
                        style: TextStyle(
                          color: selected ? _cyan : context.txtPri,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                  if (bonus > 0) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text('+$bonus bonus',
                          style: const TextStyle(
                              color: Colors.greenAccent,
                              fontSize: 10,
                              fontWeight: FontWeight.w600)),
                    ),
                  ],
                  const Spacer(),
                  Text(
                    '₦${_formatNum(bundle['price'] as int)}',
                    style: TextStyle(
                      color: context.txtPri,
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
                      color: _cyan, shape: BoxShape.circle),
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
  final Map<String, dynamic>? bundle;
  final bool isLoading;
  final VoidCallback onPurchase;

  static const _cyan = Color(0xFF22D1EE);

  const _BottomBar({
    required this.bundle,
    required this.isLoading,
    required this.onPurchase,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: context.card,
        border: Border(top: BorderSide(color: context.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (bundle != null) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${bundle!['coins']} coins${bundle!['bonus'] > 0 ? ' + ${bundle!['bonus']} bonus' : ''}',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                Text(
                  '₦${bundle!['price']}',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 15),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : onPurchase,
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
                      bundle == null
                          ? 'Select a Bundle'
                          : 'Pay with Paystack',
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
          const Text('Secured by Paystack  •  Instant credit',
              style: TextStyle(color: Colors.white38, fontSize: 11)),
        ],
      ),
    );
  }
}
