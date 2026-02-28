import { Metadata } from "next";
import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";

export const metadata: Metadata = {
    title: "Search Results - KOMODOCRUISES",
    description: "Find your perfect sea voyage experience.",
};

export default function ResultsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088F8F] mx-auto mb-4" />
                        <p className="font-avenir text-neutral-600">Loading results...</p>
                    </div>
                </div>
            }
        >
            <SearchResults showHero />
        </Suspense>
    );
}
