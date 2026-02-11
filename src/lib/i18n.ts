/**
 * Static i18n module for Next.js App Router with static export
 * 
 * Supports:
 * - English at root "/" (no /en prefix)
 * - German at "/de"
 * - French at "/fr"
 * - Indonesian at "/id"
 * - And more...
 */

// Supported locales (excluding English which is at root)
export const SUPPORTED_LOCALES = ["de", "fr", "id", "es", "pt", "ru", "ja", "ko", "zh", "ar", "it", "tr"] as const;
export const ALL_LOCALES = ["en", "de", "fr", "id", "es", "pt", "ru", "ja", "ko", "zh", "ar", "it", "tr"] as const;
export const DEFAULT_LOCALE = "en" as const;

export type Locale = (typeof ALL_LOCALES)[number];
export type NonDefaultLocale = (typeof SUPPORTED_LOCALES)[number];

// Language display names
export const LOCALE_NAMES: Record<Locale, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    id: "Bahasa Indonesia",
    es: "Español",
    pt: "Português",
    ru: "Русский",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
    ar: "العربية",
    it: "Italiano",
    tr: "Türkçe",
};

// Static imports for dictionaries
import enDict from "@/locales/en.json";
import idDict from "@/locales/id.json";

const dictionaries: Record<Locale, typeof enDict> = {
    en: enDict,
    de: enDict, // Fallback to English for now
    fr: enDict,
    id: idDict,
    es: enDict,
    pt: enDict,
    ru: enDict,
    ja: enDict,
    ko: enDict,
    zh: enDict,
    ar: enDict,
    it: enDict,
    tr: enDict,
};

/**
 * Get dictionary for a locale (static import)
 */
export function getDictionary(locale: Locale): typeof enDict {
    return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

/**
 * Extract locale from pathname
 */
export function getLocaleFromPathname(pathname: string): Locale {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment as NonDefaultLocale)) {
        return firstSegment as Locale;
    }

    return DEFAULT_LOCALE;
}

/**
 * Strip locale prefix from pathname
 */
export function stripLocalePrefix(pathname: string): string {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && SUPPORTED_LOCALES.includes(firstSegment as NonDefaultLocale)) {
        const rest = segments.slice(1);
        return rest.length > 0 ? `/${rest.join("/")}` : "/";
    }

    return pathname;
}

/**
 * Add locale prefix to a path
 */
export function localizePath(pathname: string, locale: Locale): string {
    // First, strip any existing locale prefix
    const cleanPath = stripLocalePrefix(pathname);

    // For English, return clean path (no prefix)
    if (locale === DEFAULT_LOCALE) {
        return cleanPath;
    }

    // For other locales, add prefix
    if (cleanPath === "/") {
        return `/${locale}`;
    }

    return `/${locale}${cleanPath}`;
}

/**
 * Check if a locale is valid
 */
export function isValidLocale(locale: string): locale is Locale {
    return ALL_LOCALES.includes(locale as Locale);
}

/**
 * Get all alternate URLs for hreflang tags
 */
export function getAlternateUrls(pathname: string, baseUrl: string): { locale: Locale; url: string }[] {
    const cleanPath = stripLocalePrefix(pathname);

    return ALL_LOCALES.map((locale) => ({
        locale,
        url: `${baseUrl}${localizePath(cleanPath, locale)}`,
    }));
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
            current = (current as Record<string, unknown>)[key];
        } else {
            return path; // Return key if not found
        }
    }

    return typeof current === "string" ? current : path;
}

/**
 * Create a translation function for a given locale
 */
export function createTranslator(locale: Locale) {
    const dictionary = getDictionary(locale);

    return function t(key: string, variables?: Record<string, string | number>): string {
        let value = getNestedValue(dictionary as unknown as Record<string, unknown>, key);

        // Replace variables if provided
        if (variables) {
            Object.entries(variables).forEach(([varKey, varValue]) => {
                value = value.replace(new RegExp(`{{${varKey}}}`, "g"), String(varValue));
            });
        }

        return value;
    };
}
