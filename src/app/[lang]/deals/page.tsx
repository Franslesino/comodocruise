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
        title: `Special Deals - KOMODOCRUISES - ${LOCALE_NAMES[lang]}`,
        description: "Discover exclusive cruise deals and special offers for Indonesian destinations.",
    };
}

export default async function DealsPage({ params }: PageProps) {
    const { lang } = await params;
    
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        Special Deals
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
                        Discover exclusive cruise deals and special offers for Indonesian destinations. 
                        More deals coming soon!
                    </p>
                    
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🚢</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Coming Soon
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We're working on bringing you the best cruise deals. Check back soon or go back to our homepage to explore current offers.
                        </p>
                        <a 
                            href={`/${lang}`}
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}