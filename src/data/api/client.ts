/**
 * HTTP client for the **future Django REST API**. Not used yet.
 *
 * Prepared so that connecting the backend later is easy:
 * replace the bodies of the functions in `data/zones.ts` with calls to {@link apiRequest}.
 *
 * Expected endpoints (Django REST Framework + simplejwt):
 * ```
 * POST   /api/auth/token/            → { access, refresh }
 * POST   /api/auth/token/refresh/    → { access }
 * GET    /api/zones/                 POST  /api/zones/
 * GET    /api/zones/{id}/            PATCH /api/zones/{id}/     DELETE /api/zones/{id}/
 * ```
 *
 * @module data/api/client
 * @category Django API (later)
 */

/** Server address. Set `EXPO_PUBLIC_API_URL` in `.env` (10.0.2.2 = your PC from the Android emulator). */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api';

/** Thrown when the server answers with an error status (400, 401, 500…). */
export class ApiError extends Error {
  /** HTTP status code. */
  status: number;
  /** Parsed JSON body of the error response (Django validation errors are here). */
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * The JWT access token sent with every request.
 * Later: after login, store it with `expo-secure-store` and call {@link setAuthToken}.
 */
let authToken: string | null = null;

/** Sets (or clears with `null`) the token used by {@link apiRequest}. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Options for {@link apiRequest}. */
export interface ApiRequestOptions {
  /** HTTP method, default `GET`. */
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Request body; sent as JSON. */
  body?: unknown;
  /** Query string parameters, e.g. `{ place: '…' }` → `?place=…`. */
  query?: Record<string, string>;
}

/**
 * Sends one request to the API and returns the parsed JSON.
 *
 * @example
 * ```ts
 * const places = await apiRequest<PlaceDTO[]>('/places/');
 * await apiRequest(`/places/${id}/`, { method: 'DELETE' });
 * ```
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  // Build the full URL, e.g. https://server/api + /places/ + ?place=…
  const url = new URL(API_URL.replace(/\/$/, '') + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // 204 No Content (e.g. after DELETE) has no body.
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}
