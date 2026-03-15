import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/client";
import type { Database } from "@/integrations/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, RefreshCw, Users } from "lucide-react";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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

export function UsersManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const searchTerm = useMemo(() => search.trim(), [search]);
  const safeSearchTerm = useMemo(() => sanitizeSearchTerm(searchTerm), [searchTerm]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
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
          <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">Customers</p>
          <h1 className="font-display text-3xl font-medium tracking-tight">Users</h1>
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
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading users…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                      <p className="font-medium text-foreground">Unable to load users</p>
                      <p className="text-xs text-muted-foreground">
                        {(error as Error)?.message || "Access denied or network error."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <Users className="h-6 w-6 text-muted-foreground" />
                      <p className="font-medium text-foreground">No users found</p>
                      <p className="text-xs text-muted-foreground">Try a different search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => {
                  const displayName = profile.full_name || profile.email || "Unknown";
                  const location = [profile.city, profile.country].filter(Boolean).join(", ");

                  return (
                    <tr key={profile.id} className="transition-colors hover:bg-muted/20">
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
                                {getInitials(profile.full_name || profile.email)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">{profile.email || "—"}</p>
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                            </DialogHeader>

                            <div className="mt-2 grid gap-4 sm:grid-cols-2">
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
                                <p className="mt-1 text-sm">{profile.email || "—"}</p>
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
                            </div>
                          </DialogContent>
                        </Dialog>
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
          {totalCount === 0 ? "0 users" : `${totalCount.toLocaleString()} users`}
          {" • "}
          Page {Math.min(page + 1, pageCount)} of {pageCount}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
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
