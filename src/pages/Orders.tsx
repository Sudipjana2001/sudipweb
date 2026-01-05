import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { InvoiceDownload } from "@/components/InvoiceDownload";
import { ReorderButton } from "@/components/ReorderButton";
import { RefundTracker } from "@/components/RefundTracker";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-500" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-blue-500" },
  processing: { label: "Processing", icon: Package, color: "text-purple-500" },
  shipped: { label: "Shipped", icon: Truck, color: "text-indigo-500" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-500" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-500" },
};

export default function Orders() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading } = useOrders();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <PageLayout showNewsletter={false}>
        <div className="container mx-auto px-6 py-16">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNewsletter={false}>
      <div className="container mx-auto px-6 py-16">
        <h1 className="mb-8 font-display text-4xl font-medium">My Orders</h1>

        {!orders || orders.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 font-display text-2xl">No orders yet</h2>
            <p className="text-muted-foreground">
              Start shopping to see your orders here!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 ${status.color}`}>
                      <StatusIcon className="h-5 w-5" />
                      <span className="font-medium">{status.label}</span>
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4"
                      >
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                            {item.size && ` • Size: ${item.size}`}
                            {item.pet_size && ` • Pet: ${item.pet_size}`}
                          </p>
                        </div>
                        <p className="font-medium">₹{item.total_price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>₹{order.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>₹{order.tax.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
                      <span>Total</span>
                      <span>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Invoice & Reorder Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <InvoiceDownload order={order} />
                    {order.items && order.items.length > 0 && (
                      <ReorderButton orderItems={order.items} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refund Tracker Section */}
        <div className="mt-12">
          <h2 className="mb-6 font-display text-2xl font-medium">Refund Status</h2>
          <RefundTracker />
        </div>
      </div>
    </PageLayout>
  );
}
