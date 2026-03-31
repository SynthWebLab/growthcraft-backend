import { useState, useEffect } from "react";

export interface TrainingProgram {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  batch_size: number | null;
  price: number | null;
  discount_price: number | null;
  start_date: string | null;
  end_date: string | null;
  next_batch_date: string | null;
  image_url: string | null;
  category: string | null;
  domain: string | null;
  format: string | null;
  tech_stack: string[];
  focus_areas: string[];
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
const DUMMY_TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: "1",
    title: "Corporate Full Stack Development Training",
    slug: "corporate-full-stack-development",
    description: "Comprehensive full-stack development training program designed for corporate teams. Upskill your developers with modern web technologies and best practices.",
    duration: "8 weeks",
    batch_size: 30,
    price: 150000,
    discount_price: 120000,
    start_date: "2026-05-01",
    end_date: "2026-06-26",
    next_batch_date: "2026-05-01",
    image_url: "/training/corporate-fullstack.jpg",
    category: "Corporate Training",
    domain: "Web Development",
    format: "On-site + Online Hybrid",
    tech_stack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
    focus_areas: [
      "Modern JavaScript & TypeScript",
      "React & Next.js Development",
      "Backend API Development",
      "Database Design & Optimization",
      "Cloud Deployment & DevOps"
    ],
    highlights: [
      "Customized curriculum for your team",
      "On-site training at your office",
      "Hands-on project work",
      "Post-training support for 3 months",
      "Team performance assessment"
    ],
    curriculum: {},
    prerequisites: ["Basic programming knowledge", "Understanding of web fundamentals"],
    learning_outcomes: [
      "Build production-ready full-stack applications",
      "Implement modern development workflows",
      "Deploy and maintain scalable applications",
      "Follow industry best practices and coding standards",
      "Work effectively in agile teams"
    ],
    instructor_name: "Rajesh Kumar & Team",
    instructor_bio: "Lead instructor with 12+ years of experience training corporate teams at Fortune 500 companies.",
    is_published: true,
    is_featured: true,
    created_at: "2026-01-10T10:00:00Z",
  },
  {
    id: "2",
    title: "Enterprise Data Science & ML Training",
    slug: "enterprise-data-science-ml",
    description: "Transform your team into data-driven decision makers. Comprehensive training in data science, machine learning, and AI for enterprise applications.",
    duration: "10 weeks",
    batch_size: 25,
    price: 180000,
    discount_price: 144000,
    start_date: "2026-05-15",
    end_date: "2026-07-24",
    next_batch_date: "2026-05-15",
    image_url: "/training/enterprise-datascience.jpg",
    category: "Corporate Training",
    domain: "Data Science & AI",
    format: "Online Live + Recorded",
    tech_stack: ["Python", "Pandas", "TensorFlow", "PyTorch", "Scikit-learn", "MLflow"],
    focus_areas: [
      "Data Analysis & Visualization",
      "Machine Learning Algorithms",
      "Deep Learning & Neural Networks",
      "MLOps & Model Deployment",
      "Business Intelligence & Reporting"
    ],
    highlights: [
      "Industry-specific use cases",
      "Work with your company's data",
      "ML model deployment training",
      "Executive summary sessions",
      "6 months post-training consultation"
    ],
    curriculum: {},
    prerequisites: ["Python basics", "Statistics fundamentals", "SQL knowledge"],
    learning_outcomes: [
      "Analyze complex business data",
      "Build and deploy ML models",
      "Implement data pipelines",
      "Create actionable insights from data",
      "Establish ML best practices in organization"
    ],
    instructor_name: "Dr. Priya Sharma",
    instructor_bio: "PhD in Machine Learning, 10+ years training data science teams at leading tech companies.",
    is_published: true,
    is_featured: true,
    created_at: "2026-01-12T10:00:00Z",
  },
  {
    id: "3",
    title: "Cloud & DevOps Transformation Program",
    slug: "cloud-devops-transformation",
    description: "Accelerate your organization's cloud adoption journey. Comprehensive training in AWS, Azure, DevOps practices, and infrastructure automation.",
    duration: "6 weeks",
    batch_size: 20,
    price: 130000,
    discount_price: 104000,
    start_date: "2026-06-01",
    end_date: "2026-07-13",
    next_batch_date: "2026-06-01",
    image_url: "/training/cloud-devops.jpg",
    category: "Corporate Training",
    domain: "Cloud & DevOps",
    format: "On-site + Online Hybrid",
    tech_stack: ["AWS", "Azure", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitLab CI"],
    focus_areas: [
      "Cloud Architecture & Design",
      "Infrastructure as Code",
      "CI/CD Pipeline Implementation",
      "Container Orchestration",
      "Monitoring & Observability"
    ],
    highlights: [
      "Multi-cloud training (AWS + Azure)",
      "Hands-on labs with real infrastructure",
      "Migration strategy workshops",
      "Cost optimization techniques",
      "Certification exam preparation"
    ],
    curriculum: {},
    prerequisites: ["Linux fundamentals", "Networking basics", "Basic scripting"],
    learning_outcomes: [
      "Design and implement cloud infrastructure",
      "Automate deployment pipelines",
      "Manage containerized applications",
      "Implement security best practices",
      "Optimize cloud costs and performance"
    ],
    instructor_name: "Amit Patel",
    instructor_bio: "AWS & Azure certified architect with 15+ years experience in cloud transformation projects.",
    is_published: true,
    is_featured: false,
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "4",
    title: "Cybersecurity Awareness & Best Practices",
    slug: "cybersecurity-awareness-training",
    description: "Protect your organization from cyber threats. Comprehensive security training covering threat detection, incident response, and security best practices.",
    duration: "4 weeks",
    batch_size: 40,
    price: 100000,
    discount_price: 80000,
    start_date: "2026-05-20",
    end_date: "2026-06-17",
    next_batch_date: "2026-05-20",
    image_url: "/training/cybersecurity.jpg",
    category: "Corporate Training",
    domain: "Cybersecurity",
    format: "Online Live",
    tech_stack: ["OWASP", "Burp Suite", "Wireshark", "Metasploit", "Nmap"],
    focus_areas: [
      "Security Fundamentals",
      "Threat Detection & Prevention",
      "Secure Coding Practices",
      "Incident Response",
      "Compliance & Regulations"
    ],
    highlights: [
      "Real-world attack simulations",
      "Security audit training",
      "Compliance framework overview",
      "Incident response drills",
      "Security policy development"
    ],
    curriculum: {},
    prerequisites: ["Basic IT knowledge", "Understanding of networks"],
    learning_outcomes: [
      "Identify and mitigate security threats",
      "Implement secure coding practices",
      "Respond to security incidents",
      "Conduct security audits",
      "Establish security policies and procedures"
    ],
    instructor_name: "Vikram Singh",
    instructor_bio: "Certified Ethical Hacker (CEH) and CISSP with 12+ years in cybersecurity consulting.",
    is_published: true,
    is_featured: false,
    created_at: "2026-01-18T10:00:00Z",
  },
  {
    id: "5",
    title: "Agile & Scrum Mastery for Teams",
    slug: "agile-scrum-mastery",
    description: "Transform your team's productivity with agile methodologies. Comprehensive training in Scrum, Kanban, and agile best practices.",
    duration: "3 weeks",
    batch_size: 35,
    price: 80000,
    discount_price: 64000,
    start_date: "2026-06-10",
    end_date: "2026-07-01",
    next_batch_date: "2026-06-10",
    image_url: "/training/agile-scrum.jpg",
    category: "Corporate Training",
    domain: "Project Management",
    format: "On-site",
    tech_stack: ["Jira", "Confluence", "Trello", "Azure DevOps"],
    focus_areas: [
      "Scrum Framework & Ceremonies",
      "Kanban Methodology",
      "Sprint Planning & Execution",
      "Team Collaboration",
      "Metrics & Continuous Improvement"
    ],
    highlights: [
      "Interactive workshops",
      "Team coaching sessions",
      "Scrum Master certification prep",
      "Custom agile framework design",
      "3 months follow-up coaching"
    ],
    curriculum: {},
    prerequisites: ["None - suitable for all team members"],
    learning_outcomes: [
      "Implement Scrum and Kanban effectively",
      "Facilitate agile ceremonies",
      "Improve team collaboration",
      "Measure and improve team velocity",
      "Scale agile practices across organization"
    ],
    instructor_name: "Neha Gupta",
    instructor_bio: "Certified Scrum Trainer (CST) with 10+ years coaching agile teams at startups and enterprises.",
    is_published: true,
    is_featured: false,
    created_at: "2026-01-20T10:00:00Z",
  },
];

export const useTrainingPrograms = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 550));

      // Filter published programs and sort by featured, then by created_at
      const publishedPrograms = DUMMY_TRAINING_PROGRAMS
        .filter((program) => program.is_published)
        .sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setPrograms(publishedPrograms);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return { programs, isLoading, error, refetch: fetchPrograms };
};

export const useTrainingProgram = (slug: string) => {
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!slug) return;

      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 350));

        const foundProgram = DUMMY_TRAINING_PROGRAMS.find(
          (p) => p.slug === slug && p.is_published
        );

        if (!foundProgram) {
          throw new Error("Training program not found");
        }

        setProgram(foundProgram);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgram();
  }, [slug]);

  return { program, isLoading, error };
};
