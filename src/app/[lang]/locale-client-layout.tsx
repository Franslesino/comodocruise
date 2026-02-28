"use client";

import { I18nProvider } from "@/components/I18nProvider";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { NonDefaultLocale } from "@/lib/i18n";
import { use, useEffect } from "react";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();

    // Check if we're on the homepage (e.g., /id, /de, /fr)
    const isHomePage = pathname === `/${lang}`;

    // RTL languages
    const rtlLocales = ["ar"];
    const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
    }, [locale, dir]);

    return (
        <I18nProvider locale={locale}>
            {isHomePage ? (
                // Homepage has its own Navbar and Footer
                children
            ) : (
                // Other pages get Navbar and Footer from layout
                <>
                    <Navbar />
                    <main>
                        {children}
                    </main>
                    <FooterSection />
                </>
            )}
        </I18nProvider>
    );
}