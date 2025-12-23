import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createObjectURL, revokeObjectURL } from "@/lib/polyfills";
import { formatDateTimeShort } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  linkedin_url: string | null;
  resume_path: string | null;
  created_at: string;
}

interface RegistrationsTableProps {
  onRefresh?: () => void;
}

const RegistrationsTable = ({ onRefresh }: RegistrationsTableProps) => {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadRegistrations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error("Error loading registrations", error instanceof Error ? error : new Error(String(error)), { component: "RegistrationsTable" });
      toast.error(t("adminTable.failedLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh, t]);

  const filterAndSort = useCallback(() => {
    let filtered = [...registrations];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.full_name.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          r.linkedin_url?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortBy) {
        case "name":
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "date":
        default:
          aValue = a.created_at;
          bValue = b.created_at;
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRegistrations(filtered);
  }, [registrations, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    filterAndSort();
  }, [filterAndSort]);

  const handleSort = (column: "name" | "email" | "date") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const downloadResume = async (resumePath: string, fileName: string) => {
    try {
      // Get current session for JWT authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Authentication required");
        return;
      }

      // Get signed URL from Edge Function using JWT authentication
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "get-resume-url",
        {
          body: { resume_path: resumePath },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || "Failed to get download URL");
      }

      const functionResponse = functionData as { url?: string } | null;
      if (!functionResponse?.url) {
        throw new Error("No download URL received");
      }

      // Download using signed URL
      const response = await fetch(functionResponse.url);
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();

      const url = createObjectURL(blob);
      if (!url) {
        throw new Error("Failed to create object URL");
      }
      
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "resume.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      revokeObjectURL(url);
    } catch (error) {
      logger.error("Error downloading resume", error instanceof Error ? error : new Error(String(error)), { resumePath, fileName });
      toast.error(t("adminTable.failedDownload"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">{t("adminTable.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("adminTable.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={loadRegistrations} variant="outline">
          {t("adminTable.refresh")}
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {t("adminTable.showing")} {filteredRegistrations.length} {t("adminTable.of")} {registrations.length} {t("adminTable.registrations")}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("name")}
              >
                {t("adminTable.name")} {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("email")}
              >
                {t("adminTable.email")} {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>{t("adminTable.linkedin")}</TableHead>
              <TableHead>{t("adminTable.resume")}</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("date")}
              >
                {t("adminTable.date")} {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t("adminTable.noRegistrations")}
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {registration.full_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {registration.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {registration.linkedin_url ? (
                      <a
                        href={registration.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t("adminTable.viewProfile")}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {registration.resume_path ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadResume(
                            registration.resume_path!,
                            `${registration.full_name}-resume.pdf`
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {t("adminTable.download")}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateTimeShort(registration.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegistrationsTable;
