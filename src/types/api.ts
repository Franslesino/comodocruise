// API Response Types for seasvoyage project

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