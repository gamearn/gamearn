import 'package:flutter/material.dart';

class LudoGameScreen extends StatelessWidget {
  const LudoGameScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Lúùdò',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Opponent Info
            _buildPlayerInfo('Opponent', 'Waiting...', isTurn: false),
            
            const Spacer(),
            
            // Ludo Board Frame
            AspectRatio(
              aspectRatio: 1,
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF141827),
                  border: Border.all(color: const Color(0xFF1E2438), width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text(
                    'Ludo Board Widget Placeholder',
                    style: TextStyle(color: Color(0xFF22D1EE)),
                  ),
                ),
              ),
            ),
            
            const Spacer(),
            
            // Player Info
            _buildPlayerInfo('You', 'Your Turn', isTurn: true),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerInfo(String name, String status, {required bool isTurn}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFF141827),
                radius: 24,
                child: Icon(Icons.person, color: isTurn ? const Color(0xFF22D1EE) : Colors.white54),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  Text(status, style: TextStyle(color: isTurn ? const Color(0xFFFF5E00) : Colors.white54, fontSize: 12)),
                ],
              ),
            ],
          ),
          // Placeholder for dice
          if (isTurn)
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF141827),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF22D1EE)),
              ),
              child: const Center(child: Icon(Icons.casino, color: Color(0xFF22D1EE))),
            ),
        ],
      ),
    );
  }
}
