import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";
import ScrollReveal from "@/components/ScrollReveal";

const FAQ = () => {
  const { t } = useTranslation();

  // Get FAQ items from translations
  const faqItems = [
    {
      id: "what-is-jengahacks",
      question: t("faq.whatIsJengahacks.question"),
      answer: t("faq.whatIsJengahacks.answer"),
    },
    {
      id: "when-where",
      question: t("faq.whenWhere.question"),
      answer: t("faq.whenWhere.answer"),
    },
    {
      id: "who-can-participate",
      question: t("faq.whoCanParticipate.question"),
      answer: t("faq.whoCanParticipate.answer"),
    },
    {
      id: "team-size",
      question: t("faq.teamSize.question"),
      answer: t("faq.teamSize.answer"),
    },
    {
      id: "what-to-bring",
      question: t("faq.whatToBring.question"),
      answer: t("faq.whatToBring.answer"),
    },
    {
      id: "cost",
      question: t("faq.cost.question"),
      answer: t("faq.cost.answer"),
    },
    {
      id: "prizes",
      question: t("faq.prizes.question"),
      answer: t("faq.prizes.answer"),
    },
    {
      id: "registration-deadline",
      question: t("faq.registrationDeadline.question"),
      answer: t("faq.registrationDeadline.answer"),
    },
    {
      id: "waitlist",
      question: t("faq.waitlist.question"),
      answer: t("faq.waitlist.answer"),
    },
    {
      id: "more-questions",
      question: t("faq.moreQuestions.question"),
      answer: t("faq.moreQuestions.answer"),
    },
  ];

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 md:py-24 relative"
      aria-labelledby="faq-heading"
    >
      <div className="absolute inset-0 circuit-pattern opacity-10" aria-hidden="true" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <header className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4"
            >
              {t("faq.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
              {t("faq.subtitle")}
            </p>
          </header>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={100}>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <div className="whitespace-pre-line">{item.answer}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;

