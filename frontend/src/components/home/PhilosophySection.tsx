import Image from "next/image";
import { Target, UserCheck, FolderKanban, Briefcase } from "lucide-react";
import techPattern from "@/assets/tech-pattern.jpg";

const features = [
  {
    icon: Target,
    title: "Curriculum Tailored to Industry Needs",
    description: "Designed with hiring managers and tech professionals to ensure every skill you learn is relevant.",
  },
  {
    icon: UserCheck,
    title: "Mentorship-First Learning",
    description: "Get feedback and support from real developers, designers, and analysts throughout your journey.",
  },
  {
    icon: FolderKanban,
    title: "Internship-Equivalent Programs",
    description: "Learn by doing, building real-world projects in a guided format that mimics actual work environments.",
  },
  {
    icon: Briefcase,
    title: "Placement Pipeline",
    description: "We actively connect alumni with hiring companies in our network for job opportunities.",
  },
];

export const PhilosophySection = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={techPattern}
          alt=""
          fill
          className="object-cover opacity-10"
          priority={false}
        />
        <div className="absolute inset-0 bg-muted/80" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold mb-4 block text-sm uppercase tracking-wide">
            Our Philosophy
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Learning + Experience +{" "}
            <span className="text-primary">Outcomes</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Why GrowthCraft is different from traditional education platforms.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-5 p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all duration-300 group"
            >
              <div className="p-4 rounded-xl bg-primary text-primary-foreground h-fit group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
