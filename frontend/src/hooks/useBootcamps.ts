import { useState, useEffect } from "react";

export interface Bootcamp {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  format: string | null;
  batch_size: number | null;
  price: number | null;
  discount_price: number | null;
  discount_label: string | null;
  next_batch_date: string | null;
  image_url: string | null;
  icon_name: string | null;
  category: string | null;
  tech_stack: string[];
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
const DUMMY_BOOTCAMPS: Bootcamp[] = [
  {
    id: "1",
    title: "Full Stack Web Development Bootcamp",
    slug: "full-stack-web-development-bootcamp",
    description: "Become a professional full-stack developer in 16 weeks. Master React, Node.js, MongoDB, and deploy production-ready applications.",
    duration: "16 weeks",
    format: "Online + Live Sessions",
    batch_size: 25,
    price: 49999,
    discount_price: 39999,
    discount_label: "Early Bird - 20% OFF",
    next_batch_date: "2026-05-15",
    image_url: "/bootcamps/fullstack.jpg",
    icon_name: "Code2",
    category: "Web Development",
    tech_stack: ["React", "Node.js", "MongoDB", "TypeScript", "Next.js", "Express", "PostgreSQL"],
    highlights: [
      "Build 5+ real-world projects",
      "1-on-1 mentorship sessions",
      "Job placement assistance",
      "Industry-recognized certificate",
      "Lifetime access to course materials"
    ],
    curriculum: {},
    prerequisites: ["Basic HTML/CSS knowledge", "JavaScript fundamentals", "Problem-solving mindset"],
    learning_outcomes: [
      "Build full-stack web applications from scratch",
      "Master modern frontend frameworks (React, Next.js)",
      "Create RESTful APIs with Node.js and Express",
      "Work with databases (MongoDB, PostgreSQL)",
      "Deploy applications to production",
      "Implement authentication and authorization"
    ],
    instructor_name: "Rajesh Kumar",
    instructor_bio: "Senior Full Stack Developer with 10+ years of experience at top tech companies. Built and scaled applications serving millions of users.",
    is_published: true,
    is_featured: true,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Data Science & AI Bootcamp",
    slug: "data-science-ai-bootcamp",
    description: "Transform into a data scientist with hands-on training in Python, Machine Learning, Deep Learning, and AI. Work on real industry projects.",
    duration: "20 weeks",
    format: "Online + Recorded",
    batch_size: 30,
    price: 59999,
    discount_price: 47999,
    discount_label: "Limited Offer - 20% OFF",
    next_batch_date: "2026-06-01",
    image_url: "/bootcamps/data-science.jpg",
    icon_name: "Brain",
    category: "Data Science & AI",
    tech_stack: ["Python", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn", "Keras"],
    highlights: [
      "Work on 10+ industry projects",
      "Kaggle competition participation",
      "Portfolio building support",
      "Interview preparation",
      "Capstone project with real data"
    ],
    curriculum: {},
    prerequisites: ["Python basics", "Statistics fundamentals", "Linear algebra basics"],
    learning_outcomes: [
      "Master Python for data analysis",
      "Build machine learning models",
      "Implement deep learning algorithms",
      "Work with neural networks",
      "Deploy ML models to production",
      "Analyze and visualize complex datasets"
    ],
    instructor_name: "Dr. Priya Sharma",
    instructor_bio: "PhD in Machine Learning, Data Scientist at Fortune 500 company. Published researcher with 15+ papers in AI conferences.",
    is_published: true,
    is_featured: true,
    created_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "3",
    title: "DevOps & Cloud Engineering Bootcamp",
    slug: "devops-cloud-engineering-bootcamp",
    description: "Master DevOps practices and cloud technologies. Learn AWS, Docker, Kubernetes, CI/CD, and infrastructure automation.",
    duration: "14 weeks",
    format: "Online + Live Sessions",
    batch_size: 20,
    price: 44999,
    discount_price: 35999,
    discount_label: "Save 20%",
    next_batch_date: "2026-05-20",
    image_url: "/bootcamps/devops.jpg",
    icon_name: "Cloud",
    category: "Cloud & DevOps",
    tech_stack: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Git"],
    highlights: [
      "AWS certification preparation",
      "Hands-on labs with real infrastructure",
      "Build complete CI/CD pipelines",
      "Industry best practices",
      "Job-ready portfolio"
    ],
    curriculum: {},
    prerequisites: ["Linux basics", "Networking fundamentals", "Basic scripting knowledge"],
    learning_outcomes: [
      "Deploy and manage cloud infrastructure",
      "Implement CI/CD pipelines",
      "Containerize applications with Docker",
      "Orchestrate containers with Kubernetes",
      "Automate infrastructure with Terraform",
      "Monitor and troubleshoot production systems"
    ],
    instructor_name: "Amit Patel",
    instructor_bio: "AWS Certified Solutions Architect & DevOps Engineer. 12+ years building scalable cloud infrastructure for startups and enterprises.",
    is_published: true,
    is_featured: false,
    created_at: "2026-01-25T10:00:00Z",
  },
  {
    id: "4",
    title: "Mobile App Development Bootcamp",
    slug: "mobile-app-development-bootcamp",
    description: "Build professional iOS and Android apps with React Native. Learn mobile UI/UX, state management, and app deployment.",
    duration: "12 weeks",
    format: "Online + Live Sessions",
    batch_size: 25,
    price: 39999,
    discount_price: 31999,
    discount_label: "Early Bird - 20% OFF",
    next_batch_date: "2026-06-10",
    image_url: "/bootcamps/mobile.jpg",
    icon_name: "Smartphone",
    category: "Mobile Development",
    tech_stack: ["React Native", "Redux", "Firebase", "TypeScript", "Expo", "React Navigation"],
    highlights: [
      "Build 4 production-ready apps",
      "Publish apps to App Store & Play Store",
      "Mobile UI/UX best practices",
      "Performance optimization",
      "Monetization strategies"
    ],
    curriculum: {},
    prerequisites: ["JavaScript fundamentals", "React basics", "Basic mobile app usage"],
    learning_outcomes: [
      "Build cross-platform mobile apps",
      "Implement complex navigation patterns",
      "Manage app state effectively",
      "Integrate with backend APIs",
      "Publish apps to app stores",
      "Optimize app performance"
    ],
    instructor_name: "Sneha Reddy",
    instructor_bio: "Mobile Developer with 8+ years of experience. Published 50+ apps with millions of downloads on App Store and Play Store.",
    is_published: true,
    is_featured: false,
    created_at: "2026-02-01T10:00:00Z",
  },
];

export const useBootcamps = () => {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBootcamps = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Filter published bootcamps and sort by featured, then by created_at
      const publishedBootcamps = DUMMY_BOOTCAMPS
        .filter((bootcamp) => bootcamp.is_published)
        .sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setBootcamps(publishedBootcamps);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBootcamps();
  }, []);

  return { bootcamps, isLoading, error, refetch: fetchBootcamps };
};

export const useBootcamp = (slug: string) => {
  const [bootcamp, setBootcamp] = useState<Bootcamp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBootcamp = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 400));

        const foundBootcamp = DUMMY_BOOTCAMPS.find(
          (b) => b.slug === slug && b.is_published
        );

        if (!foundBootcamp) {
          throw new Error("Bootcamp not found");
        }

        setBootcamp(foundBootcamp);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBootcamp();
  }, [slug]);

  return { bootcamp, isLoading, error };
};
