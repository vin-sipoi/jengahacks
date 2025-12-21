import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createObjectURL, revokeObjectURL } from "@/lib/polyfills";
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
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, FileText, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Registration {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  created_at: string;
}

interface RegistrationsTableProps {
  onRefresh?: () => void;
}

const RegistrationsTable = ({ onRefresh }: RegistrationsTableProps) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [registrations, searchQuery, sortBy, sortOrder]);

  const loadRegistrations = async () => {
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
      console.error("Error loading registrations:", error);
      toast.error("Failed to load registrations");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = [...registrations];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.full_name.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          r.whatsapp_number?.toLowerCase().includes(query) ||
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
  };

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
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(resumePath);

      if (error) throw error;

      const url = createObjectURL(data);
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
      console.error("Error downloading resume:", error);
      toast.error("Failed to download resume");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading registrations...</p>
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
            placeholder="Search by name, email, WhatsApp, or LinkedIn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={loadRegistrations} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
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
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("email")}
              >
                Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("date")}
              >
                Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No registrations found
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
                    {registration.whatsapp_number ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.whatsapp_number}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
                        View Profile
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
                        Download
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(registration.created_at).toLocaleString()}
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

