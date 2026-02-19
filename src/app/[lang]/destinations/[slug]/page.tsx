import { Metadata } from "next";
import { LOCALE_NAMES, NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import DestinationCruisesPage from "@/components/DestinationCruisesPage";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale; slug: string }>;
}

export async function generateStaticParams() {
    return SUPPORTED_LOCALES.flatMap(lang =>
        // Return a few common destination slugs so they get pre-built
        ["togean-islands", "komodo-national-park", "labuan-bajo", "raja-ampat"].map(slug => ({
            lang,
            slug,
        }))
    );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        title: `${name} Cruises - COMODOCRUISE (${LOCALE_NAMES[lang] || "EN"})`,
        description: `Explore available cruise packages for ${name}, Indonesia.`,
    };
}

export default async function DestinationDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return <DestinationCruisesPage slug={slug} />;
}
