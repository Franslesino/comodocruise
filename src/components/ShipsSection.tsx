"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";

function formatPriceIDR(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export default function ShipsSection() {
    const { t } = useTranslation();
    const [ships, setShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadShips = async () => {
            try {
                setLoading(true);
                const data = await fetchShips();
                setShips(data.slice(0, 10));
            } catch (err) {
                console.error('Failed to load ships:', err);
                setError('Failed to load ships data');
            } finally {
                setLoading(false);
            }
        };
        loadShips();
    }, []);

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
    }, [ships, checkScroll]);

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector<HTMLElement>("[data-ship-card]")?.offsetWidth ?? 280;
        const gap = 16;
        const distance = (cardWidth + gap) * 2;
        el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
    };

    // Shared header
    const renderHeader = (showNav?: boolean) => (
        <div className="flex items-end justify-between mb-6">
            <div>
                <LocaleLink
                    href="/ships"
                    className="group inline-flex items-center gap-2"
                >
                    <h2 className="font-canto text-2xl md:text-3xl text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        {t("ships.title")}
                    </h2>
                    <svg className="w-5 h-5 text-neutral-900 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </LocaleLink>
                <p className="font-avenir text-neutral-500 text-sm mt-1 max-w-xl">
                    {t("ships.subtitle")}
                </p>
            </div>
            {showNav && (
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
            )}
        </div>
    );

    if (loading) {
        return (
            <section className="ships-section">
                <div className="max-w-7xl mx-auto px-4">
                    {renderHeader()}
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="ships-section">
                <div className="max-w-7xl mx-auto px-4">
                    {renderHeader()}
                    <div className="text-center py-12">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 transition-colors"
                        >
                            {t("common.tryAgain") || "Try Again"}
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="ships-section">
            <div className="max-w-7xl mx-auto px-4">
                {renderHeader(true)}

                {/* Horizontal scroll container */}
                <div className="relative">
                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {ships.map((ship, index) => (
                            <LocaleLink
                                key={`${ship.id}-${index}`}
                                href={`/cruises/${ship.slug}`}
                                data-ship-card
                                className="group flex-shrink-0 w-[260px] sm:w-[270px]"
                            >
                                {/* Image */}
                                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5">
                                    {ship.imageMain ? (
                                        <Image
                                            src={ship.imageMain}
                                            alt={ship.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="270px"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center">
                                            <span className="text-sky-400 font-avenir text-sm">Ship Image</span>
                                        </div>
                                    )}
                                    {/* Badge */}
                                    {ship.tripName && (
                                        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-xs font-semibold text-neutral-800 px-2.5 py-1 rounded-full shadow-sm">
                                            {ship.tripName}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div>
                                    <h3 className="font-semibold text-[15px] text-neutral-900 leading-tight line-clamp-1 group-hover:text-sky-700 transition-colors">
                                        {ship.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
                                        {ship.destinations}
                                    </p>
                                    <p className="text-sm text-neutral-500 mt-0.5">
                                        {ship.tripDuration} {t("ships.days") || "days"}
                                        {ship.cabinCount > 0 && <> · {ship.cabinCount} {t("ships.cabins") || "cabins"}</>}
                                    </p>
                                    {ship.lowestPrice > 0 && (
                                        <p className="text-sm mt-1">
                                            <span className="font-semibold text-neutral-900">
                                                {formatPriceIDR(ship.lowestPrice)}
                                            </span>
                                            <span className="text-neutral-500"> /cabin</span>
                                        </p>
                                    )}
                                </div>
                            </LocaleLink>
                        ))}

                        {/* "View All" card */}
                        <LocaleLink
                            href="/ships"
                            className="group flex-shrink-0 w-[200px] sm:w-[210px] flex flex-col items-center justify-center"
                        >
                            <div className="relative w-28 h-28 mb-4">
                                {/* Stacked thumbnail previews */}
                                {ships.slice(0, 3).map((s, i) => (
                                    <div
                                        key={s.id}
                                        className="absolute rounded-lg overflow-hidden shadow-md border border-white"
                                        style={{
                                            width: 64,
                                            height: 64,
                                            top: i === 0 ? 0 : i === 1 ? 12 : 24,
                                            left: i === 0 ? 0 : i === 1 ? 24 : 48,
                                            zIndex: 3 - i,
                                        }}
                                    >
                                        {s.imageMain ? (
                                            <Image
                                                src={s.imageMain}
                                                alt={s.name}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-sky-100" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span className="font-semibold text-sm text-neutral-900 group-hover:text-sky-700 transition-colors">
                                {t("ships.viewAll") || "View all"}
                            </span>
                        </LocaleLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
