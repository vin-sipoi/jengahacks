import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  ShieldAlert, 
  AlertTriangle, 
  Download, 
  Ban, 
  CheckCircle,
  TrendingUp,
  FileText
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/lib/logger";
import {
  getViolationAlerts,
  getViolationPatterns,
  autoBlockPersistentViolators,
  blockIdentifier,
  unblockIdentifier,
  exportViolationsCSV,
  exportViolationsJSON,
  exportViolationSummary,
  downloadViolationsCSV,
  downloadViolationsJSON,
  formatViolationType,
  formatIdentifier,
  type ViolationAlert,
  type ViolationPattern,
} from "@/lib/rateLimitTracking";
import { toast } from "sonner";
import { formatDateTimeShort } from "@/lib/i18n";

const RateLimitEnhancements = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<ViolationAlert[]>([]);
  const [patterns, setPatterns] = useState<ViolationPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [violationAlerts, violationPatterns] = await Promise.all([
        getViolationAlerts(null, undefined, 50),
        getViolationPatterns(24, 0.5),
      ]);
      setAlerts(violationAlerts);
      setPatterns(violationPatterns);
    } catch (error) {
      logger.error(
        "Error loading rate limit enhancements",
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAutoBlock = async () => {
    try {
      setIsBlocking(true);
      const blocked = await autoBlockPersistentViolators(5, 24);
      if (blocked.length > 0) {
        toast.success(`Blocked ${blocked.length} persistent violators`);
        await loadData();
      } else {
        toast.info("No violators to block");
      }
    } catch (error) {
      logger.error("Failed to auto-block violators", error);
      toast.error("Failed to block violators");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlock = async (identifier: string, violationType: string) => {
    try {
      await blockIdentifier(
        identifier,
        violationType as "email" | "ip" | "client",
        0,
        "Manual block by admin",
        "admin"
      );
      toast.success("Identifier blocked");
      await loadData();
    } catch (error) {
      logger.error("Failed to block identifier", error);
      toast.error("Failed to block identifier");
    }
  };

  const handleUnblock = async (identifier: string, violationType: string) => {
    try {
      await unblockIdentifier(
        identifier,
        violationType as "email" | "ip" | "client",
        "admin"
      );
      toast.success("Identifier unblocked");
      await loadData();
    } catch (error) {
      logger.error("Failed to unblock identifier", error);
      toast.error("Failed to unblock identifier");
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csv = await exportViolationsCSV();
      downloadViolationsCSV(csv);
      toast.success("Violations exported to CSV");
    } catch (error) {
      logger.error("Failed to export CSV", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const json = await exportViolationsJSON();
      downloadViolationsJSON(json);
      toast.success("Violations exported to JSON");
    } catch (error) {
      logger.error("Failed to export JSON", error);
      toast.error("Failed to export JSON");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      setIsExporting(true);
      const summary = await exportViolationSummary();
      const json = JSON.stringify(summary, null, 2);
      downloadViolationsJSON(json, `violation_summary_${new Date().toISOString().split("T")[0]}.json`);
      toast.success("Summary exported");
    } catch (error) {
      logger.error("Failed to export summary", error);
      toast.error("Failed to export summary");
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Rate Limit Enhancements
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time alerts, automated blocking, pattern analysis, and export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAutoBlock} variant="outline" disabled={isBlocking}>
            <Ban className="h-4 w-4 mr-2" />
            {isBlocking ? "Blocking..." : "Auto-Block Violators"}
          </Button>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Violations
          </CardTitle>
          <CardDescription>Export violation data in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} disabled={isExporting} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportJSON} disabled={isExporting} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={handleExportSummary} disabled={isExporting} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Real-Time Alerts
          </CardTitle>
          <CardDescription>
            Active violation alerts ({alerts.filter(a => !a.is_resolved).length} unresolved)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatViolationType(alert.violation_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatIdentifier(alert.identifier, alert.violation_type)}
                    </TableCell>
                    <TableCell>{alert.violation_count}</TableCell>
                    <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                    <TableCell>{formatDateTimeShort(alert.created_at)}</TableCell>
                    <TableCell>
                      {alert.alert_type === "repeated_violator" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlock(alert.identifier, alert.violation_type)}
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No alerts found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detected Patterns
          </CardTitle>
          <CardDescription>
            Analyzed violation patterns ({patterns.length} detected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patterns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pattern Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Identifiers</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patterns.map((pattern) => (
                  <TableRow key={pattern.id}>
                    <TableCell>
                      <Badge variant="outline">{pattern.pattern_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">{pattern.pattern_description}</TableCell>
                    <TableCell className="text-sm">
                      {pattern.identifiers.length} identifiers
                    </TableCell>
                    <TableCell>{pattern.violation_count}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          pattern.confidence_score >= 0.8
                            ? "bg-green-500"
                            : pattern.confidence_score >= 0.6
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }
                      >
                        {(pattern.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTimeShort(pattern.detected_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No patterns detected
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RateLimitEnhancements;

