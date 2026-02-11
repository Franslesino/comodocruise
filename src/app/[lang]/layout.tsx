import { NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import LocaleClientLayout from "./locale-client-layout";

/**
 * Locale Layout for non-English languages
 * Handles /de, /fr, /id, etc.
 */
export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    
    // Cast to NonDefaultLocale since we know from routing it's one of SUPPORTED_LOCALES
    const typedParams = Promise.resolve({ lang: lang as NonDefaultLocale });

    return (
        <LocaleClientLayout params={typedParams}>
            {children}
        </LocaleClientLayout>
    );
}

// Generate static params for all supported non-default locales
export function generateStaticParams(): { lang: NonDefaultLocale }[] {
    return SUPPORTED_LOCALES.map((lang) => ({ lang: lang as NonDefaultLocale }));
}
