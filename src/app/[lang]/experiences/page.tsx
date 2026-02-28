import { Metadata } from "next";
import { LOCALE_NAMES, NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import ExperiencesPage from "@/components/ExperiencesPage";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale }>;
}

export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({
        lang: locale,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang } = await params;
    return {
        title: `Experiences - KOMODOCRUISES - ${LOCALE_NAMES[lang]}`,
        description: "Discover 12+ unforgettable experiences on our Indonesian liveaboard cruises.",
    };
}

export default async function ActivitiesPage({ params }: PageProps) {
    await params; // ensure params is resolved for static export
    return <ExperiencesPage />;
}