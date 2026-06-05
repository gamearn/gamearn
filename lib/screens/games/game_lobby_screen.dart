import 'package:flutter/material.dart';
import '../../theme.dart';
import 'package:gamearn/screens/games/ludo_game_screen.dart';

// ─────────────────────────────────────────────────────────────────
//  GAME LOBBY SCREEN (Pre-game Info)
//  Select mode: vs Computer or vs Player.
//  Game specific options: Token count (Ludo), Hand size (Whot).
// ─────────────────────────────────────────────────────────────────

class GameLobbyScreen extends StatefulWidget {
  final String gameTitle;
  final Widget gameScreen;
  final String gameKey; // e.g. 'whot', 'ludo', 'ayo', 'draughts'

  const GameLobbyScreen({
    super.key,
    required this.gameTitle,
    required this.gameScreen,
    required this.gameKey,
  });

  @override
  State<GameLobbyScreen> createState() => _GameLobbyScreenState();
}

class _GameLobbyScreenState extends State<GameLobbyScreen> {
  bool _vsPlayer = true;
  int _selectedPlayers = 2;
  double _stakeAmount = 1000;
  
  // Game specific state
  int _whotHandSize = 5;
  int _ludoTokens = 4;

  final List<int> _playerOptions = [2, 3, 4];
  final List<double> _stakeOptions = [500, 1000, 2000, 5000, 10000];
  final List<int> _handSizeOptions = [4, 5, 6, 7];
  final List<int> _tokenOptions = [2, 4];

  @override
  Widget build(BuildContext context) {
    final double totalPot = _stakeAmount * _selectedPlayers;
    
    // In vs Computer, you don't stake real money in this mock, or pot is different.
    // For now we keep the UI consistent.
    final potText = _vsPlayer 
        ? '₦ ${totalPot.toStringAsFixed(0).replaceAllMapped(RegExp(r"\B(?=(\d{3})+(?!\d))"), (match) => ",")}'
        : 'Practice Mode';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
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
                    // ── Mode Toggle (vs Player / vs Computer) ─────────────────────────────────
                    Container(
                      height: 50,
                      decoration: BoxDecoration(
                        color: const Color(0xFF141827),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(color: const Color(0xFF1E2438)),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _buildTab(title: 'Vs Player', isActive: _vsPlayer, onTap: () => setState(() => _vsPlayer = true))),
                          Expanded(child: _buildTab(title: 'Vs Computer', isActive: !_vsPlayer, onTap: () => setState(() => _vsPlayer = false))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── Game Specific Settings ───────────────────────────────
                    if (widget.gameKey == 'whot') ...[
                      const Text('Hand Size', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: _handSizeOptions.map((s) => _buildOptionBox(
                          label: '$s', 
                          isActive: _whotHandSize == s, 
                          onTap: () => setState(() => _whotHandSize = s)
                        )).toList(),
                      ),
                      const SizedBox(height: 32),
                    ] else if (widget.gameKey == 'ludo') ...[
                      const Text('Token Count', style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: _tokenOptions.map((t) => Padding(
                          padding: const EdgeInsets.only(right: 16),
                          child: _buildOptionBox(
                            label: '$t Tokens', 
                            isActive: _ludoTokens == t, 
                            onTap: () => setState(() => _ludoTokens = t),
                            width: 100,
                          ),
                        )).toList(),
                      ),
                      const SizedBox(height: 32),
                    ],

                    // ── Players (Only if Vs Player) ──────────────
                    if (_vsPlayer) ...[
                      const Text(
                        'Players',
                        style: TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: _playerOptions.map((p) => _buildOptionBox(
                          label: '$p', 
                          isActive: _selectedPlayers == p, 
                          onTap: () => setState(() => _selectedPlayers = p),
                        )).toList(),
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
                    ],

                    // ── Total Pot Summary ────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF141827),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF1E2438)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total pot',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                          ),
                          Text(
                            potText,
                            style: const TextStyle(color: Color(0xFF22D1EE), fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
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
                    Widget screen = widget.gameScreen;
                    if (widget.gameKey == 'ludo') {
                      screen = LudoGameScreen(tokenCount: _ludoTokens);
                    }
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => screen),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF22D1EE),
                    foregroundColor: const Color(0xFF0B0E1A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Play Now',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
          color: isActive ? const Color(0xFF22D1EE).withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isActive ? const Color(0xFF22D1EE) : Colors.white54,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildOptionBox({required String label, required bool isActive, required VoidCallback onTap, double width = 65}) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: width,
        height: 65,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF22D1EE).withOpacity(0.1) : const Color(0xFF141827),
          border: Border.all(color: isActive ? const Color(0xFF22D1EE) : const Color(0xFF1E2438), width: isActive ? 2 : 1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? const Color(0xFF22D1EE) : Colors.white,
            fontSize: 18,
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
          color: isActive ? const Color(0xFF22D1EE).withOpacity(0.1) : const Color(0xFF141827),
          border: Border.all(color: isActive ? const Color(0xFF22D1EE) : const Color(0xFF1E2438), width: isActive ? 2 : 1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '₦${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r"\B(?=(\d{3})+(?!\d))"), (match) => ",")}',
          style: TextStyle(
            color: isActive ? const Color(0xFF22D1EE) : Colors.white70,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}
