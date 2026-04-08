"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import {
  Clock,
  BookOpen,
  ArrowRight,
  Star,
  CheckCircle,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PopupForm } from "@/components/common/PopupForm";
import { TechLogos } from "@/components/common/TechLogos";
import { Skeleton } from "@/components/ui/skeleton";
import courseWebDev from "@/assets/course-web-dev.jpg";
import courseDataScience from "@/assets/course-data-science.jpg";
import courseCloud from "@/assets/course-cloud.jpg";
import courseMobile from "@/assets/course-mobile.jpg";
import courseSecurity from "@/assets/course-security.jpg";

const categoryImages: Record<string, StaticImageData> = {
  "Web Development": courseWebDev,
  "Programming Languages": courseWebDev,
  "Data Science & AI": courseDataScience,
  "Cloud & DevOps": courseCloud,
  "Mobile Development": courseMobile,
  Cybersecurity: courseSecurity,
  Design: courseWebDev,
};

// Mock data - replace with actual API calls
const mockCourses = [
  {
    id: 1,
    slug: "full-stack-development",
    title: "Full Stack Development Bootcamp",
    category: "Web Development",
    subcategory: "Full Stack",
    level: "Intermediate",
    duration: "12 weeks",
    price: 29999,
    discount_price: 19999,
    image_url: courseWebDev as StaticImageData | string,
    topics: ["React", "Node.js", "MongoDB", "Express"],
  },
  {
    id: 2,
    slug: "data-science-ai",
    title: "Data Science & AI Bootcamp",
    category: "Data Science & AI",
    subcategory: "Machine Learning",
    level: "Advanced",
    duration: "16 weeks",
    price: 39999,
    discount_price: 29999,
    image_url: courseDataScience as StaticImageData | string,
    topics: ["Python", "TensorFlow", "Pandas", "Scikit-learn"],
  },
  {
    id: 3,
    slug: "react-developer",
    title: "Complete React Developer",
    category: "Web Development",
    subcategory: "Frontend",
    level: "Beginner",
    duration: "8 weeks",
    price: 14999,
    discount_price: 9999,
    image_url: courseWebDev as StaticImageData | string,
    topics: ["React", "Redux", "Hooks", "TypeScript"],
  },
  {
    id: 4,
    slug: "aws-cloud",
    title: "AWS Cloud Practitioner",
    category: "Cloud & DevOps",
    subcategory: "Cloud Computing",
    level: "Beginner",
    duration: "6 weeks",
    price: 12999,
    discount_price: 7999,
    image_url: courseCloud as StaticImageData | string,
    topics: ["AWS", "EC2", "S3", "Lambda"],
  },
  {
    id: 5,
    slug: "mobile-app-development",
    title: "Mobile App Development with React Native",
    category: "Mobile Development",
    subcategory: "Cross-Platform",
    level: "Intermediate",
    duration: "10 weeks",
    price: 24999,
    discount_price: 16999,
    image_url: courseMobile as StaticImageData | string,
    topics: ["React Native", "iOS", "Android", "Firebase"],
  },
  {
    id: 6,
    slug: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    category: "Cybersecurity",
    subcategory: "Security",
    level: "Beginner",
    duration: "8 weeks",
    price: 18999,
    discount_price: 12999,
    image_url: courseSecurity as StaticImageData | string,
    topics: [
      "Network Security",
      "Ethical Hacking",
      "Cryptography",
      "Penetration Testing",
    ],
  },
];

const mockCategories = [
  { name: "Web Development", count: 45 },
  { name: "Data Science & AI", count: 32 },
  { name: "Cloud & DevOps", count: 28 },
  { name: "Mobile Development", count: 18 },
  { name: "Cybersecurity", count: 15 },
  { name: "Design", count: 22 },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "Beginner":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "Advanced":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isLoading] = useState(false);

  const courses = mockCourses;
  const categories = mockCategories;

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      !selectedCategory || course.category === selectedCategory;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.topics &&
        course.topics.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase()),
        ));
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const handleEnroll = (courseName: string) => {
    setSelectedCourse(courseName);
    setShowEnrollForm(true);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-primary font-semibold mb-3 md:mb-4 block text-xs md:text-sm uppercase tracking-wide">
              Course Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 md:mb-6 text-foreground leading-tight">
              {courses.length}+ Courses to Power Your{" "}
              <span className="text-primary">Tech Career</span>
            </h1>
            <p className="text-sm md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 px-2">
              From Python basics to advanced AI, from frontend to DevOps —
              master in-demand skills with our comprehensive course library.
            </p>
            <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span>{courses.length}+ Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span>4.8 Avg Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TechLogos />

      {/* Search & Filters */}
      <section className="py-4 md:py-8 border-b border-border sticky top-16 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses, topics, tools..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    setSelectedLevel(selectedLevel === level ? null : level)
                  }
                  className={`cursor-pointer px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                    selectedLevel === level
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {level}
                </button>
              ))}
              {(selectedCategory || selectedLevel || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedLevel(null);
                    setSearchQuery("");
                  }}
                  className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 md:py-8 border-b border-border overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-2 pb-2 md:pb-0">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name ? null : category.name,
                  )
                }
                className={`cursor-pointer flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category.name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span
                  className={
                    selectedCategory === category.name
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }
                >
                  ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-2">
            <h2 className="text-lg md:text-2xl font-bold text-foreground">
              {selectedCategory || "All Courses"}
              <span className="text-muted-foreground font-normal ml-2 text-sm md:text-base">
                ({filteredCourses.length})
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <Skeleton className="h-28 md:h-32 w-full" />
                  <div className="p-3 md:p-4">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-3 w-1/2 mb-3" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredCourses.map((course) => (
                <Link
                  href={`/courses/${course.slug}`}
                  key={course.id}
                  className="group rounded-xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-28 md:h-32 overflow-hidden relative">
                    <Image
                      src={
                        course.image_url ||
                        categoryImages[course.category] ||
                        courseWebDev
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      width={400}
                      height={200}
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${getLevelColor(course.level || "Beginner")}`}
                    >
                      {course.level}
                    </span>
                  </div>
                  <div className="p-3 md:p-4">
                    <span className="text-[10px] md:text-xs text-primary font-medium">
                      {course.subcategory || course.category}
                    </span>
                    <h3 className="text-xs md:text-sm font-bold mt-1 mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration || "Self-paced"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                      {course.topics?.slice(0, 2).map((topic) => (
                        <span
                          key={topic}
                          className="px-1.5 md:px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[8px] md:text-[10px]"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics && course.topics.length > 2 && (
                        <span className="px-1.5 md:px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[8px] md:text-[10px]">
                          +{course.topics.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {course.price ? (
                        <span className="text-xs md:text-sm font-bold text-primary">
                          ₹{course.discount_price || course.price}
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm font-bold text-primary">
                          Free
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-4"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEnroll(course.title);
                        }}
                      >
                        Enroll
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                No courses found matching your criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedLevel(null);
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-12 text-foreground">
              What You Get With Every Course
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                "Lifetime access to course content",
                "Real-world projects & assignments",
                "Certificate of completion",
                "Mentor support & Q&A",
                "Downloadable resources",
                "Community access",
                "Job placement assistance",
                "Industry-recognized curriculum",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-card border border-border"
                >
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm md:text-base">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 text-foreground">
              Not sure where to start?
            </h2>
            <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
              Talk to our career counselors and get personalized course
              recommendations based on your goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto cursor-pointer"
                onClick={() => setShowEnrollForm(true)}
              >
                Get Career Guidance <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/for-students">Explore Student Programs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PopupForm
        isOpen={showEnrollForm}
        onClose={() => setShowEnrollForm(false)}
        type="enrollment"
        title={
          selectedCourse ? `Enroll in ${selectedCourse}` : "Course Enrollment"
        }
      />
    </>
  );
}
