import mobileAds, { AdEventType, RewardedAd, TestIds } from 'react-native-google-mobile-ads';

const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED, {
  requestNonPersonalizedAdsOnly: true,
});

export const showRecoveryAd = async () => {
  await mobileAds().initialize();
  return new Promise((resolve) => {
    let earned = false;
    const unsubscribeLoaded = rewarded.addAdEventListener(AdEventType.LOADED, () => rewarded.show());
    const unsubscribeEarned = rewarded.addAdEventListener(AdEventType.EARNED_REWARD, () => { earned = true; });
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeLoaded(); unsubscribeEarned(); unsubscribeClosed();
      resolve(earned);
    });
    rewarded.load();
  });
};
