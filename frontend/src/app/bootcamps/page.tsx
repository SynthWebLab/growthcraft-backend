"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { Calendar, Clock, Users, Video, CheckCircle, ArrowRight, Phone, Download } from "lucide-react";
import { PopupForm, usePopupForm } from "@/components/common/PopupForm";
import { useBootcamps } from "@/hooks/useBootcamps";
import { useTrainingPrograms } from "@/hooks/useTrainingPrograms";
import { Skeleton } from "@/components/ui/skeleton";
import bootcampGeneral from "@/assets/bootcamp-general.jpg";
import courseWebDev from "@/assets/course-web-dev.jpg";

const BootcampsPage = () => {
  const { isOpen, formType, formTitle, openForm, closeForm } = usePopupForm();
  const { bootcamps, isLoading: bootcampsLoading } = useBootcamps();
  const { programs, isLoading: programsLoading } = useTrainingPrograms();

  return (
    <>
      <PopupForm isOpen={isOpen} onClose={closeForm} type={formType} title={formTitle} />

      {/* Hero */}
      <section className="py-12 md:py-20 lg:py-28 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight">
              High-Impact Bootcamps for{" "}
              <span className="text-primary">Real-World Readiness</span>
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
              Intensive, structured programs built to replicate real job experiences with mentorship, collaboration, and outcome-based learning.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => openForm("enrollment", "Enroll in Bootcamp")}
              >
                Enroll Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => openForm("callback")}
              >
                <Phone className="mr-2 h-5 w-5" />
                Request Callback
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bootcamps List */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-primary font-semibold mb-3 md:mb-4 block text-xs md:text-sm uppercase tracking-wide">
              Intensive Programs
            </span>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground">
              Career-Focused <span className="text-primary">Bootcamps</span>
            </h2>
          </div>

          {bootcampsLoading ? (
            <div className="space-y-6 md:space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
                  <div className="flex flex-col lg:grid lg:grid-cols-4">
                    <Skeleton className="h-40 md:h-48 lg:h-auto" />
                    <div className="lg:col-span-2 p-4 md:p-6 lg:p-8">
                      <Skeleton className="h-6 md:h-8 w-2/3 mb-3 md:mb-4" />
                      <Skeleton className="h-4 w-full mb-3 md:mb-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="p-4 md:p-6">
                      <Skeleton className="h-8 w-1/2 mb-3 md:mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bootcamps.length > 0 ? (
            <div className="space-y-6 md:space-y-8">
              {bootcamps.map((bootcamp) => (
                <Link
                  href={`/bootcamps/${bootcamp.slug}`}
                  key={bootcamp.id}
                  className="block rounded-xl md:rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-card transition-all duration-300"
                >
                  <div className="flex flex-col lg:grid lg:grid-cols-4">
                    <div className="lg:col-span-1 h-40 md:h-48 lg:h-auto overflow-hidden relative">
                      <Image
                        src={bootcampGeneral}
                        alt={bootcamp.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="lg:col-span-2 p-4 md:p-6 lg:p-8">
                      <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2">
                        {bootcamp.title}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 line-clamp-2">
                        {bootcamp.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                        {bootcamp.duration && (
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <span className="truncate">{bootcamp.duration}</span>
                          </div>
                        )}
                        {bootcamp.format && (
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                            <Video className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <span className="truncate">{bootcamp.format}</span>
                          </div>
                        )}
                        {bootcamp.batch_size && (
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                            <Users className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <span className="truncate">{bootcamp.batch_size} students</span>
                          </div>
                        )}
                        {bootcamp.next_batch_date && (
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {new Date(bootcamp.next_batch_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {bootcamp.highlights?.slice(0, 2).map((h) => (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-secondary text-secondary-foreground"
                          >
                            <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" /> {h}
                          </span>
                        ))}
                        {bootcamp.highlights && bootcamp.highlights.length > 2 && (
                          <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-secondary text-secondary-foreground">
                            +{bootcamp.highlights.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1 lg:border-l border-t lg:border-t-0 border-border p-4 md:p-6 flex flex-row lg:flex-col justify-between lg:justify-center items-center lg:items-center text-center bg-muted/20 gap-4">
                      <div className="text-left lg:text-center">
                        {bootcamp.price ? (
                          <>
                            <span className="text-lg md:text-2xl font-bold text-primary">
                              ₹{bootcamp.discount_price || bootcamp.price}
                            </span>
                            {bootcamp.discount_price && (
                              <span className="text-xs md:text-sm text-muted-foreground line-through ml-2 lg:ml-0 lg:block">
                                ₹{bootcamp.price}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">Contact for pricing</span>
                        )}
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 lg:mb-4">
                          EMI available
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 w-auto lg:w-full">
                        <Button
                          variant="default"
                          size="default"
                          className="text-xs md:text-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            openForm("enrollment", `Enroll in ${bootcamp.title}`);
                          }}
                        >
                          Enroll Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hidden md:flex"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Download className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                          Syllabus
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 md:py-16">
              <p className="text-muted-foreground text-base md:text-lg mb-4">
                No bootcamps available at the moment.
              </p>
              <Button onClick={() => openForm("callback")}>Get Notified</Button>
            </div>
          )}
        </div>
      </section>

      {/* Training Programs */}
      <section className="py-10 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-primary font-semibold mb-3 md:mb-4 block text-xs md:text-sm uppercase tracking-wide">
              40-Day Internship Programs
            </span>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 text-foreground">
              Intensive <span className="text-primary">Training Programs</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Project-based internship programs designed to make you job-ready with real-world experience.
            </p>
          </div>

          {programsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl md:rounded-2xl bg-card border border-border p-4 md:p-6">
                  <Skeleton className="h-24 md:h-32 rounded-lg mb-3 md:mb-4" />
                  <Skeleton className="h-5 md:h-6 w-2/3 mb-2 md:mb-3" />
                  <Skeleton className="h-4 w-full mb-3 md:mb-4" />
                  <Skeleton className="h-9 md:h-10 w-full" />
                </div>
              ))}
            </div>
          ) : programs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
              {programs.map((program) => (
                <Link
                  href={`/programs/${program.slug}`}
                  key={program.id}
                  className="rounded-xl md:rounded-2xl bg-card border border-border p-4 md:p-6 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="h-24 md:h-32 rounded-lg overflow-hidden mb-3 md:mb-4 relative">
                    <Image
                      src={courseWebDev}
                      alt={program.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    <span className="text-xs md:text-sm font-medium text-primary">
                      {program.duration}
                    </span>
                    {program.domain && (
                      <span className="text-[10px] md:text-xs text-muted-foreground ml-auto truncate max-w-[80px] md:max-w-none">
                        {program.domain}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-3 text-foreground line-clamp-2">
                    {program.title}
                  </h3>

                  <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                    {program.focus_areas?.slice(0, 2).map((area) => (
                      <div
                        key={area}
                        className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary flex-shrink-0" />
                        <span className="line-clamp-1">{area}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                    {program.tech_stack?.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-1.5 md:px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] md:text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                    {program.tech_stack && program.tech_stack.length > 3 && (
                      <span className="px-1.5 md:px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] md:text-xs">
                        +{program.tech_stack.length - 3}
                      </span>
                    )}
                  </div>

                  <Button
                    className="w-full text-xs md:text-sm"
                    size="default"
                    onClick={(e) => {
                      e.preventDefault();
                      openForm("enrollment", `Apply for ${program.title}`);
                    }}
                  >
                    Apply Now <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 md:py-16">
              <p className="text-muted-foreground text-base md:text-lg">
                No training programs available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-primary-foreground leading-tight">
            Not Sure Which Program Is Right for You?
          </h2>
          <p className="text-primary-foreground/80 text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto px-2">
            Schedule a free counseling session with our team to understand your goals and find the perfect program for your career.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto"
              onClick={() => openForm("callback")}
            >
              Book Free Counseling
              <Phone className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              asChild
              // variant="outline"
              size="lg"
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto"
            >
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="py-10 md:py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-center">
            <Link
              href="/for-students"
              className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all group"
            >
              <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                For Students
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Student benefits & career support
              </p>
            </Link>
            <Link
              href="/for-colleges"
              className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all group"
            >
              <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                For Colleges
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Partner with us for campus programs
              </p>
            </Link>
            <Link
              href="/for-employers"
              className="p-4 md:p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all group"
            >
              <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                For Employers
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Hire our trained bootcamp graduates
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BootcampsPage;
