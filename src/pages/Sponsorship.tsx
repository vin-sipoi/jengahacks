import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Sparkles, Zap, Crown, Gem } from "lucide-react";
import { Link } from "react-router-dom";
import icon from "@/assets/jengahacks-icon.svg";
import SEO from "@/components/SEO";

const packages = [
  {
    name: "Bronze",
    price: "$100",
    icon: Zap,
    color: "from-amber-700 to-amber-500",
    description: "Perfect for startups looking to connect with emerging talent",
    features: [
      "Logo on event website",
      "Social media shoutout",
      "1 mentor pass",
    ],
  },
  {
    name: "Silver",
    price: "$200",
    icon: Sparkles,
    color: "from-slate-400 to-slate-300",
    description: "Ideal for growing companies seeking visibility",
    features: [
      "Everything in Bronze",
      "Logo on event banners",
      "2 mentor passes",
      "Short pitch during opening ceremony",
      "Branded swag in participant kits",
    ],
  },
  {
    name: "Gold",
    price: "$500",
    icon: Crown,
    color: "from-yellow-500 to-yellow-300",
    popular: true,
    description: "Best value for companies wanting strong brand presence",
    features: [
      "Everything in Silver",
      "Dedicated booth space",
      "4 mentor passes",
      "10-minute keynote slot",
      "Logo on participant t-shirts",
      "Priority access to top projects",
      "Access to participant resumes",
    ],
  },
  {
    name: "Platinum",
    price: "$1,000",
    icon: Gem,
    color: "from-violet-500 to-fuchsia-400",
    description: "Maximum exposure and exclusive partnership benefits",
    features: [
      "Everything in Gold",
      "Title sponsorship mention",
      "6 mentor passes",
      "Exclusive workshop session",
      "First pick for hiring participants",
      "Logo on all marketing materials",
      "VIP dinner with organizers",
    ],
  },
];

const Sponsorship = () => {
  return (
    <>
      <SEO 
        title="Become a Sponsor | JengaHacks 2026"
        description="Partner with JengaHacks 2026 and connect with 200+ talented developers, designers, and innovators. Choose from Bronze, Silver, Gold, or Platinum sponsorship packages."
        url="https://jengahacks.com/sponsorship"
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2" aria-label="JengaHacks Home">
            <img src={icon} alt="JengaHacks - East Africa's Premier Hackathon" className="h-8 sm:h-10 w-auto" width="40" height="40" />
            <span className="font-londrina text-xl sm:text-2xl">
              <span className="text-white">JENGA</span>
              <span style={{ color: '#65bb3a' }}>HACKS</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
              <span className="text-gradient">Partner</span> with JengaHacks
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
              Connect with 200+ talented developers, designers, and innovators building the future of East Africa's tech ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>200+ Participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>48 Hours of Innovation</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span>Top Local Tech Talent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  pkg.popular ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-2 sm:px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="text-center pb-2 p-4 sm:p-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center`}>
                    <pkg.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">{pkg.name}</CardTitle>
                  <div className="text-3xl sm:text-4xl font-bold text-gradient mt-2">{pkg.price}</div>
                  <CardDescription className="mt-2 text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={pkg.popular ? "hero" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <a href="mailto:hello@siliconsavannahsolutions.com?subject=Sponsorship Inquiry - {pkg.name} Package">
                      Get Started
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Sponsor Section */}
      <section className="py-12 sm:py-16 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 px-4">
            Why <span className="text-gradient">Sponsor</span> JengaHacks?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Talent Pipeline</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Access top developers and designers from East Africa's leading universities before they hit the job market.
              </p>
            </div>
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🚀</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Brand Visibility</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Position your company as an innovation leader in the growing East African tech ecosystem.
              </p>
            </div>
            <div className="text-center p-4 sm:p-6 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">💡</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Fresh Ideas</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                See innovative solutions to real problems built in just 48 hours by passionate young developers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-4">
            Ready to <span className="text-gradient">Make an Impact</span>?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Have questions or need a custom package? We'd love to hear from you.
          </p>
          <Button variant="hero" size="lg" className="sm:size-xl" asChild>
            <a href="mailto:hello@siliconsavannahsolutions.com">
              Contact Us
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-muted-foreground">
          <p className="text-xs sm:text-sm">© 2026 JengaHacks. Built in Nairobi. Ready for the World.</p>
        </div>
      </footer>
    </div>
    </>
  );
};

export default Sponsorship;
