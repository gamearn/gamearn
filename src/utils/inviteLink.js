/**
 * In-memory capture of the referral code arriving via deep link.
 * Shared links are `https://gamearn.app/i/<CODE>` (universal) and
 * `gamearn://invite/<CODE>` (deep). Patterns matched here cover both,
 * plus bare `?code=` style query params, so the code can be prefilled
 * on the Profile Setup referral field regardless of link shape.
 */

let pendingCode = null;

export const parseInviteCode = (url) => {
  if (!url) return null;
  try {
    const clean = decodeURIComponent(String(url));
    const m =
      clean.match(/invite\/([0-9A-Za-z]{6,16})/) ||
      clean.match(/[?&](?:code|ref|invite)(?:=|\/)([0-9A-Za-z]{6,16})/) ||
      clean.match(/([0-9A-Za-z]{6,16})$/);
    return m ? m[1].toUpperCase() : null;
  } catch {
    return null;
  }
};

export const captureInviteCode = (url) => {
  const code = parseInviteCode(url);
  if (code) pendingCode = code;
  return code;
};

export const consumeInviteCode = () => {
  const code = pendingCode;
  pendingCode = null;
  return code;
};