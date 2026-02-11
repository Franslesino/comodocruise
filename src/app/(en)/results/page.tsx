import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Search Results - COMODOCRUISE",
    description: "Find your perfect sea voyage experience.",
};

export default function ResultsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-24">
            <div className="max-w-7xl mx-auto px-6">
                <h1 className="font-canto text-4xl text-neutral-900 mb-8">Search Results</h1>
                <p className="font-avenir text-neutral-600">
                    Results will be displayed here based on your search criteria.
                    Data will come from API.
                </p>
            </div>
        </div>
    );
}
