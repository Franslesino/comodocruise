"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Locale, getDictionary, createTranslator, DEFAULT_LOCALE } from "@/lib/i18n";

type TranslateFunction = (key: string, variables?: Record<string, string | number>) => string;

interface I18nContextValue {
    locale: Locale;
    t: TranslateFunction;
    dictionary: ReturnType<typeof getDictionary>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
    locale: Locale;
    children: ReactNode;
}

/**
 * I18nProvider - Provides locale context and translation function to all children
 */
export function I18nProvider({ locale, children }: I18nProviderProps) {
    const dictionary = getDictionary(locale);
    const t = createTranslator(locale);

    return (
        <I18nContext.Provider value={{ locale, t, dictionary }}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * useTranslation hook - Access the current locale and translation function
 */
export function useTranslation(): I18nContextValue {
    const context = useContext(I18nContext);
    
    if (!context) {
        console.warn("useTranslation called outside of I18nProvider, using default locale");
        return {
            locale: DEFAULT_LOCALE,
            t: createTranslator(DEFAULT_LOCALE),
            dictionary: getDictionary(DEFAULT_LOCALE),
        };
    }
    
    return context;
}

/**
 * useLocale hook - Just get the current locale
 */
export function useLocale(): Locale {
    const { locale } = useTranslation();
    return locale;
}

export default I18nProvider;
