"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LocaleLink from "./LocaleLink";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n";
import "@/styles/experiences-page.css";

// ─── Data ─────────────────────────────────────────────────────────────────
type Category = "Ocean & Reef" | "The Wild Kingdom" | "Land & Summit" | "People & Tradition" | "Stillness & Shore" | "After Dark";

interface SpotlightExperience {
    id: string;
    title: string;
    subtitle: string;
    location: string;
    category: string;
    categoryEmoji: string;
    filterCategory: Category;
    price: string;
    rating: number;
    reviewCount: number;
    duration: string;
    groupSize: string;
    hook: string;
    description: string;
    highlights: string[];
    included: string[];
    image: string;
    accent: string; // CSS color for accent
}

const SPOTLIGHT_EXPERIENCES: SpotlightExperience[] = [
    {
        id: "snorkeling-coral-garden",
        title: "The Coral Garden Immersion",
        subtitle: "Slip beneath the surface and enter a world that will rewrite your sense of wonder.",
        location: "Togean Islands, Central Sulawesi",
        category: "Ocean & Reef",
        categoryEmoji: "🤿",
        filterCategory: "Ocean & Reef",
        price: "Rp650.000",
        rating: 4.95,
        reviewCount: 184,
        duration: "3 hours",
        groupSize: "Max 10 guests",
        hook: "98% of our guests say this is the moment they replay in their minds for years.",
        description: "There is a quiet that exists only underwater. The moment your face breaks the surface of Togean's impossibly blue water, the world above stops mattering. Below you, centuries-old coral cathedrals pulse with colour — clownfish weave through swaying anemones, sea turtles glide past with ancient composure, and napoleon wrasse the size of your arm hover in the blue like ghosts. These are reef patches that mass tourism has never reached. They exist as they have for millennia. And for a few unhurried hours, you exist within them.",
        highlights: [
            "Thirty metres of crystalline visibility — every detail alive with colour",
            "Secluded reef patches untouched by the outside world",
            "Turtles, reef sharks, and over 500 species sharing the water with you",
            "Never more than ten guests — this moment belongs to you",
        ],
        included: ["Professional mask & fins", "Buoyancy vest", "Boat transfer", "Tropical fruit platter", "Towel service"],
        image: "/public/destinations/kadidiri/experience.webp",
        accent: "#0ea5e9",
    },
    {
        id: "komodo-dragon-trek",
        title: "Walking with Ancient Giants",
        subtitle: "Stand in the presence of a creature that has outlived every civilisation on Earth.",
        location: "Komodo National Park, East Nusa Tenggara",
        category: "The Wild Kingdom",
        categoryEmoji: "🦎",
        filterCategory: "The Wild Kingdom",
        price: "Rp850.000",
        rating: 4.92,
        reviewCount: 217,
        duration: "4 hours",
        groupSize: "Max 8 guests",
        hook: "The only place on Earth where you can share a trail with a three-metre apex predator — on its terms.",
        description: "Some moments check a box. This one rewires something inside you. On Rinca Island's volcanic savannah — where dry golden grasslands meet a sky that seems to stretch beyond the curvature of the earth — you walk within metres of the last great reptilian predator. Komodo dragons have existed for millions of years, long before humans drew their first breath. Up to three metres long, unhurried, and utterly indifferent to your presence, they carry the weight of deep time in every slow, deliberate step. You are not watching a performance. You are standing, heart pounding, inside the oldest living story on the planet.",
        highlights: [
            "A UNESCO World Heritage encounter found nowhere else on Earth",
            "Rangers who have walked these trails for over a decade guide every step",
            "Volcanic savannah landscapes that feel like stepping into prehistory",
            "Unhurried, ethical encounters — no baiting, no disturbance, just awe",
        ],
        included: ["Certified ranger guide", "National Park entry permits", "Walking sticks", "Bottled water", "Safety briefing"],
        image: "/images/destinations/komodo-national-park-landscape.jpg",
        accent: "#84cc16",
    },
    {
        id: "jungle-waterfall-trek",
        title: "The Hidden Cascade",
        subtitle: "The rainforest rewards those who go looking — and what waits at the end of this trail is worth every step.",
        location: "Bomba, Togean Islands",
        category: "Land & Summit",
        categoryEmoji: "🥾",
        filterCategory: "Land & Summit",
        price: "Rp500.000",
        rating: 4.87,
        reviewCount: 112,
        duration: "3 hours",
        groupSize: "Max 8 guests",
        hook: "Fewer than 500 people a year ever reach this waterfall. Today, you are one of them.",
        description: "The primary rainforest of the Togean Islands is one of the most biodiverse on Earth — and almost no one walks through it. Your guide leads you deeper into Malenge's interior on trails known only to locals, through a cathedral of ancient trees alive with the calls of hornbills and the rustle of cuscus moving through the canopy overhead. Time loses its meaning. The air is cool and thick with the scent of damp earth. And then you hear it — distant at first, then unmistakable — the crash of falling water. The forest opens. A hidden cascade tumbles fifteen metres into a natural plunge pool, sunlight breaking through the canopy in shafts of gold. You have found it. The swim is yours alone.",
        highlights: [
            "One of fewer than ten guided trails into Togean's ancient primary forest",
            "Hornbills, cuscus, and rare forest birds reveal themselves along the way",
            "A private plunge pool beneath a waterfall that rarely sees another soul",
            "A naturalist guide who reads the forest like an open book",
        ],
        included: ["Certified trek guide", "Waterfall swim time", "Jungle snack & water", "Insect repellent"],
        image: "/public/destinations/bomba/experience.webp",
        accent: "#22c55e",
    },
    {
        id: "village-cultural-visit",
        title: "A Life Built on Water",
        subtitle: "Step into a civilisation that has existed above the sea for five hundred years — and never needed land.",
        location: "Malenge Island, Togean Islands",
        category: "People & Tradition",
        categoryEmoji: "🏘️",
        filterCategory: "People & Tradition",
        price: "Rp350.000",
        rating: 4.90,
        reviewCount: 178,
        duration: "3 hours",
        groupSize: "Max 12 guests",
        hook: "The Bajo are the last true sea-nomads. This is not a tour — it is an invitation into their home.",
        description: "The Bajo people are extraordinary. For centuries, their entire civilisation has existed above the sea — a labyrinth of wooden boardwalks connecting brightly painted stilt houses, with fishing boats moored where other cultures park bicycles. The moment you step off the boat and onto those boardwalks, the modern world falls away. Children splash in the water below. Grandmothers weave at doorways with hands that have never stopped moving. You are welcomed in — not as a tourist, but as a guest. You cook together, eat together, and listen to stories that have been told the same way for generations, with the ocean rocking gently beneath you. Nothing here is performed. Everything is real.",
        highlights: [
            "Welcomed into a Bajo family's home — not a staged show",
            "Learn weaving and cooking traditions passed down for centuries",
            "Share an evening meal as the ocean moves beneath you",
            "A bilingual guide bridges two worlds with grace and depth",
        ],
        included: ["Local bilingual guide", "Welcome coconut drink", "Traditional meal", "Weaving demonstration"],
        image: "/public/destinations/malengue/experience.webp",
        accent: "#f97316",
    },
    {
        id: "sunset-kayaking",
        title: "The Golden Hour Drift",
        subtitle: "The hour when time stops, the sky catches fire, and the water holds every colour.",
        location: "Kadidiri Island, Togean Islands",
        category: "Stillness & Shore",
        categoryEmoji: "🌅",
        filterCategory: "Stillness & Shore",
        price: "Rp450.000",
        rating: 4.88,
        reviewCount: 143,
        duration: "2.5 hours",
        groupSize: "Max 10 guests",
        hook: "The single most photographed sunset in the Togean Islands — and you are gliding right through the centre of it.",
        description: "The afternoon heat softens. You slip a kayak into mirror-still water at the mouth of Kadidiri's mangrove river, and immediately the world contracts to something small and perfect — the dip of your paddle, the cry of a kingfisher hidden somewhere in the prop roots, the green-gold light filtering through ancient mangrove tunnels arching overhead. Then the bay opens. The sky turns amber, then crimson, then a violet so deep it looks painted. Every colour is reflected perfectly in the water beneath you, so that for a moment you can't tell which world is the real one. This is the golden hour that holiday brochures promise and almost never deliver. Here, it happens every single evening.",
        highlights: [
            "Glide through ancient mangrove tunnels no path on land can reach",
            "Kingfishers, monitor lizards, and fireflies appear as the light fades",
            "The bay opens at the exact moment the sky catches fire",
            "No skill needed — just a willingness to let the evening take over",
        ],
        included: ["Double kayak rental", "Waterproof dry bag", "Cold drinks on return", "Expert guide"],
        image: "/public/destinations/kadidiri/mood.webp",
        accent: "#f59e0b",
    },
    {
        id: "night-diving",
        title: "Blue Fire Beneath the Surface",
        subtitle: "Wave your hand and watch the ocean ignite. This is the night you will never stop telling people about.",
        location: "Una-Una Island, Gulf of Tomini",
        category: "After Dark",
        categoryEmoji: "✨",
        filterCategory: "After Dark",
        price: "Rp1.200.000",
        rating: 4.97,
        reviewCount: 96,
        duration: "2 hours",
        groupSize: "Max 6 guests",
        hook: "Rated 4.97 — the single highest-rated moment on every KOMODOCRUISES voyage.",
        description: "Una-Una's geothermal waters create conditions for bioluminescence that outshines anything else in the Indonesian archipelago. You descend into total darkness — and then you move your hand. Blue sparks explode. Every gesture, every kick, every breath ignites trails of cold blue fire in the water around you. Spanish dancer nudibranchs pulse in neon. Mandarin fish glow against the reef. Octopus materialise from nowhere, then vanish. And when you look up, the stars above the surface mirror the living light below, and for a moment the boundary between sky and sea disappears entirely. This is one of those nights that, once you have lived it, becomes the benchmark for everything that follows.",
        highlights: [
            "Una-Una's geothermal seabed produces Indonesia's most intense bioluminescence",
            "Only six guests at a time — the darkness is yours",
            "Mandarin fish, Spanish dancers, and octopus emerge after sunset",
            "A certified dive master at your side through every luminous moment",
        ],
        included: ["Dive torch", "75-minute guided dive", "Hot tea & night snack on deck", "Full dive equipment"],
        image: "/public/destinations/una-una/experience.webp",
        accent: "#6366f1",
    }
];

interface Experience {
    id: string;
    title: string;
    location: string;
    description: string;
    longDescription: string;
    category: Exclude<Category, "All Experiences">;
    rating: number;
    reviewCount: number;
    duration: string;
    groupSize: string;
    included: string[];
    image: string;
    featured?: boolean;
}

const EXPERIENCES: Experience[] = [
    {
        id: "snorkeling-coral-garden",
        title: "The Coral Garden Immersion",
        location: "Togean Islands, Central Sulawesi",
        description: "Slip beneath the surface into centuries-old coral cathedrals pulsing with colour, turtles, and reef sharks.",
        longDescription: "There is a quiet that exists only underwater. Below the surface of Togean's impossibly blue water, centuries-old coral cathedrals pulse with colour — clownfish weave through swaying anemones, sea turtles glide past with ancient composure. These are reef patches that mass tourism has never reached, and for a few unhurried hours, you exist within them.",
        category: "Ocean & Reef",
        rating: 4.95,
        reviewCount: 184,
        duration: "3 hours",
        groupSize: "Max 10",
        included: ["Mask & fins", "Buoyancy vest", "Boat transfer", "Tropical fruit platter"],
        image: "/public/programs/program-snorkeling-diving.webp",
        featured: true,
    },
    {
        id: "komodo-dragon-trek",
        title: "Walking with Ancient Giants",
        location: "Komodo National Park, East Nusa Tenggara",
        description: "Stand within metres of a three-metre apex predator that has outlived every civilisation on Earth.",
        longDescription: "On Rinca Island's volcanic savannah, you walk within metres of the last great reptilian predator. Komodo dragons have existed for millions of years. Unhurried and utterly indifferent to your presence, they carry the weight of deep time in every deliberate step. You are standing inside the oldest living story on the planet.",
        category: "The Wild Kingdom",
        rating: 4.92,
        reviewCount: 217,
        duration: "4 hours",
        groupSize: "Max 8",
        included: ["Ranger guide", "Entrance permits", "Walking stick", "Water"],
        image: "/public/programs/program-wildlife-spotting.webp",
        featured: true,
    },
    {
        id: "night-diving",
        title: "Blue Fire Beneath the Surface",
        location: "Una-Una Island, Gulf of Tomini",
        description: "Wave your hand in the darkness and watch the ocean ignite with trails of cold blue fire.",
        longDescription: "Una-Una's geothermal waters create conditions for bioluminescence that outshines anything else in Indonesia. Every gesture ignites blue sparks. Mandarin fish glow against the reef. Octopus materialise and vanish. The boundary between sky and sea disappears entirely.",
        category: "Ocean & Reef",
        rating: 4.97,
        reviewCount: 96,
        duration: "2 hours",
        groupSize: "Max 6",
        included: ["Dive torch", "75-min guided dive", "Hot tea on deck", "Night snack"],
        image: "/public/public/wildlife/sea/seahorse/hero.webp",
    },
    {
        id: "island-hopping",
        title: "The Four-Island Odyssey",
        location: "Togean Archipelago, Central Sulawesi",
        description: "Jellyfish lake, hidden lagoon, deserted sandbar, and a coral wall at sunset — one day of unforgettable moments.",
        longDescription: "You begin in a landlocked lake where thousands of golden jellyfish drift around you without a single sting. Then a kayak into a hidden lagoon. Lunch on a deserted sandbar where the only footprints are yours. And as the day softens, a descent over a coral wall painted gold by the setting sun.",
        category: "Ocean & Reef",
        rating: 4.93,
        reviewCount: 312,
        duration: "8 hours",
        groupSize: "Max 12",
        included: ["Speedboat", "Snorkel gear", "Lunch & snacks", "Kayak rental", "Guide"],
        image: "/public/public/wildlife/sea/stingless-jellyfish/hero.webp",
        featured: true,
    },
    {
        id: "sunset-kayaking",
        title: "The Golden Hour Drift",
        location: "Kadidiri Island, Togean Islands",
        description: "The hour when time stops, the sky catches fire, and the water holds every colour.",
        longDescription: "The afternoon heat softens. You slip a kayak into mirror-still water and the world contracts to the dip of your paddle and the cry of a kingfisher. Then the bay opens. The sky turns amber, then crimson, then a violet so deep it looks painted — reflected perfectly in the water beneath you.",
        category: "Stillness & Shore",
        rating: 4.88,
        reviewCount: 143,
        duration: "2.5 hours",
        groupSize: "Max 10",
        included: ["Double kayak", "Waterproof bag", "Cold drink", "Guide"],
        image: "/public/programs/program-beach-exploration-hidden-coves.webp",
    },
    {
        id: "village-cultural-visit",
        title: "A Life Built on Water",
        location: "Bomba Village, Togean Islands",
        description: "Step into a civilisation that has existed above the sea for five hundred years — and never needed land.",
        longDescription: "The Bajo people have lived entirely on water for centuries — their village a web of wooden boardwalks connecting brightly painted stilt houses above the sea. You are welcomed in — not as a tourist, but as a guest. You cook together, eat together, and the ocean rocks gently beneath you.",
        category: "People & Tradition",
        rating: 4.90,
        reviewCount: 178,
        duration: "3 hours",
        groupSize: "Max 12",
        included: ["Local guide", "Welcome drink", "Traditional meal", "Weaving demo"],
        image: "/public/programs/program-local-community-immersion.webp",
    },
    {
        id: "hiking-viewpoints",
        title: "The Ridge at Dawn",
        location: "Padar Island, Komodo National Park",
        description: "Climb to a viewpoint so beautiful that no photograph will ever do it justice.",
        longDescription: "Three bays curving below a jagged ridge, each with differently coloured sand, lit by the first light of day. The forty-five-minute climb is quiet and steady. Then the summit opens — pink sand, black sand, white sand stretching out below you. Your camera will try. It will fail.",
        category: "Land & Summit",
        rating: 4.94,
        reviewCount: 261,
        duration: "2.5 hours",
        groupSize: "Max 10",
        included: ["Ranger permit", "Sunrise briefing", "Packed breakfast", "Water"],
        image: "/public/programs/program-hiking-viewpoints.webp",
        featured: true,
    },
    {
        id: "traditional-fishing",
        title: "The Fisherman's Dawn",
        location: "Walea Kodi, Central Sulawesi",
        description: "Before the world wakes, you join a family on the water — and catch your breakfast with your own hands.",
        longDescription: "Before dawn, you join a local fisherman and his family — casting traditional hand-lines into the pre-dawn dark, feeling the pull of the current, and sharing silence as the horizon slowly brightens. Back on the beach, what you catch becomes breakfast, grilled over coconut husks. This is not tourism. It is someone's real life.",
        category: "People & Tradition",
        rating: 4.85,
        reviewCount: 89,
        duration: "4 hours",
        groupSize: "Max 8",
        included: ["Fishing equipment", "Local fishermen host", "Beach breakfast", "Translation guide"],
        image: "/public/public/programs_real/activity-community.png",
    },
    {
        id: "jungle-waterfall",
        title: "The Hidden Cascade",
        location: "Bomba, Togean Islands",
        description: "The rainforest rewards those who go looking — and what waits at the end of this trail is worth every step.",
        longDescription: "Dense primary forest closes in on all sides as your guide leads you deeper into Malenge's interior. The trail winds through ancient canopy alive with hornbills calling overhead and cuscus peering down. Then the crash of falling water — a hidden cascade tumbling into a clear natural pool, sunlight breaking through in shafts of gold.",
        category: "Land & Summit",
        rating: 4.87,
        reviewCount: 112,
        duration: "3 hours",
        groupSize: "Max 8",
        included: ["Local trek guide", "Waterfall swim time", "Jungle snack", "Insect repellent"],
        image: "/public/programs/program-beach-exploration-hidden-coves.webp",
    },
    {
        id: "stargazing",
        title: "The Equatorial Sky",
        location: "Open Sea, Gulf of Tomini",
        description: "Lie back on the upper deck, far from any city light, as the Milky Way arches in full across the equatorial sky.",
        longDescription: "Beyond the reach of any artificial light, anchored in the Gulf of Tomini's mirror-still water, the stars reveal themselves in numbers that feel impossible. The upper deck becomes a floating observatory. There is nothing to do except look up and feel the immensity of the cosmos pressing gently down.",
        category: "After Dark",
        rating: 4.96,
        reviewCount: 204,
        duration: "2 hours",
        groupSize: "All guests",
        included: ["Telescope access", "Constellation guide", "Indonesian coffee & snacks", "Blankets"],
        image: "/public/programs/program-stargazing.webp",
        featured: true,
    },
    {
        id: "sunbathing-beach",
        title: "An Island All to Yourself",
        location: "Pulau Puah, Togean Islands",
        description: "A crescent of white sand with no one else on it. No agenda. No noise. Just warmth.",
        longDescription: "Some moments need no itinerary. Pulau Puah is a tiny uninhabited island visited only by our liveaboard. You step ashore into golden silence — a perfect arc of white sand backed by coconut palms, lapped by water so clear it barely seems real. Nothing to do but let the warmth take over.",
        category: "Stillness & Shore",
        rating: 4.89,
        reviewCount: 156,
        duration: "Free time",
        groupSize: "All guests",
        included: ["Private beach access", "Hammock", "Cold-pressed coconut water", "Snorkel gear"],
        image: "/public/public/programs_real/sunbathing.webp",
    },
    {
        id: "wildlife-spotting",
        title: "Where the Wild Things Reveal Themselves",
        location: "Komodo & Togean Islands",
        description: "From turtles surfacing at dusk to hornbills calling at dawn — guided by people who can read the archipelago's language.",
        longDescription: "The archipelago is teeming with life — but you need to know where to look, and how to look without disturbing a thing. Our onboard naturalists have spent years tracking migrations, nesting habits, and feeding patterns. This is the natural world unscripted — unfolding on its own terms, right in front of you.",
        category: "The Wild Kingdom",
        rating: 4.91,
        reviewCount: 198,
        duration: "Half day",
        groupSize: "Max 10",
        included: ["Naturalist guide", "Binoculars", "Wildlife logbook", "Water & fruit"],
        image: "/public/public/programs_real/wildlifespotting.webp",
    },
];

const CATEGORIES: Category[] = ["Ocean & Reef", "The Wild Kingdom", "Land & Summit", "People & Tradition", "Stillness & Shore", "After Dark"];

const CATEGORY_ICONS: Record<Category, string> = {
    "Ocean & Reef": "🤿",
    "The Wild Kingdom": "🦎",
    "Land & Summit": "🥾",
    "People & Tradition": "🏘️",
    "Stillness & Shore": "🏖️",
    "After Dark": "✨",
};

const STATS = [
    { value: "12+", label: "Signature Moments" },
    { value: "9", label: "Extraordinary Settings" },
    { value: "4.92", label: "Guest Happiness Score" },
    { value: "98%", label: "Say Life-Changing" },
];

const TESTIMONIALS = [
    {
        text: "Standing metres away from a wild Komodo dragon, guided by a ranger who has done this for twenty years — that is the moment I think about every time someone asks me about the trip.",
        name: "Sarah M.",
        origin: "Amsterdam, Netherlands",
        exp: "Walking with Ancient Giants",
    },
    {
        text: "I have done bioluminescence dives in the Philippines, the Maldives, and Mexico. Una-Una is categorically different. The intensity of the light in those geothermal waters is something I will never forget.",
        name: "James T.",
        origin: "Sydney, Australia",
        exp: "Blue Fire Beneath the Surface",
    },
    {
        text: "The Bajo village was the highlight of the whole trip — not just the cruise, but my entire year. They welcomed us into their home. You do not find moments like that on a regular holiday.",
        name: "Claudia R.",
        origin: "Milan, Italy",
        exp: "A Life Built on Water",
    },
];

const WHY_ITEMS = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                <path strokeLinecap="round" d="M19 8a7 7 0 01-7 7 7 7 0 01-7-7" />
            </svg>
        ),
        title: "Guides Who Know Every Secret",
        desc: "Every moment is led by certified local naturalists and guides who have spent their lives reading these waters, forests, and night skies.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
        ),
        title: "Intimate, Never Crowded",
        desc: "We cap every moment at a maximum of 12 guests, ensuring personal connection, unhurried pacing, and minimal environmental impact.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        title: "All Part of Your Journey",
        desc: "Most experiences are woven into your cruise itinerary — no surprise fees, no hidden extras, just your story unfolding.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
        ),
        title: "Wild Places, Kept Wild",
        desc: "We follow strict marine and wildlife protection protocols on every journey — ensuring these places remain untouched for generations.",
    },
];

interface Props { }

const PLACEHOLDER_PRICE = 43243243;

function formatPriceIDR(price: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export default function ExperiencesPage({ }: Props) {
    const pathname = usePathname();
    const locale = getLocaleFromPathname(pathname);
    const [activeCategory, setActiveCategory] = useState<Category>("Ocean & Reef");
    const gridRef = useRef<HTMLDivElement>(null);
    const [lowestCruisePrice, setLowestCruisePrice] = useState<number | null>(null);
    const [priceLoading, setPriceLoading] = useState(true);

    // Fetch lowest valid cabin price from API
    useEffect(() => {
        async function fetchLowestPrice() {
            try {
                const res = await fetch('/proxy-api/cabins');
                if (!res.ok) throw new Error('API error');
                const data = await res.json();
                if (!data.success || !Array.isArray(data.data)) throw new Error('Bad response');
                const validPrices: number[] = data.data
                    .map((c: { price: number }) => c.price)
                    .filter((p: number) => p > 0 && p !== PLACEHOLDER_PRICE);
                if (validPrices.length > 0) {
                    setLowestCruisePrice(Math.min(...validPrices));
                }
            } catch {
                // silently fail — UI will show fallback
            } finally {
                setPriceLoading(false);
            }
        }
        fetchLowestPrice();
    }, []);

    const priceDisplay = priceLoading
        ? '...​'
        : lowestCruisePrice
            ? formatPriceIDR(lowestCruisePrice)
            : 'Contact us';

    // Scroll to spotlight card if URL has a hash (e.g. /experiences#snorkeling-coral-garden)
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (!hash) return;
        // slight delay so the page finishes rendering first
        const timer = setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
                const offset = 96; // account for sticky navbar
                const top = el.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: "smooth" });
            }
        }, 350);
        return () => clearTimeout(timer);
    }, []);

    // Always render all spotlight experiences
    const filteredSpotlight = SPOTLIGHT_EXPERIENCES;

    function handleCategoryChange(cat: Category) {
        setActiveCategory(cat);

        // Find the first card that matches this category and scroll to it
        setTimeout(() => {
            const selector = `[data-category="${cat}"]`;
            const firstMatch = document.querySelector(selector) as HTMLElement;

            if (firstMatch) {
                const offset = 140; // Account for main navbar + sticky filter bar height
                const top = firstMatch.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: "smooth" });
            } else if (gridRef.current) {
                // Fallback to top of section if category has no cards
                const offset = 140;
                const top = gridRef.current.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: "smooth" });
            }
        }, 50);
    }

    // Scroll spy for categories
    useEffect(() => {
        const cards = document.querySelectorAll('.exp-spot-card');
        if (cards.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            let activeId: string | null = null;
            let minTop = Infinity;

            // Find the visible card closest to the top offset
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const rect = entry.boundingClientRect;
                    // Our sticky nav takes ~140px. We want to check which element's top is closest to that.
                    const distanceFromHeader = Math.abs(rect.top - 140);
                    if (distanceFromHeader < minTop) {
                        minTop = distanceFromHeader;
                        activeId = (entry.target as HTMLElement).dataset.category || null;
                    }
                }
            });

            if (activeId) {
                setActiveCategory(activeId as Category);
            }
        }, {
            // Trigger deeply enough to count as visible
            rootMargin: "-140px 0px -40% 0px",
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
        });

        cards.forEach(card => observer.observe(card));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="exp-page">

            {/* ══ HERO ═════════════════════════════════════════════════════ */}
            <div className="exp-hero">
                <video
                    className="exp-hero__video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                >
                    <source src="/vidfootage.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="exp-hero-overlay" />
                <div className="exp-hero-content">
                    <nav className="exp-breadcrumb">
                        <LocaleLink href={localizePath("/", locale)} className="exp-bc-link">Home</LocaleLink>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="exp-bc-sep"><polyline points="9 18 15 12 9 6" /></svg>
                        <span className="exp-bc-curr">Experiences</span>
                    </nav>

                    <div className="exp-hero-text">
                        <div className="exp-hero-eyebrow">Beyond the Ordinary</div>
                        <h1 className="exp-hero-title">
                            Moments That Stay With You Forever
                        </h1>
                        <p className="exp-hero-sub">
                            Every cruise is woven with moments that change how you see the world &mdash; from sleeping beneath the Milky Way to swimming through a lake of golden jellyfish, standing beside ancient predators, and sharing a meal with sea-nomad families above the turquoise sea.
                        </p>
                        <div className="exp-hero-actions">
                            <a href="#experiences" className="exp-hero-btn exp-hero-btn--primary">
                                Discover What Awaits ↓
                            </a>
                            <LocaleLink href={localizePath("/cruises", locale)} className="exp-hero-btn exp-hero-btn--ghost">
                                Browse Cruises
                            </LocaleLink>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
            <div className="exp-stats">
                {STATS.map(s => (
                    <div key={s.label} className="exp-stat">
                        <span className="exp-stat-value">{s.value}</span>
                        <span className="exp-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ══ CATEGORY FILTER ══════════════════════════════════════════ */}
            <div className="exp-filter-bar">
                <div className="exp-filter-inner">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`exp-filter-pill${activeCategory === cat ? " exp-filter-pill--active" : ""}`}
                            onClick={() => handleCategoryChange(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ EXPERIENCE SPOTLIGHT — deep dive sales cards ═════════════ */}
            <div id="experiences" className="exp-spotlight-section" ref={gridRef}>
                <div className="exp-container">
                    <div className="exp-spotlight-header">
                        <div className="exp-spotlight-eyebrow">Every Moment, In Detail</div>
                        <h2 className="exp-spotlight-title">What's Waiting for You Out There</h2>
                        <p className="exp-spotlight-sub">
                            Every cruise includes access to these experiences. Here is exactly what each one looks like — and why guests carry them home long after the voyage ends.
                        </p>
                    </div>

                    <div className="exp-spotlight-list">
                        {filteredSpotlight.length === 0 && (
                            <p style={{ textAlign: "center", color: "#94a3b8", paddingTop: "2rem", paddingBottom: "2rem" }}>
                                No detailed spotlights for this category yet.
                            </p>
                        )}
                        {filteredSpotlight.map((exp, i) => (
                            <div
                                key={exp.id}
                                id={exp.id}
                                data-category={exp.filterCategory}
                                className={`exp-spot-card${i % 2 === 1 ? " exp-spot-card--rev" : ""}`}
                            >
                                {/* Image side */}
                                <div className="exp-spot-img-side">
                                    <div className="exp-spot-img-wrap">
                                        <Image
                                            src={exp.image}
                                            alt={exp.title}
                                            fill
                                            className="exp-spot-img"
                                            sizes="(max-width: 768px) 100vw, 50vw"
                                        />
                                        <div className="exp-spot-img-overlay" />
                                        <div className="exp-spot-badges">
                                            <span className="exp-spot-cat-badge">
                                                {exp.category}
                                            </span>
                                            <span className="exp-spot-price-badge">
                                                Your journey from {priceDisplay} <span>/person</span>
                                            </span>
                                        </div>
                                        <div className="exp-spot-rating-pill">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            <strong>{exp.rating.toFixed(2)}</strong>
                                            <span>({exp.reviewCount} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content side */}
                                <div className="exp-spot-content">
                                    <div className="exp-spot-meta-row">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {exp.location}
                                    </div>
                                    <h3 className="exp-spot-title">{exp.title}</h3>
                                    <p className="exp-spot-subtitle">{exp.subtitle}</p>

                                    <div className="exp-spot-hook">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {exp.hook}
                                    </div>

                                    <p className="exp-spot-desc">{exp.description}</p>

                                    <div className="exp-spot-highlights">
                                        <p className="exp-spot-highlights-label">Why guests love this</p>
                                        <ul className="exp-spot-highlight-list">
                                            {exp.highlights.map(h => (
                                                <li key={h} className="exp-spot-highlight-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                    {h}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="exp-spot-info-row">
                                        <div className="exp-spot-info-chip">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {exp.duration}
                                        </div>
                                        <div className="exp-spot-info-chip">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                                            {exp.groupSize}
                                        </div>
                                        <div className="exp-spot-included-preview">
                                            ✓ Incl: {exp.included.slice(0, 2).join(" · ")} &amp; more
                                        </div>
                                    </div>

                                    <div className="exp-spot-cta-row">
                                        <LocaleLink
                                            href={localizePath("/cruises", locale)}
                                            className="exp-spot-cta-btn"
                                        >
                                            Begin This Story
                                        </LocaleLink>
                                        <div className="exp-spot-price-label">
                                            Your journey from <strong>{priceDisplay}</strong> /person
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Testimonials strip */}
                    <div className="exp-testimonials">
                        <p className="exp-test-label">What our guests say</p>
                        <div className="exp-test-grid">
                            {TESTIMONIALS.map(t => (
                                <div key={t.name} className="exp-test-card">
                                    <div className="exp-test-stars">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                        ))}
                                    </div>
                                    <p className="exp-test-text">&ldquo;{t.text}&rdquo;</p>
                                    <div className="exp-test-author">
                                        <strong>{t.name}</strong>
                                        <span>{t.origin}</span>
                                        <span className="exp-test-exp">{t.exp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}
