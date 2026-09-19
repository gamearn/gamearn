const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveBuildNumber } = require('./release-version.cjs');
const config = {version: '2.0.26', android: {versionCode: 26}};
test('manual and automatic builds use higher valid store versions', () => {
  assert.equal(resolveBuildNumber({GITHUB_RUN_NUMBER: '40'}, config), '1040');
  assert.equal(resolveBuildNumber({REQUESTED_BUILD_NUMBER: '2050'}, config), '2050');
});
test('invalid, reused baseline, and overflow build numbers fail', () => {
  for (const n of ['0', '26', '1.1', ' 30', '2100000001', 'abc']) {
    assert.throws(() => resolveBuildNumber({REQUESTED_BUILD_NUMBER:n}, config));
  }
});
test('tag cannot silently build a different app version', () => {
  assert.throws(() => resolveBuildNumber({GITHUB_RUN_NUMBER:'40', GITHUB_REF_TYPE:'tag', GITHUB_REF_NAME:'v2.0.25'}, config));
  assert.equal(resolveBuildNumber({GITHUB_RUN_NUMBER:'40', GITHUB_REF_TYPE:'tag', GITHUB_REF_NAME:'v2.0.26'}, config), '1040');
});
test('Expo config applies the same build number to both platforms', () => {
  const original = process.env.BUILD_NUMBER;
  try {
    process.env.BUILD_NUMBER = '1040';
    const result = require('../../app.config')({config:{...config, ios:{bundleIdentifier:'com.gamearn'},plugins:[]}});
    assert.equal(result.android.versionCode,1040);
    assert.equal(result.ios.buildNumber,'1040');
    assert.equal(result.ios.usesAppleSignIn,true);
    process.env.BUILD_NUMBER = 'invalid';
    assert.throws(() => require('../../app.config')({config}));
  } finally {
    if (original === undefined) delete process.env.BUILD_NUMBER;
    else process.env.BUILD_NUMBER = original;
  }
});
