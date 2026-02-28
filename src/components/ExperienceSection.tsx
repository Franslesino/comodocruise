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

// ── KOMODO NATIONAL PARK TRIP stops ──────────────────────────────────────
const experiences: Experience[] = [
    {
        id: "rinca-island",
        title: "Rinca Island — Komodo Dragon Trek",
        location: "Komodo National Park",
        description: "Home to 1,500+ wild Komodo dragons, Rinca is where you walk guided trails metres away from the world's largest living lizard. Rangers-only access keeps it raw and real.",
        category: "Komodo Trip",
        rating: 4.93,
        image: "/public/destinations/destination_rinca.webp",
    },
    {
        id: "padar-island",
        title: "Padar Island — Sunrise Summit",
        location: "Komodo National Park",
        description: "A 30-minute hike to the ridge rewards you with one of Indonesia's most iconic views — three sweeping bays with pink, black, and white sand beaches all at once.",
        category: "Komodo Trip",
        rating: 4.96,
        image: "/public/destinations/destination_padar.webp",
    },
    {
        id: "pink-beach",
        title: "Pink Beach — Rare Coral Sand",
        location: "Komodo National Park",
        description: "One of only 7 pink-sand beaches in the world. The blush colour comes from red coral fragments mixing with white sand. Snorkelling here reveals some of the richest reefs in the park.",
        category: "Komodo Trip",
        rating: 4.91,
        image: "/public/destinations/destination_pink_beach.webp",
    },
    {
        id: "manta-point",
        title: "Manta Point — Dive with Giants",
        location: "Komodo National Park",
        description: "A cleaning station frequented by oceanic manta rays with wingspans up to 7 metres. Drift alongside these gentle giants as they spiral through the current above the reef.",
        category: "Komodo Trip",
        rating: 4.97,
        image: "/public/destinations/destination_manta_point.webp",
    },
    {
        id: "komodo-island",
        title: "Komodo Island — The Dragon's Home",
        location: "Komodo National Park",
        description: "The island that gave Komodo dragons their name. Walk the original ranger trails of this UNESCO World Heritage site — volcanic, wild, and utterly unlike anywhere else on Earth.",
        category: "Komodo Trip",
        rating: 4.94,
        image: "/public/destinations/dest-komodo.png",
    },
    // ── LABUAN BAJO TRIP stops ────────────────────────────────────────────────
    {
        id: "labuan-bajo-town",
        title: "Labuan Bajo — Gateway Harbour",
        location: "Labuan Bajo, East Nusa Tenggara",
        description: "The departure point for all Komodo adventures. Watch the sun sink behind the islands from the waterfront, browse the fish market, or explore the harbour town before setting sail.",
        category: "Labuan Bajo Trip",
        rating: 4.87,
        image: "/public/destinations/destination_labuan_bajo.webp",
    },
    {
        id: "kelor-island",
        title: "Kelor Island — Snorkel & Relax",
        location: "Labuan Bajo, East Nusa Tenggara",
        description: "A tiny island just 30 minutes from Labuan Bajo with brilliant hard coral gardens, a gentle beach slope, and a grassy hill that offers a sweeping view of the surrounding bay.",
        category: "Labuan Bajo Trip",
        rating: 4.88,
        image: "/public/destinations/dest-labuan-bajo.png",
    },
    {
        id: "batu-bolong",
        title: "Batu Bolong — Wall Diving",
        location: "Labuan Bajo, East Nusa Tenggara",
        description: "A seamount rising from the deep that is regarded as one of the best dive sites in the world. The sheer wall drops 90 metres and is alive with over 1,000 species of fish.",
        category: "Labuan Bajo Trip",
        rating: 4.95,
        image: "/public/programs/program-snorkeling-diving.webp",
    },
    {
        id: "gili-lawa",
        title: "Gili Lawa — Sunset Anchorage",
        location: "Labuan Bajo, East Nusa Tenggara",
        description: "Anchor in the calm bay of Gili Lawa Darat as the sky turns gold. Trek to the hilltop for a 360° panorama of the Komodo archipelago spreading out in every direction.",
        category: "Labuan Bajo Trip",
        rating: 4.90,
        image: "/public/programs/program-hiking-viewpoints.webp",
    },
    {
        id: "kalong-island",
        title: "Kalong Island — Flying Fox Exodus",
        location: "Labuan Bajo, East Nusa Tenggara",
        description: "At dusk, witness one of nature's most extraordinary spectacles — millions of giant flying foxes stream out of the mangroves in a living river of wings that fills the sky for 20 minutes.",
        category: "Labuan Bajo Trip",
        rating: 4.89,
        image: "/public/programs/program-wildlife-spotting.webp",
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
                                href="/experiences"
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
                                href={`/experiences#${exp.id}`}
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
