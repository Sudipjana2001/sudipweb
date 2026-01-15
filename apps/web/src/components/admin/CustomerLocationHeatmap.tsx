import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerLocations, useLocationStats } from "@/hooks/useCustomerLocations";
import { MapPin, TrendingUp, Users, IndianRupee, Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function getHeatColor(value: number, max: number): string {
  const intensity = Math.min(value / max, 1);
  if (intensity > 0.8) return "bg-red-500";
  if (intensity > 0.6) return "bg-orange-500";
  if (intensity > 0.4) return "bg-yellow-500";
  if (intensity > 0.2) return "bg-green-500";
  return "bg-blue-500";
}

export function CustomerLocationHeatmap() {
  const { data: locations = [], isLoading } = useCustomerLocations();
  const stats = useLocationStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const maxCount = Math.max(...locations.map((l) => l.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cities Reached</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCities}</div>
            <p className="text-xs text-muted-foreground">Unique delivery locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top City</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topCity?.city || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {stats.topCity ? `${stats.topCity.count} orders` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by State Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by State</CardTitle>
            <CardDescription>Distribution of orders across states</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byState.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byState.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="state" type="category" width={100} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} orders`, "Orders"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.byState.slice(0, 10).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by State Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by State</CardTitle>
            <CardDescription>Revenue distribution across top states</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byState.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.byState.slice(0, 6)}
                    dataKey="revenue"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ state, percent }) => `${state} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.byState.slice(0, 6).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* City Heatmap Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            City-wise Order Heatmap
          </CardTitle>
          <CardDescription>
            Visual representation of order density by city (darker = more orders)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <span className="text-muted-foreground">Intensity:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span>Very High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span>Hotspot</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {locations.map((location) => (
                  <div
                    key={`${location.city}-${location.state}`}
                    className={`relative p-4 rounded-lg text-white transition-transform hover:scale-105 cursor-default ${getHeatColor(location.count, maxCount)}`}
                  >
                    <div className="font-semibold truncate">{location.city}</div>
                    <div className="text-xs opacity-90">{location.state || location.country}</div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span>{location.count} orders</span>
                      <Badge variant="secondary" className="text-xs bg-white/20 hover:bg-white/30">
                        ₹{Math.round(location.revenue / 1000)}k
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-50" />
              <p>No location data available</p>
              <p className="text-sm">Orders with shipping addresses will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>Detailed breakdown of orders and revenue by city</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">City</th>
                  <th className="text-left py-3 px-4 font-medium">State</th>
                  <th className="text-left py-3 px-4 font-medium">Country</th>
                  <th className="text-right py-3 px-4 font-medium">Orders</th>
                  <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">Avg. Order</th>
                </tr>
              </thead>
              <tbody>
                {locations.slice(0, 15).map((location) => (
                  <tr
                    key={`${location.city}-${location.state}`}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <td className="py-3 px-4 font-medium">{location.city}</td>
                    <td className="py-3 px-4 text-muted-foreground">{location.state || "-"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{location.country}</td>
                    <td className="py-3 px-4 text-right">{location.count}</td>
                    <td className="py-3 px-4 text-right">₹{location.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      ₹{Math.round(location.revenue / location.count).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
