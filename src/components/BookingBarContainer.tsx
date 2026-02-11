"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import BookingBar from "./BookingBar";

export default function BookingBarContainer() {
    const [isHeaderMode, setIsHeaderMode] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [navbarContainer, setNavbarContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Small delay to prevent flash
        const timer = setTimeout(() => {
            setIsVisible(true);
            // Find the navbar container after component mounts
            const container = document.getElementById("navbar-booking-container");
            setNavbarContainer(container);
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

    return (
        <>
            {/* Hero Position BookingBar - shown when not scrolled */}
            <div 
                className={`fixed transition-all duration-300 ${
                    isHeaderMode 
                        ? 'opacity-0 pointer-events-none translate-y-4 scale-95' 
                        : 'opacity-100 translate-y-0 scale-100'
                }`}
                style={{ 
                    bottom: '48px', 
                    left: '50%', 
                    transform: `translateX(-50%) ${isHeaderMode ? 'translateY(16px)' : 'translateY(0px)'}`,
                    zIndex: 20,
                    width: '100%',
                    maxWidth: '1000px',
                    padding: '0 24px',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <BookingBar position="hero" />
            </div>

            {/* Header Position BookingBar - integrated into navbar */}
            {isHeaderMode && navbarContainer && createPortal(
                <div 
                    className={`transition-all duration-300 ${
                        isHeaderMode 
                            ? 'opacity-100 translate-y-0 scale-100' 
                            : 'opacity-0 translate-y-4 scale-95'
                    }`}
                    style={{
                        width: '100%',
                        maxWidth: '600px', // Smaller size for header
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <BookingBar position="header" />
                </div>,
                navbarContainer
            )}
        </>
    );
}
