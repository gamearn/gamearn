import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  NOTIFICATIONS SCREEN — Figma matched (390×844)
//
//  Each row height ~96px:
//    icon box 48×48 rx=12:
//      tournament win  → #22D1EE
//      challenge       → #FF5E00
//      achievement     → #3B82F6
//      reward          → #8C2BEE
//      streak          → #FFC107
//    unread dot: 8×8 #22D1EE top-right of icon
//    timestamp right-aligned #94A3B8
// ════════════════════════════════════════════════════════════════

const _kTypeColors = {
  'tournament': Color(0xFF22D1EE),
  'challenge':  Color(0xFFFF5E00),
  'achievement':Color(0xFF3B82F6),
  'reward':     Color(0xFF8C2BEE),
  'streak':     Color(0xFFFFC107),
  'system':     Color(0xFF3B82F6),
};

const _kTypeIcons = {
  'tournament': Icons.emoji_events_rounded,
  'challenge':  Icons.sports_kabaddi_rounded,
  'achievement':Icons.star_rounded,
  'reward':     Icons.card_giftcard_rounded,
  'streak':     Icons.local_fire_department_rounded,
  'system':     Icons.info_outline_rounded,
};

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [

          // ── HEADER ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.border),
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.white, size: 16),
                ),
              ),
              const SizedBox(width: 14),
              Text('Notifications',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17, fontWeight: FontWeight.w800)),
              const Spacer(),
              // Mark all read
              GestureDetector(
                onTap: () => _markAllRead(uid),
                child: const Text('Mark all read',
                    style: TextStyle(
                        color: kCyan,
                        fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ]),
          ),

          const SizedBox(height: 16),

          // ── NOTIFICATION ROWS ─────────────────────────────────
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('notifications')
                  .where('userId', isEqualTo: uid)
                  .orderBy('createdAt', descending: true)
                  .limit(30)
                  .snapshots(),
              builder: (_, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(
                      color: kCyan, strokeWidth: 2));
                }
                final docs = snap.data?.docs ?? [];
                final items = docs.isNotEmpty
                    ? docs.map((d) {
                        final data =
                            d.data() as Map<String, dynamic>;
                        data['_id'] = d.id;
                        return data;
                      }).toList()
                    : _mockNotifs();

                if (items.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('🔔',
                            style: TextStyle(fontSize: 48)),
                        SizedBox(height: 12),
                        Text('No notifications yet',
                            style: TextStyle(
                                color: context.txtSec)),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: items.length,
                  itemBuilder: (_, i) =>
                      _NotifRow(data: items[i], uid: uid),
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _markAllRead(String uid) async {
    final snap = await FirebaseFirestore.instance
        .collection('notifications')
        .where('userId', isEqualTo: uid)
        .where('read', isEqualTo: false)
        .get();
    final batch = FirebaseFirestore.instance.batch();
    for (final doc in snap.docs) {
      batch.update(doc.reference, {'read': true});
    }
    await batch.commit();
  }

  List<Map<String, dynamic>> _mockNotifs() => [
    {
      'type': 'tournament', 'read': false,
      'title': 'Tournament Win! 🏆',
      'body': 'You won the WHOT Championship and earned ₦5,000',
      'time': '2m ago',
    },
    {
      'type': 'challenge', 'read': false,
      'title': 'New Challenge',
      'body': 'Player_X challenged you to a Lúdò match',
      'time': '15m ago',
    },
    {
      'type': 'achievement', 'read': true,
      'title': 'Achievement Unlocked',
      'body': 'You earned the "First Win" badge',
      'time': '1h ago',
    },
    {
      'type': 'reward', 'read': true,
      'title': 'Daily Reward',
      'body': 'Claim your 100 coin daily reward now',
      'time': '3h ago',
    },
    {
      'type': 'streak', 'read': true,
      'title': '7 Day Streak! 🔥',
      'body': 'Amazing! You\'ve played 7 days in a row',
      'time': 'Yesterday',
    },
    {
      'type': 'system', 'read': true,
      'title': 'New Game Available',
      'body': 'Ayò Òpón is now available to play',
      'time': '2d ago',
    },
  ];
}

// ── NOTIFICATION ROW ──────────────────────────────────────────────
// Figma: icon 48×48 rx=12 coloured, unread dot 8×8 cyan, time right
class _NotifRow extends StatelessWidget {
  final Map<String, dynamic> data;
  final String uid;
  const _NotifRow({required this.data, required this.uid});

  @override
  Widget build(BuildContext context) {
    final type  = data['type']  as String? ?? 'system';
    final title = data['title'] as String? ?? '';
    final body  = data['body']  as String? ?? '';
    final time  = data['time']  as String? ?? '';
    final read  = data['read']  as bool?   ?? true;
    final id    = data['_id']   as String? ?? '';

    final color = _kTypeColors[type] ?? kCyan;
    final icon  = _kTypeIcons[type]  ?? Icons.notifications_outlined;

    return GestureDetector(
      onTap: () {
        if (!read && id.isNotEmpty) {
          FirebaseFirestore.instance
              .collection('notifications')
              .doc(id)
              .update({'read': true});
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          // unread rows slightly lighter
          color: read
              ? context.card
              : context.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: read
                ? context.border
                : kCyan.withOpacity(0.25),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon box — Figma: 48×48 rx=12
            Stack(clipBehavior: Clip.none, children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withOpacity(0.3)),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              // Unread dot — 8×8 #22D1EE top-right
              if (!read) Positioned(
                top: -2, right: -2,
                child: Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(
                    color: kCyan,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ]),
            const SizedBox(width: 14),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                      child: Text(title,
                          style: TextStyle(
                              color: context.txtPri,
                              fontSize: 14,
                              fontWeight: read
                                  ? FontWeight.w600
                                  : FontWeight.w800),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Text(time,
                        style: TextStyle(
                            color: context.txtSec,
                            fontSize: 10)),
                  ]),
                  const SizedBox(height: 4),
                  Text(body,
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 12, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
