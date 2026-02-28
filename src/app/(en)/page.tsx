import HomePage from "@/app/_pages/HomePage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "KOMODOCRUISES - Explore the Ocean",
    description: "Experience the ultimate sea expedition with KomodoCruises. Discover pristine waters and amazing marine life.",
    alternates: {
        canonical: "/",
        languages: {
            "en": "/",
            "de": "/de",
            "fr": "/fr",
            "id": "/id",
        },
    },
};

/**
 * English Homepage (root "/")
 */
export default function Page() {
    return <HomePage />;
}
