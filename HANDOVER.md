# GAMEARN — Handover Notes

Handoff date: 2026-09-19 · Project root: `C:\Users\Mr. Victor\gamearn`

This is the **React Native (Expo) branch**. It talks to a real Node backend
(`https://api.gamearn.app`, local dev on port 4000) and Firebase. The Flutter
repo is archived at
`C:\Users\Mr. Victor\Desktop\Gamearn-handoff-archive-2026-09-13` (reference only;
the RN app is the active codebase).

---

## 1. Current state (do this first)

| Item | Status |
|---|---|
| Metro dev server | RUNNING, port 8081 (pid 10480), LAN `exp://192.168.0.100:8081` |
| JS bundle | Compiles OK (~11.7 MB, 200 OK, ~40–45 s) |
| Auth | Email/password + OTP fully works. Google partially (see §4). Apple/Facebook are stubs. |
| App version | 2.0.25, android versionCode 25 |
| Expo account | Logged in as username `gamearn` (owner added to `app.json`) |

### To restart the dev server
```
npx expo start --lan --port 8081
```
Then in Expo Go on the phone (same Wi-Fi) open: `exp://192.168.0.100:8081`
(PC LAN IP can change — re-check with `ipconfig`).

---

## 2. Key endpoints & config

- **Node backend**: default base URL in `src/config/appConfig.js` →
  `https://api.gamearn.app`. Local dev backend runs on port 4000.
- **Firebase project**: `gamearn-app`
  - apiKey `AIzaSyBV8HNGct-D1DdV0Eo4U1RzOhTJ4gw9d94`
  - `src/services/firebase.js`
- **Google OAuth client IDs** (`src/config/appConfig.js`):
  - web: `600025492198-dcnafmn9aoojtn1v983ntie0vt2musgn.apps.googleusercontent.com`
  - android: `600025492198-eo1a768ea7ffh7m398fqu0d99ohc034f`
  - ios: `600025492198-2g641acpvmhl1bm0m3f535kcodvhmt8k`
- Native config files:
  - `gamearn\android\app\google-services.json` — package **`com.gamearn`**
  - `gamearn\ios\Runner\GoogleService-Info.plist`
  - ⚠️ `app.json` android.package = **`com.gamearn.app`** — MISMATCH with
    google-services.json (`com.gamearn`). Reconcile before any native/EAS build.

---

## 3. Entry fees / wallet (kobo)

- Wallet balance is **kobo**: `userProfile.coins` / `walletBalance` = kobo.
- `ENTRY_FEES` (kobo) in `src/config/appConfig.js`:
  - whot/ludo/draughts: 10000 / 50000 / 200000
  - ayo: 5000 / 25000 / 100000

---

## 4. Auth — what works / what's blocked

- **Email/password + OTP**: fully wired (`src/context/AuthContext.js`,
  `src/services/firebase.js`, `src/services/api.js`). Test this first.
- **Google**: code was fixed to use the **web client ID + auth.expo.io proxy**
  when running in Expo Go (`Constants.executionEnvironment === 'storeClient'`,
  `src/context/AuthContext.js`). To finish:
  1. Google Cloud Console → project `gamearn-app` → APIs & Services →
     Credentials → **web client** (id ending `...dcnafmn9...`) →
     **Authorized redirect URIs** add:
     `https://auth.expo.io/@gamearn/gamearn`
  2. If still "Access blocked": put the test Google account in the OAuth
     consent screen's **Test users** list.
- **Apple**: stub ("coming soon"). Requires `expo-apple-authentication` +
  native dev build — **cannot work in Expo Go**.
- **Facebook**: stub. No FB app ID exists on this machine; needs
  `expo-auth-session/providers/facebook` + a Facebook developer app ID.

---

## 5. Keyboard fix (already applied)

`RegisterScreen.js` / `LoginScreen.js`:
- removed `flexGrow: 1` + `justifyContent: 'space-between'`
  (caused layout jump when keyboard opened)
- added `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`
- `GAInput.js` verified clean (no remount/key-recreate jank).

Earlier "keyboard going up/down" was actually a **crash loop**: the Google
auth hook threw on every App mount inside `AuthContext`, forcing Expo Go to
reload. That throw is fixed (clientId now resolves via `Google.js` fallback).

---

## 6. Testing checklist (once phone is connected)

1. Register via email → OTP verify → ProfileSetup
2. Login again with same email → lands on MainTabs
3. Buy Coins (Paystack) → wallet reflects in kobo
4. GameSection → lobby → choose tier → Whot **live match** → `match_found`
   → play → winner credited
5. Whot **practice** (server-validated)
6. Tournaments: `POST` writes a Firestore pending doc (TournamentPending);
   the leaderboard GET reads an **SQL table** — seed a row externally first.

---

## 7. Git / publishing (do NOT do unless asked)

- `eas.json`: production profile configured; Android upload uses
  `./service-account.json` (must exist before submit).
  iOS submit fields (`appleTeamId`, `ascAppId`, `appleId`) are EMPTY.
- Publish flow: `npx eas-cli login` → `eas build --profile production`
  (android/iOS) → `eas submit`.
- Fix `com.gamearn` vs `com.gamearn.app` mismatch before building.

---

## 8. Gotchas

- Windows PowerShell 5.1: no `&&`; chain with `;` + `if ($?)`.
- Metro bundling is slow (~45 s) — don't assume it's hung; poll the port.
- Expo Go Google flow only works via the proxy URL above; a production/dev
  build should use the native android/ios client IDs (code already branches on
  `IS_EXPO_GO`).
- `.expo\state.json` now holds the Expo login (username `gamearn`) — do not
  commit it.