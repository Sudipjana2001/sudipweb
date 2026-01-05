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
import { CheckCircle2, XCircle, Clock, Shield, Image } from "lucide-react";

interface ModerationLog {
  id: string;
  gallery_post_id: string | null;
  image_url: string;
  moderation_result: {
    approved: boolean;
    reason: string;
    confidence: number;
  } | null;
  is_approved: boolean | null;
  rejection_reason: string | null;
  moderated_at: string;
}

export function ImageModerationLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["moderation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_moderation_logs")
        .select("*")
        .order("moderated_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ModerationLog[];
    },
  });

  const approvedCount = logs?.filter((l) => l.is_approved).length || 0;
  const rejectedCount = logs?.filter((l) => l.is_approved === false).length || 0;
  const pendingCount = logs?.filter((l) => l.is_approved === null).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Moderated</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images have been moderated yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <img
                        src={log.image_url}
                        alt="Moderated"
                        className="h-12 w-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.is_approved === null
                            ? "secondary"
                            : log.is_approved
                            ? "default"
                            : "destructive"
                        }
                      >
                        {log.is_approved === null
                          ? "Pending"
                          : log.is_approved
                          ? "Approved"
                          : "Rejected"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.moderation_result?.confidence
                        ? `${(log.moderation_result.confidence * 100).toFixed(0)}%`
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.rejection_reason || log.moderation_result?.reason || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(log.moderated_at).toLocaleString()}
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
