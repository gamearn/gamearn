import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
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
  bool _darkMode = true;

  @override
  Widget build(BuildContext context) {
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
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: context.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new,
                          color: Colors.white, size: 16),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text('Settings', style: context.titleStyle),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _sectionCard(context, 'Preferences', [
                    _toggleTile(context, Icons.notifications_outlined,
                        'Push Notifications', _notifications,
                        (v) => setState(() => _notifications = v)),
                    _divider(context),
                    _toggleTile(context, Icons.volume_up_outlined,
                        'Sound Effects', _soundEffects,
                        (v) => setState(() => _soundEffects = v)),
                    _divider(context),
                    _toggleTile(context, Icons.vibration_outlined,
                        'Vibration', _vibration,
                        (v) => setState(() => _vibration = v)),
                    _divider(context),
                    _toggleTile(context, Icons.dark_mode_outlined,
                        'Dark Mode', _darkMode,
                        (v) => setState(() => _darkMode = v)),
                  ]),
                  const SizedBox(height: 16),
                  _sectionCard(context, 'Account', [
                    _navTile(context, Icons.lock_outline, 'Account Security',
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
                    _navTile(context, Icons.language_outlined,
                        'Language', () {}),
                  ]),
                  const SizedBox(height: 16),
                  _sectionCard(context, 'Support', [
                    _navTile(context, Icons.help_outline, 'Help & Support',
                        () {}),
                    _divider(context),
                    _navTile(context, Icons.question_answer_outlined,
                        'FAQs', () {}),
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
                        border: Border.all(
                            color: context.orange.withOpacity(0.3)),
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
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: context.cyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: context.cyan, size: 20),
      ),
      title: Text(label,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w500)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: context.cyan,
        inactiveThumbColor: context.subText,
        inactiveTrackColor: context.bg,
      ),
    );
  }

  Widget _navTile(BuildContext context, IconData icon, String label,
      VoidCallback onTap) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: context.cyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: context.cyan, size: 20),
      ),
      title: Text(label,
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w500)),
      trailing: Icon(Icons.chevron_right, color: context.subText),
    );
  }

  Widget _divider(BuildContext context) => Divider(
        height: 1,
        indent: 72,
        color: context.bg.withOpacity(0.6),
      );
}
