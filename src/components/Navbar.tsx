"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import NavOverlayMenu from "./NavOverlayMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";
import { getLocaleFromPathname, SUPPORTED_LOCALES, stripLocalePrefix } from "@/lib/i18n";

export default function Navbar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    // Homepage Detection
    const pathWithoutLocale = stripLocalePrefix(pathname);
    const isHomePage = pathWithoutLocale === "/" || pathWithoutLocale === "";

    // isTransparent = true when Hero is visible (only applies to Home)
    const [isTransparent, setIsTransparent] = useState(isHomePage);
    const [navbarHeight, setNavbarHeight] = useState(0);
    const headerRef = useRef<HTMLElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const lastScrollY = useRef(0);

    // Mobile Hide-on-scroll logic
    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;

            // Always show near top
            if (currentY < 10) {
                setIsHidden(false);
                lastScrollY.current = currentY;
                return;
            }

            // Scroll Down (Hide)
            if (currentY > lastScrollY.current + 8) {
                setIsHidden(true);
            }
            // Scroll Up (Show)
            else if (currentY < lastScrollY.current - 8) {
                setIsHidden(false);
            }

            lastScrollY.current = currentY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // IntersectionObserver for Hero Section
    useEffect(() => {
        if (!isHomePage) {
            setIsTransparent(false);
            return;
        }

        setIsTransparent(true);

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsTransparent(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        const heroSection = document.getElementById("hero-section");
        if (heroSection) {
            observer.observe(heroSection);
        }

        return () => observer.disconnect();
    }, [isHomePage]);

    // Measure height for spacer
    useEffect(() => {
        if (!headerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setNavbarHeight(entry.contentRect.height);
            }
        });
        resizeObserver.observe(headerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const isSolid = !isHomePage || !isTransparent;
    const positionClass = "fixed top-0 left-0 right-0";

    const bgClass = isSolid
        ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-neutral-200"
        : "bg-transparent border-transparent shadow-none backdrop-blur-none";

    const hamburgerColorClass = isSolid ? "bg-neutral-900" : "bg-white";
    const textColorClass = isSolid ? "text-neutral-900" : "text-white";
    const logoClass = "w-[110px] md:w-[140px] lg:w-[180px] h-auto object-contain transition-all duration-300";
    const paddingClass = "py-2 md:py-3";

    return (
        <>
            {/* Full Screen Overlay Menu */}
            <NavOverlayMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Spacer for non-home pages */}
            {!isHomePage && <div style={{ height: navbarHeight }} />}

            <header
                ref={headerRef}
                className={`transition-all duration-300 ease-out z-50 w-full ${positionClass} ${bgClass} ${isHidden ? "-translate-y-full" : "translate-y-0"} md:translate-y-0`}
            >
                <div className={`flex items-center justify-between px-5 md:px-10 ${paddingClass}`}>
                        {/* Left: Logo & Language */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <LocaleLink 
                            href="/" 
                            className="flex items-center hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                                if (isHomePage) {
                                    e.preventDefault();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                        >
                            <Image 
                                src="/images/logo1.png" 
                                alt="Logo" 
                                width={40} 
                                height={40}
                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                            />
                        </LocaleLink>

                        {/* Language Switcher */}
                        <div className="hidden md:block">
                            <LanguageSwitcher variant={isSolid ? "dark" : "light"} />
                        </div>
                    </div>

                    {/* Center: Space for BookingBar when scrolled */}
                    <div id="navbar-booking-container" className="flex-1 flex justify-center mx-8">
                        {/* BookingBar will be inserted here by BookingBarContainer */}
                    </div>

                    {/* Right: Check Booking & Hamburger */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <LocaleLink 
                            href="/check-booking" 
                            className={`hidden md:block font-avenir text-sm font-medium ${textColorClass} hover:opacity-80 transition-opacity`}
                        >
                            {t("nav.checkBooking")}
                        </LocaleLink>
                        
                        <button
                            className="flex flex-col justify-center gap-[5px] bg-transparent border-none cursor-pointer p-2 w-10 h-10 group"
                            aria-label="Open menu"
                            onClick={() => {
                                setIsMenuOpen(true);
                                setIsHidden(false);
                            }}
                        >
                            <span className={`block w-6 h-[2px] ${hamburgerColorClass} transition-all duration-300 group-hover:w-5`} />
                            <span className={`block w-6 h-[2px] ${hamburgerColorClass} transition-all duration-300`} />
                            <span className={`block w-6 h-[2px] ${hamburgerColorClass} transition-all duration-300 group-hover:w-4`} />
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}
