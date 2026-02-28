"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import BookingBar from "./BookingBar";

export default function BookingBarContainer() {
    const [isHeaderMode, setIsHeaderMode] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [navbarContainer, setNavbarContainer] = useState<HTMLElement | null>(null);
    const [heroContainer, setHeroContainer] = useState<HTMLElement | null>(null);

    // Shared dropdown states
    const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
            // Find the containers after component mounts
            setNavbarContainer(document.getElementById("navbar-booking-container"));
            setHeroContainer(document.getElementById("hero-booking-container"));
        }, 100);

        // Use IntersectionObserver to match navbar behavior exactly
        const observer = new IntersectionObserver(
            ([entry]) => {
                // When hero is NOT intersecting (not visible), switch to header mode
                setIsHeaderMode(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        const heroSection = document.getElementById("hero-section");
        if (heroSection) {
            observer.observe(heroSection);
        }

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    if (!isVisible) return null;

    const dropdownProps = {
        showDestinationDropdown,
        setShowDestinationDropdown,
        showCalendar,
        setShowCalendar,
        showDurationDropdown,
        setShowDurationDropdown,
        showGuestDropdown,
        setShowGuestDropdown,
    };

    return (
        <>
            {heroContainer && createPortal(
                <div
                    className={`transition-all duration-300 w-full flex justify-center
                        opacity-100 pointer-events-auto
                        ${isHeaderMode
                            ? 'md:opacity-0 md:pointer-events-none md:translate-y-4 md:scale-95 md:z-[-1]'
                            : 'z-[100]'
                        }`}
                >
                    <BookingBar position="hero" {...dropdownProps} />
                </div>,
                heroContainer
            )}

            {/* Header Position BookingBar - integrated into navbar */}
            {isHeaderMode && navbarContainer && createPortal(
                <div
                    className={`transition-all duration-300 ${isHeaderMode
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-4 scale-95'
                        }`}
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <BookingBar position="header" {...dropdownProps} />
                </div>,
                navbarContainer
            )}
        </>
    );
}
