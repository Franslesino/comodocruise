"use client";

import { I18nProvider } from "@/components/I18nProvider";
import { NonDefaultLocale } from "@/lib/i18n";
import { use, useEffect } from "react";

interface LocaleClientLayoutProps {
    children: React.ReactNode;
    params: Promise<{ lang: NonDefaultLocale }>;
}

/**
 * Client-side locale layout wrapper
 */
export default function LocaleClientLayout({ children, params }: LocaleClientLayoutProps) {
    const { lang } = use(params);
    const locale = lang || "en";

    // RTL languages
    const rtlLocales = ["ar"];
    const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
    }, [locale, dir]);

    return (
        <I18nProvider locale={locale}>
            {children}
        </I18nProvider>
    );
}