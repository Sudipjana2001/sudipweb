import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  useCampaigns,
  useCampaignStats,
  useCreateCampaign,
  useUpdateCampaign,
  Campaign,
} from "@/hooks/useCampaigns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Plus,
  Target,
} from "lucide-react";

export function CampaignManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaign_type: "email",
    budget: "",
    start_date: "",
    end_date: "",
  });

  const { data: campaigns } = useCampaigns();
  const { data: stats, isLoading } = useCampaignStats();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const handleCreate = async () => {
    await createCampaign.mutateAsync({
      name: newCampaign.name,
      description: newCampaign.description || undefined,
      campaign_type: newCampaign.campaign_type,
      budget: newCampaign.budget ? parseFloat(newCampaign.budget) : undefined,
      start_date: newCampaign.start_date || undefined,
      end_date: newCampaign.end_date || undefined,
    });
    setIsCreateOpen(false);
    setNewCampaign({
      name: "",
      description: "",
      campaign_type: "email",
      budget: "",
      start_date: "",
      end_date: "",
    });
  };

  const handleStatusChange = async (campaign: Campaign, status: string) => {
    await updateCampaign.mutateAsync({ id: campaign.id, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Performance</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="type">Campaign Type</Label>
                <Select
                  value={newCampaign.campaign_type}
                  onValueChange={(value) =>
                    setNewCampaign({ ...newCampaign, campaign_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Date</Label>
                  <Input
                    id="start"
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Date</Label>
                  <Input
                    id="end"
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newCampaign.budget}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, budget: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreate} disabled={!newCampaign.name}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalImpressions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              CTR: {stats?.overallCTR}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConversions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats?.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.overallROI}%</div>
          </CardContent>
        </Card>
      </div>

      {stats?.campaignPerformance && stats.campaignPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.campaignPerformance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="totalClicks" fill="hsl(var(--primary))" name="Clicks" />
                  <Bar yAxisId="right" dataKey="totalConversions" fill="hsl(var(--secondary))" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No campaigns yet. Create your first campaign!
              </p>
            ) : (
              campaigns?.map((campaign) => {
                const perf = stats?.campaignPerformance.find(
                  (p) => p.id === campaign.id
                );
                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Target className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.campaign_type} • {campaign.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p>Clicks: {perf?.totalClicks || 0}</p>
                        <p className="text-muted-foreground">
                          CTR: {perf?.ctr || 0}%
                        </p>
                      </div>
                      <Select
                        value={campaign.status}
                        onValueChange={(value) => handleStatusChange(campaign, value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "paused"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
