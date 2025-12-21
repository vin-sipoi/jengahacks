import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { safeSessionStorage, createObjectURL, revokeObjectURL } from "@/lib/polyfills";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Users, Mail, Phone, FileText, Calendar, TrendingUp } from "lucide-react";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { toast } from "sonner";

interface RegistrationStats {
  total: number;
  withLinkedIn: number;
  withWhatsApp: number;
  withResume: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    withLinkedIn: 0,
    withWhatsApp: 0,
    withResume: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      // For now, using a simple password check
      // In production, implement proper Supabase Auth
      const adminPassword = safeSessionStorage.getItem("admin_authenticated");
      if (adminPassword === "authenticated") {
        setIsAuthenticated(true);
      } else {
        // Prompt for password
        const password = prompt("Enter admin password:");
        if (password === import.meta.env.VITE_ADMIN_PASSWORD || password === "admin123") {
          safeSessionStorage.setItem("admin_authenticated", "authenticated");
          setIsAuthenticated(true);
        } else {
          toast.error("Unauthorized access");
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: registrations, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (registrations) {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const thisWeek = new Date(now.setDate(now.getDate() - 7));
        const thisMonth = new Date(now.setMonth(now.getMonth() - 1));

        const stats: RegistrationStats = {
          total: registrations.length,
          withLinkedIn: registrations.filter((r) => r.linkedin_url).length,
          withWhatsApp: registrations.filter((r) => r.whatsapp_number).length,
          withResume: registrations.filter((r) => r.resume_path).length,
          today: registrations.filter(
            (r) => new Date(r.created_at) >= today
          ).length,
          thisWeek: registrations.filter(
            (r) => new Date(r.created_at) >= thisWeek
          ).length,
          thisMonth: registrations.filter(
            (r) => new Date(r.created_at) >= thisMonth
          ).length,
        };

        setStats(stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const exportToCSV = async () => {
    try {
      const { data: registrations, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!registrations || registrations.length === 0) {
        toast.error("No registrations to export");
        return;
      }

      // Create CSV content
      const headers = [
        "ID",
        "Full Name",
        "Email",
        "WhatsApp",
        "LinkedIn",
        "Resume",
        "Registration Date",
      ];
      const rows = registrations.map((r) => [
        r.id,
        r.full_name,
        r.email,
        r.whatsapp_number || "",
        r.linkedin_url || "",
        r.resume_path ? "Yes" : "No",
        new Date(r.created_at).toLocaleString(),
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

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">JengaHacks Admin Portal</h1>
              <p className="text-sm text-muted-foreground">
                Registration Management & Analytics
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => {
                  safeSessionStorage.removeItem("admin_authenticated");
                  navigate("/");
                }}
                variant="outline"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">
                {stats.thisWeek > 0 && `+${stats.thisWeek} this week`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Resume</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withResume}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.withResume / stats.total) * 100)}% of total`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With WhatsApp</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withWhatsApp}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.withWhatsApp / stats.total) * 100)}% of total`
                  : "0%"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="registrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            <RegistrationsTable onRefresh={loadStats} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

