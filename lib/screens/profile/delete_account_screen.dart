import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../services/api_service.dart';
import '../../theme.dart';
import '../../widgets/ga_input.dart';
import '../../widgets/ga_button.dart';
import '../auth/landing_screen.dart';

// ════════════════════════════════════════════════════════════════
//  DELETE ACCOUNT — App Store compliant in-app deletion.
//
//  Flow: 1) delete Firestore user doc (while token still valid),
//  2) call backend delete-account (removes Firebase auth + Postgres),
//  3) signOut and return to landing.
//  Requires typing "DELETE" to enable the destructive button.
// ════════════════════════════════════════════════════════════════

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});
  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final TextEditingController _confirmController = TextEditingController();
  bool _confirmMatches = false;
  bool _deleting = false;

  @override
  void dispose() {
    _confirmController.dispose();
    super.dispose();
  }

  void _onConfirmChanged(String value) {
    setState(() => _confirmMatches = value.toUpperCase() == 'DELETE');
  }

  void _showSnack(String msg, {Color? bg}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: bg ?? Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10.r)),
      ),
    );
  }

  /// Best-effort avatar cleanup — never blocks deletion.
  Future<void> _deleteAvatar(String uid) async {
    try {
      await FirebaseStorage.instance
          .ref('users/$uid/profile.jpg')
          .delete();
    } catch (_) {
      // Ignore — avatar may not exist or rules may block.
    }
  }

  Future<void> _deleteAccount() async {
    final user = FirebaseAuth.instance.currentUser;
    final uid = user?.uid;
    if (uid == null) {
      _showSnack('You are not signed in.');
      return;
    }

    setState(() => _deleting = true);
    try {
      // 1. Delete Firestore user doc FIRST while the ID token is still valid.
      //    A failure here must not block the cascade; proceed regardless.
      try {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(uid)
            .delete();
      } catch (e) {
        debugPrint('Firestore user doc delete failed: $e');
      }

      // 2. Avatar cleanup (best-effort, non-blocking).
      await _deleteAvatar(uid);

      // 3. Backend removes Firebase auth + Postgres records.
      await ApiService.deleteAccount(confirmation: 'DELETE');

      // 4. Success — sign out and return to landing.
      await FirebaseAuth.instance.signOut();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LandingScreen()),
        (r) => false,
      );
    } on ApiException catch (e) {
      // Backend rejected the delete — show error and STOP (do not sign out).
      if (!mounted) return;
      setState(() => _deleting = false);
      _showSnack(e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _deleting = false);
      _showSnack('Something went wrong. Please try again.');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: context.bg,
    body: SafeArea(
      child: Column(children: [
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
              child: Text('Delete Account',
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
              SizedBox(height: 28.h),

              // ── Warning card — red/orange accent ──────────────────────
              Container(
                padding: EdgeInsets.all(20.r),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40.w, height: 40.w,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.redAccent.withOpacity(0.15),
                      ),
                      child: Icon(Icons.warning_amber_rounded,
                          color: Colors.redAccent, size: 22.w),
                    ),
                    SizedBox(width: 14.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('This will permanently delete your account.',
                              style: TextStyle(
                                  color: context.txtPri,
                                  fontSize: 15.sp, fontWeight: FontWeight.w700)),
                          SizedBox(height: 8.h),
                          Text(
                            'Deleting your account wipes your wallet balance, '
                            'tournament history and wins. This cannot be undone. '
                            'You must have no balance remaining, or it will be '
                            'forfeited.',
                            style: TextStyle(
                                color: context.txtSec, fontSize: 13.sp,
                                fontWeight: FontWeight.w500, height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(height: 28.h),

              // ── Confirmation input ────────────────────────────────────
              GaInput(
                controller: _confirmController,
                labelText: 'Type DELETE to confirm',
                hintText: 'DELETE',
                maxLines: 1,
                onChanged: _onConfirmChanged,
              ),

              SizedBox(height: 32.h),

              // ── Destructive button ────────────────────────────────────
              GaButton.destructive(
                label: 'Delete Account',
                onPressed:
                    (!_confirmMatches || _deleting) ? null : _deleteAccount,
                isLoading: _deleting,
              ),
            ],
          ),
        ),
      ]),
    ),
  );
}