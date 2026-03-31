import { GraduationCap, Map, Building, Handshake, Briefcase } from "lucide-react";
import { TechLogos } from "@/components/common/TechLogos";

const offerings = [
  { icon: GraduationCap, title: "Tech Courses & Career Tracks", description: "Industry-relevant curriculum" },
  { icon: Map, title: "On-Campus & Online Bootcamps", description: "Intensive learning programs" },
  { icon: Building, title: "Internship-Like Project Programs", description: "Real-world experience" },
  { icon: Handshake, title: "Mentorship & Career Guidance", description: "Expert support" },
  { icon: Briefcase, title: "Placement Support & Hiring", description: "Job-ready outcomes" },
];

export const AboutSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="text-primary font-semibold mb-4 block text-sm uppercase tracking-wide">
              Who We Are
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              More Than Courses.{" "}
              <span className="text-primary">A Complete Ecosystem.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              At GrowthCraft, we believe tech education should lead to transformation. 
              That's why we don't just offer courses — we craft pathways. From immersive 
              bootcamps to college-integrated workshops, from internship-style training to 
              real job placement.
            </p>

            {/* Tech Logos */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                Technologies we teach:
              </p>
              <TechLogos count={8} size="sm" showNames={false} />
            </div>
          </div>

          {/* Right Content - Offerings Grid */}
          <div className="grid gap-4">
            {offerings.map((offering, index) => (
              <div
                key={offering.title}
                className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-all duration-300 group"
              >
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <offering.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1 text-foreground">
                    {offering.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {offering.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
