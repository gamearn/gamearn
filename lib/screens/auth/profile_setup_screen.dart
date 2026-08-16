import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl_phone_number_input/intl_phone_number_input.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../services/api_service.dart';
import '../../services/avatar_pipeline.dart';
import '../../services/firestore_cache.dart';
import '../../services/geo_service.dart';
import '../../services/profile_cooldown_manager.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _usernameCtrl = TextEditingController();
  final _bioCtrl      = TextEditingController();
  final _phoneCtrl    = TextEditingController();
  String  _phoneIso = 'NG';
  PhoneNumber? _parsedPhone;
  bool _phoneValid = false;
  bool _phoneUserTyped = false;
  int   _selectedAvatar = 0;
  bool _loading = false;
  bool _usernameAvailable = false;
  bool _checkingUsername = false;
  String? _usernameError;
  Timer? _debounceTimer;
  String? _customAvatarUrl;
  bool _uploadingAvatar = false;
  int _cooldownHours = 0;

  @override
  void initState() {
    super.initState();
    final fbPhone = FirebaseAuth.instance.currentUser?.phoneNumber;
    if (fbPhone != null && fbPhone.isNotEmpty) {
      // Phone auth — prefill the verified number, resolve its region.
      _resolveRegionFor(fbPhone);
      _phoneCtrl.text = fbPhone;
    } else {
      // Email/social auth — default NG, refine via IP when it resolves.
      _prefillFromIp();
    }
    _refreshCooldown();
  }

  Future<void> _resolveRegionFor(String phone) async {
    try {
      final parsed =
          await PhoneNumber.getRegionInfoFromPhoneNumber(phone, 'NG');
      if (!mounted || parsed.isoCode == null) return;
      setState(() => _phoneIso = parsed.isoCode!);
    } catch (_) {
      // Unknown region — keep the current default.
    }
  }

  Future<void> _prefillFromIp() async {
    final iso = await GeoCountryService.getCountryIso();
    if (!mounted || iso == null) return;
    // Only apply while the user hasn't started typing.
    if (!_phoneUserTyped && iso != _phoneIso) {
      setState(() => _phoneIso = iso);
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _bioCtrl.dispose();
    _phoneCtrl.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkUsernameAvailability(String username) async {
    if (username.length < 4) {
      setState(() {
        _usernameAvailable = false;
        _usernameError = 'Minimum 4 characters';
      });
      return;
    }

    setState(() {
      _checkingUsername = true;
      _usernameError = null;
    });

    try {
      final query = await FirebaseFirestore.instance
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();

      setState(() {
        _usernameAvailable = query.docs.isEmpty;
        if (!_usernameAvailable) {
          _usernameError = 'This username is already taken';
        }
      });
    } catch (e) {
      debugPrint('Error checking username: $e');
    } finally {
      setState(() => _checkingUsername = false);
    }
  }

  bool get _isCustomAvatar => _customAvatarUrl != null;

  /// The server-stamped upload timestamp from upload_cooldowns/{uid}.
  ///
  /// This record is written ONLY by the Cloud Function
  /// (enforceAvatarCooldown) on Storage finalize, so it is always truthful —
  /// a client can neither skip nor fake it. Short TTL so the UI lock clears
  /// promptly once the 24h window actually expires (server enforcement is
  /// authoritative either way).
  Future<DateTime?> _lastProfileUpload() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return null;
    final data = await FirestoreCache.instance.doc(
      'upload_cooldowns',
      uid,
      ttl: const Duration(minutes: 1),
    );
    final stamp = data['lastProfileUpload'];
    if (stamp == null) return null;
    if (stamp is Timestamp) return stamp.toDate();
    if (stamp is DateTime) return stamp;
    return null;
  }

  /// Syncs the button-gating cooldown (spec §5 state machine).
  Future<void> _refreshCooldown() async {
    final remaining = ProfileCooldownManager.evaluateRemainingHours(
        await _lastProfileUpload());
    if (!mounted || remaining == _cooldownHours) return;
    setState(() => _cooldownHours = remaining);
  }

  Future<void> _pickAvatar() async {
    if (_uploadingAvatar || _cooldownHours > 0) return;

    // Pick → compress (< 150 KB) → upload direct to Firebase Storage. The 24h
    // / one-per-day limit is enforced server-side by the Storage rules, which
    // read upload_cooldowns/{uid}.lastProfileUpload — a record written only by
    // the Cloud Function (on Storage finalize), never by this client.
    final processed = await AvatarExecutionPipeline.pickAndProcessImage();
    if (processed == null || !mounted) return;

    setState(() => _uploadingAvatar = true);
    final uid = FirebaseAuth.instance.currentUser?.uid ?? 'anon';
    try {
      final committed = await AvatarExecutionPipeline.commitAvatarMutation(
        imageFile: processed,
        targetUserId: uid,
      );
      if (!mounted) return;

      if (!committed) {
        // Storage rules rejected the write (403/429) — almost always the 24h
        // cooldown. Surface the lock with a countdown.
        setState(() => _uploadingAvatar = false);
        FirestoreCache.instance.invalidate('upload_cooldowns/$uid');
        final remaining = ProfileCooldownManager.evaluateRemainingHours(
            await _lastProfileUpload());
        if (remaining > 0) {
          showAppError(
            context,
            ApiException(
              code: 'RATE_LIMITED',
              message:
                  'Avatar locked. You can change it again in $remaining hour(s).',
            ),
          );
        } else {
          showAppError(
            context,
            ApiException(
              code: 'UPLOAD_ERROR',
              message:
                  'That image was rejected. Keep it under 150 KB and try again.',
            ),
          );
        }
        return;
      }

      // Reuse the fixed overwrite path the rules gate on for the preview URL.
      final url = await FirebaseStorage.instance
          .ref('users/$uid/profile.jpg')
          .getDownloadURL();
      // The function's server stamp may lag the upload by a moment, so lock
      // the button immediately instead of trusting a possibly-stale read.
      // The stamp (and the server-side 24h window) is authoritative regardless.
      FirestoreCache.instance.invalidate('upload_cooldowns/$uid');
      FirestoreCache.instance.invalidate('users/$uid');
      if (!mounted) return;
      setState(() {
        _customAvatarUrl = url;
        _cooldownHours = 24;
        _uploadingAvatar = false;
      });
    } catch (e) {
      debugPrint('Avatar upload failed: $e');
      if (!mounted) return;
      setState(() => _uploadingAvatar = false);
      showAppError(
        context,
        ApiException(
          code: 'UPLOAD_ERROR',
          message: 'Could not upload that image. Please try again.',
        ),
      );
    }
  }

  Future<void> _save() async {
    // Phone is format-agnostic — any of +234..., 234..., 08..., 8... resolves.
    final parsed = _parsedPhone;
    final phone = (parsed != null && (parsed.phoneNumber ?? '').isNotEmpty)
        ? parsed.phoneNumber!
        : _phoneCtrl.text.trim();
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 7 || digits.length > 15) {
      showAppError(
        context,
        ApiException(
          code: 'VALIDATION_ERROR',
          message:
              'Enter a valid phone number, e.g. +234 803 123 4567 or 0803 123 4567.',
        ),
      );
      return;
    }

    final username = _usernameCtrl.text.trim();
    if (username.isEmpty) {
      showAppError(context,
          ApiException(code: 'VALIDATION_ERROR', message: 'Please enter a username to continue.'));
      return;
    }
    if (username.length < 4) {
      showAppError(context,
          ApiException(code: 'VALIDATION_ERROR', message: 'Username must be at least 4 characters.'));
      return;
    }
    if (!_usernameAvailable) {
      if (_usernameError == null) {
        await _checkUsernameAvailability(username);
        if (!mounted) return;
      }
      if (!_usernameAvailable) {
        showAppError(context,
            ApiException(code: 'VALIDATION_ERROR', message: _usernameError ?? 'That username is not available.'));
        return;
      }
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      // Register in the Postgres backend (creates the users row + wallet).
      // Required for push notifications and matchmaking lookups. Idempotent.
      try {
        await ApiService.registerBackendUser(
          phoneNumber: phone,
          displayName: username,
        );
      } on ApiException catch (e) {
        if (e.code != 'CONFLICT') rethrow; // already registered → proceed
      }

      final avatar = _isCustomAvatar
          ? 'Custom'
          : kAvatars[_selectedAvatar]['name'];
      final userData = <String, dynamic>{
        'username'    : username,
        'bio'         : _bioCtrl.text.trim(),
        'avatar'      : avatar,
        'avatarUrl'   : _customAvatarUrl,
        'email'       : user.email,
        'phoneNumber' : phone,
        'isAdmin'     : false,
        'isActive'    : true,
        'memberStatus': 'Active Member',
        'gamesPlayed' : 0,
        'wins'        : 0,
        'followers'   : 0,
        'following'   : 0,
        'dayStreak'   : 0,
        'totalPoints' : 0,
        'regionRank'  : 0,
        'globalRank'  : 0,
        'isPremium'   : false,
        'createdAt'   : FieldValue.serverTimestamp(),
      };
      if (_isCustomAvatar) {
        // Spec schema pointer to the direct-to-Firebase object. The 24h
        // cooldown itself is NOT stored here — the Cloud Function stamps it
        // server-side at upload_cooldowns/{uid} (this field is display-only).
        userData['profilePicUrl'] = _customAvatarUrl;
      }
      await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .set(userData);

      // Create wallet
      await FirebaseFirestore.instance
          .collection('wallets')
          .doc(user.uid)
          .set({
        'balance'    : 0,
        'units'      : 0,
        'usdEquiv'   : 0.0,
        'streakDays' : 0,
        'level'      : 1,
        'createdAt'  : FieldValue.serverTimestamp(),
      });

      // AuthGate swaps the home widget to Shell once the Firestore doc emits,
      // but this screen may have been pushed on top of it (email flow via
      // pushAndRemoveUntil), so pop back to the root route to reveal it.
      FirestoreCache.instance.invalidate('users/${user.uid}');
      FirestoreCache.instance.invalidate('wallets/${user.uid}');
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
    } catch (e) {
      _handleSaveFailure(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _handleSaveFailure(Object e) {
    if (!mounted) return;
    showAppError(
      context,
      e,
      onRetry: isRetryable(e) ? _save : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 32.h),

              // Avatar preview + change button
              Center(
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: (_uploadingAvatar || _cooldownHours > 0)
                          ? null
                          : _pickAvatar,
                      child: Stack(
                        children: [
                          Container(
                            width: 144.w,
                            height: 144.h,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: kOrange.withOpacity(0.1),
                              border: Border.all(
                                  color: kOrange.withOpacity(0.2)),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(8.r),
                              child: Container(
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: context.card,
                                  border: Border.all(color: kOrange),
                                ),
                                child: _isCustomAvatar
                                    ? CachedNetworkImage(
                                        imageUrl: _customAvatarUrl!,
                                        fit: BoxFit.cover,
                                        placeholder: (_, __) =>
                                            const ColoredBox(color: kBgCard),
                                        errorWidget: (_, __, ___) => Center(
                                          child: Text(
                                            kAvatars[_selectedAvatar]
                                                ['emoji']!,
                                            style: TextStyle(
                                                fontSize: 56.sp),
                                          ),
                                        ),
                                      )
                                    : Center(
                                        child: Text(
                                          kAvatars[_selectedAvatar]
                                              ['emoji']!,
                                          style: TextStyle(
                                              fontSize: 56.sp, height: 1),
                                        ),
                                      ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 41.w,
                              height: 39.h,
                              decoration: const BoxDecoration(
                                color: kOrange,
                                shape: BoxShape.circle,
                              ),
                              child: _uploadingAvatar
                                  ? Padding(
                                      padding: EdgeInsets.all(10.r),
                                      child: const CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2),
                                    )
                                  : Icon(Icons.camera_alt,
                                      color: Colors.white, size: 17.w),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16.h),
                    SizedBox(
                      width: 124.w,
                      height: 40.h,
                      child: ElevatedButton(
                        onPressed: (_uploadingAvatar || _cooldownHours > 0)
                            ? null
                            : _pickAvatar,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kOrange,
                          disabledBackgroundColor: const Color(0xFF334155),
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r)),
                        ),
                        child: Text(
                            _cooldownHours > 0
                                ? 'Locked · ${_cooldownHours}h'
                                : 'Change',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16.sp,
                                fontWeight: FontWeight.w400)),
                      ),
                    ),
                    if (_cooldownHours > 0) ...[
                      SizedBox(height: 8.h),
                      Text(
                        'Avatar locked — retry in ${_cooldownHours} hour(s)',
                        style: TextStyle(
                            color: context.txtSec, fontSize: 12.sp),
                      ),
                    ],
                  ],
                ),
              ),
              SizedBox(height: 28.h),

              // Avatar picker
              Text('Choose an Avatar',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp)),
              SizedBox(height: 12.h),
              SizedBox(
                height: 112.h,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: kAvatars.length + 1,
                  itemBuilder: (_, i) {
                    // ── Custom upload tile ──
                    if (i == kAvatars.length) {
                      final isSelected = _isCustomAvatar;
                      return GestureDetector(
                        onTap: (_uploadingAvatar || _cooldownHours > 0)
                            ? null
                            : _pickAvatar,
                        child: Padding(
                          padding: EdgeInsets.only(right: 14.w),
                          child: Column(
                            children: [
                              Container(
                                width: 80.w,
                                height: 80.h,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: isSelected
                                          ? kOrange
                                          : const Color(0xFF334155),
                                      width: 2.5),
                                  color: context.card,
                                ),
                                child: _uploadingAvatar
                                    ? Padding(
                                        padding: EdgeInsets.all(24.r),
                                        child: const CircularProgressIndicator(
                                            color: kOrange,
                                            strokeWidth: 2),
                                      )
                                    : Icon(Icons.add_a_photo_outlined,
                                        color: const Color(0xFF64748B), size: 28.w),
                              ),
                              SizedBox(height: 4.h),
                              Text('Upload',
                                  style: TextStyle(
                                    color: isSelected
                                        ? kOrange
                                        : context.txtSec,
                                    fontSize: 12.sp,
                                    fontWeight: FontWeight.w600,
                                  )),
                            ],
                          ),
                        ),
                      );
                    }
                    final selected =
                        i == _selectedAvatar && !_isCustomAvatar;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _selectedAvatar = i;
                        _customAvatarUrl = null;
                      }),
                      child: Padding(
                        padding: EdgeInsets.only(right: 14.w),
                        child: Column(
                          children: [
                            Container(
                              width: 80.w,
                              height: 80.h,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: selected
                                        ? kOrange
                                        : Colors.transparent,
                                    width: 2.5),
                                color: context.card,
                              ),
                              child: Center(
                                child: Text(
                                  kAvatars[i]['emoji']!,
                                  style: TextStyle(fontSize: 36.sp),
                                ),
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              kAvatars[i]['name']!,
                              style: TextStyle(
                                color: selected ? kOrange : context.txtSec,
                                fontSize: 12.sp,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              SizedBox(height: 24.h),

              // Username
              Text('Username',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp)),
              SizedBox(height: 8.h),
              TextField(
                controller: _usernameCtrl,
                style: TextStyle(color: context.txtPri),
                onChanged: (v) {
                  setState(() {
                    _usernameAvailable = false;
                    _usernameError = null;
                  });
                  _debounceTimer?.cancel();
                  _debounceTimer = Timer(const Duration(milliseconds: 600), () {
                    if (v.isNotEmpty) _checkUsernameAvailability(v.trim());
                  });
                },
                decoration: InputDecoration(
                  hintText: 'GamerOne',
                  hintStyle: TextStyle(color: context.txtSec),
                  filled: true,
                  fillColor: context.card,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kCyan, width: 1.5),
                  ),
                  suffixIcon: _checkingUsername
                      ? Padding(
                          padding: EdgeInsets.all(12.r),
                          child: SizedBox(
                              width: 16.w,
                              height: 16.h,
                              child: const CircularProgressIndicator(
                                  strokeWidth: 2, color: kOrange)))
                      : _usernameAvailable
                          ? Icon(Icons.check_circle,
                              color: const Color(0xFF22C55E), size: 22.w)
                          : _usernameError != null
                              ? Icon(Icons.error_outline,
                                  color: Colors.redAccent, size: 22.w)
                              : null,
                  contentPadding: EdgeInsets.symmetric(
                      horizontal: 16.w, vertical: 14.h),
                ),
              ),
              if (_usernameAvailable)
                Padding(
                  padding: EdgeInsets.only(top: 6.h),
                  child: Text('Username is available!',
                      style: TextStyle(
                          color: const Color(0xFF22C55E),
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600)),
                )
              else if (_usernameError != null)
                Padding(
                  padding: EdgeInsets.only(top: 6.h),
                  child: Text(_usernameError!,
                      style: TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12.sp,
                          fontWeight: FontWeight.w600)),
                ),
              SizedBox(height: 20.h),

              // Phone number (format-agnostic — resolved to +E.164)
              Text('Phone Number',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp)),
              SizedBox(height: 8.h),
              InternationalPhoneNumberInput(
                key: ValueKey('phone-$_phoneIso'),
                textFieldController: _phoneCtrl,
                initialValue: PhoneNumber(isoCode: _phoneIso),
                onInputChanged: (PhoneNumber number) {
                  setState(() {
                    _parsedPhone = number;
                    _phoneValid = _phoneValid ||
                        (number.phoneNumber ?? '').isNotEmpty;
                  });
                },
                onInputValidated: (bool isValid) {
                  _phoneValid = isValid;
                  _phoneUserTyped = true;
                },
                onFieldSubmitted: (_) => _phoneUserTyped = true,
                ignoreBlank: false,
                autoValidateMode: AutovalidateMode.disabled,
                selectorConfig: const SelectorConfig(
                  selectorType: PhoneInputSelectorType.BOTTOM_SHEET,
                ),
                selectorTextStyle: TextStyle(
                    color: context.txtPri, fontWeight: FontWeight.w600),
                textStyle: TextStyle(color: context.txtPri, fontSize: 15.sp),
                inputDecoration: InputDecoration(
                  hintText: '803 123 4567',
                  hintStyle: TextStyle(color: context.txtSec, fontSize: 13.sp),
                  filled: true,
                  fillColor: context.card,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kCyan, width: 1.5),
                  ),
                  contentPadding: EdgeInsets.symmetric(
                      horizontal: 12.w, vertical: 14.h),
                ),
              ),
              SizedBox(height: 20.h),

              // Bio & Tags
              Text('Bio & Tags',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16.sp)),
              SizedBox(height: 8.h),
              TextField(
                controller: _bioCtrl,
                maxLines: 4,
                style: TextStyle(color: context.txtPri),
                decoration: InputDecoration(
                  hintText:
                      'Tell the world your gaming style... (e.g. Ayo Pro, Ludo King, Daily Grinder)',
                  hintStyle: TextStyle(color: context.txtSec, fontSize: 13.sp),
                  filled: true,
                  fillColor: context.card,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: kCyan, width: 1.5),
                  ),
                  contentPadding: EdgeInsets.all(16.r),
                ),
              ),
              SizedBox(height: 32.h),

              // Get Started
              SizedBox(
                width: double.infinity,
                height: 54.h,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kOrange,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12.r)),
                  ),
                  child: _loading
                      ? SizedBox(
                          width: 22.w,
                          height: 22.h,
                          child: const CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Get Started',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16.sp)),
                            SizedBox(width: 8.w),
                            Icon(Icons.rocket_launch,
                                color: Colors.white, size: 18.w),
                          ],
                        ),
                ),
              ),
              SizedBox(height: 14.h),

              // Skip
              Center(
                child: TextButton(
                  onPressed: _loading ? null : _save, // same action, just skips bio
                  child:               Text('Skip for now',
                      style: TextStyle(color: context.txtSec)),
                ),
              ),
              SizedBox(height: 32.h),
            ],
          ),
        ),
      ),
    );
  }
}
