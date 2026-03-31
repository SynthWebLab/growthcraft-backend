import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { CourseCategories } from "@/components/home/CourseCategories";
import { BootcampsSection } from "@/components/home/BootcampsSection";
import { AudienceSection } from "@/components/home/AudienceSection";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <CourseCategories />
      <BootcampsSection />
      <AudienceSection />
      <PhilosophySection />
      <NewsletterSection />
    </>
  );
}
