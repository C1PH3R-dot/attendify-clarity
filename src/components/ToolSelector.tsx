import { useState, useRef, useEffect } from "react";
import { Calculator, CalendarCheck, GraduationCap, Menu, X } from "lucide-react";

type Tool = "attendance" | "planner" | "marks";

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
    id: "planner" as Tool,
    name: "Attendance Planner",
    description: "Plan your attendance recovery",
    icon: CalendarCheck,
  },
  {
    id: "marks" as Tool,
    name: "Marks Calculator",
    description: "Calculate overall percentage from marks",
    icon: GraduationCap,
  },
];

const ToolSelector = ({ activeTool, onToolChange }: ToolSelectorProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeToolData = tools.find(t => t.id === activeTool) || tools[0];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleToolClick = (toolId: Tool) => {
    onToolChange(toolId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="mb-8 relative z-40">
      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
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

      {/* Mobile Hamburger View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              bg-primary text-primary-foreground
            `}>
              <activeToolData.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold font-display text-foreground">
                {activeToolData.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap menu to switch tools
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-2 z-50"
          >
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;

              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`
                    w-full flex items-center gap-3 p-4 text-left transition-colors
                    border-b border-border/50 last:border-none
                    ${isActive ? "bg-primary/10" : "hover:bg-muted/50"}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-md flex items-center justify-center
                    ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>
                      {tool.name}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolSelector;
