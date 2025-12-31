import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Calendar, 
  Clock, 
  Coffee, 
  Code, 
  Utensils, 
  Lightbulb, 
  Trophy, 
  Presentation,
  CheckCircle2,
  Circle
} from "lucide-react";

interface ScheduleItemProps {
  time: string;
  title: string;
  icon: import("lucide-react").LucideIcon;
  isLast?: boolean;
}

const ScheduleItem = ({ time, title, icon: Icon, isLast }: ScheduleItemProps) => (
  <div className="relative flex gap-8 pb-12 last:pb-0">
    {!isLast && (
      <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border group-last:hidden" />
    )}
    <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col gap-1 pt-1">
      <span className="text-sm font-medium text-primary flex items-center gap-2">
        <Clock className="w-3.5 h-3.5" />
        {time}
      </span>
      <h4 className="text-lg font-semibold text-foreground">{title}</h4>
    </div>
  </div>
);

const Schedule = () => {
  const { t } = useTranslation();

  const day1Events = [
    { time: "08:00 AM", title: t("schedule.events.checkin"), icon: Coffee },
    { time: "09:30 AM", title: t("schedule.events.opening"), icon: Presentation },
    { time: "10:30 AM", title: t("schedule.events.hackingStarts"), icon: Code },
    { time: "01:00 PM", title: t("schedule.events.lunch"), icon: Utensils },
    { time: "03:00 PM", title: t("schedule.events.workshopSupabase"), icon: Lightbulb },
    { time: "07:00 PM", title: t("schedule.events.dinner"), icon: Utensils },
    { time: "09:00 PM", title: t("schedule.events.lateNightSnacks"), icon: Coffee },
  ];

  const day2Events = [
    { time: "08:00 AM", title: t("schedule.events.breakfast"), icon: Coffee },
    { time: "10:00 AM", title: t("schedule.events.workshopPitch"), icon: Lightbulb },
    { time: "01:00 PM", title: t("schedule.events.lunch"), icon: Utensils },
    { time: "04:00 PM", title: t("schedule.events.hackingEnds"), icon: CheckCircle2 },
    { time: "05:00 PM", title: t("schedule.events.judging"), icon: Presentation },
    { time: "08:00 PM", title: t("schedule.events.awards"), icon: Trophy },
  ];

  return (
    <section id="schedule" className="py-24 border-t border-border/40 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4"
          >
            <Calendar className="w-4 h-4" />
            {t("schedule.timeline")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
          >
            {t("schedule.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {t("schedule.subtitle")}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 max-w-5xl mx-auto">
          {/* Day 1 */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <h3 className="text-2xl font-bold tracking-tight">
                {t("schedule.days.day1")}
              </h3>
            </div>
            <div className="space-y-0">
              {day1Events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ScheduleItem 
                    {...event} 
                    isLast={index === day1Events.length - 1} 
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Day 2 */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
              <h3 className="text-2xl font-bold tracking-tight">
                {t("schedule.days.day2")}
              </h3>
            </div>
            <div className="space-y-0">
              {day2Events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ScheduleItem 
                    {...event} 
                    isLast={index === day2Events.length - 1} 
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Schedule;
