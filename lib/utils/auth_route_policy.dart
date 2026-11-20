enum AuthDestination {
  signedOut,
  verifyEmail,
  loadProfile,
  profileSetup,
  admin,
  player,
}

/// Pure authentication routing policy. Firebase streams gather the facts; this
/// function keeps the navigation decision deterministic and unit-testable.
AuthDestination authDestinationBeforeProfile({
  required bool hasUser,
  required bool isPasswordUser,
  required bool emailVerified,
  required bool hasEmail,
}) {
  if (!hasUser) return AuthDestination.signedOut;
  if (isPasswordUser && !emailVerified && hasEmail) {
    return AuthDestination.verifyEmail;
  }
  return AuthDestination.loadProfile;
}

AuthDestination authDestinationFromProfile({
  required bool profileExists,
  required bool isAdmin,
}) {
  if (!profileExists) return AuthDestination.profileSetup;
  return isAdmin ? AuthDestination.admin : AuthDestination.player;
}
