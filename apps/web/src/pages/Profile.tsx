import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Award,
  Camera,
  Dog,
  Gift,
  Heart,
  HelpCircle,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings2,
  Repeat,
  RotateCcw,
  Save,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    country: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Something went wrong";

  const quickLinks = [
    { label: "My Orders", href: "/orders", icon: Package },
    { label: "Track Order", href: "/tracking", icon: Truck },
    { label: "My Pets", href: "/pets", icon: Dog },
    { label: "Rewards", href: "/loyalty", icon: Award },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "Support", href: "/support", icon: HelpCircle },
    { label: "FAQs", href: "/faq", icon: HelpCircle },
    { label: "Returns", href: "/returns", icon: RotateCcw },
    { label: "Referrals", href: "/referrals", icon: Gift },
    { label: "Subscriptions", href: "/subscriptions", icon: Repeat },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
        country: profile.country || "",
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated!");
    } catch (error: unknown) {
      toast.error("Failed to upload photo", { description: getErrorMessage(error) });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: unknown) {
      toast.error("Failed to update profile", { description: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead title="My Profile" description="Manage your Pebric account information and preferences." noindex={true} />
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-4xl font-medium mb-2">My Profile</h1>
          <p className="text-muted-foreground mb-8">
            Manage your account information and preferences
          </p>

          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium">
                {profile?.full_name || "Add your name"}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 border-t border-border pt-6">
            <div>
              <h3 className="font-display text-lg font-medium">Profile Sections</h3>
              <p className="text-sm text-muted-foreground">
                Open the section you want to edit
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="profile-details"
                className="overflow-hidden rounded-xl border border-border bg-background px-4"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">
                        Profile Details
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Personal information and address
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pb-0">
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="flex items-center gap-2 font-display text-lg font-medium">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="+91 9876543210"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="pl-10 bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-border pt-6">
                    <h3 className="flex items-center gap-2 font-display text-lg font-medium">
                      <MapPin className="h-5 w-5" />
                      Address
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your street address"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          placeholder="123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          placeholder="India"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pb-4 pt-2">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </form>

          <section className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-medium">Quick Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Shortcuts for your account, orders, and support
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 border border-border bg-background px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-body text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 border border-border bg-background px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-body text-sm font-medium">Admin Dashboard</span>
                  </Link>
                ) : null}
              </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:hidden"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
