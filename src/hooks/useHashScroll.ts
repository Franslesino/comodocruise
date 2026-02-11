"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * useHashScroll - Smooth scroll to hash target on navigation
 */
export function useHashScroll() {
    const pathname = usePathname();

    useEffect(() => {
        // Check if there's a hash in the URL
        const hash = window.location.hash;
        if (hash) {
            // Remove the # symbol
            const targetId = hash.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            }
        }
    }, [pathname]);
}
