import { NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import LocaleClientLayout from "./locale-client-layout";

/**
 * Locale Layout for non-English languages
 * Handles /de, /fr, /id, etc.
 */
export default function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: NonDefaultLocale }>;
}) {
    return (
        <LocaleClientLayout params={params}>
            {children}
        </LocaleClientLayout>
    );
}

// Generate static params for all supported locales
export function generateStaticParams() {
    return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}
