"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GraduationCap, School, Hand, UserCheck, Briefcase, ArrowRight } from "lucide-react";
import collegeStudents from "@/assets/college-students.jpg";
import mentorScene from "@/assets/mentor-scene.jpg";
import employerScene from "@/assets/employer-scene.jpg";

const audiences = [
  {
    icon: GraduationCap,
    role: "Students",
    title: "GrowthCraft Seeker",
    description: "Learn, build, and launch your tech career with industry-relevant courses and hands-on projects.",
    cta: "Start Learning",
    link: "/for-students",
    image: collegeStudents,
  },
  {
    icon: School,
    role: "Colleges",
    title: "GrowthCraft Campus",
    description: "Partner with us for integrated learning, workshops, and bootcamps on your campus.",
    cta: "Partner With Us",
    link: "/for-colleges",
    image: null,
  },
  {
    icon: Hand,
    role: "Ambassadors",
    title: "GrowthCraft Ambassador",
    description: "Represent GrowthCraft on campus and grow your influence while helping peers succeed.",
    cta: "Apply Now",
    link: "/for-students",
    image: null,
  },
  {
    icon: UserCheck,
    role: "Mentors",
    title: "GrowthCraft Mentor",
    description: "Inspire the next wave of talent by sharing your experience and guiding learners.",
    cta: "Become a Mentor",
    link: "/for-mentors",
    image: mentorScene,
  },
  {
    icon: Briefcase,
    role: "Hiring Partners",
    title: "GrowthCraft Employer",
    description: "Recruit skilled, job-ready talent from our certified alumni pool.",
    cta: "Hire From Us",
    link: "/for-employers",
    image: employerScene,
  },
];

export const AudienceSection = () => {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold mb-4 block text-sm uppercase tracking-wide">
            For Everyone
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Different Paths.{" "}
            <span className="text-primary">One Platform.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            GrowthCraft empowers all stakeholders in the tech learning journey.
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <div
              key={audience.role}
              className={`group rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all duration-300 overflow-hidden ${
                index === 4 ? "lg:col-start-2" : ""
              }`}
            >
              {/* Image or Icon Header */}
              {audience.image ? (
                <div className="h-40 overflow-hidden relative">
                  <Image
                    src={audience.image}
                    alt={audience.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-28 bg-secondary/50 flex items-center justify-center">
                  <audience.icon className="h-12 w-12 text-primary/30" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <audience.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {audience.role}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {audience.description}
                </p>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                >
                  <Link href={audience.link}>
                    {audience.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
