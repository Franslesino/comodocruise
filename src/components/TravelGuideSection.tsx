"use client";

import Image from "next/image";
import LocaleLink from "./LocaleLink";
import "@/styles/travel-guide.css";

interface Article {
    slug: string;
    category: string;
    title: string;
    image: string;
}

const ARTICLES: Article[] = [
    {
        slug: "best-snorkeling-spots-togean-luwuk",
        category: "ARTICLES & TIPS",
        title: "Best Snorkeling Spots in Togean & Luwuk You Can't Miss",
        image: "/public/blog/best-snorkeling-spots-togean-luwuk/hero.png",
    },
    {
        slug: "responsible-wildlife-encounters-reef-etiquette-togean",
        category: "ARTICLES & TIPS",
        title: "Responsible Wildlife Encounters & Reef Etiquette in Togean",
        image: "/public/blog/responsible-wildlife-encounters-reef-etiquette-togean/hero.png",
    },
    {
        slug: "village-visit-etiquette",
        category: "ARTICLES & TIPS",
        title: "Village Visit Etiquette: How to Be a Respectful Traveler",
        image: "/public/blog/village-visit-etiquette/hero.png",
    },
    {
        slug: "best-snorkeling-spots-togean-luwuk",
        category: "TRAVEL GUIDE",
        title: "Top Marine Life You'll Spot While Cruising the Togean Islands",
        image: "/public/blog/best-snorkeling-spots-togean-luwuk/reef.png",
    },
];

export default function TravelGuideSection() {
    return (
        <section className="travel-guide-section">
            <div className="travel-guide-container">
                <h2 className="travel-guide-heading">Travel Guide &amp; Updates</h2>

                <div className="travel-guide-grid">
                    {ARTICLES.map((article, idx) => (
                        <LocaleLink
                            key={`${article.slug}-${idx}`}
                            href={`/blog/${article.slug}`}
                            className="travel-guide-card"
                        >
                            <div className="travel-guide-card-image">
                                <Image
                                    src={article.image}
                                    alt={article.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    style={{ objectFit: "cover" }}
                                />
                                <div className="travel-guide-card-overlay" />
                                <div className="travel-guide-card-content">
                                    <span className="travel-guide-card-category">
                                        {article.category}
                                    </span>
                                    <h3 className="travel-guide-card-title">
                                        {article.title}
                                    </h3>
                                </div>
                            </div>
                        </LocaleLink>
                    ))}
                </div>
            </div>
        </section>
    );
}
