import { Code, Users, Trophy, Lightbulb, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

const About = () => {
  const { t, getNamespace } = useTranslation();
  const featuresData = getNamespace("about.features");
  
  const features = [
    {
      icon: Code,
      title: t("about.features.build.title"),
      description: t("about.features.build.description"),
    },
    {
      icon: Users,
      title: t("about.features.network.title"),
      description: t("about.features.network.description"),
    },
    {
      icon: Trophy,
      title: t("about.features.win.title"),
      description: t("about.features.win.description"),
    },
    {
      icon: Lightbulb,
      title: t("about.features.learn.title"),
      description: t("about.features.learn.description"),
    },
  ];
  return (
    <section 
      id="about" 
      className="py-16 sm:py-20 md:py-24 relative"
      aria-labelledby="about-heading"
    >
      <div className="absolute inset-0 circuit-pattern opacity-10" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <header className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 id="about-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            {t("about.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
            {t("about.subtitle")}
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" role="list" aria-label="Event features">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              role="listitem"
              className="group p-4 sm:p-6 bg-card border border-border rounded-lg sm:rounded-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors" aria-hidden="true">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </div>

        {/* Tracks */}
        <div className="mt-12 sm:mt-16 md:mt-20">
          <h3 id="tracks-heading" className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 px-4">{t("about.tracks.title")}</h3>
          <div 
            className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-4" 
            role="list" 
            aria-labelledby="tracks-heading"
          >
            {[
              t("about.tracks.fintech"),
              t("about.tracks.healthtech"),
              t("about.tracks.agritech"),
              t("about.tracks.edtech"),
              t("about.tracks.climatetech"),
              t("about.tracks.jobtech"),
              t("about.tracks.aiml"),
              t("about.tracks.open"),
            ].map((track) => (
              <div
                key={track}
                role="listitem"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-muted rounded-full text-sm sm:text-base text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                aria-label={`Hackathon track: ${track}`}
              >
                {track}
              </div>
            ))}
          </div>
        </div>

        {/* Community CTA */}
        <aside className="mt-12 sm:mt-16 md:mt-20 text-center px-4" aria-label="Community information">
          <div className="inline-block p-6 sm:p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl sm:rounded-2xl max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3" aria-hidden="true">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{t("about.community.title")}</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {t("about.community.description")}
            </p>
            <Button 
              variant="outline" 
              size="lg"
              className="border-indigo-500/50 hover:bg-indigo-500/10 hover:border-indigo-500 hover:text-indigo-400"
              asChild
            >
              <a 
                href={import.meta.env.VITE_DISCORD_URL || "https://discord.gg/jengahacks"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
                aria-label={`${t("about.community.cta")} - Opens Discord community in new tab`}
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                {t("about.community.cta")}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default About;
