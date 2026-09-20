import { Platform } from 'react-native';
import mobileAds, { AdEventType, RewardedAd } from 'react-native-google-mobile-ads';
import { getCurrentUser } from './firebase';

const rewardedUnitId = Platform.select({
  android: 'ca-app-pub-2857679842539464/1433585250',
  ios: 'ca-app-pub-2857679842539464/4484139051',
  default: '',
});
export const showRecoveryAd = async () => {
  await mobileAds().initialize();
  const user = getCurrentUser();
  const rewarded = RewardedAd.createForAdRequest(rewardedUnitId, {
    requestNonPersonalizedAdsOnly: true,
    serverSideVerificationOptions: {
      userId: user?.uid || '',
      customData: JSON.stringify({ purpose: 'streak_freeze', uid: user?.uid || '' }),
    },
  });
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
