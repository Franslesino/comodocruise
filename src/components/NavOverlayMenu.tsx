"use client";

import { useEffect, useRef } from "react";
import LocaleLink from "./LocaleLink";
import { useTranslation } from "./I18nProvider";

interface NavOverlayMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NavOverlayMenu({ isOpen, onClose }: NavOverlayMenuProps) {
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const navLinks = [
        { href: "/", label: t("nav.home") },
        { href: "/#destinations", label: t("nav.destinations") },
        { href: "/#ships", label: t("nav.ships") },
        { href: "/#promos", label: t("nav.offers") },
        { href: "/activities", label: t("nav.activities") },
        { href: "/about", label: t("nav.about") },
        { href: "/contact", label: t("nav.contact") },
    ];

    return (
        <div
            className={`fixed inset-0 z-[100] transition-all duration-500 ${
                isOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Menu Content */}
            <div
                ref={menuRef}
                className={`absolute inset-y-0 left-0 w-full max-w-md bg-[#12214a] transform transition-transform duration-500 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white hover:opacity-70 transition-opacity"
                    aria-label="Close menu"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Logo */}
                <div className="pt-20 px-10">
                    <h2 className="font-canto text-4xl text-white tracking-widest">SEASVOYAGE</h2>
                </div>

                {/* Navigation Links */}
                <nav className="mt-12 px-10">
                    <ul className="space-y-6">
                        {navLinks.map((link, idx) => (
                            <li key={link.href}>
                                <LocaleLink
                                    href={link.href}
                                    onClick={onClose}
                                    className="block font-canto text-3xl text-white hover:text-white/70 transition-colors"
                                    style={{
                                        animationDelay: `${idx * 50}ms`,
                                    }}
                                >
                                    {link.label}
                                </LocaleLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-10 left-10 right-10">
                    <div className="border-t border-white/30 pt-6">
                        <div className="flex items-center gap-6">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-70 transition-opacity">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:opacity-70 transition-opacity">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
