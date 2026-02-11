"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n";
import { ComponentProps } from "react";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
    href: string;
};

/**
 * LocaleLink - A wrapper around Next.js Link that automatically adds locale prefix
 */
export default function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
    const pathname = usePathname();
    const locale = getLocaleFromPathname(pathname);
    const localizedHref = localizePath(href, locale);

    return (
        <Link href={localizedHref} {...props}>
            {children}
        </Link>
    );
}
