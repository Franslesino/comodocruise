"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ItineraryItem } from "@/types/api";
import { formatPrice } from "@/lib/api";
import { CONTACT_INFO } from "@/config/contact";

const PREFIXES = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];

const COUNTRY_CODES = [
    { code: "+62", flag: "🇮🇩", name: "ID" },
    { code: "+1",  flag: "🇺🇸", name: "US" },
    { code: "+44", flag: "🇬🇧", name: "GB" },
    { code: "+61", flag: "🇦🇺", name: "AU" },
    { code: "+65", flag: "🇸🇬", name: "SG" },
    { code: "+60", flag: "🇲🇾", name: "MY" },
    { code: "+81", flag: "🇯🇵", name: "JP" },
    { code: "+86", flag: "🇨🇳", name: "CN" },
    { code: "+82", flag: "🇰🇷", name: "KR" },
    { code: "+49", flag: "🇩🇪", name: "DE" },
    { code: "+33", flag: "🇫🇷", name: "FR" },
    { code: "+31", flag: "🇳🇱", name: "NL" },
];

interface BookingFormProps {
    items: ItineraryItem[];
    onClose?: () => void;
    onBack?: () => void;
    onClearItinerary: () => void;
    mode?: "modal" | "page";
}

function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BookingForm({ items, onClose, onBack, onClearItinerary, mode = "modal" }: BookingFormProps) {
    const router = useRouter();
    // Guest info
    const [prefix, setPrefix] = useState("Mr.");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [stateProvince, setStateProvince] = useState("");
    const [country, setCountry] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [specialRequests, setSpecialRequests] = useState("");
    const [newsletter, setNewsletter] = useState(false);
    const [consent, setConsent] = useState(false);

    // Payment & state
    const [paymentType, setPaymentType] = useState<"full" | "down">("full");
    const [submitted, setSubmitted] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showAddressFields, setShowAddressFields] = useState(false);

    const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const totalGuests = items.reduce((sum, item) => sum + item.guests, 0);
    const estimatedTotal = total > 0 ? formatPrice(total) : "Price on request";

    const isFormValid = !!(firstName.trim() && lastName.trim() && email.trim() && phone.trim() && consent);

    const buildWhatsAppMessage = () => {
        const payLabel = paymentType === "full" ? "Full Payment" : "Down Payment";
        const header = `*New Booking Request — Comodo Cruise*\n\n`;
        const personal = `*Guest Information:*\n${prefix} ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${countryCode.code} ${phone}\n${country ? `Country: ${country}\n` : ""}${address ? `Address: ${address}, ${city}${stateProvince ? ", " + stateProvince : ""} ${zipCode}\n` : ""}`;
        const itinerary = `\n*Itinerary:*\n${items.map((item, i) =>
            `${i + 1}. ${item.ship} — ${item.cabin}\n   Date: ${formatDateDisplay(item.date)}\n   Guests: ${item.guests}${item.price > 0 ? `\n   Price: ${formatPrice(item.price)}/night` : ""}`
        ).join("\n\n")}`;
        const summary = `\n\nTotal Cabins: ${items.length} | Total Guests: ${totalGuests}`;
        const totalLine = total > 0 ? `\nEst. Total: ${formatPrice(total)}` : "\nTotal: Price on request";
        const payment = `\nPayment Type: ${payLabel}`;
        const notes = specialRequests ? `\n\n*Special Requests:*\n${specialRequests}` : "";
        return header + personal + itinerary + summary + totalLine + payment + notes;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        const msg = buildWhatsAppMessage();
        window.open(`${CONTACT_INFO.whatsapp.url}?text=${encodeURIComponent(msg)}`, "_blank");
        setSubmitted(true);
    };

    const handleDone = () => {
        onClearItinerary();
        if (mode === "page") {
            router.push("/cruises");
        } else {
            onClose?.();
        }
    };

    const handleBack = () => {
        if (onBack) { onBack(); return; }
        if (mode === "page") { router.back(); } else { onClose?.(); }
    };

    const content = (
        <div className={mode === "page" ? "bkf-page" : "bkf-modal"} onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="bkf-header">
                    {mode === "page" ? (
                        <button className="bkf-back-btn" onClick={handleBack} aria-label="Go back">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                            <span>Back to results</span>
                        </button>
                    ) : (
                        <span className="bkf-header-title">Complete Your Booking</span>
                    )}
                    {mode === "modal" && (
                        <button className="bkf-close-btn" onClick={onClose} aria-label="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    )}
                </div>

                {submitted ? (
                    /* ── Success ── */
                    <div className="bkf-success">
                        <div className="bkf-success-icon">
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        </div>
                        <h2 className="bkf-success-title">Request Sent!</h2>
                        <p className="bkf-success-desc">
                            Thank you, <strong>{prefix} {firstName} {lastName}</strong>. Your booking request has been forwarded via WhatsApp. Our team will contact you at <strong>{countryCode.code} {phone}</strong> within 24 hours.
                        </p>
                        <div className="bkf-success-actions">
                            <button className="bkf-btn-primary" onClick={handleDone}>Done</button>
                            <button className="bkf-btn-ghost" onClick={handleBack}>Keep Browsing</button>
                        </div>
                    </div>
                ) : (
                    <form className="bkf-body" onSubmit={handleSubmit}>

                        {/* ════ LEFT — Guest Information ════ */}
                        <div className="bkf-left">
                            <h2 className="bkf-section-heading">Guest Information</h2>

                            {/* Prefix */}
                            <div className="bkf-field">
                                <label className="bkf-label">PREFIX</label>
                                <select className="bkf-select" value={prefix} onChange={e => setPrefix(e.target.value)}>
                                    {PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            {/* Name row */}
                            <div className="bkf-row">
                                <div className="bkf-field">
                                    <label className="bkf-label">FIRST NAME <span className="bkf-required">*</span></label>
                                    <input className="bkf-input" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                                </div>
                                <div className="bkf-field">
                                    <label className="bkf-label">LAST NAME <span className="bkf-required">*</span></label>
                                    <input className="bkf-input" type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="bkf-field">
                                <label className="bkf-label">PHONE <span className="bkf-required">*</span></label>
                                <div className="bkf-phone-row">
                                    <div style={{ position: "relative" }}>
                                        <button type="button" className="bkf-country-btn" onClick={() => setShowCountryDropdown(v => !v)}>
                                            <span>{countryCode.flag}</span>
                                            <span className="bkf-country-code">{countryCode.code}</span>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                        </button>
                                        {showCountryDropdown && (
                                            <div className="bkf-country-dropdown">
                                                {COUNTRY_CODES.map(cc => (
                                                    <button key={cc.name} type="button" className={`bkf-country-option ${cc.code === countryCode.code ? "active" : ""}`} onClick={() => { setCountryCode(cc); setShowCountryDropdown(false); }}>
                                                        <span>{cc.flag}</span>
                                                        <span>{cc.name}</span>
                                                        <span className="bkf-option-code">{cc.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input className="bkf-input bkf-phone-input" type="tel" placeholder="812 3456 7890" value={phone} onChange={e => setPhone(e.target.value)} required />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="bkf-field">
                                <label className="bkf-label">EMAIL <span className="bkf-required">*</span></label>
                                <input className="bkf-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                <span className="bkf-hint">The email address to which we will send your confirmation.</span>
                            </div>

                            {/* Address (collapsible) */}
                            <div className="bkf-field">
                                <button type="button" className="bkf-address-toggle" onClick={() => setShowAddressFields(v => !v)}>
                                    <span>ADDRESS</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showAddressFields ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </button>
                            </div>

                            {showAddressFields && (
                                <>
                                    <div className="bkf-field">
                                        <label className="bkf-label">ADDRESS</label>
                                        <input className="bkf-input" type="text" placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} />
                                    </div>
                                    <div className="bkf-row">
                                        <div className="bkf-field">
                                            <label className="bkf-label">CITY</label>
                                            <input className="bkf-input" type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                                        </div>
                                        <div className="bkf-field">
                                            <label className="bkf-label">STATE / PROVINCE</label>
                                            <input className="bkf-input" type="text" placeholder="State" value={stateProvince} onChange={e => setStateProvince(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="bkf-row">
                                        <div className="bkf-field">
                                            <label className="bkf-label">COUNTRY / REGION</label>
                                            <input className="bkf-input" type="text" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
                                        </div>
                                        <div className="bkf-field">
                                            <label className="bkf-label">ZIP / POSTAL CODE</label>
                                            <input className="bkf-input" type="text" placeholder="ZIP" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Additional Info */}
                            <div className="bkf-section-divider">
                                <span>Additional Information</span>
                            </div>

                            <div className="bkf-field">
                                <label className="bkf-label">SPECIAL REQUESTS</label>
                                <textarea className="bkf-textarea" rows={3} placeholder="Dietary requirements, accessibility needs, cabin preferences…" value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} />
                            </div>

                            {/* Checkboxes */}
                            <div className="bkf-checkbox-group">
                                <label className="bkf-checkbox-label">
                                    <input type="checkbox" className="bkf-checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
                                    <span>Sign up to receive news and offers from Comodo Cruise</span>
                                </label>
                                <label className="bkf-checkbox-label">
                                    <input type="checkbox" className="bkf-checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />
                                    <span>I consent to my submitted data being collected and stored <span className="bkf-required">*</span></span>
                                </label>
                            </div>
                        </div>

                        {/* ════ RIGHT — Itinerary + Payment ════ */}
                        <div className="bkf-right">

                            {/* Itinerary */}
                            <div className="bkf-itinerary-box">
                                <h2 className="bkf-section-heading">Your Itinerary</h2>
                                <p className="bkf-itinerary-note">This is a summary of the accommodation you have selected.</p>

                                {items.length === 0 ? (
                                    <p className="bkf-empty">You haven&#39;t selected any options yet.</p>
                                ) : (
                                    <div className="bkf-itinerary-items">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="bkf-itinerary-item">
                                                <div className="bkf-itin-index">{idx + 1}</div>
                                                <div className="bkf-itin-details">
                                                    <span className="bkf-itin-ship">{item.ship}</span>
                                                    <span className="bkf-itin-cabin">{item.cabin}</span>
                                                    <div className="bkf-itin-meta">
                                                        <span>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                            {formatDateDisplay(item.date)}
                                                        </span>
                                                        <span>
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                                            {item.guests} {item.guests === 1 ? "guest" : "guests"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.price > 0 && (
                                                    <div className="bkf-itin-price">
                                                        {formatPrice(item.price)}<span>/night</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Est. Total */}
                                <div className="bkf-est-total">
                                    <span className="bkf-est-label">EST. TOTAL</span>
                                    <span className="bkf-est-value">{estimatedTotal}</span>
                                    <span className="bkf-est-tax">(Tax Included)</span>
                                </div>
                            </div>

                            {/* Payment Type */}
                            <div className="bkf-payment-box">
                                <h2 className="bkf-section-heading">Payment Type</h2>
                                <div className="bkf-payment-options">
                                    <button
                                        type="button"
                                        className={`bkf-payment-option ${paymentType === "full" ? "active" : ""}`}
                                        onClick={() => setPaymentType("full")}
                                    >
                                        <span className="bkf-pay-type">FULL PAYMENT</span>
                                        <span className="bkf-pay-amount">{estimatedTotal}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`bkf-payment-option ${paymentType === "down" ? "active" : ""}`}
                                        onClick={() => setPaymentType("down")}
                                    >
                                        <span className="bkf-pay-type">DOWN PAYMENT</span>
                                        <span className="bkf-pay-amount">{total > 0 ? `From ${formatPrice(total * 0.3)}` : "Price on request"}</span>
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className={`bkf-confirm-btn ${!isFormValid ? "disabled" : ""}`}
                                    disabled={!isFormValid}
                                >
                                    CONFIRM BOOKING
                                </button>

                                {!isFormValid && (
                                    <p className="bkf-validation-hint">
                                        Please fill in all required fields and accept the data consent to continue.
                                    </p>
                                )}

                                <div className="bkf-brand-footer">
                                    <span className="bkf-brand-name">KOMODOCRUISES</span>
                                    <span className="bkf-brand-tagline">Rare journeys across the Togean &amp; Komodo Islands.</span>
                                    <div className="bkf-brand-contact">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.587 3.842 1.598 5.395L2 22l4.74-1.559A9.945 9.945 0 0011.999 22C17.522 22 22 17.522 22 12S17.522 2 11.999 2zm0 18c-1.729 0-3.34-.494-4.7-1.348l-.338-.2-3.499 1.15 1.173-3.4-.22-.35A7.967 7.967 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
                                        <a href={CONTACT_INFO.whatsapp.url} target="_blank" rel="noopener noreferrer">{CONTACT_INFO.whatsapp.display}</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
        </div>
    );

    return mode === "modal"
        ? <div className="bkf-overlay" onClick={onClose}>{content}</div>
        : content;
}
