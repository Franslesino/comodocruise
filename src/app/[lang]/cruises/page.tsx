import { LOCALE_NAMES, NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import CruisesPageContent from "./CruisesPageContent";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale }>;
}

export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({
        lang: locale,
    }));
}

export default async function CruisesPage({ params }: PageProps) {
    const { lang } = await params;
    void lang;
    return <CruisesPageContent />;
}