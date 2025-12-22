import { Trophy, Award, Medal, Gift, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

const Prizes = () => {
  const { t, getNamespace } = useTranslation();
  const prizesData = getNamespace("prizes");

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

  return (
    <section
      id="prizes"
      className="py-16 sm:py-20 md:py-24 relative"
      aria-labelledby="prizes-heading"
    >
      <div className="absolute inset-0 circuit-pattern opacity-10" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <header className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              id="prizes-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4"
            >
              {t("prizes.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
              {t("prizes.subtitle")}
            </p>
          </header>
        </ScrollReveal>

        {/* Main Prize Categories */}
        <ScrollReveal direction="up" delay={100}>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-12">
            {prizeCategories.map((prize, index) => {
              const Icon = prize.icon;
              return (
                <Card
                  key={prize.id}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                    prize.bgColor,
                    prize.borderColor,
                    "border-2"
                  )}
                >
                  <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5", prize.color)}>
                    <Icon className="w-full h-full" />
                  </div>
                  <CardHeader className="relative">
                    <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", prize.bgColor, prize.borderColor, "border-2")}>
                      <Icon className={cn("w-8 h-8", prize.color)} aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{prize.title}</CardTitle>
                    <CardDescription className="text-base">{prize.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className={cn("text-3xl sm:text-4xl font-bold mb-2", prize.color)}>
                      {prize.amount}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("prizes.plusBenefits")}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Special Awards */}
        <ScrollReveal direction="up" delay={200}>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
              {t("prizes.specialAwardsTitle")}
            </h3>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              {specialAwards.map((award) => {
                const Icon = award.icon;
                return (
                  <Card
                    key={award.id}
                    className="text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                  >
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 mx-auto">
                        <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-lg">{award.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {award.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Additional Benefits */}
        <ScrollReveal direction="up" delay={300}>
          <Card className="mt-12 sm:mt-16 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-center">
                {t("prizes.additionalBenefits.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("prizes.additionalBenefits.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 sm:space-y-4">
                {[
                  "mentorship",
                  "networking",
                  "certificates",
                  "swag",
                  "partnerships",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm sm:text-base text-muted-foreground">
                      {t(`prizes.additionalBenefits.${benefit}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Prizes;

