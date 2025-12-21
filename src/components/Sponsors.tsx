import { Link } from "react-router-dom";
import siliconSavannahLogo from "@/assets/silicon-savannah-logo.png";
import adamurLogo from "@/assets/adamur-logo.png";
import promptbiLogo from "@/assets/promptbi-logo.svg";

const Sponsors = () => {
  return (
    <section id="sponsors" className="pb-16 sm:pb-20 md:pb-24 pt-8 sm:pt-10 md:pt-12 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            Our <span className="text-gradient">Sponsors</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
            Backed by leading tech companies committed to growing Africa's innovation ecosystem.
          </p>
        </div>

        {/* Platinum Sponsors */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <h3 className="text-center text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 sm:mb-8">
            Platinum Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20 px-4">
            <a 
              href="https://siliconsavannah.solutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={siliconSavannahLogo}
                  alt="Silicon Savannah Solutions"
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                />
              </div>
            </a>
            <a 
              href="https://adamur.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={adamurLogo}
                  alt="Adamur - #BeyondCode"
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                />
              </div>
            </a>
            <a 
              href="https://promptbix.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={promptbiLogo}
                  alt="PromptBI"
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Become a Sponsor CTA */}
        <div className="mt-12 sm:mt-14 md:mt-16 text-center px-4">
          <div className="inline-block p-6 sm:p-8 bg-muted/50 border border-border rounded-xl sm:rounded-2xl max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Become a Sponsor</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Partner with us to shape the future of African tech talent.
            </p>
            <Link
              to="/sponsorship"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors text-sm sm:text-base"
            >
              Join Us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sponsors;
