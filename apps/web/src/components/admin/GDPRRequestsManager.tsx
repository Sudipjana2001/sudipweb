import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Shield, User, Clock } from "lucide-react";
import { useAllGDPRRequests, useUpdateGDPRRequest } from "@/hooks/useGDPR";
import { format } from "date-fns";

export function GDPRRequestsManager() {
  const { data: requests, isLoading } = useAllGDPRRequests();
  const updateRequest = useUpdateGDPRRequest();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingRequests = requests?.filter((r) => r.status === "pending") || [];
  const processingRequests = requests?.filter((r) => r.status === "processing") || [];
  const completedRequests = requests?.filter((r) => r.status === "completed") || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingRequests.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {processingRequests.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedRequests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR Data Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No GDPR requests received
            </p>
          ) : (
            <div className="space-y-4">
              {requests?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium font-mono text-sm">
                        {request.user_id.slice(0, 8)}...
                      </span>
                      <Badge
                        variant={request.request_type === "export" ? "default" : "destructive"}
                      >
                        {request.request_type === "export" ? (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </>
                        ) : (
                          "Delete"
                        )}
                      </Badge>
                      <Badge
                        variant={
                          request.status === "completed"
                            ? "default"
                            : request.status === "processing"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          request.status === "completed"
                            ? "bg-green-500"
                            : request.status === "failed"
                            ? "bg-destructive"
                            : ""
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Requested {format(new Date(request.created_at), "MMM d, yyyy HH:mm")}
                      {request.completed_at && (
                        <span>
                          • Completed{" "}
                          {format(new Date(request.completed_at), "MMM d, yyyy HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateRequest.mutate({
                              id: request.id,
                              status: "processing",
                            })
                          }
                          disabled={updateRequest.isPending}
                        >
                          Start Processing
                        </Button>
                      </>
                    )}
                    {request.status === "processing" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateRequest.mutate({
                            id: request.id,
                            status: "completed",
                          })
                        }
                        disabled={updateRequest.isPending}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Export requests must be fulfilled within 30 days</p>
          <p>• Deletion requests must be processed within 30 days</p>
          <p>• Maintain audit trail of all GDPR requests</p>
          <p>• Notify user when request is completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
