"use client";

/**
 * HomePage - Main homepage component with all sections
 */

import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import PromoSection from "@/components/PromoSection";
import CruisePackagesSection from "@/components/CruisePackagesSection";
import DestinationSection from "@/components/DestinationSection";
import ExperienceSection from "@/components/ExperienceSection";
import TravelGuideSection from "@/components/TravelGuideSection";
import FooterSection from "@/components/FooterSection";
import BookingBarContainer from "@/components/BookingBarContainer";
import { useHashScroll } from "@/hooks/useHashScroll";

export default function HomePage() {
    useHashScroll();
    
    return (
        <>
            <Navbar />
            
            {/* Booking Bar Container - handles hero/header transition */}
            <BookingBarContainer />
            
            <main>
                {/* Hero Section with Booking Bar */}
                <Hero />

                {/* Promo Section - Special Offers */}
                <div id="promos" className="scroll-mt-24 md:scroll-mt-28">
                    <PromoSection />
                </div>

                {/* Cruise Packages Section */}
                <div id="cruise-packages" className="scroll-mt-24 md:scroll-mt-28">
                    <CruisePackagesSection />
                </div>

                {/* Destinations Section - Explore Indonesian Destinations */}
                <div id="destinations" className="scroll-mt-24 md:scroll-mt-28">
                    <DestinationSection />
                </div>

                {/* Experience Section */}
                <div id="experiences" className="scroll-mt-24 md:scroll-mt-28">
                    <ExperienceSection />
                </div>

                {/* Travel Guide & Updates */}
                <div id="travel-guide" className="scroll-mt-24 md:scroll-mt-28">
                    <TravelGuideSection />
                </div>

                {/* Footer */}
                <FooterSection />
            </main>
        </>
    );
}
