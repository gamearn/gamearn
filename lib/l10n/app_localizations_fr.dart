// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appName => 'Gamearn';

  @override
  String get appTagline => 'Jouez. Gagnez. Compétez.';

  @override
  String get appTitle => 'Gamearn';

  @override
  String get secByGamearn => 'Sécurisé par Gamearn';

  @override
  String get premiumVersion => 'GAMEARN Premium v2.4.1';

  @override
  String get navHome => 'Accueil';

  @override
  String get navGames => 'Jeux';

  @override
  String get navWallet => 'Portefeuille';

  @override
  String get navProfile => 'Profil';

  @override
  String get settingsTitle => 'Paramètres et Préférences';

  @override
  String get settingsSoundVibration => 'Sons et Vibration';

  @override
  String get settingsSoundEffects => 'Effets sonores';

  @override
  String get settingsVibration => 'Vibration';

  @override
  String get settingsAccountSecurity => 'Compte et Sécurité';

  @override
  String get settingsAccountSecurityTile => 'Sécurité du compte';

  @override
  String get settingsAccountSecuritySub => 'Mot de passe, 2FA et sessions';

  @override
  String get settingsPayoutMethods => 'Méthodes de paiement';

  @override
  String get settingsPayoutMethodsSub => 'Comptes bancaires et portefeuilles';

  @override
  String get settingsGamePrefs => 'Préférences de jeu';

  @override
  String get settingsThemePreference => 'Préférence de thème';

  @override
  String get settingsThemePreferenceSub => 'Mode sombre et clair';

  @override
  String get settingsEmailAlerts => 'Alertes e-mail';

  @override
  String get settingsEmailAlertsSub => 'Résumé des récompenses hebdomadaires';

  @override
  String get settingsSoundVibrationSub => 'Effets de jeu et haptique';

  @override
  String get settingsLanguage => 'Langue';

  @override
  String get settingsLanguageSubEnglish => 'Français (FR)';

  @override
  String get settingsPrivacySecurity => 'Confidentialité et Sécurité';

  @override
  String get settingsPrivacySecuritySub => 'Mise à jour de la sécurité du jeu';

  @override
  String get settingsHelpSupport => 'Aide et Support';

  @override
  String get settingsHelpSupportSub => 'Obtenir des informations importantes';

  @override
  String get settingsLegal => 'Juridique';

  @override
  String get settingsTerms => 'Conditions d\'utilisation';

  @override
  String get settingsTermsSub => 'Règles d\'utilisation de Gamearn';

  @override
  String get settingsPrivacyPolicy => 'Politique de confidentialité';

  @override
  String get settingsPrivacyPolicySub => 'Comment nous gérons vos données';

  @override
  String get settingsDangerZone => 'Zone de danger';

  @override
  String get settingsDeleteAccount => 'Supprimer le compte';

  @override
  String get settingsDeleteAccountSub =>
      'Supprimer définitivement votre compte et vos données';

  @override
  String get logout => 'Déconnexion';

  @override
  String get languageTitle => 'Sélectionner la langue';

  @override
  String get languageSearchHint => 'Rechercher une langue';

  @override
  String get languageSuggested => 'Suggestions';

  @override
  String get languageEnglishUs => 'Anglais (US)';

  @override
  String get languageDefaultSystem => 'Langue système par défaut';

  @override
  String get languageAll => 'Toutes les langues';

  @override
  String get languageSpanish => 'Espagnol';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageGerman => 'Allemand';

  @override
  String get languageChinese => 'Chinois (simplifié)';

  @override
  String get languageJapanese => 'Japonais';

  @override
  String get languagePortuguese => 'Portugais';

  @override
  String get save => 'Enregistrer';

  @override
  String languageSetTo(String lang) {
    return 'Langue définie sur $lang';
  }

  @override
  String get walletTitle => 'Portefeuille et Gains';

  @override
  String get walletUnitsSuffix => '/Unités';

  @override
  String walletNairaEquivalent(String amount) {
    return '$amount Équivalent en nairas';
  }

  @override
  String walletStreakActive(Object days) {
    return 'Série de $days jours active';
  }

  @override
  String walletLevel(int level) {
    return 'NIVEAU $level';
  }

  @override
  String get walletOverview => 'Vue d\'ensemble';

  @override
  String get walletBuy => 'Acheter';

  @override
  String get walletSell => 'Vendre';

  @override
  String get walletWithdraw => 'Retirer';

  @override
  String get walletAddFunds => 'Ajouter des fonds';

  @override
  String get walletCashOut => 'Retrait';

  @override
  String get walletTransactionHistory => 'Historique des transactions';

  @override
  String get walletViewAll => 'Tout voir';

  @override
  String get walletNoTransactions => 'Aucune transaction pour le moment';

  @override
  String get walletNoTransactionsSub => 'Vos gains de jeu apparaîtront ici';

  @override
  String walletUnitsAmount(String sign, String units) {
    return '$sign$units Unités';
  }

  @override
  String get homeEarnByKeepingStreak =>
      'Vous pouvez gagner des points en gardant votre série.';

  @override
  String get homeWalletBalance => 'Solde du portefeuille';

  @override
  String get homeDailyStreak => 'Série quotidienne';

  @override
  String get homeTapToClaim => 'Appuyer pour réclamer';

  @override
  String get homeActiveTournaments => 'Tournois actifs';

  @override
  String get homeGames => 'JEUX';

  @override
  String get homeGlobalLeaderboard => 'Classement mondial';

  @override
  String get homeLive => 'En direct';

  @override
  String homePlayersCount(int count) {
    return '$count joueurs';
  }

  @override
  String get homePrizePool => 'Cagnotte';

  @override
  String homePlayingCount(String count) {
    return '$count en jeu';
  }

  @override
  String get homeViewFullLeaderboard => 'Voir le classement complet';

  @override
  String get homeMyRankings => 'Mes classements';

  @override
  String get homeNoDataYet => 'Pas encore de données.';

  @override
  String get homeLbDaily => 'Quotidien';

  @override
  String get homeLbWeekly => 'Hebdomadaire';

  @override
  String get homeLbMonthly => 'Mensuel';

  @override
  String get homeLbYearly => 'Annuel';

  @override
  String homeScorePts(int score) {
    return '$score pts';
  }

  @override
  String get profileTitle => 'Mon profil';

  @override
  String get profileEdit => 'Modifier le profil';

  @override
  String get profileWallet => 'Portefeuille';

  @override
  String get profileFollowers => 'Abonnés';

  @override
  String get profileFollowing => 'Abonnements';

  @override
  String get profileDayStreak => 'Série quotidienne';

  @override
  String get profileSearchFriends => 'Rechercher des amis';

  @override
  String get profileActiveFriends => 'Amis actifs';

  @override
  String profileOnline(int count) {
    return '$count en ligne';
  }

  @override
  String get profileInviteFromContacts => 'Inviter depuis les contacts';

  @override
  String get profilePerformanceStats => 'Statistiques de performance';

  @override
  String get profileAllTimePoints => 'Points de tous les temps';

  @override
  String get profileThisWeek => '+12% cette semaine';

  @override
  String profileLevelXp(String level) {
    return 'Niveau $level XP';
  }

  @override
  String get profileTotalWins => 'Victoires totales';

  @override
  String get profileRegionRank => 'Classement régional';

  @override
  String get profileGlobalRank => 'Classement mondial';

  @override
  String get profileFollowingBtn => 'Abonné';

  @override
  String get profileInviteBtn => 'Inviter';

  @override
  String get profileGoPremium => 'Passer Premium';

  @override
  String get profilePremiumTitle => 'Gamearn Premium';

  @override
  String get profilePremiumSub => 'Récompenses exclusives';

  @override
  String get profilePremiumBody =>
      'Débloquez de plus grandes cagnottes, des tournois privés et des paiements prioritaires — l\'expérience premium pour les joueurs sérieux.';

  @override
  String get profileEditSheetTitle => 'Modifier le profil';

  @override
  String get profileUsernameHint => 'Nom d\'utilisateur';

  @override
  String get profileBioHint => 'Bio';

  @override
  String get profileSave => 'Enregistrer';

  @override
  String profileJoinShare(String link) {
    return 'Rejoignez-moi sur Gamearn ! Jouez au Whot, Ludo, Ayo et Dames et gagnez de l\'argent réel.\nLien d\'invitation : $link';
  }
}
