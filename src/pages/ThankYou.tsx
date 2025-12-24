import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, CheckCircle2, Download, ExternalLink, ArrowLeft, Settings, QrCode } from "lucide-react";
import siliconSavannahLogo from "@/assets/silicon-savannah-logo.png";
import adamurLogo from "@/assets/adamur-logo.png";
import promptbiLogo from "@/assets/promptbi-logo.svg";
import twinistLogo from "@/assets/twinist-logo.svg";
import { useTranslation } from "@/hooks/useTranslation";
import SEO from "@/components/SEO";
import ScrollReveal from "@/components/ScrollReveal";
import { trackEvent } from "@/lib/analytics";
import RegistrationQRCode from "@/components/RegistrationQRCode";

const ThankYou = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const fullName = searchParams.get("name");
  const isWaitlist = searchParams.get("waitlist") === "true";
  const waitlistPosition = searchParams.get("position");
  const token = searchParams.get("token");
  const registrationId = searchParams.get("id");

  useEffect(() => {
    // Track page view
    trackEvent("thank_you_page_view", {
      category: "engagement",
      email_provided: !!email,
      is_waitlist: isWaitlist,
    });
  }, [email, isWaitlist]);

  // Event details
  const eventDate = "2026-02-21";
  const eventStartTime = "2026-02-21T09:00:00+03:00"; // 9 AM EAT
  const eventEndTime = "2026-02-23T09:00:00+03:00"; // 9 AM EAT (36 hours later)
  const eventLocation = "Nairobi, Kenya";
  const eventTitle = "JengaHacks 2026 - East Africa's Premier Hackathon";
  const eventDescription = "Join us for 36 hours of innovation, collaboration, and building solutions that matter. February 21-22, 2026 in Nairobi, Kenya at PromptBI's HQ.";

  // Generate iCal file content
  const generateICal = () => {
    const startDate = new Date(eventStartTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = new Date(eventEndTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JengaHacks//JengaHacks 2026//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:jengahacks-2026-${Date.now()}@jengahacks.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDescription.replace(/\n/g, "\\n")}`,
      `LOCATION:${eventLocation}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${t("thankYou.calendarReminder")}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return icalContent;
  };

  // Download iCal file
  const handleDownloadICal = () => {
    const icalContent = generateICal();
    const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jengahacks-2026.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    trackEvent("calendar_download", {
      category: "engagement",
      method: "ical",
    });
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const start = new Date(eventStartTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(eventEndTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventTitle,
      dates: `${start}/${end}`,
      details: eventDescription,
      location: eventLocation,
      sf: "true",
      output: "xml",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate Outlook Calendar URL
  const getOutlookCalendarUrl = () => {
    const start = new Date(eventStartTime).toISOString();
    const end = new Date(eventEndTime).toISOString();
    const params = new URLSearchParams({
      subject: eventTitle,
      startdt: start,
      enddt: end,
      body: eventDescription,
      location: eventLocation,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const handleGoogleCalendar = () => {
    trackEvent("calendar_add", {
      category: "engagement",
      method: "google",
    });
    window.open(getGoogleCalendarUrl(), "_blank", "noopener,noreferrer");
  };

  const handleOutlookCalendar = () => {
    trackEvent("calendar_add", {
      category: "engagement",
      method: "outlook",
    });
    window.open(getOutlookCalendarUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <SEO
        title={t("thankYou.seoTitle")}
        description={t("thankYou.seoDescription")}
      />
      <div className="min-h-screen bg-background">
        <main id="main-content" className="pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            {/* Success Message */}
            <ScrollReveal direction="up" delay={0}>
              <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 mb-6 animate-success-pulse">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" aria-hidden="true" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                  {isWaitlist ? t("thankYou.waitlistTitle") : t("thankYou.title")}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mb-2">
                  {isWaitlist ? t("thankYou.waitlistMessage") : t("thankYou.message")}
                </p>
                {isWaitlist && waitlistPosition && (
                  <p className="text-base sm:text-lg font-semibold text-primary mb-2">
                    {t("registration.waitlistPosition", { position: waitlistPosition })}
                  </p>
                )}
                {email && (
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t("thankYou.confirmationEmail", { email })}
                  </p>
                )}
              </div>
            </ScrollReveal>

            {/* Event Details Card */}
            <ScrollReveal direction="up" delay={100}>
              <Card className="mb-8 sm:mb-12 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("thankYou.eventDetails")}</CardTitle>
                  <CardDescription>{t("thankYou.eventDetailsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{t("thankYou.date")}</p>
                      <p className="text-muted-foreground">{t("hero.date")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{t("thankYou.duration")}</p>
                      <p className="text-muted-foreground">{t("thankYou.durationValue")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{t("thankYou.location")}</p>
                      <p className="text-muted-foreground">{t("hero.location")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Add to Calendar */}
            <ScrollReveal direction="up" delay={200}>
              <Card className="mb-8 sm:mb-12 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("thankYou.addToCalendar")}</CardTitle>
                  <CardDescription>{t("thankYou.addToCalendarDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      onClick={handleGoogleCalendar}
                      className="flex items-center gap-2"
                      aria-label={t("thankYou.addToGoogleCalendar")}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      {t("thankYou.googleCalendar")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOutlookCalendar}
                      className="flex items-center gap-2"
                      aria-label={t("thankYou.addToOutlookCalendar")}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      {t("thankYou.outlookCalendar")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadICal}
                      className="flex items-center gap-2"
                      aria-label={t("thankYou.downloadICal")}
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      {t("thankYou.downloadICal")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* QR Code */}
            {registrationId && email && fullName && (
              <ScrollReveal direction="up" delay={250}>
                <div className="mb-8 sm:mb-12 max-w-md mx-auto">
                  <RegistrationQRCode
                    registrationId={registrationId}
                    email={email}
                    fullName={fullName}
                    token={token}
                  />
                </div>
              </ScrollReveal>
            )}

            {/* Manage Registration */}
            {token && (
              <ScrollReveal direction="up" delay={300}>
                <Card className="mb-8 sm:mb-12 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-2xl">{t("thankYou.manageRegistration")}</CardTitle>
                    <CardDescription>{t("thankYou.manageRegistrationDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" asChild className="w-full">
                      <Link 
                        to={`/manage-registration?token=${encodeURIComponent(token)}`}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        {t("thankYou.manageRegistration")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Sponsors Section */}
            <ScrollReveal direction="up" delay={300}>
              <Card className="mb-8 sm:mb-12 max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">{t("thankYou.ourSponsors")}</CardTitle>
                  <CardDescription className="text-center">{t("thankYou.sponsorsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-12 lg:gap-20 px-4">
                    <a
                      href="https://siliconsavannahsolutions.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="Silicon Savannah Solutions - Platinum sponsor - Opens in new tab"
                    >
                      <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                        <img
                          src={siliconSavannahLogo}
                          alt=""
                          className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                    <a
                      href="https://adamur.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="Adamur - #BeyondCode - Platinum sponsor - Opens in new tab"
                    >
                      <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                        <img
                          src={adamurLogo}
                          alt=""
                          className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                    <a
                      href="https://promptbix.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="PromptBI - Platinum sponsor - Opens in new tab"
                    >
                      <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                        <img
                          src={promptbiLogo}
                          alt=""
                          className="h-12 sm:h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform max-w-[200px] sm:max-w-none"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                    <a
                      href="https://twinist.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      aria-label="Twinist - Gold sponsor - Opens in new tab"
                    >
                      <div className="bg-foreground/95 p-4 sm:p-6 rounded-lg sm:rounded-xl hover:bg-foreground transition-colors">
                        <img
                          src={twinistLogo}
                          alt=""
                          className="h-10 sm:h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform max-w-[180px] sm:max-w-none"
                          aria-hidden="true"
                        />
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Next Steps */}
            <ScrollReveal direction="up" delay={400}>
              <Card className="mb-8 sm:mb-12 max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("thankYou.nextSteps")}</CardTitle>
                  <CardDescription>{t("thankYou.nextStepsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{t("thankYou.step1Title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("thankYou.step1Description")}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{t("thankYou.step2Title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("thankYou.step2Description")}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{t("thankYou.step3Title")}</h3>
                    <p className="text-sm text-muted-foreground">{t("thankYou.step3Description")}</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Actions */}
            <ScrollReveal direction="up" delay={500}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/">{t("thankYou.backToHome")}</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/blog">{t("thankYou.viewBlog")}</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </main>
      </div>
    </>
  );
};

export default ThankYou;

