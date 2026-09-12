import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gamearn/l10n/app_localizations.dart';
import '../../theme.dart';
import '../../services/sound_service.dart';
import '../wallet/wallet_screen.dart';
import 'account_security_screen.dart';
import 'privacy_security_screen.dart';
import 'language_screen.dart';
import 'help_support_screen.dart';
import 'delete_account_screen.dart';
import '../legal/legal_content_screen.dart';
import '../auth/login_screen.dart';

// ════════════════════════════════════════════════════════════════
//  SETTINGS & PREFERENCES — Figma matched (1744:1001, 390×844)
//  Responsive via flutter_screenutil (design size 390×844)
// ════════════════════════════════════════════════════════════════

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _emailAlerts = false;
  bool _sounds = true;
  bool _vibration = false;

  bool get _isDarkNow {
    final f = ThemeNotifier.instance.forceDark;
    if (f != null) return f;
    return Theme.of(context).brightness == Brightness.dark;
  }

  IconData get _themeIcon {
    final f = ThemeNotifier.instance.forceDark;
    if (f == null) return Icons.brightness_auto_outlined;
    return f ? Icons.dark_mode_outlined : Icons.light_mode_outlined;
  }

  void _cycleTheme() {
    final f = ThemeNotifier.instance.forceDark;
    if (f == null) {
      ThemeNotifier.instance.setTheme(true);
    } else if (f == true) {
      ThemeNotifier.instance.setTheme(false);
    } else {
      ThemeNotifier.instance.setTheme(null);
    }
  }

  @override
  void initState() {
    super.initState();
    ThemeNotifier.instance.addListener(_onThemeChanged);
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final sp = await SharedPreferences.getInstance();
    setState(() {
      _sounds = sp.getBool('sound_enabled') ?? true;
      _vibration = sp.getBool('vibration_enabled') ?? false;
      _emailAlerts = sp.getBool('email_alerts') ?? false;
    });
    SoundService.instance.setEnabled(_sounds);
  }

  Future<void> _toggleSound(bool val) async {
    setState(() => _sounds = val);
    SoundService.instance.setEnabled(val);
    final sp = await SharedPreferences.getInstance();
    await sp.setBool('sound_enabled', val);
  }

  Future<void> _toggleVibration(bool val) async {
    setState(() => _vibration = val);
    final sp = await SharedPreferences.getInstance();
    await sp.setBool('vibration_enabled', val);
  }

  Future<void> _toggleEmailAlerts(bool val) async {
    setState(() => _emailAlerts = val);
    final sp = await SharedPreferences.getInstance();
    await sp.setBool('email_alerts', val);
  }

  void _openSoundSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: context.card,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 28.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: 12.h),
              child: Text(AppLocalizations.of(ctx)!.settingsSoundVibration,
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 17.sp,
                      fontWeight: FontWeight.w800)),
            ),
            _sheetToggle(AppLocalizations.of(ctx)!.settingsSoundEffects,
                _sounds, _toggleSound),
            _sheetToggle(AppLocalizations.of(ctx)!.settingsVibration,
                _vibration, _toggleVibration),
          ],
        ),
      ),
    );
  }

  Widget _sheetToggle(String label, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label,
          style: TextStyle(
              color: context.txtPri,
              fontSize: 15.sp,
              fontWeight: FontWeight.w600)),
      value: value,
      onChanged: onChanged,
      activeColor: kCyan,
      activeTrackColor: kCyan.withOpacity(0.3),
      inactiveThumbColor: context.txtSec,
      inactiveTrackColor: context.border,
    );
  }

  @override
  void dispose() {
    ThemeNotifier.instance.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Column(children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(24.w, 40.h, 24.w, 16.h),
            decoration: BoxDecoration(
              color: context.bg,
              border:
                  Border(bottom: BorderSide(color: context.border, width: 1)),
            ),
            child: Row(children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: Icon(Icons.close_rounded,
                    color: context.txtPri, size: 20.w),
              ),
              Expanded(
                child: Text(l10n.settingsTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 18.sp,
                        fontWeight: FontWeight.w700)),
              ),
              SizedBox(width: 20.w),
            ]),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              children: [
                SizedBox(height: 32.h),
                _sectionLabel(l10n.settingsAccountSecurity),
                _SectionCard(children: [
                  _NavRow(
                    icon: Icons.shield_outlined,
                    title: l10n.settingsAccountSecurityTile,
                    sub: l10n.settingsAccountSecuritySub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AccountSecurityScreen())),
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.account_balance_wallet_outlined,
                    title: l10n.settingsPayoutMethods,
                    sub: l10n.settingsPayoutMethodsSub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const WalletScreen())),
                  ),
                ]),
                SizedBox(height: 32.h),
                _sectionLabel(l10n.settingsGamePrefs),
                _SectionCard(children: [
                  _ToggleRow(
                    icon: _themeIcon,
                    title: l10n.settingsThemePreference,
                    sub: l10n.settingsThemePreferenceSub,
                    value: _isDarkNow,
                    onChanged: (_) => _cycleTheme(),
                  ),
                  _divider(),
                  _ToggleRow(
                    icon: Icons.email_outlined,
                    title: l10n.settingsEmailAlerts,
                    sub: l10n.settingsEmailAlertsSub,
                    value: _emailAlerts,
                    onChanged: _toggleEmailAlerts,
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.volume_up_outlined,
                    title: l10n.settingsSoundVibration,
                    sub: l10n.settingsSoundVibrationSub,
                    onTap: _openSoundSheet,
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.language_outlined,
                    title: l10n.settingsLanguage,
                    sub: l10n.settingsLanguageSubEnglish,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const LanguageScreen())),
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.privacy_tip_outlined,
                    title: l10n.settingsPrivacySecurity,
                    sub: l10n.settingsPrivacySecuritySub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const PrivacySecurityScreen())),
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.help_outline_rounded,
                    title: l10n.settingsHelpSupport,
                    sub: l10n.settingsHelpSupportSub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const HelpSupportScreen())),
                  ),
                ]),
                SizedBox(height: 32.h),
                _sectionLabel(l10n.settingsLegal),
                _SectionCard(children: [
                  _NavRow(
                    icon: Icons.description_outlined,
                    title: l10n.settingsTerms,
                    sub: l10n.settingsTermsSub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) =>
                                const LegalContentScreen(doc: LegalDoc.terms))),
                  ),
                  _divider(),
                  _NavRow(
                    icon: Icons.privacy_tip_outlined,
                    title: l10n.settingsPrivacyPolicy,
                    sub: l10n.settingsPrivacyPolicySub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const LegalContentScreen(
                                doc: LegalDoc.privacy))),
                  ),
                ]),
                SizedBox(height: 32.h),
                _sectionLabel(l10n.settingsDangerZone),
                _SectionCard(children: [
                  _NavRow(
                    icon: Icons.person_remove_outlined,
                    titleColor: Colors.redAccent,
                    iconColor: Colors.redAccent,
                    title: l10n.settingsDeleteAccount,
                    sub: l10n.settingsDeleteAccountSub,
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const DeleteAccountScreen())),
                  ),
                ]),
                SizedBox(height: 32.h),
                GestureDetector(
                  onTap: () async {
                    await FirebaseAuth.instance.signOut();
                    if (!context.mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (_) => false,
                    );
                  },
                  child: Container(
                    height: 56.h,
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.logout_rounded,
                            color: context.txtSec, size: 15.w),
                        SizedBox(width: 8.w),
                        Text(l10n.logout,
                            style: TextStyle(
                                color: context.txtSec,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 12.h),
                Center(
                  child: Text(l10n.premiumVersion,
                      style: TextStyle(
                          color: context.txtSec,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w400)),
                ),
                SizedBox(height: 32.h),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _sectionLabel(String t) => Padding(
        padding: EdgeInsets.only(left: 4.w, bottom: 10.h),
        child: Text(t.toUpperCase(),
            style: TextStyle(
                color: kCyan,
                fontSize: 12.sp,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4.w)),
      );

  Widget _divider() => Container(
      height: 1.h,
      margin: EdgeInsets.symmetric(horizontal: 16.w),
      color: kCyan.withOpacity(0.05));
}

// ── SECTION CARD — Figma: 342×var rx=12 #1E293B@45 ───────────────
class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(children: children),
      );
}

// ── NAV ROW — Figma: 40×40 rx=8 #22D1EE@10 box, chevron ──────────
class _NavRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;
  const _NavRow(
      {required this.icon,
      required this.title,
      required this.sub,
      required this.onTap,
      this.iconColor,
      this.titleColor});

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: onTap,
        contentPadding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 12.h),
        leading: Container(
          width: 40.w,
          height: 40.w,
          decoration: BoxDecoration(
            color: (iconColor ?? kCyan).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Icon(icon, color: iconColor ?? kCyan, size: 20.w),
        ),
        title: Text(title,
            style: TextStyle(
                color: titleColor ?? context.txtPri,
                fontSize: 16.sp,
                fontWeight: FontWeight.w600)),
        subtitle: Text(sub,
            style: TextStyle(
                color: context.txtSec,
                fontSize: 12.sp,
                fontWeight: FontWeight.w500)),
        trailing: Icon(Icons.chevron_right_rounded,
            color: context.txtSec, size: 16.w),
      );
}

// ── TOGGLE ROW — Figma: switch 44×24 (on #22D1EE / off #334155) ──
class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String sub;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _ToggleRow(
      {required this.icon,
      required this.title,
      required this.sub,
      required this.value,
      required this.onChanged});

  @override
  Widget build(BuildContext context) => ListTile(
        onTap: () => onChanged(!value),
        contentPadding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 12.h),
        leading: Container(
          width: 40.w,
          height: 40.w,
          decoration: BoxDecoration(
            color: kCyan.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8.r),
          ),
          child: Icon(icon, color: kCyan, size: 20.w),
        ),
        title: Text(title,
            style: TextStyle(
                color: context.txtPri,
                fontSize: 16.sp,
                fontWeight: FontWeight.w600)),
        subtitle: Text(sub,
            style: TextStyle(
                color: context.txtSec,
                fontSize: 12.sp,
                fontWeight: FontWeight.w500)),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: kCyan,
          activeTrackColor: kCyan.withOpacity(0.3),
          inactiveThumbColor: context.txtSec,
          inactiveTrackColor: context.border,
        ),
      );
}
