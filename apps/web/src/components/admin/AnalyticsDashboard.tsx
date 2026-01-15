import { useAnalyticsSummary, useFunnelAnalytics, useTopProducts } from "@/hooks/useAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, ShoppingCart, CreditCard, Eye, ArrowRight } from "lucide-react";

export function AnalyticsDashboard() {
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(30);
  const { data: funnel, isLoading: funnelLoading } = useFunnelAnalytics(30);
  const { data: topProducts = [], isLoading: productsLoading } = useTopProducts(30, 5);

  if (summaryLoading || funnelLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const chartData = Object.entries(summary?.dailyEvents || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({
      date: date.slice(5),
      events: count,
    }));

  const funnelData = funnel ? [
    { step: "Page Views", count: funnel.pageViews, icon: Eye },
    { step: "Product Views", count: funnel.productViews, icon: Eye },
    { step: "Add to Cart", count: funnel.addToCarts, icon: ShoppingCart },
    { step: "Checkout", count: funnel.checkouts, icon: CreditCard },
    { step: "Purchase", count: funnel.purchases, icon: CreditCard },
  ] : [];

  const getConversionRate = (from: number, to: number) => {
    if (from === 0) return "0%";
    return `${((to / from) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Views</p>
              <p className="text-2xl font-bold">{funnel?.pageViews.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Add to Carts</p>
              <p className="text-2xl font-bold">{funnel?.addToCarts.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchases</p>
              <p className="text-2xl font-bold">{funnel?.purchases.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2 text-orange-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">
                {getConversionRate(funnel?.pageViews || 0, funnel?.purchases || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-lg font-medium mb-6">Sales Funnel (Last 30 Days)</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {funnelData.map((step, idx) => (
            <div key={step.step} className="flex items-center">
              <div className="text-center min-w-[120px]">
                <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="font-bold text-xl">{step.count.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{step.step}</p>
                {idx > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    {getConversionRate(funnelData[idx - 1].count, step.count)}
                  </p>
                )}
              </div>
              {idx < funnelData.length - 1 && (
                <ArrowRight className="h-6 w-6 text-muted-foreground mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Events Chart */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-lg font-medium mb-6">Daily Events</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-lg font-medium mb-6">Top Viewed Products</h3>
          {productsLoading ? (
            <div className="flex h-[250px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.count} views</p>
                  </div>
                  <div className="w-24">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(product.count / topProducts[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-lg font-medium mb-6">Event Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(summary?.eventCounts || {}).map(([event, count]) => (
            <div key={event} className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground capitalize">
                {event.replace(/_/g, " ")}
              </p>
              <p className="text-xl font-bold">{(count as number).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
