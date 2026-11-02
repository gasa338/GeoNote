/**
 * @module utils/id
 * @category Utilities
 */
import * as Crypto from 'expo-crypto';

/**
 * Creates a new random id (UUID v4), e.g. `"3f2b8c1e-…"`.
 * The same format Django uses for `UUIDField`, so records created offline
 * can later be sent to the server without changing their ids.
 */
export function newId(): string {
  return Crypto.randomUUID();
}
