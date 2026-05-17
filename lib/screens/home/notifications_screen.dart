import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Cyan header bar — matches Figma
            Container(
              width: double.infinity,
              height: 88,
              color: context.cyan,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Icon(Icons.arrow_back_ios_new,
                        color: context.bg, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Text('Notifications',
                      style: context.titleStyle
                          .copyWith(color: context.bg, fontSize: 20)),
                ],
              ),
            ),
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: uid == null
                    ? null
                    : FirebaseFirestore.instance
                        .collection('users')
                        .doc(uid)
                        .collection('notifications')
                        .orderBy('createdAt', descending: true)
                        .snapshots(),
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final docs = snap.data?.docs ?? [];
                  if (docs.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.notifications_none,
                              size: 64, color: context.subText),
                          const SizedBox(height: 12),
                          Text('No notifications',
                              style: TextStyle(color: context.subText)),
                        ],
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: docs.length,
                    itemBuilder: (context, i) {
                      final data =
                          docs[i].data() as Map<String, dynamic>;
                      final read = data['read'] as bool? ?? false;
                      final type = data['type'] as String? ?? 'info';
                      final color = _notifColor(context, type);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: read
                              ? context.surface
                              : color.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: read
                                  ? Colors.transparent
                                  : color.withOpacity(0.25)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(_notifIcon(type),
                                  color: color, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    data['title'] as String? ?? 'Notification',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: read
                                          ? FontWeight.w500
                                          : FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (data['body'] != null)
                                    Text(
                                      data['body'] as String,
                                      style: TextStyle(
                                          color: context.subText,
                                          fontSize: 12),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                ],
                              ),
                            ),
                            if (!read)
                              Container(
                                width: 8, height: 8,
                                decoration: BoxDecoration(
                                  color: color,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _notifColor(BuildContext context, String type) {
    switch (type) {
      case 'win': return const Color(0xFF22C55E);
      case 'tournament': return const Color(0xFF8C2BEE);
      case 'wallet': return context.orange;
      default: return context.cyan;
    }
  }

  IconData _notifIcon(String type) {
    switch (type) {
      case 'win': return Icons.emoji_events_outlined;
      case 'tournament': return Icons.sports_esports_outlined;
      case 'wallet': return Icons.account_balance_wallet_outlined;
      default: return Icons.notifications_outlined;
    }
  }
}
