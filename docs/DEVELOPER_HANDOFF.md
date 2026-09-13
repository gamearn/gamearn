# Gamearn Developer Handoff

## System map

The Flutter app lives in `gamearn`; the Node.js API lives in
`Backend_manager`. Production runs at `api.gamearn.app` on a DigitalOcean
droplet. Nginx terminates TLS and proxies to a Docker Compose stack containing
the API, PostgreSQL, and Redis. Firebase provides authentication, Firestore,
Storage, Messaging, Hosting, and small Cloud Functions.

```text
Flutter app
  |-- Firebase Auth/Firestore/Storage/Messaging
  |-- HTTPS REST ----------> api.gamearn.app/api/v1/*
  `-- authenticated Socket.IO --> api.gamearn.app
                                  |-- Node API
                                  |-- PostgreSQL (durable records)
                                  `-- Redis (sessions/match state/rate limits)
```

The Firebase UID is the cross-system user identifier. The mobile app supplies
a Firebase ID token in `Authorization: Bearer <token>`. Never trust a UID sent
only in a request body.

## Important flows

### Startup and authentication

The app shows its splash, initializes non-critical services in the background,
then routes from Firebase user state:

1. No user: landing/login.
2. Password user with unverified email: email OTP verification.
3. Missing Firestore profile: profile setup.
4. Admin profile: admin shell.
5. MFA requirement: MFA gate.
6. Otherwise: player shell.

Supported providers are email/password with server-issued email OTP, phone,
Google, Facebook, and Apple. Provider dashboard configuration is part of the
release checklist; enabling a Firebase provider alone does not guarantee that
its external OAuth dashboard is production-ready.

### Games

- Practice mode uses `/api/v1/practice`, `/practice/whot`, `/practice/ludo`,
  `/practice/ayo`, and `/practice/draughts` REST routes.
- Multiplayer matchmaking uses REST to queue/cancel and Socket.IO for room and
  move events.
- The server owns dice, legal moves, turns, results, and rewards. The client
  animates server state and must parse numeric JSON values defensively.
- A failed or expired session must leave controls recoverable and show a
  friendly retry action.

### Wallet and tournaments

Wallet balances and transactions must come from authoritative services. Never
substitute realistic-looking demo balances or transaction rows. Tournament
creation, registration, settlement, and prizes must go through authenticated
backend routes rather than direct client writes.

## Development rules

- Keep `api.gamearn.app` as the only production API base.
- Keep secrets out of Dart, JavaScript, documentation, screenshots, and Git.
- Use `ScreenUtil` and flexible constraints; verify compact, standard, tablet,
  landscape, and large-text layouts when changing UI.
- Comment contracts, invariants, security decisions, and state transitions.
  Avoid comments that repeat the next line of code.
- Add backend validation and tests before changing a request/response shape.
- Preserve the JSON envelope: `{ "success": true, "data": ... }` or
  `{ "success": false, "error": { "code": ..., "message": ... } }`.
- Raw provider/database errors are logged server-side and mapped to safe user
  messages in Flutter.

## CI and release

Required GitHub secret names include:

- Android/Firebase: `GOOGLE_SERVICES_JSON`, `DEBUG_KEYSTORE_BASE64`,
  `KEYSTORE_BASE64`, `STORE_PASSWORD`, `KEY_PASSWORD`, `KEY_ALIAS`
- Shared: `NODE_API_BASE`
- iOS/Firebase: `GOOGLE_SERVICE_INFO_PLIST`, `TEAM_ID`, `MATCH_PASSWORD`,
  `MATCH_GIT_BASIC_AUTHORIZATION`, `MATCH_REPO`
- App Store Connect: `APP_STORE_CONNECT_API_KEY_KEY_ID`,
  `APP_STORE_CONNECT_API_KEY_ISSUER_ID`,
  `APP_STORE_CONNECT_API_KEY_BASE64`

Secret values belong in the corresponding dashboard/password manager, not this
document. A push to `main` builds a debug APK. A `v*.*.*` tag creates Android
and iOS release artifacts. Confirm both workflows before distributing a build.

Release procedure:

1. Pull and verify a clean branch; review both repository diffs.
2. Run frontend analysis/tests and the complete backend lint/test suite.
3. Increment `pubspec.yaml` version and commit it with release notes.
4. Build a production-defined APK locally for device smoke testing.
5. Push the commit, then create and push the matching semantic version tag.
6. Confirm Android and iOS workflow artifacts and retain Android debug symbols.
7. Perform the post-release auth/game/wallet checklist below.

## Production operations

SSH access uses the owner-managed host alias `gamearn-prod`. The repository is
deployed at `/opt/gamearn`. Production uses `docker-compose.prod.yml`; do not
follow older PM2 or Render instructions.

Read-only triage:

```bash
ssh gamearn-prod
cd /opt/gamearn
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --since=15m api
curl -fsS https://api.gamearn.app/health
```

Deployment requires an explicit owner-approved release:

1. Capture `git status`, current commit, container status, and health response.
2. Stop if the server worktree contains unexplained changes.
3. Fetch the reviewed commit and rebuild only the intended service.
4. Wait for PostgreSQL, Redis, and API health checks.
5. Exercise health, authentication, practice start/roll/move, and matchmaking.
6. Roll back to the recorded commit and rebuild if smoke checks fail.

Never delete volumes during an application deployment. Database migrations must
be backward-compatible with the previous application version so rollback
remains possible.

## Smoke checklist

- Cold start completes once and routes correctly for each auth state.
- Email OTP, phone, Google, Facebook, and Apple return to the app correctly.
- Logout cannot return to an authenticated screen via Back.
- Whot hand scroll/fan layout works; Ludo roll/move/bot turns work; Ayo sowing
  works; Draughts orientation and legal moves work.
- Matchmaking can connect two authenticated accounts, reconnect, finish, and
  settle a result.
- Tournament creation and registration persist through the API.
- Empty wallet/profile/leaderboard states show real empty data, not samples.
- Light and dark themes remain readable at supported screen sizes.

## Deferred structural work

Several screens are intentionally large, especially the four game boards,
game setup, profile, wallet, and tournament flows. Split them only in focused
feature branches with golden/widget coverage. Do not combine those refactors
with release fixes.

