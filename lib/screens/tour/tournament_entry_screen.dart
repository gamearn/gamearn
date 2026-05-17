import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../wallet/buy_coins_screen.dart';
import 'live_tournament_screen.dart';

// ---------------------------------------------------------------------------
// TournamentEntryScreen
// Stack: Flutter + Firestore (atomic coin deduction + registration)
//        Socket.io: emit 'join_tournament' after Firestore write
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class TournamentEntryScreen extends StatefulWidget {
  final String tournamentId;
  final int entryFee;
  final String title;

  const TournamentEntryScreen({
    super.key,
    required this.tournamentId,
    required this.entryFee,
    required this.title,
  });

  @override
  State<TournamentEntryScreen> createState() => _TournamentEntryScreenState();
}

class _TournamentEntryScreenState extends State<TournamentEntryScreen>
    with SingleTickerProviderStateMixin {
  static const _bg = Color(0xFF0B0E1A);
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);


  // Mock wallet balance — fetch from Firestore /users/{uid}/wallet
  final int _coinBalance = 1240;
  bool _isLoading = false;
  bool _agreed = false;

  late AnimationController _checkCtrl;
  late Animation<double> _checkAnim;

  bool get _canAfford => _coinBalance >= widget.entryFee;

  @override
  void initState() {
    super.initState();
    _checkCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _checkAnim = CurvedAnimation(parent: _checkCtrl, curve: Curves.elasticOut);
  }

  @override
  void dispose() {
    _checkCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirmEntry() async {
    if (!_canAfford) {
      _showInsufficientCoinsSheet();
      return;
    }
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please accept the tournament rules to proceed.')),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);

    // TODO: Firestore transaction:
    //   1. Read /users/{uid}/wallet.coins
    //   2. Assert >= entryFee
    //   3. Deduct entryFee from wallet
    //   4. Create /tournaments/{tournamentId}/registrations/{uid}
    //   5. Increment /tournaments/{tournamentId}.registeredPlayers
    // On success → Socket.io emit 'join_tournament', {tournamentId, uid}
    await Future.delayed(const Duration(seconds: 2)); // placeholder

    if (!mounted) return;
    setState(() => _isLoading = false);
    _showSuccessSheet();
  }

  void _showSuccessSheet() {
    HapticFeedback.heavyImpact();
    _checkCtrl.forward();

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: const Color(0xFF141827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 32, 24, 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: _checkAnim,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _cyan.withOpacity(0.12),
                  border: Border.all(color: _cyan, width: 2),
                ),
                child: const Icon(Icons.check_rounded, color: _cyan, size: 40),
              ),
            ),
            const SizedBox(height: 20),
            const Text("You're In!",
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 24)),
            const SizedBox(height: 8),
            Text(
              'Successfully registered for\n${widget.title}',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 6),
            Text(
              '${widget.entryFee} coins deducted',
              style: const TextStyle(color: Colors.white38, fontSize: 12),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _orange,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pop(ctx); // close sheet
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => LiveTournamentScreen(
                        tournamentId: widget.tournamentId,
                        tournamentTitle: widget.title,
                      ),
                    ),
                  );
                },
                child: const Text('Go to Tournament',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showInsufficientCoinsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.monetization_on_rounded,
                color: Colors.redAccent, size: 40),
            const SizedBox(height: 12),
            const Text('Not Enough Coins',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            const SizedBox(height: 8),
            Text(
              'You need ${widget.entryFee - _coinBalance} more coins.',
              style: const TextStyle(color: Colors.white54, fontSize: 13),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _cyan,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const BuyCoinsScreen()),
                  );
                },
                child: const Text('Buy Coins',
                    style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w800,
                        fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final int deficit =
        _canAfford ? 0 : widget.entryFee - _coinBalance;

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
          'Confirm Entry',
          style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Tournament info card ──────────────────────────────────
            _InfoCard(title: widget.title, entryFee: widget.entryFee),
            const SizedBox(height: 20),

            // ── Wallet summary ────────────────────────────────────────
            _WalletCard(
              balance: _coinBalance,
              entryFee: widget.entryFee,
              canAfford: _canAfford,
              deficit: deficit,
            ),
            const SizedBox(height: 20),

            // ── Entry breakdown ───────────────────────────────────────
            _BreakdownCard(entryFee: widget.entryFee),
            const SizedBox(height: 20),

            // ── Rules agreement ───────────────────────────────────────
            _RulesAgreement(
              value: _agreed,
              onChanged: (v) => setState(() => _agreed = v),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),

      // ── Bottom confirm button ─────────────────────────────────────────
      bottomNavigationBar: _ConfirmBar(
        isLoading: _isLoading,
        canAfford: _canAfford,
        agreed: _agreed,
        entryFee: widget.entryFee,
        onConfirm: _confirmEntry,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sub-widgets
// ---------------------------------------------------------------------------

class _InfoCard extends StatelessWidget {
  final String title;
  final int entryFee;
  const _InfoCard({required this.title, required this.entryFee});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0E3A4A), Color(0xFF0B0E1A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF22D1EE).withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tournament',
              style: TextStyle(color: Colors.white38, fontSize: 11)),
          const SizedBox(height: 4),
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 20)),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.monetization_on_rounded,
                  color: Color(0xFFFF5E00), size: 18),
              const SizedBox(width: 6),
              Text('$entryFee coins entry',
                  style: const TextStyle(
                      color: Color(0xFFFF5E00),
                      fontWeight: FontWeight.w700,
                      fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}

class _WalletCard extends StatelessWidget {
  final int balance;
  final int entryFee;
  final bool canAfford;
  final int deficit;

  const _WalletCard({
    required this.balance,
    required this.entryFee,
    required this.canAfford,
    required this.deficit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: canAfford
              ? const Color(0xFF1E2438)
              : Colors.redAccent.withOpacity(0.4),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFF22D1EE).withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.account_balance_wallet_outlined,
                color: Color(0xFF22D1EE), size: 22),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your Balance',
                  style: TextStyle(color: Colors.white38, fontSize: 12)),
              Text('$balance coins',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
            ],
          ),
          const Spacer(),
          if (!canAfford)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('Short by',
                    style: TextStyle(color: Colors.redAccent, fontSize: 11)),
                Text('$deficit coins',
                    style: const TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text('After entry',
                    style: TextStyle(color: Colors.white38, fontSize: 11)),
                Text('${balance - entryFee} coins',
                    style: const TextStyle(
                        color: Colors.white70,
                        fontWeight: FontWeight.w600,
                        fontSize: 14)),
              ],
            ),
        ],
      ),
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  final int entryFee;
  const _BreakdownCard({required this.entryFee});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1E2438)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Entry Breakdown',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 14)),
          const SizedBox(height: 12),
          _breakdownRow('Entry fee', '$entryFee coins'),
          _breakdownRow('Platform fee', '0 coins'),
          const Divider(height: 20, color: Color(0xFF1E2438)),
          _breakdownRow('Total deducted', '$entryFee coins',
              highlight: true),
        ],
      ),
    );
  }

  Widget _breakdownRow(String label, String value,
      {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: highlight ? Colors.white : Colors.white54,
                  fontSize: 13,
                  fontWeight:
                      highlight ? FontWeight.w700 : FontWeight.w400)),
          Text(value,
              style: TextStyle(
                  color: highlight
                      ? const Color(0xFFFF5E00)
                      : Colors.white70,
                  fontSize: 13,
                  fontWeight:
                      highlight ? FontWeight.w800 : FontWeight.w500)),
        ],
      ),
    );
  }
}

class _RulesAgreement extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _RulesAgreement({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              color: value
                  ? const Color(0xFF22D1EE)
                  : Colors.transparent,
              border: Border.all(
                color: value
                    ? const Color(0xFF22D1EE)
                    : const Color(0xFF1E2438),
                width: 1.5,
              ),
            ),
            child: value
                ? const Icon(Icons.check_rounded,
                    color: Colors.black, size: 14)
                : null,
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'I understand that entry fees are non-refundable and I agree to the Gamearn tournament rules.',
              style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConfirmBar extends StatelessWidget {
  final bool isLoading;
  final bool canAfford;
  final bool agreed;
  final int entryFee;
  final VoidCallback onConfirm;

  const _ConfirmBar({
    required this.isLoading,
    required this.canAfford,
    required this.agreed,
    required this.entryFee,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final bool ready = canAfford && agreed && !isLoading;

    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      decoration: const BoxDecoration(
        color: Color(0xFF0F1220),
        border: Border(top: BorderSide(color: Color(0xFF1E2438))),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: ready ? onConfirm : (!canAfford ? onConfirm : null),
          style: ElevatedButton.styleFrom(
            backgroundColor: !canAfford
                ? Colors.redAccent.withOpacity(0.8)
                : ready
                    ? const Color(0xFFFF5E00)
                    : const Color(0xFFFF5E00).withOpacity(0.4),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5))
              : Text(
                  !canAfford
                      ? 'Buy Coins First'
                      : 'Confirm Entry · $entryFee Coins',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      letterSpacing: 0.2),
                ),
        ),
      ),
    );
  }
}
