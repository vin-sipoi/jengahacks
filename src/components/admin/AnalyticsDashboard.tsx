import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { formatDateShort } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";

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

interface AnalyticsDashboardProps {
  stats: RegistrationStats;
}

const COLORS = ["#65bb3a", "#8b5cf6", "#3b82f6", "#f59e0b"];

const AnalyticsDashboard = ({ stats }: AnalyticsDashboardProps) => {
  const { t } = useTranslation();
  
  // Prepare data for charts
  const completionData = [
    { name: t("adminAnalytics.withResume"), value: stats.withResume, percentage: stats.total > 0 ? Math.round((stats.withResume / stats.total) * 100) : 0 },
    { name: t("adminAnalytics.withWhatsApp"), value: stats.withWhatsApp, percentage: stats.total > 0 ? Math.round((stats.withWhatsApp / stats.total) * 100) : 0 },
    { name: t("adminAnalytics.withLinkedIn"), value: stats.withLinkedIn, percentage: stats.total > 0 ? Math.round((stats.withLinkedIn / stats.total) * 100) : 0 },
  ];

  const timeSeriesData = [
    { period: t("adminAnalytics.today"), count: stats.today },
    { period: t("adminAnalytics.thisWeek"), count: stats.thisWeek },
    { period: t("adminAnalytics.thisMonth"), count: stats.thisMonth },
    { period: t("adminAnalytics.total"), count: stats.total },
  ];

  const pieData = [
    { name: t("adminAnalytics.completeProfile"), value: stats.withResume + stats.withWhatsApp + stats.withLinkedIn },
    { name: t("adminAnalytics.basicProfile"), value: stats.total - (stats.withResume + stats.withWhatsApp + stats.withLinkedIn) },
  ];

  // Prepare daily trends data (last 30 days)
  const dailyTrendsData = stats.dailyTrends || [];
  
  // Prepare hourly distribution data
  const hourlyData = stats.hourlyDistribution || Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

  // Funnel Data
  const totalStarts = (stats.total || 0) + (stats.incompleteCount || 0);
  const conversionRate = totalStarts > 0 ? Math.round((stats.total / totalStarts) * 100) : 0;

  const funnelData = [
    { name: "Total Starts", value: totalStarts },
    { name: "Completions", value: stats.total },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("adminAnalytics.profileCompletion")}</CardTitle>
            <CardDescription>{t("adminAnalytics.profileCompletionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completionData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.value}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("adminAnalytics.registrationTrends")}</CardTitle>
            <CardDescription>{t("adminAnalytics.registrationTrendsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#65bb3a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("adminAnalytics.profileTypes")}</CardTitle>
            <CardDescription>{t("adminAnalytics.profileTypesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>From start to completion</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <div className="text-4xl font-bold text-primary mb-2">{conversionRate}%</div>
            <p className="text-sm text-muted-foreground mb-6">Overall Conversion Rate</p>
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Starts</span>
                  <span>{totalStarts}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/30 w-full" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Completions</span>
                  <span>{stats.total}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${conversionRate}%` }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends Chart */}
      {dailyTrendsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("adminAnalytics.dailyTrends")}</CardTitle>
            <CardDescription>{t("adminAnalytics.dailyTrendsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => {
                    return formatDateShort(value);
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#65bb3a" 
                  strokeWidth={2}
                  dot={{ fill: '#65bb3a', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Hourly Distribution */}
      {hourlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("adminAnalytics.hourlyDistribution")}</CardTitle>
            <CardDescription>{t("adminAnalytics.hourlyDistributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `${value}:00`}
                  formatter={(value: number) => [value, t("admin.registrations")]}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("adminAnalytics.detailedStats")}</CardTitle>
          <CardDescription>{t("adminAnalytics.detailedStatsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("adminAnalytics.totalRegistrations")}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("adminAnalytics.resumeUploadRate")}</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.withResume / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("adminAnalytics.whatsappProvided")}</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.withWhatsApp / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("adminAnalytics.linkedinProvided")}</p>
              <p className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.withLinkedIn / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;

