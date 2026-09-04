import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:share_plus/share_plus.dart';
import 'package:gamearn/l10n/app_localizations.dart';
import '../../services/firestore_cache.dart';
import '../../services/avatar_pipeline.dart';
import '../../widgets/cached_avatar.dart';
import '../../theme.dart';
import 'invite_friends_screen.dart';
import 'premium_purchase_screen.dart';

// ════════════════════════════════════════════════════════════════
//  PROFILE SCREEN — Figma matched (390×844)  [1726:1605]
//
//  header    Frame 56 — "My Profile" fs18 w700 #F1F5F9, bg #0B0E1A@90,
//            bottom stroke #FFFFFF@30, close btn, padding [40,24,16,24]
//  avatar    128×128 white ring + name fs24 w700 + tagline fs16 w600 @50%,
//            edit badge 24×24 #FF5E00
//  buttons   Edit Profile 165×44 r8 #FF5E00 | Wallet 165×44 r8 #1E293B
//  stats     3×106×82 r12 pad [12,16] — Followers/Following (#1E293B@50),
//            Day Streak (#22D1EE@10)
//  search    "Search Friends" 342×48 r24 #1E293B@50
//  friends   Active Friends fs12 + "12 Online" #FF5E00;
//            rows 342×74 r12 pad 12 #1A2131@30, avatar 48 + dot 12
//            (#22C55E online / #475569 offline), Invite 64×32 #FF5E00
//            or Following 90×34 outline; External Contacts row
//  perf      Performance Stats fs18; Points Card 342×171 r12 #1E293B@50
//            (All-time Points fs12 + value fs20 #FF5E00,
//             "+12% this week" pill #22D1EE@10, 2 progress bars
//             bg #334155)
//  ranks     Region Rank + Global Rank 165×106 r12 pad 16 #1E293B@50
//            (#42 / #1,204 fs18 #F1F5F9)
//  premium   Go Premium fs18 + card 342×231 r12 fill #0F172A@50
//            stroke #1E293B
// ════════════════════════════════════════════════════════════════

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: FutureBuilder<Map<String, dynamic>>(
          future: FirestoreCache.instance.doc('users', uid),
          builder: (_, userSnap) {
            final user     = userSnap.data ?? {};
            final username = user['username'] as String? ?? 'Player';
            final avatar   = user['avatar']   as String? ?? 'BOT';
            final level    = user['level']    as int?    ?? 1;
            final xp       = user['xp']       as int?    ?? 0;
            final xpNext   = user['xpNext']   as int?    ?? 500;
            final wins     = user['wins']      as int?    ?? 0;
            final games    = user['gamesPlayed'] as int? ?? 0;
            final dayStreak = user['dayStreak'] as int?    ?? 0;
            final allTime  = user['allTimeScore'] as num? ?? 0;
            final bio      = user['bio']      as String? ?? 'Ready to play!';
            final friends  = (user['friends'] as List?)?.cast<String>() ?? [];

            final avatarEmoji = kAvatars.firstWhere(
                (a) => a['name'] == avatar,
                orElse: () => kAvatars[0])['emoji'] ?? '🤖';
            final avatarUrl = user['avatarUrl'] as String? ?? 
                              user['profilePicUrl'] as String? ?? '';

            return Column(children: [
              _header(context),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 32.h),
                  children: [
                    _avatarBlock(context, avatarEmoji, username, bio, uid, avatarUrl),
                    SizedBox(height: 32.h),
                    _actionButtons(context, uid, username, bio),
                    SizedBox(height: 32.h),
                    _statRow(context, wins, games, dayStreak),
                    SizedBox(height: 32.h),
                    _searchBar(context),
                    SizedBox(height: 32.h),
                    _activeFriends(context, friends, dayStreak),
                    SizedBox(height: 32.h),
                    _performance(context, level, xp, xpNext, wins, allTime),
                    SizedBox(height: 32.h),
                    _rankCards(context),
                    SizedBox(height: 32.h),
                    const _PremiumSection(),
                  ],
                ),
              ),
            ]);
          },
        ),
      ),
    );
  }

  // ── HEADER — Figma: Frame 56 ──────────────────────────────────
  Widget _header(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
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
          child: Text(l10n.profileTitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 18.sp, fontWeight: FontWeight.w700)),
        ),
        SizedBox(width: 20.w), // balance
      ]),
    );
  }

  // ── AVATAR + NAME ─────────────────────────────────────────────
  Widget _avatarBlock(BuildContext context, String emoji,
      String name, String bio, String uid, String avatarUrl) {
    return Column(children: [
      Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 128.w, height: 128.h,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [BoxShadow(
                  color: kCyan.withOpacity(0.25),
                  blurRadius: 24, spreadRadius: 4)],
            ),
          ),
          Positioned(
            top: 2, left: 2,
            child: Container(
              width: 124.w, height: 124.h,
              decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: context.bg),
              child: ClipOval(
                child: avatarUrl.isNotEmpty
                    ? ProductionCachedAvatarWidget(
                        targetProfileUrl: avatarUrl,
                        displayDiameter: 124.w,
                      )
                    : Center(child: Text(emoji,
                        style: TextStyle(fontSize: 60.sp))),
              ),
            ),
          ),
          Positioned(
            bottom: 0, right: 0,
            child: GestureDetector(
              onTap: () => _showAvatarPicker(context, uid),
              child: Container(
                width: 24.w, height: 24.h,
                decoration: BoxDecoration(
                  color: kOrange,
                  shape: BoxShape.circle,
                  border: Border.all(color: context.bg, width: 2),
                ),
                child: Icon(Icons.edit_rounded,
                    color: Colors.white, size: 12.w),
              ),
            ),
          ),
        ],
      ),
      SizedBox(height: 16.h),
      Text(name,
          textAlign: TextAlign.center,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 24.sp, fontWeight: FontWeight.w700)),
      SizedBox(height: 4.h),
      Text(bio,
          textAlign: TextAlign.center,
          maxLines: 1, overflow: TextOverflow.ellipsis,
          style: TextStyle(
              color: context.txtSec,
              fontSize: 16.sp, fontWeight: FontWeight.w600)),
    ]);
  }

  // ── AVATAR PICKER ──────────────────────────────────────────────
  static Future<void> _showAvatarPicker(BuildContext context, String uid) async {
    final picked = await AvatarExecutionPipeline.pickAndProcessImage();
    if (picked == null) return;

    // Show loading indicator
    if (!context.mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(
        child: CircularProgressIndicator(color: kOrange),
      ),
    );

    try {
      final success = await AvatarExecutionPipeline.commitAvatarMutation(
        imageFile: picked,
        targetUserId: uid,
      );

      if (!context.mounted) return;
      Navigator.pop(context); // Dismiss loading

      if (success) {
        // Get the full download URL and update Firestore
        final url = await FirebaseStorage.instance
            .ref('users/$uid/profile.jpg')
            .getDownloadURL();

        await FirebaseFirestore.instance
            .collection('users')
            .doc(uid)
            .update({
          'avatarUrl': url,
          'profilePicUrl': url,
          'updatedAt': FieldValue.serverTimestamp(),
        });

        FirestoreCache.instance.invalidate('users/$uid');

        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile picture updated'),
            backgroundColor: kGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to upload. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!context.mounted) return;
      Navigator.pop(context); // Dismiss loading on error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // ── EDIT / SHARE — Figma: 165×44 r8 ───────────────────────────
  Widget _actionButtons(BuildContext context, String uid,
      String username, String bio) {
    final l10n = AppLocalizations.of(context)!;
    return Row(children: [
      Expanded(
        child: GestureDetector(
          onTap: () => _editProfile(context, uid, username, bio),
          child: Container(
            height: 44.h,
            decoration: BoxDecoration(
              color: kOrange,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Center(
              child: Text(l10n.profileEdit,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ),
      SizedBox(width: 12.w),
      Expanded(
        child: GestureDetector(
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => const InviteFriendsScreen())),
          child: Container(
            height: 44.h,
            decoration: BoxDecoration(
              color: context.card,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Center(
              child: Text(l10n.profileWallet,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ),
    ]);
  }

  // ── STAT BOXES — Figma: 3×106×82 r12 ──────────────────────────
  Widget _statRow(BuildContext context, int wins, int games, int dayStreak) {
    final l10n = AppLocalizations.of(context)!;
    return Row(children: [
      Expanded(child: _ProfileStat(
          value: _fmtCount(wins * 4 + 200),
          label: l10n.profileFollowers,
          fill: context.border.withOpacity(0.5))),
      SizedBox(width: 10.w),
      Expanded(child: _ProfileStat(
          value: _fmtCount(games * 3 + 100),
          label: l10n.profileFollowing,
          fill: context.border.withOpacity(0.5))),
      SizedBox(width: 10.w),
      Expanded(child: _ProfileStat(
          value: '$dayStreak',
          label: l10n.profileDayStreak,
          fill: kCyan.withOpacity(0.10),
          accent: true,
          icon: Icons.local_fire_department_rounded)),
    ]);
  }

  // ── SEARCH BAR — Figma: 342×48 r24 #1E293B@50 ─────────────────
  Widget _searchBar(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      height: 48.h,
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      decoration: BoxDecoration(
        color: context.border.withOpacity(0.5),
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Row(children: [
        Icon(Icons.search_rounded,
            color: Color(0x80FFFFFF), size: 18.w),
        SizedBox(width: 12.w),
        Expanded(
          child: Text(l10n.profileSearchFriends,
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: 16.sp, fontWeight: FontWeight.w400)),
        ),
      ]),
    );
  }

  // ── ACTIVE FRIENDS ────────────────────────────────────────────
  Widget _activeFriends(BuildContext context,
      List<String> friends, int dayStreak) {
    final l10n = AppLocalizations.of(context)!;
    final online = friends.isEmpty
        ? 12
        : (friends.length.clamp(0, 12) as num).toInt();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: Text(l10n.profileActiveFriends,
              style: TextStyle(
                  color: context.txtSec,
                  fontSize: 12.sp, fontWeight: FontWeight.w700)),
        ),
        Text(l10n.profileOnline(online),
            style: TextStyle(
                color: kOrange, fontSize: 12.sp, fontWeight: FontWeight.w500)),
      ]),
      SizedBox(height: 10.h),
      if (friends.isNotEmpty)
        for (final f in friends.take(5)) _FriendRow(uid: f)
      else
        for (final m in kMockFriends) _MockFriendRow(data: m),
      _externalContacts(context),
    ]);
  }

  Widget _externalContacts(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final refCode = uid.length >= 8 ? uid.substring(0, 8).toUpperCase() : 'CYBER_X_99';
    final refLink = 'gamearn.gg/ref/$refCode';
    return GestureDetector(
      onTap: () async {
        final text = l10n.profileJoinShare(refLink);
        await SharePlus.instance.share(ShareParams(text: text));
      },
      child: Container(
        margin: EdgeInsets.only(top: 16.h),
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12.r),
          color: context.card,
        ),
        child: Row(children: [
          Container(
            width: 48.w, height: 48.h,
            decoration: BoxDecoration(
              color: context.txtPri.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.person_add_alt_1_rounded,
                color: context.txtPri.withOpacity(0.5), size: 22.w),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(l10n.profileInviteFromContacts,
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 14.sp, fontWeight: FontWeight.w600)),
          ),
          Icon(Icons.chevron_right_rounded,
              color: context.txtPri.withOpacity(0.4), size: 20.w),
        ]),
      ),
    );
  }

  // ── PERFORMANCE STATS — Figma: Frame 126 ──────────────────────
  Widget _performance(BuildContext context, int level, int xp,
      int xpNext, int wins, num allTime) {
    final l10n = AppLocalizations.of(context)!;
    final pts = allTime > 0
        ? _fmtNum(allTime.toInt())
        : '24,580';
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(l10n.profilePerformanceStats,
          style: TextStyle(
              color: context.txtPri, fontSize: 18.sp, fontWeight: FontWeight.w700)),
      SizedBox(height: 14.h),
      Container(
        width: double.infinity,
        padding: EdgeInsets.all(20.r),
        decoration: BoxDecoration(
          color: context.border.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.profileAllTimePoints,
                      style: TextStyle(
                          color: context.txtSec, fontSize: 12.sp,
                          fontWeight: FontWeight.w700)),
                  SizedBox(height: 2.h),
                  Text('$pts pts',
                      style: TextStyle(
                          color: kOrange, fontSize: 20.sp,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: kCyan.withOpacity(0.10),
                borderRadius: BorderRadius.circular(9999.r),
              ),
              child: Text(l10n.profileThisWeek,
                  style: TextStyle(
                      color: kCyan, fontSize: 12.sp, fontWeight: FontWeight.w700)),
            ),
          ]),
          SizedBox(height: 20.h),
          _progressRow(context, l10n.profileLevelXp('$level'), xp, xpNext),
          SizedBox(height: 14.h),
          _progressRow(context, l10n.profileTotalWins, wins, (wins * 2).clamp(10, 1000)),
        ]),
      ),
    ]);
  }

  Widget _progressRow(BuildContext context, String label, int value, int total) {
    final pct = total > 0 ? (value / total).clamp(0.0, 1.0) : 0.0;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(
          child: Text(label,
              style: TextStyle(
                  color: context.txtSec, fontSize: 11.sp,
                  fontWeight: FontWeight.w600)),
        ),
        Text('$value / $total',
            style: TextStyle(
                color: kCyan, fontSize: 11.sp, fontWeight: FontWeight.w700)),
      ]),
      SizedBox(height: 6.h),
      ClipRRect(
        borderRadius: BorderRadius.circular(9999.r),
        child: LinearProgressIndicator(
          value: pct,
          backgroundColor: const Color(0xFF334155),
          valueColor: const AlwaysStoppedAnimation<Color>(kCyan),
          minHeight: 8,
        ),
      ),
    ]);
  }

  // ── RANK CARDS — Figma: Frame 127 165×106 r12 ─────────────────
  Widget _rankCards(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Row(children: [
      Expanded(child: _RankCard(
          icon: Icons.emoji_events_rounded,
          iconColor: kCyan,
          label: l10n.profileRegionRank,
          value: '#42')),
      SizedBox(width: 12.w),
      Expanded(child: _RankCard(
          icon: Icons.public_rounded,
          iconColor: const Color(0xFFFFC107),
          label: l10n.profileGlobalRank,
          value: '#1,204')),
    ]);
  }

  void _editProfile(
      BuildContext context, String uid, String username, String bio) {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      isScrollControlled: true,
      builder: (_) => _EditProfileSheet(
          uid: uid, username: username, bio: bio),
    );
  }
}

const List<Map<String, dynamic>> kMockFriends = [
  {'name': 'Chukwudi', 'emoji': '🦅', 'online': true,
   'sub': 'Diamond Tier • Level 84', 'following': false},
  {'name': 'Amara', 'emoji': '🦁', 'online': true,
   'sub': 'Master Tier • Level 102', 'following': false},
  {'name': 'Adekunle', 'emoji': '🦉', 'online': false,
   'sub': 'Gold III • Offline', 'following': true},
  {'name': 'StormWalker', 'emoji': '⛈️', 'online': true,
   'sub': 'Platinum II • In-Game', 'following': false},
];

// ── STAT BOX — Figma: 106×82 r12 ────────────────────────────────
class _ProfileStat extends StatelessWidget {
  final String value, label;
  final Color fill;
  final bool accent;
  final IconData? icon;
  const _ProfileStat({required this.value, required this.label,
      required this.fill, this.accent = false, this.icon});

  @override
  Widget build(BuildContext context) => Container(
    height: 82.h,
    padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 12.h),
    decoration: BoxDecoration(
      color: fill,
      borderRadius: BorderRadius.circular(12.r),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, color: kCyan, size: 20.w),
          SizedBox(height: 2.h),
        ] else
          Text(value,
              style: TextStyle(
                  color: context.txtPri,
                  fontSize: 20.sp, fontWeight: FontWeight.w700)),
        SizedBox(height: 2.h),
        Text(label,
            style: TextStyle(
                color: accent
                    ? kCyan.withOpacity(0.7)
                    : context.txtSec.withOpacity(0.5),
                fontSize: 12.sp, fontWeight: FontWeight.w500)),
      ],
    ),
  );
}

// ── RANK CARD — Figma: 165×106 r12 #1E293B@50 ───────────────────
class _RankCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label, value;
  const _RankCard({required this.icon, required this.iconColor,
      required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Container(
    height: 106.h,
    padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: context.border.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: iconColor, size: 18.w),
          SizedBox(height: 4.h),
          Text(label,
              style: TextStyle(
                  color: context.txtSec, fontSize: 12.sp,
                  fontWeight: FontWeight.w700)),
          SizedBox(height: 2.h),
          Text(value,
              style: TextStyle(
                  color: context.txtPri, fontSize: 18.sp,
                  fontWeight: FontWeight.w700)),
      ],
    ),
  );
}

// ── FRIEND ROW (live) — Figma: 342×74 r12 #1A2131@30 ────────────
class _FriendRow extends StatelessWidget {
  final String uid;
  const _FriendRow({required this.uid});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: FutureBuilder<Map<String, dynamic>>(
        future: FirestoreCache.instance.doc('users', uid),
        builder: (_, snap) {
          final u      = snap.data ?? {};
          final name   = u['username'] as String? ?? 'Player';
          final level  = u['level'] as int? ?? 1;
          final online = u['online'] as bool? ?? false;
          final emoji  = kAvatars.firstWhere(
              (a) => a['name'] == (u['avatar'] ?? 'BOT'),
              orElse: () => kAvatars[0])['emoji'] ?? '🤖';

          return _friendRow(context,
              emoji: emoji, name: name,
              sub: 'Diamond Tier • Level $level',
              online: online, following: !online);
        },
      ),
    );
  }
}

// ── MOCK FRIEND ROW (fallback) ──────────────────────────────────
class _MockFriendRow extends StatelessWidget {
  final Map<String, dynamic> data;
  const _MockFriendRow({required this.data});

  @override
  Widget build(BuildContext context) {
    final online = data['online'] as bool? ?? false;
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: _friendRow(context,
          emoji: data['emoji'] as String? ?? '🤖',
          name: data['name'] as String? ?? 'Player',
          sub: data['sub'] as String? ?? 'Diamond Tier • Level 1',
          online: online, following: data['following'] as bool? ?? false),
    );
  }
}

Widget _friendRow(BuildContext context,
    {required String emoji, required String name,
     required String sub, required bool online, required bool following}) {
  final l10n = AppLocalizations.of(context)!;
  return Container(
    height: 74.h,
    padding: EdgeInsets.all(12.r),
    decoration: BoxDecoration(
      color: following
          ? const Color(0x1A251A31)
          : const Color(0x4D1A2131),
      borderRadius: BorderRadius.circular(12.r),
    ),
    child: Row(children: [
      Stack(children: [
        Container(
          width: 48.w, height: 48.h,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: context.card,
          ),
          child: Center(
              child: Text(emoji, style: TextStyle(fontSize: 24.sp))),
        ),
        Positioned(
          bottom: 1, right: 1,
          child: Container(
            width: 12.w, height: 12.h,
            decoration: BoxDecoration(
              color: online ? const Color(0xFF22C55E) : const Color(0xFF475569),
              shape: BoxShape.circle,
              border: Border.all(color: context.border, width: 2),
            ),
          ),
        ),
      ]),
      SizedBox(width: 12.w),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(name,
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: online
                        ? context.txtPri
                        : context.txtPri.withOpacity(0.7),
                    fontSize: 16.sp, fontWeight: FontWeight.w700)),
            SizedBox(height: 2.h),
            Text(sub,
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(
                    color: online
                        ? context.txtPri.withOpacity(0.6)
                        : context.txtSec,
                    fontSize: 12.sp, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
      SizedBox(width: 8.w),
      if (following)
        Container(
          height: 34.h,
          padding: EdgeInsets.symmetric(horizontal: 16.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: context.border),
          ),
          child: Center(
            child: Text(l10n.profileFollowingBtn,
                style: TextStyle(
                    color: context.txtSec,
                    fontSize: 12.sp, fontWeight: FontWeight.w700)),
          ),
        )
      else
        Container(
          width: 64.w, height: 32.h,
          decoration: BoxDecoration(
            color: kOrange,
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Center(
            child: Text(l10n.profileInviteBtn,
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.sp, fontWeight: FontWeight.w700)),
          ),
        ),
    ]),
  );
}

// ── PREMIUM — Figma: 342×231 r12 fill #0F172A@50 stroke #1E293B ──
class _PremiumSection extends StatelessWidget {
  const _PremiumSection();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(
        width: double.infinity,
        child: Text(l10n.profileGoPremium,
            textAlign: TextAlign.center,
            style: TextStyle(
                color: context.txtPri, fontSize: 18.sp,
                fontWeight: FontWeight.w700)),
      ),
      SizedBox(height: 14.h),
      Container(
        width: double.infinity,
        padding: EdgeInsets.all(24.r),
        decoration: BoxDecoration(
          color: context.card.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: context.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 44.w, height: 44.h,
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107).withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.workspace_premium_rounded,
                  color: Color(0xFFFFC107), size: 24.w),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.profilePremiumTitle,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 16.sp, fontWeight: FontWeight.w800)),
                  SizedBox(height: 2.h),
                  Text(l10n.profilePremiumSub,
                      style: TextStyle(
                          color: kCyan, fontSize: 12.sp,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ]),
          SizedBox(height: 16.h),
          Text(
              l10n.profilePremiumBody,
              style: TextStyle(
                  color: context.txtSec, fontSize: 13.sp, height: 1.5)),
          SizedBox(height: 16.h),
          GestureDetector(
            onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                    builder: (_) => const PremiumPurchaseScreen())),
            child: Container(
              height: 48.h,
              decoration: BoxDecoration(
                color: const Color(0xFFFFC107),
                borderRadius: BorderRadius.circular(10.r),
              ),
              child: Center(
                child: Text(l10n.profileGoPremium,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14.sp, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ]),
      ),
    ]);
  }
}

// ── EDIT PROFILE SHEET ──────────────────────────────────────────
class _EditProfileSheet extends StatefulWidget {
  final String uid, username, bio;
  const _EditProfileSheet(
      {required this.uid, required this.username, required this.bio});
  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _bioCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.username);
    _bioCtrl  = TextEditingController(text: widget.bio);
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _bioCtrl.dispose(); super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await FirebaseFirestore.instance
          .collection('users').doc(widget.uid).update({
        'username': _nameCtrl.text.trim(),
        'bio':      _bioCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: EdgeInsets.all(24.r),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40.w, height: 4.h,
              decoration: BoxDecoration(
                  color: context.txtPri.withOpacity(0.24),
                  borderRadius: BorderRadius.circular(2.r))),
          SizedBox(height: 20.h),
          Text(l10n.profileEditSheetTitle,
              style: TextStyle(color: context.txtPri,
                  fontSize: 17.sp, fontWeight: FontWeight.w800)),
          SizedBox(height: 20.h),
          _field(_nameCtrl, l10n.profileUsernameHint, Icons.person_outline_rounded),
          SizedBox(height: 12.h),
          _field(_bioCtrl, l10n.profileBioHint, Icons.edit_note_rounded),
          SizedBox(height: 20.h),
          GestureDetector(
            onTap: _saving ? null : _save,
            child: Container(
              width: double.infinity, height: 48.h,
              decoration: BoxDecoration(
                  color: kOrange, borderRadius: BorderRadius.circular(12.r)),
              child: Center(child: _saving
                  ? const CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2)
                  : Text(l10n.profileSave,
                      style: TextStyle(color: Colors.white,
                          fontSize: 15.sp, fontWeight: FontWeight.w800))),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon) =>
      Container(
        height: 52.h,
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(10.r),
          border: Border.all(color: context.border),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14.w),
          child: Row(children: [
            Icon(icon, color: kCyan, size: 18.w),
            SizedBox(width: 10.w),
            Expanded(child: TextField(
              controller: ctrl,
              style: TextStyle(color: context.txtPri),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(color: context.txtSec),
                border: InputBorder.none,
              ),
            )),
          ]),
        ),
      );
}

// ── FORMATTING HELPERS ──────────────────────────────────────────
String _fmtNum(int n) {
  final s = n.toString();
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return b.toString();
}

String _fmtCount(int n) {
  if (n >= 1000) {
    final k = n / 1000;
    return k >= 100 ? '${k.round()}k' : '${k.toStringAsFixed(1)}k';
  }
  return '$n';
}
