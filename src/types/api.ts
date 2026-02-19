// API Response Types for comodocruise project

// Ship from /api/ships
export interface Ship {
    name: string;
    description: string;
    trip: string;
    trip_name: string;
    destinations: string;
    image_main: string;
    images: string[];
}

// Cabin from /api/cabins
export interface CabinData {
    cabin_id: string;
    cabin_name: string;
    cabin_name_api: string;
    boat_name: string;
    description: string;
    total_capacity: number;
    price: number;
    facilities: {
        balcony: boolean;
        bathtub: boolean;
        seaview: boolean;
        large_bed: boolean;
        private_jacuzzi: boolean;
        cabin_display_facilities: string;
    };
    image_main: string;
}

// Availability operator from /api/availability
export interface AvailabilityOperator {
    operator: string;
    total: number;
    cabins: {
        name: string;
        available: number;
    }[];
}

export interface ShipsApiResponse {
    success: boolean;
    count: number;
    source: string;
    data: Ship[];
}

export interface CabinsApiResponse {
    success: boolean;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    source: string;
    data: CabinData[];
}

export interface AvailabilityApiResponse {
    success: boolean;
    source: string;
    data: {
        date: string;
        total: number;
        operators: AvailabilityOperator[];
    };
}

// Aggregated cabin stats per boat
export interface BoatCabinStats {
    boatName: string;
    cabinCount: number;
    lowestPrice: number;
    highestPrice: number;
    totalCapacity: number;
    facilities: {
        hasBalcony: boolean;
        hasBathtub: boolean;
        hasSeaview: boolean;
        hasJacuzzi: boolean;
    };
    cabins: CabinData[];
}

// Parsed ship data for UI (converted from API format)
export interface ParsedShip {
    id: string;
    name: string;
    description: string;
    tripDuration: string;
    tripName: string;
    destinations: string;
    imageMain: string;
    images: string[];
    slug: string;
    // Cabin aggregated data
    cabinCount: number;
    lowestPrice: number;
    highestPrice: number;
    totalCapacity: number;
    facilities: {
        hasBalcony: boolean;
        hasBathtub: boolean;
        hasSeaview: boolean;
        hasJacuzzi: boolean;
    };
}

// Extended ship with details for results page
export interface ShipWithDetails {
    name: string;
    description: string;
    trip: string;
    trip_name: string;
    destinations: string;
    image_main: string;
    images: string[];
    startFromPrice: number;
    cabinCount: number;
    availableCabins: number;
    isAvailable: boolean;
    cabins: CabinData[];
    availableDates?: string[];
}

// Cabin with available dates tracking
export interface CabinWithDates extends CabinData {
    availableDates?: string[];
}

// Availability with date tracking for aggregation
export interface CabinAvailabilityWithDates {
    name: string;
    available: number;
    availableDates: string[];
}

export interface OperatorAvailabilityWithDates {
    operator: string;
    total: number;
    cabins: CabinAvailabilityWithDates[];
    availableDates: string[];
}

// Search criteria for results page
export interface SearchCriteria {
    destinations?: string[];
    destinationName?: string;
    dateFrom?: string;
    dateTo?: string;
    guests?: number;
    duration?: number;
}

// Itinerary item for sidebar
export interface ItineraryItem {
    cabin: string;
    ship: string;
    date: string;
    price: number;
    guests: number;
    addedAt?: number;
}

// Booking related types
export interface BookingSearchParams {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
}

export interface AvailabilitySearchParams extends BookingSearchParams {
    date: string;
}