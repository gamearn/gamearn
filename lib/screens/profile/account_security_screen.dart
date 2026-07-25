import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme.dart';

// ════════════════════════════════════════════════════════════════
//  ACCOUNT SECURITY SCREEN — Figma matched (390×844)
//
//  y=225: 192×192 rx=96 #22D1EE — glow circle (right-aligned, x=222)
//  y=361: 342×194 rx=12 #FF5E00 — PIN/2FA card (orange)
//    y=394: 64×64 rx=32 #FF5E00 — lock icon circle
//    y=499: 101×23 rx=4 #FF5E00 — "Enable" chip
//  y=636: 342×130 rx=12 #201F1F — sessions card (dark)
//    y=661: 44×24 rx=12 #FF5E00 — active session toggle
// ════════════════════════════════════════════════════════════════

class AccountSecurityScreen extends StatefulWidget {
  const AccountSecurityScreen({super.key});
  @override
  State<AccountSecurityScreen> createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends State<AccountSecurityScreen> {
  bool _twoFA        = false;
  bool _biometrics   = false;
  bool _loginAlerts  = true;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Stack(children: [
        // Glow circle — Figma: y=225 x=222 192×192 rx=96 #22D1EE
        Positioned(
          top: 170, right: -24,
          child: Container(
            width: 192, height: 192,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: kCyan.withOpacity(0.08),
              boxShadow: [BoxShadow(
                  color: kCyan.withOpacity(0.18),
                  blurRadius: 60, spreadRadius: 12)],
            ),
          ),
        ),

        CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: context.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: context.border),
                      ),
                      child: Icon(Icons.arrow_back_ios_new_rounded,
                          color: context.txtPri, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text('Account Security',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 17, fontWeight: FontWeight.w800)),
                ]),
              ),
            ),

            // ── SECURITY SCORE ────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                child: Column(children: [
                  Text('Security Score',
                      style: TextStyle(
                          color: context.txtSec, fontSize: 13)),
                  const SizedBox(height: 8),
                  Text(_score(),
                      style: TextStyle(
                          color: _scoreColor(),
                          fontSize: 42, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text(_scoreLabel(),
                      style: TextStyle(
                          color: _scoreColor(),
                          fontSize: 13, fontWeight: FontWeight.w600)),
                ]),
              ),
            ),

            // ── 2FA / PIN CARD — Figma: y=361 342×194 rx=12 #FF5E00 ──
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 28, 16, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: kOrange,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Lock icon 64×64 rx=32 #FF5E00 (lighter)
                        Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.lock_rounded,
                              color: Colors.white, size: 32),
                        ),
                        const SizedBox(height: 14),
                        const Text('Two-Factor Authentication',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 6),
                        Text(
                          _twoFA
                              ? 'Your account is protected with 2FA'
                              : 'Add an extra layer of security to your account',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 12),
                        ),
                        const SizedBox(height: 16),
                        // Enable chip — Figma: 101×23 rx=4 #FF5E00 inner
                        GestureDetector(
                          onTap: () => setState(() => _twoFA = !_twoFA),
                          child: Container(
                            width: 101, height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Center(
                              child: Text(
                                _twoFA ? 'Disable 2FA' : 'Enable 2FA',
                                style: const TextStyle(
                                    color: kOrange,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // ── SECURITY OPTIONS ──────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 10),
                child: Text('Security Options',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14, fontWeight: FontWeight.w800)),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.border),
                  ),
                  child: Column(children: [
                    _ToggleRow(
                      icon: Icons.fingerprint_rounded,
                      label: 'Biometric Login',
                      sub: 'Use fingerprint or face ID',
                      value: _biometrics,
                      onChanged: (v) => setState(() => _biometrics = v),
                    ),
                    Divider(height: 1, indent: 72,
                        color: context.border),
                    _ToggleRow(
                      icon: Icons.notifications_active_outlined,
                      label: 'Login Alerts',
                      sub: 'Notify on new sign-ins',
                      value: _loginAlerts,
                      onChanged: (v) => setState(() => _loginAlerts = v),
                    ),
                    Divider(height: 1, indent: 72,
                        color: context.border),
                    _NavRow(
                      icon: Icons.password_rounded,
                      label: 'Change Password',
                      onTap: () => _changePasswordSheet(),
                    ),
                  ]),
                ),
              ),
            ),

            // ── ACTIVE SESSIONS — Figma: y=636 342×130 rx=12 #201F1F ─
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 10),
                child: Text('Active Sessions',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 14, fontWeight: FontWeight.w800)),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  decoration: BoxDecoration(
                    // Figma: #201F1F
                    color: context.card,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: kCyan.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.phone_android_rounded,
                            color: kCyan, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('This Device',
                                style: TextStyle(
                                    color: context.txtPri,
                                    fontSize: 14, fontWeight: FontWeight.w700)),
                            SizedBox(height: 2),
                            Text('Android • Current session',
                                style: TextStyle(
                                    color: context.txtSec, fontSize: 11)),
                          ],
                        ),
                      ),
                      // Active toggle badge — Figma: 44×24 rx=12 #FF5E00
                      Container(
                        width: 44, height: 24,
                        decoration: BoxDecoration(
                          color: kOrange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Text('Active',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ]),
                  ),
                ),
              ),
            ),

            // ── DANGER ZONE ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 32),
                child: GestureDetector(
                  onTap: () => _deleteAccountDialog(),
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: Colors.red.withOpacity(0.35)),
                    ),
                    child: const Center(
                      child: Text('Delete Account',
                          style: TextStyle(
                              color: Colors.red,
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ]),
    ),
  );

  // ── helpers ──────────────────────────────────────────────────────
  int get _scoreInt {
    int s = 20;
    if (_twoFA)       s += 40;
    if (_biometrics)  s += 25;
    if (_loginAlerts) s += 15;
    return s;
  }

  String _score() => '${_scoreInt}%';

  Color _scoreColor() {
    final s = _scoreInt;
    if (s >= 80) return const Color(0xFF22C55E);
    if (s >= 50) return kOrange;
    return Colors.red;
  }

  String _scoreLabel() {
    final s = _scoreInt;
    if (s >= 80) return 'Strong';
    if (s >= 50) return 'Moderate';
    return 'Weak — enable 2FA';
  }

  void _changePasswordSheet() {
    final _oldCtrl = TextEditingController();
    final _newCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: context.card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24, right: 24, top: 24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4,
              decoration: BoxDecoration(
                  color: context.txtPri.withOpacity(0.24),
                  borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          Text('Change Password',
              style: TextStyle(color: context.txtPri,
                  fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 20),
          _pwField(_oldCtrl, 'Current Password'),
          const SizedBox(height: 12),
          _pwField(_newCtrl, 'New Password'),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: () async {
              try {
                final cred = EmailAuthProvider.credential(
                    email: FirebaseAuth.instance.currentUser?.email ?? '',
                    password: _oldCtrl.text);
                await FirebaseAuth.instance.currentUser
                    ?.reauthenticateWithCredential(cred);
                await FirebaseAuth.instance.currentUser
                    ?.updatePassword(_newCtrl.text);
                if (context.mounted) Navigator.pop(context);
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('$e')));
              }
            },
            child: Container(
              width: double.infinity, height: 48,
              decoration: BoxDecoration(
                  color: kOrange, borderRadius: BorderRadius.circular(12)),
              child: const Center(child: Text('Update Password',
                  style: TextStyle(color: Colors.white,
                      fontSize: 15, fontWeight: FontWeight.w800))),
            ),
          ),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  Widget _pwField(TextEditingController c, String hint) => Container(
    height: 52,
    decoration: BoxDecoration(
      color: context.card,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: context.border),
    ),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: TextField(
        controller: c,
        obscureText: true,
        style: TextStyle(color: context.txtPri),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: context.txtSec),
          border: InputBorder.none,
        ),
      ),
    ),
  );

  void _deleteAccountDialog() => showDialog(
    context: context,
    builder: (_) => AlertDialog(
      backgroundColor: context.card,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text('Delete Account',
          style: TextStyle(color: context.txtPri, fontWeight: FontWeight.w800)),
      content: Text(
          'This action is permanent and cannot be undone. All your data will be lost.',
          style: TextStyle(color: context.txtSec)),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel',
                style: TextStyle(color: context.txtSec))),
        TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await FirebaseAuth.instance.currentUser?.delete();
            },
            child: const Text('Delete',
                style: TextStyle(
                    color: Colors.red, fontWeight: FontWeight.w800))),
      ],
    ),
  );
}

// ── TOGGLE ROW ────────────────────────────────────────────────────
class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String label, sub;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow({required this.icon, required this.label,
      required this.sub, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    leading: Container(
      width: 40, height: 40,
      decoration: BoxDecoration(
          color: kCyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8)),
      child: Icon(icon, color: kCyan, size: 20),
    ),
    title: Text(label, style: TextStyle(
        color: context.txtPri, fontSize: 14, fontWeight: FontWeight.w600)),
    subtitle: Text(sub, style: TextStyle(
        color: context.txtSec, fontSize: 11)),
    trailing: Switch(
      value: value, onChanged: onChanged,
      activeColor: kCyan,
      activeTrackColor: kCyan.withOpacity(0.3),
      inactiveThumbColor: context.txtSec,
      inactiveTrackColor: context.border,
    ),
  );
}

// ── NAV ROW ───────────────────────────────────────────────────────
class _NavRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavRow(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    onTap: onTap,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    leading: Container(
      width: 40, height: 40,
      decoration: BoxDecoration(
          color: kCyan.withOpacity(0.12),
          borderRadius: BorderRadius.circular(8)),
      child: Icon(icon, color: kCyan, size: 20),
    ),
    title: Text(label, style: TextStyle(
        color: context.txtPri, fontSize: 14, fontWeight: FontWeight.w600)),
    trailing: Icon(Icons.chevron_right_rounded,
        color: context.txtSec, size: 20),
  );
}
