import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Sponsors from "@/components/Sponsors";
import Prizes from "@/components/Prizes";
import JudgesMentors from "@/components/JudgesMentors";
import FAQ from "@/components/FAQ";
import Registration from "@/components/Registration";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import ScrollReveal from "@/components/ScrollReveal";
import SkipLink from "@/components/SkipLink";

const Index = () => {
  return (
    <>
      <SEO />
      <StructuredData />
      <SkipLink />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          <Hero />
          <ScrollReveal direction="up" delay={100}>
            <About />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={200}>
            <Sponsors />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={300}>
            <Prizes />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={400}>
            <JudgesMentors />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={500}>
            <FAQ />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={600}>
            <Registration />
          </ScrollReveal>
        </main>
        <ScrollReveal direction="up" delay={500}>
          <Footer />
        </ScrollReveal>
      </div>
    </>
  );
};

export default Index;
