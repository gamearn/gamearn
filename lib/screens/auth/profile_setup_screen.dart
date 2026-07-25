import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _usernameCtrl = TextEditingController();
  final _bioCtrl      = TextEditingController();
  int   _selectedAvatar = 0;
  bool _loading = false;
  bool _usernameAvailable = false;
  bool _checkingUsername = false;
  String? _usernameError;
  Timer? _debounceTimer;

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _bioCtrl.dispose();
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

  Future<void> _save() async {
    if (_usernameCtrl.text.trim().isEmpty || !_usernameAvailable) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      final avatar = kAvatars[_selectedAvatar];
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'username'    : _usernameCtrl.text.trim(),
        'bio'         : _bioCtrl.text.trim(),
        'avatar'      : avatar['name'],
        'email'       : user.email,
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
      });

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

      // AuthGate will auto-navigate to Shell
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),

              // Avatar preview + change button
              Center(
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: kOrange, width: 3),
                            color: context.card,
                          ),
                          child: Center(
                            child: Text(
                              kAvatars[_selectedAvatar]['emoji']!,
                              style: const TextStyle(fontSize: 48),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              color: kOrange,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt,
                                color: Colors.white, size: 16),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kOrange,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 8),
                      ),
                      child: const Text('Change',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Avatar picker
              Text('Choose an Avatar',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
              const SizedBox(height: 12),
              SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: kAvatars.length,
                  itemBuilder: (_, i) {
                    final selected = i == _selectedAvatar;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedAvatar = i),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 14),
                        child: Column(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: selected ? kOrange : Colors.transparent,
                                    width: 2.5),
                                color: context.card,
                              ),
                              child: Center(
                                child: Text(
                                  kAvatars[i]['emoji']!,
                                  style: const TextStyle(fontSize: 28),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              kAvatars[i]['name']!,
                              style: TextStyle(
                                color: selected ? kOrange : context.txtSec,
                                fontSize: 11,
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
              const SizedBox(height: 24),

              // Username
              Text('Username',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
              const SizedBox(height: 8),
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
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  suffixIcon: _checkingUsername
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: kOrange)))
                      : _usernameAvailable
                          ? const Icon(Icons.check_circle,
                              color: Color(0xFF00E676), size: 22)
                          : _usernameError != null
                              ? const Icon(Icons.error_outline,
                                  color: Colors.redAccent, size: 22)
                              : null,
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                ),
              ),
              if (_usernameAvailable)
                const Padding(
                  padding: EdgeInsets.only(top: 6),
                  child: Text('Username is available!',
                      style: TextStyle(
                          color: Color(0xFF00E676),
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                )
              else if (_usernameError != null)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(_usernameError!,
                      style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ),
              const SizedBox(height: 20),

              // Bio & Tags
              Text('Bio & Tags',
                  style: TextStyle(
                      color: context.txtPri,
                      fontWeight: FontWeight.w700,
                      fontSize: 16)),
              const SizedBox(height: 8),
              TextField(
                controller: _bioCtrl,
                maxLines: 4,
                style: TextStyle(color: context.txtPri),
                decoration: InputDecoration(
                  hintText:
                      'Tell the world your gaming style... (e.g. Ayo Pro, Ludo King, Daily Grinder)',
                  hintStyle: TextStyle(color: context.txtSec, fontSize: 13),
                  filled: true,
                  fillColor: context.card,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.all(16),
                ),
              ),
              const SizedBox(height: 32),

              // Get Started
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kOrange,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Get Started',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16)),
                            SizedBox(width: 8),
                            Icon(Icons.rocket_launch,
                                color: Colors.white, size: 18),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 14),

              // Skip
              Center(
                child: TextButton(
                  onPressed: _loading ? null : _save, // same action, just skips bio
                  child:               Text('Skip for now',
                      style: TextStyle(color: context.txtSec)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
