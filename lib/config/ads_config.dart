/// AdMob / Google Mobile Ads configuration — single source of truth for ad IDs.
///
/// These are the LIVE Gamearn AdMob IDs (application + interstitial + rewarded
/// per platform). To swap IDs later, change only the constants below.
library;

class AdsConfig {
  AdsConfig._();

  /// Android AdMob APP ID (`ca-app-pub-....~....`).
  static const String androidAppId = 'ca-app-pub-2857679842539464~7839211507';

  /// iOS AdMob APP ID (`ca-app-pub-....~....`).
  static const String iosAppId = 'ca-app-pub-2857679842539464~9942525461';

  /// Android interstitial ad unit ID.
  static const String androidInterstitialId =
      'ca-app-pub-2857679842539464/2241119090';

  /// Android rewarded ad unit ID.
  static const String androidRewardedId =
      'ca-app-pub-2857679842539464/1433585250';

  /// iOS interstitial ad unit ID.
  static const String iosInterstitialId =
      'ca-app-pub-2857679842539464/7110302393';

  /// iOS rewarded ad unit ID.
  static const String iosRewardedId =
      'ca-app-pub-2857679842539464/4484139051';
}
