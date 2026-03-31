"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, BookOpen, Code2, Brain, Cloud, Palette, Shield, Smartphone } from "lucide-react";
import { useCourses, useCategories } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";
import courseFullstack from "@/assets/course-fullstack.jpg";
import courseDataScience from "@/assets/course-data-science.jpg";
import courseDevops from "@/assets/course-devops.jpg";
import courseMobile from "@/assets/course-mobile.jpg";
import courseSecurity from "@/assets/course-security.jpg";

// Map categories to actual images
const categoryImages: Record<string, any> = {
  "Web Development": courseFullstack,
  "Programming Languages": courseFullstack,
  "Data Science": courseDataScience,
  "Cloud Computing": courseDevops,
  "Mobile Development": courseMobile,
  "Cybersecurity": courseSecurity,
  "Design": courseFullstack,
};

const categoryIcons: Record<string, any> = {
  "Web Development": Code2,
  "Programming Languages": Code2,
  "Data Science": Brain,
  "Cloud Computing": Cloud,
  "Mobile Development": Smartphone,
  "Cybersecurity": Shield,
  "Design": Palette,
};

export const CourseCategories = () => {
  const { courses, isLoading } = useCourses();
  const categories = useCategories();
  const featuredCourses = courses.filter((c) => c.is_featured).slice(0, 6);

  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold mb-4 block text-sm uppercase tracking-wide">
            Course Categories
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            {courses.length}+ Courses Across{" "}
            <span className="text-primary">{categories.length} Domains</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From Python basics to advanced AI, from frontend to DevOps — master
            in-demand skills with our comprehensive curriculum.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <Skeleton className="h-28 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))
            : categories.slice(0, 8).map((category) => {
                const IconComponent = categoryIcons[category.name] || BookOpen;
                const categoryImage = categoryImages[category.name] || courseFullstack;
                return (
                  <Link
                    key={category.name}
                    href="/courses"
                    className="group rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="h-28 overflow-hidden bg-muted relative">
                      <Image
                        src={categoryImage}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {category.count} courses
                        </span>
                      </div>
                      <h3 className="text-sm font-bold mb-1 text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Featured Courses */}
        {featuredCourses.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Featured Courses
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCourses.map((course) => (
                <Link
                  href={`/courses/${course.slug}`}
                  key={course.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-all"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground mb-1 line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {course.subcategory || course.category}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration || "Self-paced"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          course.level === "Beginner"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : course.level === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {course.level}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/courses">
              Browse All {courses.length}+ Courses
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
