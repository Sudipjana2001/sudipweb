import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  ShoppingCart, 
  Heart, 
  Package, 
  CreditCard, 
  Search, 
  Eye,
  Plus,
  Edit,
  Trash2,
  Upload,
  Users,
  BarChart3,
  Settings,
  LogIn,
  UserPlus,
  Tag,
  PawPrint,
  Award,
  Scale,
  Truck,
  HelpCircle,
  SlidersHorizontal,
  Star,
  MessageSquare
} from "lucide-react";
import { PageLayout } from "@/components/layouts/PageLayout";
import { SEOHead } from "@/components/SEOHead";

const Documentation = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Documentation"
        description="Complete guide to all features available in Pebric — user guide, admin guide, and quick start instructions."
        keywords="Pebric documentation, user guide, admin guide, features, help"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-muted-foreground text-lg">
              Complete guide to all features available in PawStyle
            </p>
          </div>

          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User Guide
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    User Features Overview
                  </CardTitle>
                  <CardDescription>
                    Everything you can do as a registered user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Account Management */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Account Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<UserPlus className="h-5 w-5" />}
                        title="Sign Up"
                        description="Create a new account with email and password to access all features"
                      />
                      <FeatureCard
                        icon={<LogIn className="h-5 w-5" />}
                        title="Login / Logout"
                        description="Securely sign in and out of your account"
                      />
                    </div>
                  </section>

                  {/* Shopping */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Shopping Experience
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Search className="h-5 w-5" />}
                        title="Smart Search"
                        description="Instantly search products with real-time suggestions and filtering"
                      />
                      <FeatureCard
                        icon={<SlidersHorizontal className="h-5 w-5" />}
                        title="Advanced Filters"
                        description="Filter by collection, category, pet size, and price range"
                      />
                      <FeatureCard
                        icon={<Eye className="h-5 w-5" />}
                        title="Product Details"
                        description="View images, descriptions, sizes, features, and reviews"
                      />
                      <FeatureCard
                        icon={<Scale className="h-5 w-5" />}
                        title="Compare Products"
                        description="Compare up to 4 products side-by-side to find the best fit"
                      />
                      <FeatureCard
                        icon={<ShoppingCart className="h-5 w-5" />}
                        title="Add to Cart"
                        description="Add products with size and quantity options"
                      />
                      <FeatureCard
                        icon={<Heart className="h-5 w-5" />}
                        title="Wishlist"
                        description="Save products to your wishlist for later purchase"
                      />
                    </div>
                  </section>

                  {/* Checkout & Orders */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Checkout & Orders
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Tag className="h-5 w-5" />}
                        title="Apply Coupons"
                        description="Enter discount codes at checkout to save on your order"
                      />
                      <FeatureCard
                        icon={<CreditCard className="h-5 w-5" />}
                        title="Secure Checkout"
                        description="Complete your purchase with shipping and billing info"
                      />
                      <FeatureCard
                        icon={<Package className="h-5 w-5" />}
                        title="Order History"
                        description="View all your past orders and their current status"
                      />
                      <FeatureCard
                        icon={<Truck className="h-5 w-5" />}
                        title="Track Shipment"
                        description="Track your order with real-time shipment updates"
                      />
                    </div>
                  </section>

                  {/* Pet & Loyalty */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PawPrint className="h-5 w-5" />
                      Pet Profiles & Rewards
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<PawPrint className="h-5 w-5" />}
                        title="Pet Profiles"
                        description="Save your pet's measurements for perfect size recommendations"
                      />
                      <FeatureCard
                        icon={<Award className="h-5 w-5" />}
                        title="Loyalty Program"
                        description="Earn points on purchases and redeem for discounts"
                      />
                    </div>
                  </section>

                  {/* Reviews & Support */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reviews & Support
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<MessageSquare className="h-5 w-5" />}
                        title="Write Reviews"
                        description="Share your experience with ratings, comments, and photos"
                      />
                      <FeatureCard
                        icon={<HelpCircle className="h-5 w-5" />}
                        title="FAQ Center"
                        description="Find answers to common questions about orders and products"
                      />
                    </div>
                  </section>

                  {/* Quick Start */}
                  <section className="bg-muted/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Start Guide</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Create an account or log in to your existing account</li>
                      <li>Add your pet's profile with measurements for size recommendations</li>
                      <li>Browse collections and use filters to find products</li>
                      <li>Compare products and add favorites to your wishlist</li>
                      <li>Add items to cart and apply any coupon codes at checkout</li>
                      <li>Track your order and leave a review after receiving</li>
                    </ol>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Features Overview
                  </CardTitle>
                  <CardDescription>
                    Administrative capabilities for managing the store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Access Note */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm">
                      <strong>Note:</strong> Admin features are only accessible to users with the admin role. 
                      Access the admin panel at <Badge variant="secondary">/admin</Badge>
                    </p>
                  </div>

                  {/* Product Management */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Eye className="h-5 w-5" />}
                        title="View All Products"
                        description="See a complete list of all products in the store"
                      />
                      <FeatureCard
                        icon={<Plus className="h-5 w-5" />}
                        title="Add Products"
                        description="Create products with images, descriptions, prices, and sizes"
                      />
                      <FeatureCard
                        icon={<Edit className="h-5 w-5" />}
                        title="Edit Products"
                        description="Update product information, pricing, and availability"
                      />
                      <FeatureCard
                        icon={<Trash2 className="h-5 w-5" />}
                        title="Delete Products"
                        description="Remove products from the store catalog"
                      />
                      <FeatureCard
                        icon={<Upload className="h-5 w-5" />}
                        title="Image Upload"
                        description="Upload product images to cloud storage"
                      />
                      <FeatureCard
                        icon={<Settings className="h-5 w-5" />}
                        title="Product Settings"
                        description="Set featured, best seller, and new arrival status"
                      />
                    </div>
                  </section>

                  {/* Order Management */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Eye className="h-5 w-5" />}
                        title="View All Orders"
                        description="See all customer orders with details and status"
                      />
                      <FeatureCard
                        icon={<Edit className="h-5 w-5" />}
                        title="Update Order Status"
                        description="Change status: Pending, Confirmed, Processing, Shipped, Delivered"
                      />
                      <FeatureCard
                        icon={<Truck className="h-5 w-5" />}
                        title="Shipment Tracking"
                        description="Add tracking numbers and carrier information"
                      />
                    </div>
                  </section>

                  {/* Coupons */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Coupon Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Plus className="h-5 w-5" />}
                        title="Create Coupons"
                        description="Create percentage or fixed amount discount codes"
                      />
                      <FeatureCard
                        icon={<Settings className="h-5 w-5" />}
                        title="Coupon Settings"
                        description="Set expiration dates, usage limits, and minimum order amounts"
                      />
                    </div>
                  </section>

                  {/* Analytics */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Analytics & Reports
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<BarChart3 className="h-5 w-5" />}
                        title="Dashboard Analytics"
                        description="View sales, revenue, and product performance metrics"
                      />
                      <FeatureCard
                        icon={<Users className="h-5 w-5" />}
                        title="Customer Insights"
                        description="Track customer behavior and purchase patterns"
                      />
                    </div>
                  </section>

                  {/* User Management */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FeatureCard
                        icon={<Eye className="h-5 w-5" />}
                        title="View Profiles"
                        description="Access customer profile information"
                      />
                      <FeatureCard
                        icon={<Shield className="h-5 w-5" />}
                        title="Manage Roles"
                        description="Assign admin or moderator roles to users"
                      />
                    </div>
                  </section>

                  {/* Admin Setup */}
                  <section className="bg-muted/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Admin Setup Guide</h3>
                    <p className="text-muted-foreground mb-4">
                      To grant admin access to a user, add their role in the database:
                    </p>
                    <div className="bg-background rounded-md p-4 font-mono text-sm overflow-x-auto">
                      <pre>{`-- In the user_roles table, insert:
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');`}</pre>
                    </div>
                  </section>

                  {/* Order Status Flow */}
                  <section className="bg-muted/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Order Status Flow</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge>Pending</Badge>
                      <span>→</span>
                      <Badge variant="secondary">Confirmed</Badge>
                      <span>→</span>
                      <Badge variant="secondary">Processing</Badge>
                      <span>→</span>
                      <Badge variant="secondary">Shipped</Badge>
                      <span>→</span>
                      <Badge variant="default" className="bg-green-600">Delivered</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Orders can also be marked as <Badge variant="destructive">Cancelled</Badge> at any stage
                    </p>
                  </section>

                  {/* Feature Summary */}
                  <section className="bg-muted/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Complete Feature List</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">User Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>✓ Account registration & login</li>
                          <li>✓ Smart product search</li>
                          <li>✓ Advanced filtering (price, size, category)</li>
                          <li>✓ Product comparison (up to 4)</li>
                          <li>✓ Wishlist management</li>
                          <li>✓ Shopping cart</li>
                          <li>✓ Coupon codes at checkout</li>
                          <li>✓ Order history & tracking</li>
                          <li>✓ Pet profiles with measurements</li>
                          <li>✓ Loyalty points & rewards</li>
                          <li>✓ Product reviews with photos</li>
                          <li>✓ FAQ center</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Admin Features</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>✓ Product CRUD operations</li>
                          <li>✓ Image upload to cloud storage</li>
                          <li>✓ Order management & status updates</li>
                          <li>✓ Coupon creation & management</li>
                          <li>✓ Analytics dashboard</li>
                          <li>✓ User role management</li>
                          <li>✓ Category & collection management</li>
                        </ul>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="flex gap-3 p-4 rounded-lg border bg-card">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Documentation;