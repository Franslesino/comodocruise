import { SUPPORTED_LOCALES, NonDefaultLocale } from "@/lib/i18n";
import { fetchShips } from "@/lib/api";
import ShipDetailContent from "./ShipDetailContent";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale; slug: string }>;
}

// Static list of ship slugs for build-time generation
const STATIC_SHIP_SLUGS = [
    'derya-liveaboard',
    'zigzag',
    'zigzig',
];

export async function generateStaticParams() {
    try {
        const ships = await fetchShips();
        if (ships && ships.length > 0) {
            const params: { lang: string; slug: string }[] = [];
            for (const locale of SUPPORTED_LOCALES) {
                for (const ship of ships) {
                    params.push({ lang: locale, slug: ship.slug });
                }
            }
            return params;
        }
    } catch (error) {
        console.log('Using static ship slugs for build:', error);
    }
    
    // Return static list when API is unavailable (e.g., at build time)
    const params: { lang: string; slug: string }[] = [];
    for (const locale of SUPPORTED_LOCALES) {
        for (const slug of STATIC_SHIP_SLUGS) {
            params.push({ lang: locale, slug });
        }
    }
    return params;
}

export default async function ShipDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return <ShipDetailContent slug={slug} />;
}
