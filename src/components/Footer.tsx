import { Github, Twitter, Linkedin, Mail, MessageSquare } from "lucide-react";
import mimisirobotiLogo from "@/assets/mimisiroboti-logo.png";
import SocialShare from "@/components/SocialShare";
import { useTranslation } from "@/hooks/useTranslation";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="py-8 sm:py-10 md:py-12 bg-card border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-gradient mb-1">JengaHacks</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4" aria-label="Social media links">
            <a
              href="https://x.com/mimisiroboti"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Follow us on Twitter - Opens in new tab"
            >
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/company/mimisiroboti"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Follow us on LinkedIn - Opens in new tab"
            >
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </a>
            <a
              href="https://github.com/jengahacks"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="View our GitHub repository - Opens in new tab"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </a>
            <a
              href="mailto:hello@siliconsavannahsolutions.com"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Send us an email"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </a>
            <a
              href={import.meta.env.VITE_DISCORD_URL || "https://discord.gg/jengahacks"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-muted hover:bg-indigo-500 hover:text-white transition-colors"
              aria-label="Join our Discord Community - Opens in new tab"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </a>
          </nav>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
          <div className="mb-4">
            <SocialShare variant="compact" className="justify-center" />
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <a 
              href="https://www.linkedin.com/company/mimisiroboti" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{t("footer.runBy")}</span>
              <img src={mimisirobotiLogo} alt="Mimi Si Roboti" className="h-6 w-auto" />
              <span className="font-medium">Mimi Si Roboti</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
