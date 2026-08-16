import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  INVITE FRIENDS SCREEN — Figma matched (1694:919, 390×844)
//
//  Hero / Referral 342×209 #22D1EE@10: "EARN WHILE THEY PLAY"
//    fs20 w700 #22D1EE · body fs12 #FFFFFF@60 · link box 292×46
//    #0A1128 (gamearn.gg/ref/… fs16 #22D1EE) + Copy 81×36 #22D1EE
//  Quick Share Methods: 3 tiles 107×108 #22D1EE@10 (icon 48×48
//    #22D1EE@20): In-app Friends / Contacts / Email fs10
//  Friends: rows 342×74 #1A2131@30 (avatar 48 + dot 12, tier fs12
//    #FFFFFF@60, Invite 64×32 #FF5E00 / Following outline) +
//    External Contacts section
// ════════════════════════════════════════════════════════════════

class InviteFriendsScreen extends StatefulWidget {
  const InviteFriendsScreen({super.key});

  @override
  State<InviteFriendsScreen> createState() => _InviteFriendsScreenState();
}

class _InviteFriendsScreenState extends State<InviteFriendsScreen> {
  static const _friends = [
    {'name': 'Chukwudi', 'emoji': '🦅', 'online': true,
     'tier': 'Diamond Tier • Level 84', 'following': false},
    {'name': 'Amara', 'emoji': '🦁', 'online': true,
     'tier': 'Master Tier • Level 102', 'following': false},
    {'name': 'GhostProtocol', 'emoji': '👻', 'online': false,
     'tier': 'Gold III • Offline', 'following': true},
    {'name': 'StormWalker', 'emoji': '⛈️', 'online': true,
     'tier': 'Platinum II • In-Game', 'following': false},
  ];

  String get _refCode {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    return uid.length >= 8 ? uid.substring(0, 8).toUpperCase() : 'CYBER_X_99';
  }

  String get _refLink => 'gamearn.gg/ref/$_refCode';

  Future<void> _copyLink() async {
    await Clipboard.setData(ClipboardData(text: _refLink));
    if (mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(
          content: Text('Link copied!'),
          backgroundColor: kCyan,
          behavior: SnackBarBehavior.floating,
        ));
    }
  }

  void _shareVia(String method) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('Sharing via $method'),
        backgroundColor: kCyan,
        behavior: SnackBarBehavior.floating,
      ));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
        // Header — Figma Frame 56
        Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
          decoration: const BoxDecoration(
            color: Color(0xE60B0E1A),
            border: Border(bottom: BorderSide(color: Color(0x4DFFFFFF), width: 1)),
          ),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: const Icon(Icons.close_rounded,
                  color: Color(0xFFF1F5F9), size: 20),
            ),
            const Expanded(
              child: Text('Invite Friends',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Color(0xFFF1F5F9),
                      fontSize: 18, fontWeight: FontWeight.w700)),
            ),
            SizedBox(width: 20.w),
          ]),
        ),

        Expanded(
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            children: [

              SizedBox(height: 32.h),

              // ── HERO / REFERRAL — Figma: 342×209 #22D1EE@10 ──────────
              Stack(children: [
                Positioned(
                  right: -20.w, top: -30.h,
                  child: Container(
                    width: 128.w, height: 128.h,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: kCyan.withOpacity(0.1),
                      boxShadow: [BoxShadow(
                          color: kCyan.withOpacity(0.15),
                          blurRadius: 60.r, spreadRadius: 10.r)],
                    ),
                  ),
                ),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(24.r),
                  decoration: BoxDecoration(
                    color: kCyan.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('EARN WHILE THEY PLAY',
                          style: TextStyle(
                              color: kCyan,
                              fontSize: 20, fontWeight: FontWeight.w700)),
                      SizedBox(height: 8.h),
                      const Text(
                        'Invite your squad and get 10%\ncommission on every tournament\nentry fee.',
                        style: TextStyle(
                            color: Color(0x99FFFFFF), fontSize: 12,
                            fontWeight: FontWeight.w400, height: 1.4),
                      ),
                      SizedBox(height: 16.h),
                      // Link box — Figma: 292×46 #0A1128 + Copy 81×36
                      Row(children: [
                        Expanded(
                          child: Container(
                            height: 46.h,
                            padding:
                                EdgeInsets.symmetric(horizontal: 14.w),
                            alignment: Alignment.centerLeft,
                            decoration: BoxDecoration(
                              color: const Color(0xFF0A1128),
                              borderRadius: BorderRadius.circular(8.r),
                            ),
                            child: Text(_refLink,
                                style: const TextStyle(
                                    color: kCyan, fontSize: 15,
                                    fontWeight: FontWeight.w400)),
                          ),
                        ),
                        SizedBox(width: 10.w),
                        GestureDetector(
                          onTap: _copyLink,
                          child: Container(
                            height: 36.h,
                            padding: EdgeInsets.symmetric(
                                horizontal: 14.w),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: kCyan,
                              borderRadius: BorderRadius.circular(8.r),
                            ),
                            child: Row(mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.copy_rounded,
                                      color: Color(0xFF0A1128), size: 12),
                                  SizedBox(width: 6.w),
                                  const Text('Copy',
                                      style: TextStyle(
                                          color: Color(0xFF0A1128),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700)),
                                ]),
                          ),
                        ),
                      ]),
                    ],
                  ),
                ),
              ]),

              SizedBox(height: 24.h),

              // ── QUICK SHARE METHODS ───────────────────────────────────
              const Text('Quick Share Methods',
                  style: TextStyle(
                      color: Color(0x99FFFFFF), fontSize: 12,
                      fontWeight: FontWeight.w600)),
              SizedBox(height: 16.h),
              Row(children: [
                _shareTile(Icons.group_rounded, 'In-app Friends'),
                SizedBox(width: 11.w),
                _shareTile(Icons.contacts_rounded, 'Contacts'),
                SizedBox(width: 11.w),
                _shareTile(Icons.email_outlined, 'Email'),
              ]),

              SizedBox(height: 24.h),

              // ── FRIENDS LIST ──────────────────────────────────────────
              Row(children: [
                const Expanded(
                  child: Text('Active Friends',
                      style: TextStyle(
                          color: Color(0x99FFFFFF), fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ),
                const Text('12 Online',
                    style: TextStyle(
                        color: kOrange, fontSize: 12,
                        fontWeight: FontWeight.w500)),
              ]),
              SizedBox(height: 10.h),

              for (final f in _friends) _FriendRow(data: f),

              SizedBox(height: 18.h),

              // ── EXTERNAL CONTACTS ─────────────────────────────────────
              _externalContacts(),

              SizedBox(height: 32.h),
            ],
          ),
        ),
      ]),
    ),
  );

  Widget _shareTile(IconData icon, String label) => Expanded(
    child: GestureDetector(
      onTap: () => _shareVia(label),
      child: Container(
        height: 108.h,
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48.w, height: 48.h,
              decoration: BoxDecoration(
                color: kCyan.withOpacity(0.2),
                borderRadius: BorderRadius.circular(14.r),
              ),
              child: Icon(icon, color: kCyan, size: 22.w),
            ),
            SizedBox(height: 8.h),
            Text(label,
                style: const TextStyle(
                    color: Color(0x99FFFFFF), fontSize: 10,
                    fontWeight: FontWeight.w400)),
          ],
        ),
      ),
    ),
  );

  Widget _externalContacts() => Container(
    padding: EdgeInsets.all(14.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.1),
      borderRadius: BorderRadius.circular(12.r),
    ),
    child: Row(children: [
      Container(
        width: 48.w, height: 48.h,
        decoration: BoxDecoration(
          color: kCyan.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14.r),
        ),
        child: const Icon(Icons.import_contacts_rounded,
            color: kCyan, size: 22),
      ),
      SizedBox(width: 14.w),
      const Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('External Contacts',
                style: TextStyle(
                    color: Colors.white, fontSize: 14,
                    fontWeight: FontWeight.w600)),
            SizedBox(height: 2),
            Text('Invite friends from your phone book',
                style: TextStyle(
                    color: Color(0x99FFFFFF), fontSize: 12)),
          ],
        ),
      ),
      GestureDetector(
        onTap: () => _shareVia('contacts'),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
          decoration: BoxDecoration(
            color: kOrange,
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: const Text('Invite',
              style: TextStyle(
                  color: Colors.white, fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ),
      ),
    ]),
  );
}

// ── FRIEND ROW — Figma: 342×74 #1A2131@30 ────────────────────────
class _FriendRow extends StatefulWidget {
  final Map<String, dynamic> data;
  const _FriendRow({required this.data});

  @override
  State<_FriendRow> createState() => _FriendRowState();
}

class _FriendRowState extends State<_FriendRow> {
  late bool _following;

  @override
  void initState() {
    super.initState();
    _following = widget.data['following'] as bool? ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final f = widget.data;
    final online = f['online'] as bool? ?? true;
    return Container(
      margin: EdgeInsets.only(left: 16.w),
      padding: EdgeInsets.all(12.r),
      decoration: BoxDecoration(
        color: const Color(0x4D1A2131),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Row(children: [
        // Avatar 48 + online dot 12
        Stack(children: [
          Container(
            width: 48.w, height: 48.h,
            decoration: BoxDecoration(
              color: context.card,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(f['emoji'] as String,
                  style: const TextStyle(fontSize: 24)),
            ),
          ),
          Positioned(
            right: 0, bottom: 0,
            child: Container(
              width: 12.w, height: 12.h,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: online
                    ? const Color(0xFF22C55E)
                    : const Color(0xFF475569),
                border: Border.all(color: context.bg, width: 2),
              ),
            ),
          ),
        ]),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(f['name'] as String,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 16,
                      fontWeight: FontWeight.w600)),
              SizedBox(height: 2.h),
              Text(f['tier'] as String,
                  style: const TextStyle(
                      color: Color(0x99FFFFFF), fontSize: 12,
                      fontWeight: FontWeight.w500)),
            ],
          ),
        ),
        SizedBox(width: 10.w),
        _following
            ? GestureDetector(
                onTap: () => setState(() => _following = false),
                child: Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: 14.w, vertical: 8.h),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(8.r),
                    border: Border.all(color: context.border),
                  ),
                  child: const Text('Following',
                      style: TextStyle(
                          color: Colors.white, fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ),
              )
            : GestureDetector(
                onTap: () => setState(() => _following = true),
                child: Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: 14.w, vertical: 8.h),
                  decoration: BoxDecoration(
                    color: kOrange,
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: const Text('Invite',
                      style: TextStyle(
                          color: Colors.white, fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ),
              ),
      ]),
    );
  }
}
