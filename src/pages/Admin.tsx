import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createObjectURL, revokeObjectURL, safeSessionStorage } from "@/lib/polyfills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, Phone, FileText, Calendar } from "lucide-react";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import RateLimitViolations from "@/components/admin/RateLimitViolations";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDateTimeShort } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getRegistrationStats } from "@/lib/dbQueries";

interface RegistrationStats {
  total: number;
  withLinkedIn: number;
  withWhatsApp: number;
  withResume: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyTrends?: Array<{ date: string; count: number }>;
  hourlyDistribution?: Array<{ hour: number; count: number }>;
  incompleteCount: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAdminAuth();
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    withLinkedIn: 0,
    withWhatsApp: 0,
    withResume: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyTrends: [],
    hourlyDistribution: [],
    incompleteCount: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    // Auth is handled by useAdminAuth hook
    // This function is kept for compatibility but doesn't need to do anything
    // as useAdminAuth already handles authentication
  };

  const loadStats = async () => {
    try {
      // Use optimized database function for stats
      const stats = await getRegistrationStats();

      const calculatedStats: RegistrationStats = {
        total: stats.total,
        withLinkedIn: stats.withLinkedIn,
        withWhatsApp: 0, // whatsapp_number column doesn't exist in current schema
        withResume: stats.withResume,
        today: stats.today,
        thisWeek: stats.thisWeek,
        thisMonth: stats.thisMonth,
        dailyTrends: stats.dailyTrends || [],
        hourlyDistribution: stats.hourlyDistribution || [],
        incompleteCount: 0,
      };

      setStats(calculatedStats);
    } catch (error) {
      logger.error("Error loading stats", error instanceof Error ? error : new Error(String(error)));
      toast.error(t("admin.failedLoadStats"));
    }
  };

  const exportToCSV = async () => {
    try {
      // Use optimized paginated query, fetching in batches
      // For CSV export, we need all data, so we'll fetch in chunks
      const allRegistrations = [];
      let offset = 0;
      const limit = 1000; // Fetch 1000 at a time
      let hasMore = true;

      while (hasMore) {
        const { data: registrations, error } = await supabase
          .from("registrations")
          .select("id, full_name, email, linkedin_url, resume_path, created_at")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        if (registrations && registrations.length > 0) {
          allRegistrations.push(...registrations);
          offset += limit;
          hasMore = registrations.length === limit;
        } else {
          hasMore = false;
        }
      }

      const registrations = allRegistrations;

      if (!registrations || registrations.length === 0) {
        toast.error(t("admin.noRegistrationsExport"));
        return;
      }

      // Create CSV content
      const headers = [
        "ID",
        t("registration.fullName"),
        t("registration.email"),
        t("registration.linkedin"),
        t("adminTable.resume"),
        t("adminTable.date"),
      ];
      const rows = registrations.map((r) => [
        r.id,
        r.full_name,
        r.email,
        r.linkedin_url || "",
        r.resume_path ? t("common.yes") : t("common.no"),
        formatDateTimeShort(r.created_at),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = createObjectURL(blob);
      if (!url) {
        throw new Error("Failed to create download URL");
      }
      link.setAttribute("href", url);
      link.setAttribute("download", `jengahacks-registrations-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      revokeObjectURL(url);

      toast.success(t("admin.csvExported"));
    } catch (error) {
      logger.error("Export error", error instanceof Error ? error : new Error(String(error)));
      toast.error(t("admin.failedExportCSV"));
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" aria-label="Loading admin dashboard" />
          <p className="text-muted-foreground">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {user?.email && `Logged in as ${user.email}`}
              </p>
            </div>
            <nav className="flex gap-2" aria-label="Admin actions">
              <Button onClick={exportToCSV} variant="outline" aria-label="Export registrations to CSV">
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("admin.exportCSV")}
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                aria-label="Log out of admin dashboard"
              >
                {t("admin.logout")}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" role="main" aria-label="Admin dashboard">
        {/* Stats Cards */}
        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Registration statistics">
          <Card role="article" aria-label={`Total registrations: ${stats.total}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.totalRegistrations")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`${stats.total} total registrations`}>{stats.total}</div>
              <p className="text-xs text-muted-foreground">{t("admin.allTime")}</p>
            </CardContent>
          </Card>

          <Card role="article" aria-label={`Today's registrations: ${stats.today}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.today")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`${stats.today} registrations today`}>{stats.today}</div>
              <p className="text-xs text-muted-foreground">
                {stats.thisWeek > 0 && `+${stats.thisWeek} ${t("admin.thisWeek")}`}
              </p>
            </CardContent>
          </Card>

          <Card role="article" aria-label={`Registrations with resume: ${stats.withResume}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.withResume")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`${stats.withResume} registrations with resume`}>{stats.withResume}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.withResume / stats.total) * 100)}% ${t("admin.ofTotal")}`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card role="article" aria-label={`Registrations with LinkedIn: ${stats.withLinkedIn}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("admin.withLinkedIn") || "With LinkedIn"}</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" aria-label={`${stats.withLinkedIn} registrations with LinkedIn`}>{stats.withLinkedIn}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.withLinkedIn / stats.total) * 100)}% ${t("admin.ofTotal")}`
                  : "0%"}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Main Content Tabs */}
        <section aria-label="Admin dashboard content">
          <Tabs defaultValue="registrations" className="space-y-4">
            <TabsList role="tablist" aria-label="Dashboard sections">
              <TabsTrigger value="registrations" role="tab" aria-controls="registrations-panel">{t("admin.registrations")}</TabsTrigger>
              <TabsTrigger value="analytics" role="tab" aria-controls="analytics-panel">{t("admin.analytics")}</TabsTrigger>
              <TabsTrigger value="rateLimits" role="tab" aria-controls="rateLimits-panel">{t("admin.rateLimits")}</TabsTrigger>
            </TabsList>

            <TabsContent value="registrations" className="space-y-4" id="registrations-panel" role="tabpanel" aria-labelledby="registrations-tab">
              <RegistrationsTable onRefresh={loadStats} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4" id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab">
              <AnalyticsDashboard stats={stats} />
            </TabsContent>

            <TabsContent value="rateLimits" className="space-y-4" id="rateLimits-panel" role="tabpanel" aria-labelledby="rateLimits-tab">
              <RateLimitViolations />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Admin;

