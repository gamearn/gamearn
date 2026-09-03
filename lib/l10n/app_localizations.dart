import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('fr')
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Gamearn'**
  String get appName;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Play. Earn. Compete.'**
  String get appTagline;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Gamearn'**
  String get appTitle;

  /// No description provided for @secByGamearn.
  ///
  /// In en, this message translates to:
  /// **'Secured by Gamearn'**
  String get secByGamearn;

  /// No description provided for @premiumVersion.
  ///
  /// In en, this message translates to:
  /// **'GAMEARN Premium v2.4.1'**
  String get premiumVersion;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navGames.
  ///
  /// In en, this message translates to:
  /// **'Games'**
  String get navGames;

  /// No description provided for @navWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get navWallet;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings & Preferences'**
  String get settingsTitle;

  /// No description provided for @settingsSoundVibration.
  ///
  /// In en, this message translates to:
  /// **'Sound & Vibration'**
  String get settingsSoundVibration;

  /// No description provided for @settingsSoundEffects.
  ///
  /// In en, this message translates to:
  /// **'Sound Effects'**
  String get settingsSoundEffects;

  /// No description provided for @settingsVibration.
  ///
  /// In en, this message translates to:
  /// **'Vibration'**
  String get settingsVibration;

  /// No description provided for @settingsAccountSecurity.
  ///
  /// In en, this message translates to:
  /// **'Account & Security'**
  String get settingsAccountSecurity;

  /// No description provided for @settingsAccountSecurityTile.
  ///
  /// In en, this message translates to:
  /// **'Account Security'**
  String get settingsAccountSecurityTile;

  /// No description provided for @settingsAccountSecuritySub.
  ///
  /// In en, this message translates to:
  /// **'Password, 2FA and sessions'**
  String get settingsAccountSecuritySub;

  /// No description provided for @settingsPayoutMethods.
  ///
  /// In en, this message translates to:
  /// **'Payout Methods'**
  String get settingsPayoutMethods;

  /// No description provided for @settingsPayoutMethodsSub.
  ///
  /// In en, this message translates to:
  /// **'Bank accounts & wallets'**
  String get settingsPayoutMethodsSub;

  /// No description provided for @settingsGamePrefs.
  ///
  /// In en, this message translates to:
  /// **'Game Preferences'**
  String get settingsGamePrefs;

  /// No description provided for @settingsThemePreference.
  ///
  /// In en, this message translates to:
  /// **'Theme Preference'**
  String get settingsThemePreference;

  /// No description provided for @settingsThemePreferenceSub.
  ///
  /// In en, this message translates to:
  /// **'Dark & Light mode'**
  String get settingsThemePreferenceSub;

  /// No description provided for @settingsEmailAlerts.
  ///
  /// In en, this message translates to:
  /// **'Email Alerts'**
  String get settingsEmailAlerts;

  /// No description provided for @settingsEmailAlertsSub.
  ///
  /// In en, this message translates to:
  /// **'Weekly rewards summary'**
  String get settingsEmailAlertsSub;

  /// No description provided for @settingsSoundVibrationSub.
  ///
  /// In en, this message translates to:
  /// **'Game effects and haptics'**
  String get settingsSoundVibrationSub;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsLanguageSubEnglish.
  ///
  /// In en, this message translates to:
  /// **'English (NG)'**
  String get settingsLanguageSubEnglish;

  /// No description provided for @settingsPrivacySecurity.
  ///
  /// In en, this message translates to:
  /// **'Privacy & Security'**
  String get settingsPrivacySecurity;

  /// No description provided for @settingsPrivacySecuritySub.
  ///
  /// In en, this message translates to:
  /// **'Game security update'**
  String get settingsPrivacySecuritySub;

  /// No description provided for @settingsHelpSupport.
  ///
  /// In en, this message translates to:
  /// **'Help & Support'**
  String get settingsHelpSupport;

  /// No description provided for @settingsHelpSupportSub.
  ///
  /// In en, this message translates to:
  /// **'Get important information'**
  String get settingsHelpSupportSub;

  /// No description provided for @settingsLegal.
  ///
  /// In en, this message translates to:
  /// **'Legal'**
  String get settingsLegal;

  /// No description provided for @settingsTerms.
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get settingsTerms;

  /// No description provided for @settingsTermsSub.
  ///
  /// In en, this message translates to:
  /// **'Rules for using Gamearn'**
  String get settingsTermsSub;

  /// No description provided for @settingsPrivacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get settingsPrivacyPolicy;

  /// No description provided for @settingsPrivacyPolicySub.
  ///
  /// In en, this message translates to:
  /// **'How we handle your data'**
  String get settingsPrivacyPolicySub;

  /// No description provided for @settingsDangerZone.
  ///
  /// In en, this message translates to:
  /// **'Danger Zone'**
  String get settingsDangerZone;

  /// No description provided for @settingsDeleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get settingsDeleteAccount;

  /// No description provided for @settingsDeleteAccountSub.
  ///
  /// In en, this message translates to:
  /// **'Permanently remove your account and data'**
  String get settingsDeleteAccountSub;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @languageTitle.
  ///
  /// In en, this message translates to:
  /// **'Select Language'**
  String get languageTitle;

  /// No description provided for @languageSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search for a language'**
  String get languageSearchHint;

  /// No description provided for @languageSuggested.
  ///
  /// In en, this message translates to:
  /// **'Suggested'**
  String get languageSuggested;

  /// No description provided for @languageEnglishUs.
  ///
  /// In en, this message translates to:
  /// **'English (US)'**
  String get languageEnglishUs;

  /// No description provided for @languageDefaultSystem.
  ///
  /// In en, this message translates to:
  /// **'Default system language'**
  String get languageDefaultSystem;

  /// No description provided for @languageAll.
  ///
  /// In en, this message translates to:
  /// **'All Languages'**
  String get languageAll;

  /// No description provided for @languageSpanish.
  ///
  /// In en, this message translates to:
  /// **'Spanish'**
  String get languageSpanish;

  /// No description provided for @languageFrench.
  ///
  /// In en, this message translates to:
  /// **'French'**
  String get languageFrench;

  /// No description provided for @languageGerman.
  ///
  /// In en, this message translates to:
  /// **'German'**
  String get languageGerman;

  /// No description provided for @languageChinese.
  ///
  /// In en, this message translates to:
  /// **'Chinese (Simplified)'**
  String get languageChinese;

  /// No description provided for @languageJapanese.
  ///
  /// In en, this message translates to:
  /// **'Japanese'**
  String get languageJapanese;

  /// No description provided for @languagePortuguese.
  ///
  /// In en, this message translates to:
  /// **'Portuguese'**
  String get languagePortuguese;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @languageSetTo.
  ///
  /// In en, this message translates to:
  /// **'Language set to {lang}'**
  String languageSetTo(String lang);

  /// No description provided for @walletTitle.
  ///
  /// In en, this message translates to:
  /// **'Wallet & Earnings'**
  String get walletTitle;

  /// No description provided for @walletUnitsSuffix.
  ///
  /// In en, this message translates to:
  /// **'/Units'**
  String get walletUnitsSuffix;

  /// No description provided for @walletNairaEquivalent.
  ///
  /// In en, this message translates to:
  /// **'{amount} Naira Equivalent'**
  String walletNairaEquivalent(String amount);

  /// No description provided for @walletStreakActive.
  ///
  /// In en, this message translates to:
  /// **'{days}-Day Streak Active'**
  String walletStreakActive(Object days);

  /// No description provided for @walletLevel.
  ///
  /// In en, this message translates to:
  /// **'LEVEL {level}'**
  String walletLevel(int level);

  /// No description provided for @walletOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get walletOverview;

  /// No description provided for @walletBuy.
  ///
  /// In en, this message translates to:
  /// **'Buy'**
  String get walletBuy;

  /// No description provided for @walletSell.
  ///
  /// In en, this message translates to:
  /// **'Sell'**
  String get walletSell;

  /// No description provided for @walletWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get walletWithdraw;

  /// No description provided for @walletAddFunds.
  ///
  /// In en, this message translates to:
  /// **'Add Funds'**
  String get walletAddFunds;

  /// No description provided for @walletCashOut.
  ///
  /// In en, this message translates to:
  /// **'Cash Out'**
  String get walletCashOut;

  /// No description provided for @walletTransactionHistory.
  ///
  /// In en, this message translates to:
  /// **'Transaction History'**
  String get walletTransactionHistory;

  /// No description provided for @walletViewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get walletViewAll;

  /// No description provided for @walletNoTransactions.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet'**
  String get walletNoTransactions;

  /// No description provided for @walletNoTransactionsSub.
  ///
  /// In en, this message translates to:
  /// **'Your gaming wins will appear here'**
  String get walletNoTransactionsSub;

  /// No description provided for @walletUnitsAmount.
  ///
  /// In en, this message translates to:
  /// **'{sign}{units} Units'**
  String walletUnitsAmount(String sign, String units);

  /// No description provided for @homeEarnByKeepingStreak.
  ///
  /// In en, this message translates to:
  /// **'You can earn points by keeping your streak.'**
  String get homeEarnByKeepingStreak;

  /// No description provided for @homeWalletBalance.
  ///
  /// In en, this message translates to:
  /// **'Wallet Balance'**
  String get homeWalletBalance;

  /// No description provided for @homeDailyStreak.
  ///
  /// In en, this message translates to:
  /// **'Daily Streak'**
  String get homeDailyStreak;

  /// No description provided for @homeTapToClaim.
  ///
  /// In en, this message translates to:
  /// **'Tap to claim'**
  String get homeTapToClaim;

  /// No description provided for @homeActiveTournaments.
  ///
  /// In en, this message translates to:
  /// **'Active Tournaments'**
  String get homeActiveTournaments;

  /// No description provided for @homeGames.
  ///
  /// In en, this message translates to:
  /// **'GAMES'**
  String get homeGames;

  /// No description provided for @homeGlobalLeaderboard.
  ///
  /// In en, this message translates to:
  /// **'Global Leaderboard'**
  String get homeGlobalLeaderboard;

  /// No description provided for @homeLive.
  ///
  /// In en, this message translates to:
  /// **'Live'**
  String get homeLive;

  /// No description provided for @homePlayersCount.
  ///
  /// In en, this message translates to:
  /// **'{count} Players'**
  String homePlayersCount(int count);

  /// No description provided for @homePrizePool.
  ///
  /// In en, this message translates to:
  /// **'Prize Pool'**
  String get homePrizePool;

  /// No description provided for @homePlayingCount.
  ///
  /// In en, this message translates to:
  /// **'{count} playing'**
  String homePlayingCount(String count);

  /// No description provided for @homeViewFullLeaderboard.
  ///
  /// In en, this message translates to:
  /// **'View Full Leaderboard'**
  String get homeViewFullLeaderboard;

  /// No description provided for @homeMyRankings.
  ///
  /// In en, this message translates to:
  /// **'My Rankings'**
  String get homeMyRankings;

  /// No description provided for @homeNoDataYet.
  ///
  /// In en, this message translates to:
  /// **'No data yet.'**
  String get homeNoDataYet;

  /// No description provided for @homeLbDaily.
  ///
  /// In en, this message translates to:
  /// **'Daily'**
  String get homeLbDaily;

  /// No description provided for @homeLbWeekly.
  ///
  /// In en, this message translates to:
  /// **'Weekly'**
  String get homeLbWeekly;

  /// No description provided for @homeLbMonthly.
  ///
  /// In en, this message translates to:
  /// **'Monthly'**
  String get homeLbMonthly;

  /// No description provided for @homeLbYearly.
  ///
  /// In en, this message translates to:
  /// **'Yearly'**
  String get homeLbYearly;

  /// No description provided for @homeScorePts.
  ///
  /// In en, this message translates to:
  /// **'{score} pts'**
  String homeScorePts(int score);

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'My Profile'**
  String get profileTitle;

  /// No description provided for @profileEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get profileEdit;

  /// No description provided for @profileWallet.
  ///
  /// In en, this message translates to:
  /// **'Wallet'**
  String get profileWallet;

  /// No description provided for @profileFollowers.
  ///
  /// In en, this message translates to:
  /// **'Followers'**
  String get profileFollowers;

  /// No description provided for @profileFollowing.
  ///
  /// In en, this message translates to:
  /// **'Following'**
  String get profileFollowing;

  /// No description provided for @profileDayStreak.
  ///
  /// In en, this message translates to:
  /// **'Day Streak'**
  String get profileDayStreak;

  /// No description provided for @profileSearchFriends.
  ///
  /// In en, this message translates to:
  /// **'Search Friends'**
  String get profileSearchFriends;

  /// No description provided for @profileActiveFriends.
  ///
  /// In en, this message translates to:
  /// **'Active Friends'**
  String get profileActiveFriends;

  /// No description provided for @profileOnline.
  ///
  /// In en, this message translates to:
  /// **'{count} Online'**
  String profileOnline(int count);

  /// No description provided for @profileInviteFromContacts.
  ///
  /// In en, this message translates to:
  /// **'Invite from Contacts'**
  String get profileInviteFromContacts;

  /// No description provided for @profilePerformanceStats.
  ///
  /// In en, this message translates to:
  /// **'Performance Stats'**
  String get profilePerformanceStats;

  /// No description provided for @profileAllTimePoints.
  ///
  /// In en, this message translates to:
  /// **'All-time Points'**
  String get profileAllTimePoints;

  /// No description provided for @profileThisWeek.
  ///
  /// In en, this message translates to:
  /// **'+12% this week'**
  String get profileThisWeek;

  /// No description provided for @profileLevelXp.
  ///
  /// In en, this message translates to:
  /// **'Level {level} XP'**
  String profileLevelXp(String level);

  /// No description provided for @profileTotalWins.
  ///
  /// In en, this message translates to:
  /// **'Total Wins'**
  String get profileTotalWins;

  /// No description provided for @profileRegionRank.
  ///
  /// In en, this message translates to:
  /// **'Region Rank'**
  String get profileRegionRank;

  /// No description provided for @profileGlobalRank.
  ///
  /// In en, this message translates to:
  /// **'Global Rank'**
  String get profileGlobalRank;

  /// No description provided for @profileFollowingBtn.
  ///
  /// In en, this message translates to:
  /// **'Following'**
  String get profileFollowingBtn;

  /// No description provided for @profileInviteBtn.
  ///
  /// In en, this message translates to:
  /// **'Invite'**
  String get profileInviteBtn;

  /// No description provided for @profileGoPremium.
  ///
  /// In en, this message translates to:
  /// **'Go Premium'**
  String get profileGoPremium;

  /// No description provided for @profilePremiumTitle.
  ///
  /// In en, this message translates to:
  /// **'Gamearn Premium'**
  String get profilePremiumTitle;

  /// No description provided for @profilePremiumSub.
  ///
  /// In en, this message translates to:
  /// **'Exclusive rewards'**
  String get profilePremiumSub;

  /// No description provided for @profilePremiumBody.
  ///
  /// In en, this message translates to:
  /// **'Unlock bigger prize pools, private tournaments and priority payouts — the premium experience for serious players.'**
  String get profilePremiumBody;

  /// No description provided for @profileEditSheetTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get profileEditSheetTitle;

  /// No description provided for @profileUsernameHint.
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get profileUsernameHint;

  /// No description provided for @profileBioHint.
  ///
  /// In en, this message translates to:
  /// **'Bio'**
  String get profileBioHint;

  /// No description provided for @profileSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get profileSave;

  /// No description provided for @profileJoinShare.
  ///
  /// In en, this message translates to:
  /// **'Join me on Gamearn! Play Whot, Ludo, Ayo and Draughts and win real money.\nInvite link: {link}'**
  String profileJoinShare(String link);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
