# Server integration progress

Baseline: developer commit 1f813c0. Earlier local work is preserved in recovery/local-corrections-20261010.

## Ayo
- Connected practice and multiplayer to shared server session controller.
- Board artwork and pit highlights retained; sowing animations consume server steps.
- Server determines turns, legal moves, bot moves, captures, clock and results.
- Removed local random coin toss and local result/streak writes from Ayo screens.
- Uses Firebase authenticated UID for room membership.
- Frontend: 9 regression checks passed. Backend Ayo rules/routes and clock: 60 passed in backend-timer-release.
- Deployment and device verification remain outstanding. These tests do not prove the production server is current.

## Whot
- Connected practice and multiplayer to the same shared server session controller used by Ayo.
- Card artwork, seats, Whot shape picker and chat retained; opponent hands render as counts only.
- Server determines turns, legality, special effects, bot turns, clock and winner (transitions paced ~650ms).
- Practice options now forward startCards/seats/timer through the practice API.

## Draughts
- Connected practice and multiplayer to the shared server session controller.
- 8x8 board artwork retained; server board maps onto the local engine board and taps translate to server coordinates.
- Server determines turns, mandatory captures, promotion, clock and winner; local AI is disabled in server modes.

## Remaining ordered work
1. Connect Ludo while preserving developer presentation changes. The app's Ludo is a 13x13, 44-square,
   two-dice reference variant that does not match the server's standard 56-square, single-die ruleset,
   so server-authoritative moves cannot render on the current board without a ruleset decision.
2. Wire and validate server-confirmed settings and starting-player presentation.
3. Replace client-computed results, balances and streaks with authoritative backend data.
4. Finish verified account editing.
5. Test all games on devices, including multiplayer, background/resume and result persistence. Whot and
   Draughts still need device verification and a check that the deployed backend matches these contracts.

Backend integration workspace: ../backend-timer-release. The main Backend_manager workspace contains separate unfinished work and has not been reset or overwritten.
