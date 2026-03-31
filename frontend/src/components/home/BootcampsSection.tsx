"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight, Code2, Brain, Palette } from "lucide-react";
import { useBootcamps } from "@/hooks/useBootcamps";
import { useTrainingPrograms } from "@/hooks/useTrainingPrograms";
import bootcampScene from "@/assets/bootcamp-scene.jpg";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = {
  Code2,
  Brain,
  Palette,
};

export const BootcampsSection = () => {
  const { bootcamps, isLoading: bootcampsLoading } = useBootcamps();
  const { programs } = useTrainingPrograms();
  const displayBootcamps = bootcamps.slice(0, 3);

  return (
    <section className="py-12 md:py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left - Image */}
          <div className="relative order-2 lg:order-1">
            <Image
              src={bootcampScene}
              alt="Bootcamp learning environment"
              className="rounded-xl md:rounded-2xl shadow-lg w-full"
              priority
            />
            <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 bg-card border border-border rounded-lg md:rounded-xl p-3 md:p-4 shadow-card">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-3 rounded-lg bg-primary text-primary-foreground">
                  <Users className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-bold text-foreground">500+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Bootcamp Alumni</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <span className="text-primary font-semibold mb-3 md:mb-4 block text-xs md:text-sm uppercase tracking-wide">
              Bootcamps & Programs
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-foreground leading-tight">
              High-Impact Bootcamps for{" "}
              <span className="text-primary">Real-World Readiness</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8">
              Intensive programs built to replicate real job experiences with
              mentorship, collaboration, and outcome-based learning.
            </p>

            {/* Bootcamp Cards */}
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {bootcampsLoading ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 md:p-4 rounded-lg md:rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <Skeleton className="h-9 w-9 md:h-11 md:w-11 rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 md:h-5 w-2/3 mb-2" />
                        <Skeleton className="h-3 md:h-4 w-full mb-2 md:mb-3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : displayBootcamps.length > 0 ? (
                displayBootcamps.map((bootcamp) => {
                  const IconComponent = iconMap[bootcamp.icon_name || "Code2"] || Code2;
                  return (
                    <Link
                      href={`/bootcamps/${bootcamp.slug}`}
                      key={bootcamp.id}
                      className="group block p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {bootcamp.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {bootcamp.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {bootcamp.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {bootcamp.duration}
                              </span>
                            )}
                            {bootcamp.batch_size && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {bootcamp.batch_size} students
                              </span>
                            )}
                            {bootcamp.next_batch_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(bootcamp.next_batch_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No bootcamps available
                </p>
              )}
            </div>

            {/* Training Programs Preview */}
            {programs.length > 0 && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg md:rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs md:text-sm font-medium text-foreground mb-2">
                  Plus {programs.length} Training Programs:
                </p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {programs.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-card border border-border rounded-full text-muted-foreground"
                    >
                      {p.domain || p.category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/bootcamps">
                View All Programs
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
