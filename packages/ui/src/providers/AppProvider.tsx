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
export type AppThemeMode = 'default' | 'dark' | 'compact' | 'skiidy';

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
  skiidy: {
    token: {
      colorPrimary: '#ffd300',
      colorInfo: '#2cade9',
      colorSuccess: '#368a55',
      colorWarning: '#f08a24',
      colorError: '#f04124',
      colorTextBase: '#1d202f',
      colorBgBase: '#fff',
      colorBgLayout: '#f2f2f2',
      colorBorder: '#ccc',
      borderRadius: 2,
      fontFamily:
        "Arial, Helvetica, 'Helvetica Neue', sans-serif",
    },
    components: {
      Button: {
        primaryColor: '#1d202f',
        primaryShadow: 'none',
      },
      Layout: {
        headerBg: '#1d202f',
        headerColor: '#fff',
        bodyBg: '#f2f2f2',
      },
      Menu: {
        darkItemBg: '#1d202f',
        darkItemSelectedBg: '#171a26',
        darkItemSelectedColor: '#ffd300',
      },
      Table: {
        headerBg: '#ffd300',
        headerColor: '#1d202f',
        rowHoverBg: '#fff8bf',
      },
    },
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
