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
      clean.match(/invite\/([a-z0-9_]{3,32})/i) ||
      clean.match(/[?&](?:code|ref|invite)(?:=|\/)([a-z0-9_]{3,32})/i) ||
      clean.match(/([a-z0-9_]{3,32})$/i);
    return m ? m[1].toLowerCase() : null;
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