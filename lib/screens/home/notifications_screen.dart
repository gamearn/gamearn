import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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

          // ── HEADER — Figma Frame 56 ─────────────────────────────
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            decoration: BoxDecoration(
              color: context.bg,
              border: Border(bottom: BorderSide(color: context.border, width: 1)),
            ),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Icon(Icons.close_rounded,
                    color: context.txtPri, size: 20.w),
              ),
              Expanded(
                child: Text('Notifications',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 18.sp, fontWeight: FontWeight.w700)),
              ),
              SizedBox(width: 20.w),
            ]),
          ),

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
                            style: TextStyle(fontSize: 48.sp)),
                        SizedBox(height: 12.h),
                        Text('No notifications yet',
                            style: TextStyle(
                                color: context.txtSec)),
                      ],
                    ),
                  );
                }

                return ListView(
                  padding: EdgeInsets.symmetric(horizontal: 24.w),
                  children: [

                    SizedBox(height: 24.h),

                    // ── MARK ALL AS READ — Figma: 342×35, fs18 w700 #22D1EE ──
                    GestureDetector(
                      onTap: () => _markAllRead(uid),
                      child: Padding(
                        padding: EdgeInsets.only(bottom: 12.h),
                        child: Text('Mark all as read',
                            style: TextStyle(
                                color: kCyan,
                                fontSize: 18.sp,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.27.w)),
                      ),
                    ),

                    // ── NOTIFICATION ROWS — Figma: flat rows, itemSpacing 8 ──
                    ...List.generate(items.length, (i) {
                      return Padding(
                        padding: EdgeInsets.only(bottom: 8.h),
                        child: _NotifRow(data: items[i], uid: uid),
                      );
                    }),
                  ],
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
        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
        child: Row(
          children: [
            // Icon box — Figma: 48×48 rx=12
            Stack(clipBehavior: Clip.none, children: [
              Container(
                width: 48.w, height: 48.h,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: color.withOpacity(0.3)),
                ),
                child: Icon(icon, color: color, size: 22.w),
              ),
              if (!read) Positioned(
                top: -2, right: -2,
                child: Container(
                  width: 8.w, height: 8.h,
                  decoration: const BoxDecoration(
                    color: kCyan,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ]),
            SizedBox(width: 16.w),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 14.sp,
                          fontWeight: read
                              ? FontWeight.w600
                              : FontWeight.w800),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  SizedBox(height: 4.h),
                  Text(body,
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 12.sp, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            SizedBox(width: 12.w),
            // Time — Figma: fs12 w500 #FFFFFF@50, right-aligned
            Text(time,
                style: TextStyle(
                    color: context.txtSec,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
