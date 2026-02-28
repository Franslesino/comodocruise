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
type Category = "All" | "Diving & Snorkelling" | "Wildlife" | "Trekking" | "Cultural" | "Beach & Relaxation" | "Night Experience";

interface SpotlightExperience {
    id: string;
    title: string;
    subtitle: string;
    location: string;
    category: string;
    categoryEmoji: string;
    filterCategory: Exclude<Category, "All">;
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
        title: "Snorkeling at Pristine Coral Gardens",
        subtitle: "The underwater world that will haunt your dreams — in the best way.",
        location: "Togean Islands, Central Sulawesi",
        category: "Water Activity",
        categoryEmoji: "🤿",
        filterCategory: "Diving & Snorkelling",
        price: "Rp650.000",
        rating: 4.95,
        reviewCount: 184,
        duration: "3 hours",
        groupSize: "Max 10 guests",
        hook: "98% of our guests say this is the experience they tell everyone about.",
        description: "Beneath the surface of Togean's impossibly blue water lies an ecosystem that most people never get to witness. Schools of clownfish dart through waving anemones while sea turtles drift past without a care. Our expert guides bring you to secluded reef patches untouched by mass tourism — alive with napoleon wrasse, bumphead parrotfish, and coral formations that have been growing for centuries. No experience needed. Just a sense of wonder.",
        highlights: [
            "Crystal-clear visibility up to 30 metres",
            "Exclusive access to protected reef zones",
            "Sea turtles, reef sharks & over 500 fish species",
            "Zero crowds — capped at 10 guests per session",
        ],
        included: ["Professional mask & fins", "Buoyancy vest", "Boat transfer", "Tropical fruit platter", "Towel service"],
        image: "/public/destinations/kadidiri/experience.webp",
        accent: "#0ea5e9",
    },
    {
        id: "komodo-dragon-trek",
        title: "Komodo Dragon Trekking",
        subtitle: "Walk beside the world's largest living lizard — in its own kingdom.",
        location: "Komodo National Park, East Nusa Tenggara",
        category: "Wildlife",
        categoryEmoji: "🦎",
        filterCategory: "Wildlife",
        price: "Rp850.000",
        rating: 4.92,
        reviewCount: 217,
        duration: "4 hours",
        groupSize: "Max 8 guests",
        hook: "This is the world's only place you can see Komodo dragons roaming wild and free.",
        description: "There are experiences that check a box, and then there are experiences that fundamentally alter your sense of what the natural world is capable of. Komodo Dragon Trekking is the latter. On Rinca Island's volcanic savannah trails, guided by UNESCO-certified rangers, you'll come within metres of apex predators that have hunted these islands for millions of years. Up to 3 metres long, with venom-laced bites and a prehistoric stare — they are unlike anything you have ever seen. This is not a zoo. This is their world, and you're a guest in it.",
        highlights: [
            "UNESCO World Heritage site — one of the rarest wildlife encounters on Earth",
            "Ranger-certified guides with 10+ years of experience",
            "Volcanic savannah landscapes straight out of a Jurassic documentary",
            "Guaranteed sightings — no animal is ever disturbed or baited",
        ],
        included: ["Certified ranger guide", "National Park entry permits", "Walking sticks", "Bottled water", "Safety briefing"],
        image: "/images/destinations/komodo-national-park-landscape.jpg",
        accent: "#84cc16",
    },
    {
        id: "sunset-kayaking",
        title: "Sunset Kayaking & Mangrove Tour",
        subtitle: "An hour that makes you forget you own a phone.",
        location: "Kadidiri Island, Togean Islands",
        category: "Water Activity",
        categoryEmoji: "🌅",
        filterCategory: "Beach & Relaxation",
        price: "Rp450.000",
        rating: 4.88,
        reviewCount: 143,
        duration: "2.5 hours",
        groupSize: "Max 10 guests",
        hook: "The single most photographed sunset in the Togean Islands — and you're paddling right through it.",
        description: "As the afternoon heat softens, you slip a kayak into the mirror-still water at the mouth of Kadidiri's mangrove river. The world narrows to the sound of your paddle and the cry of kingfishers hidden in the prop roots. Ancient mangrove tunnels arch overhead — the light filtering green and gold. Then, the bay opens. The sky turns amber, then crimson, then violet, reflected perfectly in the water below you. This is the kind of golden hour that holiday brochures promise and rarely deliver. Here, it happens every single evening.",
        highlights: [
            "Guided through ancient mangrove tunnels inaccessible on foot",
            "Kingfishers, monitor lizards & fireflies encountered en route",
            "Arrive at the open bay exactly at golden hour",
            "Suitable for complete beginners — no kayaking experience needed",
        ],
        included: ["Double kayak rental", "Waterproof dry bag", "Cold drinks on return", "Expert guide"],
        image: "/public/destinations/kadidiri/mood.webp",
        accent: "#f59e0b",
    },
    {
        id: "village-cultural-visit",
        title: "Traditional Village Cultural Visit",
        subtitle: "Meet a community that has lived entirely on the water for 500 years.",
        location: "Malenge Island, Togean Islands",
        category: "Cultural",
        categoryEmoji: "🏘️",
        filterCategory: "Cultural",
        price: "Rp350.000",
        rating: 4.90,
        reviewCount: 178,
        duration: "3 hours",
        groupSize: "Max 12 guests",
        hook: "The Bajo are the last true sea-nomads. This is your invitation into their world.",
        description: "The Bajo people are extraordinary. For centuries, their entire civilisation has existed above the sea — a labyrinth of wooden boardwalks connecting brightly painted stilt houses, with fishing boats moored where other cultures park bicycles. When you step off the boat and onto those boardwalks, you are stepping into a way of life that the modern world has barely touched. Children splash in the water below. Grandmothers weave at doorways. You're welcomed in for traditional cooking demonstrations, storytelling, and an evening meal as the ocean rocks gently beneath you.  This is genuine cultural immersion — no performance, no script.",
        highlights: [
            "Authentic homestay-style welcome from a Bajo family",
            "Hands-on traditional weaving & cooking demonstration",
            "Shared evening meal with local ingredients",
            "Cultural insights from a bilingual local guide",
        ],
        included: ["Local bilingual guide", "Welcome coconut drink", "Traditional meal", "Weaving demonstration"],
        image: "/public/destinations/malengue/experience.webp",
        accent: "#f97316",
    },
    {
        id: "night-diving",
        title: "Night Diving with Bioluminescence",
        subtitle: "The sea turns blue fire. You will not believe what your hands can do.",
        location: "Una-Una Island, Gulf of Tomini",
        category: "Water Activity",
        categoryEmoji: "✨",
        filterCategory: "Night Experience",
        price: "Rp1.200.000",
        rating: 4.97,
        reviewCount: 96,
        duration: "2 hours",
        groupSize: "Max 6 guests",
        hook: "Rated 4.97 stars — the highest-rated experience on every KOMODOCRUISES voyage.",
        description: "Una-Una's geothermal waters create conditions perfect for bioluminescence that outshines anything you'll find elsewhere in the Indonesian archipelago. You descend into total darkness — then wave your hand. Blue sparks explode. Every movement you make ignites trails of cold blue fire in the water around you. Spanish dancer nudibranch pulse in neon colours. Mandarin fish glow in the reef. Octopus materialise from nowhere. And when you look up, the stars above the surface mirror the living light below. This is one of those experiences that, once you've lived it, becomes the benchmark for everything else.",
        highlights: [
            "Una-Una's geothermal seabed produces Indonesia's most intense bioluminescence",
            "Tiny 6-guest maximum for an intimate, crowd-free experience",
            "Mandarin fish, Spanish dancers & octopus emerge after dark",
            "Certified dive master accompanies every single guest",
        ],
        included: ["Dive torch", "75-minute guided dive", "Hot tea & night snack on deck", "Full dive equipment"],
        image: "/public/destinations/una-una/experience.webp",
        accent: "#6366f1",
    },
    {
        id: "island-hopping",
        title: "Full-Day Island Hopping Adventure",
        subtitle: "Four world-class experiences. One unforgettable day.",
        location: "Togean Archipelago, Central Sulawesi",
        category: "Adventure",
        categoryEmoji: "🏝️",
        filterCategory: "Diving & Snorkelling",
        price: "Rp750.000",
        rating: 4.93,
        reviewCount: 312,
        duration: "8 hours",
        groupSize: "Max 12 guests",
        hook: "Our most booked experience, returning year after year, and the one guests most wish they'd booked twice.",
        description: "The Togean Archipelago is one of those places where it is genuinely impossible to choose a favourite spot — so we built a day that includes all of them. You start in the stingless jellyfish lake, where thousands of golden jellyfish drift around you without a single sting. Then a kayak into a hidden lagoon accessible only by water. Lunch on a deserted sandbar with the only footprints in the sand being yours. Finally, a late-afternoon snorkel over a coral wall dropping to 40 metres, vivid with life, as the sun turns the water gold. Eight hours. Four memories you'll be recounting for the rest of your life.",
        highlights: [
            "Swim with thousands of harmless stingless jellyfish — nowhere else on Earth",
            "Hidden lagoon only accessible by kayak or dingy",
            "Private picnic lunch on a deserted white-sand bar",
            "Sunset coral wall snorkel at day's end",
        ],
        included: ["Private speedboat", "Full snorkel equipment", "Kayak rental", "Gourmet lunch & fruit snacks", "Expert naturalist guide"],
        image: "/public/wildlife/sea/stingless-jellyfish/hero.webp",
        accent: "#14b8a6",
    },
    {
        id: "fishing-local",
        title: "Traditional Fishing with Locals",
        subtitle: "The most honest meal you will ever eat — you caught it yourself.",
        location: "Walea Kodi, Central Sulawesi",
        category: "Cultural",
        categoryEmoji: "🎣",
        filterCategory: "Cultural",
        price: "Rp400.000",
        rating: 4.85,
        reviewCount: 89,
        duration: "4 hours",
        groupSize: "Max 8 guests",
        hook: "The most intimate, off-script experience on any KOMODOCRUISES itinerary.",
        description: "This one begins before sunrise. You join a local fisherman and his family at the water before the world wakes up — casting traditional hand-lines into the pre-dawn dark while the stars are still out. There's barely a word exchanged; you don't need one. The pull of the line communicates everything. As the horizon brightens and the village slowly stirs, you haul in your catch — and then you cook it. Together. Over a fire of coconut husks on a beach that most tourists will never set foot on. What you catch becomes breakfast: grilled fish, sambal, rice — the simplest and most satisfying meal you will have eaten in years.",
        highlights: [
            "Pre-dawn departure for the authentic fishing experience",
            "Learn centuries-old hand-line techniques from a local master",
            "Cook your own catch over open fire on a private beach",
            "Genuine local connection — this is someone's real daily life",
        ],
        included: ["Traditional fishing equipment", "Local fisherman host", "Beachside breakfast", "Bilingual guide"],
        image: "/public/destinations/walea-kodi/experience.webp",
        accent: "#f59e0b",
    },
    {
        id: "jungle-waterfall-trek",
        title: "Jungle Trek to Hidden Waterfall",
        subtitle: "The Togean rainforest rewards those who go looking.",
        location: "Bomba, Togean Islands",
        category: "Adventure",
        categoryEmoji: "🥾",
        filterCategory: "Trekking",
        price: "Rp500.000",
        rating: 4.87,
        reviewCount: 112,
        duration: "3 hours",
        groupSize: "Max 8 guests",
        hook: "This waterfall is visited by fewer than 500 people a year. You are one of the rare ones.",
        description: "The primary rainforest of the Togean Islands is one of the most biodiverse in the world — and almost no one walks through it. Your guide leads you deeper into Malenge's interior on trails only locals know, through a cathedral of ancient trees alive with the calls of hornbills and the rustle of cuscus moving through the canopy overhead. Time slows down. The air is cool and alive. And then you hear it — the distant crash of water. The forest opens. A hidden cascade tumbles 15 metres into a natural plunge pool. You have found it. The swim is yours.",
        highlights: [
            "One of fewer than 10 guided trails into Togean's primary forest",
            "Hornbills, cuscus & rare forest birds spotted en route",
            "Private plunge pool at the waterfall — usually empty",
            "Expert naturalist guide explains the ecosystem as you walk",
        ],
        included: ["Certified trek guide", "Waterfall swim time", "Jungle snack & water", "Insect repellent"],
        image: "/public/destinations/bomba/experience.webp",
        accent: "#22c55e",
    },
    {
        id: "hiking-viewpoints",
        title: "Summit Hike & Panoramic Viewpoint",
        subtitle: "Conquer the ridge of Padar Island for a view that defines Indonesia.",
        location: "Padar Island, Komodo National Park",
        category: "Adventure",
        categoryEmoji: "⛰️",
        filterCategory: "Trekking",
        price: "Rp450.000",
        rating: 4.94,
        reviewCount: 261,
        duration: "2.5 hours",
        groupSize: "Max 10 guests",
        hook: "Witness a 360° panorama of three differently coloured sand bays.",
        description: "Padar Island's silhouette is one of Indonesia's most iconic images — three bays curving below a jagged ridge at dawn. The 45-minute hike to the summit is rewarded with a view that makes every step worthwhile. As the sun rises over the horizon, pink, black, and white sand beaches stretch out below you in perfect symmetry. This is the spot where phone cameras simply cannot capture the scale of what your eyes are seeing.",
        highlights: [
            "Iconic sunrise viewpoint overlooking three bays",
            "Pink, black, and white sand beaches visible from one spot",
            "Guided pre-dawn trek to beat the midday heat",
            "Unbeatable photography opportunities",
        ],
        included: ["Ranger permit", "Sunrise briefing", "Packed breakfast", "Bottled water"],
        image: "/public/programs/program-hiking-viewpoints.webp",
        accent: "#ef4444",
    },
    {
        id: "stargazing",
        title: "Open-Ocean Stargazing Night",
        subtitle: "Lie back far from any city light as the Milky Way arches across the sky.",
        location: "Open Sea, Gulf of Tomini",
        category: "Night Experience",
        categoryEmoji: "🌌",
        filterCategory: "Night Experience",
        price: "Included",
        rating: 4.96,
        reviewCount: 204,
        duration: "2 hours",
        groupSize: "All guests",
        hook: "Experience the equatorial night sky with absolute zero light pollution.",
        description: "Beyond the reach of any light pollution, anchored in the Gulf of Tomini's mirror-glassy water, the stars reveal themselves in numbers that feel impossible. As the ship's lights are dimmed, the upper deck transforms into a floating observatory. Our guides share southern-hemisphere constellations and navigation lore, while Indonesian coffee and passing snacks complete a deeply peaceful night you will never forget.",
        highlights: [
            "Zero light pollution for crystal-clear Milky Way viewing",
            "Unobstructed 360-degree views from the top deck",
            "Southern-hemisphere constellation guidance",
            "A peaceful, community atmosphere under the stars",
        ],
        included: ["Telescope access", "Constellation guide", "Indonesian coffee & snacks", "Deck blankets"],
        image: "/public/programs/program-stargazing.webp",
        accent: "#4f46e5",
    },
    {
        id: "sunbathing-beach",
        title: "Sunbathing on a Deserted Island",
        subtitle: "A crescent of white sand with zero other visitors.",
        location: "Pulau Puah, Togean Islands",
        category: "Relaxation",
        categoryEmoji: "🌴",
        filterCategory: "Beach & Relaxation",
        price: "Included",
        rating: 4.89,
        reviewCount: 156,
        duration: "Half day",
        groupSize: "All guests",
        hook: "Just you, the coconut palms, and the open sea.",
        description: "Some experiences need no agenda. Pulau Puah is a tiny uninhabited island visited almost exclusively by our liveaboards. You step ashore into golden silence — a perfect arc of white sand backed by leaning coconut palms. There are no beach clubs, no vendors, and no other footprints. Nothing to do but string up a hammock, sink a cold coconut, and let the gentle lap of the waves dictate the pace of your afternoon.",
        highlights: [
            "Exclusive access to an uninhabited tropical island",
            "Pristine white sand beaches all to yourself",
            "Crystal clear shallows perfect for a lazy dip",
            "Hammocks set up beneath the shade of palm trees",
        ],
        included: ["Private beach access", "Hammock setup", "Fresh cold-pressed coconut water", "Beach towels"],
        image: "/public/public/programs_real/sunbathing.webp",
        accent: "#eab308",
    },
    {
        id: "wildlife-spotting",
        title: "Wildlife Spotting — Land & Sea",
        subtitle: "See where the wild things are, guided by experts who know.",
        location: "Komodo & Togean Islands",
        category: "Wildlife",
        categoryEmoji: "🦅",
        filterCategory: "Wildlife",
        price: "Included",
        rating: 4.91,
        reviewCount: 198,
        duration: "Half day",
        groupSize: "Max 10 guests",
        hook: "From sea turtles surfacing at dusk to hornbills calling at dawn.",
        description: "The archipelago comes alive when you know exactly what to look for — and how to find it without disturbing a thing. Our onboard naturalists have spent years tracking local migrations and nesting habits. Whether it's watching a dugong graze on seagrass, spotting rare endemic birds like the Togean Macaque, or identifying reef sharks on the hunt, this is unscripted nature unfolding right in front of you.",
        highlights: [
            "Guided spotting led by experienced naturalists",
            "Encounters with endemic and rare Indonesian wildlife",
            "Focus on non-intrusive, ethical observation",
            "Access to high-quality binoculars and spotting scopes",
        ],
        included: ["Onboard naturalist guide", "Binoculars rental", "Wildlife logbook", "Refreshments"],
        image: "/public/public/programs_real/wildlifespotting.webp",
        accent: "#84cc16",
    }
];

interface Experience {
    id: string;
    title: string;
    location: string;
    description: string;
    longDescription: string;
    category: Exclude<Category, "All">;
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
        title: "Snorkeling at Pristine Coral Gardens",
        location: "Togean Islands, Central Sulawesi",
        description: "Dive into crystal-clear waters and explore vibrant coral reefs teeming with thousands of tropical species.",
        longDescription: "Glide through one of Earth's most biodiverse coral ecosystems. Our expert guides lead you to the most vibrant reef patches across the Togean Islands — untouched gardens alive with turtles, napoleon wrasse, and vivid sea fans. No experience needed.",
        category: "Diving & Snorkelling",
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
        title: "Komodo Dragon Trekking",
        location: "Komodo National Park, East Nusa Tenggara",
        description: "A ranger-guided expedition to observe the world's largest living lizard roaming free in its volcanic landscape.",
        longDescription: "Walk alongside a UNESCO World Heritage ranger through Rinca Island's savannah trails, coming face-to-face with Komodo dragons — prehistoric apex predators up to 3 metres long. A truly once-in-a-lifetime encounter.",
        category: "Wildlife",
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
        title: "Night Diving with Bioluminescence",
        location: "Una-Una Island, Gulf of Tomini",
        description: "Watch the sea glow blue as bioluminescent plankton light up around every movement in the dark volcanic waters.",
        longDescription: "Una-Una's geothermal waters create perfect conditions for bioluminescence. As you dive in complete darkness, every wave of your hand ignites blue sparks. Mandarin fish, Spanish dancers, and octopus emerge after sunset for an otherworldly show.",
        category: "Diving & Snorkelling",
        rating: 4.97,
        reviewCount: 96,
        duration: "2 hours",
        groupSize: "Max 6",
        included: ["Dive torch", "75-min guided dive", "Hot tea on deck", "Night snack"],
        image: "/public/public/wildlife/sea/seahorse/hero.webp",
    },
    {
        id: "island-hopping",
        title: "Full-Day Island Hopping Adventure",
        location: "Togean Archipelago, Central Sulawesi",
        description: "Four stunning stops in a single day — jellyfish lake, hidden lagoon, sandbar picnic, and a coral wall dive.",
        longDescription: "Our signature full-day voyage covers the greatest hits of the Togeans — swim with stingless jellyfish in a landlocked lake, kayak into a hidden lagoon accessible only by water, picnic on a deserted sandbar, and finish with a sunset snorkel over a pristine coral wall.",
        category: "Diving & Snorkelling",
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
        title: "Sunset Kayaking & Mangrove Tour",
        location: "Kadidiri Island, Togean Islands",
        description: "Paddle through serene mangrove channels as the sky paints gold and crimson over the horizon.",
        longDescription: "The world slows down as you glide through ancient mangrove tunnels, propelled by the rhythm of your paddle. Kingfishers dart between prop roots, fireflies begin to flicker in the canopy, and the open bay turns amber as the sun falls behind the Sulawesi hills.",
        category: "Beach & Relaxation",
        rating: 4.88,
        reviewCount: 143,
        duration: "2.5 hours",
        groupSize: "Max 10",
        included: ["Double kayak", "Waterproof bag", "Cold drink", "Guide"],
        image: "/public/programs/program-beach-exploration-hidden-coves.webp",
    },
    {
        id: "village-cultural-visit",
        title: "Bajo Sea-Nomad Village Immersion",
        location: "Bomba Village, Togean Islands",
        description: "Walk the boardwalks of a stilted sea-village, share a meal, and learn the fishing traditions of the Bajo people.",
        longDescription: "The Bajo people have lived entirely on water for centuries — their village a web of wooden boardwalks connecting brightly painted stilt houses above the sea. You're welcomed in for traditional cooking demonstrations, weaving, and an evening meal as the boats rock gently below.",
        category: "Cultural",
        rating: 4.90,
        reviewCount: 178,
        duration: "3 hours",
        groupSize: "Max 12",
        included: ["Local guide", "Welcome drink", "Traditional meal", "Weaving demo"],
        image: "/public/programs/program-local-community-immersion.webp",
    },
    {
        id: "hiking-viewpoints",
        title: "Summit Hike & Panoramic Viewpoint",
        location: "Padar Island, Komodo National Park",
        description: "Conquer the ridge of Padar Island at sunrise for a 360° panorama of three bays with differently coloured sand.",
        longDescription: "Padar Island's silhouette is one of Indonesia's most iconic images — three bays curving below a jagged ridge at dawn. The 45-minute hike to the summit is rewarded with a view that makes every step worthwhile. Pink, black, and white sand beaches stretch below you in perfect symmetry.",
        category: "Trekking",
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
        title: "Traditional Fishing with Locals",
        location: "Walea Kodi, Central Sulawesi",
        description: "Learn centuries-old hand-line techniques from local fishermen and cook your catch over a beachside fire.",
        longDescription: "Before dawn, you join a local fisherman and his family — casting traditional hand-lines into the pre-dawn dark, feeling the pull of the current, and sharing stories as the horizon slowly brightens. Back on the beach, what you catch becomes breakfast, grilled over coconut husks.",
        category: "Cultural",
        rating: 4.85,
        reviewCount: 89,
        duration: "4 hours",
        groupSize: "Max 8",
        included: ["Fishing equipment", "Local fishermen host", "Beach breakfast", "Translation guide"],
        image: "/public/public/programs_real/activity-community.png",
    },
    {
        id: "jungle-waterfall",
        title: "Jungle Trek to Hidden Waterfall",
        location: "Bomba, Togean Islands",
        description: "Hike through primary rainforest alive with hornbills and cuscus to discover a secluded jungle waterfall.",
        longDescription: "Dense primary forest closes in on all sides as your guide leads you deeper into Malenge's interior. The trail winds through ancient canopy alive with hornbills calling overhead and cuscus peering down from the branches. The reward — a hidden cascade tumbling into a clear natural pool.",
        category: "Trekking",
        rating: 4.87,
        reviewCount: 112,
        duration: "3 hours",
        groupSize: "Max 8",
        included: ["Local trek guide", "Waterfall swim time", "Jungle snack", "Insect repellent"],
        image: "/public/programs/program-beach-exploration-hidden-coves.webp",
    },
    {
        id: "stargazing",
        title: "Open-Ocean Stargazing Night",
        location: "Open Sea, Gulf of Tomini",
        description: "Lie back on the upper deck far from any city light as the Milky Way arches in full across the equatorial sky.",
        longDescription: "Beyond the reach of any light pollution, anchored in the Gulf of Tomini's glassy water, the stars reveal themselves in numbers that feel impossible. Our guides share southern-hemisphere constellations while Indonesian coffee and passing snacks complete a night you will never forget.",
        category: "Night Experience",
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
        title: "Sunbathing on a Deserted Island",
        location: "Pulau Puah, Togean Islands",
        description: "A crescent of white sand with zero other visitors — just you, the coconut palms, and the open sea.",
        longDescription: "Some experiences need no agenda. Pulau Puah is a tiny uninhabited island visited only by our liveaboard. You step ashore into silence — a perfect arc of white sand backed by coconut palms. Nothing to do but sink into the warmth and let the waves decide your schedule.",
        category: "Beach & Relaxation",
        rating: 4.89,
        reviewCount: 156,
        duration: "Free time",
        groupSize: "All guests",
        included: ["Private beach access", "Hammock", "Cold-pressed coconut water", "Snorkel gear"],
        image: "/public/public/programs_real/sunbathing.webp",
    },
    {
        id: "wildlife-spotting",
        title: "Wildlife Spotting — Land & Sea",
        location: "Komodo & Togean Islands",
        description: "Turtles, reef sharks, hornbills, cuscus — our naturalist guides show you where the wild things are.",
        longDescription: "From hawksbill turtles surfacing for air at dusk to hornbills calling across the forest canopy at dawn, our onboard naturalists know exactly where to look. Land and water come alive when you know what to find — and how to find it without disturbing a thing.",
        category: "Wildlife",
        rating: 4.91,
        reviewCount: 198,
        duration: "Half day",
        groupSize: "Max 10",
        included: ["Naturalist guide", "Binoculars", "Wildlife logbook", "Water & fruit"],
        image: "/public/public/programs_real/wildlifespotting.webp",
    },
];

const CATEGORIES: Category[] = ["All", "Diving & Snorkelling", "Wildlife", "Trekking", "Cultural", "Beach & Relaxation", "Night Experience"];

const CATEGORY_ICONS: Record<Category, string> = {
    "All": "🌊",
    "Diving & Snorkelling": "🤿",
    "Wildlife": "🦎",
    "Trekking": "🥾",
    "Cultural": "🏘️",
    "Beach & Relaxation": "🏖️",
    "Night Experience": "✨",
};

const STATS = [
    { value: "12+", label: "Unique Experiences" },
    { value: "9", label: "Indonesian Destinations" },
    { value: "4.92", label: "Avg Guest Rating" },
    { value: "98%", label: "Would Recommend" },
];

const TESTIMONIALS = [
    {
        text: "The Komodo trekking was unlike anything I've ever done. Having a ranger guide you metres away from a wild Komodo dragon — it's something you simply cannot replicate anywhere else on Earth.",
        name: "Sarah M.",
        origin: "Amsterdam, Netherlands",
        exp: "Komodo Dragon Trekking",
    },
    {
        text: "I've done bioluminescence dives in the Philippines, the Maldives, and Mexico. Una-Una's is categorically different. The intensity of the light show in those geothermal waters is incredible.",
        name: "James T.",
        origin: "Sydney, Australia",
        exp: "Night Diving with Bioluminescence",
    },
    {
        text: "The Bajo village visit was the highlight of the whole trip — not just the cruise, but my entire year. They welcomed us into their home. You don't find experiences like that on a regular holiday.",
        name: "Claudia R.",
        origin: "Milan, Italy",
        exp: "Traditional Village Cultural Visit",
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
        title: "Expert Local Guides",
        desc: "Every experience is led by certified local naturalists and guides who have spent their lives in these waters and forests.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
        ),
        title: "Small Groups Only",
        desc: "We cap every experience at a maximum of 12 guests, ensuring personal attention and minimal environmental impact.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
        title: "Included in Your Cruise",
        desc: "Most experiences are bundled into your cruise package — no surprise fees, no hidden extras, just pure adventure.",
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
        ),
        title: "Zero Impact Pledge",
        desc: "We follow strict marine and wildlife protection protocols on every excursion — ensuring these places remain wild for generations.",
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
    const [activeCategory, setActiveCategory] = useState<Category>("All");
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
        
        if (cat === "All") {
             // If All is clicked, just scroll to the top of the grid
             if (gridRef.current) {
                 const offset = 140; // account for sticky navbar AND the sticky filter bar itself
                 const top = gridRef.current.getBoundingClientRect().top + window.scrollY - offset;
                 window.scrollTo({ top, behavior: "smooth" });
             }
             return;
        }

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
                        <div className="exp-hero-eyebrow">Life Beyond The Shore</div>
                        <h1 className="exp-hero-title">
                            Stories You&apos;ll Be Telling For Years
                        </h1>
                        <p className="exp-hero-sub">
                            Every cruise comes loaded with guided experiences — from sleeping beneath the Milky Way to swimming with stingless jellyfish, trekking beside Komodo dragons, and dining with sea-nomad families on stilted villages above the turquoise sea.
                        </p>
                        <div className="exp-hero-actions">
                            <a href="#experiences" className="exp-hero-btn exp-hero-btn--primary">
                                Explore Experiences ↓
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
                        <div className="exp-spotlight-eyebrow">Every Experience, In Detail</div>
                        <h2 className="exp-spotlight-title">What's Waiting for You Out There</h2>
                        <p className="exp-spotlight-sub">
                            Every cruise includes access to these experiences. Here's exactly what each one looks like — and why guests come back to do them again.
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
                                                Cruise from {priceDisplay} <span>/pax</span>
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
                                            Book a Cruise — Experience This
                                        </LocaleLink>
                                        <div className="exp-spot-price-label">
                                            Cruise from <strong>{priceDisplay}</strong> /pax
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
