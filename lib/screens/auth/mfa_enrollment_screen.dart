import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:pinput/pinput.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';
import '../../widgets/auth_background.dart';
import '../../widgets/gamearn_ui.dart';

class MfaEnrollmentScreen extends StatefulWidget {
  final Map<String, dynamic>? mfaStatus;
  final bool standalone;
  final VoidCallback? onDone;

  const MfaEnrollmentScreen({
    super.key,
    this.mfaStatus,
    this.standalone = false,
    this.onDone,
  });

  @override
  State<MfaEnrollmentScreen> createState() => _MfaEnrollmentScreenState();
}

class _MfaEnrollmentScreenState extends State<MfaEnrollmentScreen> {
  Map<String, dynamic>? _mfa;
  bool _loading = true;
  String? _error;

  // Email flow
  final _emailCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _otpFocus = FocusNode();
  bool _emailCodeSent = false;
  bool _emailVerifying = false;
  bool _emailSending = false;
  int _emailSeconds = 0;
  Timer? _emailTimer;

  // Phone flow
  final _phoneCtrl = TextEditingController();
  String _currentVerificationId = '';
  int? _resendToken;
  bool _phoneSending = false;
  bool _phoneVerifying = false;
  int _phoneSeconds = 0;
  Timer? _phoneTimer;
  final _phoneOtpCtrl = TextEditingController();
  final _phoneOtpFocus = FocusNode();

  // Social choice
  String? _chosenFactor;

  bool _done = false;

  @override
  void initState() {
    super.initState();
    if (widget.mfaStatus != null) {
      _mfa = widget.mfaStatus;
      _loading = false;
      _initFromMfa();
    } else {
      _fetchStatus();
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _otpFocus.dispose();
    _phoneCtrl.dispose();
    _phoneOtpCtrl.dispose();
    _phoneOtpFocus.dispose();
    _emailTimer?.cancel();
    _phoneTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchStatus() async {
    try {
      final data = await ApiService.getMfaStatus();
      final mfa = data['mfa'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _mfa = mfa;
        _loading = false;
      });
      _initFromMfa();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = friendlyMessage(e);
        _loading = false;
      });
    }
  }

  void _initFromMfa() {
    final mfa = _mfa;
    if (mfa == null) return;
    final factor = mfa['factor'] as String?;
    final email = mfa['mfaEmail'] as String?;
    if (factor == 'email' && email != null && email.isNotEmpty) {
      _emailCtrl.text = email;
    }
  }

  Map<String, dynamic> get _mfaData => _mfa ?? {};

  bool get _needsFactor => _mfaData['needsFactor'] == true;
  String? get _factor => _chosenFactor ?? _mfaData['factor'] as String?;
  String? get _authMethod => _mfaData['authMethod'] as String?;
  bool get _isSocial => _authMethod == 'social' && _factor == null && _chosenFactor == null;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  String _formatNigerianNumber(String raw) {
    raw = raw.replaceAll(RegExp(r'\s+'), '');
    if (raw.startsWith('0')) return '+234${raw.substring(1)}';
    if (raw.startsWith('+234')) return raw;
    return '+234$raw';
  }

  void _showSnack(String msg, {Color? color}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontWeight: FontWeight.w600)),
      backgroundColor: color ?? const Color(0xFFB3261E),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
    ));
  }

  void _startEmailTimer() {
    _emailTimer?.cancel();
    setState(() => _emailSeconds = 60);
    _emailTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_emailSeconds <= 0) {
        t.cancel();
      } else {
        setState(() => _emailSeconds--);
      }
    });
  }

  void _startPhoneTimer() {
    _phoneTimer?.cancel();
    setState(() => _phoneSeconds = 60);
    _phoneTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_phoneSeconds <= 0) {
        t.cancel();
      } else {
        setState(() => _phoneSeconds--);
      }
    });
  }

  // ── Email flow ──────────────────────────────────────────────────────────────

  Future<void> _sendEmailCode() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      _showSnack('Enter a valid email address');
      return;
    }
    setState(() => _emailSending = true);
    try {
      await ApiService.enrollMfa(factor: 'email', value: email);
      if (!mounted) return;
      setState(() {
        _emailCodeSent = true;
        _emailSending = false;
      });
      _startEmailTimer();
      _showSnack('Verification code sent!', color: kCyan);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _otpFocus.requestFocus();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _emailSending = false);
      showAppError(context, e);
    }
  }

  Future<void> _verifyEmailCode() async {
    final code = _otpCtrl.text.trim();
    if (code.length != 6) {
      _showSnack('Enter the full 6-digit code');
      return;
    }
    setState(() => _emailVerifying = true);
    try {
      await ApiService.verifyMfa(
        factor: 'email',
        email: _emailCtrl.text.trim(),
        code: code,
      );
      if (!mounted) return;
      setState(() => _done = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _emailVerifying = false);
      showAppError(context, e);
      _otpCtrl.clear();
      _otpFocus.requestFocus();
    }
  }

  // ── Phone flow ──────────────────────────────────────────────────────────────

  Future<void> _sendPhoneSms() async {
    final raw = _phoneCtrl.text.trim();
    if (raw.isEmpty) {
      _showSnack('Enter your phone number');
      return;
    }
    final formatted = _formatNigerianNumber(raw);

    setState(() => _phoneSending = true);
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: formatted,
      verificationCompleted: (PhoneAuthCredential credential) async {
        try {
          await FirebaseAuth.instance.signInWithCredential(credential);
          await _completePhoneMfa(formatted);
        } catch (e) {
          debugPrint('[MFA] Auto phone verification failed: $e');
        }
      },
      verificationFailed: (FirebaseAuthException e) {
        if (!mounted) return;
        setState(() => _phoneSending = false);
        _showSnack(e.message ?? 'Phone verification failed');
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!mounted) return;
        setState(() {
          _currentVerificationId = verificationId;
          _resendToken = resendToken;
          _phoneSending = false;
        });
        _startPhoneTimer();
        _showSnack('SMS code sent!', color: kCyan);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _phoneOtpFocus.requestFocus();
        });
      },
      codeAutoRetrievalTimeout: (_) {},
      forceResendingToken: _resendToken,
      timeout: const Duration(seconds: 60),
    );
  }

  Future<void> _verifyPhoneSms() async {
    final smsCode = _phoneOtpCtrl.text.trim();
    if (smsCode.length != 6) {
      _showSnack('Enter the full 6-digit code');
      return;
    }
    final raw = _phoneCtrl.text.trim();
    final formatted = _formatNigerianNumber(raw);

    setState(() => _phoneVerifying = true);
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _currentVerificationId,
        smsCode: smsCode,
      );

      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        setState(() => _phoneVerifying = false);
        _showSnack('Not signed in');
        return;
      }

      // Try linking phone to account. If already linked, signInWithCredential.
      try {
        await user.linkWithCredential(credential);
      } on FirebaseAuthException catch (e) {
        if (e.code == 'provider-already-linked') {
          await FirebaseAuth.instance.signInWithCredential(credential);
        } else {
          rethrow;
        }
      }

      await _completePhoneMfa(formatted);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      setState(() => _phoneVerifying = false);
      showAppError(context, e);
      _phoneOtpCtrl.clear();
      _phoneOtpFocus.requestFocus();
    }
  }

  Future<void> _completePhoneMfa(String formattedPhone) async {
    try {
      final idToken = await FirebaseAuth.instance.currentUser?.getIdToken(true);
      if (idToken == null) throw Exception('Could not get ID token');
      await ApiService.verifyMfa(
        factor: 'phone',
        phone: formattedPhone,
        idToken: idToken,
      );
      if (!mounted) return;
      setState(() => _done = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _phoneVerifying = false);
      showAppError(context, e);
    }
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: context.bg,
        body: const Center(
          child: CircularProgressIndicator(color: kCyan),
        ),
      );
    }

    if (_error != null && _mfa == null) {
      return Scaffold(
        backgroundColor: context.bg,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.w),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, color: Colors.redAccent, size: 48.w),
                  SizedBox(height: 16.h),
                  Text(_error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: context.txtSec, fontSize: 14.sp)),
                  SizedBox(height: 24.h),
                  GaButton.primary(
                    label: 'Retry',
                    onPressed: () {
                      setState(() {
                        _loading = true;
                        _error = null;
                      });
                      _fetchStatus();
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (_done || !_needsFactor) return _buildSuccess();

    if (_isSocial) return _buildSocialChoice();

    if (_factor == 'email') return _buildEmailFlow();

    return _buildPhoneFlow();
  }

  // ── Social choice picker ────────────────────────────────────────────────────

  Widget _buildSocialChoice() {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.standalone) ...[
                SizedBox(height: 12.h),
                GestureDetector(
                  onTap: () => Navigator.maybePop(context),
                  child: Icon(Icons.close_rounded, color: context.txtPri, size: 20.w),
                ),
                SizedBox(height: 16.h),
              ] else
                SizedBox(height: 32.h),
              Container(
                width: 72.w,
                height: 72.w,
                decoration: BoxDecoration(
                  color: kOrange.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.shield_outlined, color: kOrange, size: 34.w),
              ),
              SizedBox(height: 24.h),
              Text('Set Up Security',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w800)),
              SizedBox(height: 10.h),
              Text(
                'Choose how you\'d like to verify your identity for secure actions.',
                style: TextStyle(color: context.txtSec, fontSize: 14.sp),
              ),
              SizedBox(height: 32.h),
              _buildChoiceTile(
                icon: Icons.email_outlined,
                title: 'Verify with Email',
                subtitle: 'Receive a code at your email address',
                onTap: () => setState(() => _chosenFactor = 'email'),
              ),
              SizedBox(height: 12.h),
              _buildChoiceTile(
                icon: Icons.phone_outlined,
                title: 'Verify with Phone',
                subtitle: 'Receive an SMS code on your phone',
                onTap: () => setState(() => _chosenFactor = 'phone'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChoiceTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(20.r),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: context.border),
        ),
        child: Row(
          children: [
            Container(
              width: 48.w,
              height: 48.w,
              decoration: BoxDecoration(
                color: kOrange.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: kOrange, size: 24.w),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                          color: context.txtPri,
                          fontSize: 16.sp,
                          fontWeight: FontWeight.w600)),
                  SizedBox(height: 4.h),
                  Text(subtitle,
                      style: TextStyle(color: context.txtSec, fontSize: 13.sp)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: context.txtSec, size: 22.w),
          ],
        ),
      ),
    );
  }

  // ── Email OTP flow ──────────────────────────────────────────────────────────

  Widget _buildEmailFlow() {
    final defaultPinTheme = PinTheme(
      width: 48.w,
      height: 56.h,
      textStyle: TextStyle(
        fontSize: 24.sp,
        color: context.txtPri,
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: context.isDark ? kOtpBox : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border, width: 2),
      ),
    );

    return AuthBackground(
      type: AuthBackgroundType.dottedCircuit,
      opacity: 0.5,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top bar
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () {
                      if (_emailCodeSent) {
                        setState(() {
                          _emailCodeSent = false;
                          _otpCtrl.clear();
                        });
                      } else {
                        Navigator.maybePop(context);
                      }
                    },
                    child: Icon(Icons.arrow_back_rounded,
                        color: context.txtPri, size: 22.w),
                  ),
                ),
                SizedBox(height: 24.h),
                // Hero
                Container(
                  width: 80.w,
                  height: 80.w,
                  decoration: BoxDecoration(
                    color: kOrange.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _emailCodeSent ? Icons.mark_email_read_outlined : Icons.email_outlined,
                    color: kOrange,
                    size: 34.w,
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  _emailCodeSent ? 'Enter Code' : 'Verify Email',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.8),
                ),
                SizedBox(height: 12.h),
                Text(
                  _emailCodeSent
                      ? 'Enter the 6-digit code sent to\n${_emailCtrl.text.trim()}'
                      : 'We\'ll send a verification code to\nyour email address.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtSec,
                      fontSize: 14.sp,
                      height: 1.5),
                ),
                SizedBox(height: 32.h),

                if (!_emailCodeSent) ...[
                  GaInput(
                    controller: _emailCtrl,
                    labelText: 'Email Address',
                    hintText: 'name@example.com',
                    keyboardType: TextInputType.emailAddress,
                    enabled: !_emailCodeSent,
                  ),
                  SizedBox(height: 24.h),
                  GaButton.primary(
                    label: 'Send Code',
                    isLoading: _emailSending,
                    onPressed: _sendEmailCode,
                  ),
                ] else ...[
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Pinput(
                      length: 6,
                      controller: _otpCtrl,
                      focusNode: _otpFocus,
                      separatorBuilder: (_) => SizedBox(width: 12.w),
                      defaultPinTheme: defaultPinTheme,
                      focusedPinTheme: defaultPinTheme.copyWith(
                        decoration: defaultPinTheme.decoration!.copyWith(
                          border: Border.all(color: kCyan, width: 2),
                        ),
                      ),
                      onCompleted: (_) => _verifyEmailCode(),
                    ),
                  ),
                  SizedBox(height: 20.h),
                  if (_emailSeconds > 0)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                      decoration: BoxDecoration(
                        color: context.isDark
                            ? const Color(0x801A2238)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(9999.r),
                        border: Border.all(color: context.border),
                      ),
                      child: Text(
                        '${(_emailSeconds ~/ 60).toString().padLeft(2, '0')}:${(_emailSeconds % 60).toString().padLeft(2, '0')}',
                        style: TextStyle(
                            color: context.txtPri,
                            fontWeight: FontWeight.w600,
                            fontSize: 14.sp),
                      ),
                    )
                  else
                    GestureDetector(
                      onTap: _sendEmailCode,
                      child: Text('Resend Code',
                          style: TextStyle(
                              color: kCyan,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600)),
                    ),
                  SizedBox(height: 24.h),
                  GaButton.primary(
                    label: 'Verify',
                    isLoading: _emailVerifying,
                    onPressed: _verifyEmailCode,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Phone Firebase OTP flow ─────────────────────────────────────────────────

  Widget _buildPhoneFlow() {
    final defaultPinTheme = PinTheme(
      width: 48.w,
      height: 56.h,
      textStyle: TextStyle(
        fontSize: 24.sp,
        color: context.txtPri,
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: context.isDark ? kOtpBox : Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: context.border, width: 2),
      ),
    );

    final codeSent = _currentVerificationId.isNotEmpty;

    return AuthBackground(
      type: AuthBackgroundType.dottedCircuit,
      opacity: 0.5,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 24.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Top bar
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () {
                      if (codeSent) {
                        setState(() {
                          _currentVerificationId = '';
                          _phoneOtpCtrl.clear();
                        });
                      } else {
                        Navigator.maybePop(context);
                      }
                    },
                    child: Icon(Icons.arrow_back_rounded,
                        color: context.txtPri, size: 22.w),
                  ),
                ),
                SizedBox(height: 24.h),
                // Hero
                Container(
                  width: 80.w,
                  height: 80.w,
                  decoration: BoxDecoration(
                    color: kOrange.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    codeSent ? Icons.sms_outlined : Icons.phone_outlined,
                    color: kOrange,
                    size: 34.w,
                  ),
                ),
                SizedBox(height: 16.h),
                Text(
                  codeSent ? 'Enter SMS Code' : 'Verify Phone',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.8),
                ),
                SizedBox(height: 12.h),
                Text(
                  codeSent
                      ? 'Enter the 6-digit code sent to\n${_formatNigerianNumber(_phoneCtrl.text.trim())}'
                      : 'We\'ll send an SMS verification code\nto your phone number.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: context.txtSec,
                      fontSize: 14.sp,
                      height: 1.5),
                ),
                SizedBox(height: 32.h),

                if (!codeSent) ...[
                  Row(children: [
                    Container(
                      width: 63.w,
                      height: 56.h,
                      decoration: BoxDecoration(
                        color: context.isDark
                            ? const Color(0x800F172A)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(12.r),
                        border: Border.all(color: context.border),
                      ),
                      alignment: Alignment.center,
                      child: Text('+234',
                          style: TextStyle(
                              color: context.txtSec, fontSize: 16.sp)),
                    ),
                    SizedBox(width: 8.w),
                    Expanded(
                      child: GaInput(
                        controller: _phoneCtrl,
                        hintText: '801 234 5678',
                        keyboardType: TextInputType.phone,
                      ),
                    ),
                  ]),
                  SizedBox(height: 24.h),
                  GaButton.primary(
                    label: 'Send SMS Code',
                    isLoading: _phoneSending,
                    onPressed: _sendPhoneSms,
                  ),
                ] else ...[
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Pinput(
                      length: 6,
                      controller: _phoneOtpCtrl,
                      focusNode: _phoneOtpFocus,
                      separatorBuilder: (_) => SizedBox(width: 12.w),
                      defaultPinTheme: defaultPinTheme,
                      focusedPinTheme: defaultPinTheme.copyWith(
                        decoration: defaultPinTheme.decoration!.copyWith(
                          border: Border.all(color: kCyan, width: 2),
                        ),
                      ),
                      onCompleted: (_) => _verifyPhoneSms(),
                    ),
                  ),
                  SizedBox(height: 20.h),
                  if (_phoneSeconds > 0)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                      decoration: BoxDecoration(
                        color: context.isDark
                            ? const Color(0x801A2238)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(9999.r),
                        border: Border.all(color: context.border),
                      ),
                      child: Text(
                        '${(_phoneSeconds ~/ 60).toString().padLeft(2, '0')}:${(_phoneSeconds % 60).toString().padLeft(2, '0')}',
                        style: TextStyle(
                            color: context.txtPri,
                            fontWeight: FontWeight.w600,
                            fontSize: 14.sp),
                      ),
                    )
                  else
                    GestureDetector(
                      onTap: _sendPhoneSms,
                      child: Text('Resend Code',
                          style: TextStyle(
                              color: kCyan,
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600)),
                    ),
                  SizedBox(height: 24.h),
                  GaButton.primary(
                    label: 'Verify',
                    isLoading: _phoneVerifying,
                    onPressed: _verifyPhoneSms,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────

  Widget _buildSuccess() {
    final configured = !_needsFactor;
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                width: 88.w,
                height: 88.w,
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.check_circle_outline,
                    color: const Color(0xFF22C55E), size: 44.w),
              ),
              SizedBox(height: 24.h),
              Text('Security Configured',
                  style: TextStyle(
                      color: context.txtPri,
                      fontSize: 24.sp,
                      fontWeight: FontWeight.w700)),
              SizedBox(height: 12.h),
              Text(
                configured
                    ? 'Your account is already protected by a second factor.'
                    : 'Your second factor is now set up. Your account is protected.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: context.txtSec, fontSize: 14.sp, height: 1.5),
              ),
              const Spacer(),
              GaButton.primary(
                label: 'Done',
                onPressed: _handleDone,
              ),
              SizedBox(height: 24.h),
            ],
          ),
        ),
      ),
    );
  }

  void _handleDone() {
    final cb = widget.onDone;
    if (cb != null) {
      cb();
      return;
    }
    if (widget.standalone) {
      Navigator.maybePop(context);
    } else {
      Navigator.of(context).popUntil((r) => r.isFirst);
    }
  }
}
