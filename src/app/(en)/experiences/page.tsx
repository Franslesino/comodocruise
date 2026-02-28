import { Metadata } from "next";
import ExperiencesPage from "@/components/ExperiencesPage";

export const metadata: Metadata = {
    title: "Experiences - KOMODOCRUISES",
    description: "Discover 12+ unforgettable experiences on our Indonesian liveaboard cruises — diving, trekking, wildlife encounters, cultural immersion, and more.",
};

export default function ActivitiesPage() {
    return <ExperiencesPage />;
}