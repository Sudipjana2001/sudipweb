import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Trash2, Loader2, Shield, AlertTriangle } from "lucide-react";
import { useExportUserData, useCreateGDPRRequest, useMyGDPRRequests } from "@/hooks/useGDPR";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export function GDPRSettings() {
  const exportData = useExportUserData();
  const createRequest = useCreateGDPRRequest();
  const { data: requests } = useMyGDPRRequests();

  const pendingDeleteRequest = requests?.find(
    (r) => r.request_type === "delete" && r.status !== "completed"
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Manage your personal data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your personal data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => exportData.mutate()}
              disabled={exportData.isPending}
            >
              {exportData.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
            <div>
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            
            {pendingDeleteRequest ? (
              <Button variant="outline" disabled>
                Request Pending
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Account?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </p>
                      <p>This includes:</p>
                      <ul className="list-disc list-inside text-sm">
                        <li>Your profile and preferences</li>
                        <li>Order history</li>
                        <li>Pet profiles</li>
                        <li>Reviews and gallery posts</li>
                        <li>Loyalty points and referral codes</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => createRequest.mutate("delete")}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request History */}
      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {request.request_type === "export" ? "Data Export" : "Account Deletion"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      request.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : request.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : request.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your data is protected under applicable privacy laws. We process deletion
          requests within 30 days. Export requests are typically ready within 24 hours.
        </AlertDescription>
      </Alert>
    </div>
  );
}
