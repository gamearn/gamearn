import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ---------------------------------------------------------------------------
// AccountSecurityScreen
// Stack: Flutter + Firebase Auth (reauthenticate, updatePassword, MFA)
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class AccountSecurityScreen extends StatefulWidget {
  const AccountSecurityScreen({super.key});

  @override
  State<AccountSecurityScreen> createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends State<AccountSecurityScreen> {
  static const _bg = Color(0xFF0B0E1A);
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);
  static const _surface = Color(0xFF141827);
  static const _border = Color(0xFF1E2438);

  bool _twoFAEnabled = false;
  bool _loginAlerts = true;
  bool _biometric = false;

  // Active sessions (mock — fetch from Firestore /users/{uid}/sessions)
  final List<Map<String, dynamic>> _sessions = [
    {
      'device': 'Tecno KI5k',
      'location': 'Kaduna, NG',
      'lastSeen': 'Now',
      'current': true,
    },
    {
      'device': 'Samsung Galaxy A54',
      'location': 'Abuja, NG',
      'lastSeen': '2 days ago',
      'current': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Account Security',
          style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.3),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          // ── Password ───────────────────────────────────────────────────
          _SectionHeader(title: 'Password'),
          _TileCard(
            children: [
              _ActionTile(
                icon: Icons.lock_outline_rounded,
                iconColor: _cyan,
                title: 'Change Password',
                subtitle: 'Last changed 30+ days ago',
                onTap: () => _showChangePasswordSheet(context),
              ),
            ],
          ),

          // ── Two-Factor Auth ────────────────────────────────────────────
          _SectionHeader(title: 'Two-Factor Authentication'),
          _TileCard(
            children: [
              _ToggleTile(
                icon: Icons.verified_user_outlined,
                iconColor: _twoFAEnabled ? Colors.greenAccent : Colors.white38,
                title: '2FA via SMS / TOTP',
                subtitle: _twoFAEnabled ? 'Enabled' : 'Adds extra login protection',
                value: _twoFAEnabled,
                onChanged: (v) {
                  HapticFeedback.selectionClick();
                  setState(() => _twoFAEnabled = v);
                  // TODO: Firebase Phone MFA enroll / unenroll
                },
              ),
              _divider(),
              _ToggleTile(
                icon: Icons.fingerprint_rounded,
                iconColor: _biometric ? _cyan : Colors.white38,
                title: 'Biometric Login',
                subtitle: 'Use fingerprint to log in',
                value: _biometric,
                onChanged: (v) {
                  HapticFeedback.selectionClick();
                  setState(() => _biometric = v);
                  // TODO: local_auth plugin
                },
              ),
            ],
          ),

          // ── Alerts ────────────────────────────────────────────────────
          _SectionHeader(title: 'Alerts'),
          _TileCard(
            children: [
              _ToggleTile(
                icon: Icons.notifications_active_outlined,
                iconColor: _loginAlerts ? _orange : Colors.white38,
                title: 'Login Alerts',
                subtitle: 'Get notified of new sign-ins',
                value: _loginAlerts,
                onChanged: (v) {
                  HapticFeedback.selectionClick();
                  setState(() => _loginAlerts = v);
                  // TODO: write to Firestore /users/{uid}/settings
                },
              ),
            ],
          ),

          // ── Active Sessions ────────────────────────────────────────────
          _SectionHeader(title: 'Active Sessions'),
          ..._sessions.map((s) => _SessionCard(
                session: s,
                onRevoke: s['current']
                    ? null
                    : () => _revokeSession(s),
              )),
          const SizedBox(height: 8),
          _DangerButton(
            label: 'Sign Out All Other Devices',
            onTap: _signOutAll,
          ),

          // ── Danger Zone ────────────────────────────────────────────────
          _SectionHeader(title: 'Danger Zone'),
          _TileCard(
            children: [
              _ActionTile(
                icon: Icons.delete_forever_rounded,
                iconColor: Colors.redAccent,
                title: 'Delete Account',
                subtitle: 'Permanently remove your account',
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: Colors.white24, size: 20),
                onTap: () => _showDeleteAccountDialog(context),
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ── Bottom Sheets / Dialogs ───────────────────────────────────────────────

  void _showChangePasswordSheet(BuildContext context) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool obscureCurrent = true;
    bool obscureNew = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF141827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.fromLTRB(
              20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Change Password',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 17)),
              const SizedBox(height: 20),
              _PasswordField(
                controller: currentCtrl,
                label: 'Current Password',
                obscure: obscureCurrent,
                onToggle: () =>
                    setModal(() => obscureCurrent = !obscureCurrent),
              ),
              const SizedBox(height: 12),
              _PasswordField(
                controller: newCtrl,
                label: 'New Password',
                obscure: obscureNew,
                onToggle: () => setModal(() => obscureNew = !obscureNew),
              ),
              const SizedBox(height: 12),
              _PasswordField(
                controller: confirmCtrl,
                label: 'Confirm New Password',
                obscure: obscureNew,
                onToggle: () => setModal(() => obscureNew = !obscureNew),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF22D1EE),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: () {
                    // TODO: Firebase reauthenticateWithCredential → updatePassword
                    Navigator.pop(ctx);
                  },
                  child: const Text('Update Password',
                      style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.w800,
                          fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _revokeSession(Map<String, dynamic> session) {
    HapticFeedback.mediumImpact();
    setState(() => _sessions.remove(session));
    // TODO: delete Firestore /users/{uid}/sessions/{sessionId}
    // + send FCM "force_logout" to that session's token
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${session['device']} signed out')),
    );
  }

  void _signOutAll() {
    HapticFeedback.mediumImpact();
    setState(() => _sessions.removeWhere((s) => !(s['current'] as bool)));
    // TODO: batch-delete all sessions except current in Firestore + FCM
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF141827),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Account',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        content: const Text(
          'This will permanently delete your account, coins, and game history. This cannot be undone.',
          style: TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel',
                  style: TextStyle(color: Color(0xFF22D1EE)))),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // TODO: Firebase Auth deleteUser + Firestore cleanup
            },
            child: const Text('Delete',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared sub-widgets
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 20, 0, 8),
      child: Text(title.toUpperCase(),
          style: const TextStyle(
              color: Colors.white38,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2)),
    );
  }
}

class _TileCard extends StatelessWidget {
  final List<Widget> children;
  const _TileCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1E2438)),
      ),
      child: Column(children: children),
    );
  }
}

Widget _divider() => const Divider(
    height: 1, thickness: 1, color: Color(0xFF1E2438), indent: 52);

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _ActionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title,
          style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: Colors.white38, fontSize: 12)),
      trailing: trailing ??
          const Icon(Icons.chevron_right_rounded,
              color: Colors.white24, size: 20),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(title,
          style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: Colors.white38, fontSize: 12)),
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: const Color(0xFF22D1EE),
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Map<String, dynamic> session;
  final VoidCallback? onRevoke;

  const _SessionCard({required this.session, this.onRevoke});

  @override
  Widget build(BuildContext context) {
    final bool current = session['current'] as bool;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF141827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: current
              ? const Color(0xFF22D1EE).withOpacity(0.4)
              : const Color(0xFF1E2438),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: current
                  ? const Color(0xFF22D1EE).withOpacity(0.12)
                  : Colors.white12,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.smartphone_rounded,
                color: current ? const Color(0xFF22D1EE) : Colors.white38,
                size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(session['device'],
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 13)),
                    if (current) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF22D1EE).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('This device',
                            style: TextStyle(
                                color: Color(0xFF22D1EE),
                                fontSize: 9,
                                fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${session['location']}  ·  ${session['lastSeen']}',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
          ),
          if (onRevoke != null)
            TextButton(
              onPressed: onRevoke,
              style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(48, 32),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap),
              child: const Text('Revoke',
                  style:
                      TextStyle(color: Colors.redAccent, fontSize: 12)),
            ),
        ],
      ),
    );
  }
}

class _DangerButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _DangerButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.redAccent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
        ),
        child: Text(label,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.redAccent,
                fontWeight: FontWeight.w700,
                fontSize: 14)),
      ),
    );
  }
}

class _PasswordField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool obscure;
  final VoidCallback onToggle;

  const _PasswordField({
    required this.controller,
    required this.label,
    required this.obscure,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white54, fontSize: 13),
        filled: true,
        fillColor: const Color(0xFF0B0E1A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF1E2438)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF1E2438)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF22D1EE)),
        ),
        suffixIcon: IconButton(
          icon: Icon(
              obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20),
          onPressed: onToggle,
        ),
      ),
    );
  }
}
