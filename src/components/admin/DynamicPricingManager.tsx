import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDynamicPricingRules,
  useCreatePricingRule,
  useUpdatePricingRule,
  useDeletePricingRule,
} from "@/hooks/useDynamicPricing";

export function DynamicPricingManager() {
  const { data: rules, isLoading } = useDynamicPricingRules();
  const createRule = useCreatePricingRule();
  const updateRule = useUpdatePricingRule();
  const deleteRule = useDeletePricingRule();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rule_type: "time_based",
    discount_type: "percentage",
    discount_value: 10,
    priority: 0,
  });

  const handleCreate = async () => {
    await createRule.mutateAsync({
      name: formData.name,
      rule_type: formData.rule_type,
      conditions: {},
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      priority: formData.priority,
      is_active: true,
    });
    setIsOpen(false);
    setFormData({
      name: "",
      rule_type: "time_based",
      discount_type: "percentage",
      discount_value: 10,
      priority: 0,
    });
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
          <DollarSign className="h-5 w-5 text-green-500" />
          Dynamic Pricing Rules
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pricing Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Happy Hour Discount"
                />
              </div>
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_based">Time Based</SelectItem>
                    <SelectItem value="quantity_based">Quantity Based</SelectItem>
                    <SelectItem value="user_segment">User Segment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: Number(e.target.value) })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority (higher = applies first)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || createRule.isPending}
                className="w-full"
              >
                {createRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rules?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pricing rules created yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules?.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {rule.rule_type.replace("_", " ")}
                        </Badge>
                        <Badge className="bg-green-500">
                          {rule.discount_type === "percentage"
                            ? `${rule.discount_value}% off`
                            : `₹${rule.discount_value} off`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Priority: {rule.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) =>
                        updateRule.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
