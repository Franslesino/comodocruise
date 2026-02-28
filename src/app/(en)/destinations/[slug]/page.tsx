import { Metadata } from "next";
import DestinationAboutPage from "@/components/DestinationAboutPage";
import { getDestinations } from "@/lib/api";

interface PageProps {
    params: Promise<{ slug: string }>;
}

const STATIC_DEST_SLUGS = [
    "togean-islands",
    "komodo-national-park",
    "labuan-bajo",
    "bomba",
    "una-una",
    "walea-kodi",
    "malengue",
    "luwuk",
    "pulau-puah",
];

export async function generateStaticParams() {
    try {
        const dests = await getDestinations();
        if (dests && dests.length > 0) {
            return dests.map(d => ({
                slug: d.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            }));
        }
    } catch {
        // fall through to static list
    }
    return STATIC_DEST_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        title: `${name} - KOMODOCRUISES`,
        description: `Discover ${name}, Indonesia — highlights, attractions, and available cruises.`,
    };
}

export default async function DestinationDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return <DestinationAboutPage slug={slug} />;
}
