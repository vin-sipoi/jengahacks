import { Link } from "react-router-dom";
import siliconSavannahLogo from "@/assets/silicon-savannah-logo.png";
import adamurLogo from "@/assets/adamur-logo.png";

const Sponsors = () => {
  return (
    <section id="sponsors" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient">Sponsors</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Backed by leading tech companies committed to growing Africa's innovation ecosystem.
          </p>
        </div>

        {/* Platinum Sponsors */}
        <div className="mb-12">
          <h3 className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-8">
            Platinum Partners
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            <a 
              href="https://siliconsavannah.solutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-foreground/95 p-6 rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={siliconSavannahLogo}
                  alt="Silicon Savannah Solutions"
                  className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </div>
            </a>
            <a 
              href="https://adamur.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-foreground/95 p-6 rounded-xl hover:bg-foreground transition-colors">
                <img
                  src={adamurLogo}
                  alt="Adamur - #BeyondCode"
                  className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform"
                />
              </div>
            </a>
          </div>
        </div>

        {/* Become a Sponsor CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 bg-muted/50 border border-border rounded-2xl">
            <h3 className="text-xl font-semibold mb-2">Become a Sponsor</h3>
            <p className="text-muted-foreground mb-4">
              Partner with us to shape the future of African tech talent.
            </p>
            <Link
              to="/sponsorship"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
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
