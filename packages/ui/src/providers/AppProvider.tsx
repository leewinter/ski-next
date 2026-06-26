import type { CSSProperties, ReactNode } from 'react';
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

const THEME_CSS_VARIABLES: Record<AppThemeMode, CSSProperties> = {
  default: {
    '--ski-next-color-primary': '#1677ff',
    '--ski-next-color-primary-text': '#fff',
    '--ski-next-color-text': '#1f1f1f',
    '--ski-next-color-text-muted': '#6f6f6f',
    '--ski-next-color-bg': '#fff',
    '--ski-next-color-bg-layout': '#f5f5f5',
    '--ski-next-color-bg-elevated': '#fff',
    '--ski-next-color-border': '#d9d9d9',
    '--ski-next-color-grid': '#e8e8e8',
    '--ski-next-color-grid-strong': '#cfcfcf',
    '--ski-next-color-header-bg': '#f5f5f5',
    '--ski-next-color-header-text': '#1f1f1f',
    '--ski-next-color-overlay-bg': 'rgba(31, 31, 31, 0.94)',
    '--ski-next-color-overlay-text': '#fff',
    '--ski-next-ski-cal-header-size': '72px',
    '--ski-next-ski-cal-event-thickness': '42px',
    '--ski-next-ski-cal-event-gap': '6px',
  } as CSSProperties,
  dark: {
    '--ski-next-color-primary': '#1668dc',
    '--ski-next-color-primary-text': '#fff',
    '--ski-next-color-text': '#f0f0f0',
    '--ski-next-color-text-muted': '#bfbfbf',
    '--ski-next-color-bg': '#141414',
    '--ski-next-color-bg-layout': '#000',
    '--ski-next-color-bg-elevated': '#1f1f1f',
    '--ski-next-color-border': '#424242',
    '--ski-next-color-grid': '#303030',
    '--ski-next-color-grid-strong': '#595959',
    '--ski-next-color-header-bg': '#1f1f1f',
    '--ski-next-color-header-text': '#f0f0f0',
    '--ski-next-color-overlay-bg': 'rgba(20, 20, 20, 0.96)',
    '--ski-next-color-overlay-text': '#f0f0f0',
    '--ski-next-ski-cal-header-size': '72px',
    '--ski-next-ski-cal-event-thickness': '42px',
    '--ski-next-ski-cal-event-gap': '6px',
  } as CSSProperties,
  compact: {
    '--ski-next-color-primary': '#1677ff',
    '--ski-next-color-primary-text': '#fff',
    '--ski-next-color-text': '#1f1f1f',
    '--ski-next-color-text-muted': '#6f6f6f',
    '--ski-next-color-bg': '#fff',
    '--ski-next-color-bg-layout': '#f5f5f5',
    '--ski-next-color-bg-elevated': '#fff',
    '--ski-next-color-border': '#d9d9d9',
    '--ski-next-color-grid': '#e8e8e8',
    '--ski-next-color-grid-strong': '#cfcfcf',
    '--ski-next-color-header-bg': '#f5f5f5',
    '--ski-next-color-header-text': '#1f1f1f',
    '--ski-next-color-overlay-bg': 'rgba(31, 31, 31, 0.94)',
    '--ski-next-color-overlay-text': '#fff',
    '--ski-next-ski-cal-header-size': '58px',
    '--ski-next-ski-cal-event-thickness': '34px',
    '--ski-next-ski-cal-event-gap': '4px',
  } as CSSProperties,
  skiidy: {
    '--ski-next-color-primary': '#ffd300',
    '--ski-next-color-primary-text': '#1d202f',
    '--ski-next-color-text': '#1d202f',
    '--ski-next-color-text-muted': '#6f6f6f',
    '--ski-next-color-bg': '#fffdf0',
    '--ski-next-color-bg-layout': '#f2f2f2',
    '--ski-next-color-bg-elevated': '#fff',
    '--ski-next-color-border': '#d8d2bb',
    '--ski-next-color-grid': '#eadfb8',
    '--ski-next-color-grid-strong': '#c7bea3',
    '--ski-next-color-header-bg': '#1d202f',
    '--ski-next-color-header-text': '#fff',
    '--ski-next-color-overlay-bg': 'rgba(29, 32, 47, 0.94)',
    '--ski-next-color-overlay-text': '#fff',
    '--ski-next-ski-cal-header-size': '72px',
    '--ski-next-ski-cal-event-thickness': '42px',
    '--ski-next-ski-cal-event-gap': '6px',
  } as CSSProperties,
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
  const cssVariables = useMemo(
    () => THEME_CSS_VARIABLES[themeMode],
    [themeMode],
  );

  return (
    <I18nextProvider i18n={uiI18n}>
      <ConfigProvider locale={antdLocale} theme={theme}>
        <div style={{ ...cssVariables, display: 'contents' }}>{children}</div>
      </ConfigProvider>
    </I18nextProvider>
  );
}
