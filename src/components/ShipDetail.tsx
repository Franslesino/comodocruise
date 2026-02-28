"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LocaleLink from "./LocaleLink";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n";
import {
    fetchShips,
    fetchAllCabins,
    fetchCabinDetails,
    fetchAndAggregateAvailability,
    boatNamesMatch,
    cabinNamesMatch,
    convertGoogleDriveUrl,
    isValidImageUrl,
    formatPrice,
    getDirectImageUrl,
    toLocalDateStr,
} from "@/lib/api";
import type { ParsedShip, CabinData, CabinWithDates, OperatorAvailabilityWithDates, ItineraryItem } from "@/types/api";
import type { ReactNode } from "react";
import "@/styles/ship-detail.css";
import "@/styles/results.css";

/* ─── helpers ─── */
const PLACEHOLDER_PRICE = 43243243;

function formatIDR(price: number): string {
    if (price <= 0 || price === PLACEHOLDER_PRICE) return "Contact for price";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

function pseudoRating(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 9.5 + (hash % 5) * 0.1;
}

function pseudoReviewCount(name: string): number {
    const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 100 + (hash % 400);
}

function ratingLabel(r: number) {
    if (r >= 9.5) return "Excellent";
    if (r >= 9.0) return "Wonderful";
    if (r >= 8.5) return "Very Good";
    return "Good";
}

/* facility icons SVG */
const FACILITY_ICONS: Record<string, { label: string; icon: ReactNode }> = {
    balcony: {
        label: "Balcony",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="sd-fac-icon">
                <path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-4h6v4M9 9h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    bathtub: {
        label: "Bathtub",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="sd-fac-icon">
                <path d="M4 12h16v5a3 3 0 01-3 3H7a3 3 0 01-3-3v-5zM6 12V5a2 2 0 012-2h1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    seaview: {
        label: "Sea View",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="sd-fac-icon">
                <path d="M2 12c2-3 5-5 10-5s8 2 10 5M2 17c2-2 5-3 10-3s8 1 10 3" strokeLinecap="round" />
                <circle cx="17" cy="7" r="3" />
            </svg>
        ),
    },
    jacuzzi: {
        label: "Jacuzzi",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="sd-fac-icon">
                <path d="M4 14h16v4a3 3 0 01-3 3H7a3 3 0 01-3-3v-4zM8 14V8M12 14V6M16 14V8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    largeBed: {
        label: "Large Bed",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="sd-fac-icon">
                <path d="M3 18v-5a2 2 0 012-2h14a2 2 0 012 2v5M3 18h18M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
};

/* ─── filter dates to weekly departures ─── */
const filterDatesToWeeklyDepartures = (dates: string[]): string[] => {
    if (dates.length === 0) return [];
    const sortedDates = [...dates].sort();
    const result: string[] = [sortedDates[0]];
    let lastDate = new Date(sortedDates[0]);
    for (let i = 1; i < sortedDates.length; i++) {
        const current = new Date(sortedDates[i]);
        const daysDiff = Math.floor((current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
            result.push(sortedDates[i]);
            lastDate = current;
        }
    }
    return result;
};

/* ─── Generate calendar days for a month ─── */
function generateCalendarDays(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < adjustedStartDay; i++) {
        days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
    }
    return days;
}

/* ─── Component ─── */
export default function ShipDetail({ slug }: { slug: string }) {
    const [ship, setShip] = useState<ParsedShip | null>(null);
    const [cabins, setCabins] = useState<CabinWithDates[]>([]);
    const [otherShips, setOtherShips] = useState<ParsedShip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const pathname = usePathname();
    const locale = getLocaleFromPathname(pathname);

    /* gallery state */
    const [galleryIdx, setGalleryIdx] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    /* sticky nav state */
    const [activeSection, setActiveSection] = useState("overview");
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const navRef = useRef<HTMLDivElement>(null);

    /* ─── cabin card state (matching SearchResults) ─── */
    const [cabinImagesCache, setCabinImagesCache] = useState<Record<string, string[]>>({});
    const [cabinImageIndices, setCabinImageIndices] = useState<Record<string, number>>({});
    const [openCabinDates, setOpenCabinDates] = useState<string | null>(null);
    const [selectedCabinForDetail, setSelectedCabinForDetail] = useState<CabinData | null>(null);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [cabinSelectedDates, setCabinSelectedDates] = useState<Record<string, { dateFrom: string; dateTo: string }>>({});
    const [shipAvailableDates, setShipAvailableDates] = useState<string[]>([]);
    const cabinDatesDropdownRef = useRef<HTMLDivElement>(null);

    /* date range picker state */
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState<{ dateFrom: string; dateTo: string } | null>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    /* ─── itinerary + reservation state ─── */
    const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
    const [showItineraryPanel, setShowItineraryPanel] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [pendingReservation, setPendingReservation] = useState<{
        cabin: CabinData; shipName: string; selectedDate: string;
    } | null>(null);
    const [guestCount, setGuestCount] = useState(2);
    const [maxGuestsForCabin, setMaxGuestsForCabin] = useState(4);

    /* ─── Swipe state for cabin gallery ─── */
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = (cabinId: string) => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleCabinNextImage(cabinId, { stopPropagation: () => { } } as React.MouseEvent);
        }
        if (isRightSwipe) {
            handleCabinPrevImage(cabinId, { stopPropagation: () => { } } as React.MouseEvent);
        }
    };
    /* ─── Phase 1: fetch ship + cabins (fast, cached) → render immediately ─── */
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [allShips, allCabins] = await Promise.all([
                    fetchShips(),
                    fetchAllCabins(),
                ]);
                if (cancelled) return;

                const found = allShips.find((s) => s.slug === slug);
                if (!found) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const shipCabins = allCabins.filter((c) =>
                    boatNamesMatch(c.boat_name, found.name)
                );

                setShip(found);
                // Show cabins without dates right away
                setCabins(shipCabins.map(c => ({ ...c, availableDates: [] })));
                setOtherShips(allShips.filter((s) => s.slug !== slug).slice(0, 4));
                setLoading(false);

                // ─── Phase 2: enrich with availability in the background ───
                try {
                    const today = new Date();
                    const dateFrom = toLocalDateStr(today);
                    const futureDate = new Date(today);
                    futureDate.setDate(futureDate.getDate() + 90);
                    const dateTo = toLocalDateStr(futureDate);

                    const availabilityMap = await fetchAndAggregateAvailability(dateFrom, dateTo);
                    if (cancelled) return;

                    let operatorData: OperatorAvailabilityWithDates | undefined;
                    availabilityMap.forEach((op) => {
                        if (boatNamesMatch(op.operator, found.name)) {
                            operatorData = op;
                        }
                    });

                    if (operatorData) {
                        setShipAvailableDates(operatorData.availableDates || []);
                        const cabinsWithDates = shipCabins.map(cabin => {
                            const matchCabin = operatorData!.cabins.find(ac =>
                                cabinNamesMatch(cabin.cabin_name, ac.name) ||
                                cabinNamesMatch(cabin.cabin_name_api, ac.name)
                            );
                            return {
                                ...cabin,
                                availableDates: matchCabin?.availableDates || operatorData!.availableDates || [],
                            };
                        });
                        if (!cancelled) setCabins(cabinsWithDates);
                    }
                } catch {
                    // Availability fetch failed silently — page already rendered
                }
            } catch {
                if (!cancelled) setError(true);
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [slug]);

    /* Fetch cabin detail images */
    useEffect(() => {
        if (cabins.length === 0) return;
        const toFetch = cabins.filter(c => !cabinImagesCache[c.cabin_id]);
        if (toFetch.length === 0) return;
        Promise.all(toFetch.map(c => fetchCabinDetails(c.cabin_id))).then(results => {
            const newCache: Record<string, string[]> = {};
            results.forEach((detail, idx) => {
                if (detail && (detail as CabinData & { images?: string[] }).images) {
                    const imgs = ((detail as CabinData & { images?: string[] }).images || []).filter(isValidImageUrl);
                    if (imgs.length > 0) newCache[toFetch[idx].cabin_id] = imgs;
                }
            });
            if (Object.keys(newCache).length > 0) {
                setCabinImagesCache(prev => ({ ...prev, ...newCache }));
            }
        }).catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cabins]);

    /* intersection observer for sticky nav highlight */
    useEffect(() => {
        const entries = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
        if (entries.length === 0) return;

        const observer = new IntersectionObserver(
            (observed) => {
                for (const entry of observed) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
        );

        entries.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [ship]);

    /* close date picker on click outside */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showDatePicker &&
                datePickerRef.current &&
                !datePickerRef.current.contains(event.target as Node) &&
                !(event.target as HTMLElement).closest('.sd-date-picker-btn')
            ) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDatePicker]);

    /* ─── Date picker helpers ─── */
    const handleDateClick = useCallback((date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return;

        const dateStr = toLocalDateStr(date);

        // Check if date is available
        if (!shipAvailableDates.includes(dateStr)) return;

        // Range selection logic
        if (!selectedDateRange || selectedDateRange.dateTo) {
            // Start new range
            setSelectedDateRange({ dateFrom: dateStr, dateTo: '' });
        } else if (date < new Date(selectedDateRange.dateFrom)) {
            // Swap if selected date is before start
            setSelectedDateRange({ dateFrom: dateStr, dateTo: selectedDateRange.dateFrom });
        } else if (dateStr === selectedDateRange.dateFrom) {
            // Toggle off if clicking same date
            setSelectedDateRange(null);
        } else {
            // Set end date
            setSelectedDateRange({ dateFrom: selectedDateRange.dateFrom, dateTo: dateStr });
        }
    }, [selectedDateRange, shipAvailableDates]);

    const isDateSelected = useCallback((date: Date): boolean => {
        if (!selectedDateRange) return false;
        const dateStr = toLocalDateStr(date);
        return dateStr === selectedDateRange.dateFrom || dateStr === selectedDateRange.dateTo;
    }, [selectedDateRange]);

    const isDateInRange = useCallback((date: Date): boolean => {
        if (!selectedDateRange || !selectedDateRange.dateTo) return false;
        const dateStr = toLocalDateStr(date);
        return dateStr > selectedDateRange.dateFrom && dateStr < selectedDateRange.dateTo;
    }, [selectedDateRange]);

    const isDateAvailable = useCallback((date: Date): boolean => {
        const dateStr = toLocalDateStr(date);
        return shipAvailableDates.includes(dateStr);
    }, [shipAvailableDates]);

    const scrollTo = useCallback((id: string) => {
        const el = sectionRefs.current[id];
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 130;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, []);

    /* ─── Cabin gallery helpers ─── */
    const getCabinGalleryImages = useCallback((cabin: CabinData): string[] => {
        const cached = cabinImagesCache[cabin.cabin_id];
        if (cached && cached.length > 0) return cached;
        const images: string[] = [];
        if (cabin.image_main) images.push(cabin.image_main);
        return images.length > 0 ? images : ["/placeholder-cabin.svg"];
    }, [cabinImagesCache]);

    const handleCabinPrevImage = (cabinId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cabin = cabins.find(c => c.cabin_id === cabinId);
        if (!cabin) return;
        const images = getCabinGalleryImages(cabin);
        const currentIndex = cabinImageIndices[cabinId] || 0;
        setCabinImageIndices(prev => ({
            ...prev,
            [cabinId]: (currentIndex - 1 + images.length) % images.length
        }));
    };

    const handleCabinNextImage = (cabinId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cabin = cabins.find(c => c.cabin_id === cabinId);
        if (!cabin) return;
        const images = getCabinGalleryImages(cabin);
        const currentIndex = cabinImageIndices[cabinId] || 0;
        setCabinImageIndices(prev => ({
            ...prev,
            [cabinId]: (currentIndex + 1) % images.length
        }));
    };

    /* ─── Cabin date helpers ─── */
    const getAvailableDatesForCabin = useCallback((cabin: CabinData | CabinWithDates): string[] => {
        if ("availableDates" in cabin && cabin.availableDates && cabin.availableDates.length > 0) {
            return filterDatesToWeeklyDepartures(cabin.availableDates);
        }
        if (shipAvailableDates.length > 0) return filterDatesToWeeklyDepartures(shipAvailableDates);
        return [];
    }, [shipAvailableDates]);

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "Select date";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    /* ─── Cabin detail modal ─── */
    const openCabinDetail = (cabin: CabinData) => {
        setSelectedCabinForDetail(cabin);
        setModalImageIndex(0);
        document.body.style.overflow = "hidden";
    };

    const closeCabinDetail = () => {
        setSelectedCabinForDetail(null);
        document.body.style.overflow = "";
    };

    const nextModalImage = () => {
        if (!selectedCabinForDetail) return;
        const images = getCabinGalleryImages(selectedCabinForDetail);
        setModalImageIndex(prev => (prev + 1) % images.length);
    };

    const prevModalImage = () => {
        if (!selectedCabinForDetail) return;
        const images = getCabinGalleryImages(selectedCabinForDetail);
        setModalImageIndex(prev => (prev - 1 + images.length) % images.length);
    };

    const getPriceSymbol = (priceStr: string) => priceStr.replace(/[0-9,.\s]/g, "").trim() || "Rp";
    const getPriceVal = (priceStr: string) => priceStr.replace(/[^0-9,.\s]/g, "").trim();

    /* ─── Load itinerary from localStorage ─── */
    useEffect(() => {
        try {
            const saved = localStorage.getItem("KOMODOCRUISES_itinerary");
            if (saved) setItineraryItems(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    /* ─── Reservation handlers ─── */
    const openGuestModal = (cabin: CabinData, shipName: string, selectedDate: string) => {
        setPendingReservation({ cabin, shipName, selectedDate });
        setGuestCount(2);
        setMaxGuestsForCabin(cabin.total_capacity || 4);
        setShowGuestModal(true);
        document.body.style.overflow = "hidden";
    };

    const closeGuestModal = () => {
        setShowGuestModal(false);
        setPendingReservation(null);
        document.body.style.overflow = "";
    };

    const confirmReservation = () => {
        if (!pendingReservation) return;
        const newItem: ItineraryItem = {
            cabin: pendingReservation.cabin.cabin_name,
            ship: pendingReservation.shipName,
            date: pendingReservation.selectedDate,
            price: pendingReservation.cabin.price || ship?.lowestPrice || 0,
            guests: guestCount,
            addedAt: Date.now(),
        };
        const updated = [...itineraryItems, newItem];
        setItineraryItems(updated);
        localStorage.setItem("KOMODOCRUISES_itinerary", JSON.stringify(updated));

        closeGuestModal();
        setOpenCabinDates(null);
        setShowItineraryPanel(true);
    };

    const unsubscribeItineraryListener = useCallback(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "KOMODOCRUISES_itinerary") {
                try {
                    setItineraryItems(e.newValue ? JSON.parse(e.newValue) : []);
                } catch { }
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    useEffect(() => {
        const unsubscribe = unsubscribeItineraryListener();
        return unsubscribe;
    }, [unsubscribeItineraryListener]);

    const itineraryTotal = itineraryItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    const removeFromItinerary = (index: number) => {
        const updated = itineraryItems.filter((_, i) => i !== index);
        setItineraryItems(updated);
        localStorage.setItem("KOMODOCRUISES_itinerary", JSON.stringify(updated));
    };

    const isCabinInItinerary = (cabinName: string, shipName: string, date: string) =>
        itineraryItems.some(it => it.cabin === cabinName && it.ship === shipName && it.date === date);

    /* Gallery images — combine main + extras, filter invalid */
    const galleryImages =
        ship
            ? [ship.imageMain, ...ship.images].filter(
                (url, i, arr) => url && isValidImageUrl(url) && arr.indexOf(url) === i
            )
            : [];

    const prevGallery = () => setGalleryIdx((p) => (p - 1 + galleryImages.length) % galleryImages.length);
    const nextGallery = () => setGalleryIdx((p) => (p + 1) % galleryImages.length);

    /* ─── Render states ─── */
    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <p>Loading ship details...</p>
            </div>
        );
    }

    if (error || !ship) {
        return (
            <div className="sd-error">
                <h1>Ship Not Found</h1>
                <p>We could not find the ship you're looking for.</p>
                <LocaleLink href="/cruises" className="sd-back-btn">
                    ← Back to Cruises
                </LocaleLink>
            </div>
        );
    }

    const rating = pseudoRating(ship.name);
    const reviewCount = pseudoReviewCount(ship.name);
    const destList = ship.destinations
        ? ship.destinations.split(/[,→\-–]/).map((s) => s.trim()).filter(Boolean)
        : [ship.tripName || "Komodo"];

    const validCabins = cabins.filter(
        (c) => c.price > 0 && c.price !== PLACEHOLDER_PRICE
    );
    const allCabinsForDisplay = cabins.length > 0 ? cabins : [];

    /* Facilities summary from cabins */
    const shipFacilities: string[] = [];
    if (ship.facilities.hasBalcony) shipFacilities.push("balcony");
    if (ship.facilities.hasBathtub) shipFacilities.push("bathtub");
    if (ship.facilities.hasSeaview) shipFacilities.push("seaview");
    if (ship.facilities.hasJacuzzi) shipFacilities.push("jacuzzi");

    /* Nav tabs */
    const NAV_TABS = [
        { id: "overview", label: "Overview" },
        { id: "availability", label: "Availability" },
        { id: "about", label: "About" },
        { id: "reviews", label: "Reviews" },
        { id: "similar", label: "Similar Cruises" },
    ];

    return (
        <div className="sd-page">
            {/* Breadcrumb */}
            <nav className="sd-breadcrumb-bar" aria-label="Breadcrumb">
                <div className="sd-breadcrumb-bar-inner">
                    <LocaleLink href={localizePath("/", locale)} className="sd-bc-bar-link">Home</LocaleLink>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sd-bc-bar-sep"><polyline points="9 18 15 12 9 6" /></svg>
                    <LocaleLink href={localizePath("/cruises", locale)} className="sd-bc-bar-link">Cruises</LocaleLink>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sd-bc-bar-sep"><polyline points="9 18 15 12 9 6" /></svg>
                    <span className="sd-bc-bar-current">{ship.name}</span>
                </div>
            </nav>

            {/* ══════════ HERO SECTION - Similar to Halong Bay Tours ══════════ */}
            <section className="sd-hero-new">
                <div className="sd-hero-container">
                    {/* Left: Large Gallery */}
                    <div className="sd-hero-gallery">
                        <div className="sd-main-image" onClick={() => setLightboxOpen(true)}>
                            {galleryImages.length > 0 && (
                                <Image
                                    src={galleryImages[galleryIdx]}
                                    alt={`${ship.name} - Photo ${galleryIdx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 60vw"
                                    priority
                                />
                            )}

                            {/* Navigation arrows */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button className="sd-nav-arrow sd-nav-prev" onClick={(e) => { e.stopPropagation(); prevGallery(); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <button className="sd-nav-arrow sd-nav-next" onClick={(e) => { e.stopPropagation(); nextGallery(); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                                    </button>
                                </>
                            )}

                            {/* Photo count badge */}
                            <div className="sd-photo-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                </svg>
                                +{galleryImages.length} photos
                            </div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="sd-thumbnail-grid">
                            {galleryImages.slice(0, 4).map((url, i) => (
                                <button
                                    key={i}
                                    className={`sd-thumbnail ${i === galleryIdx ? "active" : ""}`}
                                    onClick={() => setGalleryIdx(i)}
                                >
                                    <Image src={url} alt="" fill className="object-cover" sizes="150px" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Card */}
                    <div className="sd-hero-info-card">
                        <div className="sd-breadcrumb-new">
                            <LocaleLink href="/">Home</LocaleLink>
                            <span>/</span>
                            <LocaleLink href="/cruises">Cruises</LocaleLink>
                            <span>/</span>
                            <span>{ship.name}</span>
                        </div>

                        <h1 className="sd-ship-title">{ship.name}</h1>

                        <div className="sd-ship-meta">
                            <span className="sd-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                </svg>
                                {ship.tripDuration} Days / {Math.max(1, parseInt(ship.tripDuration) - 1)} Nights
                            </span>
                            <span className="sd-meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                                </svg>
                                {ship.cabinCount} Cabins
                            </span>
                        </div>

                        {/* Ship features */}
                        <div className="sd-features-icons">
                            {destList.slice(0, 3).map((dest, i) => (
                                <span key={i} className="sd-feature-tag">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                    {dest}
                                </span>
                            ))}
                        </div>

                        {/* Price Display */}
                        <div className="sd-price-display">
                            <div className="sd-price-top">
                                <span className="sd-price-label">Prices starting from:</span>
                                <span className="sd-price-old">{formatIDR(ship.lowestPrice * 1.1)}</span>
                            </div>
                            <div className="sd-price-main">
                                <span className="sd-price-amount">{formatIDR(ship.lowestPrice)}</span>
                                <span className="sd-price-unit">per person</span>
                            </div>
                            <button className="sd-view-calendar-btn" onClick={() => scrollTo("availability")}>
                                View price calendar
                            </button>
                        </div>

                        <hr className="sd-divider" />

                        {/* Ship Stats */}
                        <div className="sd-ship-stats">
                            <div className="sd-stat-item">
                                <span className="sd-stat-label">Built:</span>
                                <span className="sd-stat-value">2020</span>
                            </div>
                            <div className="sd-stat-item">
                                <span className="sd-stat-label">Cabins:</span>
                                <span className="sd-stat-value">{ship.cabinCount}</span>
                            </div>
                            <div className="sd-stat-item">
                                <span className="sd-stat-label">Type:</span>
                                <span className="sd-stat-value">Steel Boat</span>
                            </div>
                            <div className="sd-stat-item">
                                <span className="sd-stat-label">Route:</span>
                                <span className="sd-stat-value">{ship.tripName}</span>
                            </div>
                            <div className="sd-stat-item">
                                <span className="sd-stat-label">Meals:</span>
                                <span className="sd-stat-value">Full board included</span>
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="sd-rating-box">
                            <div className="sd-rating-score">
                                <span className="sd-score">{rating.toFixed(1)}</span>
                                <div className="sd-rating-text">
                                    <span className="sd-rating-status">{ratingLabel(rating)}</span>
                                    <span className="sd-rating-reviews">Based on {reviewCount} reviews</span>
                                </div>
                            </div>
                        </div>

                        {/* Facilities */}
                        {shipFacilities.length > 0 && (
                            <div className="sd-facilities-list">
                                {shipFacilities.map((f) => {
                                    const fac = FACILITY_ICONS[f];
                                    return fac ? (
                                        <span key={f} className="sd-facility-item">
                                            {fac.icon}
                                            {fac.label}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}

                        {/* CTA Button */}
                        <button className="sd-check-availability-btn" onClick={() => scrollTo("availability")}>
                            Check availability
                        </button>
                    </div>
                </div>
            </section>

            {/* ══════════ STICKY NAV ══════════ */}
            <nav className="sd-sticky-nav-new" ref={navRef}>
                <div className="sd-nav-container">
                    {NAV_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`sd-nav-link ${activeSection === tab.id ? "active" : ""}`}
                            onClick={() => scrollTo(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* ══════════ OVERVIEW ══════════ */}
            <section id="overview" ref={(el) => { sectionRefs.current["overview"] = el; }} className="sd-section-new">
                <div className="sd-section-container">
                    <h2 className="sd-section-heading">About {ship.name}</h2>
                    <div className="sd-overview-content-new">
                        <p className="sd-description-text">{ship.description}</p>

                        {/* What we love most */}
                        <div className="sd-love-section">
                            <h3 className="sd-love-title">5 things that we love most about {ship.name}</h3>
                            <ul className="sd-love-list">
                                <li>Spectacular {ship.tripDuration}-day journey through {destList[0]}</li>
                                <li>Spacious {ship.cabinCount} cabins with modern amenities</li>
                                <li>Experienced crew and excellent service</li>
                                <li>Delicious meals included throughout the journey</li>
                                <li>Perfect blend of adventure and relaxation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ AVAILABILITY & CABINS ══════════ */}
            <section id="availability" ref={(el) => { sectionRefs.current["availability"] = el; }} className="sd-section-new sd-section-gray">
                <div className="sd-section-container">
                    <div className="sd-availability-header">
                        <h2 className="sd-section-heading">Availability</h2>
                        <div className="sd-booking-summary">
                            <div className="sd-booking-summary-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                </svg>
                                <span>Cruise Duration: {ship.tripDuration} Days/{Math.max(1, parseInt(ship.tripDuration) - 1)} Night</span>
                            </div>
                            <div className="sd-booking-summary-item" style={{ position: 'relative' }}>
                                <button
                                    className="sd-date-picker-btn"
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span>
                                        {selectedDateRange
                                            ? `${new Date(selectedDateRange.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(selectedDateRange.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                            : 'Select dates'
                                        }
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginLeft: '0.5rem' }}>
                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                {showDatePicker && (
                                    <div className="sd-date-picker-dropdown" ref={datePickerRef}>
                                        <div className="sd-date-picker-header">
                                            <h4>Select travel dates</h4>
                                            <button
                                                className="sd-date-picker-close"
                                                onClick={() => setShowDatePicker(false)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>

                                        {selectedDateRange && (
                                            <div className="sd-date-picker-info">
                                                <p>Selected: {new Date(selectedDateRange.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {selectedDateRange.dateTo && ` - ${new Date(selectedDateRange.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                                </p>
                                                <button
                                                    className="sd-date-clear-btn"
                                                    onClick={() => setSelectedDateRange(null)}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}

                                        <div className="sd-calendar-nav">
                                            <button
                                                className="sd-calendar-nav-btn"
                                                onClick={() => {
                                                    if (calendarMonth === 0) {
                                                        setCalendarMonth(11);
                                                        setCalendarYear(calendarYear - 1);
                                                    } else {
                                                        setCalendarMonth(calendarMonth - 1);
                                                    }
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button
                                                className="sd-calendar-nav-btn"
                                                onClick={() => {
                                                    if (calendarMonth === 11) {
                                                        setCalendarMonth(0);
                                                        setCalendarYear(calendarYear + 1);
                                                    } else {
                                                        setCalendarMonth(calendarMonth + 1);
                                                    }
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="sd-calendar-grid-container">
                                            {/* Month 1 */}
                                            <div className="sd-calendar-month">
                                                <div className="sd-calendar-month-label">
                                                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="sd-calendar-days-header">
                                                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                                        <div key={day} className="sd-calendar-day-label">{day}</div>
                                                    ))}
                                                </div>
                                                <div className="sd-calendar-days-grid">
                                                    {generateCalendarDays(calendarYear, calendarMonth).map((date, idx) => {
                                                        if (!date) {
                                                            return <div key={`empty-${idx}`} className="sd-calendar-day-empty" />;
                                                        }

                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const isPast = date < today;
                                                        const available = isDateAvailable(date);
                                                        const selected = isDateSelected(date);
                                                        const inRange = isDateInRange(date);

                                                        return (
                                                            <button
                                                                key={idx}
                                                                className={`sd-calendar-day ${isPast ? 'past' : ''} ${!available ? 'unavailable' : ''} ${selected ? 'selected' : ''} ${inRange ? 'in-range' : ''}`}
                                                                onClick={() => !isPast && handleDateClick(date)}
                                                                disabled={isPast}
                                                            >
                                                                {date.getDate()}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Month 2 */}
                                            {(() => {
                                                const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
                                                const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                                                return (
                                                    <div className="sd-calendar-month">
                                                        <div className="sd-calendar-month-label">
                                                            {new Date(nextYear, nextMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <div className="sd-calendar-days-header">
                                                            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                                                                <div key={day} className="sd-calendar-day-label">{day}</div>
                                                            ))}
                                                        </div>
                                                        <div className="sd-calendar-days-grid">
                                                            {generateCalendarDays(nextYear, nextMonth).map((date, idx) => {
                                                                if (!date) {
                                                                    return <div key={`empty-${idx}`} className="sd-calendar-day-empty" />;
                                                                }

                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const isPast = date < today;
                                                                const available = isDateAvailable(date);
                                                                const selected = isDateSelected(date);
                                                                const inRange = isDateInRange(date);

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        className={`sd-calendar-day ${isPast ? 'past' : ''} ${!available ? 'unavailable' : ''} ${selected ? 'selected' : ''} ${inRange ? 'in-range' : ''}`}
                                                                        onClick={() => !isPast && handleDateClick(date)}
                                                                        disabled={isPast}
                                                                    >
                                                                        {date.getDate()}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="sd-calendar-legend">
                                            <div className="sd-calendar-legend-item">
                                                <span className="sd-legend-circle available"></span>
                                                <span>Available</span>
                                            </div>
                                            <div className="sd-calendar-legend-item">
                                                <span className="sd-legend-circle selected"></span>
                                                <span>Selected</span>
                                            </div>
                                            <div className="sd-calendar-legend-item">
                                                <span className="sd-legend-circle unavailable"></span>
                                                <span>Not available</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {allCabinsForDisplay.length === 0 ? (
                        <div className="sd-no-data">
                            <p>Cabin information is not yet available. Please contact us for details.</p>
                        </div>
                    ) : (
                        <div className="sd-cabins-table">
                            <table className="sd-table">
                                <thead>
                                    <tr>
                                        <th className="sd-th-image">Room Photos</th>
                                        <th>Room Types</th>
                                        <th className="sd-th-center">Max</th>
                                        <th className="sd-th-right">Rates (per cabin)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allCabinsForDisplay.map((cabin, idx) => {
                                        const cabinImages = getCabinGalleryImages(cabin);
                                        const currentImageIndex = cabinImageIndices[cabin.cabin_id] || 0;
                                        const cabinAvailDates = getAvailableDatesForCabin(cabin);
                                        const isOpenDates = openCabinDates === cabin.cabin_id;
                                        const tripNights = Math.max(1, parseInt(ship.tripDuration) - 1);

                                        return (
                                            <Fragment key={cabin.cabin_id || idx}>
                                                <tr className="sd-cabin-row">
                                                    <td className="sd-cabin-image-cell">
                                                        <div className="sd-cabin-carousel">
                                                            <div
                                                                className="sd-cabin-carousel-img-wrapper"
                                                                onTouchStart={onTouchStart}
                                                                onTouchMove={onTouchMove}
                                                                onTouchEnd={() => onTouchEnd(cabin.cabin_id)}
                                                            >
                                                                <Image
                                                                    src={getDirectImageUrl(cabinImages[currentImageIndex])}
                                                                    alt={cabin.cabin_name}
                                                                    width={280}
                                                                    height={200}
                                                                    className="sd-cabin-carousel-img"
                                                                    unoptimized
                                                                />
                                                                {cabinImages.length > 1 && (
                                                                    <>
                                                                        <button
                                                                            className="sd-cabin-carousel-btn sd-cabin-carousel-btn-prev"
                                                                            onClick={(e) => handleCabinPrevImage(cabin.cabin_id, e)}
                                                                            aria-label="Previous image"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            className="sd-cabin-carousel-btn sd-cabin-carousel-btn-next"
                                                                            onClick={(e) => handleCabinNextImage(cabin.cabin_id, e)}
                                                                            aria-label="Next image"
                                                                        >
                                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </button>
                                                                        <div className="sd-cabin-carousel-dots">
                                                                            {cabinImages.map((_, imgIdx) => (
                                                                                <button
                                                                                    key={imgIdx}
                                                                                    className={`sd-cabin-carousel-dot ${imgIdx === currentImageIndex ? 'active' : ''}`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setCabinImageIndices(prev => ({
                                                                                            ...prev,
                                                                                            [cabin.cabin_id]: imgIdx
                                                                                        }));
                                                                                    }}
                                                                                    aria-label={`Go to image ${imgIdx + 1}`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="sd-cabin-info-cell">
                                                        <div className="sd-cabin-info-content">
                                                            <h4 className="sd-cabin-name">{cabin.cabin_name}</h4>
                                                            {cabin.facilities?.balcony && (
                                                                <span className="sd-cabin-badge">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-4h6v4" />
                                                                    </svg>
                                                                    Room with balcony
                                                                </span>
                                                            )}
                                                            <div className="sd-cabin-details">
                                                                <div className="sd-detail-item">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                                    </svg>
                                                                    <span><strong>Size:</strong> 36 sqm</span>
                                                                </div>
                                                                <div className="sd-detail-item">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                                    </svg>
                                                                    <span><strong>Max Adults:</strong> {cabin.total_capacity || 2}</span>
                                                                </div>
                                                                <div className="sd-detail-item">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                                                    </svg>
                                                                    <span><strong>Bed options:</strong> {cabin.facilities?.large_bed ? "King Bed or 2 Twins" : "Double Bed or 2 Beds"}</span>
                                                                </div>
                                                                <div className="sd-detail-item">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                                                    </svg>
                                                                    <span><strong>Extra beds available:</strong></span>
                                                                </div>
                                                                <ul className="sd-extra-beds-list">
                                                                    <li>● Rollaway bed</li>
                                                                    <li>● Crib</li>
                                                                </ul>
                                                            </div>
                                                            <button
                                                                className="sd-show-more-link"
                                                                onClick={() => openCabinDetail(cabin)}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                                                </svg>
                                                                Show more
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="sd-max-cell">
                                                        <div className="sd-guest-icons">
                                                            {Array(cabin.total_capacity || 2).fill(0).map((_, i) => (
                                                                <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <div className="sd-plus-icon">+</div>
                                                    </td>
                                                    <td className="sd-price-cell">
                                                        <div className="sd-price-info-new">
                                                            <div className="sd-choose-dates-notice">
                                                                {cabinAvailDates.length > 0 ? `${cabinAvailDates.length} dates available` : 'No dates available'}
                                                            </div>
                                                            <span className="sd-price-amount-new">{formatPrice(cabin.price || ship.lowestPrice || 0)}</span>
                                                            <span className="sd-price-per-night">per person / night</span>
                                                            <button
                                                                className="sd-more-dates-btn"
                                                                onClick={() => setOpenCabinDates(isOpenDates ? null : cabin.cabin_id)}
                                                            >
                                                                {isOpenDates ? 'LESS DATES' : 'MORE DATES'}
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: isOpenDates ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Available Dates Row */}
                                                {isOpenDates && (
                                                    <tr className="sd-dates-row">
                                                        <td colSpan={4} className="sd-dates-cell">
                                                            <div className="sd-dates-container" ref={cabinDatesDropdownRef}>
                                                                {cabinAvailDates.length === 0 ? (
                                                                    <div className="sd-no-dates">No available dates found</div>
                                                                ) : (
                                                                    <>
                                                                        {/* Desktop: detailed cards */}
                                                                        <div className="sd-dates-list sd-dates-list-desktop">
                                                                            {cabinAvailDates.slice(0, 10).map((date, dateIdx) => {
                                                                                const startDate = new Date(date);
                                                                                const endDate = new Date(date);
                                                                                endDate.setDate(endDate.getDate() + tripNights);

                                                                                // Get day of week
                                                                                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                                                const departureDay = dayNames[startDate.getDay()];

                                                                                // Calculate if date is within 30 days (urgency indicator)
                                                                                const today = new Date();
                                                                                const daysUntilDeparture = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                                                const isUrgent = daysUntilDeparture > 0 && daysUntilDeparture <= 30;

                                                                                return (
                                                                                    <div key={dateIdx} className="sd-date-option-detailed">
                                                                                        <div className="sd-date-option-left">
                                                                                            <div className="sd-date-departure-info">
                                                                                                <span className="sd-date-day">{departureDay}</span>
                                                                                                <span className="sd-date-range-detailed">
                                                                                                    {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ margin: '0 0.5rem' }}>
                                                                                                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                                                                                    </svg>
                                                                                                    {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                                                </span>
                                                                                                <span className="sd-date-duration">
                                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: '4px' }}>
                                                                                                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                                                                                    </svg>
                                                                                                    {ship.tripDuration} Days / {tripNights} Nights
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="sd-date-cabin-details">
                                                                                                <span className="sd-date-cabin-info">
                                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginRight: '4px' }}>
                                                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                                                    </svg>
                                                                                                    {cabin.cabin_name} • Max {cabin.total_capacity} guests
                                                                                                </span>
                                                                                                <span className="sd-date-cabin-facilities">
                                                                                                    {cabin.facilities.balcony && (
                                                                                                        <span className="sd-facility-badge">
                                                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                                                                                <path d="M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7L12 2zm0 2.18l8 3.6V17c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V7.78l8-3.6z" />
                                                                                                            </svg>
                                                                                                            Balcony
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {cabin.facilities.seaview && (
                                                                                                        <span className="sd-facility-badge">
                                                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                                                                                <path d="M12 9c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                                                                                                            </svg>
                                                                                                            Sea View
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {cabin.facilities.large_bed && (
                                                                                                        <span className="sd-facility-badge">
                                                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                                                                                <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
                                                                                                            </svg>
                                                                                                            King Bed
                                                                                                        </span>
                                                                                                    )}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="sd-date-option-right">
                                                                                            <div className="sd-date-price-info">
                                                                                                <span className="sd-date-price-label">Total from</span>
                                                                                                <span className="sd-date-price-value">{formatPrice(cabin.price || ship.lowestPrice || 0)}</span>
                                                                                                <span className="sd-date-price-note">per person</span>
                                                                                            </div>
                                                                                            {isUrgent && (
                                                                                                <span className="sd-date-urgency-badge">
                                                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                                                                                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                                                                                    </svg>
                                                                                                    Departing soon
                                                                                                </span>
                                                                                            )}
                                                                                            {isCabinInItinerary(cabin.cabin_name, ship.name, date) ? (
                                                                                                <span className="sd-reserved-badge">
                                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                                                    RESERVED
                                                                                                </span>
                                                                                            ) : (
                                                                                                <button
                                                                                                    className="sd-reserve-btn"
                                                                                                    disabled={isUrgent}
                                                                                                    onClick={() => openGuestModal(cabin, ship.name, date)}
                                                                                                >
                                                                                                    {isUrgent ? 'UNAVAILABLE' : 'RESERVE'}
                                                                                                    {!isUrgent && (
                                                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ marginLeft: '6px' }}>
                                                                                                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                                                                                        </svg>
                                                                                                    )}
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        {/* Mobile: compact date list */}
                                                                        <div className="sd-dates-list sd-dates-list-mobile">
                                                                            {cabinAvailDates.slice(0, 10).map((date, dateIdx) => {
                                                                                const startDate = new Date(date);
                                                                                const endDate = new Date(date);
                                                                                endDate.setDate(endDate.getDate() + tripNights);
                                                                                const today = new Date();
                                                                                const daysUntilDeparture = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                                                const isUrgent = daysUntilDeparture > 0 && daysUntilDeparture <= 30;

                                                                                return (
                                                                                    <div
                                                                                        key={dateIdx}
                                                                                        className="sd-date-compact-row"
                                                                                    >
                                                                                        <div className="sd-date-compact-left">
                                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                                                            </svg>
                                                                                            <span className="sd-date-compact-range">
                                                                                                {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                                            </span>
                                                                                            {isUrgent && <span className="sd-date-compact-urgent">Soon</span>}
                                                                                        </div>
                                                                                        {isCabinInItinerary(cabin.cabin_name, ship.name, date) ? (
                                                                                            <span className="sd-reserved-badge-mobile">Reserved</span>
                                                                                        ) : (
                                                                                            <button
                                                                                                className="sd-reserve-btn-mobile"
                                                                                                disabled={isUrgent}
                                                                                                onClick={() => openGuestModal(cabin, ship.name, date)}
                                                                                            >
                                                                                                {isUrgent ? 'UNAVAILABLE' : 'RESERVE'}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* ══════════ ABOUT ══════════ */}
            <section id="about" ref={(el) => { sectionRefs.current["about"] = el; }} className="sd-section-new">
                <div className="sd-section-container">
                    <h2 className="sd-section-heading">Cruise Itinerary</h2>
                    <div className="sd-itinerary-content">
                        <div className="sd-itinerary-days">
                            <div className="sd-day-item">
                                <div className="sd-day-number">Day 1</div>
                                <div className="sd-day-content">
                                    <h4>Departure - {destList[0]}</h4>
                                    <p>Board the ship and begin your journey through the stunning {ship.tripName}. Enjoy welcome drinks and settle into your cabin.</p>
                                </div>
                            </div>

                            {destList.slice(1).map((dest, i) => (
                                <div key={i} className="sd-day-item">
                                    <div className="sd-day-number">Day {i + 2}</div>
                                    <div className="sd-day-content">
                                        <h4>{dest}</h4>
                                        <p>Explore the beautiful {dest} with guided activities, snorkeling, and island tours.</p>
                                    </div>
                                </div>
                            ))}

                            <div className="sd-day-item">
                                <div className="sd-day-number">Day {ship.tripDuration}</div>
                                <div className="sd-day-content">
                                    <h4>Return</h4>
                                    <p>Enjoy breakfast and disembark with unforgettable memories.</p>
                                </div>
                            </div>
                        </div>

                        {/* Ship facilities */}
                        <div className="sd-facilities-grid">
                            <h3 className="sd-subsection-heading">Ship Facilities</h3>
                            <div className="sd-facility-icons-grid">
                                {shipFacilities.map((f) => {
                                    const fac = FACILITY_ICONS[f];
                                    return fac ? (
                                        <div key={f} className="sd-facility-icon-item">
                                            {fac.icon}
                                            <span>{fac.label}</span>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ REVIEWS ══════════ */}
            <section id="reviews" ref={(el) => { sectionRefs.current["reviews"] = el; }} className="sd-section-new sd-section-gray">
                <div className="sd-section-container">
                    <h2 className="sd-section-heading">{reviewCount} Customer reviews for {ship.name}</h2>

                    <div className="sd-reviews-container">
                        {/* Ratings Summary */}
                        <div className="sd-reviews-summary">
                            <div className="sd-overall-rating">
                                <div className="sd-rating-number">{rating.toFixed(1)}</div>
                                <div className="sd-rating-label-large">{ratingLabel(rating)}</div>
                                <div className="sd-rating-based">Based on {reviewCount} reviews</div>
                            </div>

                            {/* Score Breakdown */}
                            <div className="sd-score-breakdown">
                                <h3 className="sd-breakdown-title">SCORE BREAKDOWN</h3>
                                <div className="sd-breakdown-item">
                                    <span className="sd-breakdown-label">Cruise quality</span>
                                    <div className="sd-breakdown-bar">
                                        <div className="sd-breakdown-fill" style={{ width: '95%' }}></div>
                                    </div>
                                    <span className="sd-breakdown-score">9.5</span>
                                </div>
                                <div className="sd-breakdown-item">
                                    <span className="sd-breakdown-label">Food/Drink</span>
                                    <div className="sd-breakdown-bar">
                                        <div className="sd-breakdown-fill" style={{ width: '94%' }}></div>
                                    </div>
                                    <span className="sd-breakdown-score">9.4</span>
                                </div>
                                <div className="sd-breakdown-item">
                                    <span className="sd-breakdown-label">Cabin quality</span>
                                    <div className="sd-breakdown-bar">
                                        <div className="sd-breakdown-fill" style={{ width: '96%' }}></div>
                                    </div>
                                    <span className="sd-breakdown-score">9.6</span>
                                </div>
                                <div className="sd-breakdown-item">
                                    <span className="sd-breakdown-label">Staff quality</span>
                                    <div className="sd-breakdown-bar">
                                        <div className="sd-breakdown-fill" style={{ width: '98%' }}></div>
                                    </div>
                                    <span className="sd-breakdown-score">9.8</span>
                                </div>
                                <div className="sd-breakdown-item">
                                    <span className="sd-breakdown-label">Activities</span>
                                    <div className="sd-breakdown-bar">
                                        <div className="sd-breakdown-fill" style={{ width: '93%' }}></div>
                                    </div>
                                    <span className="sd-breakdown-score">9.3</span>
                                </div>
                            </div>

                            {/* Traveler Rating */}
                            <div className="sd-traveler-rating">
                                <h3 className="sd-breakdown-title">TRAVELER RATING</h3>
                                <div className="sd-rating-bar-item">
                                    <span>Outstanding</span>
                                    <div className="sd-rating-bar">
                                        <div className="sd-rating-bar-fill" style={{ width: '65%' }}></div>
                                    </div>
                                    <span>{Math.floor(reviewCount * 0.65)}</span>
                                </div>
                                <div className="sd-rating-bar-item">
                                    <span>Excellent</span>
                                    <div className="sd-rating-bar">
                                        <div className="sd-rating-bar-fill" style={{ width: '28%' }}></div>
                                    </div>
                                    <span>{Math.floor(reviewCount * 0.28)}</span>
                                </div>
                                <div className="sd-rating-bar-item">
                                    <span>Very good</span>
                                    <div className="sd-rating-bar">
                                        <div className="sd-rating-bar-fill" style={{ width: '5%' }}></div>
                                    </div>
                                    <span>{Math.floor(reviewCount * 0.05)}</span>
                                </div>
                                <div className="sd-rating-bar-item">
                                    <span>Good</span>
                                    <div className="sd-rating-bar">
                                        <div className="sd-rating-bar-fill" style={{ width: '1%' }}></div>
                                    </div>
                                    <span>{Math.floor(reviewCount * 0.01)}</span>
                                </div>
                                <div className="sd-rating-bar-item">
                                    <span>Average</span>
                                    <div className="sd-rating-bar">
                                        <div className="sd-rating-bar-fill" style={{ width: '1%' }}></div>
                                    </div>
                                    <span>{Math.floor(reviewCount * 0.01)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sample Reviews */}
                        <div className="sd-reviews-list">
                            <div className="sd-review-card">
                                <div className="sd-review-header">
                                    <div className="sd-reviewer-info">
                                        <strong>Sarah Johnson</strong>
                                        <span className="sd-reviewer-country">Australia</span>
                                        <span className="sd-review-date">2 weeks ago</span>
                                    </div>
                                    <div className="sd-reviewer-type">Family with children</div>
                                </div>
                                <div className="sd-review-rating">Excellent</div>
                                <p className="sd-review-text">
                                    Amazing experience! The crew was incredibly friendly and attentive.
                                    The cabin was spacious and clean. Food was delicious with plenty of variety.
                                    Highly recommend this cruise!
                                </p>
                            </div>

                            <div className="sd-review-card">
                                <div className="sd-review-header">
                                    <div className="sd-reviewer-info">
                                        <strong>Michael Chen</strong>
                                        <span className="sd-reviewer-country">Singapore</span>
                                        <span className="sd-review-date">3 weeks ago</span>
                                    </div>
                                    <div className="sd-reviewer-type">Young couples</div>
                                </div>
                                <div className="sd-review-rating">Outstanding</div>
                                <p className="sd-review-text">
                                    Perfect honeymoon trip! Beautiful destinations, professional staff,
                                    and excellent service throughout. The sunset views were breathtaking.
                                </p>
                            </div>

                            <div className="sd-review-card">
                                <div className="sd-review-header">
                                    <div className="sd-reviewer-info">
                                        <strong>Emma Williams</strong>
                                        <span className="sd-reviewer-country">UK</span>
                                        <span className="sd-review-date">1 month ago</span>
                                    </div>
                                    <div className="sd-reviewer-type">Mature couples</div>
                                </div>
                                <div className="sd-review-rating">Excellent</div>
                                <p className="sd-review-text">
                                    Wonderful cruise with great amenities. The itinerary was well-planned
                                    and we got to see some amazing places. Would definitely sail again!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ SIMILAR CRUISES ══════════ */}
            <section id="similar" ref={(el) => { sectionRefs.current["similar"] = el; }} className="sd-section sd-section--alt">
                <div className="sd-container">
                    <h2 className="sd-section-title">You May Also Like</h2>
                    {otherShips.length > 0 ? (
                        <div className="sd-similar-grid">
                            {otherShips.map((s) => (
                                <LocaleLink key={s.slug} href={`/cruises/${s.slug}`} className="sd-similar-card group">
                                    <div className="sd-similar-img">
                                        <Image
                                            src={s.imageMain}
                                            alt={s.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 768px) 100vw, 300px"
                                        />
                                    </div>
                                    <div className="sd-similar-body">
                                        <h3 className="sd-similar-name">{s.name}</h3>
                                        <p className="sd-similar-trip">{s.tripName} · {s.tripDuration} Days</p>
                                        <div className="sd-similar-footer">
                                            <span className="sd-similar-rating">
                                                <span className="sd-rating-badge sd-rating-badge--sm">{pseudoRating(s.name).toFixed(1)}</span>
                                                {ratingLabel(pseudoRating(s.name))}
                                            </span>
                                            {s.lowestPrice > 0 && (
                                                <span className="sd-similar-price">{formatIDR(s.lowestPrice)}</span>
                                            )}
                                        </div>
                                    </div>
                                </LocaleLink>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No similar cruises available.</p>
                    )}
                </div>
            </section>

            {/* ══════════ LIGHTBOX ══════════ */}
            {lightboxOpen && (
                <div className="sd-lightbox" onClick={() => setLightboxOpen(false)}>
                    <button className="sd-lightbox-close" onClick={() => setLightboxOpen(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="sd-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={galleryImages[galleryIdx]}
                            alt={`${ship.name} - Photo ${galleryIdx + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                        {galleryImages.length > 1 && (
                            <>
                                <button className="sd-lightbox-arrow sd-lightbox-prev" onClick={prevGallery}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
                                </button>
                                <button className="sd-lightbox-arrow sd-lightbox-next" onClick={nextGallery}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
                                </button>
                            </>
                        )}
                        <div className="sd-lightbox-counter">{galleryIdx + 1} / {galleryImages.length}</div>
                    </div>
                </div>
            )}

            {/* ══════════ CABIN DETAIL MODAL ══════════ */}
            {selectedCabinForDetail && (
                <div className="sd-cabin-modal-overlay" onClick={closeCabinDetail}>
                    <div className="sd-cabin-modal-redesigned" onClick={(e) => e.stopPropagation()}>
                        <button className="sd-cabin-modal-close" onClick={closeCabinDetail}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        <div className="sd-cabin-modal-body">
                            {/* Left Side - Information */}
                            <div className="sd-cabin-modal-left">
                                <div className="sd-cabin-modal-header">
                                    <h2 className="sd-cabin-modal-name">{selectedCabinForDetail.cabin_name}</h2>
                                    <p className="sd-cabin-modal-subtitle">Room</p>
                                </div>

                                <div className="sd-cabin-modal-specs">
                                    SLEEPS {selectedCabinForDetail.total_capacity || 2} | {
                                        selectedCabinForDetail.facilities?.large_bed
                                            ? "KING BED OR 2 TWINS"
                                            : "TWIN BEDS"
                                    } | PRIVATE CABIN
                                </div>

                                <blockquote className="sd-cabin-modal-quote">
                                    &ldquo;{selectedCabinForDetail.description || "Experience luxury on the open ocean with our premium cabin selection."}&rdquo;
                                </blockquote>

                                <div className="sd-cabin-modal-overview">
                                    <h3 className="sd-cabin-modal-section-title">OVERVIEW</h3>
                                    <div className="sd-cabin-modal-features">
                                        <div className="sd-cabin-modal-features-col">
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                {selectedCabinForDetail.facilities?.balcony ? "Private Balcony" : "Shared Deck"}
                                            </div>
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                Air conditioning
                                            </div>
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                Private bathroom
                                            </div>
                                        </div>
                                        <div className="sd-cabin-modal-features-col">
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                {selectedCabinForDetail.facilities?.seaview ? "Ocean View" : "Standard View"}
                                            </div>
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                Daily housekeeping
                                            </div>
                                            <div className="sd-cabin-feature-item">
                                                <span className="sd-feature-bullet">•</span>
                                                Hot water
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Features */}
                                    {(selectedCabinForDetail.facilities?.bathtub || selectedCabinForDetail.facilities?.private_jacuzzi) && (
                                        <div className="sd-cabin-modal-extra-features">
                                            {selectedCabinForDetail.facilities?.bathtub && (
                                                <div className="sd-cabin-feature-item">
                                                    <span className="sd-feature-bullet">•</span>
                                                    Bathtub
                                                </div>
                                            )}
                                            {selectedCabinForDetail.facilities?.private_jacuzzi && (
                                                <div className="sd-cabin-feature-item">
                                                    <span className="sd-feature-bullet">•</span>
                                                    Private Jacuzzi
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side - Gallery */}
                            <div className="sd-cabin-modal-right">
                                <div className="sd-cabin-modal-gallery">
                                    <Image
                                        src={getDirectImageUrl(getCabinGalleryImages(selectedCabinForDetail)[modalImageIndex])}
                                        alt={selectedCabinForDetail.cabin_name}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        unoptimized
                                        referrerPolicy="no-referrer"
                                    />
                                    {getCabinGalleryImages(selectedCabinForDetail).length > 1 && (
                                        <>
                                            <button
                                                className="sd-cabin-modal-arrow sd-cabin-modal-prev"
                                                onClick={prevModalImage}
                                                aria-label="Previous image"
                                            >
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <button
                                                className="sd-cabin-modal-arrow sd-cabin-modal-next"
                                                onClick={nextModalImage}
                                                aria-label="Next image"
                                            >
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            <div className="sd-cabin-modal-counter">
                                                CABIN {modalImageIndex + 1} OF {getCabinGalleryImages(selectedCabinForDetail).length}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer with Price and Booking */}
                        <div className="sd-cabin-modal-footer">
                            <div className="sd-cabin-modal-price-section">
                                <div className="sd-cabin-modal-price-main">
                                    <span className="sd-cabin-modal-currency">
                                        {formatPrice(selectedCabinForDetail.price || ship.lowestPrice || 0).replace(/[0-9.,\s]/g, '')}
                                    </span>
                                    <span className="sd-cabin-modal-price-value">
                                        {formatPrice(selectedCabinForDetail.price || ship.lowestPrice || 0).replace(/[^0-9.,\s]/g, '').trim()}
                                    </span>
                                    <span className="sd-cabin-modal-price-unit">/NIGHT</span>
                                </div>
                                <div className="sd-cabin-modal-price-note">Excluding taxes and fees</div>
                            </div>
                            <LocaleLink
                                href={`/results?ship=${encodeURIComponent(ship.name)}&cabin=${encodeURIComponent(selectedCabinForDetail.cabin_name)}`}
                                className="sd-cabin-modal-reserve-btn"
                            >
                                RESERVE NOW
                            </LocaleLink>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════ FLOATING ITINERARY BUTTON ══════════ */}
            {itineraryItems.length > 0 && !showItineraryPanel && (
                <button className="itinerary-fab" onClick={() => setShowItineraryPanel(true)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="1" />
                        <path d="M9 12h6M9 16h4" />
                    </svg>
                    <span>My Itinerary</span>
                    <span className="itinerary-fab-badge">{itineraryItems.length}</span>
                </button>
            )}

            {/* ══════════ ITINERARY PANEL ══════════ */}
            {showItineraryPanel && (
                <div className="itinerary-panel-overlay" onClick={() => setShowItineraryPanel(false)}>
                    <div className="itinerary-panel" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="itinerary-panel-header">
                            <div className="itinerary-panel-title">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                    <rect x="9" y="3" width="6" height="4" rx="1" />
                                    <path d="M9 12h6M9 16h4" />
                                </svg>
                                <span>My Itinerary</span>
                                {itineraryItems.length > 0 && (
                                    <span className="itinerary-count-badge">{itineraryItems.length}</span>
                                )}
                            </div>
                            <button className="itinerary-panel-close" onClick={() => setShowItineraryPanel(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="itinerary-panel-body">
                            {itineraryItems.length === 0 ? (
                                <div className="itinerary-empty">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                        <rect x="9" y="3" width="6" height="4" rx="1" />
                                    </svg>
                                    <p>No reservations yet.</p>
                                    <p className="itinerary-empty-sub">Reserve a cabin to get started.</p>
                                </div>
                            ) : (
                                <div className="itinerary-items-list">
                                    {itineraryItems.map((item, idx) => (
                                        <div key={idx} className="itinerary-item-card">
                                            <div className="itinerary-item-top">
                                                <div className="itinerary-item-info">
                                                    <span className="itinerary-item-ship">{item.ship}</span>
                                                    <span className="itinerary-item-cabin">{item.cabin}</span>
                                                </div>
                                                <button className="itinerary-item-remove" onClick={() => removeFromItinerary(idx)} title="Remove">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="itinerary-item-details">
                                                <div className="itinerary-detail-row">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" />
                                                        <line x1="16" y1="2" x2="16" y2="6" />
                                                        <line x1="8" y1="2" x2="8" y2="6" />
                                                        <line x1="3" y1="10" x2="21" y2="10" />
                                                    </svg>
                                                    <span>{formatDateDisplay(item.date)}</span>
                                                </div>
                                                <div className="itinerary-detail-row">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                                        <path d="M16 3.13a4 4 0 010 7.75" />
                                                    </svg>
                                                    <span>{item.guests} {item.guests === 1 ? "guest" : "guests"}</span>
                                                </div>
                                                {item.price > 0 && (
                                                    <div className="itinerary-item-price">
                                                        {formatIDR(item.price)}
                                                        <span className="itinerary-item-price-unit">/night</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {itineraryItems.length > 0 && (
                            <div className="itinerary-panel-footer">
                                <div className="itinerary-summary">
                                    <div className="itinerary-summary-row">
                                        <span>Total Cabins</span>
                                        <span className="itinerary-summary-value">{itineraryItems.length}</span>
                                    </div>
                                    <div className="itinerary-summary-row">
                                        <span>Total Guests</span>
                                        <span className="itinerary-summary-value">{itineraryItems.reduce((s, i) => s + i.guests, 0)}</span>
                                    </div>
                                    {itineraryTotal > 0 && (
                                        <div className="itinerary-summary-row itinerary-summary-total">
                                            <span>Estimated Total</span>
                                            <span className="itinerary-summary-value">{formatIDR(itineraryTotal)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="itinerary-footer-actions">
                                    <button className="itinerary-btn-clear" onClick={() => {
                                        setItineraryItems([]);
                                        localStorage.removeItem("KOMODOCRUISES_itinerary");
                                    }}>Clear All</button>
                                    <button className="itinerary-btn-checkout" onClick={() => {
                                        setShowItineraryPanel(false);
                                        const locale = getLocaleFromPathname(pathname);
                                        window.location.href = localizePath("/reservation", locale);
                                    }}>Proceed to Booking →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════ GUEST COUNT MODAL ══════════ */}
            {showGuestModal && pendingReservation && (
                <div className="modal-overlay" onClick={closeGuestModal}>
                    <div className="guest-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="guest-modal-close" onClick={closeGuestModal}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h2 className="guest-modal-title">Number of Guests</h2>
                        <p className="guest-modal-subtitle">Please indicate how many guests will be accommodated:</p>
                        <div className="guest-counter-section">
                            <div className="guest-counter-row">
                                <span className="guest-counter-label">Guests</span>
                                <div className="guest-counter-controls">
                                    <button className="guest-counter-btn" onClick={() => setGuestCount(Math.max(1, guestCount - 1))} disabled={guestCount <= 1}>−</button>
                                    <span className="guest-counter-value">{guestCount}</span>
                                    <button className="guest-counter-btn" onClick={() => setGuestCount(Math.min(maxGuestsForCabin, guestCount + 1))} disabled={guestCount >= maxGuestsForCabin}>+</button>
                                </div>
                            </div>
                            <p className="guest-availability-note">{maxGuestsForCabin} available</p>
                        </div>
                        <button className="guest-modal-confirm-btn" onClick={confirmReservation}>ADD TO ITINERARY</button>
                    </div>
                </div>
            )}
        </div>
    );
}
