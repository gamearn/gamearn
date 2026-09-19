const { withAppBuildGradle } = require('expo/config-plugins');

// Expo's generated release variant otherwise uses its bundled debug key.
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') throw new Error('Expected a Groovy app/build.gradle');
    const marker = '// GAMEARN_RELEASE_SIGNING';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `
${marker}
if (System.getenv('GAMEARN_RELEASE_SIGNING') == 'true') {
    def required = ['ANDROID_KEYSTORE_PATH', 'STORE_PASSWORD', 'KEY_PASSWORD', 'KEY_ALIAS']
    required.each { key ->
        if (!System.getenv(key)) throw new GradleException('Missing release signing variable: ' + key)
    }
    android {
        signingConfigs {
            release {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('STORE_PASSWORD')
                keyPassword System.getenv('KEY_PASSWORD')
                keyAlias System.getenv('KEY_ALIAS')
            }
        }
        buildTypes {
            release { signingConfig signingConfigs.release }
        }
    }
}
`;
    }
    return mod;
  });
};
