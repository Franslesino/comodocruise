"use client";

import { useTranslation } from "./I18nProvider";

export default function Hero() {
    const { t } = useTranslation();

    return (
        <section id="hero-section" className="hero relative">
            {/* Background Video */}
            <video
                className="hero__video"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
            >
                <source src="/vidfootage.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Dark Overlay */}
            <div className="hero__overlay" />

            {/* Center Content */}
            <div className="absolute z-10 left-1/2 -translate-x-1/2 top-1/3 -translate-y-1/2 pointer-events-none w-full px-6 flex justify-center text-center">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="font-canto text-white text-4xl leading-snug sm:text-5xl lg:text-7xl lg:leading-snug max-w-[24ch] sm:max-w-[35ch] lg:max-w-[45ch] drop-shadow-lg pointer-events-auto">
                        KOMODOCRUISES
                    </h1>
                    <p className="font-avenir text-white/90 text-lg sm:text-xl lg:text-2xl max-w-[30ch] sm:max-w-[40ch] drop-shadow-md">
                        {t("hero.tagline")}
                    </p>
                </div>
            </div>

            {/* Booking Bar Portal Target */}
            <div id="hero-booking-container" className="absolute bottom-6 md:bottom-12 left-0 w-full flex justify-center z-[100] px-4 md:px-6 pointer-events-none" />

            {/* Sentinel for IntersectionObserver */}
            <div id="hero-sentinel" className="absolute bottom-0 left-0 w-full h-px pointer-events-none" />
        </section>
    );
}
