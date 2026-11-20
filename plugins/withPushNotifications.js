const {
  withInfoPlist,
  withEntitlementsPlist,
} = require('expo/config-plugins');

// iOS requires the remote-notification background mode and the
// `aps-environment` entitlement for FCM/APNs pushes to be delivered.
// `aps-environment` is set to `production` for release builds and
// `development` otherwise; the Firebase project has both APNs keys uploaded.
module.exports = function withPushNotifications(config) {
  config = withInfoPlist(config, (mod) => {
    const modes = new Set(Array.isArray(mod.modResults.UIBackgroundModes) ? mod.modResults.UIBackgroundModes : []);
    modes.add('remote-notification');
    mod.modResults.UIBackgroundModes = Array.from(modes);
    return mod;
  });

  config = withEntitlementsPlist(config, (mod) => {
    const isRelease = process.env.EAS_BUILD_PROFILE === 'production' || process.env.NODE_ENV === 'production';
    mod.modResults['aps-environment'] = isRelease ? 'production' : 'development';
    return mod;
  });

  return config;
};
