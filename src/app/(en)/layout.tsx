"use client";

import { I18nProvider } from "@/components/I18nProvider";
import { Locale } from "@/lib/i18n";
import { useEffect } from "react";

/**
 * English (default) Layout
 * 
 * This layout wraps all pages at the root "/" without any locale prefix.
 * English is the default language.
 */
export default function EnglishLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale: Locale = "en";

    // Set lang attribute on html element
    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = "ltr";
    }, [locale]);

    return (
        <I18nProvider locale={locale}>
            {children}
        </I18nProvider>
    );
}
