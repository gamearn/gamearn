module.exports = ({ config }) => {
  const buildNumber = process.env.BUILD_NUMBER;
  if (buildNumber && (!/^[1-9]\d*$/.test(buildNumber) || Number(buildNumber) > 2100000000)) {
    throw new Error('BUILD_NUMBER must be a positive integer below 2100000001.');
  }
  return {
    ...config,
    android: { ...config.android, ...(buildNumber ? { versionCode: Number(buildNumber) } : {}) },
    ios: {
      ...config.ios,
      usesAppleSignIn: true,
      ...(buildNumber ? { buildNumber } : {}),
      ...(process.env.TEAM_ID ? { appleTeamId: process.env.TEAM_ID } : {}),
    },
    plugins: [...config.plugins, './plugins/withReleaseSigning'],
  };
};
