import { useState, useEffect } from "react";

export interface Course {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  duration: string | null;
  level: string | null;
  price: number | null;
  discount_price: number | null;
  discount_label: string | null;
  image_url: string | null;
  format: string | null;
  topics: string[];
  highlights: string[];
  curriculum: unknown;
  prerequisites: string[];
  learning_outcomes: string[];
  instructor_name: string | null;
  instructor_bio: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

// Dummy data for development
const DUMMY_COURSES: Course[] = [
  {
    id: "1",
    title: "Full Stack Web Development Bootcamp",
    slug: "full-stack-web-development",
    category: "Web Development",
    subcategory: "Full Stack",
    description:
      "Master modern web development with React, Node.js, and MongoDB",
    duration: "12 weeks",
    level: "Beginner to Advanced",
    price: 15999,
    discount_price: 12999,
    discount_label: "20% OFF",
    image_url: "/courses/web-dev.jpg",
    format: "Online + Live Sessions",
    topics: ["React", "Node.js", "MongoDB", "TypeScript", "Next.js"],
    highlights: ["Live projects", "1-on-1 mentorship", "Job placement support"],
    curriculum: {},
    prerequisites: ["Basic HTML/CSS", "JavaScript fundamentals"],
    learning_outcomes: [
      "Build full-stack applications",
      "Deploy to production",
      "Work with databases",
    ],
    instructor_name: "Rajesh Kumar",
    instructor_bio: "10+ years experience in web development",
    is_published: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Data Science & Machine Learning",
    slug: "data-science-machine-learning",
    category: "Data Science",
    subcategory: "Machine Learning",
    description:
      "Learn Python, ML algorithms, and build real-world AI projects",
    duration: "16 weeks",
    level: "Intermediate",
    price: 18999,
    discount_price: 14999,
    discount_label: "21% OFF",
    image_url: "/courses/data-science.jpg",
    format: "Online + Recorded",
    topics: ["Python", "Pandas", "TensorFlow", "Scikit-learn", "Deep Learning"],
    highlights: ["Industry projects", "Kaggle competitions", "Certificate"],
    curriculum: {},
    prerequisites: ["Python basics", "Statistics fundamentals"],
    learning_outcomes: [
      "Build ML models",
      "Data analysis",
      "Deploy AI solutions",
    ],
    instructor_name: "Priya Sharma",
    instructor_bio: "Data Scientist at Fortune 500 company",
    is_published: true,
    is_featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Cloud Computing with AWS",
    slug: "cloud-computing-aws",
    category: "Cloud Computing",
    subcategory: "AWS",
    description: "Master AWS services and become a certified cloud architect",
    duration: "10 weeks",
    level: "Intermediate to Advanced",
    price: 13999,
    discount_price: 10999,
    discount_label: "22% OFF",
    image_url: "/courses/aws.jpg",
    format: "Online",
    topics: ["EC2", "S3", "Lambda", "RDS", "CloudFormation"],
    highlights: ["AWS certification prep", "Hands-on labs", "Real projects"],
    curriculum: {},
    prerequisites: ["Basic Linux", "Networking fundamentals"],
    learning_outcomes: [
      "Deploy cloud infrastructure",
      "AWS certification",
      "DevOps skills",
    ],
    instructor_name: "Amit Patel",
    instructor_bio: "AWS Certified Solutions Architect",
    is_published: true,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Mobile App Development with React Native",
    slug: "mobile-app-react-native",
    category: "Mobile Development",
    subcategory: "React Native",
    description: "Build cross-platform mobile apps for iOS and Android",
    duration: "8 weeks",
    level: "Intermediate",
    price: 11999,
    discount_price: 9999,
    discount_label: "17% OFF",
    image_url: "/courses/mobile-dev.jpg",
    format: "Online + Live Sessions",
    topics: ["React Native", "Redux", "Firebase", "App Store", "Play Store"],
    highlights: ["Build 3 apps", "App deployment", "Portfolio projects"],
    curriculum: {},
    prerequisites: ["JavaScript", "React basics"],
    learning_outcomes: [
      "Build mobile apps",
      "Publish to stores",
      "Mobile UI/UX",
    ],
    instructor_name: "Sneha Reddy",
    instructor_bio: "Mobile developer with 50+ apps published",
    is_published: true,
    is_featured: false,
    created_at: new Date().toISOString(),
  },
];

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter published courses and sort by featured
      const publishedCourses = DUMMY_COURSES.filter(
        (course) => course.is_published,
      ).sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setCourses(publishedCourses);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, isLoading, error, refetch: fetchCourses };
};

export const useCourse = (slug: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const foundCourse = DUMMY_COURSES.find(
          (c) => c.slug === slug && c.is_published,
        );

        if (!foundCourse) {
          throw new Error("Course not found");
        }

        setCourse(foundCourse);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  return { course, isLoading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      const categoryCounts: Record<string, number> = {};

      DUMMY_COURSES.filter((course) => course.is_published).forEach(
        (course) => {
          categoryCounts[course.category] =
            (categoryCounts[course.category] || 0) + 1;
        },
      );

      setCategories(
        Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count,
        })),
      );
    };

    fetchCategories();
  }, []);

  return categories;
};
