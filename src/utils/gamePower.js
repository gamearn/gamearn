/**
 * Utility to calculate Game Power (GP) and Value Points (VP) for Gamearn players.
 *
 * GP Formula:
 * - P = total games played
 * - W = games won
 * - L = games lost
 * - WR = W / P
 * - Experience Score = min(1, log10(P + 1) / 3)
 * - Game Power = Math.round(100 * (0.75 * WR + 0.25 * Experience Score))
 */

export function calculateGamePower(played = 0, wins = 0, losses = 0) {
  const P = Math.max(0, Number(played) || 0);
  const W = Math.max(0, Number(wins) || 0);

  if (P === 0) {
    return 0; // 0 GP when player has played 0 games
  }

  const WR = Math.min(1, Math.max(0, W / P));
  const expScore = Math.min(1, Math.log10(P + 1) / 3);

  const rawGP = 100 * (0.75 * WR + 0.25 * expScore);
  return Math.min(100, Math.max(0, Math.round(rawGP)));
}

export function formatGP(gpValue) {
  const val = typeof gpValue === 'number' && !isNaN(gpValue) ? gpValue : 0;
  return `${val} GP`;
}

export function calculateValuePoints(naira = 0, _played = 0, _wins = 0) {
  const n = Math.max(0, Number(naira) || 0);

  if (n <= 0) {
    return 0; // 0 VP when balance is 0
  }

  // 1 VP = N50 per product spec. VP is the wallet value denominated in N50 units.
  return Math.floor(n / 50);
}

export function formatVP(vpValue) {
  const val = typeof vpValue === 'number' && !isNaN(vpValue) ? vpValue : 0;
  return `${val.toLocaleString()} VP`;
}
