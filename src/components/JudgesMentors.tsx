import { Award, Users, Briefcase, Linkedin, Twitter, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
                <AvatarImage src={person.image} alt={person.name} />
              ) : (
                <AvatarFallback className="text-lg sm:text-xl font-semibold bg-primary/20 text-primary">
                  {initials}
                </AvatarFallback>
              )}
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
          <p className="text-sm text-muted-foreground mb-4 flex-1">{person.bio}</p>
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
        </CardContent>
      </Card>
    );
  };

  return (
    <section
      id="judges-mentors"
      className="py-16 sm:py-20 md:py-24 relative"
      aria-labelledby="judges-mentors-heading"
    >
      <div className="absolute inset-0 circuit-pattern opacity-10" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <header className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              id="judges-mentors-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4"
            >
              {t("judgesMentors.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
              {t("judgesMentors.subtitle")}
            </p>
          </header>
        </ScrollReveal>

        {/* Judges Section */}
        {judges.length > 0 && (
          <ScrollReveal direction="up" delay={100}>
            <div className="mb-12 sm:mb-16">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {t("judgesMentors.judgesTitle")}
                </h3>
              </div>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                {judges.map((judge) => (
                  <PersonCard key={judge.id} person={judge} type="judge" />
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Mentors Section */}
        {mentors.length > 0 && (
          <ScrollReveal direction="up" delay={200}>
            <div>
              <div className="flex items-center justify-center gap-3 mb-8">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {t("judgesMentors.mentorsTitle")}
                </h3>
              </div>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                {mentors.map((mentor) => (
                  <PersonCard key={mentor.id} person={mentor} type="mentor" />
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Call to Action if no judges/mentors yet */}
        {judges.length === 0 && mentors.length === 0 && (
          <ScrollReveal direction="up" delay={100}>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">{t("judgesMentors.comingSoon.title")}</CardTitle>
                <CardDescription className="text-center">
                  {t("judgesMentors.comingSoon.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t("judgesMentors.comingSoon.message")}
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};

export default JudgesMentors;

