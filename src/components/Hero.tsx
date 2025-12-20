import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import icon from "@/assets/jengahacks-icon.svg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 circuit-pattern opacity-30" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float delay-200" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo */}
          <header className="animate-slide-up mb-8 relative">
            <img 
              src={icon} 
              alt="JengaHacks Logo - East Africa's Premier Hackathon" 
              className="w-64 md:w-80 mx-auto mb-4"
              width="320"
              height="320"
              loading="eager"
            />
            <h1 className="font-londrina text-6xl md:text-8xl tracking-wider">
              <span className="text-white">JENGA</span>
              <span style={{ color: '#65bb3a' }}>HACKS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-2 tracking-wide">
              Built in Nairobi. Ready for the World.
            </p>
          </header>

          {/* Tagline */}
          <p className="animate-slide-up delay-100 text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            48 hours of innovation, collaboration, and building solutions that matter. 
            <span className="text-primary font-semibold"> Join East Africa's premier hackathon.</span>
          </p>

          {/* Event Details */}
          <div className="animate-slide-up delay-200 flex flex-wrap justify-center gap-6 mb-10" itemScope itemType="https://schema.org/Event">
            <div className="flex items-center gap-2 text-foreground" itemProp="startDate" content="2026-02-21T00:00:00+03:00">
              <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
              <time dateTime="2026-02-21">February 21-22, 2026</time>
            </div>
            <div className="flex items-center gap-2 text-foreground" itemProp="location" itemScope itemType="https://schema.org/Place">
              <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
              <span itemProp="name">iHub, Nairobi</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="animate-slide-up delay-300 flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="xl" asChild>
              <a href="#register" className="flex items-center gap-2">
                Register Now
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#about">Learn More</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="animate-slide-up delay-400 mt-16 grid grid-cols-2 gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">100+</div>
              <div className="text-sm text-muted-foreground mt-1">Hackers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">48</div>
              <div className="text-sm text-muted-foreground mt-1">Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
