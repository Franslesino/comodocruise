"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LocaleLink from "./LocaleLink";
import { fetchShips, getDestinations, formatPrice } from "@/lib/api";
import type { ParsedShip } from "@/types/api";
import { ClockIcon, UsersIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import "@/styles/destination-cruises.css";

// ─── Destination metadata ──────────────────────────────────────────────────
const DEST_META: Record<string, {
    displayName: string;
    location: string;
    description: string;
    image: string;
    rating: number;
}> = {
    "togean-islands": {
        displayName: "Togean Islands",
        location: "Central Sulawesi, Indonesia",
        description: "A remote paradise of turquoise lagoons, pristine coral reefs, and dense jungle — the Togean Islands are one of Indonesia's last untouched frontiers.",
        image: "/public/destinations_real/destination_kadidiri.webp",
        rating: 4.9,
    },
    "komodo-national-park": {
        displayName: "Komodo National Park",
        location: "East Nusa Tenggara, Indonesia",
        description: "Home to the legendary Komodo dragons and some of the world's most spectacular diving. Discover pink beaches, volcanic landscapes, and vibrant reefs.",
        image: "/public/komodo-hero.webp",
        rating: 4.8,
    },
    "labuan-bajo": {
        displayName: "Labuan Bajo",
        location: "Flores, East Nusa Tenggara",
        description: "Gateway to Komodo National Park with stunning sunsets, world-class dive sites, and a bustling waterfront perfect for island-hopping adventures.",
        image: "/public/destinations_real/destination_luwuk.webp",
        rating: 4.7,
    },
    "raja-ampat": {
        displayName: "Raja Ampat",
        location: "West Papua, Indonesia",
        description: "The world's greatest marine biodiversity hotspot — Raja Ampat is a bucket-list destination for divers and snorkelers seeking pristine underwater ecosystems.",
        image: "/public/destinations_real/destination_bomba.webp",
        rating: 4.9,
    },
    "banda-sea": {
        displayName: "Banda Sea",
        location: "Maluku, Indonesia",
        description: "Mysterious and majestic, the Banda Sea offers remote volcanic islands, deep blue waters, and extraordinary encounters with pelagic marine life.",
        image: "/public/destinations_real/destination_una_una.webp",
        rating: 4.7,
    },
    "wakatobi": {
        displayName: "Wakatobi",
        location: "Southeast Sulawesi, Indonesia",
        description: "Named after its four main islands, Wakatobi is a marine national park boasting some of the most diverse and healthy coral reefs in the world.",
        image: "/public/destinations_real/destination_pulau_puah.webp",
        rating: 4.8,
    },
};

function getMeta(slug: string, apiDestName?: string) {
    const predefined = DEST_META[slug];
    if (predefined) return predefined;
    const name = apiDestName || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        displayName: name,
        location: "Indonesia",
        description: `Explore the stunning ${name} region with premium cruise experiences aboard handpicked liveaboard vessels.`,
        image: "/public/destinations_real/destination_kadidiri.webp",
        rating: 4.6,
    };
}

// ─── Sort options ──────────────────────────────────────────────────────────
type SortKey = "recommended" | "price-asc" | "price-desc" | "duration-asc";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "price-asc",   label: "Price: Low to High" },
    { value: "price-desc",  label: "Price: High to Low" },
    { value: "duration-asc", label: "Shortest Duration" },
];

// ─── Component ────────────────────────────────────────────────────────────
interface Props { slug: string }

export default function DestinationCruisesPage({ slug }: Props) {
    const router = useRouter();
    const [ships, setShips] = useState<ParsedShip[]>([]);
    const [destName, setDestName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortKey>("recommended");

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [allShips, allDests] = await Promise.all([fetchShips(), getDestinations()]);

                // Find the matching destination name from the API
                const matched = allDests.find(d =>
                    d.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
                );
                setDestName(matched || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));

                // Filter ships whose destinations field contains this destination
                const filtered = allShips.filter(ship =>
                    ship.destinations.toLowerCase().includes(
                        slug.replace(/-/g, " ").toLowerCase()
                    ) ||
                    (matched && ship.destinations.toLowerCase().includes(matched.toLowerCase()))
                );
                setShips(filtered);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const meta = getMeta(slug, destName);

    const sorted = useMemo(() => {
        const arr = [...ships];
        switch (sort) {
            case "price-asc":  return arr.sort((a, b) => (a.lowestPrice || 0) - (b.lowestPrice || 0));
            case "price-desc": return arr.sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0));
            case "duration-asc": return arr.sort((a, b) => parseInt(a.tripDuration || "0") - parseInt(b.tripDuration || "0"));
            default: return arr;
        }
    }, [ships, sort]);

    return (
        <div className="dest-page">
            {/* ── Hero ── */}
            <div className="dest-hero">
                <div className="dest-hero-img-wrap">
                    <Image
                        src={meta.image}
                        alt={meta.displayName}
                        fill
                        className="dest-hero-img"
                        priority
                        sizes="100vw"
                    />
                    <div className="dest-hero-overlay" />
                </div>

                <div className="dest-hero-content">
                    <button className="dest-back-btn" onClick={() => router.back()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Back
                    </button>

                    <div className="dest-hero-text">
                        <div className="dest-hero-location">
                            <MapPinIcon style={{ width: 14, height: 14 }} />
                            {meta.location}
                        </div>
                        <h1 className="dest-hero-title">{meta.displayName}</h1>
                        <p className="dest-hero-desc">{meta.description}</p>

                        <div className="dest-hero-badges">
                            <span className="dest-badge">
                                <StarIcon style={{ width: 13, height: 13, color: "#fbbf24" }} />
                                {meta.rating} / 5.0
                            </span>
                            {!loading && (
                                <span className="dest-badge">
                                    🚢 {ships.length} cruise{ships.length !== 1 ? "s" : ""} available
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="dest-body">

                {/* Toolbar */}
                <div className="dest-toolbar">
                    <p className="dest-toolbar-count">
                        {loading ? "Loading..." : `${sorted.length} cruise${sorted.length !== 1 ? "s" : ""} found`}
                    </p>
                    <div className="dest-sort-wrap">
                        <label className="dest-sort-label">Sort by:</label>
                        <select
                            className="dest-sort-select"
                            value={sort}
                            onChange={e => setSort(e.target.value as SortKey)}
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="dest-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="dest-skeleton" />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && sorted.length === 0 && (
                    <div className="dest-empty">
                        <div className="dest-empty-icon">🚢</div>
                        <h3 className="dest-empty-title">No cruises found</h3>
                        <p className="dest-empty-desc">
                            We don&apos;t have cruises listed for this destination yet. Check back soon or browse all available cruises.
                        </p>
                        <LocaleLink href="/cruises" className="dest-empty-btn">
                            Browse All Cruises
                        </LocaleLink>
                    </div>
                )}

                {/* Cruise grid */}
                {!loading && sorted.length > 0 && (
                    <div className="dest-grid">
                        {sorted.map((ship, idx) => (
                            <DestCruiseCard key={`${ship.id}-${idx}`} ship={ship} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Cruise Card ──────────────────────────────────────────────────────────
function DestCruiseCard({ ship }: { ship: ParsedShip }) {
    return (
        <LocaleLink href={`/cruises/${ship.slug}`} className="dest-card">
            {/* Image */}
            <div className="dest-card-img-wrap">
                {ship.imageMain ? (
                    <Image
                        src={ship.imageMain}
                        alt={ship.name}
                        fill
                        className="dest-card-img"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="dest-card-img-placeholder">🚢</div>
                )}
                <div className="dest-card-img-overlay" />
                {ship.tripDuration && (
                    <span className="dest-card-duration-badge">
                        <ClockIcon style={{ width: 11, height: 11 }} />
                        {ship.tripDuration} days
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="dest-card-body">
                <p className="dest-card-trip">{ship.tripName || "Cruise Package"}</p>
                <h3 className="dest-card-name">{ship.name}</h3>

                {/* Stats row */}
                <div className="dest-card-stats">
                    {ship.cabinCount > 0 && (
                        <span className="dest-card-stat">
                            <UsersIcon style={{ width: 13, height: 13 }} />
                            {ship.cabinCount} cabin{ship.cabinCount !== 1 ? "s" : ""}
                        </span>
                    )}
                    {ship.totalCapacity > 0 && (
                        <span className="dest-card-stat">
                            👤 {ship.totalCapacity} guests
                        </span>
                    )}
                </div>

                {/* Facilities */}
                <div className="dest-card-facilities">
                    {ship.facilities?.hasSeaview && <span className="dest-fac-tag">Sea View</span>}
                    {ship.facilities?.hasBalcony && <span className="dest-fac-tag dest-fac-green">Balcony</span>}
                    {ship.facilities?.hasBathtub && <span className="dest-fac-tag dest-fac-purple">Bathtub</span>}
                    {ship.facilities?.hasJacuzzi && <span className="dest-fac-tag dest-fac-amber">Jacuzzi</span>}
                </div>

                {/* Footer */}
                <div className="dest-card-footer">
                    <div>
                        {ship.lowestPrice > 0 ? (
                            <>
                                <p className="dest-card-from">From</p>
                                <p className="dest-card-price">{formatPrice(ship.lowestPrice)}</p>
                                <p className="dest-card-per">/night</p>
                            </>
                        ) : (
                            <p className="dest-card-price-req">Price on request</p>
                        )}
                    </div>
                    <span className="dest-card-cta">See Details →</span>
                </div>
            </div>
        </LocaleLink>
    );
}
