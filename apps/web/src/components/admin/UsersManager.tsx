import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import type { Database } from "@/integrations/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, RefreshCw, Users } from "lucide-react";
import type { Order } from "@/hooks/useOrders";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type UserOrder = Pick<
  Order,
  | "id"
  | "order_number"
  | "status"
  | "total"
  | "created_at"
  | "payment_method"
  | "payment_status"
  | "items"
>;

const PAGE_SIZE = 50;

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function getInitials(nameOrEmail: string | null) {
  if (!nameOrEmail) return "U";
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return nameOrEmail.trim().slice(0, 2).toUpperCase();
}

function sanitizeSearchTerm(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9\s@._+-]/g, " ").trim();
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₹${value.toFixed(2)}`;
}

function getOrderStatusClass(status: UserOrder["status"]) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "shipped":
      return "bg-blue-100 text-blue-800";
    case "processing":
      return "bg-purple-100 text-purple-800";
    case "confirmed":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function UserDetailsDialog({ profile }: { profile: ProfileRow }) {
  const [open, setOpen] = useState(false);
  const displayName = profile.full_name || profile.email || "Unknown";
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    error: ordersError,
  } = useQuery({
    queryKey: ["admin-user-orders", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          total,
          created_at,
          payment_method,
          payment_status,
          items:order_items(
            id,
            product_name,
            quantity,
            size,
            pet_size,
            total_price
          )
        `,
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as UserOrder[];
    },
    enabled: open,
  });

  const totalSpend = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[960px] lg:flex lg:h-[85vh] lg:max-h-[85vh] lg:flex-col lg:overflow-hidden">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="mt-2 grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {getInitials(profile.full_name || profile.email)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {profile.email || "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </p>
                <p className="mt-1 break-all text-sm">{profile.id}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </p>
                <p className="mt-1 text-sm">{profile.full_name || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </p>
                <p className="mt-1 break-all text-sm">{profile.email || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </p>
                <p className="mt-1 text-sm">{profile.phone || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Location
                </p>
                <p className="mt-1 text-sm">{location || "—"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Created
                </p>
                <p className="mt-1 text-sm">{formatDate(profile.created_at)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Updated
                </p>
                <p className="mt-1 text-sm">{formatDate(profile.updated_at)}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Address
                </p>
                <p className="mt-1 text-sm">
                  {[
                    profile.address,
                    profile.city,
                    profile.postal_code,
                    profile.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border p-4 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Orders
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {orders.length.toLocaleString()} total orders
                </h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Lifetime spend:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(totalSpend)}
                </span>
              </div>
            </div>

            {isOrdersLoading ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Loading orders…
              </div>
            ) : isOrdersError ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {(ordersError as Error)?.message || "Unable to load orders."}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                This user has not placed any orders yet.
              </div>
            ) : (
              <div className="space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
                {orders.map((order) => {
                  const itemCount =
                    order.items?.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ) ?? 0;

                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {order.order_number}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getOrderStatusClass(order.status)}>
                            {order.status || "pending"}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{itemCount} items</span>
                        <span>
                          Payment: {order.payment_method || "—"}
                          {order.payment_status
                            ? ` • ${order.payment_status}`
                            : ""}
                        </span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {order.items.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-foreground">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Qty {item.quantity}
                                  {item.size ? ` • Human ${item.size}` : ""}
                                  {item.pet_size
                                    ? ` • Pet ${item.pet_size}`
                                    : ""}
                                </p>
                              </div>
                              <span className="shrink-0 text-muted-foreground">
                                {formatCurrency(item.total_price)}
                              </span>
                            </div>
                          ))}

                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const searchTerm = useMemo(() => search.trim(), [search]);
  const safeSearchTerm = useMemo(
    () => sanitizeSearchTerm(searchTerm),
    [searchTerm],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin-users", { searchTerm, page }],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, avatar_url, address, city, postal_code, country, created_at, updated_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (safeSearchTerm) {
        query = query.or(
          `full_name.ilike.%${safeSearchTerm}%,email.ilike.%${safeSearchTerm}%,phone.ilike.%${safeSearchTerm}%,city.ilike.%${safeSearchTerm}%`,
        );
      }

      const { data: profiles, error, count } = await query;
      if (error) throw error;
      return { profiles: (profiles ?? []) as ProfileRow[], count: count ?? 0 };
    },
  });

  const profiles = data?.profiles ?? [];
  const totalCount = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Customers
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight">
            Users
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse user profiles. Search by name, email, phone, or city.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:w-[420px] sm:flex-row sm:justify-end">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search users…"
          />
          <Button
            variant="outline"
            onClick={() => {
              refetch().catch(() => {
                toast.error("Failed to refresh users");
              });
            }}
            disabled={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Phone
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Location
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading users…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="font-medium text-foreground">
                        Unable to load users
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(error as Error)?.message ||
                          "Access denied or network error."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <Users className="h-6 w-6 text-muted-foreground" />
                      <p className="font-medium text-foreground">
                        No users found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Try a different search term.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => {
                  const displayName =
                    profile.full_name || profile.email || "Unknown";
                  const location = [profile.city, profile.country]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <tr
                      key={profile.id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-muted-foreground">
                                {getInitials(
                                  profile.full_name || profile.email,
                                )}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {displayName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {profile.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                        {profile.phone || "—"}
                      </td>

                      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                        {location || "—"}
                      </td>

                      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                        {formatDate(profile.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <UserDetailsDialog profile={profile} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount === 0
            ? "0 users"
            : `${totalCount.toLocaleString()} users`}
          {" • "}
          Page {Math.min(page + 1, pageCount)} of {pageCount}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
