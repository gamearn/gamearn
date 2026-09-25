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
        
        // Inject $RNFirebaseDisableSPM = true at the very top
        if (!contents.includes('$RNFirebaseDisableSPM')) {
          contents = `$RNFirebaseDisableSPM = true\n` + contents;
        }

        // Force dynamic linkage in Podfile
        if (!contents.includes('use_frameworks!')) {
          contents = contents.replace(
            /use_react_native!/,
            `use_frameworks! :linkage => :dynamic\n  use_react_native!`
          );
        } else if (contents.includes(':linkage => :static')) {
          contents = contents.replace(':linkage => :static', ':linkage => :dynamic');
        }

        fs.writeFileSync(podfilePath, contents, 'utf8');
      }
      return config;
    },
  ]);
};
