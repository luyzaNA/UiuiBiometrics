import HeroSection from "@/pages/Home/sections/hero-section.tsx";
import ProcessSection from "@/pages/Home/sections/process-section.tsx";
import FeaturesSection from "@/pages/Home/sections/features-section.tsx";
import MonitoringSection from "@/pages/Home/sections/monitoring-section.tsx";
import MannequinSection from "@/pages/Home/sections/mannequin-section.tsx";

export default function HomePage() {
    return (
        <div className="block">
            <HeroSection></HeroSection>
            <ProcessSection></ProcessSection>
            <MannequinSection></MannequinSection>
            <FeaturesSection></FeaturesSection>
            <MonitoringSection></MonitoringSection>
        </div>
    )
}