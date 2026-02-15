"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { StarIcon } from "@heroicons/react/24/solid";
import { HeartIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

// Promo tags per card
const PROMO_TAGS = [
    { label: "Summer Sales - Only $200/person inc transfer", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "Early bird promotion - Only $205/person", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "Special promotion - Only $210/person inc transfer", color: "text-red-600 bg-red-50 border-red-200" },
    { label: "Last Minute Deal - Save $50/person today", color: "text-red-600 bg-red-50 border-red-200" },
    { label: "Weekend Special - Only $195/person", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "Best Value - Only $185/person inc meals", color: "text-green-600 bg-green-50 border-green-200" },
];

// Activity badges for top-left of image
const ACTIVITY_BADGES = [
    "Free Kayaking",
    "Free Kayaking",
    "Free Snorkeling",
    "Free Kayaking",
    "Free Activities",
    "Free Kayaking",
];

// Fake reviews data to match reference design
const REVIEWS = [
    {
        text: "Welcoming and accommodating staff. The ship's design was great, our room was lovely and comfortable. All activities were well planned ...",
        author: "Patrick Declerck",
        country: "Belgium",
    },
    {
        text: "Spend 2 nights on this cruise and all we received surpassed our expectation!",
        author: "Emma Bauer",
        country: "Austria",
    },
    {
        text: "My husband and I stayed for 1 night and were very happy throughout the trip. The view ...",
        author: "Elena Papadopoulos",
        country: "Greece",
    },
    {
        text: "It was our first trip to Vietnam and Halong Bay was definitely highly recommended. The scenery was fantastic. The tour ...",
        author: "Silvia Russo",
        country: "Italy",
    },
    {
        text: "Hi Blue Dragon Tours, First of all, a sincere thanks to all of you for the enthusiastic communication and careful ...",
        author: "Nancy",
        country: "Canada",
    },
    {
        text: "The crew was amazing! Food was excellent and the cabins were spacious. Would definitely book again for our next visit.",
        author: "Michael Chen",
        country: "Singapore",
    },
];

function formatIDR(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Generate a pseudo-random rating between 9.5-9.9 based on ship name
function getRating(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 9.5 + (hash % 5) * 0.1;
}

// Generate pseudo-random review count
function getReviewCount(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 100 + (hash % 400);
}

// Generate pseudo-random favorites count
function getFavCount(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 200 + (hash % 2000);
}

function getRatingLabel(rating: number): string {
    if (rating >= 9.5) return "EXCELLENT";
    if (rating >= 9.0) return "WONDERFUL";
    if (rating >= 8.5) return "VERY GOOD";
    return "GOOD";
}

function getRatingColor(rating: number): string {
    if (rating >= 9.5) return "bg-green-600";
    if (rating >= 9.0) return "bg-green-500";
    if (rating >= 8.5) return "bg-yellow-500";
    return "bg-gray-500";
}

export default function PromoSection() {
    const { t } = useTranslation();
    const [allShips, setAllShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const apiShips = await fetchShips();
                // Filter ships with valid images and prices
                const validShips = apiShips.filter(s => s.imageMain && s.lowestPrice > 0);
                setAllShips(validShips);
            } catch {
                console.error("Failed to load promo ships from API");
                setAllShips([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
        
        // Calculate current page based on scroll position (3 cards per page)
        const cardWidth = el.querySelector<HTMLElement>("[data-promo-card]")?.offsetWidth ?? 350;
        const gap = 24;
        const scrollPosition = el.scrollLeft;
        const cardsPerPage = 3;
        const pageWidth = (cardWidth + gap) * cardsPerPage;
        const page = Math.round(scrollPosition / pageWidth);
        setCurrentPage(page);
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
        const cardWidth = el.querySelector<HTMLElement>("[data-promo-card]")?.offsetWidth ?? 350;
        const gap = 24;
        // Scroll by 3 cards at a time (for desktop view)
        const distance = (cardWidth + gap) * 3;
        el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
    };

    const scrollToIndex = (index: number) => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector<HTMLElement>("[data-promo-card]")?.offsetWidth ?? 350;
        const gap = 24;
        const cardsPerPage = 3;
        el.scrollTo({ left: index * cardsPerPage * (cardWidth + gap), behavior: "smooth" });
    };

    if (loading) {
        return (
            <section className="py-10 md:py-14 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-6">
            <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Discover Our Finest Tour Collection
            </h2>
                        {/* Placeholder for indicators */}
                        <div className="h-2.5" />
            </div>
                    {/* Skeleton cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                                <div className="h-52 bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 rounded w-full" />
                                    <div className="h-16 bg-gray-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (allShips.length === 0) return null;

    const totalPages = Math.ceil(allShips.length / 3);

    return (
        <section className="py-10 md:py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-6">
            <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Discover Our Finest Tour Collection
            </h2>
                    
                    {/* Slide Indicators */}
                    {allShips.length > 3 && (
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: totalPages }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => scrollToIndex(index)}
                                    className={`transition-all duration-300 rounded-full ${
                                        currentPage === index
                                            ? "w-10 h-2.5 bg-[#12214a]"
                                            : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                                    }`}
                                    aria-label={`Go to page ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
        </div>

                {/* Carousel Container */}
                <div className="relative mt-8">
                    {/* Navigation Arrows */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll("left")}
                            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:bg-gray-50"
                            aria-label="Previous"
                        >
                            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                        </button>
                    )}

                    {canScrollRight && (
                        <button
                            onClick={() => scroll("right")}
                            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:bg-gray-50"
                            aria-label="Next"
                        >
                            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
                        </button>
                    )}

                    {/* Scrollable Cards Container */}
                    <div
                        ref={scrollRef}
                        className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {allShips.map((ship, index) => {
                        const rating = getRating(ship.name);
                        const reviewCount = getReviewCount(ship.name);
                        const favCount = getFavCount(ship.name);
                        const promoTag = PROMO_TAGS[index % PROMO_TAGS.length];
                        const activityBadge = ACTIVITY_BADGES[index % ACTIVITY_BADGES.length];
                        const review = REVIEWS[index % REVIEWS.length];

                        // Parse destinations into route segments
                        const routeSegments = ship.destinations
                            ? ship.destinations.split(/[,→\-–]/).map(s => s.trim()).filter(Boolean).slice(0, 3)
                            : [ship.tripName || "Komodo National Park"];

                        return (
                            <LocaleLink
                                key={`${ship.id}-${index}`}
                                href={`/cruises/${ship.slug}`}
                                data-promo-card
                                className="group flex-shrink-0 w-[300px] md:w-[340px] lg:w-[360px] bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Image */}
                                <div className="relative h-52 overflow-hidden">
                                    <Image
                                        src={ship.imageMain}
                                        alt={ship.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="360px"
                                    />

                                    {/* Activity badge top-left */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                                        <span className="text-yellow-500 text-sm">⚓</span>
                                        <span className="text-xs font-semibold text-gray-800">{activityBadge}</span>
                                    </div>

                                    {/* Heart / favorites top-right */}
                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1.5">
                                        <HeartIcon className="w-4 h-4 text-white" />
                                        <span className="text-xs font-medium text-white">{favCount}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Title + Price row */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-base text-gray-900 leading-tight line-clamp-2">
                                            {ship.name} {ship.tripDuration} Days
                                        </h3>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-[11px] text-gray-500 uppercase">From</span>
                                            <p className="text-lg font-bold text-gray-900">{formatIDR(ship.lowestPrice)}</p>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {/* Stars */}
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <StarIcon
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= Math.round(rating / 2) ? "text-yellow-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                        {/* Score badge */}
                                        <span className={`${getRatingColor(rating)} text-white text-[11px] font-bold px-1.5 py-0.5 rounded`}>
                                            {rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs font-bold text-green-700 uppercase">{getRatingLabel(rating)}</span>
                                        <span className="text-xs text-gray-400">|</span>
                                        <span className="text-xs text-gray-500">{reviewCount} reviews</span>
                                    </div>

                                    {/* Route / Itinerary */}
                                    <div className="flex items-center gap-1 mb-3 text-sm text-gray-600 flex-wrap">
                                        {routeSegments.map((segment, i) => (
                                            <span key={i} className="flex items-center gap-1">
                                                {i > 0 && <span className="text-gray-400">→</span>}
                                                <span>{segment}</span>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Promo tag */}
                                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border ${promoTag.color} mb-4`}>
                                        <span>🏷️</span>
                                        {promoTag.label}
                                    </div>

                                    {/* Divider */}
                                    <hr className="border-gray-100 mb-3" />

                                    {/* Review */}
                                    <div>
                                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 italic mb-2">
                                            <span className="text-lg text-gray-400 not-italic">&ldquo;</span>
                                            {review.text}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-semibold text-gray-800">{review.author}</span>
                                            <span className="text-gray-400"> – </span>
                                            <span className="text-gray-500">{review.country}</span>
                                        </p>
                                    </div>
                                </div>
                            </LocaleLink>
                        );
                    })}
                    </div>
                </div>
            </div>
        </section>
    );
}
