import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../auth/mfa_enrollment_screen.dart';

// ════════════════════════════════════════════════════════════════
//  ACCOUNT SECURITY SCREEN — Figma matched (2076:1835, 390×844)
//
//  Hero: "Security Rating" fs12 #22D1EE · "YOUR ACCOUNT IS
//    FORTIFIED" fs32 w700 · body fs16 #FFFFFF@50 · glow 192×192
//    #22D1EE@10 · "Updated 2m ago" fs14 #FFFFFF@60
//  Vault Status: card 342×194 #FF5E00@5 · icon circle 64×64
//    #FF5E00 · "Vault Status" fs20 w700 · pill 101×23 "LEVEL 4
//    ACCESS" (bg #FF5E00, text #0B0E1A)
//  Two-Factor Auth: accent bar 4×24 #FF6B00 · title fs20 w700
//    #E5E2E1 · card 342×131 #201F1F@40 + switch 44×24 (on orange)
// ════════════════════════════════════════════════════════════════

class AccountSecurityScreen extends StatefulWidget {
  const AccountSecurityScreen({super.key});
  @override
  State<AccountSecurityScreen> createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends State<AccountSecurityScreen> {
  bool _mfaConfigured = false;
  bool _mfaLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMfaStatus();
  }

  Future<void> _loadMfaStatus() async {
    try {
      final data = await ApiService.getMfaStatus();
      final mfa = data['mfa'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _mfaConfigured = mfa?['needsFactor'] == false;
        _mfaLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _mfaLoading = false);
    }
  }

  Future<void> _openMfa() async {
    Map<String, dynamic>? status;
    try {
      final data = await ApiService.getMfaStatus();
      status = data['mfa'] as Map<String, dynamic>?;
    } catch (_) {}
    if (!mounted) return;
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) =>
          MfaEnrollmentScreen(standalone: true, mfaStatus: status),
    ));
    _loadMfaStatus();
  }

  String get _mfaSubtitle {
    if (_mfaLoading) return 'Loading…';
    return _mfaConfigured ? 'Enabled' : 'Set up';
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
          decoration: BoxDecoration(
            color: context.bg,
            border: Border(bottom: BorderSide(color: context.border, width: 1)),
          ),
          child: Row(children: [
            GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Icon(Icons.close_rounded,
                  color: context.txtPri, size: 20.w),
            ),
            Expanded(
              child: Text('Account Security',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtPri,
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

              // ── SECURITY RATING HERO ──────────────────────────────────
              Stack(children: [
                // Glow — Figma: 192×192 #22D1EE@10 right
                Positioned(
                  right: -30, top: 4,
                  child: Container(
                    width: 192.w, height: 192.h,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: kCyan.withOpacity(0.1),
                      boxShadow: [BoxShadow(
                          color: kCyan.withOpacity(0.18),
                          blurRadius: 70, spreadRadius: 14)],
                    ),
                  ),
                ),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // Label — Figma: fs12 #22D1EE
                  Text('Security Rating',
                      style: TextStyle(
                          color: kCyan, fontSize: 12.sp,
                          fontWeight: FontWeight.w400)),
                  SizedBox(height: 12.h),
                  // Title — Figma: fs32 w700, 2 lines
                  Text('YOUR ACCOUNT\nIS FORTIFIED',
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 32.sp, fontWeight: FontWeight.w700,
                          height: 1.12)),
                  SizedBox(height: 14.h),
                  // Body — Figma: fs16 #FFFFFF@50, 3 lines
                  Text(
                    'Multi-layer encryption is active. Your\ngaming assets are protected by\nGamearn Void protocols.',
                    style: TextStyle(
                        color: context.txtSec, fontSize: 16.sp,
                        fontWeight: FontWeight.w400, height: 1.4),
                  ),
                  SizedBox(height: 16.h),
                  // Updated — Figma: "Updated 2m ago" fs14 #FFFFFF@60
                  Row(children: [
                    Icon(Icons.shield_outlined,
                        color: context.txtSec, size: 14.w),
                    SizedBox(width: 6.w),
                    Text('Updated 2m ago',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 14.sp,
                            fontWeight: FontWeight.w400)),
                  ]),
                ]),
              ]),

              SizedBox(height: 32.h),

              // ── VAULT STATUS — Figma: 342×194 #FF5E00@5 pad 32 ────────
              Container(
                padding: EdgeInsets.all(32.r),
                decoration: BoxDecoration(
                  color: kOrange.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Row(children: [
                  // Icon circle — Figma: 64×64 #FF5E00
                  Container(
                    width: 64.w, height: 64.h,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: kOrange,
                      boxShadow: [BoxShadow(
                          color: kOrange.withOpacity(0.35),
                          blurRadius: 20, spreadRadius: 2)],
                    ),
                    child: Icon(Icons.verified_user_outlined,
                        color: Colors.white, size: 30.w),
                  ),
                  SizedBox(width: 18.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title — Figma: fs20 w700
                        Text('Vault Status',
                            style: TextStyle(
                                color: context.txtPri,
                                fontSize: 20.sp, fontWeight: FontWeight.w700)),
                        SizedBox(height: 12.h),
                        // Pill — Figma: 101×23 #FF5E00, text #0B0E1A
                        Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 12.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: kOrange,
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          child: Text('LEVEL 4 ACCESS',
                              style: TextStyle(
                                  color: const Color(0xFF0B0E1A),
                                  fontSize: 10.sp, fontWeight: FontWeight.w400)),
                        ),
                      ],
                    ),
                  ),
                ]),
              ),

              SizedBox(height: 32.h),

              // ── TWO-FACTOR AUTH — Figma: accent + card ───────────────
              Row(children: [
                // Accent bar — Figma: 4×24 #FF6B00
                Container(
                  width: 4.w, height: 24.h,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6B00),
                    borderRadius: BorderRadius.circular(2.r),
                  ),
                ),
                SizedBox(width: 12.w),
                Text('Two-Factor Auth',
                    style: TextStyle(
                        color: context.txtPri,
                        fontSize: 20.sp, fontWeight: FontWeight.w700)),
              ]),
              SizedBox(height: 14.h),

              // Card — Figma: 342×131 #201F1F@40, horizontal layout
              GestureDetector(
                onTap: _openMfa,
                child: Container(
                  padding: EdgeInsets.all(24.r),
                  decoration: BoxDecoration(
                    color: const Color(0x66201F1F),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Row(children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Two-Factor Authentication',
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontSize: 16.sp, fontWeight: FontWeight.w400)),
                          SizedBox(height: 8.h),
                          Text(
                            _mfaSubtitle,
                            style: TextStyle(
                                color: _mfaConfigured
                                    ? kCyan
                                    : context.txtSec,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600),
                          ),
                          SizedBox(height: 8.h),
                          Text(
                            'Secure your account with a code from your email or phone.',
                            style: TextStyle(
                                color: context.txtSec, fontSize: 12.sp,
                                fontWeight: FontWeight.w500, height: 1.4),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Icon(Icons.chevron_right_rounded,
                        color: context.txtSec, size: 22.w),
                  ]),
                ),
              ),

              SizedBox(height: 32.h),
            ],
          ),
        ),
      ]),
    ),
  );
}
