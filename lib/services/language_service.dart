import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Application language codes supported by Gamearn.
class AppLanguage {
  static const String english = 'en';
  static const String french = 'fr';
  static const String spanish = 'es';

  static const List<String> supported = [english, french, spanish];

  static String displayName(String code) {
    switch (code) {
      case english:
        return 'English (US)';
      case french:
        return 'Français';
      case spanish:
        return 'Español';
      default:
        return 'English (US)';
    }
  }

  static const String prefsKey = 'app_language';
}

/// Singleton that owns the currently selected [Locale]. Mirrors the
/// [SoundService] singleton pattern. Changing the locale notifies listeners so
/// the root [MaterialApp] rebuilds with the new language.
class LanguageService {
  LanguageService._();
  static final LanguageService instance = LanguageService._();

  Locale _locale = const Locale(AppLanguage.english);
  Locale get locale => _locale;
  String get languageCode => _locale.languageCode;

  final List<VoidCallback> _listeners = [];

  /// Apply a stored language (call once at app start).
  Future<void> init() async {
    final sp = await SharedPreferences.getInstance();
    final code = sp.getString(AppLanguage.prefsKey);
    final resolved = _resolve(code);
    if (resolved != null) _locale = resolved;
  }

  /// Switch the active language and broadcast the change to listeners.
  Future<void> setLanguage(String code) async {
    final resolved = _resolve(code);
    if (resolved == null) return;
    _locale = resolved;
    final sp = await SharedPreferences.getInstance();
    await sp.setString(AppLanguage.prefsKey, resolved.languageCode);
    for (final cb in List.of(_listeners)) {
      cb();
    }
  }

  Locale? _resolve(String? code) {
    if (AppLanguage.supported.contains(code)) return Locale(code!);
    return null;
  }

  void addListener(VoidCallback callback) => _listeners.add(callback);
  void removeListener(VoidCallback callback) => _listeners.remove(callback);
}
