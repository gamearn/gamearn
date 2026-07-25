import 'package:flutter/material.dart';
import '../../theme.dart';

class PrivacySecurityScreen extends StatefulWidget {
  const PrivacySecurityScreen({super.key});

  @override
  State<PrivacySecurityScreen> createState() => _PrivacySecurityScreenState();
}

class _PrivacySecurityScreenState extends State<PrivacySecurityScreen> {
  bool _profilePublic = true;
  bool _showOnline = true;
  bool _allowFriendRequests = true;
  bool _analytics = false;

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
                    width: 40,
                    height: 40,
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
                const Text('Privacy & Security',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800)),
              ]),
            ),

            const SizedBox(height: 20),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // Section: Privacy
                  _sectionLabel('Privacy'),
                  _SectionCard(children: [
                    _IconToggle(
                      icon: Icons.public_outlined,
                      label: 'Public Profile',
                      subtitle: 'Others can find your profile',
                      value: _profilePublic,
                      onChanged: (v) =>
                          setState(() => _profilePublic = v),
                    ),
                    _divider(),
                    _IconToggle(
                      icon: Icons.circle_outlined,
                      label: 'Show Online Status',
                      subtitle: 'Let others see when you\'re online',
                      value: _showOnline,
                      onChanged: (v) =>
                          setState(() => _showOnline = v),
                    ),
                    _divider(),
                    _IconToggle(
                      icon: Icons.person_add_outlined,
                      label: 'Allow Friend Requests',
                      subtitle: 'Receive friend requests from others',
                      value: _allowFriendRequests,
                      onChanged: (v) =>
                          setState(() => _allowFriendRequests = v),
                    ),
                  ]),

                  const SizedBox(height: 14),

                  // Section: Data
                  _sectionLabel('Data'),
                  _SectionCard(children: [
                    _IconToggle(
                      icon: Icons.analytics_outlined,
                      label: 'Analytics & Improvement',
                      subtitle: 'Help improve Gamearn with usage data',
                      value: _analytics,
                      onChanged: (v) => setState(() => _analytics = v),
                    ),
                    _divider(),
                    _IconNav(
                      icon: Icons.block_outlined,
                      label: 'Blocked Users',
                      onTap: () {
                        // TODO: blocked users list
                      },
                    ),
                  ]),

                  const SizedBox(height: 14),

                  // Section: Danger zone
                  _sectionLabel('Danger Zone'),
                  _SectionCard(children: [
                    _IconNav(
                      icon: Icons.delete_forever_outlined,
                      label: 'Delete Account',
                      labelColor: kOrange,
                      onTap: () => _showDeleteDialog(),
                    ),
                  ]),

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
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2)),
      );

  Widget _divider() =>
      const Divider(height: 1, indent: 72, color: Color(0xFF334155));

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Account?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
        content: const Text(
          'This action is permanent and cannot be undone. All your data, earnings, and game history will be lost.',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // TODO: call account deletion
            },
            child: const Text('Delete',
                style: TextStyle(color: kOrange, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// Reusable widgets matching settings_screen.dart patterns
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

class _IconToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _IconToggle({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: kCyan,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF0B0E1A), size: 20),
        ),
        title: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
        subtitle: subtitle != null
            ? Text(subtitle!,
                style:
                    const TextStyle(color: Color(0xFF64748B), fontSize: 11))
            : null,
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: kCyan,
          activeTrackColor: kCyan.withOpacity(0.3),
          inactiveThumbColor: const Color(0xFF94A3B8),
          inactiveTrackColor: const Color(0xFF334155),
        ),
      );
}

class _IconNav extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? labelColor;
  final VoidCallback onTap;
  const _IconNav({
    required this.icon,
    required this.label,
    this.labelColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: onTap,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: labelColor != null
                ? labelColor!.withOpacity(0.12)
                : kCyan,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: labelColor ?? const Color(0xFF0B0E1A), size: 20),
        ),
        title: Text(label,
            style: TextStyle(
                color: labelColor ?? Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: Color(0xFF475569), size: 20),
      );
}
