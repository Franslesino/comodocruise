"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import LocaleLink from "./LocaleLink";
import { getLocaleFromPathname } from "@/lib/i18n";
import {
    fetchAllShips,
    fetchAllCabins,
    fetchCabinDetails,
    fetchAndAggregateAvailability,
    boatNamesMatch,
    cabinNamesMatch,
    formatPrice,
    getDirectImageUrl,
    isValidImageUrl,
    toLocalDateStr,
} from "@/lib/api";
import {
    Ship,
    CabinData,
    ShipWithDetails,
    CabinWithDates,
    OperatorAvailabilityWithDates,
    SearchCriteria,
    ItineraryItem,
} from "@/types/api";
import "@/styles/results.css";
import "@/styles/cruises.css";
import BookingForm from "./BookingForm";

// Sort options
const SORT_OPTIONS = [
    { value: "recommended", label: "Recommended" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name A-Z" },
];

// Destination options (matching BookingBar)
const DESTINATIONS = [
    { id: "komodo-national-park", name: "Komodo National Park" },
    { id: "labuan-bajo", name: "Labuan Bajo" },
];

// Helper: create dynamic ship from operator availability
const createDynamicShipFromAvailability = (op: OperatorAvailabilityWithDates): ShipWithDetails => {
    const dynamicCabins: CabinWithDates[] = (op.cabins || []).map((apiCabin, idx) => ({
        cabin_id: `${op.operator}-cabin-${idx}`.replace(/\s+/g, "-").toLowerCase(),
        cabin_name: apiCabin.name,
        cabin_name_api: apiCabin.name,
        boat_name: op.operator,
        description: `${apiCabin.available} cabins available`,
        total_capacity: apiCabin.available,
        price: 0,
        image_main: "/placeholder-cabin.jpg",
        facilities: {
            balcony: apiCabin.name.toLowerCase().includes("balcony"),
            bathtub: apiCabin.name.toLowerCase().includes("bathtub"),
            seaview: apiCabin.name.toLowerCase().includes("ocean") || apiCabin.name.toLowerCase().includes("view"),
            large_bed: apiCabin.name.toLowerCase().includes("queen") || apiCabin.name.toLowerCase().includes("king"),
            private_jacuzzi: false,
            cabin_display_facilities: "",
        },
    }));

    return {
        name: op.operator,
        description: `Available operator with ${op.total} cabins available.`,
        trip: "3",
        trip_name: "",
        destinations: "Komodo National Park, Labuan Bajo",
        image_main: "/placeholder-boat.svg",
        images: [],
        startFromPrice: 0,
        cabinCount: op.cabins?.length || 0,
        availableCabins: op.total,
        isAvailable: true,
        cabins: dynamicCabins.map(cabin => ({
            ...cabin,
            availableDates: op.availableDates || [],
        })),
        availableDates: op.availableDates,
    };
};

// Filter dates to weekly departures
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

interface SearchResultsProps {
    showHero?: boolean;
}

export default function SearchResults({ showHero = false }: SearchResultsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State
    const [loading, setLoading] = useState(true);
    const [ships, setShips] = useState<ShipWithDetails[]>([]);
    const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
    const [sortBy, setSortBy] = useState("recommended");
    const [openSortBy, setOpenSortBy] = useState(false);
    const [totalAvailableCabins, setTotalAvailableCabins] = useState(0);
    const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);

    // Sidebar form state
    const [formDestinations, setFormDestinations] = useState<string[]>([]);
    const [formDateFrom, setFormDateFrom] = useState<string>("");
    const [formDateTo, setFormDateTo] = useState<string>("");
    const [formDuration, setFormDuration] = useState<number>(3);
    const [formGuests, setFormGuests] = useState<number>(2);
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Sidebar dropdown states
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

    // Calendar state
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    // Refs
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const destDropdownRef = useRef<HTMLDivElement>(null);
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const durationDropdownRef = useRef<HTMLDivElement>(null);
    const guestsDropdownRef = useRef<HTMLDivElement>(null);

    // Ship/cabin view state
    const [selectedShipForCabins, setSelectedShipForCabins] = useState<string | null>(searchParams.get("ship"));
    const [openCabinDates, setOpenCabinDates] = useState<string | null>(null);
    const cabinDatesDropdownRef = useRef<HTMLDivElement>(null);

    // Cabin images cache
    const [cabinImagesCache, setCabinImagesCache] = useState<Record<string, string[]>>({});

    // Carousel state
    const [shipImageIndices, setShipImageIndices] = useState<Record<string, number>>({});
    const [cabinImageIndices, setCabinImageIndices] = useState<Record<string, number>>({});

    // Detail Modal State
    const [selectedCabinForDetail, setSelectedCabinForDetail] = useState<CabinData | null>(null);
    const [modalImageIndex, setModalImageIndex] = useState(0);

    // Guest Modal State
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [pendingReservation, setPendingReservation] = useState<{
        cabin: CabinData;
        shipName: string;
        selectedDate: string;
    } | null>(null);
    const [guestCount, setGuestCount] = useState(2);
    const [maxGuestsForCabin, setMaxGuestsForCabin] = useState(4);

    // Track selected dates per cabin
    const [cabinSelectedDates, setCabinSelectedDates] = useState<Record<string, { dateFrom: string; dateTo: string }>>({});

    // Itinerary panel
    const [showItineraryPanel, setShowItineraryPanel] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);

    // Update URL when selectedShipForCabins changes
    const updateShipQueryParam = (shipName: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (shipName) {
            params.set("ship", shipName);
        } else {
            params.delete("ship");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // ===== Load data on mount =====
    useEffect(() => {
        async function loadData() {
            try {
                // Read search criteria from URL params
                const criteria: SearchCriteria = {};
                const destParam = searchParams.get("destinations");
                const dateFromParam = searchParams.get("dateFrom");
                const dateToParam = searchParams.get("dateTo");
                const durationParam = searchParams.get("duration");
                const guestsParam = searchParams.get("guests");

                if (destParam) {
                    criteria.destinations = destParam.split(",");
                    criteria.destinationName = criteria.destinations
                        .map(id => DESTINATIONS.find(d => d.id === id)?.name || id)
                        .join(", ");
                }
                
                // Use dateFrom and dateTo from params if available
                if (dateFromParam) criteria.dateFrom = dateFromParam;
                if (dateToParam) {
                    criteria.dateTo = dateToParam;
                } else if (criteria.dateFrom && durationParam) {
                    // Fallback: calculate dateTo from dateFrom + duration if dateTo not provided
                    const duration = parseInt(durationParam, 10);
                    const start = new Date(criteria.dateFrom);
                    start.setDate(start.getDate() + duration - 1);
                    criteria.dateTo = toLocalDateStr(start);
                }
                
                if (durationParam) criteria.duration = parseInt(durationParam, 10);
                if (guestsParam) criteria.guests = parseInt(guestsParam, 10);

                setSearchCriteria(criteria);

                // Fetch ships and cabins in parallel
                const [shipsData, cabinsData] = await Promise.all([
                    fetchAllShips(),
                    fetchAllCabins(),
                ]);

                // Check availability for selected dates
                let availableOperators: Map<string, OperatorAvailabilityWithDates> = new Map();
                if (criteria.dateFrom) {
                    availableOperators = await fetchAndAggregateAvailability(
                        criteria.dateFrom,
                        criteria.dateTo
                    );
                    console.log(`[SearchResults] Found ${availableOperators.size} available operators for date range ${criteria.dateFrom} to ${criteria.dateTo}`);
                    availableOperators.forEach((op, name) => {
                        console.log(`  - ${name}: ${op.total} cabins available on ${op.availableDates?.length || 0} dates`);
                    });
                } else {
                    // No date selected: fetch availability for next 90 days (weekly sampling) so "More Dates" has data
                    const today = new Date();
                    const defaultFrom = toLocalDateStr(today);
                    const endDate = new Date(today);
                    endDate.setDate(endDate.getDate() + 90);
                    const defaultTo = toLocalDateStr(endDate);
                    try {
                        availableOperators = await fetchAndAggregateAvailability(defaultFrom, defaultTo);
                        console.log(`[SearchResults] Browse mode: fetched availability for ${defaultFrom} to ${defaultTo}, found ${availableOperators.size} operators`);
                    } catch (err) {
                        console.warn("[SearchResults] Failed to fetch browse-mode availability:", err);
                    }
                }

                // Map cabins to ships and check availability
                const shipsWithDetails: ShipWithDetails[] = shipsData.map((ship: Ship) => {
                    let shipCabins: CabinWithDates[] = cabinsData.filter(
                        (cabin: CabinData) => boatNamesMatch(cabin.boat_name, ship.name)
                    );

                    let isAvailable = false;
                    let availableCabins = 0;
                    let operatorData: OperatorAvailabilityWithDates | undefined;
                    let shipAvailableDates: string[] = [];

                    for (const [opName, opData] of availableOperators) {
                        if (boatNamesMatch(opName, ship.name)) {
                            isAvailable = opData.total > 0;
                            availableCabins = opData.total;
                            operatorData = opData;
                            shipAvailableDates = opData.availableDates || [];
                            break;
                        }
                    }

                    // Filter cabins by availability if date was selected
                    if (criteria.dateFrom && operatorData && operatorData.cabins) {
                        shipCabins = shipCabins
                            .filter(cabin =>
                                operatorData!.cabins.some(availCabin =>
                                    cabinNamesMatch(cabin.cabin_name, availCabin.name) && availCabin.available > 0
                                )
                            )
                            .map(cabin => {
                                const matchingCabin = operatorData!.cabins.find(ac =>
                                    cabinNamesMatch(cabin.cabin_name, ac.name)
                                );
                                return {
                                    ...cabin,
                                    availableDates: matchingCabin?.availableDates || [],
                                };
                            });
                        // Keep the operator's total if no cabins matched (dynamic ships)
                        if (shipCabins.length === 0 && operatorData.total > 0) {
                            availableCabins = operatorData.total;
                        } else {
                            availableCabins = shipCabins.length;
                        }
                    } else if (!criteria.dateFrom && operatorData && operatorData.cabins) {
                        // Browse mode: enrich cabins with available dates without filtering them out
                        shipCabins = shipCabins.map(cabin => {
                            const matchingCabin = operatorData!.cabins.find(ac =>
                                cabinNamesMatch(cabin.cabin_name, ac.name)
                            );
                            return {
                                ...cabin,
                                availableDates: matchingCabin?.availableDates || shipAvailableDates,
                            };
                        });
                    }

                    const validPrices = shipCabins.map(c => c.price).filter(p => p > 0);
                    const startFromPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

                    return {
                        ...ship,
                        startFromPrice,
                        cabinCount: shipCabins.length,
                        availableCabins,
                        isAvailable,
                        cabins: shipCabins,
                        availableDates: shipAvailableDates,
                    };
                });

                // Add dynamic ships for operators without a ship entry
                availableOperators.forEach((op: OperatorAvailabilityWithDates) => {
                    const alreadyMatched = shipsWithDetails.some(ship =>
                        boatNamesMatch(ship.name, op.operator)
                    );
                    if (!alreadyMatched && op.total > 0) {
                        const dynamicShip = createDynamicShipFromAvailability(op);
                        dynamicShip.availableDates = op.availableDates;
                        shipsWithDetails.push(dynamicShip);
                    }
                });

                // Filter by availability
                let filteredShips = shipsWithDetails;
                if (criteria.dateFrom) {
                    filteredShips = shipsWithDetails.filter(s => s.isAvailable);
                    console.log(`[SearchResults] After availability filter: ${filteredShips.length} of ${shipsWithDetails.length} ships available`);
                }

                // Filter by destination (include ships with empty destinations as they are available)
                if (criteria.destinations && criteria.destinations.length > 0) {
                    const beforeDestFilter = filteredShips.length;
                    filteredShips = filteredShips.filter(ship => {
                        // If ship has no destination data, include it (like dynamic ships)
                        if (!ship.destinations || ship.destinations.trim() === "") {
                            return true;
                        }
                        // Otherwise check if destination matches
                        return criteria.destinations!.some(dest =>
                            ship.destinations.toLowerCase().includes(dest.toLowerCase()) ||
                            ship.name.toLowerCase().includes(dest.toLowerCase())
                        );
                    });
                    console.log(`[SearchResults] After destination filter: ${filteredShips.length} of ${beforeDestFilter} ships match destinations`);
                }

                const total = filteredShips.reduce((sum, s) => sum + s.availableCabins, 0);
                console.log(`[SearchResults] Final result: ${filteredShips.length} ships with ${total} total cabins`);
                setTotalAvailableCabins(total);
                setShips(filteredShips);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll on cruises page to hide gap after loading
    useEffect(() => {
        if (!loading && showHero) {
            // Scroll to position where filter bar sticks to navbar
            // This hides the gap between hero and filter bar
            const timer = setTimeout(() => {
                // Calculate scroll position based on viewport
                // Hero is 60vh, we want to show about 20-30% of hero
                const scrollAmount = Math.min(window.innerHeight * 0.4, 350);
                window.scrollTo({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
            }, 100); // Small delay to ensure page is fully rendered
            return () => clearTimeout(timer);
        }
    }, [loading, showHero]);

    // Load itinerary from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("comodocruise_itinerary");
        if (stored) {
            try { setItineraryItems(JSON.parse(stored)); } catch {}
        }
    }, []);

    // Init sidebar form from search criteria
    useEffect(() => {
        if (searchCriteria.destinations) setFormDestinations(searchCriteria.destinations);
        if (searchCriteria.dateFrom) setFormDateFrom(searchCriteria.dateFrom);
        if (searchCriteria.dateTo) setFormDateTo(searchCriteria.dateTo);
        if (searchCriteria.duration) setFormDuration(searchCriteria.duration);
        if (searchCriteria.guests) setFormGuests(searchCriteria.guests);
    }, [searchCriteria]);

    // Fetch cabin images when viewing a ship's cabins
    useEffect(() => {
        if (!selectedShipForCabins) return;
        const ship = ships.find(s => s.name === selectedShipForCabins);
        if (!ship || !ship.cabins) return;
        const toFetch = ship.cabins.filter(c => !cabinImagesCache[c.cabin_id]);
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
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedShipForCabins, ships]);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setOpenSortBy(false);
            if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) setShowDestDropdown(false);
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) setShowDateDropdown(false);
            if (durationDropdownRef.current && !durationDropdownRef.current.contains(e.target as Node)) setShowDurationDropdown(false);
            if (guestsDropdownRef.current && !guestsDropdownRef.current.contains(e.target as Node)) setShowGuestsDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sort and filter ships
    const sortedShips = [...ships]
        .filter(ship => {
            // Filter by search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = ship.name.toLowerCase().includes(query);
                const matchDestinations = ship.destinations?.toLowerCase().includes(query);
                const matchTrip = ship.trip_name?.toLowerCase().includes(query);
                return matchName || matchDestinations || matchTrip;
            }
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price-low": return (a.startFromPrice || Infinity) - (b.startFromPrice || Infinity);
                case "price-high": return (b.startFromPrice || 0) - (a.startFromPrice || 0);
                case "name": return a.name.localeCompare(b.name);
                default:
                    if (a.availableCabins !== b.availableCabins) return b.availableCabins - a.availableCabins;
                    return (a.startFromPrice || Infinity) - (b.startFromPrice || Infinity);
            }
        });

    // Format trip nights
    const formatTripNights = (ship: Ship) => {
        const tripDays = parseInt(ship.trip, 10) || 3;
        return tripDays - 1;
    };

    // Gallery helpers
    const getCabinGalleryImages = (cabin: CabinData): string[] => {
        const cached = cabinImagesCache[cabin.cabin_id];
        if (cached && cached.length > 0) return cached;
        const images: string[] = [];
        if (cabin.image_main) images.push(cabin.image_main);
        return images.length > 0 ? images : ["/placeholder-cabin.jpg"];
    };

    const getShipGalleryImages = (ship: ShipWithDetails): string[] => {
        const images: string[] = [];
        if (ship.image_main) images.push(ship.image_main);
        if (ship.images?.length) images.push(...ship.images.filter(img => img !== ship.image_main));
        return images.length > 0 ? images : ["/placeholder-boat.svg"];
    };

    // Price helpers
    const getPriceSymbol = (priceStr: string) => priceStr.replace(/[0-9,.\s]/g, "").trim() || "Rp";
    const getPriceVal = (priceStr: string) => priceStr.replace(/[^0-9,.\s]/g, "").trim();

    // Modal handlers
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

    // Carousel handlers for ship cards
    const handleShipPrevImage = (shipName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ship = ships.find(s => s.name === shipName);
        if (!ship) return;
        const images = getShipGalleryImages(ship);
        const currentIndex = shipImageIndices[shipName] || 0;
        setShipImageIndices(prev => ({
            ...prev,
            [shipName]: (currentIndex - 1 + images.length) % images.length
        }));
    };

    const handleShipNextImage = (shipName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ship = ships.find(s => s.name === shipName);
        if (!ship) return;
        const images = getShipGalleryImages(ship);
        const currentIndex = shipImageIndices[shipName] || 0;
        setShipImageIndices(prev => ({
            ...prev,
            [shipName]: (currentIndex + 1) % images.length
        }));
    };

    // Carousel handlers for cabin cards
    const handleCabinPrevImage = (cabinId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ship = getSelectedShip();
        if (!ship) return;
        const cabin = ship.cabins.find(c => c.cabin_id === cabinId);
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
        const ship = getSelectedShip();
        if (!ship) return;
        const cabin = ship.cabins.find(c => c.cabin_id === cabinId);
        if (!cabin) return;
        const images = getCabinGalleryImages(cabin);
        const currentIndex = cabinImageIndices[cabinId] || 0;
        setCabinImageIndices(prev => ({
            ...prev,
            [cabinId]: (currentIndex + 1) % images.length
        }));
    };

    // Ship/cabin navigation
    const handleViewCabins = (shipName: string) => {
        setSelectedShipForCabins(shipName);
        updateShipQueryParam(shipName);
    };

    const handleBackToShips = () => {
        setSelectedShipForCabins(null);
        updateShipQueryParam(null);
    };

    const getSelectedShip = (): ShipWithDetails | null => {
        if (!selectedShipForCabins) return null;
        return ships.find(s => s.name === selectedShipForCabins) || null;
    };

    // Available dates helpers
    const getAvailableDatesForCabin = (cabin: CabinData | CabinWithDates): string[] => {
        if ("availableDates" in cabin && cabin.availableDates && cabin.availableDates.length > 0) {
            return filterDatesToWeeklyDepartures(cabin.availableDates);
        }
        const ship = ships.find(s => s.cabins.some(c => c.cabin_id === cabin.cabin_id));
        if (ship?.availableDates) return filterDatesToWeeklyDepartures(ship.availableDates);
        return [];
    };

    // Format date for display
    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "Select date";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    // Itinerary helpers
    const isCabinInItinerary = (cabinName: string, shipName: string, date: string) =>
        itineraryItems.some(it => it.cabin === cabinName && it.ship === shipName && it.date === date);

    const removeFromItinerary = (index: number) => {
        const updated = itineraryItems.filter((_, i) => i !== index);
        setItineraryItems(updated);
        localStorage.setItem("comodocruise_itinerary", JSON.stringify(updated));
    };

    // Guest modal
    const openGuestModal = (cabin: CabinData, shipName: string, selectedDate?: string) => {
        const date = selectedDate || searchCriteria.dateFrom || toLocalDateStr(new Date());
        setPendingReservation({ cabin, shipName, selectedDate: date });
        setGuestCount(searchCriteria.guests || 2);
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
        const ship = ships.find(s => s.name === pendingReservation.shipName);
        if (ship) {
            const newItem: ItineraryItem = {
                cabin: pendingReservation.cabin.cabin_name,
                ship: ship.name,
                date: pendingReservation.selectedDate,
                price: pendingReservation.cabin.price || ship.startFromPrice,
                guests: guestCount,
                addedAt: Date.now(),
            };
            const updated = [...itineraryItems, newItem];
            setItineraryItems(updated);
            localStorage.setItem("comodocruise_itinerary", JSON.stringify(updated));
        }
        closeGuestModal();
        setOpenCabinDates(null);
        setShowItineraryPanel(true);
    };

    const handleReserveNow = (cabin: CabinData, shipName: string, selectedDate?: string) => {
        const date = selectedDate || cabinSelectedDates[cabin.cabin_id]?.dateFrom || searchCriteria.dateFrom || toLocalDateStr(new Date());
        const isReserved = isCabinInItinerary(cabin.cabin_name, shipName, date);
        if (isReserved) {
            const updated = itineraryItems.filter(it =>
                !(it.cabin === cabin.cabin_name && it.ship === shipName && it.date === date)
            );
            setItineraryItems(updated);
            localStorage.setItem("comodocruise_itinerary", JSON.stringify(updated));
        } else {
            openGuestModal(cabin, shipName, date);
        }
    };

    const itineraryTotal = itineraryItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Calendar helpers
    const generateCalendarDays = (year: number, month: number): (Date | null)[] => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        const days: (Date | null)[] = [];
        for (let i = 0; i < adjustedStartDay; i++) days.push(null);
        for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
        return days;
    };

    const calendarDays = generateCalendarDays(calendarYear, calendarMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleCalendarDateClick = (date: Date) => {
        const dateStr = toLocalDateStr(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return;
        if (!formDateFrom || (formDateFrom && formDateTo)) {
            setFormDateFrom(dateStr);
            setFormDateTo("");
        } else {
            let newDateFrom = formDateFrom;
            let newDateTo = dateStr;
            if (dateStr < formDateFrom) {
                newDateTo = formDateFrom;
                newDateFrom = dateStr;
            }
            setFormDateFrom(newDateFrom);
            setFormDateTo(newDateTo);
            // Auto-close dropdown and trigger search after selecting date range
            setTimeout(() => {
                setShowDateDropdown(false);
                handleModifySearch();
            }, 300);
        }
    };

    const isDateInRange = (date: Date): boolean => {
        if (!formDateFrom || !formDateTo) return false;
        const dateStr = toLocalDateStr(date);
        return dateStr >= formDateFrom && dateStr <= formDateTo;
    };

    const getDestinationDisplayText = (): string => {
        if (formDestinations.length === 0) return "All Destinations";
        return formDestinations
            .map(id => DESTINATIONS.find(d => d.id === id)?.name)
            .filter(Boolean)
            .join(", ");
    };

    // Modify Search
    const handleModifySearch = async () => {
        setLoading(true);
        const newCriteria: SearchCriteria = {
            destinations: formDestinations.length > 0 ? formDestinations : undefined,
            destinationName: getDestinationDisplayText(),
            dateFrom: formDateFrom || undefined,
            dateTo: formDateTo || undefined,
            duration: formDuration,
            guests: formGuests,
        };
        setSearchCriteria(newCriteria);

        // Update URL params
        const params = new URLSearchParams();
        if (newCriteria.destinations && newCriteria.destinations.length > 0) {
            params.set("destinations", newCriteria.destinations.join(","));
        }
        if (newCriteria.dateFrom) params.set("dateFrom", newCriteria.dateFrom);
        if (newCriteria.dateTo) params.set("dateTo", newCriteria.dateTo);
        if (newCriteria.duration) params.set("duration", newCriteria.duration.toString());
        if (newCriteria.guests) params.set("guests", newCriteria.guests.toString());
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

        try {
            const [shipsData, cabinsData] = await Promise.all([
                fetchAllShips(),
                fetchAllCabins(),
            ]);

            let availableOperators: Map<string, OperatorAvailabilityWithDates> = new Map();
            if (newCriteria.dateFrom) {
                availableOperators = await fetchAndAggregateAvailability(newCriteria.dateFrom, newCriteria.dateTo);
            }

            const shipsWithDetails: ShipWithDetails[] = shipsData.map((ship: Ship) => {
                let shipCabins = cabinsData.filter(cabin => boatNamesMatch(cabin.boat_name, ship.name));
                
                // Filter cabins by guest capacity if guests filter is set
                if (newCriteria.guests && newCriteria.guests > 0) {
                    shipCabins = shipCabins.filter(cabin => cabin.total_capacity >= newCriteria.guests!);
                }
                
                const validPrices = shipCabins.map(c => c.price).filter(p => p > 0);
                const startFromPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
                let isAvailable = false;
                let availCabins = 0;
                for (const [opName, opData] of availableOperators) {
                    if (boatNamesMatch(opName, ship.name)) {
                        isAvailable = opData.total > 0;
                        availCabins = opData.total;
                        break;
                    }
                }
                return {
                    ...ship,
                    startFromPrice,
                    cabinCount: shipCabins.length,
                    availableCabins: availCabins,
                    isAvailable,
                    cabins: shipCabins,
                };
            });

            availableOperators.forEach((op) => {
                const alreadyMatched = shipsWithDetails.some(ship => boatNamesMatch(ship.name, op.operator));
                if (!alreadyMatched && op.total > 0) {
                    shipsWithDetails.push(createDynamicShipFromAvailability(op));
                }
            });

            let filteredShips = shipsWithDetails;
            
            // Filter by date availability
            if (newCriteria.dateFrom) {
                filteredShips = filteredShips.filter(s => s.isAvailable);
            }
            
            // Filter by destination
            if (newCriteria.destinations && newCriteria.destinations.length > 0) {
                filteredShips = filteredShips.filter(ship => {
                    // If ship has no destination data, include it (like dynamic ships)
                    if (!ship.destinations || ship.destinations.trim() === "") {
                        return true;
                    }
                    // Otherwise check if destination matches
                    return newCriteria.destinations!.some(dest =>
                        ship.destinations.toLowerCase().includes(dest.toLowerCase())
                    );
                });
            }
            
            // Filter by trip duration
            if (newCriteria.duration && newCriteria.duration > 0) {
                filteredShips = filteredShips.filter(ship => {
                    const tripDays = parseInt(ship.trip, 10) || 3;
                    return tripDays === newCriteria.duration;
                });
            }
            
            // Filter by guest capacity (ship must have at least one cabin that can accommodate guests)
            if (newCriteria.guests && newCriteria.guests > 0) {
                filteredShips = filteredShips.filter(ship => {
                    // If ship has cabins data, check if any cabin can accommodate the guests
                    if (ship.cabins && ship.cabins.length > 0) {
                        return ship.cabins.some(cabin => cabin.total_capacity >= newCriteria.guests!);
                    }
                    // If no cabin data, include the ship (dynamic ships)
                    return true;
                });
            }

            setTotalAvailableCabins(filteredShips.reduce((sum, s) => sum + s.availableCabins, 0));
            setShips(filteredShips);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={showHero ? "cruises-page" : "results-wrap"}>
            {/* Hero Section (only on cruises page) */}
            {showHero && (
                <div className="cruises-hero">
                    <video
                        className="cruises-hero__video"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                    >
                        <source src="/vidfootage.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <div className="cruises-hero__overlay" />
                    <div className="cruises-hero-content">
                        <h1>Discover Our Cruise Packages</h1>
                        <p className="cruises-hero-subtitle">
                            Experience the adventure of a lifetime with our handpicked cruise packages to pristine destinations
                        </p>
                        <div className="cruises-hero-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Save up to 30% on Selected Packages
                        </div>
                    </div>
                </div>
            )}
            <div className={showHero ? "results-container results-container--hero" : "results-container"}>
                {loading ? (
                    <div className="results-layout">
                        <div className="results-main">
                            <div className="ship-cards-container">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="ship-card-horizontal skeleton-card">
                                        <div><div className="skeleton-ship-image" /></div>
                                        <div className="ship-card-details">
                                            <div className="skeleton-ship-title" />
                                            <div className="skeleton-ship-desc" />
                                            <div className="skeleton-ship-desc short" />
                                            <div className="skeleton-ship-price" style={{ marginTop: "auto" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="results-layout-horizontal">
                        {/* Main Content - Full Width */}
                        <div className="results-main-full">
                            {/* Horizontal Filters Bar - Sticky at top */}
                            <div className="horizontal-filters-bar">
                                <div className="filters-bar-inner">
                                <div className="filters-left">
                                    <div className="search-input-wrapper">
                                        <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input 
                                            type="text" 
                                            className="search-input" 
                                            placeholder="Search ships..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {searchQuery && (
                                            <button 
                                                className="search-clear-btn"
                                                onClick={() => setSearchQuery("")}
                                                title="Clear search"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="filters-center">
                                    {/* Filters Count Button */}
                                    <div className="filter-dropdown-wrapper">
                                        <button className="filter-btn filters-btn">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                            <span className="filter-label">Filters</span>
                                            {(searchQuery || formDestinations.length > 0 || formDateFrom || formDuration !== 3 || formGuests !== 2) && (
                                                <span className="filter-badge">
                                                    {(searchQuery ? 1 : 0) + formDestinations.length + (formDateFrom ? 1 : 0) + (formDuration !== 3 ? 1 : 0) + (formGuests !== 2 ? 1 : 0)}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="filter-dropdown-wrapper" ref={sortDropdownRef}>
                                        <button className="filter-btn" onClick={() => setOpenSortBy(!openSortBy)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                            </svg>
                                            Sort
                                        </button>
                                        {openSortBy && (
                                            <div className="filter-dropdown-panel">
                                                {SORT_OPTIONS.map(option => (
                                                    <button
                                                        key={option.value}
                                                        className={`filter-option ${sortBy === option.value ? "active" : ""}`}
                                                        onClick={() => { setSortBy(option.value); setOpenSortBy(false); }}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Departure Date Dropdown */}
                                    <div className="filter-dropdown-wrapper" ref={dateDropdownRef}>
                                        <button className="filter-btn" onClick={() => setShowDateDropdown(!showDateDropdown)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            <span className="filter-label">Departure Date</span>
                                            {formDateFrom && <span className="filter-badge">✓</span>}
                                        </button>
                                        {showDateDropdown && (
                                            <div className="filter-dropdown-panel calendar-panel-dual">
                                                {/* Month Navigation */}
                                                <div className="calendar-dual-header">
                                                    <button className="calendar-nav-btn" onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); } else setCalendarMonth(calendarMonth - 1); }}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <div className="calendar-months-display">
                                                        <span className="calendar-month-title">
                                                            {monthNames[calendarMonth]} {calendarYear}
                                                        </span>
                                                        <span className="calendar-month-title">
                                                            {monthNames[(calendarMonth + 1) % 12]} {calendarMonth === 11 ? calendarYear + 1 : calendarYear}
                                                        </span>
                                                    </div>
                                                    <button className="calendar-nav-btn" onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); } else setCalendarMonth(calendarMonth + 1); }}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                                {/* Two Months Grid */}
                                                <div className="calendar-dual-grid">
                                                    {/* First Month */}
                                                    <div className="calendar-month-container">
                                                        <div className="calendar-weekdays-dual">
                                                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => (
                                                                <div key={day} className="calendar-weekday-dual">{day}</div>
                                                            ))}
                                                        </div>
                                                        <div className="calendar-days-dual">
                                                            {calendarDays.map((day, idx) => {
                                                                if (!day) return <div key={idx} className="calendar-day-empty" />;
                                                                const dateStr = toLocalDateStr(day);
                                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                                const isPast = day < today;
                                                                const isSelected = dateStr === formDateFrom || dateStr === formDateTo;
                                                                const inRange = isDateInRange(day);
                                                                return (
                                                                    <button 
                                                                        key={idx} 
                                                                        className={`calendar-day-dual ${isPast ? "past" : ""} ${isSelected ? "selected" : ""} ${inRange && !isSelected ? "in-range" : ""}`} 
                                                                        onClick={() => !isPast && handleCalendarDateClick(day)} 
                                                                        disabled={isPast}
                                                                    >
                                                                        {day.getDate()}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Second Month */}
                                                    <div className="calendar-month-container">
                                                        <div className="calendar-weekdays-dual">
                                                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => (
                                                                <div key={`next-${day}`} className="calendar-weekday-dual">{day}</div>
                                                            ))}
                                                        </div>
                                                        <div className="calendar-days-dual">
                                                            {generateCalendarDays(
                                                                calendarMonth === 11 ? calendarYear + 1 : calendarYear,
                                                                (calendarMonth + 1) % 12
                                                            ).map((day, idx) => {
                                                                if (!day) return <div key={`next-${idx}`} className="calendar-day-empty" />;
                                                                const dateStr = toLocalDateStr(day);
                                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                                const isPast = day < today;
                                                                const isSelected = dateStr === formDateFrom || dateStr === formDateTo;
                                                                const inRange = isDateInRange(day);
                                                                return (
                                                                    <button 
                                                                        key={`next-${idx}`} 
                                                                        className={`calendar-day-dual ${isPast ? "past" : ""} ${isSelected ? "selected" : ""} ${inRange && !isSelected ? "in-range" : ""}`} 
                                                                        onClick={() => !isPast && handleCalendarDateClick(day)} 
                                                                        disabled={isPast}
                                                                    >
                                                                        {day.getDate()}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Destination Dropdown */}
                                    <div className="filter-dropdown-wrapper" ref={destDropdownRef}>
                                        <button className="filter-btn" onClick={() => setShowDestDropdown(!showDestDropdown)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="filter-label">Destination</span>
                                            {formDestinations.length > 0 && <span className="filter-badge">{formDestinations.length}</span>}
                                        </button>
                                        {showDestDropdown && (
                                            <div className="filter-dropdown-panel">
                                                {DESTINATIONS.map(dest => (
                                                    <label key={dest.id} className="filter-checkbox">
                                                        <input type="checkbox" checked={formDestinations.includes(dest.id)} onChange={() => setFormDestinations(prev => prev.includes(dest.id) ? prev.filter(d => d !== dest.id) : [...prev, dest.id])} />
                                                        <span>{dest.name}</span>
                                                    </label>
                                                ))}
                                                <div className="filter-actions">
                                                    <button className="btn-clear-filter" onClick={() => setFormDestinations([])}>Clear</button>
                                                    <button className="btn-apply-filter" onClick={() => { setShowDestDropdown(false); handleModifySearch(); }}>Apply</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Duration Dropdown */}
                                    <div className="filter-dropdown-wrapper filter-dropdown-wrapper--right" ref={durationDropdownRef}>
                                        <button className="filter-btn" onClick={() => setShowDurationDropdown(!showDurationDropdown)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span className="filter-label">Nights</span>
                                            {formDuration !== 3 && <span className="filter-badge">{formDuration}</span>}
                                        </button>
                                        {showDurationDropdown && (
                                            <div className="filter-dropdown-panel filter-dropdown-panel--right">
                                                <div className="filter-counter">
                                                    <span>Days</span>
                                                    <div className="counter-controls">
                                                        <button onClick={() => setFormDuration(Math.max(1, formDuration - 1))}>−</button>
                                                        <span>{formDuration}</span>
                                                        <button onClick={() => setFormDuration(Math.min(30, formDuration + 1))}>+</button>
                                                    </div>
                                                </div>
                                                <div className="filter-actions">
                                                    <button className="btn-clear-filter" onClick={() => setFormDuration(3)}>Reset</button>
                                                    <button className="btn-apply-filter" onClick={() => { setShowDurationDropdown(false); handleModifySearch(); }}>Apply</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Guests Dropdown */}
                                    <div className="filter-dropdown-wrapper filter-dropdown-wrapper--right" ref={guestsDropdownRef}>
                                        <button className="filter-btn" onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            <span className="filter-label">Guests</span>
                                            {formGuests !== 2 && <span className="filter-badge">{formGuests}</span>}
                                        </button>
                                        {showGuestsDropdown && (
                                            <div className="filter-dropdown-panel filter-dropdown-panel--right">
                                                <div className="filter-counter">
                                                    <span>Guests</span>
                                                    <div className="counter-controls">
                                                        <button onClick={() => setFormGuests(Math.max(1, formGuests - 1))}>−</button>
                                                        <span>{formGuests}</span>
                                                        <button onClick={() => setFormGuests(Math.min(20, formGuests + 1))}>+</button>
                                                    </div>
                                                </div>
                                                <div className="filter-actions">
                                                    <button className="btn-clear-filter" onClick={() => setFormGuests(2)}>Reset</button>
                                                    <button className="btn-apply-filter" onClick={() => { setShowGuestsDropdown(false); handleModifySearch(); }}>Apply</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Active Filters Pills */}
                            {(searchQuery || formDestinations.length > 0 || formDateFrom || formDuration !== 3 || formGuests !== 2) && (
                                <div className="active-filters-row">
                                    <button className="clear-all-btn" onClick={() => {
                                        setSearchQuery("");
                                        setFormDestinations([]);
                                        setFormDateFrom("");
                                        setFormDateTo("");
                                        setFormDuration(3);
                                        setFormGuests(2);
                                        handleModifySearch();
                                    }}>
                                        Clear All
                                    </button>
                                    {searchQuery && (
                                        <span className="filter-pill">
                                            Search: {searchQuery}
                                            <button className="filter-pill-remove" onClick={() => setSearchQuery("")}>×</button>
                                        </span>
                                    )}
                                    {formDestinations.map(destId => {
                                        const dest = DESTINATIONS.find(d => d.id === destId);
                                        return dest ? (
                                            <span key={destId} className="filter-pill">
                                                {dest.name}
                                                <button className="filter-pill-remove" onClick={() => {
                                                    setFormDestinations(prev => prev.filter(d => d !== destId));
                                                    handleModifySearch();
                                                }}>×</button>
                                            </span>
                                        ) : null;
                                    })}
                                    {formDateFrom && (
                                        <span className="filter-pill">
                                            {formDateTo ? `${formatDateDisplay(formDateFrom)} - ${formatDateDisplay(formDateTo)}` : formatDateDisplay(formDateFrom)}
                                            <button className="filter-pill-remove" onClick={() => {
                                                setFormDateFrom("");
                                                setFormDateTo("");
                                                handleModifySearch();
                                            }}>×</button>
                                        </span>
                                    )}
                                    {formDuration !== 3 && (
                                        <span className="filter-pill">
                                            {formDuration} {formDuration === 1 ? "day" : "days"}
                                            <button className="filter-pill-remove" onClick={() => {
                                                setFormDuration(3);
                                                handleModifySearch();
                                            }}>×</button>
                                        </span>
                                    )}
                                    {formGuests !== 2 && (
                                        <span className="filter-pill">
                                            {formGuests} {formGuests === 1 ? "guest" : "guests"}
                                            <button className="filter-pill-remove" onClick={() => {
                                                setFormGuests(2);
                                                handleModifySearch();
                                            }}>×</button>
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Back Button - only on results page */}
                            {!showHero && (
                                <div className="mb-4" style={{ marginTop: "1.5rem" }}>
                                    <LocaleLink
                                        href="/"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-[#12214a] transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Homepage
                                    </LocaleLink>
                                </div>
                            )}

                            {/* Title and Intro */}
                            <div style={{ marginTop: showHero ? "1.5rem" : "0", marginBottom: "1.5rem" }}>
                                <h2 className="results-title" style={{ fontFamily: "var(--font-canto, Georgia, serif)", color: "#1a1a1a", fontSize: "2rem", marginBottom: "0.5rem" }}>
                                    {showHero ? "Cruise Packages" : "Select a Ship"}
                                </h2>

                                <div className="results-intro">
                                    {sortedShips.length > 0 ? (
                                        <>
                                            <p style={{ color: "#666", fontSize: "1rem", marginTop: 0 }}>
                                                {showHero
                                                    ? <>Browse through our collection of <strong style={{ color: "#12214a" }}>{sortedShips.length} exclusive cruise packages</strong></>
                                                    : <>Found <strong style={{ color: "#12214a" }}>{sortedShips.length} ships</strong>. Please choose one to view available cabins.</>}
                                            </p>
                                            {searchCriteria.dateFrom && searchCriteria.dateTo && (
                                                <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem", fontStyle: "italic" }}>
                                                    Showing trips available between <strong>{formatDateDisplay(searchCriteria.dateFrom)}</strong> and <strong>{formatDateDisplay(searchCriteria.dateTo)}</strong>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="success-message" style={{ borderLeftColor: "#12214a", background: "#e8eaf2" }}>
                                            <p>
                                                <strong style={{ color: "#12214a" }}>No boats available for this date range.</strong>{" "}
                                                Please try selecting a different date range or contact our team for assistance.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="results-count-text">
                                {sortedShips.length} ships • {sortedShips.reduce((sum, ship) => sum + ship.availableCabins, 0)} cabins available
                            </div>

                            {/* No Results Message */}
                            {!selectedShipForCabins && sortedShips.length === 0 && ships.length > 0 && (
                                <div className="no-results-message">
                                    <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <h3>No ships found</h3>
                                    {searchQuery ? (
                                        <>
                                            <p>We couldn't find any ships matching "<strong>{searchQuery}</strong>".</p>
                                            <p className="text-sm">Try adjusting your search or filters.</p>
                                        </>
                                    ) : (
                                        <p className="text-sm">Try adjusting your filters.</p>
                                    )}
                                </div>
                            )}

                            {/* Ship Cards */}
                            {!selectedShipForCabins && sortedShips.length > 0 && (
                                <div className="ship-cards-container">
                                    {sortedShips.map((ship, shipIndex) => {
                                        const shipImages = getShipGalleryImages(ship);
                                        const currentImageIndex = shipImageIndices[ship.name] || 0;
                                        
                                        return (
                                        <div key={`${ship.name}-${shipIndex}`} className="ship-card-horizontal">
                                            {/* Image Section with Carousel */}
                                            <div className="ship-card-media">
                                                <div className="ship-image-wrapper">
                                                    <Image
                                                        src={getDirectImageUrl(shipImages[currentImageIndex])}
                                                        alt={ship.name}
                                                        fill
                                                        style={{ objectFit: "cover" }}
                                                        unoptimized
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    {/* Carousel Navigation - Only show if multiple images */}
                                                    {shipImages.length > 1 && (
                                                        <>
                                                            <button 
                                                                className="carousel-nav carousel-prev" 
                                                                onClick={(e) => handleShipPrevImage(ship.name, e)}
                                                                aria-label="Previous image"
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 18 9 12 15 6" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="carousel-nav carousel-next" 
                                                                onClick={(e) => handleShipNextImage(ship.name, e)}
                                                                aria-label="Next image"
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="9 6 15 12 9 18" />
                                                                </svg>
                                                            </button>
                                                            {/* Image counter */}
                                                            <div className="image-counter">
                                                                {currentImageIndex + 1} / {shipImages.length}
                                                            </div>
                                                        </>
                                                    )}
                                                    {/* Ship Name Badge */}
                                                    <div className="ship-name-badge">
                                                        <svg className="ship-badge-icon" viewBox="0 0 24 24" fill="currentColor">
                                                            <circle cx="12" cy="12" r="10" />
                                                        </svg>
                                                        <span>{ship.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="ship-card-content">
                                                {/* Nights Badge */}
                                                <div className="cruise-duration">
                                                    <svg className="duration-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {formatTripNights(ship)} Nights
                                                </div>

                                                {/* Title */}
                                                <h3 className="cruise-title">
                                                    {ship.trip_name || ship.name}
                                                </h3>

                                                {/* Leaving From */}
                                                <div className="leaving-from">
                                                    <span className="leaving-label">Leaving from:</span>
                                                    <span className="leaving-value">
                                                        {ship.destinations?.split(',')[0] || 'Labuan Bajo'} (Port)
                                                    </span>
                                                    <span className="port-arrow">→</span>
                                                    <span className="port-count">+{ship.destinations?.split(',').length || 2} ports</span>
                                                </div>

                                                {/* Rating */}
                                                <div className="cruise-rating">
                                                    <div className="rating-stars">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#d1d5db">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                        </svg>
                                                    </div>
                                                    <span className="review-count">{ship.availableCabins * 15} reviews</span>
                                                </div>

                                                {/* Departure Date */}
                                                <div className="departure-date">
                                                    <svg className="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span>
                                                        {searchCriteria.dateFrom ? formatDateDisplay(searchCriteria.dateFrom) : 'Jan 6, 2027'}
                                                    </span>
                                                </div>

                                                {/* Cruise Line Logo */}
                                                <div className="cruise-line-logo">
                                                    <svg className="ship-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                        <path d="M3 15h18l-1.5 6h-15L3 15z" />
                                                        <rect x="5" y="8" width="14" height="7" rx="1" />
                                                        <path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
                                                    </svg>
                                                    <span>COMODOCRUISE</span>
                                                </div>
                                            </div>

                                            {/* Price & Actions Section */}
                                            <div className="ship-card-actions">
                                                {/* Price Display */}
                                                <div className="price-display">
                                                    <div className="price-main">
                                                        {ship.startFromPrice > 0 ? (
                                                            <>
                                                                <sup className="price-currency">{getPriceSymbol(formatPrice(ship.startFromPrice))}</sup>
                                                                <span className="price-amount">{getPriceVal(formatPrice(ship.startFromPrice))}</span>
                                                                <sup className="price-pp">PP</sup>
                                                                <button className="price-info-btn" aria-label="Price information">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10"/>
                                                                        <line x1="12" y1="16" x2="12" y2="12"/>
                                                                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="price-contact">Contact for price</span>
                                                        )}
                                                    </div>
                                                    {ship.startFromPrice > 0 && (
                                                        <div className="price-per-night">
                                                            <span>${Math.round(ship.startFromPrice / (parseInt(ship.trip) || 3))}/night</span>
                                                            <span className="cabin-type-dropdown">
                                                                • Inside Cabin
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="6 9 12 15 18 9"/>
                                                                </svg>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Brand Logo */}
                                                <div className="brand-logo">
                                                    <span style={{ fontWeight: 700, color: '#12214a', fontSize: '0.9rem', letterSpacing: '0.5px' }}>COMODOCRUISE</span>
                                                </div>

                                                {/* Action Buttons */}
                                                <button className="btn-view-deal" onClick={() => handleViewCabins(ship.name)}>
                                                    View Cabins
                                                </button>
                                                <button className="btn-cruise-details" onClick={() => handleViewCabins(ship.name)}>
                                                    Cruise Details
                                                </button>
                                            </div>
                                        </div>
                                    );
                                    })}
                                </div>
                            )}

                            {/* ===== CABIN TAB VIEW ===== */}
                            {selectedShipForCabins && getSelectedShip() && (
                                <div className="cabin-tab-view">
                                    <div className="back-to-ships-bar">
                                        <button className="btn-back-ships" onClick={handleBackToShips}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                            Back to Ships
                                        </button>
                                        <span className="viewing-ship-label">
                                            Viewing: <strong>{selectedShipForCabins}</strong>
                                            {searchCriteria.dateFrom && (
                                                <span style={{ marginLeft: "8px", color: "#12214a", fontSize: "0.9rem" }}>
                                                    ({formatDateDisplay(searchCriteria.dateFrom)}
                                                    {searchCriteria.dateTo && ` - ${formatDateDisplay(searchCriteria.dateTo)}`})
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="cabin-results-section">
                                        <div className="cabin-results-header">
                                            <h3 className="cabin-results-title">Available Cabins</h3>
                                            <span className="cabin-results-count">
                                                {getSelectedShip()?.cabins.length || 0} Cabins
                                            </span>
                                        </div>

                                        <div className="cabin-cards-list">
                                            {getSelectedShip()?.cabins.map((cabin, idx) => {
                                                const cabinImages = getCabinGalleryImages(cabin);
                                                const currentCabinImageIndex = cabinImageIndices[cabin.cabin_id] || 0;
                                                
                                                return (
                                                <div key={idx} className="cabin-card-wrapper">
                                                    <div className="cabin-card-body">
                                                        <div className="cabin-card-image" onClick={() => openCabinDetail(cabin)}>
                                                            <Image
                                                                src={getDirectImageUrl(cabinImages[currentCabinImageIndex])}
                                                                alt={cabin.cabin_name}
                                                                fill
                                                                style={{ objectFit: "cover", cursor: "pointer" }}
                                                                unoptimized
                                                                referrerPolicy="no-referrer"
                                                            />
                                                            {/* Carousel Navigation - Only show if multiple images */}
                                                            {cabinImages.length > 1 && (
                                                                <>
                                                                    <button 
                                                                        className="carousel-nav carousel-prev" 
                                                                        onClick={(e) => handleCabinPrevImage(cabin.cabin_id, e)}
                                                                        aria-label="Previous cabin image"
                                                                    >
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <polyline points="15 18 9 12 15 6" />
                                                                        </svg>
                                                                    </button>
                                                                    <button 
                                                                        className="carousel-nav carousel-next" 
                                                                        onClick={(e) => handleCabinNextImage(cabin.cabin_id, e)}
                                                                        aria-label="Next cabin image"
                                                                    >
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <polyline points="9 6 15 12 9 18" />
                                                                        </svg>
                                                                    </button>
                                                                    {/* Image counter */}
                                                                    <div className="image-counter">
                                                                        {currentCabinImageIndex + 1} / {cabinImages.length}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="cabin-card-content-top">
                                                            <div className="cabin-header-row">
                                                                <h4 className="cabin-title">
                                                                    {cabin.cabin_name} ({(() => {
                                                                        const basePax = Math.max(1, (cabin.total_capacity || 2) - 1);
                                                                        const extraPax = 1;
                                                                        return `${basePax} pax + ${extraPax}`;
                                                                    })()})
                                                                </h4>
                                                                <div className="cabin-capacity-badge">
                                                                    {(() => {
                                                                        const basePax = Math.max(1, (cabin.total_capacity || 2) - 1);
                                                                        const extraPax = 1;
                                                                        return (
                                                                            <>
                                                                                {Array(basePax).fill(0).map((_, i) => (
                                                                                    <svg key={`base-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="#12214a">
                                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                                    </svg>
                                                                                ))}
                                                                                <span className="capacity-plus">+</span>
                                                                                {Array(extraPax).fill(0).map((_, i) => (
                                                                                    <svg key={`extra-${i}`} width="14" height="14" viewBox="0 0 24 24" fill="#6b7280">
                                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                                    </svg>
                                                                                ))}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>

                                                            <span className="cabin-type-badge">
                                                                {cabin.facilities?.balcony ? "Room with balcony" : "Standard Room"}
                                                            </span>

                                                            <div className="cabin-info-row">
                                                                <div className="cabin-info-item">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                                        <line x1="9" y1="3" x2="9" y2="21"/>
                                                                    </svg>
                                                                    <span>Size: 36 sqm</span>
                                                                </div>
                                                                <div className="cabin-info-item">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                                    </svg>
                                                                    <span>Max Adults: {cabin.total_capacity || 2}</span>
                                                                </div>
                                                            </div>

                                                            <div className="cabin-info-row">
                                                                <div className="cabin-info-item">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                                    </svg>
                                                                    <span>Bed options: {cabin.facilities?.large_bed ? "Double Bed or 2 Beds" : "Double Bed or 2 Beds"}</span>
                                                                </div>
                                                            </div>

                                                            <div className="cabin-extra-beds">
                                                                <strong>Extra beds available:</strong>
                                                                <ul>
                                                                    <li>• Rollaway bed</li>
                                                                    <li>• Crib</li>
                                                                </ul>
                                                            </div>

                                                            <button className="cabin-show-more-btn" onClick={() => openCabinDetail(cabin)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                                                    <circle cx="12" cy="12" r="10"/>
                                                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                                                </svg>
                                                                Show more
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="cabin-card-bottom">
                                                        <div className="cabin-date-row">
                                                            <span className="cabin-date-text">
                                                                {(() => {
                                                                    const cabinDates = getAvailableDatesForCabin(cabin);
                                                                    const firstDate = cabinDates.length > 0 ? cabinDates[0] : null;
                                                                    const selectedShip = getSelectedShip();
                                                                    const tripDays = selectedShip ? (parseInt(selectedShip.trip, 10) || 3) : 3;
                                                                    const tripNights = tripDays - 1;
                                                                    const dateFrom = cabinSelectedDates[cabin.cabin_id]?.dateFrom || firstDate || searchCriteria.dateFrom;
                                                                    let dateTo = cabinSelectedDates[cabin.cabin_id]?.dateTo;
                                                                    if (!dateTo && dateFrom) {
                                                                        const d = new Date(dateFrom);
                                                                        d.setDate(d.getDate() + tripNights);
                                                                        dateTo = toLocalDateStr(d);
                                                                    }
                                                                    return `${formatDateDisplay(dateFrom)} - ${formatDateDisplay(dateTo || dateFrom)}`;
                                                                })()}
                                                            </span>
                                                            <span className="cabin-availability-badge">
                                                                {getAvailableDatesForCabin(cabin).length} dates
                                                            </span>
                                                        </div>

                                                        {/* More Dates Dropdown */}
                                                        {openCabinDates === cabin.cabin_id && (
                                                            <div className="more-dates-dropdown" ref={cabinDatesDropdownRef} onClick={e => e.stopPropagation()}>
                                                                {(() => {
                                                                    const cabinDates = getAvailableDatesForCabin(cabin);
                                                                    const selectedShip = getSelectedShip();
                                                                    const tripDays = selectedShip ? (parseInt(selectedShip.trip, 10) || 3) : 3;
                                                                    const tripNights = tripDays - 1;
                                                                    if (cabinDates.length === 0) {
                                                                        return <div className="no-dates-msg">No available dates found</div>;
                                                                    }
                                                                    const maxDatesToShow = searchCriteria.dateFrom ? 5 : 10;
                                                                    return cabinDates.slice(0, maxDatesToShow).map((date, dateIdx) => {
                                                                        const startDate = new Date(date);
                                                                        const endDate = new Date(date);
                                                                        endDate.setDate(endDate.getDate() + tripNights);
                                                                        const isReserved = isCabinInItinerary(cabin.cabin_name, selectedShipForCabins!, date);
                                                                        return (
                                                                            <div key={dateIdx} className={`trip-option-alt ${isReserved ? "trip-reserved" : ""}`}>
                                                                                <div className="trip-alt-info">
                                                                                    <span className="trip-alt-date">
                                                                                        {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                                        {" - "}
                                                                                        {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                                    </span>
                                                                                    <span className="trip-alt-rooms">1 cabin</span>
                                                                                </div>
                                                                                {isReserved ? (
                                                                                    <span className="trip-reserved-label">
                                                                                        <span className="reserved-check-small">✓</span> RESERVED
                                                                                    </span>
                                                                                ) : (
                                                                                    <button
                                                                                        className="trip-select-action"
                                                                                        style={{ background: "none", border: "none", cursor: "pointer" }}
                                                                                        onClick={() => {
                                                                                            const calculatedDateTo = toLocalDateStr(endDate);
                                                                                            setCabinSelectedDates(prev => ({
                                                                                                ...prev,
                                                                                                [cabin.cabin_id]: { dateFrom: date, dateTo: calculatedDateTo },
                                                                                            }));
                                                                                            setOpenCabinDates(null);
                                                                                        }}
                                                                                    >
                                                                                        SELECT
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                                <button className="less-dates-toggle" onClick={() => setOpenCabinDates(null)}>
                                                                    <span>LESS DATES</span>
                                                                    <span className="toggle-arrow expanded">▼</span>
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="cabin-footer">
                                                            <div className="cabin-price-info">
                                                                <span className="cabin-price-label">FROM</span>
                                                                <span className="cabin-price-value">
                                                                    {formatPrice(cabin.price || getSelectedShip()?.startFromPrice || 0)}
                                                                </span>
                                                                <span className="cabin-price-note">per person, per night</span>
                                                            </div>
                                                            <div className="cabin-action-buttons">
                                                                <button
                                                                    className="btn-more-dates"
                                                                    onClick={() => setOpenCabinDates(openCabinDates === cabin.cabin_id ? null : cabin.cabin_id)}
                                                                >
                                                                    MORE DATES
                                                                </button>
                                                                <button
                                                                    className={`btn-reserve-now ${isCabinInItinerary(cabin.cabin_name, selectedShipForCabins!, cabinSelectedDates[cabin.cabin_id]?.dateFrom || searchCriteria.dateFrom || toLocalDateStr(new Date())) ? "btn-reserved" : ""}`}
                                                                    onClick={() => handleReserveNow(cabin, selectedShipForCabins!)}
                                                                >
                                                                    {isCabinInItinerary(cabin.cabin_name, selectedShipForCabins!, cabinSelectedDates[cabin.cabin_id]?.dateFrom || searchCriteria.dateFrom || toLocalDateStr(new Date())) ? (
                                                                        <>
                                                                            <span className="reserved-check">
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ verticalAlign: "text-bottom" }}>
                                                                                    <polyline points="20 6 9 17 4 12" />
                                                                                </svg>
                                                                            </span>
                                                                            RESERVED
                                                                        </>
                                                                    ) : "RESERVE NOW"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== CABIN DETAIL MODAL ===== */}
            {selectedCabinForDetail && (
                <div className="modal-overlay" onClick={closeCabinDetail}>
                    <div className="modal-content-redesigned" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-details" onClick={closeCabinDetail}>✕</button>
                        <div className="modal-body-redesigned">
                            <div className="modal-info-left">
                                <div className="modal-cabin-header">
                                    <h2 className="modal-cabin-name">{selectedCabinForDetail.cabin_name}</h2>
                                    <p className="modal-cabin-subtitle">Room</p>
                                </div>
                                <div className="modal-cabin-specs">
                                    SLEEPS {selectedCabinForDetail.total_capacity || 2} | {selectedCabinForDetail.facilities?.large_bed ? "1 KING OR 2 TWINS" : "TWIN BEDS"} | PRIVATE CABIN
                                </div>
                                <blockquote className="modal-cabin-quote">
                                    &ldquo;Experience luxury on the open ocean with our premium cabin selection.&rdquo;
                                </blockquote>
                                <div className="modal-overview-section">
                                    <h3 className="modal-section-title">OVERVIEW</h3>
                                    <ul className="modal-overview-list">
                                        <li>{selectedCabinForDetail.facilities?.balcony ? "Private Balcony" : "Shared Deck"}</li>
                                        <li>{selectedCabinForDetail.facilities?.seaview ? "Ocean View" : "Standard View"}</li>
                                        <li>Air conditioning</li>
                                        <li>Daily housekeeping</li>
                                        <li>Private bathroom</li>
                                        <li>Hot water</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="modal-image-right">
                                <Image
                                    key={getCabinGalleryImages(selectedCabinForDetail)[modalImageIndex]}
                                    src={getDirectImageUrl(getCabinGalleryImages(selectedCabinForDetail)[modalImageIndex])}
                                    alt={selectedCabinForDetail.cabin_name}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                    referrerPolicy="no-referrer"
                                />
                                <button className="modal-gallery-nav modal-gallery-prev" onClick={prevModalImage}>‹</button>
                                <button className="modal-gallery-nav modal-gallery-next" onClick={nextModalImage}>›</button>
                                <div className="modal-image-indicator">
                                    {getCabinGalleryImages(selectedCabinForDetail).map((_, idx) => (
                                        <span key={idx} className={`indicator-dot ${idx === modalImageIndex ? "active" : ""}`} />
                                    ))}
                                </div>
                                <div className="modal-image-count-badge">
                                    CABIN {modalImageIndex + 1} of {getCabinGalleryImages(selectedCabinForDetail).length}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-bar">
                            <div className="modal-price-container">
                                <span className="modal-price-val">
                                    {getPriceSymbol(formatPrice(selectedCabinForDetail.price || getSelectedShip()?.startFromPrice || 0))} {getPriceVal(formatPrice(selectedCabinForDetail.price || getSelectedShip()?.startFromPrice || 0))}
                                </span>
                                <span className="modal-price-unit">/NIGHT</span>
                                <div className="modal-price-sub">Excluding taxes and fees</div>
                            </div>
                            <button className="btn-reserve-modal" onClick={() => { handleReserveNow(selectedCabinForDetail, selectedShipForCabins!); closeCabinDetail(); }}>
                                {isCabinInItinerary(selectedCabinForDetail.cabin_name, selectedShipForCabins!, searchCriteria.dateFrom || "") ? "RESERVED" : "RESERVE NOW"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FLOATING ITINERARY BUTTON ===== */}
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

            {/* ===== ITINERARY PANEL ===== */}
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
                                                        {formatPrice(item.price)}
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
                                            <span className="itinerary-summary-value">{formatPrice(itineraryTotal)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="itinerary-footer-actions">
                                    <button className="itinerary-btn-clear" onClick={() => {
                                        setItineraryItems([]);
                                        localStorage.removeItem("comodocruise_itinerary");
                                    }}>Clear All</button>
                                    <button className="itinerary-btn-checkout" onClick={() => {
                                        setShowItineraryPanel(false);
                                        setShowBookingForm(true);
                                    }}>Proceed to Booking →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== GUEST MODAL ===== */}
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

            {/* ===== BOOKING FORM MODAL ===== */}
            {showBookingForm && (
                <BookingForm
                    items={itineraryItems}
                    onClose={() => setShowBookingForm(false)}
                    onClearItinerary={() => {
                        setItineraryItems([]);
                        localStorage.removeItem("comodocruise_itinerary");
                    }}
                />
            )}
        </div>
    );
}
