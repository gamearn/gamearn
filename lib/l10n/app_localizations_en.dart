// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Gamearn';

  @override
  String get appTagline => 'Play. Earn. Compete.';

  @override
  String get appTitle => 'Gamearn';

  @override
  String get secByGamearn => 'Secured by Gamearn';

  @override
  String get premiumVersion => 'GAMEARN Premium v2.4.1';

  @override
  String get navHome => 'Home';

  @override
  String get navGames => 'Games';

  @override
  String get navWallet => 'Wallet';

  @override
  String get navProfile => 'Profile';

  @override
  String get settingsTitle => 'Settings & Preferences';

  @override
  String get settingsSoundVibration => 'Sound & Vibration';

  @override
  String get settingsSoundEffects => 'Sound Effects';

  @override
  String get settingsVibration => 'Vibration';

  @override
  String get settingsAccountSecurity => 'Account & Security';

  @override
  String get settingsAccountSecurityTile => 'Account Security';

  @override
  String get settingsAccountSecuritySub => 'Password, 2FA and sessions';

  @override
  String get settingsPayoutMethods => 'Payout Methods';

  @override
  String get settingsPayoutMethodsSub => 'Bank accounts & wallets';

  @override
  String get settingsGamePrefs => 'Game Preferences';

  @override
  String get settingsThemePreference => 'Theme Preference';

  @override
  String get settingsThemePreferenceSub => 'Dark & Light mode';

  @override
  String get settingsEmailAlerts => 'Email Alerts';

  @override
  String get settingsEmailAlertsSub => 'Weekly rewards summary';

  @override
  String get settingsSoundVibrationSub => 'Game effects and haptics';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsLanguageSubEnglish => 'English (NG)';

  @override
  String get settingsPrivacySecurity => 'Privacy & Security';

  @override
  String get settingsPrivacySecuritySub => 'Game security update';

  @override
  String get settingsHelpSupport => 'Help & Support';

  @override
  String get settingsHelpSupportSub => 'Get important information';

  @override
  String get settingsLegal => 'Legal';

  @override
  String get settingsTerms => 'Terms & Conditions';

  @override
  String get settingsTermsSub => 'Rules for using Gamearn';

  @override
  String get settingsPrivacyPolicy => 'Privacy Policy';

  @override
  String get settingsPrivacyPolicySub => 'How we handle your data';

  @override
  String get settingsDangerZone => 'Danger Zone';

  @override
  String get settingsDeleteAccount => 'Delete Account';

  @override
  String get settingsDeleteAccountSub =>
      'Permanently remove your account and data';

  @override
  String get logout => 'Logout';

  @override
  String get languageTitle => 'Select Language';

  @override
  String get languageSearchHint => 'Search for a language';

  @override
  String get languageSuggested => 'Suggested';

  @override
  String get languageEnglishUs => 'English (US)';

  @override
  String get languageDefaultSystem => 'Default system language';

  @override
  String get languageAll => 'All Languages';

  @override
  String get languageSpanish => 'Spanish';

  @override
  String get languageFrench => 'French';

  @override
  String get languageGerman => 'German';

  @override
  String get languageChinese => 'Chinese (Simplified)';

  @override
  String get languageJapanese => 'Japanese';

  @override
  String get languagePortuguese => 'Portuguese';

  @override
  String get save => 'Save';

  @override
  String languageSetTo(String lang) {
    return 'Language set to $lang';
  }

  @override
  String get walletTitle => 'Wallet & Earnings';

  @override
  String get walletUnitsSuffix => '/Units';

  @override
  String walletNairaEquivalent(String amount) {
    return '$amount Naira Equivalent';
  }

  @override
  String walletStreakActive(Object days) {
    return '$days-Day Streak Active';
  }

  @override
  String walletLevel(int level) {
    return 'LEVEL $level';
  }

  @override
  String get walletOverview => 'Overview';

  @override
  String get walletBuy => 'Buy';

  @override
  String get walletSell => 'Sell';

  @override
  String get walletWithdraw => 'Withdraw';

  @override
  String get walletAddFunds => 'Add Funds';

  @override
  String get walletCashOut => 'Cash Out';

  @override
  String get walletTransactionHistory => 'Transaction History';

  @override
  String get walletViewAll => 'View All';

  @override
  String get walletNoTransactions => 'No transactions yet';

  @override
  String get walletNoTransactionsSub => 'Your gaming wins will appear here';

  @override
  String walletUnitsAmount(String sign, String units) {
    return '$sign$units Units';
  }

  @override
  String get homeEarnByKeepingStreak =>
      'You can earn points by keeping your streak.';

  @override
  String get homeWalletBalance => 'Wallet Balance';

  @override
  String get homeDailyStreak => 'Daily Streak';

  @override
  String get homeTapToClaim => 'Tap to claim';

  @override
  String get homeActiveTournaments => 'Active Tournaments';

  @override
  String get homeGames => 'GAMES';

  @override
  String get homeGlobalLeaderboard => 'Global Leaderboard';

  @override
  String get homeLive => 'Live';

  @override
  String homePlayersCount(int count) {
    return '$count Players';
  }

  @override
  String get homePrizePool => 'Prize Pool';

  @override
  String homePlayingCount(String count) {
    return '$count playing';
  }

  @override
  String get homeViewFullLeaderboard => 'View Full Leaderboard';

  @override
  String get homeMyRankings => 'My Rankings';

  @override
  String get homeNoDataYet => 'No data yet.';

  @override
  String get homeLbDaily => 'Daily';

  @override
  String get homeLbWeekly => 'Weekly';

  @override
  String get homeLbMonthly => 'Monthly';

  @override
  String get homeLbYearly => 'Yearly';

  @override
  String homeScorePts(int score) {
    return '$score pts';
  }

  @override
  String get profileTitle => 'My Profile';

  @override
  String get profileEdit => 'Edit Profile';

  @override
  String get profileWallet => 'Wallet';

  @override
  String get profileFollowers => 'Followers';

  @override
  String get profileFollowing => 'Following';

  @override
  String get profileDayStreak => 'Day Streak';

  @override
  String get profileSearchFriends => 'Search Friends';

  @override
  String get profileActiveFriends => 'Active Friends';

  @override
  String profileOnline(int count) {
    return '$count Online';
  }

  @override
  String get profileInviteFromContacts => 'Invite from Contacts';

  @override
  String get profilePerformanceStats => 'Performance Stats';

  @override
  String get profileAllTimePoints => 'All-time Points';

  @override
  String get profileThisWeek => '+12% this week';

  @override
  String profileLevelXp(String level) {
    return 'Level $level XP';
  }

  @override
  String get profileTotalWins => 'Total Wins';

  @override
  String get profileRegionRank => 'Region Rank';

  @override
  String get profileGlobalRank => 'Global Rank';

  @override
  String get profileFollowingBtn => 'Following';

  @override
  String get profileInviteBtn => 'Invite';

  @override
  String get profileGoPremium => 'Go Premium';

  @override
  String get profilePremiumTitle => 'Gamearn Premium';

  @override
  String get profilePremiumSub => 'Exclusive rewards';

  @override
  String get profilePremiumBody =>
      'Unlock bigger prize pools, private tournaments and priority payouts — the premium experience for serious players.';

  @override
  String get profileEditSheetTitle => 'Edit Profile';

  @override
  String get profileUsernameHint => 'Username';

  @override
  String get profileBioHint => 'Bio';

  @override
  String get profileSave => 'Save';

  @override
  String profileJoinShare(String link) {
    return 'Join me on Gamearn! Play Whot, Ludo, Ayo and Draughts and win real money.\nInvite link: $link';
  }
}
