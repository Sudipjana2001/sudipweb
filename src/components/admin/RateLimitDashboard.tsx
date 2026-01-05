import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Shield, AlertTriangle, Clock } from "lucide-react";

interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  created_at: string;
}

export function RateLimitDashboard() {
  const { data: rateLimits, isLoading } = useQuery({
    queryKey: ["rate-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_limits")
        .select("*")
        .order("window_start", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as RateLimit[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Aggregate by endpoint
  const endpointStats = rateLimits?.reduce((acc, rl) => {
    if (!acc[rl.endpoint]) {
      acc[rl.endpoint] = { total: 0, requests: 0 };
    }
    acc[rl.endpoint].total += 1;
    acc[rl.endpoint].requests += rl.request_count;
    return acc;
  }, {} as Record<string, { total: number; requests: number }>);

  const chartData = Object.entries(endpointStats || {}).map(([endpoint, stats]) => ({
    name: endpoint,
    requests: stats.requests,
    unique: stats.total,
  }));

  // Find potential abuse (high request counts)
  const suspiciousActivity = rateLimits?.filter((rl) => rl.request_count > 30) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rateLimits?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Endpoints</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(endpointStats || {}).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {suspiciousActivity.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requests by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" name="Total Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {suspiciousActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Suspicious Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Window Start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousActivity.map((rl) => (
                  <TableRow key={rl.id}>
                    <TableCell className="font-mono text-sm">
                      {rl.identifier.slice(0, 20)}...
                    </TableCell>
                    <TableCell>{rl.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{rl.request_count}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(rl.window_start).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Rate Limit Records</CardTitle>
        </CardHeader>
        <CardContent>
          {rateLimits?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rate limit records yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Window Start</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateLimits?.slice(0, 20).map((rl) => (
                  <TableRow key={rl.id}>
                    <TableCell className="font-mono text-sm">
                      {rl.identifier.slice(0, 20)}...
                    </TableCell>
                    <TableCell>{rl.endpoint}</TableCell>
                    <TableCell>
                      <Badge variant={rl.request_count > 30 ? "destructive" : "secondary"}>
                        {rl.request_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(rl.window_start).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
