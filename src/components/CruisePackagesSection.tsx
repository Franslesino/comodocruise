"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

function formatIDR(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Pseudo-random star rating (3–5) from ship name
function getStarRating(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 3 + (hash % 3); // 3, 4, or 5 stars
}

// Badge labels for first card only
const BADGES = [
    "Best-seller This Month",
    "Most Popular",
    "Top Rated",
    "Editor's Pick",
    "Trending Now",
];

function getBadge(name: string): string {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return BADGES[hash % BADGES.length];
}

export default function CruisePackagesSection() {
    const [ships, setShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchShips();
                if (!cancelled) {
                    const valid = data.filter(s => s.imageMain && s.lowestPrice > 0);
                    setShips(valid.slice(0, 3));
                }
            } catch {
                console.error("Failed to fetch cruise packages");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900">
                            Best Komodo Cruise Packages 2026
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base mt-3 max-w-3xl mx-auto">
                            Choose between many excellent cruise packages with island hopping, snorkeling, and diving
                            experiences across the stunning Komodo National Park archipelago.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                                <div className="h-56 bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-6 bg-gray-200 rounded w-1/3 ml-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (ships.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-10">
                    <h2 className="font-canto text-2xl md:text-3xl font-bold text-gray-900">
                        Best Komodo Cruise Packages 2026
                    </h2>
                    <p className="text-gray-500 text-sm md:text-base mt-3 max-w-3xl mx-auto">
                        Choose between many excellent cruise packages with island hopping, snorkeling, and diving
                        experiences across the stunning Komodo National Park archipelago.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ships.map((ship, index) => {
                        const stars = getStarRating(ship.name);
                        const routeSegments = ship.destinations
                            ? ship.destinations.split(/[,→\-–]/).map(s => s.trim()).filter(Boolean).slice(0, 3)
                            : [ship.tripName || "Labuan Bajo"];

                        return (
                            <LocaleLink
                                key={`${ship.id}-${index}`}
                                href={`/cruises/${ship.slug}`}
                                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
                            >
                                {/* Image */}
                                <div className="relative h-56 overflow-hidden">
                                    <Image
                                        src={ship.imageMain}
                                        alt={ship.name}
                                        fill
                                        priority={index < 3}
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />

                                    {/* Badge - only on first card */}
                                    {index === 0 && (
                                        <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded shadow-md">
                                            {getBadge(ship.name)}
                                        </span>
                                    )}

                                    {/* Heart icon top-right */}
                                    <button
                                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition"
                                        onClick={(e) => e.preventDefault()}
                                        aria-label="Add to wishlist"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                        </svg>
                                    </button>

                                    {/* Duration overlay at bottom of image */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex items-end justify-between">
                                        <div className="flex items-center gap-1.5 text-white text-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <path strokeLinecap="round" d="M12 6v6l4 2" />
                                            </svg>
                                            <span className="font-medium">
                                                Duration: {ship.tripDuration} days/ {Math.max(1, parseInt(ship.tripDuration) - 1)} nights
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/80">
                                            {/* Cabin icon */}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                                            </svg>
                                            {/* Capacity icon */}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {/* Title + Stars */}
                                    <div className="mb-3">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            {ship.name}
                                        </div>
                                        <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                                            {ship.tripName || ship.name}
                                        </h3>
                                        <div className="flex items-center gap-0.5 mt-1.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`w-4 h-4 ${i < stars ? "text-yellow-400" : "text-gray-300"}`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Route + Price */}
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
                                            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="truncate">
                                                {routeSegments.join(" > ")}
                                            </span>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-3">
                                            <span className="block text-[10px] text-gray-400 uppercase tracking-wide">From</span>
                                            <span className="block text-sm text-gray-400 line-through">{formatIDR(Math.round(ship.lowestPrice * 1.25))}</span>
                                            <span className="text-xl font-bold text-[#12214a]">{formatIDR(ship.lowestPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            </LocaleLink>
                        );
                    })}
                </div>

                {/* View All Button */}
                <div className="text-center mt-10">
                    <LocaleLink
                        href="/cruises"
                        className="inline-block border-2 border-gray-800 text-gray-800 font-semibold px-8 py-3 rounded hover:bg-gray-800 hover:text-white transition-colors duration-300 text-sm md:text-base"
                    >
                        View All Cruise Packages
                    </LocaleLink>
                </div>
            </div>
        </section>
    );
}
