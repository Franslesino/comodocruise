"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { StarIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

// Promo tags per card
const PROMO_TAGS = [
    { label: "Summer Sales - Only $200/person inc transfer", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "Early bird promotion - Only $205/person", color: "text-orange-600 bg-orange-50 border-orange-200" },
    { label: "Special promotion - Only $210/person inc transfer", color: "text-red-600 bg-red-50 border-red-200" },
];

// Activity badges for top-left of image
const ACTIVITY_BADGES = [
    "Free Kayaking",
    "Free Kayaking",
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
    const [promoShips, setPromoShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const ships = await fetchShips();
                const withData = ships.filter(s => s.imageMain && s.lowestPrice > 0);
                setPromoShips(withData.slice(0, 3));
            } catch {
                console.error("Failed to load promo ships");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <section className="py-10 md:py-14 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900">
                            Explore With Our Best Tour Collection
                        </h2>
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

    if (promoShips.length === 0) return null;

    return (
        <section className="py-10 md:py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900">
                        Explore With Our Best Tour Collection
                    </h2>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promoShips.map((ship, index) => {
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
                                key={ship.id}
                                href={`/cruises/${ship.slug}`}
                                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Image */}
                                <div className="relative h-52 overflow-hidden">
                                    <Image
                                        src={ship.imageMain}
                                        alt={ship.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        </section>
    );
}
