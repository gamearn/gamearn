import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class InviteFriendsScreen extends StatelessWidget {
  const InviteFriendsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final referralCode = uid.length >= 8 ? uid.substring(0, 8).toUpperCase() : 'GAMEARN1';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
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
                  Text('Invite Friends', style: context.titleStyle),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    // Hero
                    Container(
                      width: 120, height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.cyan.withOpacity(0.1),
                        border: Border.all(
                            color: context.cyan.withOpacity(0.3), width: 2),
                      ),
                      child: const Center(
                          child: Text('🎁', style: TextStyle(fontSize: 52))),
                    ),
                    const SizedBox(height: 20),
                    Text('Invite & Earn',
                        style: context.titleStyle.copyWith(fontSize: 24)),
                    const SizedBox(height: 8),
                    Text(
                      'Invite friends and earn ₦500 for every friend that signs up and plays their first game.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: context.subText, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 32),

                    // Referral code box
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: context.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: context.cyan.withOpacity(0.2)),
                      ),
                      child: Column(
                        children: [
                          Text('Your Referral Code',
                              style: TextStyle(
                                  color: context.subText, fontSize: 13)),
                          const SizedBox(height: 12),
                          Text(referralCode,
                              style: TextStyle(
                                  color: context.cyan,
                                  fontSize: 32,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 6)),
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: const Text('Code copied!'),
                                  backgroundColor: context.cyan,
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 24, vertical: 10),
                              decoration: BoxDecoration(
                                color: context.cyan.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                    color: context.cyan.withOpacity(0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.copy, color: context.cyan, size: 16),
                                  const SizedBox(width: 8),
                                  Text('Copy Code',
                                      style: TextStyle(
                                          color: context.cyan,
                                          fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Share button
                    GestureDetector(
                      onTap: () {
                        // Share.share('Join me on Gamearn! Use my code $referralCode');
                      },
                      child: Container(
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          color: context.orange,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.share, color: Colors.white, size: 20),
                            SizedBox(width: 10),
                            Text('Share Invite Link',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
