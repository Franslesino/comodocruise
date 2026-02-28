import { Metadata } from "next";
import { LOCALE_NAMES, NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import DestinationAboutPage from "@/components/DestinationAboutPage";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale; slug: string }>;
}

export async function generateStaticParams() {
    const slugs = ["togean-islands", "komodo-national-park", "labuan-bajo", "bomba", "una-una", "walea-kodi", "malengue", "luwuk", "pulau-puah"];
    return SUPPORTED_LOCALES.flatMap(lang =>
        slugs.map(slug => ({ lang, slug }))
    );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        title: `${name} - KOMODOCRUISES (${LOCALE_NAMES[lang] || "EN"})`,
        description: `Discover ${name}, Indonesia — highlights, attractions, and available cruises.`,
    };
}

export default async function DestinationDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return <DestinationAboutPage slug={slug} />;
}
