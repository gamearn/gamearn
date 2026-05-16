import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .snapshots(),
          builder: (ctx, snap) {
            final data = snap.hasData && snap.data!.exists
                ? snap.data!.data() as Map<String, dynamic>
                : <String, dynamic>{};

            final username   = data['username']    ?? 'Player';
            final avatar     = data['avatar']      ?? 'BOT';
            final isPremium  = data['isPremium']   ?? false;
            final followers  = data['followers']   ?? 0;
            final following  = data['following']   ?? 0;
            final dayStreak  = data['dayStreak']   ?? 0;
            final totalPts   = data['totalPoints'] ?? 0;
            final regionRank = data['regionRank']  ?? 0;
            final globalRank = data['globalRank']  ?? 0;
            final gamePts    = data['gameplayPts'] ?? 0;
            final tourPts    = data['tournamentPts'] ?? 0;

            return CustomScrollView(
              slivers: [
                // ── Title ─────────────────────────────────────────────────
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Text('My Profile',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: kOrange, // Use brand color for title to pop
                            fontSize: 18,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                // ── Avatar + name + badge ─────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Column(
                      children: [
                        // Avatar with orange ring + online dot
                        Stack(
                          children: [
                            Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: kOrange, width: 3),
                                color: context.card,
                              ),
                              child: Center(
                                child: Text(
                                  _avatarEmoji(avatar),
                                  style:
                                      const TextStyle(fontSize: 44),
                                ),
                              ),
                            ),
                            Positioned(
                              bottom: 4,
                              right: 4,
                              child: Container(
                                width: 14,
                                height: 14,
                                decoration: BoxDecoration(
                                  color: kGreen,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: kBgDeep, width: 2),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Username
                        Text(username,
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 20,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),

                        // Verified badge + title
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.verified,
                                color: kCyan, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              isPremium
                                  ? 'Pro League Competitor'
                                  : 'Active Member',
                              style: TextStyle(
                                  color: context.txtSec, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Edit Profile + Wallet buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) =>
                                            const _EditProfileScreen())),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kOrange,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 12),
                                ),
                                child: const Text('Edit Profile',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {},
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: kTextPri,
                                  side: const BorderSide(color: kBorder),
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 12),
                                ),
                                child: const Text('Wallet',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w700)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Followers / Following / Day Streak ────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Row(
                      children: [
                        _StatBox(value: _fmt(followers), label: 'FOLLOWERS'),
                        const SizedBox(width: 10),
                        _StatBox(value: _fmt(following), label: 'FOLLOWING'),
                        const SizedBox(width: 10),
                        _StatBox(
                          value: '$dayStreak',
                          label: 'DAY STREAK',
                          highlight: true,
                          icon: Icons.local_fire_department,
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Search Friends ────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: TextField(
                      style: const TextStyle(color: kTextPri),
                      decoration: InputDecoration(
                        hintText: 'Search Friends',
                        hintStyle:
                            const TextStyle(color: kTextSec, fontSize: 14),
                        prefixIcon: const Icon(Icons.search,
                            color: kTextSec, size: 20),
                        filled: true,
                        fillColor: context.card,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                ),

                // ── Active Friends header ──────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('ACTIVE FRIENDS', style: kLabel),
                        const Text('12 Online',
                            style: TextStyle(
                                color: kOrange,
                                fontSize: 12,
                                fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),

                // ── Friends list (Firestore or mock) ──────────────────────
                StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance
                      .collection('users')
                      .where('isActive', isEqualTo: true)
                      .limit(5)
                      .snapshots(),
                  builder: (ctx, snap) {
                    final docs = snap.data?.docs ?? [];
                    if (docs.isEmpty) {
                      return SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.people_outline, color: kTextMuted, size: 40),
                                const SizedBox(height: 8),
                                Text('No friends yet', style: kSub),
                              ],
                            ),
                          ),
                        ),
                      );
                    }

                    final friends = docs
                        .map((d) {
                          final data = d.data() as Map<String, dynamic>;
                          return {
                            'name': data['username'] ?? 'Player',
                            'badge': data['isPremium'] == true ? 'PRO' : '',
                            'tier': 'Level ${data['level'] ?? 1}',
                            'emoji': _avatarEmoji(data['avatar'] ?? 'BOT'),
                          };
                        })
                        .toList();

                    return SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _FriendRow(friend: friends[i]),
                        childCount: friends.length,
                      ),
                    );
                  },
                ),


                // ── Performance Stats ─────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Text('Performance Stats',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: context.card,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: context.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // All-time points header
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text('ALL-TIME POINTS', style: kLabel),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${_fmt(totalPts)} pts',
                                    style: const TextStyle(
                                        color: kOrange,
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: kGreen.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text('+12% this week',
                                    style: TextStyle(
                                        color: kGreen,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Gameplay XP bar
                          _ProgressBar(
                            label: 'Gameplay Experience',
                            value: gamePts,
                            total: totalPts > 0 ? totalPts : 1,
                            color: kOrange,
                          ),
                          const SizedBox(height: 12),
                          _ProgressBar(
                            label: 'Tournament Wins',
                            value: tourPts,
                            total: totalPts > 0 ? totalPts : 1,
                            color: kCyan,
                          ),
                          const SizedBox(height: 16),

                          // Region + Global rank
                          Row(
                            children: [
                              Expanded(
                                child: _RankBox(
                                  icon: Icons.military_tech,
                                  label: 'REGION RANK',
                                  rank: '#$regionRank',
                                  color: kCyan,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _RankBox(
                                  icon: Icons.emoji_events,
                                  label: 'GLOBAL RANK',
                                  rank: '#$globalRank',
                                  color: kYellowDot,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Go Premium ────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: _GoPremiumSection(),
                  ),
                ),

                const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
              ],
            );
          },
        ),
      ),
    );
  }

  String _avatarEmoji(String avatar) {
    return kAvatars
            .firstWhere((a) => a['name'] == avatar,
                orElse: () => kAvatars[0])['emoji'] ??
        '🤖';
  }

  String _fmt(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}k';
    return '$n';
  }
}

// ── Stat Box (Followers/Following/Streak) ─────────────────────────────────────
class _StatBox extends StatelessWidget {
  final String value;
  final String label;
  final bool highlight;
  final IconData? icon;
  const _StatBox({required this.value, required this.label,
      this.highlight = false, this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: highlight ? kCyan.withOpacity(0.1) : kBgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: highlight ? kCyan.withOpacity(0.3) : kBorder),
        ),
        child: Column(
          children: [
            if (icon != null)
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(icon, color: kCyan, size: 14),
                const SizedBox(width: 4),
                Text(value,
                    style: TextStyle(
                        color: highlight ? kCyan : kTextPri,
                        fontWeight: FontWeight.w900,
                        fontSize: 18)),
              ])
            else
              Text(value,
                  style: TextStyle(
                      color: highlight ? kCyan : kTextPri,
                      fontWeight: FontWeight.w900,
                      fontSize: 18)),
            const SizedBox(height: 4),
            Text(label, style: kLabel.copyWith(color: kTextSec, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

// ── Friend Row ────────────────────────────────────────────────────────────────
class _FriendRow extends StatelessWidget {
  final Map<String, dynamic> friend;
  const _FriendRow({required this.friend});

  @override
  Widget build(BuildContext context) {
    final badge = friend['badge'] as String? ?? '';
    final badgeColor = badge == 'MVP' ? kYellowDot : kCyan;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: kBorder),
        ),
        child: Row(
          children: [
            // Avatar with online indicator
            Stack(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: kBgTeal,
                  ),
                  child: Center(
                    child: Text(friend['emoji'] as String,
                        style: const TextStyle(fontSize: 22)),
                  ),
                ),
                Positioned(
                  bottom: 1,
                  right: 1,
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                        color: kGreen,
                        shape: BoxShape.circle,
                        border: Border.all(color: kBgDeep, width: 1.5)),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),
            // Name + badge + tier
            Expanded(
              child: Row(
                children: [
                  Text(friend['name'] as String,
                      style: TextStyle(
                          color: context.txtPri,
                          fontWeight: FontWeight.w700,
                          fontSize: 14)),
                  if (badge.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(badge,
                          style: TextStyle(
                              color: badgeColor,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5)),
                    ),
                  ],
                ],
              ),
            ),
            // Invite button
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: kOrange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                textStyle: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 12),
              ),
              child: const Text('Invite'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
class _ProgressBar extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  final Color color;
  const _ProgressBar(
      {required this.label,
      required this.value,
      required this.total,
      required this.color});

  @override
  Widget build(BuildContext context) {
    final fraction = (value / total).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: kSub.copyWith(fontSize: 12)),
            Text('$value pts',
                style: const TextStyle(
                    color: kTextSec, fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: fraction,
            backgroundColor: kBorder,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}

// ── Rank Box ──────────────────────────────────────────────────────────────────
class _RankBox extends StatelessWidget {
  final IconData icon;
  final String label;
  final String rank;
  final Color color;
  const _RankBox(
      {required this.icon,
      required this.label,
      required this.rank,
      required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgDeep,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(label, style: kLabel.copyWith(color: kTextSec, fontSize: 9)),
          const SizedBox(height: 4),
          Text(rank,
              style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}

// ── Go Premium Section ────────────────────────────────────────────────────────
class _GoPremiumSection extends StatefulWidget {
  @override
  State<_GoPremiumSection> createState() => _GoPremiumSectionState();
}

class _GoPremiumSectionState extends State<_GoPremiumSection> {
  bool _annual = false;

  @override
  Widget build(BuildContext context) {
    final price = _annual ? 43200 : 4500;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Go Premium',
            style: TextStyle(
                color: kTextPri,
                fontSize: 17,
                fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),

        // Monthly / Annual toggle
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Monthly',
                style: TextStyle(color: kTextSec, fontSize: 14)),
            const SizedBox(width: 10),
            Switch(
              value: _annual,
              onChanged: (v) => setState(() => _annual = v),
              activeColor: kOrange,
            ),
            const SizedBox(width: 10),
            const Text('Annual',
                style: TextStyle(color: kTextSec, fontSize: 14)),
            const SizedBox(width: 6),
            if (_annual)
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: kGreen.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('-20%',
                    style: TextStyle(
                        color: kGreen,
                        fontSize: 10,
                        fontWeight: FontWeight.w800)),
              ),
          ],
        ),
        const SizedBox(height: 12),

        // Elite plan card (gold gradient)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF8B6914),
                const Color(0xFFD4A520),
                const Color(0xFF8B6914),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('ELITE PLAN',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2)),
              const SizedBox(height: 8),
              RichText(
                text: TextSpan(
                  text: '₦',
                  style: const TextStyle(
                      color: Colors.white, fontSize: 20),
                  children: [
                    TextSpan(
                        text: '$price',
                        style: const TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.w900)),
                    const TextSpan(
                        text: '  /Month',
                        style: TextStyle(fontSize: 15)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const _PremiumFeature('Unlimited tournament entries'),
              const _PremiumFeature('2x streak bonus multiplier'),
              const _PremiumFeature('Priority withdrawal processing'),
              const _PremiumFeature('Exclusive Pro League access'),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF8B6914),
                    padding:
                        const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    textStyle: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  child: const Text('Upgrade to Elite'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PremiumFeature extends StatelessWidget {
  final String text;
  const _PremiumFeature(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Text(text,
              style: const TextStyle(color: Colors.white, fontSize: 13)),
        ],
      ),
    );
  }
}

// ── Edit Profile Screen ───────────────────────────────────────────────────────
class _EditProfileScreen extends StatefulWidget {
  const _EditProfileScreen();

  @override
  State<_EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<_EditProfileScreen> {
  final _usernameCtrl = TextEditingController();
  final _bioCtrl      = TextEditingController();
  int   _selectedAvatar = 0;
  bool  _loading = false;

  @override
  void initState() {
    super.initState();
    _loadCurrent();
  }

  Future<void> _loadCurrent() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(uid)
        .get();
    if (doc.exists) {
      final data = doc.data()!;
      _usernameCtrl.text = data['username'] ?? '';
      _bioCtrl.text      = data['bio'] ?? '';
      final avatarName   = data['avatar'] ?? 'BOT';
      final idx = kAvatars.indexWhere((a) => a['name'] == avatarName);
      if (idx >= 0) setState(() => _selectedAvatar = idx);
    }
  }

  Future<void> _save() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    setState(() => _loading = true);
    try {
      await FirebaseFirestore.instance.collection('users').doc(uid).update({
        'username': _usernameCtrl.text.trim(),
        'bio'     : _bioCtrl.text.trim(),
        'avatar'  : kAvatars[_selectedAvatar]['name'],
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: kBgDeep,
        title: const Text('Edit Profile',
            style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: kTextPri, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current avatar display
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: kOrange, width: 3),
                      color: kBgCard,
                    ),
                    child: Center(
                      child: Text(
                        kAvatars[_selectedAvatar]['emoji']!,
                        style: const TextStyle(fontSize: 44),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                          color: kOrange, shape: BoxShape.circle),
                      child: const Icon(Icons.camera_alt,
                          color: Colors.white, size: 14),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: kOrange,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Change',
                    style: TextStyle(color: Colors.white)),
              ),
            ),
            const SizedBox(height: 24),

            // Avatar picker
            const Text('Choose an Avatar',
                style: TextStyle(
                    color: kTextPri,
                    fontWeight: FontWeight.w700,
                    fontSize: 15)),
            const SizedBox(height: 12),
            SizedBox(
              height: 90,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: kAvatars.length,
                itemBuilder: (_, i) {
                  final sel = i == _selectedAvatar;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedAvatar = i),
                    child: Padding(
                      padding: const EdgeInsets.only(right: 14),
                      child: Column(
                        children: [
                          Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: sel
                                      ? kOrange
                                      : Colors.transparent,
                                  width: 2.5),
                              color: kBgCard,
                            ),
                            child: Center(
                              child: Text(kAvatars[i]['emoji']!,
                                  style:
                                      const TextStyle(fontSize: 26)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(kAvatars[i]['name']!,
                              style: TextStyle(
                                  color:
                                      sel ? kOrange : kTextSec,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Username
            const Text('Username',
                style: TextStyle(
                    color: kTextPri,
                    fontWeight: FontWeight.w700,
                    fontSize: 15)),
            const SizedBox(height: 8),
            TextField(
              controller: _usernameCtrl,
              style: const TextStyle(color: kTextPri),
              decoration: InputDecoration(
                hintText: 'Your username',
                hintStyle: const TextStyle(color: kTextSec),
                filled: true,
                fillColor: kBgCard,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: const Icon(Icons.check_circle,
                    color: kGreen, size: 20),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
              ),
            ),
            const SizedBox(height: 6),
            const Text('Username is available!',
                style: TextStyle(
                    color: kGreen,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 20),

            // Bio
            const Text('Bio & Tags',
                style: TextStyle(
                    color: kTextPri,
                    fontWeight: FontWeight.w700,
                    fontSize: 15)),
            const SizedBox(height: 8),
            TextField(
              controller: _bioCtrl,
              maxLines: 4,
              style: const TextStyle(color: kTextPri),
              decoration: InputDecoration(
                hintText:
                    'Tell the world your gaming style... (e.g. Ayo Pro, Ludo King, Daily Grinder)',
                hintStyle:
                    const TextStyle(color: kTextSec, fontSize: 13),
                filled: true,
                fillColor: kBgCard,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
            const SizedBox(height: 32),

            // Save Changes
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _loading ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kOrange,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Text('Save Changes',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
