import i18next, { type i18n as I18nInstance } from 'i18next';
import { useTranslation, type UseTranslationOptions } from 'react-i18next';
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

export const UI_NAMESPACE = 'ski-next-ui';

export const uiI18n: I18nInstance = i18next.createInstance();

void uiI18n.init({
  ns: [UI_NAMESPACE],
  defaultNS: UI_NAMESPACE,
  resources: {
    en: { [UI_NAMESPACE]: en },
    fr: { [UI_NAMESPACE]: fr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function useUiTranslation(options?: UseTranslationOptions<undefined>) {
  return useTranslation(UI_NAMESPACE, { i18n: uiI18n, ...options });
}
