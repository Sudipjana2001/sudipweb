import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "@/components/layouts/PageLayout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { SlidersHorizontal, X, Search, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCollection, setSelectedCollection] = useState<string>(
    searchParams.get("collection") || "all"
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "featured"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedPetSize, setSelectedPetSize] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  // Calculate price bounds
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 500 };
    const prices = products.map(p => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const petSizes = ["XS", "S", "M", "L"];

  // Sync URL params with state
  useEffect(() => {
    const collection = searchParams.get("collection");
    const sort = searchParams.get("sort");
    const search = searchParams.get("search");
    
    if (collection) setSelectedCollection(collection);
    if (sort) setSortBy(sort);
    if (search !== null) setSearchQuery(search);
  }, [searchParams]);

  const filteredProducts = products.filter((p) => {
    const matchesCollection =
      selectedCollection === "all" || p.collection?.slug === selectedCollection;
    
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category?.name && p.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.collection?.name && p.collection.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];

    const matchesPetSize = selectedPetSize === "all" || 
      (p.pet_sizes && p.pet_sizes.includes(selectedPetSize));

    const matchesCategory = selectedCategory === "all" || 
      p.category?.id === selectedCategory;
    
    return matchesCollection && matchesSearch && matchesPrice && matchesPetSize && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
      default:
        return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0);
    }
  });

  const handleCollectionChange = (col: string) => {
    setSelectedCollection(col);
    const newParams = new URLSearchParams(searchParams);
    if (col === "all") {
      newParams.delete("collection");
    } else {
      newParams.set("collection", col);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    const newParams = new URLSearchParams(searchParams);
    if (sort === "featured") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", sort);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (!query.trim()) {
      newParams.delete("search");
    } else {
      newParams.set("search", query);
    }
    setSearchParams(newParams);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Explore Our
          </p>
          <h1 className="mb-4 font-display text-5xl font-medium tracking-tight md:text-6xl">
            {searchQuery ? `Search: "${searchQuery}"` : "All Products"}
          </h1>
          <p className="mx-auto max-w-xl font-body text-lg text-muted-foreground">
            {searchQuery 
              ? `Found ${sortedProducts.length} result${sortedProducts.length !== 1 ? "s" : ""}`
              : "Discover our complete collection of premium twinning outfits for you and your pet."
            }
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-6">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full border border-border bg-transparent py-3 pl-12 pr-10 font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-border px-4 py-2 font-body text-sm transition-colors hover:border-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {/* Desktop Collection Filters */}
            <div className="hidden items-center gap-2 lg:flex">
              <span className="font-body text-sm text-muted-foreground">Collection:</span>
              {["all", "summer", "winter", "rainy"].map((col) => (
                <button
                  key={col}
                  onClick={() => handleCollectionChange(col)}
                  className={`px-4 py-2 font-body text-sm capitalize transition-colors ${
                    selectedCollection === col
                      ? "bg-foreground text-background"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {col === "all" ? "All" : col}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body text-sm text-muted-foreground">
                {sortedProducts.length} Products
              </span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border border-border bg-transparent px-4 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="mb-8 border border-border p-6 bg-muted/30">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-medium">Filters</span>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Collection Filter */}
                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Collection
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["all", "summer", "winter", "rainy"].map((col) => (
                      <button
                        key={col}
                        onClick={() => handleCollectionChange(col)}
                        className={`px-3 py-1.5 font-body text-sm capitalize transition-colors ${
                          selectedCollection === col
                            ? "bg-foreground text-background"
                            : "bg-background border border-border hover:border-foreground"
                        }`}
                      >
                        {col === "all" ? "All" : col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full border border-border bg-background px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Pet Size Filter */}
                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Pet Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["all", ...petSizes].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedPetSize(size)}
                        className={`px-3 py-1.5 font-body text-sm transition-colors ${
                          selectedPetSize === size
                            ? "bg-foreground text-background"
                            : "bg-background border border-border hover:border-foreground"
                        }`}
                      >
                        {size === "all" ? "All" : size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={5}
                    className="mt-4"
                  />
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedCollection !== "all" || selectedCategory !== "all" || selectedPetSize !== "all" || priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max) && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <span className="font-body text-sm text-muted-foreground">Active:</span>
                  {selectedCollection !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-foreground px-2 py-1 text-xs text-background">
                      {selectedCollection}
                      <button onClick={() => handleCollectionChange("all")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-foreground px-2 py-1 text-xs text-background">
                      {categories.find(c => c.id === selectedCategory)?.name}
                      <button onClick={() => setSelectedCategory("all")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {selectedPetSize !== "all" && (
                    <span className="inline-flex items-center gap-1 bg-foreground px-2 py-1 text-xs text-background">
                      Pet: {selectedPetSize}
                      <button onClick={() => setSelectedPetSize("all")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {(priceRange[0] > priceBounds.min || priceRange[1] < priceBounds.max) && (
                    <span className="inline-flex items-center gap-1 bg-foreground px-2 py-1 text-xs text-background">
                      ${priceRange[0]}-${priceRange[1]}
                      <button onClick={() => setPriceRange([priceBounds.min, priceBounds.max])}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      handleCollectionChange("all");
                      setSelectedCategory("all");
                      setSelectedPetSize("all");
                      setPriceRange([priceBounds.min, priceBounds.max]);
                    }}
                    className="ml-2 font-body text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {sortedProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                  />
                ))}
              </div>

              {/* No Results */}
              {sortedProducts.length === 0 && (
                <div className="py-20 text-center">
                  <p className="mb-4 font-display text-2xl">No products found</p>
                  <p className="font-body text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="mt-4 border border-border px-6 py-2 font-body text-sm transition-colors hover:bg-muted"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
