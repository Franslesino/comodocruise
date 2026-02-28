"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LocaleLink from "./LocaleLink";
import { fetchShips } from "@/lib/api";
import type { ParsedShip } from "@/types/api";
import "@/styles/cruises.css";
import "@/styles/cruises-page.css";

function formatIDR(price: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

const DESTINATIONS = [
    { id: "all", name: "All Destinations" },
    { id: "komodo-national-park", name: "Komodo National Park" },
    { id: "labuan-bajo", name: "Labuan Bajo" },
];

const SORT_OPTIONS = [
    { value: "recommended", label: "Recommended" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name A-Z" },
];

export default function CruisesPage() {
    const [ships, setShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDest, setActiveDest] = useState("all");
    const [sortBy, setSortBy] = useState("recommended");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let cancelled = false;

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const destParam = params.get('destination');
            if (destParam && DESTINATIONS.some((d) => d.id === destParam)) {
                setActiveDest(destParam);
            }
        }

        (async () => {
            try {
                const data = await fetchShips();
                if (!cancelled) setShips(data);
            } catch {
                console.error("Failed to fetch ships");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Filter ships
    const filteredShips = ships
        .filter((ship) => {
            // Destination filter
            if (activeDest !== "all") {
                const destName = DESTINATIONS.find((d) => d.id === activeDest)?.name || "";
                if (
                    !ship.destinations
                        ?.toLowerCase()
                        .includes(destName.toLowerCase())
                ) {
                    return false;
                }
            }
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = ship.name.toLowerCase().includes(q);
                const matchTrip = ship.tripName?.toLowerCase().includes(q);
                const matchDest = ship.destinations?.toLowerCase().includes(q);
                if (!(matchName || matchTrip || matchDest)) return false;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return (a.lowestPrice || Infinity) - (b.lowestPrice || Infinity);
                case "price-high":
                    return (b.lowestPrice || 0) - (a.lowestPrice || 0);
                case "name":
                    return a.name.localeCompare(b.name);
                default:
                    // Recommended: prioritize ships with images and prices
                    const aScore = (a.imageMain ? 2 : 0) + (a.lowestPrice > 0 ? 1 : 0);
                    const bScore = (b.imageMain ? 2 : 0) + (b.lowestPrice > 0 ? 1 : 0);
                    if (aScore !== bScore) return bScore - aScore;
                    return (a.lowestPrice || Infinity) - (b.lowestPrice || Infinity);
            }
        });

    return (
        <div className="cruises-listing">
            {/* Hero Section — reuse existing cruises hero */}
            <div id="hero-section" className="cruises-hero" style={{ backgroundColor: '#12214a' }}>
                <video
                    className="cruises-hero__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    disablePictureInPicture
                >
                    <source src="/vidfootage.mp4" type="video/mp4" />
                </video>
                <div className="cruises-hero__overlay" />

                <div className="cruises-hero-content cruises-hero-content--left">
                    <nav className="cruises-hero-breadcrumb">
                        <LocaleLink href="/" className="cruises-bc-link">Home</LocaleLink>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="cruises-bc-sep"><polyline points="9 18 15 12 9 6" /></svg>
                        <span className="cruises-bc-curr">Cruises</span>
                    </nav>
                    <div className="cruises-hero-eyebrow">Sail The Extraordinary</div>
                    <h1>Discover Our<br />Cruise Packages</h1>
                    <p className="cruises-hero-subtitle">
                        Experience the adventure of a lifetime with our handpicked cruise packages to pristine destinations across Komodo and beyond.
                    </p>
                    <div className="cruises-hero-actions">
                        <a href="#cruise-grid" className="cruises-hero-btn cruises-hero-btn--primary">
                            Explore Packages ↓
                        </a>
                        <div className="cruises-hero-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Save up to 30% on Selected Packages
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div id="cruise-grid" className="cruises-filter-bar">
                <div className="cruises-filter-bar-inner">
                    {/* Destination Pills */}
                    <div className="cruises-dest-pills">
                        {DESTINATIONS.map((dest) => (
                            <button
                                key={dest.id}
                                className={`cruises-dest-pill${activeDest === dest.id ? " active" : ""}`}
                                onClick={() => setActiveDest(dest.id)}
                            >
                                {dest.name}
                            </button>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="cruises-controls">
                        <div className="cruises-search-box">
                            <svg className="search-icon-mini" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search ships..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="cruises-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Ship Grid */}
            <div className="cruises-grid-container">
                <div className="cruises-grid-header">
                    <p className="cruises-grid-count">
                        {loading
                            ? "Loading ships..."
                            : <>Showing <strong>{filteredShips.length}</strong> cruise {filteredShips.length === 1 ? "package" : "packages"}</>
                        }
                    </p>
                </div>

                {loading ? (
                    <div className="cruises-skeleton-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="cruises-skeleton-card">
                                <div className="cruises-skeleton-img" />
                                <div className="cruises-skeleton-body">
                                    <div className="cruises-skeleton-line w-40" />
                                    <div className="cruises-skeleton-line w-80 h-lg" />
                                    <div className="cruises-skeleton-line w-60" />
                                    <div className="cruises-skeleton-line w-40" style={{ marginTop: "0.75rem" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredShips.length === 0 ? (
                    <div className="cruises-empty">
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <h3>No cruise packages found</h3>
                        <p>Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="cruises-ship-grid">
                        {filteredShips.map((ship, index) => {
                            const nights = Math.max(1, parseInt(ship.tripDuration) - 1);
                            return (
                                <LocaleLink
                                    key={`${ship.id}-${index}`}
                                    href={`/cruises/${ship.slug}`}
                                    className="cruises-ship-card"
                                >
                                    {/* Image */}
                                    <div className="cruises-card-img">
                                        {ship.imageMain ? (
                                            <Image
                                                src={ship.imageMain}
                                                alt={ship.name}
                                                fill
                                                priority={index < 3}
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="cruises-card-img-placeholder">
                                                Ship Image
                                            </div>
                                        )}

                                        {/* Trip badge */}
                                        {ship.tripName && (
                                            <span className="cruises-card-trip-badge">
                                                {ship.tripName}
                                            </span>
                                        )}

                                        {/* Wishlist */}
                                        <button
                                            className="cruises-card-wish"
                                            onClick={(e) => e.preventDefault()}
                                            aria-label="Add to wishlist"
                                        >
                                            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        </button>

                                        {/* Duration overlay */}
                                        <div className="cruises-card-duration">
                                            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <path strokeLinecap="round" d="M12 6v6l4 2" />
                                            </svg>
                                            <span>{ship.tripDuration} days / {nights} nights</span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="cruises-card-body">
                                        <div className="cruises-card-ship-name">{ship.name}</div>
                                        <div className="cruises-card-title">
                                            {ship.tripName || `${ship.tripDuration}-Day Cruise`}
                                        </div>

                                        {/* Meta */}
                                        <div className="cruises-card-meta">
                                            {ship.cabinCount > 0 && (
                                                <span className="cruises-card-meta-item">
                                                    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                                                    </svg>
                                                    {ship.cabinCount} cabins
                                                </span>
                                            )}
                                            {ship.totalCapacity > 0 && (
                                                <span className="cruises-card-meta-item">
                                                    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                    </svg>
                                                    Up to {ship.totalCapacity} guests
                                                </span>
                                            )}
                                        </div>

                                        {/* Destination */}
                                        {ship.destinations && (
                                            <div className="cruises-card-dest">
                                                <svg fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <span>{ship.destinations}</span>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="cruises-card-price">
                                            <div>
                                                <span className="cruises-card-price-from">From</span>
                                                {ship.lowestPrice > 0 && (
                                                    <>
                                                        <div className="cruises-card-price-original">
                                                            {formatIDR(Math.round(ship.lowestPrice * 1.25))}
                                                        </div>
                                                        <div>
                                                            <span className="cruises-card-price-current">
                                                                {formatIDR(ship.lowestPrice)}
                                                            </span>
                                                            <span className="cruises-card-price-unit">/cabin</span>
                                                        </div>
                                                    </>
                                                )}
                                                {ship.lowestPrice <= 0 && (
                                                    <div className="cruises-card-price-current" style={{ color: "#12214a", fontSize: "0.95rem" }}>
                                                        Contact for price
                                                    </div>
                                                )}
                                            </div>
                                            <div className="cruises-card-cta">
                                                View Details
                                                <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </LocaleLink>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
