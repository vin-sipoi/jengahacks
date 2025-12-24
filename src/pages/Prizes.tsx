import { Trophy, Award, Medal, Gift, Sparkles, Users, Network, FileText, ShoppingBag, Handshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import { useTranslation } from "@/hooks/useTranslation";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

const Prizes = () => {
  const { t } = useTranslation();

  const prizeCategories = [
    {
      id: "first",
      icon: Trophy,
      title: t("prizes.categories.first.title"),
      description: t("prizes.categories.first.description"),
      amount: t("prizes.categories.first.amount"),
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      gradient: "from-yellow-500/20 to-yellow-600/10",
    },
    {
      id: "second",
      icon: Medal,
      title: t("prizes.categories.second.title"),
      description: t("prizes.categories.second.description"),
      amount: t("prizes.categories.second.amount"),
      color: "text-gray-400",
      bgColor: "bg-gray-400/10",
      borderColor: "border-gray-400/20",
      gradient: "from-gray-400/20 to-gray-500/10",
    },
    {
      id: "third",
      icon: Award,
      title: t("prizes.categories.third.title"),
      description: t("prizes.categories.third.description"),
      amount: t("prizes.categories.third.amount"),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      gradient: "from-orange-500/20 to-orange-600/10",
    },
  ];

  const specialAwards = [
    {
      id: "best-design",
      icon: Sparkles,
      title: t("prizes.specialAwards.bestDesign.title"),
      description: t("prizes.specialAwards.bestDesign.description"),
    },
    {
      id: "most-innovative",
      icon: Gift,
      title: t("prizes.specialAwards.mostInnovative.title"),
      description: t("prizes.specialAwards.mostInnovative.description"),
    },
    {
      id: "best-pitch",
      icon: Trophy,
      title: t("prizes.specialAwards.bestPitch.title"),
      description: t("prizes.specialAwards.bestPitch.description"),
    },
  ];

  const additionalBenefits = [
    {
      id: "mentorship",
      icon: Users,
      text: t("prizes.additionalBenefits.mentorship"),
    },
    {
      id: "networking",
      icon: Network,
      text: t("prizes.additionalBenefits.networking"),
    },
    {
      id: "certificates",
      icon: FileText,
      text: t("prizes.additionalBenefits.certificates"),
    },
    {
      id: "swag",
      icon: ShoppingBag,
      text: t("prizes.additionalBenefits.swag"),
    },
    {
      id: "partnerships",
      icon: Handshake,
      text: t("prizes.additionalBenefits.partnerships"),
    },
  ];

  return (
    <>
      <SEO 
        title="Prizes & Awards | JengaHacks 2026"
        description="Compete for amazing prizes including KES 50,000 for 1st place, plus mentorship opportunities, networking sessions, and certificates. All participants receive valuable benefits."
        url="https://jengahacks.com/prizes"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-16 sm:pt-20">
          {/* Hero Section */}
          <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden" aria-labelledby="prizes-heading">
            <div className="absolute inset-0 circuit-pattern opacity-20" aria-hidden="true" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
            
            <div className="container mx-auto px-4 sm:px-6 relative z-10">
              <ScrollReveal direction="up" delay={0}>
                <header className="text-center max-w-3xl mx-auto">
                  <h1 id="prizes-heading" className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
                    <span className="text-gradient">{t("prizes.title")}</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
                    {t("prizes.subtitle")}
                  </p>
                </header>
              </ScrollReveal>
            </div>
          </section>

          {/* Main Prize Categories */}
          <section className="py-12 sm:py-16" aria-labelledby="main-prizes-heading">
            <div className="container mx-auto px-4 sm:px-6">
              <ScrollReveal direction="up" delay={100}>
                <h2 id="main-prizes-heading" className="sr-only">Main Prize Categories</h2>
                <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-12">
                  {prizeCategories.map((prize, index) => {
                    const Icon = prize.icon;
                    return (
                      <Card
                        key={prize.id}
                        className={cn(
                          "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2",
                          prize.bgColor,
                          prize.borderColor,
                          "border-2",
                          index === 0 && "md:scale-105 md:z-10" // Highlight first place
                        )}
                      >
                        <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5", prize.color)}>
                          <Icon className="w-full h-full" />
                        </div>
                        <CardHeader className="relative">
                          <div className={cn(
                            "inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4",
                            prize.bgColor,
                            prize.borderColor,
                            "border-2"
                          )}>
                            <Icon className={cn("w-8 h-8 sm:w-10 sm:h-10", prize.color)} aria-hidden="true" />
                          </div>
                          <CardTitle className="text-xl sm:text-2xl md:text-3xl">{prize.title}</CardTitle>
                          <CardDescription className="text-base sm:text-lg">{prize.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="relative">
                          <div className={cn("text-3xl sm:text-4xl md:text-5xl font-bold mb-2", prize.color)}>
                            {prize.amount}
                          </div>
                          <p className="text-sm sm:text-base text-muted-foreground">
                            {t("prizes.plusBenefits")}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Special Awards */}
          <section className="py-12 sm:py-16 bg-card/50" aria-labelledby="special-awards-heading">
            <div className="container mx-auto px-4 sm:px-6">
              <ScrollReveal direction="up" delay={200}>
                <h2 id="special-awards-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 px-4">
                  {t("prizes.specialAwardsTitle")}
                </h2>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-3 max-w-4xl mx-auto">
                  {specialAwards.map((award) => {
                    const Icon = award.icon;
                    return (
                      <Card
                        key={award.id}
                        className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <CardHeader>
                          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-4 mx-auto">
                            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
                          </div>
                          <CardTitle className="text-lg sm:text-xl">{award.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm sm:text-base">
                            {award.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* Additional Benefits */}
          <section className="py-12 sm:py-16" aria-labelledby="benefits-heading">
            <div className="container mx-auto px-4 sm:px-6">
              <ScrollReveal direction="up" delay={300}>
                <Card className="max-w-4xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center">
                      {t("prizes.additionalBenefits.title")}
                    </CardTitle>
                    <CardDescription className="text-center text-base sm:text-lg">
                      {t("prizes.additionalBenefits.subtitle")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {additionalBenefits.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                          <div
                            key={benefit.id}
                            className="flex items-start gap-3 sm:gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" aria-hidden="true" />
                            </div>
                            <span className="text-sm sm:text-base text-muted-foreground pt-2">
                              {benefit.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </section>
        </main>
        
        <footer className="border-t border-border py-6 sm:py-8" role="contentinfo">
          <div className="container mx-auto px-4 sm:px-6 text-center text-muted-foreground">
            <p className="text-xs sm:text-sm">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Prizes;

