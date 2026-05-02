import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'theme.dart';
import 'screens/auth/landing_screen.dart';
import 'screens/auth/profile_setup_screen.dart';
import 'screens/shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const GamearnApp());
}

class GamearnApp extends StatelessWidget {
  const GamearnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gamearn',
      debugShowCheckedModeBanner: false,
      theme: kDarkTheme,
      home: const _AuthGate(),
    );
  }
}

/// Watches Firebase Auth state.
/// - null        → LandingScreen (splash + auth flow)
/// - logged in, no Firestore profile → ProfileSetupScreen
/// - logged in, has profile, isAdmin → AdminShell (unchanged from Phase 1)
/// - logged in, has profile, not admin → Shell (Phase 2 user app)
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (ctx, authSnap) {
        if (authSnap.connectionState == ConnectionState.waiting) {
          return const _SplashLoader();
        }

        final user = authSnap.data;
        if (user == null) return const LandingScreen();

        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .snapshots(),
          builder: (ctx, userSnap) {
            if (userSnap.connectionState == ConnectionState.waiting) {
              return const _SplashLoader();
            }

            final exists = userSnap.data?.exists ?? false;
            if (!exists) {
              // New user — needs to set up profile
              return const ProfileSetupScreen();
            }

            final data = userSnap.data!.data() as Map<String, dynamic>;
            final isAdmin = data['isAdmin'] == true;

            if (isAdmin) {
              // TODO: return const AdminShell();
              return const Shell(); // fallback to user shell for now
            }

            return const Shell();
          },
        );
      },
    );
  }
}

class _SplashLoader extends StatelessWidget {
  const _SplashLoader();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: kBgDeep,
      body: Center(
        child: CircularProgressIndicator(color: kCyan),
      ),
    );
  }
}
