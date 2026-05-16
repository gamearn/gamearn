import 'package:flutter/material.dart';
import '../../theme.dart';
import 'whot_game_screen.dart';

// ─────────────────────────────────────────────────────────────────
//  WHOT GAME SET-UP SCREEN
//  Matches Figma design: "Wọ́t Game Set-up screen.svg"
// ─────────────────────────────────────────────────────────────────

class GameSetupScreen extends StatefulWidget {
  final String gameTitle;
  final Widget gameScreen;

  const GameSetupScreen({
    super.key,
    required this.gameTitle,
    required this.gameScreen,
  });

  @override
  State<GameSetupScreen> createState() => _GameSetupScreenState();
}

class _GameSetupScreenState extends State<GameSetupScreen> {
  bool _isCreateGame = true;
  int _selectedPlayers = 2;
  double _stakeAmount = 1000;

  final List<int> _playerOptions = [2, 3, 4, 5];
  final List<double> _stakeOptions = [500, 1000, 2000, 5000, 10000];

  @override
  Widget build(BuildContext context) {
    final double totalPot = _stakeAmount * _selectedPlayers;

    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.gameTitle,
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Create / Join Toggle ─────────────────────────────────
                    Container(
                      height: 50,
                      decoration: BoxDecoration(
                        color: kBgCard,
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: kBorder),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _buildTab(title: 'Create Game', isActive: _isCreateGame, onTap: () => setState(() => _isCreateGame = true))),
                          Expanded(child: _buildTab(title: 'Join Game', isActive: !_isCreateGame, onTap: () => setState(() => _isCreateGame = false))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── Game Parameters (Only if Creating Game) ──────────────
                    if (_isCreateGame) ...[
                      // Players
                      const Text(
                        'Players',
                        style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: _playerOptions.map((p) => _buildPlayerOption(p)).toList(),
                      ),
                      const SizedBox(height: 32),

                      // Stake Amount
                      const Text(
                        'Stake amount',
                        style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: _stakeOptions.map((s) => _buildStakeOption(s)).toList(),
                      ),
                      const SizedBox(height: 32),

                      // Total Pot Summary
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: kBgCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: kBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total pot',
                              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              '₦ ${totalPot.toStringAsFixed(0).replaceAllMapped(RegExp(r"\\B(?=(\\d{3})+(?!\\d))"), (match) => ",")}',
                              style: const TextStyle(color: kCyan, fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      // ── Join Game Section ──────────────────────────────────
                      const Text(
                        'Enter Game Code',
                        style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        style: const TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 2),
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(
                          hintText: 'e.g. WH-1234',
                          hintStyle: const TextStyle(color: Colors.white24, letterSpacing: 0),
                          filled: true,
                          fillColor: kBgCard,
                          contentPadding: const EdgeInsets.symmetric(vertical: 20),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: kBorder),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: kBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: kCyan),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // ── Play Button ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    // Navigate to actual game screen
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => widget.gameScreen),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kCyan,
                    foregroundColor: kBgDeep,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text(
                    _isCreateGame ? 'Play Now' : 'Join Game',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab({required String title, required bool isActive, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? kCyan.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isActive ? kCyan : Colors.white54,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildPlayerOption(int count) {
    final isActive = _selectedPlayers == count;
    return GestureDetector(
      onTap: () => setState(() => _selectedPlayers = count),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 65,
        height: 65,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? kCyan.withOpacity(0.1) : kBgCard,
          border: Border.all(color: isActive ? kCyan : kBorder, width: isActive ? 2 : 1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          '$count',
          style: TextStyle(
            color: isActive ? kCyan : Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildStakeOption(double amount) {
    final isActive = _stakeAmount == amount;
    return GestureDetector(
      onTap: () => setState(() => _stakeAmount = amount),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? kCyan.withOpacity(0.1) : kBgCard,
          border: Border.all(color: isActive ? kCyan : kBorder, width: isActive ? 2 : 1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '₦${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r"\\B(?=(\\d{3})+(?!\\d))"), (match) => ",")}',
          style: TextStyle(
            color: isActive ? kCyan : Colors.white70,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}
