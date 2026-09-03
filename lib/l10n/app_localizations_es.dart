// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appName => 'Gamearn';

  @override
  String get appTagline => 'Juega. Gana. Compite.';

  @override
  String get appTitle => 'Gamearn';

  @override
  String get secByGamearn => 'Protegido por Gamearn';

  @override
  String get premiumVersion => 'GAMEARN Premium v2.4.1';

  @override
  String get navHome => 'Inicio';

  @override
  String get navGames => 'Juegos';

  @override
  String get navWallet => 'Billetera';

  @override
  String get navProfile => 'Perfil';

  @override
  String get settingsTitle => 'Configuración y Preferencias';

  @override
  String get settingsSoundVibration => 'Sonido y Vibración';

  @override
  String get settingsSoundEffects => 'Efectos de sonido';

  @override
  String get settingsVibration => 'Vibración';

  @override
  String get settingsAccountSecurity => 'Cuenta y Seguridad';

  @override
  String get settingsAccountSecurityTile => 'Seguridad de la cuenta';

  @override
  String get settingsAccountSecuritySub => 'Contraseña, 2FA y sesiones';

  @override
  String get settingsPayoutMethods => 'Métodos de pago';

  @override
  String get settingsPayoutMethodsSub => 'Cuentas bancarias y billeteras';

  @override
  String get settingsGamePrefs => 'Preferencias de juego';

  @override
  String get settingsThemePreference => 'Preferencia de tema';

  @override
  String get settingsThemePreferenceSub => 'Modo oscuro y claro';

  @override
  String get settingsEmailAlerts => 'Alertas por correo';

  @override
  String get settingsEmailAlertsSub => 'Resumen semanal de recompensas';

  @override
  String get settingsSoundVibrationSub => 'Efectos de juego y hápticos';

  @override
  String get settingsLanguage => 'Idioma';

  @override
  String get settingsLanguageSubEnglish => 'Español (ES)';

  @override
  String get settingsPrivacySecurity => 'Privacidad y Seguridad';

  @override
  String get settingsPrivacySecuritySub =>
      'Actualización de seguridad del juego';

  @override
  String get settingsHelpSupport => 'Ayuda y Soporte';

  @override
  String get settingsHelpSupportSub => 'Obtener información importante';

  @override
  String get settingsLegal => 'Legal';

  @override
  String get settingsTerms => 'Términos y Condiciones';

  @override
  String get settingsTermsSub => 'Reglas para usar Gamearn';

  @override
  String get settingsPrivacyPolicy => 'Política de Privacidad';

  @override
  String get settingsPrivacyPolicySub => 'Cómo manejamos tus datos';

  @override
  String get settingsDangerZone => 'Zona de peligro';

  @override
  String get settingsDeleteAccount => 'Eliminar cuenta';

  @override
  String get settingsDeleteAccountSub =>
      'Eliminar permanentemente tu cuenta y tus datos';

  @override
  String get logout => 'Cerrar sesión';

  @override
  String get languageTitle => 'Seleccionar idioma';

  @override
  String get languageSearchHint => 'Buscar un idioma';

  @override
  String get languageSuggested => 'Sugeridos';

  @override
  String get languageEnglishUs => 'Inglés (US)';

  @override
  String get languageDefaultSystem => 'Idioma del sistema predeterminado';

  @override
  String get languageAll => 'Todos los idiomas';

  @override
  String get languageSpanish => 'Español';

  @override
  String get languageFrench => 'Francés';

  @override
  String get languageGerman => 'Alemán';

  @override
  String get languageChinese => 'Chino (simplificado)';

  @override
  String get languageJapanese => 'Japonés';

  @override
  String get languagePortuguese => 'Portugués';

  @override
  String get save => 'Guardar';

  @override
  String languageSetTo(String lang) {
    return 'Idioma configurado en $lang';
  }

  @override
  String get walletTitle => 'Billetera y Ganancias';

  @override
  String get walletUnitsSuffix => '/Unidades';

  @override
  String walletNairaEquivalent(String amount) {
    return '$amount Equivalente en nairas';
  }

  @override
  String walletStreakActive(Object days) {
    return 'Racha de $days días activa';
  }

  @override
  String walletLevel(int level) {
    return 'NIVEL $level';
  }

  @override
  String get walletOverview => 'Resumen';

  @override
  String get walletBuy => 'Comprar';

  @override
  String get walletSell => 'Vender';

  @override
  String get walletWithdraw => 'Retirar';

  @override
  String get walletAddFunds => 'Agregar fondos';

  @override
  String get walletCashOut => 'Retirar dinero';

  @override
  String get walletTransactionHistory => 'Historial de transacciones';

  @override
  String get walletViewAll => 'Ver todo';

  @override
  String get walletNoTransactions => 'Aún no hay transacciones';

  @override
  String get walletNoTransactionsSub =>
      'Tus ganancias de juego aparecerán aquí';

  @override
  String walletUnitsAmount(String sign, String units) {
    return '$sign$units Unidades';
  }

  @override
  String get homeEarnByKeepingStreak =>
      'Puedes ganar puntos manteniendo tu racha.';

  @override
  String get homeWalletBalance => 'Saldo de billetera';

  @override
  String get homeDailyStreak => 'Racha diaria';

  @override
  String get homeTapToClaim => 'Toca para reclamar';

  @override
  String get homeActiveTournaments => 'Torneos activos';

  @override
  String get homeGames => 'JUEGOS';

  @override
  String get homeGlobalLeaderboard => 'Clasificación mundial';

  @override
  String get homeLive => 'En vivo';

  @override
  String homePlayersCount(int count) {
    return '$count jugadores';
  }

  @override
  String get homePrizePool => 'Premio acumulado';

  @override
  String homePlayingCount(String count) {
    return '$count jugando';
  }

  @override
  String get homeViewFullLeaderboard => 'Ver clasificación completa';

  @override
  String get homeMyRankings => 'Mis clasificaciones';

  @override
  String get homeNoDataYet => 'Aún no hay datos.';

  @override
  String get homeLbDaily => 'Diario';

  @override
  String get homeLbWeekly => 'Semanal';

  @override
  String get homeLbMonthly => 'Mensual';

  @override
  String get homeLbYearly => 'Anual';

  @override
  String homeScorePts(int score) {
    return '$score pts';
  }

  @override
  String get profileTitle => 'Mi perfil';

  @override
  String get profileEdit => 'Editar perfil';

  @override
  String get profileWallet => 'Billetera';

  @override
  String get profileFollowers => 'Seguidores';

  @override
  String get profileFollowing => 'Siguiendo';

  @override
  String get profileDayStreak => 'Racha diaria';

  @override
  String get profileSearchFriends => 'Buscar amigos';

  @override
  String get profileActiveFriends => 'Amigos activos';

  @override
  String profileOnline(int count) {
    return '$count en línea';
  }

  @override
  String get profileInviteFromContacts => 'Invitar desde contactos';

  @override
  String get profilePerformanceStats => 'Estadísticas de rendimiento';

  @override
  String get profileAllTimePoints => 'Puntos de todos los tiempos';

  @override
  String get profileThisWeek => '+12% esta semana';

  @override
  String profileLevelXp(String level) {
    return 'Nivel $level XP';
  }

  @override
  String get profileTotalWins => 'Victorias totales';

  @override
  String get profileRegionRank => 'Clasificación regional';

  @override
  String get profileGlobalRank => 'Clasificación mundial';

  @override
  String get profileFollowingBtn => 'Siguiendo';

  @override
  String get profileInviteBtn => 'Invitar';

  @override
  String get profileGoPremium => 'Hazte Premium';

  @override
  String get profilePremiumTitle => 'Gamearn Premium';

  @override
  String get profilePremiumSub => 'Recompensas exclusivas';

  @override
  String get profilePremiumBody =>
      'Desbloquea mayores premios acumulados, torneos privados y pagos prioritarios: la experiencia premium para jugadores serios.';

  @override
  String get profileEditSheetTitle => 'Editar perfil';

  @override
  String get profileUsernameHint => 'Nombre de usuario';

  @override
  String get profileBioHint => 'Bio';

  @override
  String get profileSave => 'Guardar';

  @override
  String profileJoinShare(String link) {
    return '¡Únete a mí en Gamearn! Juega Whot, Ludo, Ayo y Damas y gana dinero real.\nEnlace de invitación: $link';
  }
}
