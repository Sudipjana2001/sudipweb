import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Package, Clock, CheckCircle, XCircle, MapPin, Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

const carriers = [
  { id: "fedex", name: "FedEx" },
  { id: "ups", name: "UPS" },
  { id: "usps", name: "USPS" },
  { id: "dhl", name: "DHL" },
  { id: "other", name: "Other" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function CourierPanel() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["courier-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          shipment_events(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateShipping = useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier }: { orderId: string; trackingNumber: string; carrier: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          tracking_number: trackingNumber,
          carrier: carrier,
          status: "shipped",
        })
        .eq("id", orderId);

      if (error) throw error;

      // Add shipment event
      await supabase.from("shipment_events").insert({
        order_id: orderId,
        status: "shipped",
        description: `Package shipped via ${carrier}`,
        location: "Dispatch Center",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Shipping info updated");
      setIsDialogOpen(false);
      setTrackingNumber("");
      setCarrier("");
      setSelectedOrder(null);
    },
    onError: () => {
      toast.error("Failed to update shipping info");
    },
  });

  const addShipmentEvent = useMutation({
    mutationFn: async ({ orderId, status, description, location }: { orderId: string; status: string; description: string; location?: string }) => {
      const { error } = await supabase.from("shipment_events").insert({
        order_id: orderId,
        status,
        description,
        location: location || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Shipment event added");
    },
    onError: () => {
      toast.error("Failed to add shipment event");
    },
  });

  // Calculate SLA metrics
  const shippedOrders = orders.filter(o => o.status === "shipped" || o.status === "delivered");
  const pendingShipment = orders.filter(o => o.status === "processing" || o.status === "confirmed");
  
  const avgShipTime = shippedOrders.length > 0 
    ? shippedOrders.reduce((acc, o) => {
        const created = new Date(o.created_at);
        const shipped = o.shipment_events?.find((e: { status: string }) => e.status === "shipped");
        if (shipped) {
          const days = Math.ceil((new Date(shipped.event_time).getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return acc + days;
        }
        return acc;
      }, 0) / shippedOrders.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SLA Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingShipment.length}</p>
                <p className="text-sm text-muted-foreground">Awaiting Shipment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{shippedOrders.length}</p>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{avgShipTime.toFixed(1)} days</p>
                <p className="text-sm text-muted-foreground">Avg Ship Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                    {order.status}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Carrier:</span>
                    <p className="font-medium">{order.carrier || "Not assigned"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tracking:</span>
                    <p className="font-medium font-mono">{order.tracking_number || "—"}</p>
                  </div>
                </div>

                {/* Shipment Events */}
                {order.shipment_events && order.shipment_events.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Shipment History</p>
                    <div className="space-y-2">
                      {order.shipment_events.slice(0, 3).map((event: { id: string; status: string; description: string; location: string | null; event_time: string }) => (
                        <div key={event.id} className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {format(new Date(event.event_time), "MMM d, h:mm a")}
                          </span>
                          <span>—</span>
                          <span>{event.description}</span>
                          {event.location && (
                            <span className="text-muted-foreground">({event.location})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {!order.tracking_number && (order.status === "processing" || order.status === "confirmed") && (
                    <Dialog open={isDialogOpen && selectedOrder === order.id} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (open) setSelectedOrder(order.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Send className="mr-2 h-4 w-4" />
                          Add Tracking
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Shipping Info</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Carrier</Label>
                            <Select value={carrier} onValueChange={setCarrier}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select carrier" />
                              </SelectTrigger>
                              <SelectContent>
                                {carriers.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Tracking Number</Label>
                            <Input
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Enter tracking number"
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => updateShipping.mutate({ orderId: order.id, trackingNumber, carrier })}
                            disabled={!trackingNumber || !carrier}
                          >
                            Save & Mark as Shipped
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {order.tracking_number && order.status === "shipped" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addShipmentEvent.mutate({
                        orderId: order.id,
                        status: "in_transit",
                        description: "Package in transit",
                        location: "In Transit",
                      })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Update
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No orders to manage</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
