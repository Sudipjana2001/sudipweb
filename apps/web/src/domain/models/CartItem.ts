/**
 * CartItem domain model with encapsulated business logic.
 * Handles size normalization, key generation, and matching.
 */
export class CartItemModel {
  constructor(
    public readonly id: number | string,
    public readonly name: string,
    public readonly price: number,
    public readonly image: string,
    public readonly ownerSize: string,
    public readonly petSize: string,
    public readonly quantity: number,
    public readonly slug: string
  ) {}

  /**
   * Generate unique key for cart item (handles size variants)
   */
  get key(): string {
    return CartItemModel.generateKey(this.id, this.ownerSize, this.petSize);
  }

  /**
   * Calculate line total for this item
   */
  get lineTotal(): number {
    return this.price * this.quantity;
  }

  /**
   * Create a new CartItemModel with updated quantity
   */
  withQuantity(quantity: number): CartItemModel {
    return new CartItemModel(
      this.id,
      this.name,
      this.price,
      this.image,
      this.ownerSize,
      this.petSize,
      quantity,
      this.slug
    );
  }

  /**
   * Increment quantity by 1
   */
  incrementQuantity(): CartItemModel {
    return this.withQuantity(this.quantity + 1);
  }

  /**
   * Decrement quantity by 1 (minimum 0)
   */
  decrementQuantity(): CartItemModel {
    return this.withQuantity(Math.max(0, this.quantity - 1));
  }

  /**
   * Check if this item matches another by product and sizes
   */
  matches(productId: number | string, ownerSize: string, petSize: string): boolean {
    return (
      this.id === productId &&
      this.ownerSize === CartItemModel.normalizeSize(ownerSize) &&
      this.petSize === CartItemModel.normalizeSize(petSize)
    );
  }

  /**
   * Convert to plain object (for context state)
   */
  toPlainObject(): CartItemData {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      image: this.image,
      ownerSize: this.ownerSize,
      petSize: this.petSize,
      quantity: this.quantity,
      slug: this.slug,
    };
  }

  /**
   * Static: Generate unique key for cart item
   */
  static generateKey(productId: string | number, ownerSize: string, petSize: string): string {
    return `${productId}-${CartItemModel.normalizeSize(ownerSize)}-${CartItemModel.normalizeSize(petSize)}`;
  }

  /**
   * Static: Normalize size value (handles null, empty, "N/A" consistently)
   */
  static normalizeSize(size: string | null | undefined): string {
    if (!size || size === '' || size === 'N/A') {
      return 'N/A';
    }
    return size;
  }

  /**
   * Static: Check if two sizes match (handles N/A equivalence)
   */
  static sizesMatch(size1: string, dbSize: string | null): boolean {
    const normalized1 = CartItemModel.normalizeSize(size1);
    const normalized2 = CartItemModel.normalizeSize(dbSize);

    if (normalized1 === 'N/A') {
      return [null, '', 'N/A', undefined].includes(dbSize);
    }
    return normalized1 === normalized2;
  }

  /**
   * Static: Create from raw database record
   */
  static fromDatabaseRecord(record: RawCartItemRecord): CartItemModel {
    return new CartItemModel(
      record.product.id,
      record.product.name,
      record.product.price,
      record.product.image_url || record.product.images?.[0] || '',
      CartItemModel.normalizeSize(record.size),
      CartItemModel.normalizeSize(record.pet_size),
      record.quantity,
      record.product.slug
    );
  }

  /**
   * Static: Create from plain object
   */
  static fromPlainObject(data: CartItemData): CartItemModel {
    return new CartItemModel(
      data.id,
      data.name,
      data.price,
      data.image,
      data.ownerSize,
      data.petSize,
      data.quantity,
      data.slug
    );
  }
}

export interface CartItemData {
  id: number | string;
  name: string;
  price: number;
  image: string;
  ownerSize: string;
  petSize: string;
  quantity: number;
  slug: string;
}

export interface RawCartItemRecord {
  size: string | null;
  pet_size: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    images: string[] | null;
    slug: string;
  };
}
