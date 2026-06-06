import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';
import 'account_security_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _soundEffects = true;
  bool _vibration = false;

  // Read initial value from the notifier so toggle reflects real state
  bool get _darkMode {
    final forced = ThemeNotifier.instance.forceDark;
    if (forced != null) return forced;
    // If following system, treat as dark by default (matches design)
    return true;
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
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.maybePop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: context.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: context.border),
                      ),
                      // ✅ Fixed: was hardcoded Colors.white → now theme-aware
                      child: Icon(Icons.arrow_back_ios_new,
                          color: context.txtPri, size: 16),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text('Settings', style: context.titleStyle.copyWith(color: context.txtPri)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _sectionCard(context, 'Preferences', [
                    _toggleTile(
                        context,
                        Icons.notifications_outlined,
                        'Push Notifications',
                        _notifications,
                        (v) => setState(() => _notifications = v)),
                    _divider(context),
                    _toggleTile(
                        context,
                        Icons.volume_up_outlined,
                        'Sound Effects',
                        _soundEffects,
                        (v) => setState(() => _soundEffects = v)),
                    _divider(context),
                    _toggleTile(context, Icons.vibration_outlined, 'Vibration',
                        _vibration, (v) => setState(() => _vibration = v)),
                    _divider(context),
                    // ✅ Fixed: now actually calls ThemeNotifier
                    _toggleTile(context, isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                        'Dark Mode', _darkMode, (v) {
                      ThemeNotifier.instance.setTheme(v);
                    }),
                  ]),
                  const SizedBox(height: 16),
                  _sectionCard(context, 'Account', [
                    _navTile(
                        context,
                        Icons.lock_outline,
                        'Account Security',
                        () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const AccountSecurityScreen(),
                              ),
                            )),
                    _divider(context),
                    _navTile(context, Icons.privacy_tip_outlined,
                        'Privacy & Security', () {}),
                    _divider(context),
                    _navTile(
                        context, Icons.language_outlined, 'Language', () {}),
                  ]),
                  const SizedBox(height: 16),
                  _sectionCard(context, 'Support', [
                    _navTile(
                        context, Icons.help_outline, 'Help & Support', () {}),
                    _divider(context),
                    _navTile(
                        context, Icons.question_answer_outlined, 'FAQs', () {}),
                  ]),
                  const SizedBox(height: 16),
                  // Sign out
                  GestureDetector(
                    onTap: () async {
                      await FirebaseAuth.instance.signOut();
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: context.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border:
                            Border.all(color: context.orange.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.logout, color: context.orange, size: 20),
                          const SizedBox(width: 10),
                          Text('Sign Out',
                              style: TextStyle(
                                  color: context.orange,
                                  fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard(BuildContext context, String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Text(title,
              style: TextStyle(
                  color: context.subText,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1)),
        ),
        Container(
          decoration: BoxDecoration(
            color: context.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.border.withOpacity(0.5)),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _toggleTile(BuildContext context, IconData icon, String label,
      bool value, ValueChanged<bool> onChanged) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: context.cyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: context.cyan, size: 20),
      ),
      // ✅ Fixed: was hardcoded Colors.white → context.txtPri
      title: Text(label,
          style: TextStyle(
              color: context.txtPri, fontWeight: FontWeight.w500)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: context.cyan,
        inactiveThumbColor: context.subText,
        inactiveTrackColor: context.border,
      ),
    );
  }

  Widget _navTile(
      BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: context.cyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: context.cyan, size: 20),
      ),
      // ✅ Fixed: was hardcoded Colors.white → context.txtPri
      title: Text(label,
          style: TextStyle(
              color: context.txtPri, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right, color: context.subText),
    );
  }

  Widget _divider(BuildContext context) => Divider(
        height: 1,
        indent: 72,
        color: context.border.withOpacity(0.5),
      );
}
