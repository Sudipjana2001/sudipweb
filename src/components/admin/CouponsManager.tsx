import { useState } from "react";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, Coupon } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  max_uses_per_user: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  applies_to: "all" | "category" | "collection" | "product";
  applies_to_ids: string[];
}

const defaultCoupon: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_order_amount: 0,
  max_uses: null,
  max_uses_per_user: 1,
  starts_at: new Date().toISOString(),
  expires_at: null,
  is_active: true,
  applies_to: "all",
  applies_to_ids: [],
};

export function CouponsManager() {
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(defaultCoupon);

  const resetForm = () => {
    setForm(defaultCoupon);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses,
      max_uses_per_user: coupon.max_uses_per_user,
      starts_at: coupon.starts_at,
      expires_at: coupon.expires_at,
      is_active: coupon.is_active,
      applies_to: coupon.applies_to,
      applies_to_ids: coupon.applies_to_ids,
    });
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const couponData = {
      ...form,
      code: form.code.toUpperCase(),
      description: form.description || null,
      expires_at: form.expires_at || null,
      max_uses: form.max_uses || null,
    };

    if (editingCoupon) {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, ...couponData });
      setEditingCoupon(null);
    } else {
      await createCoupon.mutateAsync(couponData);
      setIsAddOpen(false);
    }
    resetForm();
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    await deleteCoupon.mutateAsync(coupon.id);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied!");
  };

  const CouponForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Coupon Code *</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="SUMMER2024"
          />
        </div>
        <div>
          <Label>Discount Type</Label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setForm({ ...form, discount_type: "percentage" })}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md border p-2 text-sm ${
                form.discount_type === "percentage" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <Percent className="h-4 w-4" />
              Percentage
            </button>
            <button
              onClick={() => setForm({ ...form, discount_type: "fixed" })}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md border p-2 text-sm ${
                form.discount_type === "fixed" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Fixed
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Discount Value *</Label>
          <div className="relative">
            <Input
              type="number"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
              className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {form.discount_type === "percentage" ? "%" : "$"}
            </span>
          </div>
        </div>
        <div>
          <Label>Minimum Order Amount</Label>
          <div className="relative">
            <Input
              type="number"
              value={form.min_order_amount}
              onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
              className="pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          </div>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Summer sale - 20% off all products"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Max Total Uses</Label>
          <Input
            type="number"
            value={form.max_uses || ""}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Unlimited"
          />
        </div>
        <div>
          <Label>Max Uses Per User</Label>
          <Input
            type="number"
            value={form.max_uses_per_user}
            onChange={(e) => setForm({ ...form, max_uses_per_user: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Start Date</Label>
          <Input
            type="datetime-local"
            value={form.starts_at.slice(0, 16)}
            onChange={(e) => setForm({ ...form, starts_at: new Date(e.target.value).toISOString() })}
          />
        </div>
        <div>
          <Label>Expiry Date (optional)</Label>
          <Input
            type="datetime-local"
            value={form.expires_at?.slice(0, 16) || ""}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={createCoupon.isPending || updateCoupon.isPending}
      >
        {editingCoupon ? "Update Coupon" : "Create Coupon"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-medium">Coupons</h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
            </DialogHeader>
            <CouponForm />
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No coupons yet</p>
          <p className="text-sm text-muted-foreground">Create your first coupon to offer discounts</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Usage</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">{coupon.code}</code>
                      <button onClick={() => copyCode(coupon.code)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {coupon.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `$${coupon.discount_value}`}
                    </span>
                    {coupon.min_order_amount > 0 && (
                      <p className="text-xs text-muted-foreground">Min: ${coupon.min_order_amount}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {coupon.uses_count} / {coupon.max_uses || "∞"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        coupon.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {coupon.expires_at
                      ? format(new Date(coupon.expires_at), "MMM d, yyyy")
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Dialog
                        open={editingCoupon?.id === coupon.id}
                        onOpenChange={(open) => { if (!open) { setEditingCoupon(null); resetForm(); } }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Coupon</DialogTitle>
                          </DialogHeader>
                          <CouponForm />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(coupon)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
