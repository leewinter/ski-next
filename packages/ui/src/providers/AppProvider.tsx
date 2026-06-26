import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import frFR from 'antd/locale/fr_FR';
import { I18nextProvider } from 'react-i18next';
import { uiI18n } from '../i18n';

export type SupportedLanguage = 'en' | 'fr';
export type AppThemeMode = 'default' | 'dark' | 'compact';

const ANTD_LOCALES: Record<SupportedLanguage, Locale> = {
  en: enUS,
  fr: frFR,
};

const ANTD_THEMES: Record<AppThemeMode, ThemeConfig> = {
  default: {},
  dark: {
    algorithm: antdTheme.darkAlgorithm,
  },
  compact: {
    algorithm: antdTheme.compactAlgorithm,
  },
};

export interface AppProviderProps {
  children: ReactNode;
  language?: SupportedLanguage;
  themeMode?: AppThemeMode;
}

export function AppProvider({
  children,
  language = 'en',
  themeMode = 'default',
}: AppProviderProps) {
  useEffect(() => {
    void uiI18n.changeLanguage(language);
  }, [language]);

  const antdLocale = useMemo(() => ANTD_LOCALES[language], [language]);
  const theme = useMemo(() => ANTD_THEMES[themeMode], [themeMode]);

  return (
    <I18nextProvider i18n={uiI18n}>
      <ConfigProvider locale={antdLocale} theme={theme}>
        {children}
      </ConfigProvider>
    </I18nextProvider>
  );
}
