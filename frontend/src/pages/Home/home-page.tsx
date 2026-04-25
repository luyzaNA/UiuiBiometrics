import HeroSection from "@/pages/Home/sections/hero-section.tsx";
import ProcessSection from "@/pages/Home/sections/process-section.tsx";

export default function HomePage() {
    return (
        <div className="block">
            <HeroSection></HeroSection>
            <ProcessSection></ProcessSection>
        </div>
    )
}