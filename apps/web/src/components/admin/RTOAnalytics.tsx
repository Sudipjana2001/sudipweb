import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Package, RotateCcw, AlertTriangle, TrendingDown } from "lucide-react";

interface ReturnAnalytics {
  totalReturns: number;
  pendingReturns: number;
  completedReturns: number;
  returnsByReason: { reason: string; count: number }[];
  returnRate: number;
  avgProcessingDays: number;
}

const reasonLabels: Record<string, string> = {
  wrong_size: "Wrong Size",
  defective: "Defective",
  not_as_described: "Not as Described",
  changed_mind: "Changed Mind",
  quality_issue: "Quality Issue",
  other: "Other",
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6'];

export function RTOAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["rto-analytics"],
    queryFn: async () => {
      // Fetch returns
      const { data: returns, error: returnsError } = await supabase
        .from("return_requests")
        .select("*");

      if (returnsError) throw returnsError;

      // Fetch total orders for return rate
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      const reasonCounts: Record<string, number> = {};
      let processingDaysSum = 0;
      let completedCount = 0;

      returns?.forEach((r) => {
        reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
        
        if (r.status === "completed" && r.updated_at && r.created_at) {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          const days = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          processingDaysSum += days;
          completedCount++;
        }
      });

      const returnsByReason = Object.entries(reasonCounts).map(([reason, count]) => ({
        reason: reasonLabels[reason] || reason,
        count,
      }));

      return {
        totalReturns: returns?.length || 0,
        pendingReturns: returns?.filter(r => r.status === "pending").length || 0,
        completedReturns: returns?.filter(r => r.status === "completed").length || 0,
        returnsByReason,
        returnRate: totalOrders ? ((returns?.length || 0) / totalOrders) * 100 : 0,
        avgProcessingDays: completedCount > 0 ? Math.round(processingDaysSum / completedCount) : 0,
      } as ReturnAnalytics;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalReturns}</p>
                <p className="text-sm text-muted-foreground">Total Returns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.pendingReturns}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.returnRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Return Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.avgProcessingDays} days</p>
                <p className="text-sm text-muted-foreground">Avg Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Returns by Reason</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.returnsByReason.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.returnsByReason}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="reason" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No return data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reason Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.returnsByReason.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.returnsByReason}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="reason"
                    label={({ reason, percent }) => `${reason}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {analytics.returnsByReason.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No return data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.returnsByReason[0] && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>
                  Top return reason: <strong>{analytics.returnsByReason[0].reason}</strong> ({analytics.returnsByReason[0].count} returns)
                </span>
              </div>
            )}
            {analytics.returnRate > 5 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-700 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
                <span>Return rate is above 5% - consider reviewing product descriptions and sizing guides</span>
              </div>
            )}
            {analytics.avgProcessingDays > 7 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-400">
                <Package className="h-5 w-5" />
                <span>Average processing time is over 7 days - consider streamlining return workflow</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
