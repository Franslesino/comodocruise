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
    image: string | null;
}

const experiences: Experience[] = [
    {
        id: "snorkeling-coral-garden",
        title: "Snorkeling at Pristine Coral Gardens",
        location: "Togean Islands, Central Sulawesi",
        description: "Glide through one of Earth's most biodiverse coral ecosystems — vivid with turtles, napoleon wrasse, and sea fans untouched by mass tourism.",
        category: "Diving & Snorkelling",
        rating: 4.95,
        image: "/public/destinations/kadidiri/experience.webp",
    },
    {
        id: "komodo-dragon-trek",
        title: "Komodo Dragon Trekking",
        location: "Komodo National Park, East Nusa Tenggara",
        description: "Walk alongside a UNESCO World Heritage ranger through Rinca Island's savannah, coming face-to-face with Komodo dragons up to 3 metres long.",
        category: "Wildlife",
        rating: 4.92,
        image: "/public/destinations/destination_rinca.webp",
    },
    {
        id: "sunset-kayaking",
        title: "Sunset Kayaking & Mangrove Tour",
        location: "Kadidiri Island, Togean Islands",
        description: "Paddle through ancient mangrove tunnels as kingfishers dart overhead, arriving at the open bay exactly at golden hour.",
        category: "Beach & Relaxation",
        rating: 4.88,
        image: "/public/destinations/kadidiri/mood.webp",
    },
    {
        id: "village-cultural-visit",
        title: "Bajo Sea-Nomad Village Immersion",
        location: "Bomba Village, Togean Islands",
        description: "Walk the boardwalks of a stilted sea-village, share a meal, and learn the centuries-old fishing traditions of the Bajo people.",
        category: "Cultural",
        rating: 4.90,
        image: "/public/local-community-1.webp",
    },
    {
        id: "night-diving",
        title: "Night Diving with Bioluminescence",
        location: "Una-Una Island, Gulf of Tomini",
        description: "Dive into darkness and watch the sea ignite — every movement trails blue fire as Una-Una's geothermal waters glow around you.",
        category: "Diving & Snorkelling",
        rating: 4.97,
        image: "/public/destinations/una-una/experience.webp",
    },
    {
        id: "island-hopping",
        title: "Full-Day Island Hopping Adventure",
        location: "Togean Archipelago, Central Sulawesi",
        description: "Swim in a stingless jellyfish lake, kayak a hidden lagoon, picnic on a deserted sandbar, and snorkel a coral wall at sunset — all in one day.",
        category: "Diving & Snorkelling",
        rating: 4.93,
        image: "/public/destinations/destination_pulau_puat.webp",
    },
    {
        id: "hiking-viewpoints",
        title: "Summit Hike & Panoramic Viewpoint",
        location: "Padar Island, Komodo National Park",
        description: "Conquer Padar Island's ridge at sunrise for a 360° panorama of three bays with pink, black, and white sand beaches stretching below.",
        category: "Trekking",
        rating: 4.94,
        image: "/public/destinations/destination_padar.webp",
    },
    {
        id: "traditional-fishing",
        title: "Traditional Fishing with Locals",
        location: "Walea Kodi, Central Sulawesi",
        description: "Join a local fisherman before dawn, cast hand-lines under the stars, then cook your catch over a coconut-husk fire on a private beach.",
        category: "Cultural",
        rating: 4.85,
        image: "/public/programs_real/traditional-fishing.png",
    },
    {
        id: "jungle-waterfall",
        title: "Jungle Trek to Hidden Waterfall",
        location: "Bomba, Togean Islands",
        description: "Hike through primary rainforest alive with hornbills and cuscus to a hidden cascade tumbling into a clear natural plunge pool.",
        category: "Trekking",
        rating: 4.87,
        image: "/public/destinations/bomba/experience.webp",
    },
    {
        id: "stargazing",
        title: "Open-Ocean Stargazing Night",
        location: "Open Sea, Gulf of Tomini",
        description: "Lie back on the upper deck far from any city light as the full Milky Way arches across the equatorial sky, guided by Indonesian coffee and constellation stories.",
        category: "Night Experience",
        rating: 4.96,
        image: "/public/programs/program-stargazing.webp",
    },
    {
        id: "sunbathing-beach",
        title: "Sunbathing on a Deserted Island",
        location: "Pulau Puah, Togean Islands",
        description: "A perfect crescent of white sand with zero other visitors — just you, the coconut palms, cold-pressed coconut water, and the open sea.",
        category: "Beach & Relaxation",
        rating: 4.89,
        image: "/public/destinations_real/destination_pulau_puah.webp",
    },
    {
        id: "wildlife-spotting",
        title: "Wildlife Spotting — Land & Sea",
        location: "Komodo & Togean Islands",
        description: "From hawksbill turtles surfacing at dusk to hornbills calling across the forest canopy at dawn — our naturalists know exactly where the wild things are.",
        category: "Wildlife",
        rating: 4.91,
        image: "/public/programs_real/wildlife-spotting.png",
    },
];

interface ExperienceSectionProps {
    embedded?: boolean;
}

export default function ExperienceSection({ embedded = false }: ExperienceSectionProps) {
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
                        {embedded ? (
                            <h2 className="font-canto text-2xl md:text-3xl text-neutral-900">
                                {t("experience.title")}
                            </h2>
                        ) : (
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
                        )}
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
                                href={`/activities#${exp.id}`}
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
                                        <span className="text-neutral-700">★ {exp.rating.toFixed(2)}</span>
                                    </p>
                                </div>
                            </LocaleLink>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
