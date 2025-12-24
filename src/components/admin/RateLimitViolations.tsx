import { useState, useEffect, useCallback } from "react";
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
import { RefreshCw, ShieldAlert, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/lib/logger";
import {
  getViolationStats,
  getTopViolators,
  formatViolationType,
  formatIdentifier,
  type ViolationStats,
  type TopViolator,
} from "@/lib/rateLimitTracking";
import { toast } from "sonner";
import { formatDateTimeShort } from "@/lib/i18n";

const RateLimitViolations = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ViolationStats[]>([]);
  const [topViolators, setTopViolators] = useState<TopViolator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<24 | 48 | 72>(24);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [violationStats, violators] = await Promise.all([
        getViolationStats(timeRange),
        getTopViolators(10, timeRange),
      ]);
      setStats(violationStats);
      setTopViolators(violators);
    } catch (error) {
      logger.error(
        "Error loading rate limit violations",
        error instanceof Error ? error : new Error(String(error))
      );
      toast.error(t("adminRateLimit.failedLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getViolationTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-500";
      case "ip":
        return "bg-orange-500";
      case "client":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">{t("adminRateLimit.loading")}</p>
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
            {t("adminRateLimit.title")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("adminRateLimit.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value) as 24 | 48 | 72)}
            className="px-3 py-2 border rounded-md"
          >
            <option value={24}>{t("adminRateLimit.last24Hours")}</option>
            <option value={48}>{t("adminRateLimit.last48Hours")}</option>
            <option value={72}>{t("adminRateLimit.last72Hours")}</option>
          </select>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.violation_type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {formatViolationType(stat.violation_type)}
              </CardTitle>
              <Badge className={getViolationTypeColor(stat.violation_type)}>
                {stat.violation_type}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.total_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("adminRateLimit.totalViolations")}
              </p>
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">
                  {stat.unique_identifiers} {t("adminRateLimit.uniqueIdentifiers")}
                </span>
                {stat.recent_violations > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    {stat.recent_violations} {t("adminRateLimit.inLastHour")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {stats.length === 0 && (
          <Card className="col-span-3">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("adminRateLimit.noViolations")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Violators Table */}
      {topViolators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("adminRateLimit.topViolators")}</CardTitle>
            <CardDescription>{t("adminRateLimit.topViolatorsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminRateLimit.type")}</TableHead>
                  <TableHead>{t("adminRateLimit.identifier")}</TableHead>
                  <TableHead>{t("adminRateLimit.violationCount")}</TableHead>
                  <TableHead>{t("adminRateLimit.firstViolation")}</TableHead>
                  <TableHead>{t("adminRateLimit.lastViolation")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topViolators.map((violator, index) => (
                  <TableRow key={`${violator.violation_type}-${violator.identifier}-${index}`}>
                    <TableCell>
                      <Badge className={getViolationTypeColor(violator.violation_type)}>
                        {formatViolationType(violator.violation_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatIdentifier(violator.identifier, violator.violation_type)}
                    </TableCell>
                    <TableCell className="font-bold">{violator.violation_count}</TableCell>
                    <TableCell>{formatDateTimeShort(violator.first_violation)}</TableCell>
                    <TableCell>{formatDateTimeShort(violator.last_violation)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateLimitViolations;




