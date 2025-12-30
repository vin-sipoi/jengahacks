import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useArrowKeyNavigation } from "@/hooks/useArrowKeyNavigation";

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const trapRef = useFocusTrap(isOpen);
  const arrowNavRef = useArrowKeyNavigation({
    enabled: isOpen,
    orientation: "vertical",
    loop: true,
  });

  // Callback ref to assign element to both hooks' refs immediately
  // This ensures refs are set before hooks' effects run
  const menuRef = (element: HTMLDivElement | null) => {
    (trapRef as React.MutableRefObject<HTMLElement | null>).current = element;
    (arrowNavRef as React.MutableRefObject<HTMLElement | null>).current = element;
  };

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

  // Handle hash link clicks - navigate to homepage first if not already there
  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    
    if (location.pathname !== '/') {
      // Navigate to homepage with hash
      navigate(`/${hash}`);
    } else {
      // On homepage, just scroll to section
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    
    // Close mobile menu if open
    setIsOpen(false);
  };

    const navLinks = [
      { href: "#about", label: t("nav.about") },
      { href: "#sponsors", label: t("nav.sponsors") },
      { href: "/prizes", label: t("nav.prizes"), isRoute: true },
      { href: "/judges-mentors", label: t("nav.judgesMentors"), isRoute: true },
      { href: "/faq", label: t("nav.faq"), isRoute: true },
      { href: "/blog", label: t("nav.blog"), isRoute: true },
      { href: "/sponsorship", label: t("nav.sponsorship"), isRoute: true },
    ];

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border transform-gpu translate-z-0"
      role="navigation"
      aria-label={t("aria.mainNavigation")}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <a href="/" className="flex items-center" aria-label={t("aria.homeLink")}>
            <Logo />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" aria-label={t("aria.desktopNavigation")}>
            {navLinks.map((link) => {
              const isRouteLink = link.href === "/blog" || link.href === "/sponsorship" || link.href === "/prizes" || link.href === "/judges-mentors" || link.href === "/faq";
              return link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "transition-all duration-300 font-medium relative group",
                    isRouteLink 
                      ? "text-[#999999] hover:text-[#999999]/80" 
                      : "text-primary hover:text-primary/80"
                  )}
                >
                  {link.label}
                  <span className={cn(
                    "absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full",
                    isRouteLink ? "bg-[#999999]" : "bg-primary"
                  )} />
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleHashLinkClick(e, link.href)}
                  className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              );
            })}
            <LanguageSwitcher variant="compact" />
            <Button variant="hero" size="sm" asChild>
              <a href="#register" aria-label={`${t("common.joinNow")} - ${t("aria.navigateToRegistration")}`}>{t("common.joinNow")}</a>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t("aria.toggleMenu")}
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
          aria-label={t("aria.mobileNavigation")}
        >
          <div className="border-t border-border pt-4">
            <div className="flex flex-col gap-3 animate-slide-in-down">
              {navLinks.map((link) => {
                const isRouteLink = link.href === "/blog" || link.href === "/sponsorship" || link.href === "/prizes" || link.href === "/judges-mentors" || link.href === "/faq";
                return link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    role="menuitem"
                    className={cn(
                      "transition-all duration-300 font-medium transform hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1",
                      isRouteLink 
                        ? "text-[#999999] hover:text-[#999999]/80" 
                        : "text-primary hover:text-primary/80"
                    )}
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
                    onClick={(e) => handleHashLinkClick(e, link.href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleHashLinkClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, link.href);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                );
              })}
              <div className="pt-2 border-t border-border">
                <LanguageSwitcher variant="compact" className="w-full justify-start" />
              </div>
                <Button variant="hero" size="sm" asChild>
                  <a 
                    href="#register" 
                    aria-label={`${t("common.joinNow")} - ${t("aria.navigateToRegistration")}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {t("common.joinNow")}
                  </a>
                </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
