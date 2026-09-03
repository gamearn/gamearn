import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../config/ads_config.dart';

/// Central ads service wrapping Google Mobile Ads (AdMob).
///
/// Provides rewarded + interstitial ads with graceful degradation:
/// - Auto-initializes MobileAds once (no-op on repeat calls).
/// - `showRewarded` resolves `true` only when the user earns the reward.
/// - `showInterstitialIfAvailable` shows an interstitial if one is loaded.
/// - Never throws — failures degrade to a no-show so gameplay is unaffected.
class AdsService {
  AdsService._();
  static final AdsService instance = AdsService._();

  bool _initialized = false;
  RewardedAd? _rewarded;
  InterstitialAd? _interstitial;
  bool _rewardedLoading = false;
  bool _interstitialLoading = false;
  int _loadRetries = 0;

  String get _interstitialId =>
      Platform.isAndroid ? AdsConfig.androidInterstitialId : AdsConfig.iosInterstitialId;

  String get _rewardedId =>
      Platform.isAndroid ? AdsConfig.androidRewardedId : AdsConfig.iosRewardedId;

  /// Initialize the Mobile Ads SDK once.
  Future<void> init() async {
    if (_initialized) return;
    try {
      await MobileAds.instance.initialize();
      _initialized = true;
    } catch (e) {
      debugPrint('[Ads] init failed: $e');
    }
  }

  // ── Rewarded ───────────────────────────────────────────────────────────────

  /// Pre-load a rewarded ad in the background.
  Future<void> preloadRewarded() async {
    if (_rewardedLoading || _rewarded != null) return;
    _rewardedLoading = true;
    try {
      await RewardedAd.load(
        adUnitId: _rewardedId,
        request: const AdRequest(),
        rewardedAdLoadCallback: RewardedAdLoadCallback(
          onAdLoaded: (ad) {
            _rewarded = ad;
            _rewardedLoading = false;
          },
          onAdFailedToLoad: (err) {
            debugPrint('[Ads] rewarded load failed: ${err.message}');
            _rewardedLoading = false;
          },
        ),
      );
    } catch (e) {
      _rewardedLoading = false;
      debugPrint('[Ads] rewarded preload error: $e');
    }
  }

  /// Show a rewarded ad (needs a pre-loaded ad). Resolves `true` only when the
  /// user completes it (reward earned). If none is ready, kicks a reload and
  /// resolves `false`.
  Future<bool> showRewarded() async {
    final ad = _rewarded;
    if (ad == null) {
      debugPrint('[Ads] no rewarded ad ready; attempting reload');
      await preloadRewarded();
      return false;
    }

    final completer = Completer<bool>();
    _rewarded = null;
    var rewarded = false;

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (a) {}, // reward callback fires via show()
      onAdDismissedFullScreenContent: (a) {
        if (!completer.isCompleted) completer.complete(rewarded);
        a.dispose();
        preloadRewarded();
      },
      onAdFailedToShowFullScreenContent: (a, err) {
        debugPrint('[Ads] rewarded show failed: ${err.message}');
        if (!completer.isCompleted) completer.complete(false);
        a.dispose();
        preloadRewarded();
      },
    );

    ad.show(
      onUserEarnedReward: (AdWithoutView _, RewardItem __) {
        rewarded = true;
      },
    );

    return completer.future;
  }

  // ── Interstitial ───────────────────────────────────────────────────────────

  /// Pre-load an interstitial ad in the background.
  Future<void> preloadInterstitial() async {
    if (_interstitialLoading || _interstitial != null) return;
    _interstitialLoading = true;
    try {
      await InterstitialAd.load(
        adUnitId: _interstitialId,
        request: const AdRequest(),
        adLoadCallback: InterstitialAdLoadCallback(
          onAdLoaded: (ad) {
            _interstitial = ad;
            _interstitialLoading = false;
            _loadRetries = 0;
          },
          onAdFailedToLoad: (err) {
            debugPrint('[Ads] interstitial load failed: ${err.message}');
            _interstitialLoading = false;
            _loadRetries++;
            if (_loadRetries < 3) {
              Future.delayed(const Duration(seconds: 8), preloadInterstitial);
            }
          },
        ),
      );
    } catch (e) {
      _interstitialLoading = false;
      debugPrint('[Ads] interstitial preload error: $e');
    }
  }

  /// Show the pre-loaded interstitial (if any). Fire-and-forget — gameplay is
  /// never blocked by the absence of an ad.
  Future<void> showInterstitialIfAvailable() async {
    final ad = _interstitial;
    if (ad == null) {
      debugPrint('[Ads] no interstitial available');
      preloadInterstitial();
      return;
    }
    _interstitial = null;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (a) {
        a.dispose();
        preloadInterstitial();
      },
      onAdFailedToShowFullScreenContent: (a, err) {
        debugPrint('[Ads] interstitial show failed: ${err.message}');
        a.dispose();
        preloadInterstitial();
      },
    );
    ad.show();
  }
}
