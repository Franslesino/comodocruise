"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import LocaleLink from "./LocaleLink";
import { MapPinIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n";
import "@/styles/destination-about.css";

// ─── Highlight type ───────────────────────────────────────────────────────
interface Highlight {
    title: string;
    description: string;
    image: string;
    tag?: string;
}

// ─── Full destination data ────────────────────────────────────────────────
interface DestData {
    displayName: string;
    location: string;
    heroImage: string;
    moodImage: string;
    experienceImage: string;
    rating: number;
    overview: string;
    bestFor: string[];
    highlights: Highlight[];
}

const DEST_DATA: Record<string, DestData> = {
    "komodo-national-park": {
        displayName: "Komodo National Park",
        location: "East Nusa Tenggara, Indonesia",
        heroImage: "/public/komodo-hero.webp",
        moodImage: "/public/destinations_real/destination_waleakodi.webp",
        experienceImage: "/public/destinations_real/destination_pulau_puah.webp",
        rating: 4.9,
        overview:
            "A UNESCO World Heritage Site and one of the New Seven Wonders of Nature, Komodo National Park spans 1,733 km² of rugged volcanic islands, turquoise bays, and some of the world's most diverse marine ecosystems. It is the only place on Earth where you can dive with Manta Rays in the morning and trek alongside ancient Komodo Dragons in the afternoon.",
        bestFor: ["Diving & Snorkeling", "Wildlife Encounters", "Photography", "Trekking"],
        highlights: [
            {
                title: "Komodo Dragons",
                tag: "Wildlife",
                image: "/public/destinations_real/destination_waleakodi.webp",
                description:
                    "Witness the world's largest living lizard roaming freely across Rinca and Komodo Islands. These prehistoric giants can reach 3 metres in length and have existed for millions of years, making every encounter a truly humbling experience.",
            },
            {
                title: "Pink Beach",
                tag: "Beach",
                image: "/public/destinations_real/destination_pulau_puah.webp",
                description:
                    "One of only seven pink-sand beaches in the world. The rare rosy hue comes from fragments of red coral mixed into the white sand. Crystal-clear waters teeming with colourful reef fish make it perfect for snorkelling right off the shore.",
            },
            {
                title: "Padar Island",
                tag: "Trekking",
                image: "/public/destinations_real/destination_bomba.webp",
                description:
                    "Hike to the iconic ridge-top viewpoint for a panorama of three bays — each with differently coloured sand. The silhouette of Padar's dramatic hills against the ocean at sunrise or sunset is among the most photographed landscapes in all of Indonesia.",
            },
            {
                title: "World-class Diving",
                tag: "Diving",
                image: "/public/destinations_real/destination_kadidiri.webp",
                description:
                    "Between the Indian Ocean and the Flores Sea, strong currents push nutrients upward creating an explosion of marine life. Dive with Manta Rays at Manta Point, encounter Pygmy seahorses, Wobbegong sharks, and schools of thousands of fish along walls that plunge to over 200 metres.",
            },
        ],
    },
    "togean-islands": {
        displayName: "Togean Islands",
        location: "Central Sulawesi, Indonesia",
        heroImage: "/public/destinations_real/kadidiri/hero.webp",
        moodImage: "/public/destinations_real/kadidiri/mood.webp",
        experienceImage: "/public/destinations_real/kadidiri/experience.webp",
        rating: 4.9,
        overview:
            "Stretching across the Gulf of Tomini in Central Sulawesi, the Togean Islands are one of Indonesia's last truly remote paradises. Accessible only by boat, this archipelago of 66 islands sits at the heart of the Coral Triangle — Earth's most biodiverse marine region — and remains blissfully undeveloped.",
        bestFor: ["Snorkelling", "Scuba Diving", "Island Hopping", "Cultural Immersion"],
        highlights: [
            {
                title: "Kadidiri Island",
                tag: "Paradise",
                image: "/public/destinations_real/kadidiri/hero.webp",
                description:
                    "The jewel of the Togeans — Kadidiri offers powdery white sand beaches flanked by coconut palms and some of the clearest water in Indonesia. The house reef is alive with Napoleonfish, turtles, and vast fields of healthy staghorn coral.",
            },
            {
                title: "Jellyfish Lake",
                tag: "Unique",
                image: "/public/destinations_real/kadidiri/mood.webp",
                description:
                    "A landlocked marine lake cut off from the sea for thousands of years, home to millions of stingless jellyfish. Swimming among them is an otherworldly experience found in only a handful of places globally.",
            },
            {
                title: "Bomba Village",
                tag: "Culture",
                image: "/public/destinations_real/bomba/hero.webp",
                description:
                    "A stilted sea-village where the indigenous Bajo (Sea Nomad) people have lived on the water for centuries. Explore traditional wooden homes, share a meal with local fishermen, and gain a window into a way of life that has barely changed in generations.",
            },
            {
                title: "Una-Una Volcano Dive",
                tag: "Diving",
                image: "/public/destinations_real/una-una/hero.webp",
                description:
                    "Una-Una is an active stratovolcano rising from the Gulf. Beneath its waves lie remarkable dive sites where fumaroles bubble through black sand, and coral gardens thrive in the warm volcanic waters.",
            },
        ],
    },
    "labuan-bajo": {
        displayName: "Labuan Bajo",
        location: "Flores, East Nusa Tenggara",
        heroImage: "/public/destinations_real/destination_luwuk.webp",
        moodImage: "/public/destinations_real/luwuk/mood.webp",
        experienceImage: "/public/destinations_real/luwuk/experience.webp",
        rating: 4.7,
        overview:
            "Once a sleepy fishing village on the western tip of Flores, Labuan Bajo has transformed into Indonesia's premier luxury eco-tourism gateway. Its sheltered harbour dotted with dozens of forested islands at sunset is one of the most beautiful scenes in all of Southeast Asia.",
        bestFor: ["Sunset Cruises", "Gateway to Komodo", "Seafood Dining", "Island Hopping"],
        highlights: [
            {
                title: "Sunset Harbour Views",
                tag: "Scenic",
                image: "/public/destinations_real/destination_luwuk.webp",
                description:
                    "As the sun dips behind the islands, Labuan Bajo's harbour turns gold and pink. Dozens of liveaboard vessels, traditional wooden boats and the distant silhouettes of limestone islands create a view that draws travellers from around the world.",
            },
            {
                title: "Island Hopping",
                tag: "Adventure",
                image: "/public/destinations_real/destination_malengue.webp",
                description:
                    "Dozens of uninhabited islands surround Labuan Bajo, each with its own snorkel sites, beaches, and viewpoints. Day trips to Kanawa, Bidadari, Siaba Besar, and Seraya Besar are easily arranged from town.",
            },
            {
                title: "Batu Cermin Cave",
                tag: "Hidden Gem",
                image: "/public/destinations_real/luwuk/hero.webp",
                description:
                    "The 'Mirror Rock' cave glows when sunlight refracts off underwater crystals embedded in the walls. A guided torch-lit walk through the stalactite formations feels like entering another world.",
            },
            {
                title: "Fresh Seafood Markets",
                tag: "Food & Culture",
                image: "/public/destinations_real/luwuk/experience.webp",
                description:
                    "The evening market along the waterfront bursts with the day's catch — grilled squid, lobster, and fish prepared right in front of you. The best way to end a day of exploration is eating on a pier watching boats drift in the harbour.",
            },
        ],
    },
    "walea-kodi": {
        displayName: "Walea Kodi",
        location: "Central Sulawesi, Indonesia",
        heroImage: "/public/destinations_real/waleakodi/hero.webp",
        moodImage: "/public/destinations_real/waleakodi/mood.webp",
        experienceImage: "/public/destinations_real/waleakodi/experience.webp",
        rating: 4.8,
        overview:
            "Walea Kodi sits on the southern edge of the Togean archipelago and is barely known outside the world of diving. Its isolation is its greatest gift — pristine walls, gentle sloping reefs, and an almost complete absence of other boats.",
        bestFor: ["Advanced Diving", "Solitude", "Marine Photography", "Liveaboard"],
        highlights: [
            {
                title: "Pristine Coral Walls",
                tag: "Diving",
                image: "/public/destinations_real/waleakodi/hero.webp",
                description: "Vertical walls dropping 30–50 metres festooned with giant sea fans, black corals, and schooling anthias. The visibility regularly exceeds 30 metres.",
            },
            {
                title: "Untouched Reefs",
                tag: "Snorkelling",
                image: "/public/destinations_real/waleakodi/mood.webp",
                description: "Shallow reefs in perfect health that have seen very little human presence. Encounter hawksbill turtles, reef sharks, and explosions of coral colour just below the surface.",
            },
            {
                title: "Remote Island Life",
                tag: "Culture",
                image: "/public/destinations_real/waleakodi/experience.webp",
                description: "Small fishing communities living in traditional wooden houses on stilts over the water. A genuine window into seafaring village life away from tourist trails.",
            },
            {
                title: "Night Diving",
                tag: "Adventure",
                image: "/public/destinations_real/destination_waleakodi.webp",
                description: "After dark the reef transforms — Spanish dancers, blue-ringed octopus, mandarin fish, and bioluminescent plankton make night dives here among the most memorable anywhere on Earth.",
            },
        ],
    },
    "una-una": {
        displayName: "Una-Una Island",
        location: "Gulf of Tomini, Central Sulawesi",
        heroImage: "/public/destinations_real/una-una/hero.webp",
        moodImage: "/public/destinations_real/una-una/mood.webp",
        experienceImage: "/public/destinations_real/una-una/experience.webp",
        rating: 4.7,
        overview:
            "Una-Una is a perfectly formed active volcano rising abruptly from the Gulf of Tomini. Evacuated entirely in 1983 during a major eruption, the island has since regrown into a lush jungle landscape, and its surrounding waters host extraordinary dive sites shaped by geothermal activity.",
        bestFor: ["Volcano Trekking", "Unique Diving", "Off-the-Beaten-Path", "Photography"],
        highlights: [
            {
                title: "Volcano Trekking",
                tag: "Adventure",
                image: "/public/destinations_real/una-una/hero.webp",
                description: "Trek through dense rainforest to the crater rim of this active stratovolcano. Steaming fumaroles, sulphurous vents, and sweeping views over the Gulf of Tomini await those who make the climb.",
            },
            {
                title: "Geothermal Dive Sites",
                tag: "Diving",
                image: "/public/destinations_real/una-una/mood.webp",
                description: "Underwater hot springs bubble through black sand at 20 metres while coral gardens flourish in the warm water. A truly unique diving experience combining geology and marine biology.",
            },
            {
                title: "Post-Eruption Forest",
                tag: "Nature",
                image: "/public/destinations_real/una-una/experience.webp",
                description: "The island has been completely recolonised by jungle since the 1983 evacuation, with almost no permanent human settlement remaining. Wildlife is abundant and the landscape feels wild and primal.",
            },
            {
                title: "Coral Triangle Reefs",
                tag: "Snorkelling",
                image: "/public/destinations_real/destination_una_una.webp",
                description: "As part of the Coral Triangle, Una-Una's shallow reefs are home to over 3,000 species of fish and 600 types of coral — densities found nowhere else on the planet.",
            },
        ],
    },
    "bomba": {
        displayName: "Bomba",
        location: "Togean Islands, Central Sulawesi",
        heroImage: "/public/destinations_real/bomba/hero.webp",
        moodImage: "/public/destinations_real/bomba/mood.webp",
        experienceImage: "/public/destinations_real/bomba/experience.webp",
        rating: 4.6,
        overview:
            "Bomba is a traditional Bajo sea-nomad village built entirely on stilts over the turquoise shallows of the Togean Islands. It offers one of the most authentic cultural encounters in Indonesia combined with excellent snorkelling and diving right from the village jetty.",
        bestFor: ["Cultural Immersion", "Community Stays", "Snorkelling", "Photography"],
        highlights: [
            {
                title: "Bajo Sea-Nomad Village",
                tag: "Culture",
                image: "/public/destinations_real/bomba/hero.webp",
                description: "Walk through connecting boardwalks above the sea between brightly painted wooden houses where the indigenous Bajo people have lived for centuries, dependent entirely on the ocean.",
            },
            {
                title: "House Reef Snorkel",
                tag: "Snorkelling",
                image: "/public/destinations_real/bomba/mood.webp",
                description: "Step off the jetty directly onto a healthy reef alive with parrotfish, clownfish, and staghorn corals. No boat needed — one of the most accessible snorkelling spots in the Togeans.",
            },
            {
                title: "Traditional Fishing",
                tag: "Experience",
                image: "/public/destinations_real/bomba/experience.webp",
                description: "Join local fishermen on their sunrise outings using traditional hand lines and nets. Learn techniques passed down through generations and share a freshly cooked breakfast on the water.",
            },
            {
                title: "Night Snorkelling",
                tag: "Adventure",
                image: "/public/destinations_real/destination_bomba.webp",
                description: "After dark the shallow reefs around Bomba come alive with hunting lionfish, sleeping parrotfish, and bioluminescent plankton that turns every movement into a trail of blue light.",
            },
        ],
    },
    "malengue": {
        displayName: "Malengue",
        location: "Togean Islands, Central Sulawesi",
        heroImage: "/public/destinations_real/malenge/hero.webp",
        moodImage: "/public/destinations_real/malenge/mood.webp",
        experienceImage: "/public/destinations_real/malenge/experience.webp",
        rating: 4.6,
        overview:
            "Malengue (Malenge) is the largest island in the Togean archipelago and home to dense tropical rainforest, traditional villages, and the famous Jellyfish Lake — one of only a handful of its kind on Earth.",
        bestFor: ["Jellyfish Lake", "Rainforest", "Village Culture", "Kayaking"],
        highlights: [
            {
                title: "Jellyfish Lake",
                tag: "World Unique",
                image: "/public/destinations_real/malenge/hero.webp",
                description: "A landlocked lake filled with millions of stingless golden jellyfish that migrate across its surface following the sun each day. Swimming through them is an eerie, magical experience unlike anything else.",
            },
            {
                title: "Rainforest Trekking",
                tag: "Nature",
                image: "/public/destinations_real/malenge/mood.webp",
                description: "Dense primary rainforest covers much of Malengue interior, harbouring hornbills, cuscus, monitor lizards, and a cacophony of birdlife. Guided trails wind through towering canopies to hidden viewpoints.",
            },
            {
                title: "Traditional Loinan Village",
                tag: "Culture",
                image: "/public/destinations_real/malenge/experience.webp",
                description: "One of the last traditional farming communities on the Togean Islands, Loinan village offers a glimpse of subsistence agriculture and craftsmanship including hand-woven baskets and woodcarving.",
            },
            {
                title: "Mangrove Kayaking",
                tag: "Adventure",
                image: "/public/destinations_real/destination_malengue.webp",
                description: "Paddle through winding mangrove channels that frame the island's coastline. Kingfishers dart between the prop roots, and the stillness is broken only by the sound of your paddle and distant bird calls.",
            },
        ],
    },
    "luwuk": {
        displayName: "Luwuk",
        location: "Banggai Regency, Central Sulawesi",
        heroImage: "/public/destinations_real/luwuk/hero.webp",
        moodImage: "/public/destinations_real/luwuk/mood.webp",
        experienceImage: "/public/destinations_real/luwuk/experience.webp",
        rating: 4.5,
        overview:
            "The gateway city to the Togean Islands, Luwuk is a laid-back port town on the Sulawesi peninsula surrounded by forested hills and a sheltered bay. It is the embarkation point for most liveaboard cruises into the Togean archipelago.",
        bestFor: ["Departure Point", "Local Culture", "Fresh Seafood", "Coastal Scenery"],
        highlights: [
            {
                title: "Luwuk Harbour",
                tag: "Gateway",
                image: "/public/destinations_real/luwuk/hero.webp",
                description: "The bustling harbour where liveaboard vessels depart for the Togean Islands. Watch the morning activity as fishing boats return with the night's catch and liveaboard vessels prepare for departure.",
            },
            {
                title: "Banggai Archipelago",
                tag: "Diving",
                image: "/public/destinations_real/luwuk/mood.webp",
                description: "South of Luwuk, the Banggai Islands are home to the endemic Banggai Cardinalfish — one of the most sought-after macro diving species in the world, found nowhere else on earth.",
            },
            {
                title: "Togian Market",
                tag: "Culture",
                image: "/public/destinations_real/luwuk/experience.webp",
                description: "The morning market overflows with tropical produce, freshly caught fish, and handmade goods from the surrounding villages. The perfect place to stock up before heading out to sea.",
            },
            {
                title: "Scenic Coast Road",
                tag: "Scenery",
                image: "/public/destinations_real/destination_luwuk.webp",
                description: "The road between Luwuk and the coast winds through coconut groves and fishing villages with the Tomini Gulf shimmering below. An easy half-day motorbike or car journey with spectacular views.",
            },
        ],
    },
    "pulau-puah": {
        displayName: "Pulau Puah",
        location: "Togean Islands, Central Sulawesi",
        heroImage: "/public/destinations_real/pulau-puah/hero.webp",
        moodImage: "/public/destinations_real/pulau-puah/mood.webp",
        experienceImage: "/public/destinations_real/pulau-puah/experience.webp",
        rating: 4.7,
        overview:
            "Pulau Puah is a tiny uninhabited island ringed by white sand and one of the most pristine coral reefs in the Togean chain. Its seclusion means the reefs have barely been touched — making it a bucket-list snorkelling and diving destination.",
        bestFor: ["Secluded Beach", "Reef Snorkelling", "Liveaboard Stop", "Solitude"],
        highlights: [
            {
                title: "Deserted White Beach",
                tag: "Beach",
                image: "/public/destinations_real/pulau-puah/hero.webp",
                description: "A crescent of brilliant white sand completely uninhabited and often visited only by liveaboard vessels. Anchor offshore, swim in, and have the entire beach to yourself.",
            },
            {
                title: "Pristine Fringing Reef",
                tag: "Snorkelling",
                image: "/public/destinations_real/pulau-puah/mood.webp",
                description: "The reef begins immediately at the water's edge, dropping steeply through richly populated coral gardens. Turtles are a common sight and the fish diversity here is outstanding.",
            },
            {
                title: "Sunset Anchorage",
                tag: "Scenic",
                image: "/public/destinations_real/pulau-puah/experience.webp",
                description: "As the sun sets over the Sulawesi hills, the liveaboard anchorage at Pulau Puah glows in deep orange and red. An al-fresco dinner on the upper deck here is memorable.",
            },
            {
                title: "Night Dive",
                tag: "Diving",
                image: "/public/destinations_real/destination_pulau_puah.webp",
                description: "The shallow protected lagoon is ideal for night dives — an abundance of hunting crustaceans, nudibranchs, and octopus come out after dark across the sandy bottom.",
            },
        ],
    },
};

function getFallbackData(slug: string): DestData {
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
        displayName: name,
        location: "Indonesia",
        heroImage: "/public/destinations_real/destination_kadidiri.webp",
        moodImage: "/public/destinations_real/destination_bomba.webp",
        experienceImage: "/public/destinations_real/destination_una_una.webp",
        rating: 4.6,
        overview: `Explore the stunning ${name} region — one of Indonesia's hidden gems for liveaboard cruising, marine biodiversity, and island adventure.`,
        bestFor: ["Cruising", "Diving", "Nature", "Culture"],
        highlights: [
            {
                title: "Marine Life",
                tag: "Diving",
                image: "/public/destinations_real/destination_kadidiri.webp",
                description: `${name} sits within the Coral Triangle, the world's richest marine biodiversity zone. Its reefs teem with colourful fish, turtles, and rare macro species.`,
            },
            {
                title: "Island Scenery",
                tag: "Scenic",
                image: "/public/destinations_real/destination_bomba.webp",
                description: `Forested peaks, white sand beaches, and sheltered bays make ${name} one of the most photogenic destinations in Indonesia.`,
            },
            {
                title: "Local Culture",
                tag: "Culture",
                image: "/public/destinations_real/destination_malengue.webp",
                description: `Traditional fishing communities and sea-nomad villages offer an authentic cultural experience far from mainstream tourist trails.`,
            },
        ],
    };
}

// Only slugs that have real trips in the API
const API_SLUGS = ["komodo-national-park", "labuan-bajo"];

function toAnchor(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface Props { slug: string }

export default function DestinationAboutPage({ slug }: Props) {
    const pathname = usePathname();
    const locale = getLocaleFromPathname(pathname);
    const data = DEST_DATA[slug] ?? getFallbackData(slug);

    // 3 related destinations (not current slug)
    const related = API_SLUGS.filter(s => s !== slug);

    return (
        <div className="da-page">

            {/* ══ HERO ══════════════════════════════════════════════════════ */}
            <div className="da-hero">
                <div className="da-hero-img-wrap">
                    <Image src={data.heroImage} alt={data.displayName} fill className="da-hero-img" priority sizes="100vw" />
                    <div className="da-hero-overlay" />
                </div>
                <div className="da-hero-content">
                    <nav className="da-breadcrumb" aria-label="Breadcrumb">
                        <LocaleLink href={localizePath("/", locale)} className="da-bc-link">Home</LocaleLink>
                        <ChevronRightIcon className="da-bc-sep" />
                        <span className="da-bc-current">{data.displayName}</span>
                    </nav>
                    <div className="da-hero-text">
                        <div className="da-hero-location">
                            <MapPinIcon style={{ width: 13, height: 13 }} />
                            {data.location}
                        </div>
                        <h1 className="da-hero-title">{data.displayName}</h1>
                        <div className="da-hero-meta">
                            <span className="da-badge da-badge--star">
                                <StarIcon style={{ width: 12, height: 12, color: "#fbbf24" }} />
                                {data.rating} / 5.0
                            </span>
                            {data.bestFor.map(b => (
                                <span key={b} className="da-badge">{b}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ ARTICLE LAYOUT ═══════════════════════════════════════════ */}
            <div className="da-article-outer">
                <div className="da-article-layout">

                    {/* ── Sticky sidebar TOC ── */}
                    <aside className="da-toc" aria-label="Table of contents">
                        <div className="da-toc-inner">
                            <p className="da-toc-heading">On this page</p>
                            <nav>
                                <a href="#overview" className="da-toc-link">About {data.displayName}</a>
                                <p className="da-toc-section-label">Highlights</p>
                                {data.highlights.map(h => (
                                    <a key={h.title} href={`#${toAnchor(h.title)}`} className="da-toc-link da-toc-link--sub">
                                        {h.title}
                                    </a>
                                ))}
                                <a href="#cruises" className="da-toc-link da-toc-link--cta">→ Browse Cruises</a>
                            </nav>
                        </div>
                    </aside>

                    {/* ── Main article content ── */}
                    <main className="da-content">

                        {/* Overview */}
                        <section id="overview" className="da-section">
                            <h2 className="da-content-h2">About {data.displayName}</h2>
                            <div className="da-overview-wrap">
                                <p className="da-overview-text">{data.overview}</p>
                                <div className="da-overview-img-wrap">
                                    <Image
                                        src={data.moodImage}
                                        alt={`${data.displayName} scenery`}
                                        fill
                                        className="da-overview-img"
                                        sizes="(max-width: 768px) 100vw, 420px"
                                    />
                                </div>
                            </div>
                            <div className="da-bestfor-row">
                                <span className="da-bestfor-label">Best for:</span>
                                {data.bestFor.map(b => (
                                    <span key={b} className="da-bestfor-tag">{b}</span>
                                ))}
                            </div>
                        </section>

                        <hr className="da-divider" />

                        {/* Highlights — alternating rows */}
                        <section className="da-section">
                            <h2 className="da-content-h2">Highlights</h2>
                            <p className="da-section-sub">What makes {data.displayName} special</p>

                            <div className="da-highlights-list">
                                {data.highlights.map((h, i) => (
                                    <article
                                        key={h.title}
                                        id={toAnchor(h.title)}
                                        className={`da-item${i % 2 === 1 ? " da-item--flip" : ""}`}
                                    >
                                        <div className="da-item-img-wrap">
                                            <Image
                                                src={h.image}
                                                alt={h.title}
                                                fill
                                                className="da-item-img"
                                                sizes="(max-width: 768px) 100vw, 480px"
                                            />
                                            {h.tag && <span className="da-item-tag">{h.tag}</span>}
                                        </div>
                                        <div className="da-item-body">
                                            <h3 className="da-item-title">{h.title}</h3>
                                            <p className="da-item-desc">{h.description}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <hr className="da-divider" />

                        {/* CTA strip with background image */}
                        <section id="cruises" className="da-cta-section">
                            <div className="da-cta-inner">
                                <div className="da-cta-img-wrap">
                                    <Image
                                        src={data.experienceImage}
                                        alt={`Cruise to ${data.displayName}`}
                                        fill
                                        className="da-cta-bg"
                                        sizes="100vw"
                                    />
                                    <div className="da-cta-overlay" />
                                </div>
                                <div className="da-cta-text">
                                    <p className="da-cta-eyebrow">Ready to explore?</p>
                                    <h3 className="da-cta-heading">Set sail to {data.displayName}</h3>
                                    <p className="da-cta-sub">Browse hand-picked liveaboard cruises departing for this destination.</p>
                                    <LocaleLink
                                        href={localizePath(`/destinations/${slug}/cruises`, locale)}
                                        className="da-cta-btn"
                                    >
                                        View All Cruises →
                                    </LocaleLink>
                                </div>
                            </div>
                        </section>

                    </main>
                </div>

                {/* ══ RELATED DESTINATIONS ══════════════════════════════════ */}
                <section className="da-related">
                    <h2 className="da-related-heading">You may also like…</h2>
                    <div className="da-related-grid">
                        {related.map(relSlug => {
                            const rel = DEST_DATA[relSlug];
                            return (
                                <LocaleLink
                                    key={relSlug}
                                    href={localizePath(`/destinations/${relSlug}`, locale)}
                                    className="da-related-card"
                                >
                                    <div className="da-related-img-wrap">
                                        <Image
                                            src={rel.heroImage}
                                            alt={rel.displayName}
                                            fill
                                            className="da-related-img"
                                            sizes="(max-width: 640px) 100vw, 33vw"
                                        />
                                        <div className="da-related-img-overlay" />
                                    </div>
                                    <div className="da-related-body">
                                        <span className="da-related-loc">
                                            <MapPinIcon style={{ width: 11, height: 11 }} />
                                            {rel.location}
                                        </span>
                                        <h3 className="da-related-name">{rel.displayName}</h3>
                                        <div className="da-related-tags">
                                            {rel.bestFor.slice(0, 2).map(t => (
                                                <span key={t} className="da-related-tag">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </LocaleLink>
                            );
                        })}
                    </div>
                </section>

            </div>
        </div>
    );
}
