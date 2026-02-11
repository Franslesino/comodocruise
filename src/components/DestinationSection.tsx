"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { ChevronRightIcon, ChevronLeftIcon, MapPinIcon, ArrowRightIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { getDestinations, fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

// Destination interface for UI
interface Destination {
    id: string;
    name: string;
    location: string;
    description: string;
    image: string;
    cruiseCount: number;
    duration: string;
    startingPrice: string;
    highlights: string[];
    rating: number;
    slug: string;
    category: string;
    operators: ParsedShip[];
}

// Create destination data from ships API
function createDestinationFromShips(destName: string, ships: ParsedShip[]): Destination {
    const shipsForDest = ships.filter(ship =>
        ship.destinations.toLowerCase().includes(destName.toLowerCase())
    );

    const avgPrice = shipsForDest.length > 0
        ? Math.floor(shipsForDest.reduce((sum, ship) => sum + (ship.lowestPrice || 0), 0) / shipsForDest.length)
        : 500;

    const durations = [...new Set(shipsForDest.map(ship => ship.tripDuration))].join('-');

    const destMeta: Record<string, Partial<Destination>> = {
        'komodo national park': {
            location: 'East Nusa Tenggara',
            description: 'Home to the legendary Komodo dragons and pristine coral reefs',
            highlights: ['Komodo Dragons', 'Pink Beach', 'Padar Island', 'World-class diving'],
            category: 'Wildlife & Nature',
            rating: 4.8,
            // Use local hero image if available
            image: '/public/komodo-hero.webp'
        },
        'labuan bajo': {
            location: 'Flores, East Nusa Tenggara',
            description: 'Gateway to Komodo National Park with stunning sunsets and marine life',
            highlights: ['Gateway to Komodo', 'Sunset views', 'Marine tours', 'Island hopping'],
            category: 'Adventure & Nature',
            rating: 4.6
        }
    };

    const meta = destMeta[destName.toLowerCase()] || {
        location: 'Indonesia',
        description: `Explore the stunning ${destName} region with luxury cruise experiences`,
        highlights: ['Scenic beauty', 'Cultural experiences', 'Marine life', 'Adventure'],
        category: 'Cruise Destination',
        rating: 4.5
    };

    return {
        id: destName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: destName,
        location: meta.location || 'Indonesia',
        description: meta.description || `Explore ${destName}`,
        image: meta.image || `/images/destinations/${destName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`,
        cruiseCount: shipsForDest.length,
        duration: durations ? `${durations} days` : '3-7 days',
        startingPrice: `$${avgPrice}`,
        highlights: meta.highlights || ['Adventure', 'Nature', 'Culture'],
        rating: meta.rating || 4.5,
        slug: destName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: meta.category || 'Cruise Destination',
        operators: shipsForDest
    };
}

export default function DestinationSection() {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDestinations = async () => {
            try {
                setLoading(true);
                const ships = await fetchShips();
                const destNames = await getDestinations();

                const destData = destNames
                    .filter(name => name)
                    .map(name => createDestinationFromShips(name, ships))
                    .filter(dest => dest.cruiseCount > 0);

                setDestinations(destData);
            } catch (err) {
                console.error('Failed to load destinations:', err);
                setError('Failed to load destinations');
            } finally {
                setLoading(false);
            }
        };

        loadDestinations();
    }, []);

    const goNext = useCallback(() => {
        setActiveIndex(prev => (prev + 1) % destinations.length);
    }, [destinations.length]);

    const goPrev = useCallback(() => {
        setActiveIndex(prev => (prev - 1 + destinations.length) % destinations.length);
    }, [destinations.length]);

    const activeDest = destinations[activeIndex];

    if (loading) {
        return (
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Explore Indonesian Destinations
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Discovering amazing cruise destinations...
                        </p>
                    </div>
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || !activeDest) {
        return (
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{error || 'No destinations found'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                            {t("common.tryAgain") || "Try Again"}
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header + Top Slider Controls */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-center sm:text-left">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">
                            Explore Indonesian Destinations
                        </h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto sm:mx-0">
                            Discover the most spectacular cruise destinations in Indonesia
                        </p>
                    </div>

                    {destinations.length > 1 && (
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                            <button
                                onClick={goPrev}
                                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                            
                            >
                                <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                                onClick={goNext}
                                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Layout: Large Card Left + Ships Panel Right */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">

                    {/* LEFT — Large Destination Card (3 cols) */}
                    <div className="lg:col-span-3">
                        <LocaleLink
                            href={`/destinations/${activeDest.slug}`}
                            className="group block h-full"
                        >
                            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                {/* Big Image */}
                                <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:flex-1 min-h-[320px] overflow-hidden">
                                    <Image
                                        src={activeDest.image}
                                        alt={activeDest.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                                        {activeDest.category}
                                    </div>

                                    {/* Rating Badge */}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                                        <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                                        {activeDest.rating}
                                    </div>
                                </div>

                                {/* Bottom Info */}
                                <div className="p-6">
                                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                                        <MapPinIcon className="w-4 h-4" />
                                        {activeDest.location}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {activeDest.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                        {activeDest.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeDest.highlights.map((h, i) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </LocaleLink>
                    </div>

                    {/* RIGHT — Set Sail Panel (2 cols) */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-5 h-full flex flex-col">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Set Sail to {activeDest.name}
                                </h3>
                                <LocaleLink
                                    href={`/destinations/${activeDest.slug}`}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowRightIcon className="w-5 h-5" />
                                </LocaleLink>
                            </div>

                            {/* Ships List */}
                            <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
                                {activeDest.operators.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                                        No operators available yet
                                    </div>
                                )}
                                {activeDest.operators.slice(0, 2).map((ship) => (
                                    <div key={ship.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex gap-4">
                                            {/* Ship Image */}
                                            <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-teal-100">
                                                {ship.imageMain ? (
                                                    <Image
                                                        src={ship.imageMain}
                                                        alt={ship.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="128px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-2xl">🚢</span>
                                                    </div>
                                                )}
                                                {/* Wishlist heart */}
                                                <button className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                                                    <HeartIcon className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                            </div>

                                            {/* Ship Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 leading-tight">
                                                    {ship.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{ship.tripName || `${ship.tripDuration} Days Trip`}</p>
                                                
                                                {/* Stats Row */}
                                                <div className="flex items-center gap-3 mt-2">
                                                    {ship.tripDuration && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                            <span>{ship.tripDuration}D</span>
                                                        </div>
                                                    )}
                                                    {ship.cabinCount && ship.cabinCount > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <UsersIcon className="w-3.5 h-3.5" />
                                                            <span>{ship.cabinCount} cabins</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: Facilities + Price */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                            {/* Facilities */}
                                            <div className="flex items-center gap-2">
                                                {ship.facilities?.hasSeaview && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sea View</span>
                                                )}
                                                {ship.facilities?.hasBalcony && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Balcony</span>
                                                )}
                                                {ship.facilities?.hasBathtub && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Bathtub</span>
                                                )}
                                            </div>

                                            {/* Price + CTA */}
                                            <div className="flex items-center gap-3">
                                                {ship.lowestPrice && ship.lowestPrice > 0 && (
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">From</p>
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {new Intl.NumberFormat('id-ID', {
                                                                style: 'currency',
                                                                currency: 'IDR',
                                                                maximumFractionDigits: 0,
                                                            }).format(ship.lowestPrice)}
                                                        </p>
                                                    </div>
                                                )}
                                                <LocaleLink
                                                    href={`/ships/${ship.slug}`}
                                                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-gray-900 rounded-full text-xs font-bold transition-colors"
                                                >
                                                    Details
                                                </LocaleLink>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* View All link */}
                            {activeDest.operators.length > 2 && (
                                <div className="pt-4 mt-4 border-t border-gray-100 text-center">
                                    <LocaleLink
                                        href={`/destinations/${activeDest.slug}`}
                                        className="text-sm text-blue-600 font-semibold hover:underline"
                                    >
                                        View all {activeDest.operators.length} cruises →
                                    </LocaleLink>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* View All Destinations (above bottom choices) */}
                <div className="mt-8 flex justify-end">
                    <LocaleLink
                        href="/destinations"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        View All Destinations
                        <ChevronRightIcon className="w-4 h-4" />
                    </LocaleLink>
                </div>

                {/* Bottom Destination Slider (thumbnails only) */}
                {destinations.length > 1 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-3">
                            {/* Destination Thumbnails Slider */}
                            <div className="flex-1 overflow-hidden">
                                <div
                                    className="flex gap-3 transition-transform duration-500 ease-out"
                                    style={{
                                        transform: `translateX(-${Math.max(0, activeIndex - 1) * (100 / Math.min(destinations.length, 5))}%)`
                                    }}
                                >
                                    {destinations.map((dest, idx) => (
                                        <button
                                            key={dest.id}
                                            onClick={() => setActiveIndex(idx)}
                                            className={`flex-shrink-0 w-[calc(20%-10px)] min-w-[140px] rounded-xl overflow-hidden border-2 transition-all duration-300 text-left ${
                                                idx === activeIndex
                                                    ? 'border-blue-600 shadow-lg scale-[1.02]'
                                                    : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-blue-50 to-teal-100 overflow-hidden">
                                                <Image
                                                    src={dest.image}
                                                    alt={dest.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="160px"
                                                />
                                            </div>
                                            <div className="bg-white px-2.5 py-2">
                                                <p className={`text-xs font-semibold truncate ${idx === activeIndex ? 'text-blue-600' : 'text-gray-700'}`}>
                                                    {dest.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{dest.cruiseCount} cruises</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dots indicator */}
                        <div className="flex justify-center gap-2 mt-4">
                            {destinations.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`rounded-full transition-all duration-300 ${
                                        idx === activeIndex
                                            ? 'w-6 h-2 bg-blue-600'
                                            : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
