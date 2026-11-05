import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption, translations } from '../i18n/translations';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'vaultstake_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as SupportedLanguage;
      }
      // Check browser language
      const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
      if (browserLang && SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
        return browserLang as SupportedLanguage;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, currentLanguage);
    } catch {
      // ignore
    }

    // Set document lang attribute and RTL for Arabic
    document.documentElement.lang = currentLanguage;
    if (currentLanguage === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let fallbackText: string | undefined = undefined;
    let interpolationParams: Record<string, string | number> | undefined = undefined;

    if (typeof fallbackOrParams === 'string') {
      fallbackText = fallbackOrParams;
      interpolationParams = params;
    } else if (fallbackOrParams && typeof fallbackOrParams === 'object') {
      interpolationParams = fallbackOrParams;
    }

    // Lookup in active language, fallback to English, fallback to provided fallback, fallback to key
    const langDict = translations[currentLanguage] || translations.en;
    let text = langDict[key] || translations.en[key] || fallbackText || key;

    // Parameter interpolation like {rate}
    if (interpolationParams) {
      Object.entries(interpolationParams).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages: SUPPORTED_LANGUAGES,
        currentLanguageOption,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
