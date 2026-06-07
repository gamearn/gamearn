import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';
import 'settings_screen.dart';
import 'account_security_screen.dart';
import 'daily_streak_screen.dart';
import '../home/invite_friends_screen.dart';

// ════════════════════════════════════════════════════════════════
//  PROFILE SCREEN — Figma matched (390×844)
//
//  y=103: 128×128 rx=64 avatar circle, white border
//  y=327: 2x action btns 165×44 rx=8 — Edit (#FF5E00) | Share (#1E293B)
//  y=389: 3x stat boxes 105×81 rx=12 — Wins (#1E293B) | Games (#1E293B) | Rank (#22D1EE)
//  y=495: 341×47 rx=24 #1E293B — progress bar pill
//  y=599: friend rows 342×74 rx=12 #1A2131, avatar 48×48 rx=24
//         badge 32×19 rx=4 #FF5E00 | play btn 64×32 rx=8 #FF5E00
// ════════════════════════════════════════════════════════════════

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users').doc(uid).snapshots(),
          builder: (_, userSnap) {
            final user     = (userSnap.data?.data() as Map?) ?? {};
            final username = user['username'] as String? ?? 'Player';
            final avatar   = user['avatar']   as String? ?? 'BOT';
            final level    = user['level']    as int?    ?? 1;
            final xp       = user['xp']       as int?    ?? 0;
            final xpNext   = user['xpNext']   as int?    ?? 500;
            final wins     = user['wins']      as int?    ?? 0;
            final games    = user['gamesPlayed'] as int? ?? 0;
            final rank     = user['rank']     as String? ?? 'Bronze';
            final bio      = user['bio']      as String? ?? 'Ready to play!';
            final friends  = (user['friends'] as List?)?.cast<String>() ?? [];

            final avatarEmoji = kAvatars.firstWhere(
                (a) => a['name'] == avatar,
                orElse: () => kAvatars[0])['emoji'] ?? '🤖';

            return CustomScrollView(
              slivers: [
                // ── TOP NAV ──────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(children: [
                      const Text('Profile',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 20, fontWeight: FontWeight.w900)),
                      const Spacer(),
                      GestureDetector(
                        onTap: () => Navigator.push(context,
                            MaterialPageRoute(builder: (_) => const SettingsScreen())),
                        child: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFF334155)),
                          ),
                          child: const Icon(Icons.settings_outlined,
                              color: kCyan, size: 18),
                        ),
                      ),
                    ]),
                  ),
                ),

                // ── AVATAR — Figma: y=103 128×128 rx=64 white border ──
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Center(
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          // Outer white ring 128×128 rx=64
                          Container(
                            width: 128, height: 128,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              boxShadow: [BoxShadow(
                                  color: kCyan.withOpacity(0.25),
                                  blurRadius: 24, spreadRadius: 4)],
                            ),
                          ),
                          // Inner avatar 124×124 rx=62
                          Positioned(
                            top: 2, left: 2,
                            child: Container(
                              width: 124, height: 124,
                              decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF0B0E1A)),
                              child: Center(
                                child: Text(avatarEmoji,
                                    style: const TextStyle(fontSize: 60)),
                              ),
                            ),
                          ),
                          // Edit avatar btn — bottom-right
                          Positioned(
                            bottom: 0, right: 0,
                            child: GestureDetector(
                              onTap: () => _editProfile(context, uid, username, bio),
                              child: Container(
                                width: 32, height: 32,
                                decoration: BoxDecoration(
                                  color: kOrange,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: const Color(0xFF0B0E1A), width: 2),
                                ),
                                child: const Icon(Icons.edit_rounded,
                                    color: Colors.white, size: 14),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── NAME + BIO ────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                    child: Column(children: [
                      Text(username,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 4),
                      Text(bio,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              color: Color(0xFF9A9A9A), fontSize: 13)),
                      const SizedBox(height: 8),
                      // Level chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 5),
                        decoration: BoxDecoration(
                          color: kCyan.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: kCyan.withOpacity(0.4)),
                        ),
                        child: Text('Level $level',
                            style: const TextStyle(
                                color: kCyan,
                                fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ]),
                  ),
                ),

                // ── ACTION BUTTONS — Figma: y=327
                //    Edit: 165×44 rx=8 #FF5E00
                //    Share: 165×44 rx=8 #1E293B ─────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
                    child: Row(children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              _editProfile(context, uid, username, bio),
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: kOrange,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Text('Edit Profile',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const InviteFriendsScreen())),
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: const Color(0xFF334155)),
                            ),
                            child: const Center(
                              child: Text('Share Profile',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ),
                      ),
                    ]),
                  ),
                ),

                // ── STAT BOXES — Figma: y=389 3× 105×81 rx=12
                //    Wins #1E293B | Games #1E293B | Rank #22D1EE ─────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Row(children: [
                      Expanded(child: _StatBox(
                          label: 'Wins', value: '$wins',
                          accent: const Color(0xFF1E293B), highlight: false)),
                      const SizedBox(width: 12),
                      Expanded(child: _StatBox(
                          label: 'Games', value: '$games',
                          accent: const Color(0xFF1E293B), highlight: false)),
                      const SizedBox(width: 12),
                      // Rank box — Figma: #22D1EE fill
                      Expanded(child: _StatBox(
                          label: 'Rank', value: rank,
                          accent: kCyan, highlight: true)),
                    ]),
                  ),
                ),

                // ── XP PROGRESS BAR — Figma: y=495 341×47 rx=24 #1E293B ─
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 14, 24, 0),
                    child: Container(
                      height: 47,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(children: [
                          Text('XP  ',
                              style: TextStyle(
                                  color: Colors.white.withOpacity(0.5),
                                  fontSize: 11)),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: LinearProgressIndicator(
                                value: xpNext > 0 ? (xp / xpNext).clamp(0.0, 1.0) : 0,
                                backgroundColor:
                                    Colors.white.withOpacity(0.08),
                                valueColor:
                                    const AlwaysStoppedAnimation<Color>(kCyan),
                                minHeight: 8,
                              ),
                            ),
                          ),
                          Text('  $xp / $xpNext',
                              style: const TextStyle(
                                  color: kCyan,
                                  fontSize: 11, fontWeight: FontWeight.w700)),
                        ]),
                      ),
                    ),
                  ),
                ),

                // ── QUICK LINKS ───────────────────────────────────────
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(24, 20, 24, 10),
                    child: Text('Quick Links',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 14, fontWeight: FontWeight.w800)),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(children: [
                      _NavTile(
                          icon: Icons.local_fire_department_rounded,
                          label: 'Daily Streak',
                          color: kOrange,
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const DailyStreakScreen()))),
                      const SizedBox(height: 8),
                      _NavTile(
                          icon: Icons.lock_outline_rounded,
                          label: 'Account Security',
                          color: kCyan,
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const AccountSecurityScreen()))),
                      const SizedBox(height: 8),
                      _NavTile(
                          icon: Icons.people_outline_rounded,
                          label: 'Invite Friends',
                          color: const Color(0xFF22C55E),
                          onTap: () => Navigator.push(context,
                              MaterialPageRoute(
                                  builder: (_) => const InviteFriendsScreen()))),
                    ]),
                  ),
                ),

                // ── FRIENDS — Figma: y=599 342×74 rx=12 #1A2131
                //    avatar 48×48 rx=24, badge 32×19 rx=4 #FF5E00
                //    play btn 64×32 rx=8 #FF5E00 ──────────────────
                if (friends.isNotEmpty) ...[
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(24, 20, 24, 10),
                      child: Text('Friends',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 14, fontWeight: FontWeight.w800)),
                    ),
                  ),
                  SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _FriendRow(uid: friends[i]),
                      childCount: friends.length.clamp(0, 5),
                    ),
                  ),
                ],

                // ── SIGN OUT ──────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                    child: GestureDetector(
                      onTap: () => FirebaseAuth.instance.signOut(),
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: kOrange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: kOrange.withOpacity(0.35)),
                        ),
                        child: const Center(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.logout_rounded,
                                  color: kOrange, size: 18),
                              SizedBox(width: 8),
                              Text('Sign Out',
                                  style: TextStyle(
                                      color: kOrange,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _editProfile(
      BuildContext context, String uid, String username, String bio) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      isScrollControlled: true,
      builder: (_) => _EditProfileSheet(
          uid: uid, username: username, bio: bio),
    );
  }
}

// ── STAT BOX — Figma: 105×81 rx=12 ──────────────────────────────
class _StatBox extends StatelessWidget {
  final String label, value;
  final Color accent;
  final bool highlight;
  const _StatBox(
      {required this.label, required this.value,
       required this.accent, required this.highlight});

  @override
  Widget build(BuildContext context) => Container(
    height: 81,
    decoration: BoxDecoration(
      color: accent,
      borderRadius: BorderRadius.circular(12),
      border: highlight ? null : Border.all(color: const Color(0xFF334155)),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(value,
            style: TextStyle(
                color: highlight ? const Color(0xFF0B0E1A) : Colors.white,
                fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(label,
            style: TextStyle(
                color: highlight
                    ? const Color(0xFF0B0E1A).withOpacity(0.7)
                    : const Color(0xFF9A9A9A),
                fontSize: 11, fontWeight: FontWeight.w500)),
      ],
    ),
  );
}

// ── NAV TILE ─────────────────────────────────────────────────────
class _NavTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _NavTile(
      {required this.icon, required this.label,
       required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      height: 56,
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(child: Text(label,
              style: const TextStyle(
                  color: Colors.white, fontSize: 14,
                  fontWeight: FontWeight.w600))),
          Icon(Icons.chevron_right_rounded,
              color: Colors.white.withOpacity(0.3), size: 20),
        ]),
      ),
    ),
  );
}

// ── FRIEND ROW — Figma: 342×74 rx=12 #1A2131 ─────────────────────
// avatar 48×48 rx=24, badge 32×19 rx=4 #FF5E00, play btn 64×32 rx=8
class _FriendRow extends StatelessWidget {
  final String uid;
  const _FriendRow({required this.uid});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
      child: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('users').doc(uid).snapshots(),
        builder: (_, snap) {
          final u    = (snap.data?.data() as Map?) ?? {};
          final name = u['username'] as String? ?? 'Player';
          final emoji = kAvatars.firstWhere(
              (a) => a['name'] == (u['avatar'] ?? 'BOT'),
              orElse: () => kAvatars[0])['emoji'] ?? '🤖';
          final online = u['online'] as bool? ?? false;

          return Container(
            height: 74,
            decoration: BoxDecoration(
              // Figma: #1A2131
              color: const Color(0xFF1A2131),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                // Avatar 48×48 rx=24
                Stack(children: [
                  Container(
                    width: 48, height: 48,
                    decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF0B0E1A)),
                    child: Center(child: Text(emoji,
                        style: const TextStyle(fontSize: 24))),
                  ),
                  if (online) Positioned(
                    bottom: 1, right: 1,
                    child: Container(
                      width: 12, height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E),
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: const Color(0xFF1A2131), width: 2),
                      ),
                    ),
                  ),
                ]),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(name,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 14,
                              fontWeight: FontWeight.w700)),
                      // online badge 32×19 rx=4 #FF5E00 / #334155
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: online
                              ? kOrange
                              : const Color(0xFF334155),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(online ? 'Online' : 'Offline',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                ),
                // Play btn 64×32 rx=8 #FF5E00
                Container(
                  width: 64, height: 32,
                  decoration: BoxDecoration(
                    color: kOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Text('Play',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 12, fontWeight: FontWeight.w800)),
                  ),
                ),
              ]),
            ),
          );
        },
      ),
    );
  }
}

// ── EDIT PROFILE SHEET ────────────────────────────────────────────
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
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4,
              decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          const Text('Edit Profile',
              style: TextStyle(color: Colors.white,
                  fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 20),
          _field(_nameCtrl, 'Username', Icons.person_outline_rounded),
          const SizedBox(height: 12),
          _field(_bioCtrl, 'Bio', Icons.edit_note_rounded),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: _saving ? null : _save,
            child: Container(
              width: double.infinity, height: 48,
              decoration: BoxDecoration(
                  color: kOrange, borderRadius: BorderRadius.circular(12)),
              child: Center(child: _saving
                  ? const CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2)
                  : const Text('Save',
                      style: TextStyle(color: Colors.white,
                          fontSize: 15, fontWeight: FontWeight.w800))),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon) =>
      Container(
        height: 52,
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(children: [
            Icon(icon, color: kCyan, size: 18),
            const SizedBox(width: 10),
            Expanded(child: TextField(
              controller: ctrl,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: Color(0xFF9A9A9A)),
                border: InputBorder.none,
              ),
            )),
          ]),
        ),
      );
}
