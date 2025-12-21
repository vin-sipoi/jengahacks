import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Sponsors from "@/components/Sponsors";
import BlogPreview from "@/components/BlogPreview";
import Registration from "@/components/Registration";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <>
      <SEO />
      <StructuredData />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Sponsors />
          <BlogPreview />
          <Registration />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
