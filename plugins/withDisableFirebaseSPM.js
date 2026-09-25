const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withDisableFirebaseSPM(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf8');
        if (!contents.includes('$RNFirebaseDisableSPM')) {
          contents = `$RNFirebaseDisableSPM = true\n` + contents;
          fs.writeFileSync(podfilePath, contents, 'utf8');
        }
      }
      return config;
    },
  ]);
};
