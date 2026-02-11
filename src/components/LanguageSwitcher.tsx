"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname, localizePath, ALL_LOCALES, LOCALE_NAMES, Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
    variant?: "light" | "dark";
}

export default function LanguageSwitcher({ variant = "dark" }: LanguageSwitcherProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLocale = getLocaleFromPathname(pathname);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocaleChange = (locale: Locale) => {
        const newPath = localizePath(pathname, locale);
        router.push(newPath);
        setIsOpen(false);
    };

    const textColor = variant === "light" ? "text-white" : "text-neutral-900";

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${textColor} transition-colors font-avenir text-sm font-medium`}
            >
                <span className="uppercase">{currentLocale}</span>
                <svg 
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                    {ALL_LOCALES.map((locale) => (
                        <button
                            key={locale}
                            onClick={() => handleLocaleChange(locale)}
                            className={`w-full text-left px-4 py-2.5 font-avenir text-sm transition-colors ${
                                locale === currentLocale 
                                    ? "bg-sky-50 text-sky-600 font-medium" 
                                    : "text-neutral-700 hover:bg-gray-50"
                            }`}
                        >
                            <span className="uppercase font-medium mr-2">{locale}</span>
                            <span className="text-neutral-500">{LOCALE_NAMES[locale]}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
