import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Mail, TrendingDown, DollarSign } from "lucide-react";
import { useAbandonedCarts, useAbandonedCartStats } from "@/hooks/useAbandonedCarts";
import { format } from "date-fns";

export function AbandonedCartsManager() {
  const { data: carts, isLoading } = useAbandonedCarts();
  const { data: stats } = useAbandonedCartStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abandoned Carts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAbandoned || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.recoveredCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recoveryRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₹{stats?.totalLostValue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abandoned Carts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Abandoned Carts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carts?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No abandoned carts to recover
            </p>
          ) : (
            <div className="space-y-4">
              {carts?.map((cart) => (
                <div
                  key={cart.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {cart.email || "Anonymous User"}
                      </span>
                      {!cart.recovery_email_sent && (
                        <Badge variant="outline">Email Not Sent</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cart.cart_items.length} items • ₹{cart.cart_total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Abandoned {format(new Date(cart.abandoned_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Recovery Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5" />
            Reduce Cart Abandonment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Offer free shipping above a threshold
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send automated recovery emails within 1 hour
            </li>
            <li className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Simplify the checkout process
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
