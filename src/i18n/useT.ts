/**
 * React hooks for translations.
 *
 * @example
 * ```tsx
 * const t = useT();
 * return <Text>{t.home.title}</Text>;
 * ```
 *
 * @module i18n/useT
 * @category Translations
 */
import type { Dictionary } from '@/i18n/en';
import { useAppStore } from '@/store/useAppStore';

import { getDictionary } from './dictionaries';

/** Returns the texts in the currently selected language. Re-renders when the language changes. */
export function useT(): Dictionary {
  const language = useAppStore((state) => state.settings.language);
  return getDictionary(language);
}

/** Returns the currently selected language code (`'en'` or `'sr'`). */
export function useLanguage() {
  return useAppStore((state) => state.settings.language);
}
