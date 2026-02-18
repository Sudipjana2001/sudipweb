import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Package, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useProductBundles,
  useCreateBundle,
  useUpdateBundle,
  useDeleteBundle,
} from "@/hooks/useProductBundles";

export function ProductBundlesManager() {
  const { data: bundles, isLoading } = useProductBundles();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    bundle_price: 0,
    original_price: 0,
  });

  const handleCreate = async () => {
    await createBundle.mutateAsync({
      name: formData.name,
      description: formData.description,
      bundle_price: formData.bundle_price,
      original_price: formData.original_price,
      product_ids: [],
      is_active: true,
      image_url: null,
    });
    setIsOpen(false);
    setFormData({ name: "", description: "", bundle_price: 0, original_price: 0 });
  };

  const savings = (bundle: { original_price: number; bundle_price: number }) => {
    return Math.round(((bundle.original_price - bundle.bundle_price) / bundle.original_price) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Product Bundles
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Product Bundle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Bundle Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Complete Outfit Set"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Everything your pet needs..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Original Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({ ...formData, original_price: Number(e.target.value) })
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.bundle_price}
                    onChange={(e) =>
                      setFormData({ ...formData, bundle_price: Number(e.target.value) })
                    }
                    min={0}
                  />
                </div>
              </div>
              {formData.original_price > 0 && formData.bundle_price > 0 && (
                <p className="text-sm text-green-600">
                  Customer saves {savings({ ...formData })}% (₹{formData.original_price - formData.bundle_price})
                </p>
              )}
              <Button
                onClick={handleCreate}
                disabled={!formData.name || formData.bundle_price <= 0 || createBundle.isPending}
                className="w-full"
              >
                {createBundle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Bundle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bundles?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No product bundles created yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bundles?.map((bundle) => (
            <Card key={bundle.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {bundle.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bundle.is_active}
                      onCheckedChange={(checked) =>
                        updateBundle.mutate({ id: bundle.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBundle.mutate(bundle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">₹{bundle.bundle_price}</span>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{bundle.original_price}
                  </span>
                  <Badge className="bg-green-500">Save {savings(bundle)}%</Badge>
                </div>
                {bundle.description && (
                  <p className="text-sm text-muted-foreground mt-2">{bundle.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {bundle.product_ids.length} products in bundle
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
