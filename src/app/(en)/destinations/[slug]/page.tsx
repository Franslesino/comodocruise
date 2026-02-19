import { Metadata } from "next";
import DestinationCruisesPage from "@/components/DestinationCruisesPage";
import { getDestinations } from "@/lib/api";

interface PageProps {
    params: Promise<{ slug: string }>;
}

const STATIC_DEST_SLUGS = [
    "togean-islands",
    "komodo-national-park",
    "labuan-bajo",
    "raja-ampat",
    "banda-sea",
    "wakatobi",
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
        title: `${name} Cruises - COMODOCRUISE`,
        description: `Explore available cruise packages for ${name}, Indonesia. Find the best liveaboard experiences with COMODOCRUISE.`,
    };
}

export default async function DestinationDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return <DestinationCruisesPage slug={slug} />;
}
