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

        // Inject post_install settings for non-modular includes & iOS 15.1 target
        const postInstallSnippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
`;
        if (contents.includes('post_install do |installer|')) {
          if (!contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
            contents = contents.replace(
              'post_install do |installer|',
              `post_install do |installer|${postInstallSnippet}`
            );
          }
        }

        fs.writeFileSync(podfilePath, contents, 'utf8');
      }
      return config;
    },
  ]);
};
