# Ludo reference screen — React Native JavaScript

Complete screen source and a playable **local, four-player, two-dice variant**.
The board is drawn with SVG; pieces and dice are dynamic. This is a separate app
from the previous Adebayo dashboard source kit.

## Setup

```sh
npx create-expo-app@latest LudoApp --template blank
cd LudoApp
npx expo install react-native-svg expo-linear-gradient react-native-safe-area-context @expo/vector-icons @react-native-async-storage/async-storage
```

Copy `App.js`, `src/`, and `assets/reference.jpg` from this kit into the generated
project, replacing its `App.js`. Keep the generated package.json and entry file;
the blank template supplies compatible Expo/React/React Native versions.

```sh
npx expo start
```

Use Expo Go or a native development build. This source kit has no pinned package
manifest: the official template and `expo install` select compatible versions.

## Source files

- `App.js`: screen composition, four players, both dice, controls, rules/menu/
  settings/chat/player dialogs, timer lifecycle, daily bonus persistence.
- `src/Board.js`: native SVG board, colored lanes, center crown, movable pieces,
  selection highlights, stacked-piece separation, accessible move targets.
- `src/engine.js`: deterministic reducer, two dice, legal moves, captures, safe
  squares, home lanes, exact finish, win, turn order, undo and hints.
- `assets/reference.jpg`: the supplied image, used for decorative artwork windows.
- `tests/engine.test.cjs`: tests with Node's built-in test runner.

## Design fidelity

The square blue/purple layout, logo, four avatars/player panels, crowns and token
indicators, Room 458721 / 4/4, daily bonus gift/countdown, side slogans, board and
center crown, timer, Rules, Chat, dice tray, Undo, Roll Dice and Hint are represented.
The supplied logo, avatars, gift and slogans are displayed using clipped windows
of the original image. All gameplay and changing values are live components.

The board preserves the reference's **five-cell arms** using a 13×13 logical grid.
It is deliberately not silently replaced by standard Ludo's 15×15 board. Its
display is compressed vertically to match the reference proportions. SVG tokens
move with the board and remain tappable. Finished tokens disappear into the center
and their player-panel indicators become white.

The UI scales as a single square, capped at 1000dp and at least 360dp wide. Small
viewports may scroll; iOS also supports scroll-view zoom. A status line and larger
alternative move buttons appear below the reference composition to make the
scaled board playable on small phones. The status line is an intentional usability
addition. On tablets the artwork is clearer and the board easier to tap.

Exact pixels, original fonts, clean transparent artwork and cross-platform image
quality cannot be recovered from a flat JPEG. Separate source assets are needed
for a production-perfect reproduction. The current board, icons, player-panel
gradients, and dice are native approximations; the screenshot is not used as a
static full-screen background.

## Implemented rules

The screenshot specifies no game rules. These explicit rules resolve that gap:

1. Red → green → blue → yellow, four people sharing one device.
2. Roll two six-sided dice. Choose either unused die, then a highlighted token.
3. Six releases a yard token, consuming that die; it does not also move six cells.
4. Each token uses 43 positions on a 44-cell outer ring, four private lane cells,
   then the center. Finishing requires an exact roll.
5. Landing on opponents captures them unless the destination is safe. Stars and
   starting squares are safe. Stacks do not block passage. All opponents on an
   unsafe destination return to their yards.
6. A roll containing a six grants one extra turn. No three-sixes penalty, and no
   extra turns for captures/finishes. Unusable dice are skipped when no moves remain.
7. A player wins by finishing all four tokens.
8. 2:45 per turn. Timeout forfeits unused dice and clears undo history. Menus and
   backgrounding pause the local timer. A new turn receives a fresh 2:45.

`engine.js` is the place to change rules. Game logic has no dependency on React.
Random rolls are supplied by the UI with Math.random, appropriate for local play,
not competitive or money-backed play.

## Controls

| Element | Behavior |
| --- | --- |
| Menu / Room | Opens local room details, resume, new-game confirmation, rules |
| Settings | Enables/disables hints; restart confirmation |
| Player panels | Show current-player and token statistics |
| Roll Dice | Rolls both dice; disabled while resolving a roll |
| Each die | Selects that unused die; selected die has yellow border |
| Highlighted token | Executes the legal move for the selected die |
| Alternative move buttons | Execute the same moves with larger tap targets |
| Undo | Restores previous roll/move, including dice, captures and player |
| Hint | Recommends finish, capture, yard release, then most advanced move |
| Rules | Full explanation of this reference-board variant |
| Chat | Local messages attributed to the active player, 280-character limit |
| Daily Bonus | Persistent countdown, claim 100 local coins every 24 hours |
| Win state | Announces winner; Roll Dice becomes New Game |

The initial bonus wait is 02:14:33, matching the reference; it is saved so relaunching
does not restart the countdown. Coins are local practice points with no cash value.
Only bonus data persists. Current match, chat and hint preference reset on app
restart. Undo retains the last 40 roll/move snapshots, and is a practice feature.

## Online integration boundaries

Room 458721 and 4/4 describe four local seats, not an active network room. Online
play requires authentication, room creation/joining, authoritative server dice and
move validation, matchmaking, synchronized clocks, reconnect handling and network
chat. Replace the UI dispatch boundary with server commands and validated state
updates. Disable local undo for competitive play. Server timestamps and an
idempotent reward endpoint must replace device-controlled bonus eligibility.

No real-money transactions, network messages, or remote notifications occur.

## Validation

```sh
node --test tests/engine.test.cjs
```

Tests cover geometry, dice, yard entry, legal moves, captures/safe squares, finishing,
turn order, undo, timeout, pause, hints and wins. Native simulator/device rendering
and touch testing are still required. Check iOS and Android, small/large screens,
rotations, background/resume, keyboard/chat, overlapping tokens and font scaling.

Delivery checks: all 16 engine tests passed. Babel parsed `App.js`, `src/Board.js`,
and `src/engine.js` successfully. No native rendering test was performed.

Official references:

- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/versions/latest/sdk/svg/
- https://docs.expo.dev/versions/latest/sdk/linear-gradient/
- https://reactnative.dev/docs/usewindowdimensions
