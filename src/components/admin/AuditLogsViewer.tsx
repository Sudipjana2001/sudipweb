import { useAuditLogs } from "@/hooks/useAuditLogs";
import { ScrollText, User } from "lucide-react";
import { format } from "date-fns";

export function AuditLogsViewer() {
  const { data: logs = [], isLoading } = useAuditLogs(50);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <ScrollText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No audit logs yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-4 p-3 border rounded-lg text-sm"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{log.action}</span>
              {log.table_name && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded">{log.table_name}</span>
              )}
            </div>
            <p className="text-muted-foreground">
              {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          {log.record_id && (
            <span className="text-xs text-muted-foreground font-mono">
              {log.record_id.slice(0, 8)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
