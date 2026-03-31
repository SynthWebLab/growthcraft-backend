"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { TechLogosStrip } from "@/components/common/TechLogos";
import heroLearning from "@/assets/hero-learning.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroLearning}
          alt="Modern tech learning environment"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/80" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-8 md:py-0">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary      text-foreground text-xs md:text-sm font-medium mb-4 md:mb-6 animate-fade-up"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Your Career Transformation Starts Here
          </div>

          {/* Headline */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 animate-fade-up text-foreground leading-tight"
            style={{ animationDelay: "0.1s" }}
          >
            Where{" "}
            <span className="text-primary">Learning</span>{" "}
            Meets{" "}
            <span className="text-primary">Opportunity</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            GrowthCraft is your all-in-one platform to learn tech, master
            industry skills, join hands-on bootcamps, connect with mentors, and
            land your dream job.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
              <Link href="/courses">
                Explore Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="w-full sm:w-auto">
              <Link href="/bootcamps">
                <Play className="mr-2 h-5 w-5" />
                Join a Bootcamp
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div
            className="mt-8 md:mt-12 grid grid-cols-3 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-border animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="text-center sm:text-left">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                5000+
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Students Trained
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                50+
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                College Partners
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                100+
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Hiring Partners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Logos Strip at bottom - hidden on small screens */}
      {/* <div className="hidden md:block absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border"> */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm ">
        <div className="container mx-auto px-4">
          <TechLogosStrip />
        </div>
      </div>
    </section>
  );
};
