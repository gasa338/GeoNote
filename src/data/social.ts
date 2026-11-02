/**
 * The user's choices in the "Places nearby" / "Following" sections:
 * which public places they follow, which posts they saved or liked.
 *
 * Stored on the phone. Later this moves to the Django API together with
 * user accounts.
 *
 * @module data/social
 * @category Data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCIAL_STORAGE_KEY = 'geonote:social:v1';

/** Everything saved about the user's activity in the public sections. */
export interface SocialState {
  followedPlaceIds: string[];
  savedPostIds: string[];
  likedPostIds: string[];
}

/** First start: the two example places are already followed (like in the design). */
export const DEFAULT_SOCIAL: SocialState = {
  followedPlaceIds: ['atelje-krug', 'mala-polica'],
  savedPostIds: ['mala-polica-1'],
  likedPostIds: [],
};

/** Reads the saved state. */
export async function getSocial(): Promise<SocialState> {
  try {
    const json = await AsyncStorage.getItem(SOCIAL_STORAGE_KEY);
    return json ? { ...DEFAULT_SOCIAL, ...(JSON.parse(json) as Partial<SocialState>) } : DEFAULT_SOCIAL;
  } catch {
    return DEFAULT_SOCIAL;
  }
}

/** Saves the whole state. */
export async function saveSocial(state: SocialState): Promise<void> {
  await AsyncStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(state));
}

/** Adds the id if missing, removes it if present. Returns a new array. */
export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
