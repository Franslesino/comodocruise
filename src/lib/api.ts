// API service functions for fetching ships, cabins, and availability data

import { 
    ShipsApiResponse, 
    CabinsApiResponse, 
    AvailabilityApiResponse,
    AvailabilityOperator,
    ParsedShip,
    Ship,
    CabinData,
    BoatCabinStats,
    OperatorAvailabilityWithDates,
    CabinAvailabilityWithDates,
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

export { convertGoogleDriveUrl, parseShipData, normalizeBoatName };

// ============================================
// ADDITIONAL FUNCTIONS FOR RESULTS PAGE
// ============================================

// Fetch all raw ships as array
export async function fetchAllShips(): Promise<Ship[]> {
    const response = await fetch(`${API_BASE_URL}/ships`, {
        headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: ShipsApiResponse = await response.json();
    if (!data.success) throw new Error('Ships API returned success: false');
    return data.data;
}

// Fetch ALL cabins (all pages)
export async function fetchAllCabins(): Promise<CabinData[]> {
    const firstPage = await fetchRawCabins();
    // fetchRawCabins already handles errors gracefully
    return firstPage;
}

// Fetch paginated cabins
export async function fetchCabinsPaginated(page = 1, limit = 100): Promise<CabinsApiResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/cabins?page=${page}&limit=${limit}`, {
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.warn('Failed to fetch cabins page:', err);
        return {
            success: true,
            pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
            source: 'error-fallback',
            data: [],
        };
    }
}

// Fetch cabin details by ID
export async function fetchCabinDetails(cabinId: string): Promise<CabinData | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/cabins/${cabinId}`, {
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) return null;
        const result = await response.json();
        if (result.success && result.data) return result.data as CabinData;
        return null;
    } catch {
        return null;
    }
}

// Check if two boat names match (fuzzy matching)
export function boatNamesMatch(name1: string, name2: string): boolean {
    const n1 = normalizeBoatName(name1);
    const n2 = normalizeBoatName(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // Substring match
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // Check first word match (for names like "AMORE", "BOMBANA")
    const words1 = n1.replace(/[^A-Z0-9 ]/g, '').split(/\s+/);
    const words2 = n2.replace(/[^A-Z0-9 ]/g, '').split(/\s+/);
    if (words1[0] && words2[0] && words1[0] === words2[0] && words1[0].length > 3) return true;
    
    // Handle variations like "ALFATHRAN" vs "AL FATHRAN"
    const compact1 = n1.replace(/\s+/g, '');
    const compact2 = n2.replace(/\s+/g, '');
    if (compact1 === compact2) return true;
    if (compact1.includes(compact2) || compact2.includes(compact1)) return true;
    
    return false;
}

// Check if cabin names match (fuzzy matching)
export function cabinNamesMatch(cabinName: string, availabilityCabinName: string): boolean {
    const cn1 = cabinName.toUpperCase().trim();
    const cn2 = availabilityCabinName.toUpperCase().trim();
    if (cn1 === cn2) return true;
    if (cn2.includes(cn1) || cn1.includes(cn2)) return true;
    // Check significant words
    const words1 = cn1.split(/\s+/).filter(w => w.length >= 4);
    for (const word of words1) {
        if (cn2.includes(word)) return true;
    }
    return false;
}

// Check availability for a specific date string
export async function checkAvailabilityByDate(dateStr: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/availability?date=${dateStr}`, {
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: AvailabilityApiResponse = await response.json();
        if (!data.success) throw new Error('Availability API returned success: false');
        return data;
    } catch (error) {
        console.warn(`Failed to fetch availability for ${dateStr}:`, error);
        return null;
    }
}

// Generate all dates in a range
export function generateAllDatesInRange(dateFrom: string, dateTo?: string): string[] {
    if (!dateTo || dateTo === dateFrom) return [dateFrom];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(toLocalDateStr(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// Helper to format date as YYYY-MM-DD using local time
export function toLocalDateStr(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Aggregate availability data from multiple API responses with date tracking
export function aggregateAvailabilityWithDates(
    responses: AvailabilityApiResponse[]
): Map<string, OperatorAvailabilityWithDates> {
    const operatorMap = new Map<string, OperatorAvailabilityWithDates>();

    responses.forEach(response => {
        if (!response?.data?.operators) return;
        const responseDate = response.data.date;

        response.data.operators.forEach((op: AvailabilityOperator) => {
            const key = op.operator.toUpperCase();

            if (operatorMap.has(key)) {
                const existing = operatorMap.get(key)!;
                existing.total += op.total;
                if (!existing.availableDates.includes(responseDate)) {
                    existing.availableDates.push(responseDate);
                }
                if (op.cabins) {
                    op.cabins.forEach(newCabin => {
                        if (newCabin.available > 0) {
                            const existingCabin = existing.cabins.find(c => c.name === newCabin.name);
                            if (existingCabin) {
                                existingCabin.available += newCabin.available;
                                if (!existingCabin.availableDates.includes(responseDate)) {
                                    existingCabin.availableDates.push(responseDate);
                                }
                            } else {
                                existing.cabins.push({
                                    name: newCabin.name,
                                    available: newCabin.available,
                                    availableDates: [responseDate],
                                });
                            }
                        }
                    });
                }
            } else {
                const cabinsWithDates: CabinAvailabilityWithDates[] = (op.cabins || [])
                    .filter(c => c.available > 0)
                    .map(c => ({
                        name: c.name,
                        available: c.available,
                        availableDates: [responseDate],
                    }));

                operatorMap.set(key, {
                    operator: op.operator,
                    total: op.total,
                    cabins: cabinsWithDates,
                    availableDates: [responseDate],
                });
            }
        });
    });

    // Sort dates
    operatorMap.forEach(op => {
        op.availableDates.sort();
        op.cabins.forEach(c => c.availableDates.sort());
    });

    return operatorMap;
}

// Fetch and aggregate availability for a date range
export async function fetchAndAggregateAvailability(
    dateFrom: string,
    dateTo?: string
): Promise<Map<string, OperatorAvailabilityWithDates>> {
    try {
        const allDates = generateAllDatesInRange(dateFrom, dateTo);
        const batchSize = 10;
        const allResponses: AvailabilityApiResponse[] = [];

        for (let i = 0; i < allDates.length; i += batchSize) {
            const batch = allDates.slice(i, i + batchSize);
            const batchPromises = batch.map(date =>
                checkAvailabilityByDate(date)
            );
            const batchResponses = await Promise.all(batchPromises);
            batchResponses.forEach(r => {
                if (r) allResponses.push(r);
            });
        }

        if (allResponses.length > 0) {
            return aggregateAvailabilityWithDates(allResponses);
        }
    } catch (err) {
        console.warn('Could not fetch availability:', err);
    }
    return new Map<string, OperatorAvailabilityWithDates>();
}

// Format price to IDR
export function formatPrice(price: number): string {
    if (price === 0) return 'Contact for price';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Check if URL is a valid image URL
export function isValidImageUrl(url: string): boolean {
    if (!url) return false;
    if (url.includes('/folders/') || url.includes('/drive/folders')) return false;
    return true;
}

// Get direct image URL from Google Drive link
export function getDirectImageUrl(driveUrl: string): string {
    if (!driveUrl) return '/placeholder-boat.svg';
    if (driveUrl.includes('/folders/')) return '/placeholder-cabin.jpg';
    if (!driveUrl.includes('drive.google.com')) return driveUrl;
    
    const fileIdMatch = driveUrl.match(/(?:\/d\/|[?&]id=)([\w-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=w1600`;
    }
    return convertGoogleDriveUrl(driveUrl);
}

// Fetch a single ship by slug, with its cabins
export async function fetchShipBySlug(slug: string): Promise<{
    ship: ParsedShip;
    cabins: CabinData[];
} | null> {
    try {
        const [ships, allCabins] = await Promise.all([
            fetchShips(),
            fetchAllCabins(),
        ]);
        const ship = ships.find(s => s.slug === slug);
        if (!ship) return null;

        // Find cabins belonging to this ship
        const shipCabins = allCabins.filter(c => boatNamesMatch(c.boat_name, ship.name));

        return { ship, cabins: shipCabins };
    } catch (error) {
        console.error('Error fetching ship by slug:', error);
        return null;
    }
}

// Fetch all ship slugs (for static generation)
export async function fetchAllShipSlugs(): Promise<string[]> {
    try {
        const ships = await fetchShips();
        return ships.map(s => s.slug);
    } catch {
        return [];
    }
}