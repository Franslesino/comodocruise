import { Suspense } from "react";
import ShipDetail from "@/components/ShipDetail";
import { fetchShips } from "@/lib/api";

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Static list of ship slugs for build-time generation
const STATIC_SHIP_SLUGS = [
    'derya-liveaboard',
    'zigzag',
    'zigzig',
];

export async function generateStaticParams() {
    // Try to fetch from API, but use static list as fallback
    try {
        const ships = await fetchShips();
        if (ships && ships.length > 0) {
            return ships.map((s) => ({ slug: s.slug }));
        }
    } catch (error) {
        console.log('Using static ship slugs for build:', error);
    }
    
    // Return static list when API is unavailable (e.g., at build time)
    return STATIC_SHIP_SLUGS.map(slug => ({ slug }));
}

export default async function ShipDetailPage({ params }: PageProps) {
    const { slug } = await params;
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088F8F] mx-auto mb-4" />
                        <p className="font-avenir text-neutral-600">Loading ship details...</p>
                    </div>
                </div>
            }
        >
            <ShipDetail slug={slug} />
        </Suspense>
    );
}
