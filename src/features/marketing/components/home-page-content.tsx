import { AboutUsSection } from "@/features/marketing/components/about-us-section";
import { HomeHeroSection } from "@/features/marketing/components/home-hero-section";
import { WhyBrokeTogetherSection } from "@/features/marketing/components/why-broke-together-section";

export function HomePageContent() {
  return (
    <main className="bg-stone-50 text-zinc-900">
      <HomeHeroSection />
      <WhyBrokeTogetherSection />
      <AboutUsSection />
    </main>
  );
}
