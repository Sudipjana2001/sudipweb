import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, ShoppingBag, Plus, Pencil, Trash2, Save, Upload, X, Tag, BarChart3, Image, RotateCcw, MessageCircle, ScrollText, AlertTriangle, Zap, Gift, DollarSign, ShoppingCart, Shield, Star, Truck, TrendingDown, CreditCard, PieChart, MapPin, Target, Clock, UserCheck } from "lucide-react";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    // Only show full page loader if we have no data yet
    if (products.length === 0) {
      setIsLoading(true);
    }
    
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

        if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
        }

        const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
    }

    if (isEdit) {
        // For edit mode, we append to existing images if any, or create new array
        const currentImages = editForm.images || [];
        // If this is the first image being uploaded and there is no main image_url, set it
        const mainImage = editForm.image_url || uploadedUrls[0];
        setEditForm({ 
            ...editForm, 
            images: [...currentImages, ...uploadedUrls],
            image_url: mainImage
        });
    } else {
        const currentImages = newProduct.images || [];
        const mainImage = newProduct.image_url || uploadedUrls[0];
        setNewProduct({ 
            ...newProduct, 
            images: [...currentImages, ...uploadedUrls],
            image_url: mainImage 
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
          
          // If we removed the main image, set the new first image as main, or empty if none left
          let newMainImage = editForm.image_url;
          if (editForm.image_url === removedUrl) {
              newMainImage = currentImages.length > 0 ? currentImages[0] : null;
          }

          setEditForm({ ...editForm, images: currentImages, image_url: newMainImage });
      } else {
          const currentImages = [...(newProduct.images || [])];
           const removedUrl = currentImages[index];
          currentImages.splice(index, 1);

           // If we removed the main image, set the new first image as main
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
    // Start animation
    setDeletingIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
    });

    // Wait for animation to finish
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use RPC function to bypass RLS and ensure deletion
    const { error } = await supabase.rpc('delete_product_admin' as any, { product_id: id });

    if (error) {
      console.error("Delete error:", error);
      // Revert animation state on error
      setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
      
      if (error.message.includes('foreign key constraint')) {
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
      <PageLayout showNewsletter={false}>
        <div className="container mx-auto px-6 py-16">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <PageLayout showNewsletter={false}>
      <div className="container mx-auto px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-4xl font-medium">Admin Dashboard</h1>
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
                      onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value ? Number(e.target.value) : null })}
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
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Product Images</Label>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {newProduct.images && newProduct.images.length > 0 ? (
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
                        ))
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
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

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <Package className="h-10 w-10 text-primary" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-muted-foreground">Products</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <ShoppingBag className="h-10 w-10 text-primary" />
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-muted-foreground">Orders</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  ₹{orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </p>
                <p className="text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-lg border border-border bg-card p-6 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate("/admin/chat")}
          >
            <div className="flex items-center gap-4">
              <MessageCircle className="h-10 w-10 text-primary" />
              <div>
                <p className="text-2xl font-bold">Live Chat</p>
                <p className="text-muted-foreground">Support Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="hero-slides"><Image className="h-3 w-3 mr-1" />Hero Slides</TabsTrigger>
            <TabsTrigger value="promo-banners"><Zap className="h-3 w-3 mr-1" />Promo Banners</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="features"><Star className="h-3 w-3 mr-1" />Features</TabsTrigger>
            <TabsTrigger value="testimonials"><MessageCircle className="h-3 w-3 mr-1" />Testimonials</TabsTrigger>
            <TabsTrigger value="newsletter"><MessageCircle className="h-3 w-3 mr-1" />Newsletter</TabsTrigger>
            <TabsTrigger value="instagram"><Image className="h-3 w-3 mr-1" />Instagram</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="courier"><Truck className="h-3 w-3 mr-1" />Courier</TabsTrigger>
            <TabsTrigger value="sla"><Clock className="h-3 w-3 mr-1" />SLA</TabsTrigger>
            <TabsTrigger value="gallery"><Image className="h-3 w-3 mr-1" />Gallery</TabsTrigger>
            <TabsTrigger value="moderation"><Shield className="h-3 w-3 mr-1" />Moderation</TabsTrigger>
            <TabsTrigger value="influencers"><UserCheck className="h-3 w-3 mr-1" />Influencers</TabsTrigger>
            <TabsTrigger value="returns"><RotateCcw className="h-3 w-3 mr-1" />Returns</TabsTrigger>
            <TabsTrigger value="rto"><TrendingDown className="h-3 w-3 mr-1" />RTO</TabsTrigger>
            <TabsTrigger value="support"><MessageCircle className="h-3 w-3 mr-1" />Support</TabsTrigger>
            <TabsTrigger value="coupons"><Tag className="h-3 w-3 mr-1" />Coupons</TabsTrigger>
            <TabsTrigger value="flash-sales"><Zap className="h-3 w-3 mr-1" />Flash Sales</TabsTrigger>
            <TabsTrigger value="bundles"><Gift className="h-3 w-3 mr-1" />Bundles</TabsTrigger>
            <TabsTrigger value="pricing"><DollarSign className="h-3 w-3 mr-1" />Pricing</TabsTrigger>
            <TabsTrigger value="abandoned"><ShoppingCart className="h-3 w-3 mr-1" />Abandoned</TabsTrigger>
            <TabsTrigger value="stock"><AlertTriangle className="h-3 w-3 mr-1" />Stock</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-3 w-3 mr-1" />Payments</TabsTrigger>
            <TabsTrigger value="revenue"><PieChart className="h-3 w-3 mr-1" />Revenue</TabsTrigger>
            <TabsTrigger value="campaigns"><Target className="h-3 w-3 mr-1" />Campaigns</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-3 w-3 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="locations"><MapPin className="h-3 w-3 mr-1" />Locations</TabsTrigger>
            <TabsTrigger value="rate-limits"><Shield className="h-3 w-3 mr-1" />Rate Limits</TabsTrigger>
            <TabsTrigger value="satisfaction"><Star className="h-3 w-3 mr-1" />CSAT</TabsTrigger>
            <TabsTrigger value="gdpr"><Shield className="h-3 w-3 mr-1" />GDPR</TabsTrigger>
            <TabsTrigger value="logs"><ScrollText className="h-3 w-3 mr-1" />Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr 
                        key={product.id} 
                        className={`border-b border-border transition-all duration-500 ease-in-out ${
                            deletingIds.has(product.id) ? "opacity-0 -translate-x-full" : "opacity-100"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            )}
                            {editingProduct === product.id ? (
                              <Input
                                value={editForm.name || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, name: e.target.value })
                                }
                                className="w-48"
                              />
                            ) : (
                              <span className="font-medium">{product.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {editingProduct === product.id ? (
                            <Input
                              type="number"
                              value={editForm.price || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: Number(e.target.value) })
                              }
                              className="w-24"
                            />
                          ) : (
                            <span>₹{product.price}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingProduct === product.id ? (
                            <Input
                              type="number"
                              value={editForm.stock || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, stock: Number(e.target.value) })
                              }
                              className="w-20"
                            />
                          ) : (
                            <span>{product.stock}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              product.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {editingProduct === product.id ? (
                              <Button size="sm" onClick={handleSave}>
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                            >
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
          </TabsContent>

          <TabsContent value="hero-slides" className="mt-6">
            <HeroSlidesManager />
          </TabsContent>

          <TabsContent value="promo-banners" className="mt-6">
            <PromoBannersManager />
          </TabsContent>
          <TabsContent value="faqs" className="mt-6">
            <FAQManager />
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <FeaturesManager />
          </TabsContent>

          <TabsContent value="testimonials" className="mt-6">
            <TestimonialsManager />
          </TabsContent>

          <TabsContent value="newsletter" className="mt-6">
            <NewsletterManager />
          </TabsContent>

          <TabsContent value="instagram" className="mt-6">
            <InstagramManager />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Order</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border">
                        <td className="px-4 py-3 font-medium">{order.order_number}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">₹{order.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
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
          </TabsContent>

          <TabsContent value="courier" className="mt-6">
            <CourierPanel />
          </TabsContent>

          <TabsContent value="sla" className="mt-6">
            <DeliverySLADashboard />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <GalleryManager />
          </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <ImageModerationLogs />
          </TabsContent>

          <TabsContent value="influencers" className="mt-6">
            <InfluencerManager />
          </TabsContent>

          <TabsContent value="returns" className="mt-6">
            <ReturnsManager />
          </TabsContent>

          <TabsContent value="rto" className="mt-6">
            <RTOAnalytics />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <SupportManager />
          </TabsContent>

          <TabsContent value="coupons" className="mt-6">
            <CouponsManager />
          </TabsContent>

          <TabsContent value="flash-sales" className="mt-6">
            <FlashSalesManager />
          </TabsContent>

          <TabsContent value="bundles" className="mt-6">
            <ProductBundlesManager />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <DynamicPricingManager />
          </TabsContent>

          <TabsContent value="abandoned" className="mt-6">
            <AbandonedCartsManager />
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <LowStockAlerts />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentReconciliation />
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <RevenueDashboard />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="locations" className="mt-6">
            <CustomerLocationHeatmap />
          </TabsContent>

          <TabsContent value="rate-limits" className="mt-6">
            <RateLimitDashboard />
          </TabsContent>

          <TabsContent value="satisfaction" className="mt-6">
            <SatisfactionDashboard />
          </TabsContent>

          <TabsContent value="gdpr" className="mt-6">
            <GDPRRequestsManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
