import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  PRIVACY & SECURITY SCREEN — Figma matched (2080:2421, 390×844)
//
//  Hero: "System Integrity" fs12 #22D1EE · "YOUR SHIELD IS ACTIVE"
//    fs32 w700 · body fs16 #FFFFFF@60 · glow 192 #22D1EE@20 +
//    shield circle 128 border + cyan icon
//  Data & Permissions: 342×252 #22D1EE@5 · header fs20 w700 ·
//    3 toggles 294×68 #22D1EE@10 (title fs14 w700, sub fs12
//    #FFFFFF@70, switch 44×24 off #334155)
//  Account Visibility: 342×341 #22D1EE@5 · 3 radio options
//    (Public selected, Friends Only, Invisible)
//  Third-Party: 342×310 #22D1EE@5 · header + "2 Apps Linked" ·
//    rows 310×86 #22D1EE@10 with Disconnect fs12 #FFFFFF@90
// ════════════════════════════════════════════════════════════════

class PrivacySecurityScreen extends StatefulWidget {
  const PrivacySecurityScreen({super.key});

  @override
  State<PrivacySecurityScreen> createState() => _PrivacySecurityScreenState();
}

class _PrivacySecurityScreenState extends State<PrivacySecurityScreen> {
  bool _dataSharing    = false;
  bool _analytics      = false;
  bool _location       = false;
  int  _visibility     = 0; // 0 = Public, 1 = Friends Only, 2 = Invisible

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
              child: Icon(Icons.close_rounded,
                  color: const Color(0xFFF1F5F9), size: 20.w),
            ),
            Expanded(
              child: Text('Privacy & Security',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: const Color(0xFFF1F5F9),
                      fontSize: 18.sp, fontWeight: FontWeight.w700)),
            ),
            SizedBox(width: 20.w),
          ]),
        ),

        Expanded(
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            children: [

              SizedBox(height: 32.h),

              // ── HERO: SHIELD — Figma: 342×478 rx12 pad[32,32,32,32] ──
              Container(
                padding: EdgeInsets.all(32.r),
                decoration: BoxDecoration(
                  color: kCyan.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Stack(children: [
                  // Glow — Figma: 192×192 #22D1EE@20 right
                  Positioned(
                    right: -30, top: 50,
                    child: Container(
                      width: 192.w, height: 192.h,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: kCyan.withOpacity(0.2),
                        boxShadow: [BoxShadow(
                            color: kCyan.withOpacity(0.2),
                            blurRadius: 70, spreadRadius: 14)],
                      ),
                    ),
                  ),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    // Label — Figma: fs12 w400 #22D1EE letterSpacing 1.2
                    Text('System Integrity',
                        style: TextStyle(
                            color: kCyan, fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            letterSpacing: 1.2.w)),
                    SizedBox(height: 12.h),
                    // Title — Figma: fs32 w700 lineHeight40 letterSpacing -0.8
                    Text('YOUR SHIELD IS\nACTIVE',
                        style: TextStyle(
                            color: context.txtPri,
                            fontSize: 32.sp, fontWeight: FontWeight.w700,
                            height: 1.25, letterSpacing: -0.8.w)),
                    SizedBox(height: 14.h),
                    // Body — Figma: fs16 w400 lineHeight26 #FFFFFF@60
                    Text(
                      'Manage your digital footprint and\nsecure your gaming legacy across the\nGamearn.',
                      style: TextStyle(
                          color: const Color(0x99FFFFFF), fontSize: 16.sp,
                          fontWeight: FontWeight.w400, height: 1.625),
                    ),
                  ]),
                ]),
              ),

              SizedBox(height: 24.h),

              // ── DATA & PERMISSIONS — Figma: 342×252 #22D1EE@5 ────────
              _Section(headerIcon: Icons.data_usage_rounded,
                headerIconColor: const Color(0xCCFFFFFF),
                title: 'Data & Permissions', children: [
                _ToggleTile(
                  icon: Icons.share_outlined,
                  title: 'Data Sharing',
                  sub: 'Share gameplay metrics with partners',
                  value: _dataSharing,
                  onChanged: (v) => setState(() => _dataSharing = v),
                ),
                _ToggleTile(
                  icon: Icons.insights_outlined,
                  title: 'Analytics & Improvement',
                  sub: 'Help improve Gamearn with usage data',
                  value: _analytics,
                  onChanged: (v) => setState(() => _analytics = v),
                ),
                _ToggleTile(
                  icon: Icons.location_on_outlined,
                  title: 'Location Services',
                  sub: 'Enable local matchmaking servers',
                  value: _location,
                  onChanged: (v) => setState(() => _location = v),
                ),
              ]),

              SizedBox(height: 24.h),

              // ── ACCOUNT VISIBILITY — Figma: 342×341 ──────────────────
              _Section(headerIcon: Icons.visibility_outlined,
                headerIconColor: kCyan,
                title: 'Account Visibility', children: [
                _RadioTile(
                  title: 'Public',
                  sub: 'Everyone can see your stats &\nachievements',
                  selected: _visibility == 0,
                  onTap: () => setState(() => _visibility = 0),
                ),
                SizedBox(height: 8.h),
                _RadioTile(
                  title: 'Friends Only',
                  sub: 'Only approved squad members can view',
                  selected: _visibility == 1,
                  onTap: () => setState(() => _visibility = 1),
                ),
                SizedBox(height: 8.h),
                _RadioTile(
                  title: 'Invisible',
                  sub: 'Invisible to all users and leaderboards',
                  selected: _visibility == 2,
                  onTap: () => setState(() => _visibility = 2),
                ),
              ]),

              SizedBox(height: 24.h),

              // ── THIRD-PARTY CONNECTIONS ───────────────────────────────
              _Section(
                headerIcon: Icons.extension_outlined,
                headerIconColor: kOrange,
                title: 'Third-Party\nConnections',
                trailingText: '2 Apps Linked',
                children: [
                  _AppRow(
                    brand: 'G',
                    brandColor: const Color(0xFFFFF5F5),
                    name: 'Google Account',
                    sub: 'Linked since Oct\n2023',
                    onDisconnect: () => _disconnect('Google Account'),
                  ),
                  SizedBox(height: 12.h),
                  _AppRow(
                    brand: 'f',
                    brandColor: const Color(0xFF1877F2),
                    name: 'Facebook',
                    sub: 'Linked since Jan 2024',
                    onDisconnect: () => _disconnect('Facebook'),
                  ),
                ],
              ),

              SizedBox(height: 32.h),
            ],
          ),
        ),
      ]),
    ),
  );

  void _disconnect(String app) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('$app disconnected'),
        backgroundColor: kCyan,
        behavior: SnackBarBehavior.floating,
      ));
  }
}

// ── SECTION — Figma: 342×var #22D1EE@5 ───────────────────────────
class _Section extends StatelessWidget {
  final IconData headerIcon;
  final Color headerIconColor;
  final String title;
  final String? trailingText;
  final List<Widget> children;

  const _Section({
    required this.headerIcon,
    required this.headerIconColor,
    required this.title,
    this.trailingText,
    required this.children,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.all(24.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.05),
      borderRadius: BorderRadius.circular(12.r),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(headerIcon, color: headerIconColor, size: 20.w),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(title,
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 20.sp, fontWeight: FontWeight.w700,
                  letterSpacing: -0.5.w)),
        ),
        if (trailingText != null)
          Text(trailingText!,
              style: TextStyle(
                  color: const Color(0xB3FFFFFF), fontSize: 12.sp,
                  fontWeight: FontWeight.w500)),
      ]),
      SizedBox(height: 16.h),
      ...children,
    ]),
  );
}

// ── TOGGLE TILE — Figma: 294×68 #22D1EE@10, switch 44×24 ─────────
class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.title,
    required this.sub,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.all(16.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.1),
      borderRadius: BorderRadius.circular(8.r),
    ),
    child: Row(children: [
      Icon(icon, color: kCyan, size: 20.w),
      SizedBox(width: 14.w),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14.sp, fontWeight: FontWeight.w700)),
            SizedBox(height: 2.h),
            Text(sub,
                style: TextStyle(
                    color: const Color(0xB3FFFFFF), fontSize: 12.sp,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
      Switch(
        value: value,
        onChanged: onChanged,
        activeColor: kCyan,
        activeTrackColor: kCyan.withOpacity(0.3),
        inactiveThumbColor: context.txtSec,
        inactiveTrackColor: context.border,
      ),
    ]),
  );
}

// ── RADIO TILE — Figma: radio 20×20 (selected cyan) ───────────────
class _RadioTile extends StatelessWidget {
  final String title;
  final String sub;
  final bool selected;
  final VoidCallback onTap;

  const _RadioTile({
    required this.title,
    required this.sub,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: kCyan.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Row(children: [
        Icon(selected ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
            color: selected ? kCyan : context.txtSec, size: 20.w),
        SizedBox(width: 14.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 14.sp, fontWeight: FontWeight.w700)),
              SizedBox(height: 2.h),
              Text(sub,
                  style: TextStyle(
                      color: const Color(0xB3FFFFFF), fontSize: 12.sp,
                      fontWeight: FontWeight.w500, height: 1.3)),
            ],
          ),
        ),
      ]),
    ),
  );
}

// ── APP ROW — Figma: 310×86 #22D1EE@10 + Disconnect ──────────────
class _AppRow extends StatelessWidget {
  final String brand;
  final Color brandColor;
  final String name;
  final String sub;
  final VoidCallback onDisconnect;

  const _AppRow({
    required this.brand,
    required this.brandColor,
    required this.name,
    required this.sub,
    required this.onDisconnect,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.all(16.r),
    decoration: BoxDecoration(
      color: kCyan.withOpacity(0.1),
      borderRadius: BorderRadius.circular(8.r),
    ),
    child: Row(children: [
      Container(
        width: 40.w, height: 40.h,
        decoration: BoxDecoration(
          color: const Color(0x0DFFFFFF),
          borderRadius: BorderRadius.circular(10.r),
        ),
        child: Center(
          child: Text(brand,
              style: TextStyle(
                  color: brandColor,
                  fontSize: 20.sp, fontWeight: FontWeight.w800)),
        ),
      ),
      SizedBox(width: 14.w),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(name,
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 14.sp, fontWeight: FontWeight.w700)),
            SizedBox(height: 2.h),
            Text(sub,
                style: TextStyle(
                    color: const Color(0xB3FFFFFF), fontSize: 12.sp,
                    fontWeight: FontWeight.w500, height: 1.3)),
          ],
        ),
      ),
      SizedBox(width: 10.w),
      GestureDetector(
        onTap: onDisconnect,
        child: Text('Disconnect',
            style: TextStyle(
                color: const Color(0xE6FFFFFF), fontSize: 12.sp,
                fontWeight: FontWeight.w500)),
      ),
    ]),
  );
}
