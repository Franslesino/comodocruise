"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { StarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/solid";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

// Promo badges to cycle through
const PROMO_BADGES = [
    { label: "LAST MINUTE", color: "bg-red-500" },
    { label: "BEST SELLER", color: "bg-blue-600" },
    { label: "EARLY BIRD", color: "bg-green-600" },
];

function formatIDR(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export default function PromoSection() {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [promoShips, setPromoShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const ships = await fetchShips();
                // Pick ships that have images and cabin data for promos
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

    const totalSlides = promoShips.length || 1;

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    const goToSlide = (index: number) => setCurrentSlide(index);

    if (loading) {
        return (
            <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Cruise Deal</h2>
                    </div>
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (promoShips.length === 0) return null;

    const ship = promoShips[currentSlide];
    const badge = PROMO_BADGES[currentSlide % PROMO_BADGES.length];

    return (
        <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Featured Cruise Deal
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover Indonesia&apos;s most spectacular destinations with our exclusive cruise packages.
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:bg-gray-50"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:bg-gray-50"
                    >
                        <ChevronRightIcon className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Featured Deal Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="lg:flex">
                            {/* Image Section */}
                            <div className="lg:w-1/2 relative h-64 lg:h-auto min-h-[320px] overflow-hidden">
                                <Image
                                    src={ship.imageMain}
                                    alt={ship.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />

                                {/* Badge */}
                                <div className={`absolute top-6 left-6 ${badge.color} text-white px-4 py-2 rounded-full text-sm font-bold`}>
                                    {badge.label}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="lg:w-1/2 p-8">
                                {/* Title & Destination */}
                                <div className="mb-6">
                                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                                        {ship.name}
                                    </h3>
                                    <p className="text-gray-600 flex items-center gap-2 text-lg">
                                        <MapPinIcon className="w-5 h-5 text-blue-500" />
                                        {ship.destinations || "Komodo National Park"}
                                    </p>
                                </div>

                                {/* Trip Info */}
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900 text-lg">{ship.tripName}</p>
                                            <p className="text-gray-600">{ship.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-blue-600 text-lg">{ship.tripDuration} days</p>
                                            {ship.cabinCount > 0 && (
                                                <p className="text-gray-600">{ship.cabinCount} cabins</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Facilities */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    {ship.facilities.hasSeaview && (
                                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">🌊 Sea View</span>
                                    )}
                                    {ship.facilities.hasBalcony && (
                                        <span className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">🏖️ Balcony</span>
                                    )}
                                    {ship.facilities.hasBathtub && (
                                        <span className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full">🛁 Bathtub</span>
                                    )}
                                    {ship.facilities.hasJacuzzi && (
                                        <span className="bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">💎 Jacuzzi</span>
                                    )}
                                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                                        <StarIcon className="w-3.5 h-3.5 text-yellow-400 inline mr-1" />
                                        {ship.totalCapacity > 0 ? `${ship.totalCapacity} pax capacity` : "All meals included"}
                                    </span>
                                </div>

                                {/* Pricing & CTA */}
                                <div className="border-t pt-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-gray-500 text-sm">Starting from</p>
                                            <p className="text-3xl font-bold text-blue-600">{formatIDR(ship.lowestPrice)}</p>
                                            <p className="text-gray-500">per cabin</p>
                                        </div>
                                        {ship.highestPrice > ship.lowestPrice && (
                                            <div className="text-right">
                                                <p className="text-gray-500 text-sm">Up to</p>
                                                <p className="text-lg font-semibold text-gray-700">{formatIDR(ship.highestPrice)}</p>
                                                <p className="text-gray-500">premium cabin</p>
                                            </div>
                                        )}
                                    </div>

                                    <LocaleLink
                                        href={`/cruises/${ship.slug}`}
                                        className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors text-center block"
                                    >
                                        Book This Deal Now
                                    </LocaleLink>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center mt-8 space-x-2">
                        {promoShips.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === currentSlide
                                        ? 'bg-blue-600'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
