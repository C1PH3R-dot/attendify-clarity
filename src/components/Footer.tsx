import { Mail, Phone, AlertCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-12 py-8 border-t border-border animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="text-center space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <a
            href="mailto:jkmicrosaas@gmail.com"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            jkmicrosaas@gmail.com
          </a>
          <a
            href="tel:+917736104542"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            +91 77361 04542
          </a>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Report issues, bugs, or incorrect results here.</span>
        </div>

        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Attendify. All calculations are for reference only.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
