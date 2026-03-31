import {
  Code2,
  Database,
  Cloud,
  Palette,
  Brain,
  Server,
  GitBranch,
  Box,
  Layers,
  Terminal,
  Smartphone,
  Globe,
  Lock,
  Zap,
  Cpu,
  Network,
} from "lucide-react";

const techItems = [
  { Icon: Code2, name: "React", color: "text-[#61DAFB]" },
  { Icon: Server, name: "Node.js", color: "text-[#339933]" },
  { Icon: Terminal, name: "Python", color: "text-[#3776AB]" },
  { Icon: Code2, name: "TypeScript", color: "text-[#3178C6]" },
  { Icon: Zap, name: "JavaScript", color: "text-[#F7DF1E]" },
  { Icon: Box, name: "Docker", color: "text-[#2496ED]" },
  { Icon: Network, name: "Kubernetes", color: "text-[#326CE5]" },
  { Icon: Cloud, name: "AWS", color: "text-[#FF9900]" },
  { Icon: Cloud, name: "Google Cloud", color: "text-[#4285F4]" },
  { Icon: Database, name: "MongoDB", color: "text-[#47A248]" },
  { Icon: Database, name: "PostgreSQL", color: "text-[#4169E1]" },
  { Icon: GitBranch, name: "Git", color: "text-[#F05032]" },
  { Icon: Palette, name: "Figma", color: "text-[#F24E1E]" },
  { Icon: Layers, name: "Tailwind", color: "text-[#06B6D4]" },
  { Icon: Globe, name: "Next.js", color: "text-foreground" },
  { Icon: Code2, name: "Vue.js", color: "text-[#4FC08D]" },
  { Icon: Smartphone, name: "React Native", color: "text-[#61DAFB]" },
  { Icon: Brain, name: "TensorFlow", color: "text-[#FF6F00]" },
  { Icon: Cpu, name: "PyTorch", color: "text-[#EE4C2C]" },
  { Icon: Lock, name: "Security", color: "text-primary" },
];

interface TechLogosProps {
  count?: number;
  showNames?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TechLogos = ({
  count = 10,
  showNames = false,
  size = "md",
  className = "",
}: TechLogosProps) => {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const displayedLogos = techItems.slice(0, count);

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 md:gap-4 ${className}`}
    >
      {displayedLogos.map((tech, index) => (
        <div
          key={`${tech.name}-${index}`}
          className="flex flex-col items-center gap-1 md:gap-2 group"
        >
          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/50 hover:bg-muted transition-all duration-200 group-hover:scale-110">
            <tech.Icon className={`${sizeClasses[size]} ${tech.color}`} />
          </div>
          {showNames && (
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
              {tech.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export const TechLogosStrip = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 md:gap-6 py-4 md:py-6 ${className}`}
    >
      {techItems.slice(0, 8).map((tech, index) => (
        <div
          key={`${tech.name}-${index}`}
          className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-full bg-muted/40 border border-border/50"
        >
          <tech.Icon className={`h-3 w-3 md:h-4 md:w-4 ${tech.color}`} />
          <span className="text-[10px] md:text-sm text-muted-foreground font-medium hidden sm:inline">
            {tech.name}
          </span>
        </div>
      ))}
    </div>
  );
};
