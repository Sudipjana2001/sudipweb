import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Zap, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useFlashSales,
  useCreateFlashSale,
  useUpdateFlashSale,
  useDeleteFlashSale,
} from "@/hooks/useFlashSales";
import { format } from "date-fns";

export function FlashSalesManager() {
  const { data: sales, isLoading } = useFlashSales();
  const createSale = useCreateFlashSale();
  const updateSale = useUpdateFlashSale();
  const deleteSale = useDeleteFlashSale();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_percentage: 20,
    starts_at: "",
    ends_at: "",
  });

  const handleCreate = async () => {
    await createSale.mutateAsync({
      name: formData.name,
      description: formData.description,
      discount_percentage: formData.discount_percentage,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
      product_ids: [],
      category_ids: [],
      is_active: true,
    });
    setIsOpen(false);
    setFormData({
      name: "",
      description: "",
      discount_percentage: 20,
      starts_at: "",
      ends_at: "",
    });
  };

  const isActive = (sale: { starts_at: string; ends_at: string; is_active: boolean }) => {
    const now = new Date();
    return sale.is_active && new Date(sale.starts_at) <= now && new Date(sale.ends_at) >= now;
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
          <Zap className="h-5 w-5 text-yellow-500" />
          Flash Sales
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Flash Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Sale Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Summer Flash Sale"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Limited time offer..."
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Percentage</Label>
                <Input
                  type="number"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_percentage: Number(e.target.value) })
                  }
                  min={1}
                  max={90}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || !formData.starts_at || !formData.ends_at || createSale.isPending}
                className="w-full"
              >
                {createSale.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Sale
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sales?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No flash sales created yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sales?.map((sale) => (
            <Card key={sale.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {sale.name}
                    {isActive(sale) ? (
                      <Badge className="bg-green-500">Live</Badge>
                    ) : (
                      <Badge variant="secondary">Scheduled</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sale.is_active}
                      onCheckedChange={(checked) =>
                        updateSale.mutate({ id: sale.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSale.mutate(sale.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg">
                      {sale.discount_percentage}% OFF
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(sale.starts_at), "MMM d, HH:mm")} -{" "}
                    {format(new Date(sale.ends_at), "MMM d, HH:mm")}
                  </div>
                </div>
                {sale.description && (
                  <p className="text-sm text-muted-foreground mt-2">{sale.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
