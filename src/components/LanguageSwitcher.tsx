import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { getStoredLocale, setStoredLocale, getSupportedLocales, type SupportedLocale } from "@/lib/locale";
import { setLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

const LanguageSwitcher = ({ variant = "default", className }: LanguageSwitcherProps) => {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(getStoredLocale());
  const locales = getSupportedLocales();

  useEffect(() => {
    // Listen for locale changes from other components
    const handleStorageChange = () => {
      setCurrentLocale(getStoredLocale());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLocaleChange = (locale: SupportedLocale) => {
    setCurrentLocale(locale);
    setStoredLocale(locale);
    setLocale(locale);
    
    // Trigger a custom event so other components can react
    window.dispatchEvent(new CustomEvent("localechange", { detail: { locale } }));
    
    // Force re-render of all components using translations
    // Components using useTranslation hook will automatically update
  };

  const currentLocaleInfo = locales.find((l) => l.code === currentLocale) || locales[0];

  if (variant === "icon-only") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={className} aria-label="Change language">
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLocaleChange(locale.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{locale.flag}</span>
              <span className="flex-1">{locale.nativeName}</span>
              {currentLocale === locale.code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Globe className="h-4 w-4" />
            <span>{currentLocaleInfo.nativeName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale.code}
              onClick={() => handleLocaleChange(locale.code)}
              className="flex items-center gap-2"
            >
              <span className="text-lg">{locale.flag}</span>
              <span className="flex-1">{locale.nativeName}</span>
              {currentLocale === locale.code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocaleInfo.flag}</span>
          <span className="hidden md:inline">{currentLocaleInfo.nativeName}</span>
          <span className="md:hidden">{currentLocaleInfo.code.split("-")[0].toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-lg">{locale.flag}</span>
            <div className="flex-1">
              <div className="font-medium">{locale.nativeName}</div>
              <div className="text-xs text-muted-foreground">{locale.name}</div>
            </div>
            {currentLocale === locale.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

