/**
 * All languages in one place, plus small helpers that do not need React.
 *
 * Use {@link getDictionary} outside of screens (e.g. in the background task).
 * Inside screens use the `useT()` hook from `i18n/useT.ts`.
 *
 * @module i18n/dictionaries
 * @category Translations
 */
import type { Language } from '@/data/types';

import { en, type Dictionary } from './en';
import { sr } from './sr';

/** Every supported language and its texts. */
export const DICTIONARIES: Record<Language, Dictionary> = { en, sr };

/** Order in which languages appear in pickers (main language first). */
export const LANGUAGES: Language[] = ['en', 'sr'];

/** Returns the texts for a language. */
export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language];
}

/**
 * Formats a date and time for the given language,
 * e.g. "28 Oct 2026, 15:30" (en) or "28. okt 2026. 15:30" (sr).
 */
export function formatDateTime(isoDate: string, language: Language): string {
  const locale = language === 'sr' ? 'sr-Latn-RS' : 'en-GB';
  return new Date(isoDate).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats only the time, e.g. "15:30:12". */
export function formatTime(timestamp: number, language: Language): string {
  const locale = language === 'sr' ? 'sr-Latn-RS' : 'en-GB';
  return new Date(timestamp).toLocaleTimeString(locale);
}
