"use client";

import ShipDetail from "@/components/ShipDetail";

export default function ShipDetailContent({ slug }: { slug: string }) {
    return <ShipDetail slug={slug} />;
}
