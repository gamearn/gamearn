import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'account_security_screen.dart';
import 'privacy_security_screen.dart';
import 'language_screen.dart';
import 'help_support_screen.dart';

// ════════════════════════════════════════════════════════════════
//  SETTINGS SCREEN — Figma matched (390×844)
//
//  y=123: 342×141 rx=12 #1E293B — section card
//    y=137: 40×40 rx=8 #22D1EE icon box (notifications row)
//    y=211: 40×40 rx=8 #22D1EE icon box (sound row)
//  y=316: 342×353 rx=12 #1E293B — section card (account)
//    y=329: 40×40 rx=8 #22D1EE icon + toggle 44×24 rx=12 #22D1EE (dark mode)
//    y=402: 40×40 rx=8 #22D1EE icon + toggle 44×24 rx=12 #334155 (off)
//    y=480,548,616: nav rows with 40×40 icons
// ════════════════════════════════════════════════════════════════

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _sounds        = true;
  bool _vibration     = false;

  bool get _darkMode {
    final f = ThemeNotifier.instance.forceDark;
    return f ?? true;
  }

  @override
  void initState() {
    super.initState();
    ThemeNotifier.instance.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeNotifier.instance.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFF0B0E1A),
    body: SafeArea(
      child: Column(children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white, size: 16),
              ),
            ),
            const SizedBox(width: 14),
            const Text('Settings',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 17, fontWeight: FontWeight.w800)),
          ]),
        ),

        const SizedBox(height: 20),

        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [

              // ── SECTION 1: Preferences — Figma: 342×141 rx=12 #1E293B ──
              _sectionLabel('Preferences'),
              _SectionCard(children: [
                _IconToggle(
                  icon: Icons.notifications_outlined,
                  label: 'Push Notifications',
                  value: _notifications,
                  onChanged: (v) => setState(() => _notifications = v),
                ),
                _divider(),
                _IconToggle(
                  icon: Icons.volume_up_outlined,
                  label: 'Sound Effects',
                  value: _sounds,
                  onChanged: (v) => setState(() => _sounds = v),
                ),
              ]),

              const SizedBox(height: 14),

              // ── SECTION 2: Account — Figma: 342×353 rx=12 #1E293B ──────
              _sectionLabel('Account'),
              _SectionCard(children: [
                // Dark mode — toggle active = #22D1EE, off = #334155
                _IconToggle(
                  icon: _darkMode
                      ? Icons.dark_mode_outlined
                      : Icons.light_mode_outlined,
                  label: 'Dark Mode',
                  value: _darkMode,
                  onChanged: (v) => ThemeNotifier.instance.setTheme(v),
                ),
                _divider(),
                _IconToggle(
                  icon: Icons.vibration_outlined,
                  label: 'Vibration',
                  value: _vibration,
                  onChanged: (v) => setState(() => _vibration = v),
                ),
                _divider(),
                _IconNav(
                  icon: Icons.lock_outline_rounded,
                  label: 'Account Security',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(
                          builder: (_) => const AccountSecurityScreen())),
                ),
                _divider(),
                _IconNav(
                  icon: Icons.privacy_tip_outlined,
                  label: 'Privacy & Security',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(
                          builder: (_) => const PrivacySecurityScreen())),
                ),
                _divider(),
                _IconNav(
                  icon: Icons.language_outlined,
                  label: 'Language',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(
                          builder: (_) => const LanguageScreen())),
                ),
              ]),

              const SizedBox(height: 14),

              // ── SECTION 3: Support ─────────────────────────────────────
              _sectionLabel('Support'),
              _SectionCard(children: [
                _IconNav(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & Support',
                    onTap: () => Navigator.push(context,
                        MaterialPageRoute(
                            builder: (_) => const HelpSupportScreen()))),
                _divider(),
                _IconNav(
                    icon: Icons.question_answer_outlined,
                    label: 'FAQs',
                    onTap: () {}),
              ]),

              const SizedBox(height: 16),

              // Sign out
              GestureDetector(
                onTap: () => FirebaseAuth.instance.signOut(),
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: kOrange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: kOrange.withOpacity(0.35)),
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
              const SizedBox(height: 32),
            ],
          ),
        ),
      ]),
    ),
  );

  Widget _sectionLabel(String t) => Padding(
    padding: const EdgeInsets.only(left: 4, bottom: 8),
    child: Text(t.toUpperCase(),
        style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 11, fontWeight: FontWeight.w700,
            letterSpacing: 1.2)),
  );

  Widget _divider() => const Divider(
      height: 1, indent: 72, color: Color(0xFF334155));
}

// ── SECTION CARD — Figma: 342×var rx=12 #1E293B ──────────────────
class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(children: children),
  );
}

// ── ICON TOGGLE — Figma: 40×40 rx=8 #22D1EE icon box
//                         toggle 44×24 rx=12 ─────────────────────
class _IconToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _IconToggle(
      {required this.icon, required this.label,
       required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding:
        const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
    leading: Container(
      // Figma: 40×40 rx=8 #22D1EE
      width: 40, height: 40,
      decoration: BoxDecoration(
        color: kCyan,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: const Color(0xFF0B0E1A), size: 20),
    ),
    title: Text(label,
        style: const TextStyle(
            color: Colors.white, fontSize: 14,
            fontWeight: FontWeight.w500)),
    trailing: Switch(
      value: value,
      onChanged: onChanged,
      // Figma: active #22D1EE, inactive #334155
      activeColor: kCyan,
      activeTrackColor: kCyan.withOpacity(0.3),
      inactiveThumbColor: const Color(0xFF94A3B8),
      inactiveTrackColor: const Color(0xFF334155),
    ),
  );
}

// ── ICON NAV ─────────────────────────────────────────────────────
class _IconNav extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _IconNav(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    onTap: onTap,
    contentPadding:
        const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
    leading: Container(
      width: 40, height: 40,
      decoration: BoxDecoration(
        color: kCyan,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: const Color(0xFF0B0E1A), size: 20),
    ),
    title: Text(label,
        style: const TextStyle(
            color: Colors.white, fontSize: 14,
            fontWeight: FontWeight.w500)),
    trailing: const Icon(Icons.chevron_right_rounded,
        color: Color(0xFF475569), size: 20),
  );
}
