import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shadcn_flutter/shadcn_flutter.dart' as sh;

import 'theme.dart';
import 'theme/gamearn_shadcn.dart';
import 'services/sound_service.dart';
import 'services/push_service.dart';
import 'services/language_service.dart';
import 'l10n/app_localizations.dart';
import 'services/firestore_cache.dart';
import 'services/api_service.dart';
import 'services/ads_service.dart';
import 'screens/auth/landing_screen.dart';
import 'screens/auth/signup_email_otp_screen.dart';
import 'screens/auth/mfa_enrollment_screen.dart';
import 'screens/auth/profile_setup_screen.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/common/loading_screen.dart';
import 'screens/shell.dart';
import 'screens/admin/admin_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Keep a local copy of every doc/query on device so FirestoreCache can
  // serve reads from `Source.cache` (free) instead of the server (billed).
  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );
  await FirestoreCache.instance.init();

  await LanguageService.instance.init();

  // Non-critical services warm up after first paint instead of delaying launch.
  unawaited(SoundService.instance.init());
  unawaited(PushService.instance.init());

  // Ads: initialize Mobile Ads SDK and pre-load an interstitial in the
  // background so it's ready before a real-money match starts. Never blocks.
  unawaited(_initAds());
  runApp(const GamearnApp());
}

Future<void> _initAds() async {
  try {
    await AdsService.instance.init();
    await AdsService.instance.preloadInterstitial();
    await AdsService.instance.preloadRewarded();
  } catch (e) {
    debugPrint('[main] ads init skipped: $e');
  }
}

class GamearnApp extends StatefulWidget {
  const GamearnApp({super.key});

  @override
  State<GamearnApp> createState() => _GamearnAppState();
}

class _GamearnAppState extends State<GamearnApp> {
  // Show the splash on every cold start. While it plays, the splash runs
  // real bootstrap work (backend health ping, network check, ad preload) so
  // the arena is warm before gameplay begins.
  bool _showInitialSplash = true;

  @override
  void initState() {
    super.initState();
    ThemeNotifier.instance.addListener(_onThemeChanged);
    LanguageService.instance.addListener(_onLanguageChanged);
  }

  @override
  void dispose() {
    ThemeNotifier.instance.removeListener(_onThemeChanged);
    LanguageService.instance.removeListener(_onLanguageChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});
  void _onLanguageChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) => MaterialApp(
        title: 'Gamearn',
        debugShowCheckedModeBanner: false,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        locale: LanguageService.instance.locale,
        theme: kLightTheme,
        darkTheme: kDarkTheme,
        themeMode: ThemeNotifier.instance.themeMode,
        builder: (context, child) => sh.ShadcnLayer(
          theme: ThemeNotifier.instance.themeMode == ThemeMode.dark ||
                  (ThemeNotifier.instance.themeMode == ThemeMode.system &&
                      MediaQuery.platformBrightnessOf(context) ==
                          Brightness.dark)
              ? kGamearnDarkShadcnTheme
              : kGamearnLightShadcnTheme,
          child: child!,
        ),
        home: _showInitialSplash
            ? SplashScreen(
                onComplete: () => setState(() => _showInitialSplash = false))
            : const _AuthGate(),
      ),
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
          return const LoadingScreen();
        }
        final user = authSnap.data;
        if (user == null) return const LandingScreen();

        // Email/password users must verify their email before proceeding.
        // The backend also enforces this server-side on /auth/register.
        final isPasswordUser =
            user.providerData.any((p) => p.providerId == 'password');
        final email = user.email;
        if (isPasswordUser &&
            !user.emailVerified &&
            email != null &&
            email.isNotEmpty) {
          return SignupEmailOtpScreen(
            email: email,
            name: user.displayName ?? '',
            allowImmediateResend: true,
          );
        }

        return StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .snapshots(),
          builder: (ctx, userSnap) {
            if (userSnap.connectionState == ConnectionState.waiting) {
              return const LoadingScreen();
            }
            final exists = userSnap.data?.exists ?? false;
            if (!exists) return const ProfileSetupScreen();

            final data = userSnap.data!.data() as Map<String, dynamic>;
            final isAdmin = data['isAdmin'] == true;
            if (isAdmin) {
              return const AdminShell();
            }
            return const _MfaGate(child: Shell());
          },
        );
      },
    );
  }
}

class _MfaGate extends StatefulWidget {
  final Widget child;
  const _MfaGate({required this.child});

  @override
  State<_MfaGate> createState() => _MfaGateState();
}

class _MfaGateState extends State<_MfaGate> {
  bool? _needsMfa;

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      final data = await ApiService.getMfaStatus();
      final mfa = data['mfa'] as Map<String, dynamic>?;
      final needsFactor = mfa?['needsFactor'] == true;
      if (!mounted) return;
      setState(() => _needsMfa = needsFactor);
    } catch (e) {
      debugPrint('[MfaGate] status check failed, falling through: $e');
      if (!mounted) return;
      setState(() => _needsMfa = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final needs = _needsMfa;
    if (needs == null) {
      return const LoadingScreen();
    }
    if (needs) {
      return MfaEnrollmentScreen(
        standalone: false,
        onDone: _check,
      );
    }
    return widget.child;
  }
}
