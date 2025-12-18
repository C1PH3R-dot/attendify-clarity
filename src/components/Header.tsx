import { Calculator } from "lucide-react";

const Header = () => {
  return (
    <header className="text-center py-8 md:py-12 animate-fade-in">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <img
            src="/logo.png"
            alt="Attendify Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-primary">
          Attendify
        </h1>
      </div>
      <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
        Calculate attendance, understand risk, and plan recovery with clarity.
      </p>
    </header>
  );
};

export default Header;
