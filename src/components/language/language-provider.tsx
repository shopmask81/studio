
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

type Language = 'en' | 'ar';

const translations = { en, ar };

type TranslationContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof en, replacements?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<TranslationContextType | undefined>(undefined);

const STORAGE_KEY = 'maskshop-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en'); // Default to 'en' on server and initial client render

  useEffect(() => {
    // This effect runs only on the client, after hydration
    const storedLanguage = (localStorage.getItem(STORAGE_KEY) as Language) || 'en';
    if (storedLanguage !== language) {
        setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  

  const t = useCallback((key: keyof typeof en, replacements?: Record<string, string | number>) => {
    let translation = translations[language][key] || translations['en'][key];
    
    if (replacements) {
        Object.entries(replacements).forEach(([key, value]) => {
            translation = translation.replace(`{${key}}`, String(value));
        });
    }
    
    return translation;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
        {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
