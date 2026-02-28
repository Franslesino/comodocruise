"use client";

import { CONTACT_INFO } from "@/config/contact";
import { useTranslation } from "./I18nProvider";
import LocaleLink from "./LocaleLink";

export default function FooterSection() {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#12214a] text-white pt-8 pb-6 md:pt-10 md:pb-8">
            <div className="mx-auto px-6 md:px-12 max-w-[1280px]">
                {/* Top Row: Logo */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-10">
                    <div className="relative w-[140px] md:w-[200px] lg:w-[280px] h-auto flex flex-col justify-center items-start">
                        <h2 className="font-canto text-4xl md:text-5xl lg:text-5xl text-white tracking-widest leading-none">
                            KOMODOCRUISES
                        </h2>
                    </div>
                    <div className="hidden md:block w-full max-w-md"></div>
                </div>

                {/* Bottom Row: 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
                    {/* Column A: Brand Info */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <h3 className="font-canto text-2xl lg:text-3xl mb-4 text-white">
                            {t("footer.brandName")}
                        </h3>
                        <p className="font-avenir text-base leading-relaxed text-white/80 max-w-sm">
                            {t("footer.brandDescription")}
                        </p>
                    </div>

                    {/* Column B: Quick Links */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <h3 className="font-canto text-2xl lg:text-3xl mb-4 text-white">
                            {t("footer.quickLinks")}
                        </h3>
                        <ul className="font-avenir space-y-2 text-base text-white/80">
                            <li>
                                <LocaleLink href="/destinations" className="hover:text-white transition-colors">
                                    {t("nav.destinations")}
                                </LocaleLink>
                            </li>
                            <li>
                                <LocaleLink href="/ships" className="hover:text-white transition-colors">
                                    {t("nav.ships")}
                                </LocaleLink>
                            </li>
                            <li>
                                <LocaleLink href="/experiences" className="hover:text-white transition-colors">
                                    {t("nav.activities") || "Experiences"}
                                </LocaleLink>
                            </li>
                            <li>
                                <LocaleLink href="/about" className="hover:text-white transition-colors">
                                    {t("nav.about")}
                                </LocaleLink>
                            </li>
                        </ul>
                    </div>

                    {/* Column C: Contact Us */}
                    <div className="md:col-span-4 lg:col-span-4">
                        <h3 className="font-canto text-2xl lg:text-3xl mb-4 text-white">
                            {t("footer.contactTitle")}
                        </h3>
                        <ul className="font-avenir space-y-3 text-base text-white/80">
                            {/* WhatsApp */}
                            <li className="flex items-center gap-3">
                                <span className="shrink-0 w-5 flex justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </span>
                                <a href={CONTACT_INFO.whatsapp.url} className="hover:text-white transition-colors">
                                    {CONTACT_INFO.whatsapp.display}
                                </a>
                            </li>

                            {/* Email */}
                            <li className="flex items-center gap-3">
                                <span className="shrink-0 w-5 flex justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </span>
                                <a href={CONTACT_INFO.email.url} className="hover:text-white transition-colors">
                                    {CONTACT_INFO.email.address}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/20 mt-8 pt-6 text-center">
                    <p className="font-avenir text-sm text-white/60">
                        © {new Date().getFullYear()} KOMODOCRUISES. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
