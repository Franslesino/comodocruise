import HomePage from "@/app/_pages/HomePage";
import { Metadata } from "next";
import { LOCALE_NAMES, NonDefaultLocale, SUPPORTED_LOCALES } from "@/lib/i18n";

interface PageProps {
    params: Promise<{ lang: NonDefaultLocale }>;
}

export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map((locale) => ({
        lang: locale,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang } = await params;
    
    return {
        title: `COMODOCRUISE - ${LOCALE_NAMES[lang] || "Explore the Ocean"}`,
        description: "Experience the ultimate sea expedition with ComodoCruise.",
    };
}

export default function Page() {
    return <HomePage />;
}
