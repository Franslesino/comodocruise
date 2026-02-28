"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n";
import { getDestinations } from "@/lib/api";

// Destination interface
interface Destination {
    id: string;
    name: string;
    description: string;
}

// Convert destination name to BookingBar format
function formatDestinationForBooking(destName: string): Destination {
    const descriptions: Record<string, string> = {
        'komodo national park': 'Home to legendary dragons & pristine reefs',
        'labuan bajo': 'Gateway to Komodo with stunning sunsets'
    };

    return {
        id: destName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: destName,
        description: descriptions[destName.toLowerCase()] || `Explore ${destName} destinations`
    };
}

// Generate calendar days for a month
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

// Format date for display
function formatDateDisplay(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Helper to format date as YYYY-MM-DD
const toLocalDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface BookingBarProps {
    position: "hero" | "header";
    showDestinationDropdown: boolean;
    setShowDestinationDropdown: (show: boolean) => void;
    showCalendar: boolean;
    setShowCalendar: (show: boolean) => void;
    showDurationDropdown: boolean;
    setShowDurationDropdown: (show: boolean) => void;
    showGuestDropdown: boolean;
    setShowGuestDropdown: (show: boolean) => void;
    onSearch?: () => void;
}

export default function BookingBar({
    position,
    showDestinationDropdown,
    setShowDestinationDropdown,
    showCalendar,
    setShowCalendar,
    showDurationDropdown,
    setShowDurationDropdown,
    showGuestDropdown,
    setShowGuestDropdown,
    onSearch,
}: BookingBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    // State
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState<Date | null>(null);
    const [dateTo, setDateTo] = useState<Date | null>(null);
    const [duration, setDuration] = useState(3);
    const [passengers, setPassengers] = useState(2);

    // Calendar state
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    // Refs for click outside
    const destinationRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const durationRef = useRef<HTMLDivElement>(null);
    const guestRef = useRef<HTMLDivElement>(null);

    // Load destinations from API
    useEffect(() => {
        const loadDestinations = async () => {
            try {
                const destNames = await getDestinations();
                const formattedDests = destNames
                    .filter(name => name) // Remove empty names
                    .map(formatDestinationForBooking);
                setDestinations(formattedDests);
            } catch (error) {
                console.error('Failed to load destinations for booking:', error);
                // Fallback to default destinations
                setDestinations([
                    { id: "komodo-national-park", name: "Komodo National Park", description: "Home to legendary dragons & pristine reefs" },
                    { id: "labuan-bajo", name: "Labuan Bajo", description: "Gateway to Komodo with stunning sunsets" }
                ]);
            }
        };

        loadDestinations();
    }, []);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
                setShowDestinationDropdown(false);
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
            if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
                setShowDurationDropdown(false);
            }
            if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
                setShowGuestDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle date selection (range)
    const handleDateClick = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) return;

        // Range selection logic
        if (!dateFrom || (dateFrom && dateTo)) {
            // Start new range
            setDateFrom(date);
            setDateTo(null);
        } else if (date < dateFrom) {
            // Swap if selected date is before start
            setDateTo(dateFrom);
            setDateFrom(date);
        } else if (date.getTime() === dateFrom.getTime()) {
            // Toggle off if clicking same date
            setDateFrom(null);
            setDateTo(null);
        } else {
            // Set end date
            setDateTo(date);
        }
    };

    // Check if date is in selected range
    const isDateInRange = (date: Date): boolean => {
        if (!dateFrom || !dateTo) return false;
        return date > dateFrom && date < dateTo;
    };

    // Check if date is start or end of range
    const isDateSelected = (date: Date): boolean => {
        return !!((dateFrom && date.getTime() === dateFrom.getTime()) ||
            (dateTo && date.getTime() === dateTo.getTime()));
    };

    // Toggle destination selection
    const toggleDestination = (id: string) => {
        setSelectedDestinations(prev =>
            prev.includes(id)
                ? prev.filter(d => d !== id)
                : [...prev, id]
        );
    };

    // Handle search
    const handleSearch = () => {
        const locale = getLocaleFromPathname(pathname);
        const params = new URLSearchParams();

        if (selectedDestinations.length > 0) {
            params.set("destinations", selectedDestinations.join(","));
        }
        if (dateFrom) {
            params.set("dateFrom", toLocalDateStr(dateFrom));
        }
        if (dateTo) {
            params.set("dateTo", toLocalDateStr(dateTo));
        }
        params.set("duration", duration.toString());
        params.set("guests", passengers.toString());

        const searchUrl = localizePath(`/results?${params.toString()}`, locale);
        router.push(searchUrl);
        onSearch?.();
    };

    const calendarDays = generateCalendarDays(calendarYear, calendarMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const positionClass = position === "hero"
        ? "booking-bar--hero"
        : "booking-bar--header";

    return (
        <div className={`booking-bar ${positionClass}`}>
            {/* Destination Field */}
            <div ref={destinationRef} className="booking-bar__field relative">
                <span className="booking-bar__label">Destination</span>
                <span
                    className="booking-bar__value"
                    onClick={() => setShowDestinationDropdown(!showDestinationDropdown)}
                >
                    {selectedDestinations.length > 0
                        ? `${selectedDestinations.length} selected`
                        : "Where to?"}
                </span>

                {/* Destination Dropdown */}
                {showDestinationDropdown && (
                    <div className={`absolute ${position === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-4`}>
                        <h4 className="font-avenir text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Select Destinations
                        </h4>
                        <div className="space-y-2">
                            {destinations.map(dest => (
                                <label
                                    key={dest.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDestinations.includes(dest.id)}
                                        onChange={() => toggleDestination(dest.id)}
                                        className="mt-1 w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                                    />
                                    <div>
                                        <div className="font-avenir font-medium text-gray-900">{dest.name}</div>
                                        <div className="font-avenir text-sm text-gray-500">{dest.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Date Field */}
            <div ref={calendarRef} className="booking-bar__field relative">
                <span className="booking-bar__label">Date</span>
                <span
                    className="booking-bar__value"
                    onClick={() => setShowCalendar(!showCalendar)}
                >
                    {dateFrom ? (
                        dateTo
                            ? `${formatDateDisplay(dateFrom)} - ${formatDateDisplay(dateTo)}`
                            : formatDateDisplay(dateFrom)
                    ) : "Select date range"}
                </span>

                {/* Calendar Dropdown */}
                {showCalendar && (
                    <div
                        data-calendar-dropdown="true"
                        className={`
                            absolute
                            ${position === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'}
                            left-1/2 -translate-x-1/2
                            bg-white rounded-xl shadow-xl border border-gray-100
                            z-50 p-4
                            w-[640px] max-w-[calc(100vw-2rem)]
                        `}
                        style={{ '--calendar-active': '1' } as React.CSSProperties}
                    >
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => {
                                    if (calendarMonth === 0) {
                                        setCalendarMonth(11);
                                        setCalendarYear(calendarYear - 1);
                                    } else {
                                        setCalendarMonth(calendarMonth - 1);
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Desktop: two month names | Mobile: one */}
                            <div className="flex gap-12">
                                <span className="font-avenir font-semibold">
                                    {monthNames[calendarMonth]} {calendarYear}
                                </span>
                                <span className="font-avenir font-semibold hidden md:inline">
                                    {monthNames[(calendarMonth + 1) % 12]} {calendarMonth === 11 ? calendarYear + 1 : calendarYear}
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    if (calendarMonth === 11) {
                                        setCalendarMonth(0);
                                        setCalendarYear(calendarYear + 1);
                                    } else {
                                        setCalendarMonth(calendarMonth + 1);
                                    }
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Month */}
                            <div>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((date, idx) => {
                                        if (!date) return <div key={`empty-${idx}`} />;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isPast = date < today;
                                        const isSelected = isDateSelected(date);
                                        const inRange = isDateInRange(date);
                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => handleDateClick(date)}
                                                disabled={isPast}
                                                className={`
                                                    py-2 text-sm rounded-lg transition-colors
                                                    ${isPast ? "text-gray-300 cursor-not-allowed" : "hover:bg-sky-50 cursor-pointer"}
                                                    ${isSelected ? "bg-sky-500 text-white hover:bg-sky-600 z-10" : ""}
                                                    ${inRange && !isSelected ? "bg-sky-100 text-sky-700" : ""}
                                                `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Second Month — desktop only */}
                            <div className="hidden md:block">
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => (
                                        <div key={`next-${day}`} className="text-center text-xs font-medium text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays(
                                        calendarMonth === 11 ? calendarYear + 1 : calendarYear,
                                        (calendarMonth + 1) % 12
                                    ).map((date, idx) => {
                                        if (!date) return <div key={`empty-next-${idx}`} />;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isPast = date < today;
                                        const isSelected = isDateSelected(date);
                                        const inRange = isDateInRange(date);
                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => handleDateClick(date)}
                                                disabled={isPast}
                                                className={`
                                                    py-2 text-sm rounded-lg transition-colors
                                                    ${isPast ? "text-gray-300 cursor-not-allowed" : "hover:bg-sky-50 cursor-pointer"}
                                                    ${isSelected ? "bg-sky-500 text-white hover:bg-sky-600 z-10" : ""}
                                                    ${inRange && !isSelected ? "bg-sky-100 text-sky-700" : ""}
                                                `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Duration Field */}
            <div ref={durationRef} className="booking-bar__field relative">
                <span className="booking-bar__label">Duration</span>
                <span
                    className="booking-bar__value"
                    onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                >
                    {duration} {duration === 1 ? "Day" : "Days"}
                </span>

                {/* Duration Dropdown */}
                {showDurationDropdown && (
                    <div className={`absolute ${position === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-4`}>
                        <div className="flex items-center justify-between">
                            <span className="font-avenir font-medium text-gray-900">Duration (Days)</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setDuration(Math.max(1, duration - 1))}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="font-avenir font-semibold text-lg w-8 text-center">{duration}</span>
                                <button
                                    onClick={() => setDuration(Math.min(30, duration + 1))}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                            Maximum 30 days
                        </div>
                    </div>
                )}
            </div>

            {/* Guests Field */}
            <div ref={guestRef} className="booking-bar__field relative">
                <span className="booking-bar__label">Guests</span>
                <span
                    className="booking-bar__value"
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                >
                    {passengers} {passengers === 1 ? "Guest" : "Guests"}
                </span>

                {/* Guests Dropdown */}
                {showGuestDropdown && (
                    <div className={`absolute ${position === 'hero' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50 p-4`}>
                        <div className="flex items-center justify-between">
                            <span className="font-avenir font-medium text-gray-900">Guests</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="font-avenir font-semibold text-lg w-8 text-center">{passengers}</span>
                                <button
                                    onClick={() => setPassengers(passengers + 1)}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search Button */}
            <button
                className="booking-bar__button"
                onClick={handleSearch}
            >
                Search
            </button>
        </div >
    );
}
