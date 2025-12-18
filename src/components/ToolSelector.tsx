import { Calculator, AlertTriangle, GraduationCap } from "lucide-react";

type Tool = "attendance" | "recovery" | "cgpa";

interface ToolSelectorProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const tools = [
  {
    id: "attendance" as Tool,
    name: "Attendance Calculator",
    description: "Calculate your current attendance percentage",
    icon: Calculator,
  },
  {
    id: "recovery" as Tool,
    name: "Risk & Recovery",
    description: "Plan your attendance recovery",
    icon: AlertTriangle,
  },
  {
    id: "cgpa" as Tool,
    name: "CGPA Calculator",
    description: "Compute CGPA and percentage",
    icon: GraduationCap,
  },
];

const ToolSelector = ({ activeTool, onToolChange }: ToolSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`
              glass p-5 rounded-xl text-left transition-all duration-300
              hover:scale-[1.02] hover:shadow-lg
              ${isActive ? "ring-2 ring-primary bg-primary/5" : ""}
            `}
          >
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center mb-3
              ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              transition-colors duration-300
            `}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold font-display text-foreground mb-1">
              {tool.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tool.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default ToolSelector;
