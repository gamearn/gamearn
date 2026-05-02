import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .snapshots(),
          builder: (ctx, userSnap) {
            final user = userSnap.hasData && userSnap.data!.exists
                ? userSnap.data!.data() as Map<String, dynamic>
                : <String, dynamic>{};
            final username = user['username'] ?? 'Player';
            final avatar   = user['avatar']   ?? 'BOT';
            final status   = user['memberStatus'] ?? 'Active Member';

            return CustomScrollView(
              slivers: [
                // ── Top bar ───────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Row(
                      children: [
                        // Avatar circle with orange border
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: kOrange, width: 2),
                            color: kBgCard,
                          ),
                          child: Center(
                            child: Text(
                              _avatarEmoji(avatar),
                              style: const TextStyle(fontSize: 22),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(username,
                                style: const TextStyle(
                                    color: kTextPri,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15)),
                            Text(status,
                                style: const TextStyle(
                                    color: kCyan, fontSize: 11)),
                          ],
                        ),
                        const Spacer(),
                        // Notifications
                        _IconBtn(
                          icon: Icons.notifications_outlined,
                          badge: true,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const _NotificationsScreen())),
                        ),
                        const SizedBox(width: 8),
                        // Settings
                        _IconBtn(
                          icon: Icons.settings_outlined,
                          onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const _SettingsScreen())),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Welcome text ───────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Welcome back, $username!',
                            style: const TextStyle(
                                color: kTextPri,
                                fontSize: 20,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        const Text(
                            'You can earn points by keeping your streak.',
                            style: TextStyle(color: kTextSec, fontSize: 13)),
                      ],
                    ),
                  ),
                ),

                // ── Wallet Balance + Streak cards ──────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: StreamBuilder<DocumentSnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('wallets')
                          .doc(uid)
                          .snapshots(),
                      builder: (ctx, walSnap) {
                        final wallet =
                            walSnap.hasData && walSnap.data!.exists
                                ? walSnap.data!.data()
                                    as Map<String, dynamic>
                                : <String, dynamic>{};
                        final balance = wallet['balance'] ?? 0;
                        final streak  = user['dayStreak'] ?? 0;

                        return Row(
                          children: [
                            Expanded(
                              child: _StatCard(
                                icon: Icons.account_balance_wallet_outlined,
                                label: 'Wallet Balance',
                                value: '₦${balance.toString()}',
                                sub: '+500/units',
                                iconColor: kCyan,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.local_fire_department_outlined,
                                label: 'Daily Streak',
                                value: '$streak Days',
                                sub: 'Next reward in 2 days',
                                iconColor: kOrange,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),

                // ── All Tournaments header ─────────────────────────────────
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Text('All Tournaments',
                        style: TextStyle(
                            color: kTextPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                // ── Tournament horizontal scroll ───────────────────────────
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 170,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('tournaments')
                          .orderBy('createdAt', descending: true)
                          .limit(10)
                          .snapshots(),
                      builder: (ctx, snap) {
                        final docs = snap.data?.docs ?? [];
                        if (docs.isEmpty) {
                          return Center(
                              child: Text('No tournaments yet.',
                                  style: kSub));
                        }
                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: docs.length,
                          itemBuilder: (_, i) {
                            final d = docs[i].data()
                                as Map<String, dynamic>;
                            final active = d['active'] == true;
                            return _TournamentCard(data: d, active: active);
                          },
                        );
                      },
                    ),
                  ),
                ),

                // ── GAMES header ───────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                    child: Row(
                      children: [
                        const Icon(Icons.sports_esports_outlined,
                            color: kOrange, size: 20),
                        const SizedBox(width: 8),
                        const Text('GAMES',
                            style: TextStyle(
                                color: kTextPri,
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2)),
                      ],
                    ),
                  ),
                ),

                // ── Games grid ────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 160,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('arena')
                          .where('active', isEqualTo: true)
                          .limit(6)
                          .snapshots(),
                      builder: (ctx, snap) {
                        final docs = snap.data?.docs ?? _mockGames();
                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: docs.length,
                          itemBuilder: (_, i) {
                            final d = docs[i] is DocumentSnapshot
                                ? (docs[i] as DocumentSnapshot).data()
                                    as Map<String, dynamic>
                                : docs[i] as Map<String, dynamic>;
                            return _GameCard(data: d);
                          },
                        );
                      },
                    ),
                  ),
                ),

                // ── Global Leaderboard ─────────────────────────────────────
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 0),
                    child: Text('Global Leaderboard',
                        style: TextStyle(
                            color: kTextPri,
                            fontSize: 17,
                            fontWeight: FontWeight.w800)),
                  ),
                ),

                SliverToBoxAdapter(
                  child: _LeaderboardSection(),
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

  List<Map<String, dynamic>> _mockGames() => [
    {'title': 'Lúùdò', 'playCount': 1200, 'emoji': '🎲'},
    {'title': 'Ayò Òpón', 'playCount': 850, 'emoji': '⚫'},
    {'title': 'Draughts', 'playCount': 420, 'emoji': '🔴'},
  ];
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String sub;
  final Color iconColor;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: iconColor, size: 16),
            const SizedBox(width: 6),
            Text(label, style: kSub.copyWith(fontSize: 11)),
          ]),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  color: kTextPri,
                  fontSize: 18,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(sub, style: kSub.copyWith(fontSize: 10, color: kGreen)),
        ],
      ),
    );
  }
}

// ── Tournament Card ───────────────────────────────────────────────────────────
class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final bool active;

  const _TournamentCard({required this.data, required this.active});

  @override
  Widget build(BuildContext context) {
    final prize    = data['prize'] ?? data['total_pool'] ?? '0';
    final players  = data['maxPlayers'] ?? data['player_count'] ?? 0;
    final title    = data['title'] ?? 'Tournament';

    return Container(
      width: 230,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgTeal,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            if (active)
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: kGreen,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Live Now',
                    style: TextStyle(
                        color: Colors.black,
                        fontSize: 10,
                        fontWeight: FontWeight.w800)),
              ),
            const SizedBox(width: 8),
            if (players > 0)
              Row(children: [
                const Icon(Icons.group, color: kTextSec, size: 12),
                const SizedBox(width: 4),
                Text('$players Players',
                    style: const TextStyle(
                        color: kTextSec, fontSize: 10)),
              ]),
          ]),
          const SizedBox(height: 8),
          Text(title,
              style: const TextStyle(
                  color: kTextPri,
                  fontWeight: FontWeight.w800,
                  fontSize: 14),
              maxLines: 2),
          const Spacer(),
          const Text('Win Tournament',
              style: TextStyle(color: kTextSec, fontSize: 11)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Prize Pool',
                  style: TextStyle(color: kTextSec, fontSize: 11)),
              Text('\$$prize',
                  style: const TextStyle(
                      color: kCyan,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Game Card ─────────────────────────────────────────────────────────────────
class _GameCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _GameCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final title      = data['title'] ?? 'Game';
    final playCount  = data['playCount'] ?? 0;
    final emoji      = data['emoji'] ?? '🎮';

    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 40)),
          const Spacer(),
          Text(title,
              style: const TextStyle(
                  color: kTextPri,
                  fontWeight: FontWeight.w700,
                  fontSize: 14)),
          const SizedBox(height: 2),
          Text(
            playCount >= 1000
                ? '${(playCount / 1000).toStringAsFixed(1)}k Playing'
                : '$playCount Playing',
            style: const TextStyle(color: kOrange, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

// ── Leaderboard section ───────────────────────────────────────────────────────
class _LeaderboardSection extends StatefulWidget {
  @override
  State<_LeaderboardSection> createState() => _LeaderboardSectionState();
}

class _LeaderboardSectionState extends State<_LeaderboardSection> {
  int _period = 0; // 0=Daily 1=Weekly 2=Monthly 3=Yearly
  static const periods = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Period selector tabs
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Container(
            height: 36,
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: List.generate(periods.length, (i) {
                final sel = i == _period;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _period = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: sel ? kCyan : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      alignment: Alignment.center,
                      child: Text(periods[i],
                          style: TextStyle(
                            color: sel ? kBgDeep : kTextSec,
                            fontSize: 11,
                            fontWeight: sel
                                ? FontWeight.w800
                                : FontWeight.w400,
                          )),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),

        // Leaderboard entries (Firestore)
        StreamBuilder<QuerySnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .orderBy('totalPoints', descending: true)
              .limit(10)
              .snapshots(),
          builder: (ctx, snap) {
            final docs = snap.data?.docs ?? [];
            if (docs.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(32),
                child: Text('No rankings yet.', style: kSub),
              );
            }
            return ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: docs.length,
              itemBuilder: (_, i) {
                final d = docs[i].data() as Map<String, dynamic>;
                return _LeaderboardRow(
                    rank: i + 1, data: d, isMe: docs[i].id ==
                        FirebaseAuth.instance.currentUser?.uid);
              },
            );
          },
        ),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final int rank;
  final Map<String, dynamic> data;
  final bool isMe;
  const _LeaderboardRow(
      {required this.rank, required this.data, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final rankColors = {1: const Color(0xFFFFD700), 2: const Color(0xFFC0C0C0), 3: const Color(0xFFCD7F32)};
    final rankColor  = rankColors[rank] ?? kTextSec;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isMe ? kCyan.withOpacity(0.08) : kBgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: isMe ? kCyan.withOpacity(0.3) : kBorder),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text('#$rank',
                style: TextStyle(
                    color: rankColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 13)),
          ),
          const SizedBox(width: 8),
          Text(data['avatar'] != null ? _emoji(data['avatar']) : '🤖',
              style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(data['username'] ?? 'Player',
                style: TextStyle(
                    color: isMe ? kCyan : kTextPri,
                    fontWeight: FontWeight.w600,
                    fontSize: 14)),
          ),
          Text('${data['totalPoints'] ?? 0} pts',
              style: const TextStyle(
                  color: kOrange,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
        ],
      ),
    );
  }

  String _emoji(String avatar) {
    return kAvatars
            .firstWhere((a) => a['name'] == avatar,
                orElse: () => kAvatars[0])['emoji'] ??
        '🤖';
  }
}

// ── Icon button helper ────────────────────────────────────────────────────────
class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool badge;
  const _IconBtn({required this.icon, required this.onTap, this.badge = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: kBgCard,
          shape: BoxShape.circle,
        ),
        child: Stack(
          children: [
            Center(
                child: Icon(icon, color: kTextSec, size: 20)),
            if (badge)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                      color: kOrange, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ── Notifications Screen ──────────────────────────────────────────────────────
class _NotificationsScreen extends StatelessWidget {
  const _NotificationsScreen();

  @override
  Widget build(BuildContext context) {
    const mockNotifs = [
      {'type': 'match', 'title': 'Match Ready', 'body': 'Your tournament match starts in 10 mins.', 'time': '5h ago'},
      {'type': 'comment', 'title': 'New Comment', 'body': 'CyberNinja replied to your clip', 'time': 'Yesterday'},
      {'type': 'follower', 'title': 'New Follower', 'body': '@gamer123 started following you', 'time': '3h ago'},
    ];

    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: kBgDeep,
        title: const Text('Notifications',
            style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        elevation: 0,
      ),
      body: ListView.builder(
        itemCount: mockNotifs.length * 3,
        itemBuilder: (_, i) {
          final n = mockNotifs[i % mockNotifs.length];
          final colors = {
            'match': const Color(0xFF6C5CE7),
            'comment': const Color(0xFFFDBD3F),
            'follower': kCyan,
          };
          final icons = {
            'match': Icons.sports_esports,
            'comment': Icons.chat_bubble,
            'follower': Icons.person_add,
          };
          return ListTile(
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: colors[n['type']]!.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icons[n['type']], color: colors[n['type']], size: 22),
            ),
            title: Text(n['title']!,
                style: const TextStyle(
                    color: kTextPri,
                    fontWeight: FontWeight.w700,
                    fontSize: 14)),
            subtitle: Text(n['body']!,
                style: const TextStyle(color: kTextSec, fontSize: 12)),
            trailing: Text(n['time']!,
                style: const TextStyle(color: kTextMuted, fontSize: 11)),
          );
        },
      ),
    );
  }
}

// ── Settings Screen ───────────────────────────────────────────────────────────
class _SettingsScreen extends StatefulWidget {
  const _SettingsScreen();

  @override
  State<_SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<_SettingsScreen> {
  bool _darkMode     = true;
  bool _emailAlerts  = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: kBgDeep,
        title: const Text('Settings & Preferences',
            style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Account & Security
          Text('ACCOUNT & SECURITY', style: kLabel.copyWith(color: kCyan)),
          const SizedBox(height: 8),
          _SettingsTile(icon: Icons.security, title: 'Account Security',
              sub: 'Password, 2FA and sessions', onTap: () {}),
          _SettingsTile(icon: Icons.payment, title: 'Payout Methods',
              sub: 'Bank accounts & wallets', onTap: () {}),
          const SizedBox(height: 20),

          // Game Preferences
          Text('GAME PREFERENCES', style: kLabel.copyWith(color: kCyan)),
          const SizedBox(height: 8),
          _SettingsToggle(
            icon: Icons.palette_outlined,
            title: 'Theme Preference',
            sub: 'Dark & Light mode',
            value: _darkMode,
            onChanged: (v) => setState(() => _darkMode = v),
          ),
          _SettingsToggle(
            icon: Icons.email_outlined,
            title: 'Email Alerts',
            sub: 'Weekly rewards summary',
            value: _emailAlerts,
            onChanged: (v) => setState(() => _emailAlerts = v),
          ),
          _SettingsTile(icon: Icons.language, title: 'Language',
              sub: 'English (NG)', onTap: () {}),
          _SettingsTile(icon: Icons.shield_outlined, title: 'Privacy & Security',
              sub: 'Game security update', onTap: () {}),
          _SettingsTile(icon: Icons.help_outline, title: 'Help & Support',
              sub: 'Get important information', onTap: () {}),
          const SizedBox(height: 24),

          // Logout
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text('Logout',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w700)),
            onTap: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) Navigator.of(context).popUntil((r) => r.isFirst);
            },
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text('GAMEARN Premium v2.4.1',
                style: TextStyle(color: kTextMuted, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.title, required this.sub, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: kBgCard, borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          width: 38, height: 38,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: kCyan, size: 20),
        ),
        title: Text(title,
            style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w600)),
        subtitle: Text(sub, style: kSub.copyWith(fontSize: 11)),
        trailing: const Icon(Icons.chevron_right, color: kTextSec, size: 20),
        onTap: onTap,
      ),
    );
  }
}

class _SettingsToggle extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _SettingsToggle({required this.icon, required this.title,
      required this.sub, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: kBgCard, borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          width: 38, height: 38,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: kCyan, size: 20),
        ),
        title: Text(title,
            style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w600)),
        subtitle: Text(sub, style: kSub.copyWith(fontSize: 11)),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: kCyan,
        ),
      ),
    );
  }
}
