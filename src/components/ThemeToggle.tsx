import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className={`
                flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300
                shadow-sm hover:shadow-xl border-2
                ${theme === 'light'
                    ? 'bg-background hover:bg-secondary/10 text-primary border-primary/30 shadow-primary/5'
                    : 'bg-secondary/40 hover:bg-secondary/60 text-foreground border-primary/40 shadow-primary/10'
                }
                group overflow-hidden relative active:scale-95
            `}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
            <div className="relative w-5 h-5 flex items-center justify-center">
                <Sun
                    className={`h-4 w-4 transition-all duration-500 absolute text-amber-500 ${theme === "dark" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                        }`}
                />
                <Moon
                    className={`h-4 w-4 transition-all duration-500 absolute text-primary ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
                        }`}
                />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">
                {theme === 'light' ? 'Light' : 'Dark'}
            </span>
        </Button>
    );
};

export default ThemeToggle;
