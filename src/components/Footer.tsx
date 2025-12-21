import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import mimisirobotiLogo from "@/assets/mimisiroboti-logo.png";

const Footer = () => {
  return (
    <footer className="py-8 sm:py-10 md:py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-gradient mb-1">JengaHacks</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built in Nairobi. Ready for the World.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://x.com/mimisiroboti"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/mimisiroboti"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="https://github.com/jengahacks"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="mailto:hello@siliconsavannahsolutions.com"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            © {new Date().getFullYear()} JengaHacks. All rights reserved.
          </p>
          <a 
            href="https://www.linkedin.com/company/mimisiroboti" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Run by</span>
            <img src={mimisirobotiLogo} alt="Mimi Si Roboti" className="h-6 w-auto" />
            <span className="font-medium">Mimi Si Roboti</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
