import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Package, Users, ShoppingBag, Plus, Pencil, Trash2, Save, Upload, X, MessageCircle, TrendingUp, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollections, useCategories } from "@/hooks/useProducts";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { LowStockAlerts } from "@/components/admin/LowStockAlerts";
import { ReturnsManager } from "@/components/admin/ReturnsManager";
import { SupportManager } from "@/components/admin/SupportManager";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";
import { FlashSalesManager } from "@/components/admin/FlashSalesManager";
import { ProductBundlesManager } from "@/components/admin/ProductBundlesManager";
import { DynamicPricingManager } from "@/components/admin/DynamicPricingManager";
import { AbandonedCartsManager } from "@/components/admin/AbandonedCartsManager";
import { GDPRRequestsManager } from "@/components/admin/GDPRRequestsManager";
import { SatisfactionDashboard } from "@/components/admin/SatisfactionDashboard";
import { RTOAnalytics } from "@/components/admin/RTOAnalytics";
import { CourierPanel } from "@/components/admin/CourierPanel";
import { PaymentReconciliation } from "@/components/admin/PaymentReconciliation";
import { RevenueDashboard } from "@/components/admin/RevenueDashboard";
import { CustomerLocationHeatmap } from "@/components/admin/CustomerLocationHeatmap";
import { DeliverySLADashboard } from "@/components/admin/DeliverySLADashboard";
import { CampaignManager } from "@/components/admin/CampaignManager";
import { InfluencerManager } from "@/components/admin/InfluencerManager";
import { ImageModerationLogs } from "@/components/admin/ImageModerationLogs";
import { RateLimitDashboard } from "@/components/admin/RateLimitDashboard";
import { HeroSlidesManager } from "@/components/admin/HeroSlidesManager";
import { PromoBannersManager } from "@/components/admin/PromoBannersManager";
import { FAQManager } from "@/components/admin/FAQManager";
import { FeaturesManager } from "@/components/admin/FeaturesManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { NewsletterManager } from "@/components/admin/NewsletterManager";
import { InstagramManager } from "@/components/admin/InstagramManager";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  stock: number;
  category_id: string | null;
  collection_id: string | null;
  sizes: string[] | null;
  pet_sizes: string[] | null;
  features: string[] | null;
  images: string[] | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string | null;
}

const defaultSizes = ["XS", "S", "M", "L", "XL"];
const defaultPetSizes = ["XS", "S", "M", "L"];

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const { data: collections = [] } = useCollections();
  const { data: categories = [] } = useCategories();

  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    price: 0,
    original_price: null as number | null,
    description: "",
    image_url: "",
    stock: 100,
    category_id: "",
    collection_id: "",
    sizes: defaultSizes,
    pet_sizes: defaultPetSizes,
    features: ["Premium quality materials", "Matching design", "Machine washable"],
    is_active: true,
    is_best_seller: false,
    is_new_arrival: true,
    images: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      toast.error("Access denied", { description: "Admin access required" });
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    if (products.length === 0) setIsLoading(true);

    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    setIsLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    if (isEdit) {
      const currentImages = editForm.images || [];
      const mainImage = editForm.image_url || uploadedUrls[0];
      setEditForm({
        ...editForm,
        images: [...currentImages, ...uploadedUrls],
        image_url: mainImage,
      });
    } else {
      const currentImages = newProduct.images || [];
      const mainImage = newProduct.image_url || uploadedUrls[0];
      setNewProduct({
        ...newProduct,
        images: [...currentImages, ...uploadedUrls],
        image_url: mainImage,
      });
    }

    toast.success("Images uploaded successfully");
    setUploading(false);
  };

  const removeImage = (index: number, isEdit: boolean) => {
    if (isEdit) {
      const currentImages = [...(editForm.images || [])];
      const removedUrl = currentImages[index];
      currentImages.splice(index, 1);
      let newMainImage = editForm.image_url;
      if (editForm.image_url === removedUrl) {
        newMainImage = currentImages.length > 0 ? currentImages[0] : null;
      }
      setEditForm({ ...editForm, images: currentImages, image_url: newMainImage });
    } else {
      const currentImages = [...(newProduct.images || [])];
      const removedUrl = currentImages[index];
      currentImages.splice(index, 1);
      let newMainImage = newProduct.image_url;
      if (newProduct.image_url === removedUrl) {
        newMainImage = currentImages.length > 0 ? currentImages[0] : "";
      }
      setNewProduct({ ...newProduct, images: currentImages, image_url: newMainImage });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm(product);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: editForm.name,
        price: editForm.price,
        original_price: editForm.original_price,
        stock: editForm.stock,
        is_active: editForm.is_active,
        is_best_seller: editForm.is_best_seller,
        is_new_arrival: editForm.is_new_arrival,
        image_url: editForm.image_url,
        images: editForm.images,
        description: editForm.description,
        category_id: editForm.category_id || null,
        collection_id: editForm.collection_id || null,
      })
      .eq("id", editingProduct);

    if (error) {
      toast.error("Failed to update product");
      return;
    }

    toast.success("Product updated");
    setEditingProduct(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error } = await supabase.rpc("delete_product_admin" as any, { product_id: id });

    if (error) {
      console.error("Delete error:", error);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (error.message.includes("foreign key constraint")) {
        toast.error("Cannot delete product because it is part of an existing order.");
      } else {
        toast.error(`Failed to delete product: ${error.message}`);
      }
      return;
    }

    toast.success("Product deleted successfully");
    fetchData();
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.slug || !newProduct.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      slug: newProduct.slug,
      price: newProduct.price,
      original_price: newProduct.original_price,
      description: newProduct.description,
      image_url: newProduct.image_url || null,
      stock: newProduct.stock,
      category_id: newProduct.category_id || null,
      collection_id: newProduct.collection_id || null,
      sizes: newProduct.sizes,
      pet_sizes: newProduct.pet_sizes,
      features: newProduct.features,
      is_active: newProduct.is_active,
      is_best_seller: newProduct.is_best_seller,
      is_new_arrival: newProduct.is_new_arrival,
      images: newProduct.images,
    });

    if (error) {
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added");
    setIsAddingProduct(false);
    setNewProduct({
      name: "",
      slug: "",
      price: 0,
      original_price: null,
      description: "",
      image_url: "",
      stock: 100,
      category_id: "",
      collection_id: "",
      sizes: defaultSizes,
      pet_sizes: defaultPetSizes,
      features: ["Premium quality materials", "Matching design", "Machine washable"],
      is_active: true,
      is_best_seller: false,
      is_new_arrival: true,
      images: [],
    });
    fetchData();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    toast.success("Order status updated");
    fetchData();
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  // ─── Stat Cards ─────────────────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeProducts = products.filter((p) => p.is_active).length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  const statsCards = [
    {
      label: "Total Products",
      value: products.length,
      sub: `${activeProducts} active`,
      icon: <Package className="h-5 w-5" />,
      gradient: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Orders",
      value: orders.length,
      sub: `${pendingOrders} pending`,
      icon: <ShoppingBag className="h-5 w-5" />,
      gradient: "from-amber-500/10 to-amber-600/5",
      iconColor: "text-amber-600",
    },
    {
      label: "Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      sub: "All time",
      icon: <IndianRupee className="h-5 w-5" />,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-600",
    },
    {
      label: "Live Chat",
      value: "Open",
      sub: "Support dashboard",
      icon: <MessageCircle className="h-5 w-5" />,
      gradient: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-600",
      clickable: true,
      onClick: () => navigate("/admin/chat"),
    },
  ];

  // ─── Section Content Renderer ───────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statsCards.map((card) => (
                <div
                  key={card.label}
                  onClick={card.onClick}
                  className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${card.gradient} p-5 transition-all duration-200 ${
                    card.clickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                    </div>
                    <div className={`rounded-lg bg-background/80 p-2.5 ${card.iconColor}`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setActiveSection("products")}>
                <Package className="mr-2 h-4 w-4" /> Manage Products
              </Button>
              <Button variant="outline" onClick={() => setActiveSection("orders")}>
                <ShoppingBag className="mr-2 h-4 w-4" /> View Orders
              </Button>
              <Button variant="outline" onClick={() => setActiveSection("analytics")}>
                <TrendingUp className="mr-2 h-4 w-4" /> Analytics
              </Button>
            </div>

            {/* Recent Orders Preview */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveSection("orders")}>
                  View All →
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="transition-colors hover:bg-muted/20">
                          <td className="px-4 py-3 text-sm font-medium">{order.order_number}</td>
                          <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">₹{order.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                order.status === "delivered"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case "products":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Products</h2>
                <p className="text-sm text-muted-foreground">{products.length} products total</p>
              </div>
              <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug *</Label>
                        <Input
                          id="slug"
                          value={newProduct.slug}
                          onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value })}
                          placeholder="product-name"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="original_price">Original Price</Label>
                        <Input
                          id="original_price"
                          type="number"
                          value={newProduct.original_price || ""}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, original_price: e.target.value ? Number(e.target.value) : null })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="collection">Collection</Label>
                        <select
                          id="collection"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={newProduct.collection_id}
                          onChange={(e) => setNewProduct({ ...newProduct, collection_id: e.target.value })}
                        >
                          <option value="">Select collection</option>
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={newProduct.category_id}
                          onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label>Product Images</Label>
                      <div className="mt-2 flex flex-wrap gap-4">
                        {newProduct.images &&
                          newProduct.images.length > 0 &&
                          newProduct.images.map((img, index) => (
                            <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted group">
                              <img src={img} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                              <button
                                onClick={() => removeImage(index, false)}
                                className="absolute right-1 top-1 rounded-full bg-background p-1 opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              {newProduct.image_url === img && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white text-center py-0.5">
                                  Main
                                </div>
                              )}
                            </div>
                          ))}
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? "Uploading..." : "Upload Images"}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, false)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="is_best_seller"
                          checked={newProduct.is_best_seller}
                          onChange={(e) => setNewProduct({ ...newProduct, is_best_seller: e.target.checked })}
                        />
                        <Label htmlFor="is_best_seller">Best Seller</Label>
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="is_new_arrival"
                          checked={newProduct.is_new_arrival}
                          onChange={(e) => setNewProduct({ ...newProduct, is_new_arrival: e.target.checked })}
                        />
                        <Label htmlFor="is_new_arrival">New Arrival</Label>
                      </div>
                    </div>

                    <Button onClick={handleAddProduct} className="w-full">
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Price</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                            )}
                            <div>
                              {editingProduct === product.id ? (
                                <Input
                                  value={editForm.name || ""}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="w-36 sm:w-48"
                                />
                              ) : (
                                <span className="font-medium text-sm">{product.name}</span>
                              )}
                              <p className="text-xs text-muted-foreground sm:hidden">₹{product.price}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          {editingProduct === product.id ? (
                            <Input
                              type="number"
                              value={editForm.price || ""}
                              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                              className="w-24"
                            />
                          ) : (
                            <span className="text-sm">₹{product.price}</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          {editingProduct === product.id ? (
                            <Input
                              type="number"
                              value={editForm.stock || ""}
                              onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                              className="w-20"
                            />
                          ) : (
                            <span className="text-sm">{product.stock}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {editingProduct === product.id ? (
                              <Button size="sm" onClick={handleSave}>
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "orders":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Orders</h2>
              <p className="text-sm text-muted-foreground">{orders.length} orders total</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{order.order_number}</span>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">₹{order.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // ─── Content sections (render existing manager components) ──
      case "hero-slides":
        return <HeroSlidesManager />;
      case "promo-banners":
        return <PromoBannersManager />;
      case "faqs":
        return <FAQManager />;
      case "features":
        return <FeaturesManager />;
      case "testimonials":
        return <TestimonialsManager />;
      case "newsletter":
        return <NewsletterManager />;
      case "instagram":
        return <InstagramManager />;
      case "gallery":
        return <GalleryManager />;

      // ─── Marketing sections ──
      case "coupons":
        return <CouponsManager />;
      case "flash-sales":
        return <FlashSalesManager />;
      case "bundles":
        return <ProductBundlesManager />;
      case "pricing":
        return <DynamicPricingManager />;
      case "campaigns":
        return <CampaignManager />;
      case "influencers":
        return <InfluencerManager />;

      // ─── Operations sections ──
      case "courier":
        return <CourierPanel />;
      case "sla":
        return <DeliverySLADashboard />;
      case "returns":
        return <ReturnsManager />;
      case "rto":
        return <RTOAnalytics />;
      case "support":
        return <SupportManager />;
      case "abandoned":
        return <AbandonedCartsManager />;
      case "stock":
        return <LowStockAlerts />;

      // ─── Analytics sections ──
      case "analytics":
        return <AnalyticsDashboard />;
      case "revenue":
        return <RevenueDashboard />;
      case "locations":
        return <CustomerLocationHeatmap />;
      case "payments":
        return <PaymentReconciliation />;
      case "satisfaction":
        return <SatisfactionDashboard />;

      // ─── System sections ──
      case "moderation":
        return <ImageModerationLogs />;
      case "rate-limits":
        return <RateLimitDashboard />;
      case "gdpr":
        return <GDPRRequestsManager />;
      case "logs":
        return <AuditLogsViewer />;

      default:
        return <div className="text-muted-foreground">Select a section from the sidebar.</div>;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
}
