// API service functions for fetching ships, cabins, and availability data

import { 
    ShipsApiResponse, 
    CabinsApiResponse, 
    AvailabilityApiResponse,
    ParsedShip,
    Ship,
    CabinData,
    BoatCabinStats,
} from '@/types/api';

// In dev mode, use the Next.js rewrite proxy to bypass CORS/SSL.
// In production (static export), calls go direct to the upstream API.
const API_BASE_URL = typeof window !== 'undefined'
    ? '/proxy-api'
    : 'https://ac0c4wsgo0cg4sc8ksos04ko.49.13.148.202.sslip.io/api';

// Sentinel price used as placeholder for unpriced cabins
const PLACEHOLDER_PRICE = 43243243;

// Convert Google Drive sharing URL to direct image URL
function convertGoogleDriveUrl(url: string): string {
    if (!url || !url.includes('drive.google.com')) return url;
    
    const fileIdMatch = url.match(/(?:file\/d\/|id=)([\w-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
    }
    
    return url;
}

// Normalize boat name for fuzzy matching between ships API and cabins API
function normalizeBoatName(name: string): string {
    return name
        .toUpperCase()
        .replace(/\s*\(.*?\)\s*/g, '') // remove parenthetical like (Deluxe), (Luxury)
        .replace(/LIVEBOARD/g, 'LIVEABOARD') // common typo
        .replace(/[^A-Z0-9]/g, '') // strip non-alphanumeric
        .trim();
}

// Aggregate cabins by boat → BoatCabinStats
function aggregateCabinsByBoat(cabins: CabinData[]): Map<string, BoatCabinStats> {
    const map = new Map<string, BoatCabinStats>();

    for (const cabin of cabins) {
        const key = normalizeBoatName(cabin.boat_name);
        
        // Skip cabins with no valid price
        const hasValidPrice = cabin.price > 0 && cabin.price !== PLACEHOLDER_PRICE;

        if (!map.has(key)) {
            map.set(key, {
                boatName: cabin.boat_name,
                cabinCount: 1,
                lowestPrice: hasValidPrice ? cabin.price : 0,
                highestPrice: hasValidPrice ? cabin.price : 0,
                totalCapacity: cabin.total_capacity,
                facilities: {
                    hasBalcony: cabin.facilities?.balcony ?? false,
                    hasBathtub: cabin.facilities?.bathtub ?? false,
                    hasSeaview: cabin.facilities?.seaview ?? false,
                    hasJacuzzi: cabin.facilities?.private_jacuzzi ?? false,
                },
                cabins: [cabin],
            });
        } else {
            const stats = map.get(key)!;
            stats.cabinCount += 1;
            stats.totalCapacity += cabin.total_capacity;
            stats.cabins.push(cabin);

            if (hasValidPrice) {
                if (stats.lowestPrice === 0) {
                    stats.lowestPrice = cabin.price;
                } else {
                    stats.lowestPrice = Math.min(stats.lowestPrice, cabin.price);
                }
                stats.highestPrice = Math.max(stats.highestPrice, cabin.price);
            }

            // Merge facilities (OR logic — if any cabin has it, the boat has it)
            if (cabin.facilities) {
                stats.facilities.hasBalcony = stats.facilities.hasBalcony || cabin.facilities.balcony;
                stats.facilities.hasBathtub = stats.facilities.hasBathtub || cabin.facilities.bathtub;
                stats.facilities.hasSeaview = stats.facilities.hasSeaview || cabin.facilities.seaview;
                stats.facilities.hasJacuzzi = stats.facilities.hasJacuzzi || cabin.facilities.private_jacuzzi;
            }
        }
    }

    return map;
}

// Fetch raw cabins from API (graceful — returns empty array on failure)
async function fetchRawCabins(): Promise<CabinData[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/cabins`, {
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
            console.warn('Cabins API returned', response.status, '— continuing without cabin data');
            return [];
        }
        const data: CabinsApiResponse = await response.json();
        if (!data.success) return [];
        return data.data;
    } catch (err) {
        console.warn('Failed to fetch cabins, continuing without cabin data:', err);
        return [];
    }
}

// Convert ship data from API format to UI format
function parseShipData(ship: Ship, cabinStats?: BoatCabinStats): ParsedShip {
    const defaultFacilities = { hasBalcony: false, hasBathtub: false, hasSeaview: false, hasJacuzzi: false };

    return {
        id: ship.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: ship.name,
        description: ship.description,
        tripDuration: ship.trip,
        tripName: ship.trip_name,
        destinations: ship.destinations,
        imageMain: convertGoogleDriveUrl(ship.image_main),
        images: ship.images.map(convertGoogleDriveUrl),
        slug: ship.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        cabinCount: cabinStats?.cabinCount ?? 0,
        lowestPrice: cabinStats?.lowestPrice ?? 0,
        highestPrice: cabinStats?.highestPrice ?? 0,
        totalCapacity: cabinStats?.totalCapacity ?? 0,
        facilities: cabinStats?.facilities ?? defaultFacilities,
    };
}

// Fetch all ships, merged with cabin stats
export async function fetchShips(): Promise<ParsedShip[]> {
    try {
        // Fetch ships and cabins in parallel
        const [shipsRes, rawCabins] = await Promise.all([
            fetch(`${API_BASE_URL}/ships`, { headers: { 'Accept': 'application/json' } }),
            fetchRawCabins(),
        ]);

        if (!shipsRes.ok) throw new Error(`HTTP error! status: ${shipsRes.status}`);
        const shipsData: ShipsApiResponse = await shipsRes.json();
        if (!shipsData.success) throw new Error('Ships API returned success: false');

        const cabinStatsMap = aggregateCabinsByBoat(rawCabins);

        return shipsData.data.map(ship => {
            const normalizedShipName = normalizeBoatName(ship.name);
            const stats = cabinStatsMap.get(normalizedShipName);
            return parseShipData(ship, stats);
        });
    } catch (error) {
        console.error('Error fetching ships:', error);
        throw error;
    }
}

// Fetch availability by date
export async function fetchAvailability(date: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/availability?date=${date}`, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data: AvailabilityApiResponse = await response.json();
        if (!data.success) throw new Error('Availability API returned success: false');

        return data.data;
    } catch (error) {
        console.error('Error fetching availability:', error);
        throw error;
    }
}

// Search ships by destination or criteria
export async function searchShips(query: {
    destination?: string;
    date?: string;
    guests?: number;
}): Promise<ParsedShip[]> {
    try {
        const ships = await fetchShips();

        let filtered = ships;
        if (query.destination && query.destination.toLowerCase() !== 'all') {
            filtered = ships.filter(ship => 
                ship.destinations.toLowerCase().includes(query.destination!.toLowerCase()) ||
                ship.name.toLowerCase().includes(query.destination!.toLowerCase())
            );
        }

        return filtered;
    } catch (error) {
        console.error('Error searching ships:', error);
        throw error;
    }
}

// Get unique destinations from ships data
export async function getDestinations(): Promise<string[]> {
    try {
        const ships = await fetchShips();
        const destinations = new Set<string>();
        
        ships.forEach(ship => {
            if (ship.destinations) {
                ship.destinations.split(',').forEach(dest => {
                    const trimmed = dest.trim();
                    if (trimmed) destinations.add(trimmed);
                });
            }
        });

        return Array.from(destinations).sort();
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return [];
    }
}

export { convertGoogleDriveUrl, parseShipData };