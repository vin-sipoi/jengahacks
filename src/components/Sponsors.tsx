import { Link } from "react-router-dom";
import siliconSavannahLogo from "@/assets/silicon-savannah-logo.png";
import adamurLogo from "@/assets/adamur-logo.png";
import promptbiLogo from "@/assets/promptbi-logo.svg";
import twinistLogo from "@/assets/twinist-logo.svg";
import { useTranslation } from "@/hooks/useTranslation";

const Sponsors = () => {
  const { t } = useTranslation();
  return (
    <section 
      id="sponsors" 
      className="pb-16 sm:pb-20 md:pb-24 pt-8 sm:pt-10 md:pt-12 bg-card/50"
      aria-labelledby="sponsors-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <header className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 id="sponsors-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            {t("sponsors.title")}
          </h2>
        </header>

        {/* Platinum Sponsors */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h3 id="platinum-sponsors-heading" className="text-center text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 sm:mb-8">
            {t("sponsors.platinum")}
          </h3>
          <div 
            className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20 px-4"
            role="list"
            aria-labelledby="platinum-sponsors-heading"
          >
            <a 
              href="https://siliconsavannahsolutions.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
              role="listitem"
              aria-label="Silicon Savannah Solutions - Platinum sponsor - Opens in new tab"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={siliconSavannahLogo}
                  alt=""
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                  aria-hidden="true"
                />
              </div>
            </a>
            <a 
              href="https://adamur.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
              role="listitem"
              aria-label="Adamur - #BeyondCode - Platinum sponsor - Opens in new tab"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={adamurLogo}
                  alt=""
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                  aria-hidden="true"
                />
              </div>
            </a>
            <a 
              href="https://promptbix.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
              role="listitem"
              aria-label="PromptBI - Platinum sponsor - Opens in new tab"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={promptbiLogo}
                  alt=""
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                  aria-hidden="true"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Gold Sponsors */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h3 id="gold-sponsors-heading" className="text-center text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 sm:mb-8">
            {t("sponsors.gold")}
          </h3>
          <div 
            className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20 px-4"
            role="list"
            aria-labelledby="gold-sponsors-heading"
          >
            <a 
              href="https://twinist.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex justify-center"
              role="listitem"
              aria-label="Twinist - Gold sponsor - Opens in new tab"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors flex items-center justify-center">
                <img
                  src={twinistLogo}
                  alt=""
                  className="h-10 sm:h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform max-w-[180px] sm:max-w-none mx-auto"
                  aria-hidden="true"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Become a Sponsor CTA */}
        <aside className="mt-12 sm:mt-14 md:mt-16 text-center px-4" aria-label="Become a sponsor">
          <div className="inline-block p-6 sm:p-8 bg-muted/50 border border-border rounded-xl sm:rounded-2xl max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("sponsors.becomeSponsor")}</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {t("sponsors.sponsorDescription")}
            </p>
            <Link
              to="/sponsorship"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors text-sm sm:text-base"
              aria-label={`${t("sponsors.sponsorCta")} - Navigate to sponsorship page`}
            >
              {t("sponsors.sponsorCta")}
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Sponsors;
