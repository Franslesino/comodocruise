"use client";

import { I18nProvider } from "@/components/I18nProvider";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Locale } from "@/lib/i18n";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();
    
    // Check if we're on the homepage
    const isHomePage = pathname === "/" || pathname === "/en";

    // Set lang attribute on html element
    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = "ltr";
    }, [locale]);

    return (
        <I18nProvider locale={locale}>
            {isHomePage ? (
                // Homepage has its own Navbar and Footer
                children
            ) : (
                // Other pages get Navbar and Footer from layout
                <>
                    <Navbar />
                    <div style={{ paddingTop: '80px' }}>
                        {children}
                    </div>
                    <FooterSection />
                </>
            )}
        </I18nProvider>
    );
}
