const fs = require('fs');
const { expo } = require('../../app.json');
function resolveBuildNumber(env, config = expo) {
  const value = env.REQUESTED_BUILD_NUMBER || String(1000 + Number(env.GITHUB_RUN_NUMBER));
  if (!/^[1-9]\d*$/.test(value) || Number(value) <= config.android.versionCode || Number(value) > 2100000000) {
    throw Error('Use an unused numeric build number greater than app.json android.versionCode.');
  }
  if (env.GITHUB_REF_TYPE === 'tag' && env.GITHUB_REF_NAME !== `v${config.version}`) {
    throw Error('Release tag must match app.json version.');
  }
  return value;
}
module.exports = { resolveBuildNumber };
if (require.main === module) {
  const value = resolveBuildNumber(process.env);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_number=${value}\n`);
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `Building Gamearn ${expo.version} (${value}) from ${process.env.GITHUB_SHA}.\n\nDownload APK/AAB/IPA from this run's Artifacts. No store upload or public release is performed.\n`);
}
