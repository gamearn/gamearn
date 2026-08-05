import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import 'theme.dart';
import 'services/sound_service.dart';
import 'services/push_service.dart';
import 'screens/auth/landing_screen.dart';
import 'screens/auth/email_verify_screen.dart';
import 'screens/auth/profile_setup_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await SoundService.instance.init();
  await PushService.instance.init();
  runApp(const GamearnApp());
}

class GamearnApp extends StatefulWidget {
  const GamearnApp({super.key});

  @override
  State<GamearnApp> createState() => _GamearnAppState();
}

class _GamearnAppState extends State<GamearnApp> {
  // Only show splash on true cold start when no user is cached yet.
  // If Firebase already has a cached user, skip straight to AuthGate
  // so the user doesn't have to log in every restart.
  bool _showInitialSplash = FirebaseAuth.instance.currentUser == null;

  @override
  void initState() {
    super.initState();
    ThemeNotifier.instance.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeNotifier.instance.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gamearn',
      debugShowCheckedModeBanner: false,
      theme: kLightTheme,
      darkTheme: kDarkTheme,
      themeMode: ThemeNotifier.instance.themeMode,
      home: _showInitialSplash
          ? SplashScreen(onComplete: () => setState(() => _showInitialSplash = false))
          : const _AuthGate(),
    );
  }
}

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

        // Email/password users must verify their email before proceeding.
        // The backend also enforces this server-side on /auth/register.
        final isPasswordUser = user.providerData.any((p) => p.providerId == 'password');
        final email = user.email;
        if (isPasswordUser &&
            !user.emailVerified &&
            email != null &&
            email.isNotEmpty) {
          return EmailVerifyScreen(
            email: email,
            name: user.displayName ?? '',
          );
        }

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
            if (!exists) return const ProfileSetupScreen();

            final data = userSnap.data!.data() as Map<String, dynamic>;
            final isAdmin = data['isAdmin'] == true;
            if (isAdmin) {
              return const Shell(); // swap for AdminShell when ready
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
