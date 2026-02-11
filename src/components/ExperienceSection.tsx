"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";

interface Experience {
    id: string;
    title: string;
    location: string;
    description: string;
    category: string;
    rating: number;
    price: string;
    image: string | null;
}

const experiences: Experience[] = [
    {
        id: "snorkeling-coral-garden",
        title: "Snorkeling at Pristine Coral Gardens",
        location: "Togean Islands",
        description: "Dive into crystal-clear waters and explore vibrant coral reefs teeming with tropical fish and marine life.",
        category: "Water Activity",
        rating: 4.95,
        price: "Rp650.000",
        image: "/public/destinations/kadidiri/experience.webp",
    },
    {
        id: "komodo-dragon-trek",
        title: "Komodo Dragon Trekking",
        location: "Komodo National Park",
        description: "Guided expedition to observe the legendary Komodo dragons in their natural habitat on Rinca Island.",
        category: "Wildlife",
        rating: 4.92,
        price: "Rp850.000",
        image: "/images/destinations/komodo-national-park-landscape.jpg",
    },
    {
        id: "sunset-kayaking",
        title: "Sunset Kayaking & Mangrove Tour",
        location: "Kadidiri Island",
        description: "Paddle through serene mangrove channels as the sky paints golden hues over the horizon.",
        category: "Water Activity",
        rating: 4.88,
        price: "Rp450.000",
        image: "/public/destinations/kadidiri/mood.webp",
    },
    {
        id: "village-cultural-visit",
        title: "Traditional Village Cultural Visit",
        location: "Malenge Island",
        description: "Immerse yourself in Bajo sea-nomad culture with traditional cooking, weaving, and storytelling.",
        category: "Cultural",
        rating: 4.90,
        price: "Rp350.000",
        image: "/public/destinations/malengue/experience.webp",
    },
    {
        id: "night-diving",
        title: "Night Diving with Bioluminescence",
        location: "Una-Una Island",
        description: "Experience the magical underwater glow as bioluminescent plankton light up around you in the dark waters.",
        category: "Water Activity",
        rating: 4.97,
        price: "Rp1.200.000",
        image: "/public/destinations/una-una/experience.webp",
    },
    {
        id: "island-hopping",
        title: "Full-Day Island Hopping Adventure",
        location: "Togean Archipelago",
        description: "Visit 4 stunning islands in one day — swim in jellyfish lake, explore hidden lagoons, and relax on white-sand beaches.",
        category: "Adventure",
        rating: 4.93,
        price: "Rp750.000",
        image: "/public/wildlife/sea/stingless-jellyfish/hero.webp",
    },
    {
        id: "fishing-local",
        title: "Traditional Fishing with Locals",
        location: "Walea Kodi",
        description: "Learn centuries-old fishing techniques from local fishermen and cook your catch over a beachside fire.",
        category: "Cultural",
        rating: 4.85,
        price: "Rp400.000",
        image: "/public/destinations/walea-kodi/experience.webp",
    },
    {
        id: "jungle-waterfall-trek",
        title: "Jungle Trek to Hidden Waterfall",
        location: "Bomba, Togean",
        description: "Hike through lush tropical jungle to discover a secluded waterfall surrounded by ancient trees and birdsong.",
        category: "Adventure",
        rating: 4.87,
        price: "Rp500.000",
        image: "/public/destinations/bomba/experience.webp",
    },
];

export default function ExperienceSection() {
    const { t } = useTranslation();
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 2);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [checkScroll]);

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector<HTMLElement>("[data-exp-card]")?.offsetWidth ?? 270;
        const gap = 16;
        const distance = (cardWidth + gap) * 2;
        el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
    };

    return (
        <section className="py-2 md:py-4 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <LocaleLink
                            href="/activities"
                            className="group inline-flex items-center gap-2"
                        >
                            <h2 className="font-canto text-2xl md:text-3xl text-neutral-900 group-hover:text-neutral-700 transition-colors">
                                {t("experience.title")}
                            </h2>
                            <svg className="w-5 h-5 text-neutral-900 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </LocaleLink>
                        <p className="font-avenir text-neutral-500 text-sm mt-1 max-w-xl">
                            {t("experience.subtitle")}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Scroll left"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Scroll right"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Horizontal scroll container */}
                <div className="relative">
                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {experiences.map((exp) => (
                            <LocaleLink
                                key={exp.id}
                                href={`/activities/${exp.id}`}
                                data-exp-card
                                className="group flex-shrink-0 w-[260px] sm:w-[270px]"
                            >
                                {/* Image */}
                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5">
                                    {exp.image ? (
                                        <Image
                                            src={exp.image}
                                            alt={exp.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="270px"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                            </svg>
                                        </div>
                                    )}
                                    {/* Category badge */}
                                    <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-800 px-2.5 py-1 rounded-full shadow-sm">
                                        {exp.category}
                                    </span>
                                </div>

                                {/* Info */}
                                <div>
                                    <h3 className="font-semibold text-[15px] text-neutral-900 leading-tight line-clamp-2 group-hover:text-teal-700 transition-colors">
                                        {exp.title}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
                                        {exp.location}
                                    </p>
                                    <p className="text-sm text-neutral-400 mt-0.5 line-clamp-2">
                                        {exp.description}
                                    </p>
                                    <p className="text-sm mt-1.5">
                                        <span className="font-semibold text-neutral-900">
                                            {exp.price}
                                        </span>
                                        <span className="text-neutral-500"> /{t("experience.perPerson")}</span>
                                        <span className="text-neutral-400 ml-1">·</span>
                                        <span className="text-neutral-700 ml-1">★ {exp.rating.toFixed(2)}</span>
                                    </p>
                                </div>
                            </LocaleLink>
                        ))}

                        {/* "View All" card */}
                        <LocaleLink
                            href="/activities"
                            className="group flex-shrink-0 w-[200px] sm:w-[210px] flex flex-col items-center justify-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                            <span className="font-semibold text-sm text-neutral-900 group-hover:text-teal-700 transition-colors">
                                {t("experience.viewAll")}
                            </span>
                        </LocaleLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
