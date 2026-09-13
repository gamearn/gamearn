# Gamearn Mobile App

Gamearn is a Flutter mobile gaming platform for Whot, Ludo, Ayo, and
Draughts. The app supports Firebase authentication, bot practice, real-time
multiplayer, tournaments, wallet operations, premium features, referrals,
notifications, and English/French/Spanish localization.

Production API: `https://api.gamearn.app`

## Prerequisites

- Flutter 3.41.7 (stable) and Dart 3.11 or compatible versions
- Java 17 and the Android SDK
- Xcode and CocoaPods for iOS work
- Firebase CLI for hosting/functions changes
- Access to the `gamearn-app` Firebase project
- A local checkout of the Node backend when changing API or game contracts

## Local setup

```bash
flutter pub get
flutter gen-l10n
flutter run --dart-define=NODE_API_BASE=https://api.gamearn.app
```

Firebase platform files are intentionally not committed. Obtain them through
the project owner and place them at:

- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`

Never commit Firebase private configuration, signing keys, Apple `.p8` files,
or environment files.

`NODE_API_BASE` defaults to `https://api.gamearn.app`. Override it only for an
approved local or staging backend. Do not add a second production backend.

## Quality checks

```bash
flutter analyze --no-pub --no-fatal-infos
flutter test
flutter build apk --debug --dart-define=NODE_API_BASE=https://api.gamearn.app
```

Before a release, test authentication, all four practice games, multiplayer,
tournaments, and wallet error states on a compact phone and a larger device.
See [Developer handoff](docs/DEVELOPER_HANDOFF.md) for the complete checklist.

## Builds and releases

- Every push or pull request to `main` runs the debug Android workflow.
- A semantic version tag such as `v2.0.26` triggers signed Android AAB/APK and
  iOS IPA workflows.
- The tag must match the version in `pubspec.yaml`.
- CI injects platform configuration and signing data through GitHub Secrets.
- Release builds must set `NODE_API_BASE` to `https://api.gamearn.app`.

Do not overwrite or recreate credentials because a build fails. Diagnose the
specific workflow step and rotate credentials only with the project owner.

## Architecture

- `lib/screens`: feature UI and navigation flows
- `lib/services`: REST, Socket.IO, Firebase, ads, sound, language, and push
- `lib/models`: shared application models
- `lib/config`: build-time configuration
- `lib/theme` and `lib/widgets`: shared design system components
- `functions`: Firebase Cloud Functions
- `hosting`: public legal and account-deletion pages

The app uses Firebase Authentication as the identity authority. Firebase ID
tokens are sent to the Node API as Bearer tokens. Practice games use REST;
multiplayer uses authenticated Socket.IO sessions. Firestore stores user-facing
profile data, while authoritative wallet/game operations belong to the backend.

## UI conventions

- Initialize responsive sizing through the existing `ScreenUtilInit` design
  size of 390 x 844.
- Use `.w`, `.h`, `.sp`, `.r`, constraints, and flexible layout widgets.
- Do not use raw device dimensions as game rules or assume one phone aspect
  ratio.
- Reuse theme tokens and shared widgets instead of introducing local copies.
- Show friendly application errors; never expose Firebase, database, or stack
  trace text to users.

## Related documentation

- [Developer handoff and architecture](docs/DEVELOPER_HANDOFF.md)
- [Backend repository](../Backend_manager/README.md)
- [Design alignment plan](FIGMA_ALIGNMENT_PLAN.md) (local working document)
