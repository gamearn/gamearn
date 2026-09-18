# Adebayo dashboard — React Native JavaScript

This source kit recreates the supplied gaming dashboard with native text, layout,
buttons, gradients, navigation, dialogs and local state. It uses Expo and plain
JavaScript. It is not a production payment platform or a complete game engine.

## Run in a new app

Install Node.js LTS, then create Expo's **blank JavaScript** template:

```sh
npx create-expo-app@latest AdebayoApp --template blank
cd AdebayoApp
npx expo install expo-linear-gradient react-native-safe-area-context @react-native-async-storage/async-storage @expo/vector-icons
```

Copy `App.js`, `src/`, and `assets/reference.jpg` from this source kit into
`AdebayoApp/`, replacing the generated `App.js`. Keep the generated `package.json`,
`index.js`, and `app.json`; Expo generates mutually compatible dependency versions.
The generated entry file should import `App` from `./App` and register it with Expo.

```sh
npx expo start
```

Open the project with a compatible Expo Go version on your phone, or use an
Android emulator / iOS simulator. Native simulator testing is still required.
For an existing Expo Router app, use the `Dashboard` component in a route and
keep the app's existing safe-area provider rather than replacing its entry point.

## Files

- `App.js`: complete screen, four tabs, dialogs, native controls, scalable styles,
  artwork clipping component, loading state, and persistence wiring.
- `src/model.js`: pure state transitions, currency validation, streak rules,
  persisted-data validation, and sample leaderboard datasets.
- `src/art.js`: measured artwork regions from the supplied reference.
- `assets/reference.jpg`: supplied reference, bundled locally; no remote images.
- `tests/model.test.cjs`: state and validation tests; run with Node.js.

## Reference elements represented

The profile avatar, active member indicator, unread notification badge, settings
button, greeting, crown promotion, wallet balance and add button, flame and active
streak badge, all six milestone nodes and track, reward gift, information strip,
Play Now button, tournament badges/title/subtitle/trophy/prize/Join Now button,
four game cards and player counts, See All link, four leaderboard filters,
five player rows, and all four bottom tabs are included.

The actual operating system renders the clock, signal, battery, and home indicator.
The code does not fake these indicators. Safe area insets accommodate device cutouts.

The 590px reference measurements scale with screen width, capped at 650px on
tablets. Content scrolls on shorter screens; bottom navigation stays visible.
Native font rendering and emoji vary by platform. Exact pixel equality cannot be
promised from a flattened JPEG. Larger accessibility text can change line wrapping.

Artwork is reused through clipped `Image` windows, not newly generated. The
tournament's right-side artwork is composed behind editable native text. It is an
approximation of the original banner because separate clean design assets were
not supplied. For production fidelity and efficiency, replace the artwork windows
with individual high-resolution exports from your design source. The supplied
JPEG contains compression and background colors that cannot be cleanly separated.

## Interaction behavior

| Control | Implemented behavior |
| --- | --- |
| Avatar / Profile | Opens profile; edits and saves display name |
| Bell | Displays sample notifications and clears unread dot |
| Settings | Saves sound and notification preferences locally |
| More Games / Bigger Rewards | Opens games and rewards menu |
| Wallet balance | Opens Wallet tab |
| Plus / Add funds | Validates amount, adds virtual funds and transaction history |
| Streak card / milestones | Explains milestones and qualifying activity |
| Reward gift | Shows locked/unlocked/claimed state; one-time local claim |
| Play Now / See All | Opens the game chooser |
| Each game card | Opens that game's lobby and an explicitly labelled dice demo |
| Join Now | Opens entry details and saves free demo registration |
| Daily / Weekly / Monthly / Yearly | Switches and sorts seeded ranking datasets |
| Leaderboard row | Opens that player's statistics |
| Home / Tournaments / Wallet / Profile | Switches complete tab content |
| Dialog close / backdrop / Android back | Dismisses the dialog |

Demo wallet deposits accept ₦100–₦1,000,000 with at most two decimal places.
Amounts are stored in integer kobo. Rapid duplicate submission is guarded.
The sample initial balance is ₦1,250.00; the displayed +500 weekly units and
player/win counts are reference fixtures, not computed live statistics.

The dice challenge is **not Ludo, Ayo, Whot, or Draft**. It exists to demonstrate
the game's completion-to-streak interaction. A roll of 4–6 completes it. The first
completion increments the seeded 15-day streak, repeated completions on that local
calendar day do not increment it, consecutive days advance it, and missing a day
resets it on the next completion. The 30-day reward is an achievement flag, not a
cash payment. Local device dates are for demonstration only.

Changes save through AsyncStorage under `@adebayo-dashboard/v1`. Writes are
serialized so rapid changes retain their order. Storage failures are shown on
screen; malformed persisted data is validated before use.

## Connecting your real app

Replace these demo boundaries with authenticated backend operations:

1. **Wallet:** replace `addFunds` with payment intent creation, your payment SDK,
   server-side payment verification, and a fresh server balance/ledger fetch.
   Never treat the local reducer or device storage as authoritative money.
2. **Games:** replace the `game` dialog with navigation into your actual game
   screens/engines. Successful server-verified completion should refresh streak
   data; opening a lobby must not count as playing.
3. **Streak/rewards:** calculate dates and eligibility on the server and make
   reward claims idempotent. Replace `COMPLETE_DEMO` and `CLAIM` with API results.
4. **Tournaments:** replace local `JOIN` with registration, eligibility/capacity
   checks, and lobby/matchmaking. The reference provides no schedule or entry fee;
   this demo invents no paid tournament contract.
5. **Leaderboards/presence:** replace `leaderboard()` and game player counts with
   server responses for each selected period, with loading/error/empty states.
6. **Profile/auth:** load the signed-in user's name and avatar from your session.
7. **Notifications/audio:** wire the saved preferences to OS notification
   permission and push delivery, and to the game engine's audio manager. The
   switches currently store preferences only; they do not deliver push or audio.

## Verification

```sh
node --test tests/model.test.cjs
```

The state tests cover currency precision and rejected deposits, duplicate deposits,
streak day deduplication and gaps, leap years, reward eligibility, persisted-state
validation, registration, notification state, profile edits, and ranking periods.

Delivery checks: all 12 state tests passed. Babel successfully parsed `App.js`,
`src/art.js`, and `src/model.js`, including JSX. These checks do not substitute
for native rendering or interaction tests.

Before shipping, run on both iOS and Android and check small screens, keyboard
avoidance, safe areas, scrolling, large fonts, and screen-reader labels. Test every
dialog and tab, close/relaunch for persistence, and verify the artwork against
your original design. This delivery has not been verified in a native simulator.

## Official setup references

- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/versions/latest/sdk/linear-gradient/
- https://docs.expo.dev/develop/user-interface/safe-areas/
- https://docs.expo.dev/versions/latest/sdk/async-storage/
- https://reactnative.dev/docs/pressable
- https://reactnative.dev/docs/modal
