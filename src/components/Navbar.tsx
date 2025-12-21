import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/jengahacks-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useArrowKeyNavigation } from "@/hooks/useArrowKeyNavigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap(isOpen);
  const arrowNavRef = useArrowKeyNavigation({
    enabled: isOpen,
    orientation: "vertical",
    loop: true,
  });

  // Combine refs for focus trap and arrow navigation
  useEffect(() => {
    if (menuRef.current) {
      (trapRef as React.MutableRefObject<HTMLElement | null>).current = menuRef.current;
      (arrowNavRef as React.MutableRefObject<HTMLElement | null>).current = menuRef.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle Escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        // Return focus to menu button
        const menuButton = document.querySelector<HTMLButtonElement>(
          'button[aria-label="Toggle menu"]'
        );
        menuButton?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const navLinks = [
    { href: "#about", label: t("nav.about") },
    { href: "/blog", label: t("nav.blog"), isRoute: true },
    { href: "/sponsorship", label: t("nav.sponsorship"), isRoute: true },
  ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <a href="/" className="flex items-center gap-2" aria-label="JengaHacks Home - Navigate to homepage">
            <img src={logo} alt="" className="h-8 sm:h-10 w-auto" width="120" height="40" aria-hidden="true" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" aria-label="Desktop navigation">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-primary hover:text-primary/80 transition-all duration-300 font-medium relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              )
            ))}
            <LanguageSwitcher variant="compact" />
            <Button variant="hero" size="sm" asChild>
              <a href="#register" aria-label={`${t("common.joinNow")} - Navigate to registration form`}>{t("common.joinNow")}</a>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <div className="relative w-6 h-6">
              <X
                size={24}
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                )}
              />
              <Menu
                size={24}
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
                )}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          ref={menuRef}
          id="mobile-menu"
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-smooth",
            isOpen ? "max-h-96 opacity-100 py-4" : "max-h-0 opacity-0 py-0"
          )}
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className="border-t border-border pt-4">
            <div className="flex flex-col gap-3 animate-slide-in-down">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    role="menuitem"
                    className="text-primary hover:text-primary/80 transition-all duration-300 font-medium transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1"
                    onClick={() => setIsOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1"
                    onClick={() => setIsOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setIsOpen(false);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                )
              ))}
              <div className="pt-2 border-t border-border">
                <LanguageSwitcher variant="compact" className="w-full justify-start" />
              </div>
              <Button variant="hero" size="sm" asChild>
                <a href="#register" onClick={() => setIsOpen(false)}>{t("common.joinNow")}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
