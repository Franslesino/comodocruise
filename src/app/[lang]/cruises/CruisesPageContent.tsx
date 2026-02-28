import { Suspense } from "react";
import CruisesPage from "@/components/CruisesPage";

export default function CruisesPageContent() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088F8F] mx-auto mb-4" />
                        <p className="font-avenir text-neutral-600">Loading cruise packages...</p>
                    </div>
                </div>
            }
        >
            <CruisesPage />
        </Suspense>
    );
}
