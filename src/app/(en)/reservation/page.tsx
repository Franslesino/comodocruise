"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import { ItineraryItem } from "@/types/api";
import "@/styles/results.css";

export default function ReservationPage() {
    const [items, setItems] = useState<ItineraryItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("comodocruise_itinerary");
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch {
                setItems([]);
            }
        }
        setLoaded(true);
    }, []);

    if (!loaded) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#6b7280", fontSize: "0.95rem" }}>Loading your reservation...</span>
            </div>
        );
    }

    const handleClear = () => {
        setItems([]);
        localStorage.removeItem("comodocruise_itinerary");
    };

    return (
        <div className="reservation-page-wrapper">
            <button className="reservation-back-btn" onClick={() => router.back()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back to Results
            </button>
            <BookingForm
                items={items}
                mode="page"
                onClearItinerary={handleClear}
            />
        </div>
    );
}
