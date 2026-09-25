const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFixFirebaseIOS(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf8');

        // 1. Inject $RNFirebaseDisableSPM = true and use_modular_headers! at the top
        if (!contents.includes('$RNFirebaseDisableSPM')) {
          contents = `$RNFirebaseDisableSPM = true\n` + contents;
        }
        if (!contents.includes('use_modular_headers!')) {
          contents = `use_modular_headers!\n` + contents;
        }

        // 2. Remove any invalid linkage overrides if present
        contents = contents.replace(/use_frameworks!\s*:linkage\s*=>\s*:dynamic/, 'use_frameworks! :linkage => :static');

        fs.writeFileSync(podfilePath, contents, 'utf8');
      }
      return config;
    },
  ]);
};
