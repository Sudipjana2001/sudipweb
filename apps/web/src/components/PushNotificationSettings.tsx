import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushSubscription } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Send } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationSettings() {
  const { isSubscribed, subscribe, unsubscribe, isLoading } = usePushSubscription();
  const [testNotification, setTestNotification] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe.mutateAsync();
    } else {
      // Request notification permission first
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribe.mutateAsync();
      } else {
        toast.error("Notification permission denied");
      }
    }
  };

  const sendTestNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("PawParel Test", {
        body: "This is a test notification from PawParel!",
        icon: "/favicon.ico",
      });
      toast.success("Test notification sent!");
    } else {
      toast.error("Notifications not enabled");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about orders, sales, and new arrivals
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || subscribe.isPending || unsubscribe.isPending}
          />
        </div>

        {isSubscribed && (
          <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Notification Preferences</h4>
              
              <div className="flex items-center justify-between">
                <Label>Order Updates</Label>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Flash Sales</Label>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Back in Stock Alerts</Label>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>New Arrivals</Label>
                <Switch />
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={sendTestNotification}>
                <Send className="mr-2 h-4 w-4" />
                Send Test Notification
              </Button>
            </div>
          </>
        )}

        {!isSubscribed && (
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Notifications are disabled</p>
              <p className="text-sm text-muted-foreground">
                Enable notifications to stay updated on your orders and exclusive deals
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
