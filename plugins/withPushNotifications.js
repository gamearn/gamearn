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
    // GitHub iOS release uses an App Store (`appstore`) provisioning profile,
    // which requires `production`. EAS production builds also set this env var
    // to `production`. Only a local/EAS `development` client build should use
    // the sandbox (`development`) entitlement — otherwise default to production.
    const isDevClient = process.env.EAS_BUILD_PROFILE === 'development';
    mod.modResults['aps-environment'] = isDevClient ? 'development' : 'production';
    return mod;
  });

  return config;
};
