import { Award, Users, Briefcase, Linkedin, Twitter, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import { useTranslation } from "@/hooks/useTranslation";
import ScrollReveal from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  image?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

const JudgesMentors = () => {
  const { t, getNamespace } = useTranslation();
  const judgesData = getNamespace("judgesMentors.judges");
  const mentorsData = getNamespace("judgesMentors.mentors");

  // Get judges and mentors from translations
  // Filter out empty objects and ensure we have valid data
  const judges: Person[] = judgesData && typeof judgesData === 'object' && Object.keys(judgesData).length > 0
    ? Object.keys(judgesData)
        .filter((key) => {
          const name = t(`judgesMentors.judges.${key}.name`);
          return name && name !== `judgesMentors.judges.${key}.name`; // Check if translation exists
        })
        .map((key) => ({
          id: key,
          name: t(`judgesMentors.judges.${key}.name`),
          title: t(`judgesMentors.judges.${key}.title`),
          company: t(`judgesMentors.judges.${key}.company`),
          bio: t(`judgesMentors.judges.${key}.bio`),
          linkedin: t(`judgesMentors.judges.${key}.linkedin`) || undefined,
          twitter: t(`judgesMentors.judges.${key}.twitter`) || undefined,
          website: t(`judgesMentors.judges.${key}.website`) || undefined,
          image: t(`judgesMentors.judges.${key}.image`) || undefined,
        }))
    : [];

  const mentors: Person[] = mentorsData && typeof mentorsData === 'object' && Object.keys(mentorsData).length > 0
    ? Object.keys(mentorsData)
        .filter((key) => {
          const name = t(`judgesMentors.mentors.${key}.name`);
          return name && name !== `judgesMentors.mentors.${key}.name`; // Check if translation exists
        })
        .map((key) => ({
          id: key,
          name: t(`judgesMentors.mentors.${key}.name`),
          title: t(`judgesMentors.mentors.${key}.title`),
          company: t(`judgesMentors.mentors.${key}.company`),
          bio: t(`judgesMentors.mentors.${key}.bio`),
          linkedin: t(`judgesMentors.mentors.${key}.linkedin`) || undefined,
          twitter: t(`judgesMentors.mentors.${key}.twitter`) || undefined,
          website: t(`judgesMentors.mentors.${key}.website`) || undefined,
          image: t(`judgesMentors.mentors.${key}.image`) || undefined,
        }))
    : [];

  const PersonCard = ({ person, type }: { person: Person; type: "judge" | "mentor" }) => {
    const initials = person.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
              {person.image ? (
                <AvatarImage 
                  src={person.image} 
                  alt={person.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              <AvatarFallback className="text-lg sm:text-xl font-semibold bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg sm:text-xl">{person.name}</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1">
            {person.title}
          </CardDescription>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground/80">
            {person.company}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-sm sm:text-base text-muted-foreground mb-4 flex-1">{person.bio}</p>
          {(person.linkedin || person.twitter || person.website) && (
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
              {person.linkedin && (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`${person.name} LinkedIn - Opens in new tab`}
                >
                  <Linkedin className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {person.twitter && (
                <a
                  href={person.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`${person.name} Twitter - Opens in new tab`}
                >
                  <Twitter className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {person.website && (
                <a
                  href={person.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`${person.name} Website - Opens in new tab`}
                >
                  <Globe className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <SEO 
        title="Judges & Mentors | JengaHacks 2026"
        description="Meet the industry experts who will evaluate projects and guide participants at JengaHacks 2026. Our judges and mentors bring years of experience from leading tech companies."
        url="https://jengahacks.com/judges-mentors"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-16 sm:pt-20">
          {/* Hero Section */}
          <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden" aria-labelledby="judges-mentors-heading">
            <div className="absolute inset-0 circuit-pattern opacity-20" aria-hidden="true" />
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" aria-hidden="true" />
            
            <div className="container mx-auto px-4 sm:px-6 relative z-10">
              <ScrollReveal direction="up" delay={0}>
                <header className="text-center max-w-3xl mx-auto">
                  <h1 id="judges-mentors-heading" className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
                    <span className="text-gradient">{t("judgesMentors.title")}</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
                    {t("judgesMentors.subtitle")}
                  </p>
                </header>
              </ScrollReveal>
            </div>
          </section>

          {/* Judges Section */}
          {judges.length > 0 && (
            <section className="py-12 sm:py-16" aria-labelledby="judges-heading">
              <div className="container mx-auto px-4 sm:px-6">
                <ScrollReveal direction="up" delay={100}>
                  <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10 md:mb-12">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
                    <h2 id="judges-heading" className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {t("judgesMentors.judgesTitle")}
                    </h2>
                  </div>
                  <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                    {judges.map((judge) => (
                      <PersonCard key={judge.id} person={judge} type="judge" />
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </section>
          )}

          {/* Mentors Section */}
          {mentors.length > 0 && (
            <section className="py-12 sm:py-16 bg-card/50" aria-labelledby="mentors-heading">
              <div className="container mx-auto px-4 sm:px-6">
                <ScrollReveal direction="up" delay={200}>
                  <div className="flex items-center justify-center gap-3 mb-8 sm:mb-10 md:mb-12">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
                    <h2 id="mentors-heading" className="text-xl sm:text-2xl md:text-3xl font-bold">
                      {t("judgesMentors.mentorsTitle")}
                    </h2>
                  </div>
                  <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                    {mentors.map((mentor) => (
                      <PersonCard key={mentor.id} person={mentor} type="mentor" />
                    ))}
                  </div>
                </ScrollReveal>
              </div>
            </section>
          )}

          {/* Coming Soon Message */}
          {judges.length === 0 && mentors.length === 0 && (
            <section className="py-12 sm:py-16" aria-labelledby="coming-soon-heading">
              <div className="container mx-auto px-4 sm:px-6">
                <ScrollReveal direction="up" delay={100}>
                  <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle id="coming-soon-heading" className="text-center text-xl sm:text-2xl">
                        {t("judgesMentors.comingSoon.title")}
                      </CardTitle>
                      <CardDescription className="text-center text-base sm:text-lg">
                        {t("judgesMentors.comingSoon.description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {t("judgesMentors.comingSoon.message")}
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
            </section>
          )}
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

export default JudgesMentors;

