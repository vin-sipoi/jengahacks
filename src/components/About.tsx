import { Code, Users, Trophy, Lightbulb } from "lucide-react";

const features = [
  {
    icon: Code,
    title: "Build & Ship",
    description: "48 hours to turn your ideas into working prototypes with mentorship from industry experts.",
  },
  {
    icon: Users,
    title: "Network",
    description: "Connect with fellow developers, designers, and entrepreneurs from across East Africa.",
  },
  {
    icon: Trophy,
    title: "Win Big",
    description: "Compete for prizes, mentorship opportunities, and the glory of it all.",
  },
  {
    icon: Lightbulb,
    title: "Learn & Grow",
    description: "Workshops, talks, and hands-on sessions with leading tech companies and innovators.",
  },
];

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-20 md:py-24 relative">
      <div className="absolute inset-0 circuit-pattern opacity-10" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            Why <span className="text-gradient">JengaHacks</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg px-4">
            We're building the future of Kenyan technology, one hack at a time.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <article
              key={feature.title}
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
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 px-4">Hackathon Tracks</h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-4" role="list">
            {["FinTech", "HealthTech", "AgriTech", "EdTech", "Climate Tech", "JobTech", "AI/ML", "Open Innovation"].map((track) => (
              <div
                key={track}
                role="listitem"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-muted rounded-full text-sm sm:text-base text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
              >
                {track}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
