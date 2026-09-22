// REST client for the Gamearn Node backend.
// Decodes the stable envelope { success, data } | { success, error:{code,message} }.
// Sends the Firebase ID token as Authorization: Bearer <token>.

import { NODE_API_BASE, API_PREFIX } from '../config/appConfig';
import { getIdToken } from './firebase';

export class ApiError extends Error {
  constructor({ code = 'API_ERROR', message = 'Request failed', statusCode = 0, meta }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
  }
}

export function decodeApiResponse(statusCode, text) {
  let decoded;
  try {
    decoded = JSON.parse(text);
  } catch {
    throw new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'The server returned an invalid response.',
      statusCode,
    });
  }
  const json = decoded && typeof decoded === 'object' ? decoded : {};

  if (statusCode >= 200 && statusCode < 300 && json.success === true) {
    return json.data ?? null;
  }

  const e = json.error;
  throw new ApiError({
    code: e && typeof e.code === 'string' ? e.code : 'API_ERROR',
    message:
      e && typeof e.message === 'string'
        ? e.message
        : `Request failed (${statusCode})`,
    statusCode,
    meta: e?.meta,
  });
}

async function request(method, path, { body, auth = true, timeout = 20000 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    // auth may be { forceRefresh: true } to mint a fresh ID token (withdrawals).
    const forceRefresh = typeof auth === 'object' ? !!auth.forceRefresh : false;
    const token = await getIdToken(forceRefresh);
    if (!token) {
      throw new ApiError({
        code: 'AUTH_MISSING',
        message: 'Not signed in.',
        statusCode: 401,
      });
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${NODE_API_BASE}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    return decodeApiResponse(res.status, text);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError({
        code: 'TIMEOUT',
        message: 'The request timed out. Please try again.',
      });
    }
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Network error. Please try again.',
    });
  } finally {
    clearTimeout(timer);
  }
}

export const apiGet = (path, opts) => request('GET', path, opts);
export const apiPost = (path, body, opts) => request('POST', path, { ...opts, body });
export const apiPatch = (path, body, opts) => request('PATCH', path, { ...opts, body });

export const apiGetFresh = (path, opts) => request('GET', path, { ...opts, auth: { forceRefresh: true } });