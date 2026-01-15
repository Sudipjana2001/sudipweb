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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useInfluencers,
  useUpdateInfluencerProfile,
  InfluencerProfile,
} from "@/hooks/useInfluencers";
import {
  Instagram,
  Youtube,
  User,
  CheckCircle2,
  Users,
  ExternalLink,
} from "lucide-react";

export function InfluencerManager() {
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const { data: influencers, isLoading } = useInfluencers();
  const updateInfluencer = useUpdateInfluencerProfile();

  const handleVerify = async (influencer: InfluencerProfile) => {
    await updateInfluencer.mutateAsync({
      id: influencer.id,
      is_verified: !influencer.is_verified,
    });
  };

  const handleDeactivate = async (influencer: InfluencerProfile) => {
    await updateInfluencer.mutateAsync({
      id: influencer.id,
      is_active: !influencer.is_active,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const verifiedCount = influencers?.filter((i) => i.is_verified).length || 0;
  const totalFollowers = influencers?.reduce((sum, i) => sum + i.follower_count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{influencers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Influencer Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {influencers?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No influencers registered yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Social Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers?.map((influencer) => (
                  <TableRow key={influencer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{influencer.display_name}</p>
                          {influencer.is_verified && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500 inline" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>@{influencer.handle}</TableCell>
                    <TableCell>{influencer.follower_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {influencer.instagram_url && (
                          <a
                            href={influencer.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-500 hover:text-pink-600"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                        {influencer.youtube_url && (
                          <a
                            href={influencer.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Youtube className="h-4 w-4" />
                          </a>
                        )}
                        {influencer.tiktok_url && (
                          <a
                            href={influencer.tiktok_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {influencer.is_verified && (
                          <Badge variant="default">Verified</Badge>
                        )}
                        <Badge variant={influencer.is_active ? "secondary" : "destructive"}>
                          {influencer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(influencer)}
                        >
                          {influencer.is_verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(influencer)}
                        >
                          {influencer.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInfluencer(influencer)}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{selectedInfluencer?.display_name}</DialogTitle>
                            </DialogHeader>
                            {selectedInfluencer && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Handle</Label>
                                  <p>@{selectedInfluencer.handle}</p>
                                </div>
                                <div>
                                  <Label>Bio</Label>
                                  <p>{selectedInfluencer.bio || "No bio"}</p>
                                </div>
                                <div>
                                  <Label>Followers</Label>
                                  <p>{selectedInfluencer.follower_count.toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label>Joined</Label>
                                  <p>
                                    {new Date(selectedInfluencer.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
