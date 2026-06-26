import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import frFR from 'antd/locale/fr_FR';
import { I18nextProvider } from 'react-i18next';
import { uiI18n } from '../i18n';

export type SupportedLanguage = 'en' | 'fr';

const ANTD_LOCALES: Record<SupportedLanguage, Locale> = {
  en: enUS,
  fr: frFR,
};

export interface AppProviderProps {
  children: ReactNode;
  language?: SupportedLanguage;
}

export function AppProvider({ children, language = 'en' }: AppProviderProps) {
  useEffect(() => {
    void uiI18n.changeLanguage(language);
  }, [language]);

  const antdLocale = useMemo(() => ANTD_LOCALES[language], [language]);

  return (
    <I18nextProvider i18n={uiI18n}>
      <ConfigProvider locale={antdLocale}>{children}</ConfigProvider>
    </I18nextProvider>
  );
}
