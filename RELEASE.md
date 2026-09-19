# React Native release builds

Run **Build release APK, AAB and IPA** in GitHub Actions on the React Native branch, selecting both platforms. Artifacts are attached to the workflow run; nothing is submitted to a store or published automatically. A tag must match app.json (currently v2.0.26).

- Android produces a release APK for installation and an AAB for Google Play, signed with the existing KEYSTORE_BASE64, STORE_PASSWORD, KEY_PASSWORD, KEY_ALIAS secrets.
- iOS produces an App Store IPA using the existing fastlane match and App Store Connect secrets. This IPA is for TestFlight/App Store upload, not direct installation on arbitrary iPhones.
- Both builds generate fresh native projects from Expo configuration. The archived local Flutter native folders are not used by a fresh checkout.
- Build numbers default to 1000 + workflow run number. Supply a higher unused number if either store already has it; a rerun retains the same number.
- If Apple signing reports a missing Sign in with Apple capability, enable it for com.gamearn in Apple Developer, then rerun with refresh_profiles enabled to renew the provisioning profile. The normal build reads existing profiles without changing them.

## Login validation before publishing

Apple and Facebook buttons are connected, token errors reach the screen, and profile navigation waits for authentication. The app uses the installed Expo AuthSession libraries for Google/Facebook, and native expo-apple-authentication on iOS. Expo Go does not support the configured Google/Facebook release redirects; use the signed app.

Test each provider with a real account in the signed build. Google Android browser OAuth can be rejected by Google's installed-app/custom-URI policy; if that occurs the supported native Google Sign-In SDK must replace AuthSession. The native Google/Facebook SDK packages are not declared in this checkout. No new dependencies were installed for this change.

Provider console requirements: enable each provider in Firebase; ensure Google OAuth clients belong to com.gamearn and the release signing certificate; allow the Facebook redirect fb1762055368454928://authorize in the provider configuration where supported. If Facebook rejects native custom redirects, its native SDK is required. Apple requires Sign in with Apple on the bundle ID and its distribution profile. Provider acceptance cannot be proven by compiling JavaScript.
