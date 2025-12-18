import { useState, useEffect } from "react";
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
    name: "Attendance Plan",
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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleToolClick = (toolId: Tool) => {
    onToolChange(toolId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Button - Fixed Top Left */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-full glass shadow-lg hover:bg-muted/50 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>

      {/* spacer for mobile to push content down since header might overlap or just for visual spacing */}
      <div className="md:hidden h-4" />

      {/* Desktop Grid View */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
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

      {/* Mobile Side Drawer & Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="absolute top-0 bottom-0 left-0 w-[80%] max-w-sm bg-background/95 glass-strong shadow-2xl border-r border-border animate-in slide-in-from-left duration-300">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold font-display text-foreground">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-foreground" />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;

                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all
                        ${isActive
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "hover:bg-muted/50 text-foreground"
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{tool.name}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  Attendify © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToolSelector;
