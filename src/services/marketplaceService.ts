// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/utils/utils";
import type { Database } from "@/integrations/supabase/types";
import {
  Product,
  SellerProfile,
  Review,
  Order,
  OrderItem,
  CartItem,
  Address,
  PaymentMethod,
  Category,
  BoostOption,
  Promotion,
  MarketplaceStats,
  SellerStats,
  SearchResult,
  ProductFilter,
} from "@/types/marketplace";

export class MarketplaceService {
  // Default categories fallback
  readonly DEFAULT_CATEGORIES: Category[] = [
    {
      id: "electronics",
      name: "Electronics",
      slug: "electronics",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: true,
      subcategories: []
    },
    {
      id: "fashion",
      name: "Fashion",
      slug: "fashion",
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: true,
      subcategories: []
    },
    {
      id: "home-garden",
      name: "Home & Garden",
      slug: "home-garden",
      image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: true,
      subcategories: []
    },
    {
      id: "sports",
      name: "Sports & Outdoors",
      slug: "sports",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: false,
      subcategories: []
    },
    {
      id: "books",
      name: "Books & Media",
      slug: "books",
      image: "https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: false,
      subcategories: []
    },
    {
      id: "beauty",
      name: "Beauty & Personal Care",
      slug: "beauty",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&auto=format&fit=crop",
      productCount: 0,
      featured: false,
      subcategories: []
    },
  ];

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
        console.warn("Supabase categories fetch failed, using defaults:", errorMsg);
        return this.DEFAULT_CATEGORIES;
      }

      if (!data || data.length === 0) {
        console.info("No categories found in database, using defaults");
        return this.DEFAULT_CATEGORIES;
      }

      return data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image || "",
        productCount: category.product_count || 0,
        featured: category.featured || false,
        subcategories: [] // Would need to fetch subcategories separately
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("Error in getCategories (using defaults):", errorMsg);
      return this.DEFAULT_CATEGORIES;
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error("Error fetching category:", error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        image: data.image || "",
        productCount: data.product_count || 0,
        featured: data.featured || false,
        subcategories: []
      };
    } catch (error) {
      console.error("Error in getCategoryBySlug:", error);
      return null;
    }
  }

  // Products
  async getProducts(filters: ProductFilter = {}): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`*`);

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }

      if (filters.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 20);

      if (error) {
        console.error("Error fetching products:", getErrorMessage(error));
        return [];
      }

      return data.map(product => ({
        id: product.id,
        sellerId: product.seller_id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        discountPrice: product.discount_price,
        image: product.image_url || "",
        images: product.image_url ? [product.image_url] : [],
        category: product.category || "",
        subcategory: product.subcategory || undefined,
        rating: product.rating || 0,
        reviewCount: product.review_count || 0,
        inStock: product.in_stock || false,
        stockQuantity: product.stock_quantity || 0,
        isNew: product.is_new || false,
        isFeatured: product.is_featured || false,
        isSponsored: product.is_sponsored || false,
        tags: product.tags || [],
        sellerName: product.seller?.full_name || "Unknown Seller",
        sellerAvatar: product.seller?.avatar_url || "",
        sellerVerified: product.seller?.is_verified || false,
        condition: product.condition || "new",
        brand: product.brand || undefined,
        model: product.model || undefined,
        createdAt: new Date(product.created_at).toISOString(),
        updatedAt: new Date(product.updated_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in getProducts:", error);
      return [];
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        sellerId: data.seller_id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        discountPrice: data.discount_price,
        image: data.image_url || "",
        images: data.image_url ? [data.image_url] : [],
        category: data.category || "",
        subcategory: data.subcategory || undefined,
        rating: data.rating || 0,
        reviewCount: data.review_count || 0,
        inStock: data.in_stock || false,
        stockQuantity: data.stock_quantity || 0,
        isNew: data.is_new || false,
        isFeatured: data.is_featured || false,
        isSponsored: data.is_sponsored || false,
        tags: data.tags || [],
        sellerName: data.seller?.full_name || "Unknown Seller",
        sellerAvatar: data.seller?.avatar_url || "",
        sellerVerified: data.seller?.is_verified || false,
        condition: data.condition || "new",
        brand: data.brand || undefined,
        model: data.model || undefined,
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in getProductById:", error);
      return null;
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          seller_id: productData.sellerId,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          discount_price: productData.discountPrice,
          currency: productData.currency,
          category_id: productData.categoryId,
          subcategory_id: productData.subcategoryId,
          image_url: productData.imageUrl,
          in_stock: productData.inStock,
          stock_quantity: productData.stockQuantity,
          is_featured: productData.isFeatured,
          is_sponsored: productData.isSponsored,
          boost_until: productData.boostExpiresAt?.toISOString(),
          tags: productData.tags,
          // Digital product fields
          product_type: productData.productType,
          digital_product_type: productData.digitalProductType,
          download_url: productData.downloadUrl,
          license_type: productData.licenseType,
          download_limit: productData.downloadLimit,
          download_expiry_days: productData.downloadExpiryDays,
          file_size: productData.fileSize,
          file_format: productData.fileFormat,
          author: productData.author,
          co_author: productData.coAuthor,
          publisher: productData.publisher,
          publication_date: productData.publicationDate,
          isbn: productData.isbn,
          pages: productData.pages,
          language: productData.language,
          age_group: productData.ageGroup,
          skill_level: productData.skillLevel,
          course_duration: productData.courseDuration,
          course_modules: productData.courseModules,
          includes_source_files: productData.includesSourceFiles,
          // Physical product fields
          weight: productData.weight,
          size: productData.size,
          color: productData.color,
          material: productData.material,
          care_instructions: productData.careInstructions,
          assembly_required: productData.assemblyRequired,
          assembly_time: productData.assemblyTime,
          package_length: productData.packageDimensions?.length,
          package_width: productData.packageDimensions?.width,
          package_height: productData.packageDimensions?.height,
          package_weight: productData.packageWeight,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
        return null;
      }

      return {
        id: data.id,
        sellerId: data.seller_id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        discountPrice: data.discount_price,
        currency: data.currency || "USD",
        image: data.image_url || "",
        images: data.image_url ? [data.image_url] : [],
        category: data.category || "",
        subcategory: data.subcategory || undefined,
        rating: data.rating || 0,
        reviewCount: data.review_count || 0,
        inStock: data.in_stock || false,
        stockQuantity: data.stock_quantity || 0,
        isNew: data.is_new || false,
        isFeatured: data.is_featured || false,
        isSponsored: data.is_sponsored || false,
        tags: data.tags || [],
        sellerName: "", // Would need to fetch seller data
        sellerAvatar: "",
        sellerVerified: false,
        condition: data.condition || "new",
        brand: data.brand || undefined,
        model: data.model || undefined,
        // Digital product fields
        productType: data.product_type || "physical",
        digitalProductType: data.digital_product_type,
        downloadUrl: data.download_url,
        licenseType: data.license_type,
        downloadLimit: data.download_limit,
        downloadExpiryDays: data.download_expiry_days,
        fileSize: data.file_size,
        fileFormat: data.file_format,
        author: data.author,
        coAuthor: data.co_author,
        publisher: data.publisher,
        publicationDate: data.publication_date,
        isbn: data.isbn,
        pages: data.pages,
        language: data.language,
        ageGroup: data.age_group,
        skillLevel: data.skill_level,
        courseDuration: data.course_duration,
        courseModules: data.course_modules,
        includesSourceFiles: data.includes_source_files,
        // Physical product fields
        weight: data.weight,
        size: data.size,
        color: data.color,
        material: data.material,
        careInstructions: data.care_instructions,
        assemblyRequired: data.assembly_required,
        assemblyTime: data.assembly_time,
        packageDimensions: data.package_length && data.package_width && data.package_height ? {
          length: data.package_length,
          width: data.package_width,
          height: data.package_height,
          unit: "cm"
        } : undefined,
        packageWeight: data.package_weight,
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in createProduct:", error);
      return null;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const updateData: any = {
        name: updates.name,
        description: updates.description,
        price: updates.price,
        discount_price: updates.discountPrice,
        currency: updates.currency,
        category_id: updates.categoryId,
        subcategory_id: updates.subcategoryId,
        image_url: updates.imageUrl,
        in_stock: updates.inStock,
        stock_quantity: updates.stockQuantity,
        is_featured: updates.isFeatured,
        is_sponsored: updates.isSponsored,
        boost_until: updates.boostExpiresAt?.toISOString(),
        tags: updates.tags,
        // Digital product fields
        product_type: updates.productType,
        digital_product_type: updates.digitalProductType,
        download_url: updates.downloadUrl,
        license_type: updates.licenseType,
        download_limit: updates.downloadLimit,
        download_expiry_days: updates.downloadExpiryDays,
        file_size: updates.fileSize,
        file_format: updates.fileFormat,
        author: updates.author,
        co_author: updates.coAuthor,
        publisher: updates.publisher,
        publication_date: updates.publicationDate,
        isbn: updates.isbn,
        pages: updates.pages,
        language: updates.language,
        age_group: updates.ageGroup,
        skill_level: updates.skillLevel,
        course_duration: updates.courseDuration,
        course_modules: updates.courseModules,
        includes_source_files: updates.includesSourceFiles,
        // Physical product fields
        weight: updates.weight,
        size: updates.size,
        color: updates.color,
        material: updates.material,
        care_instructions: updates.careInstructions,
        assembly_required: updates.assemblyRequired,
        assembly_time: updates.assemblyTime,
        package_length: updates.packageDimensions?.length,
        package_width: updates.packageDimensions?.width,
        package_height: updates.packageDimensions?.height,
        package_weight: updates.packageWeight,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
        return null;
      }

      return {
        id: data.id,
        sellerId: data.seller_id,
        name: data.name,
        description: data.description || "",
        price: data.price,
        discountPrice: data.discount_price,
        currency: data.currency || "USD",
        image: data.image_url || "",
        images: data.image_url ? [data.image_url] : [],
        category: data.category || "",
        subcategory: data.subcategory || undefined,
        rating: data.rating || 0,
        reviewCount: data.review_count || 0,
        inStock: data.in_stock || false,
        stockQuantity: data.stock_quantity || 0,
        isNew: data.is_new || false,
        isFeatured: data.is_featured || false,
        isSponsored: data.is_sponsored || false,
        tags: data.tags || [],
        sellerName: "", // Would need to fetch seller data
        sellerAvatar: "",
        sellerVerified: false,
        condition: data.condition || "new",
        brand: data.brand || undefined,
        model: data.model || undefined,
        // Digital product fields
        productType: data.product_type || "physical",
        digitalProductType: data.digital_product_type,
        downloadUrl: data.download_url,
        licenseType: data.license_type,
        downloadLimit: data.download_limit,
        downloadExpiryDays: data.download_expiry_days,
        fileSize: data.file_size,
        fileFormat: data.file_format,
        author: data.author,
        coAuthor: data.co_author,
        publisher: data.publisher,
        publicationDate: data.publication_date,
        isbn: data.isbn,
        pages: data.pages,
        language: data.language,
        ageGroup: data.age_group,
        skillLevel: data.skill_level,
        courseDuration: data.course_duration,
        courseModules: data.course_modules,
        includesSourceFiles: data.includes_source_files,
        // Physical product fields
        weight: data.weight,
        size: data.size,
        color: data.color,
        material: data.material,
        careInstructions: data.care_instructions,
        assemblyRequired: data.assembly_required,
        assemblyTime: data.assembly_time,
        packageDimensions: data.package_length && data.package_width && data.package_height ? {
          length: data.package_length,
          width: data.package_width,
          height: data.package_height,
          unit: "cm"
        } : undefined,
        packageWeight: data.package_weight,
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString()
      };
    } catch (error) {
      console.error("Error in updateProduct:", error);
      return null;
    }
  }

  // Reviews (using canonical product_reviews table)
  async getReviews(productId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:users(full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error instanceof Error ? error.message : JSON.stringify(error));
        return [];
      }

      if (!data) {
        return [];
      }

      return data.map(review => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        userName: review.user?.full_name || "Anonymous",
        userAvatar: review.user?.avatar_url || "",
        rating: review.rating,
        title: review.title || "",
        comment: review.content || "",
        helpfulCount: review.helpful_count || 0,
        verifiedPurchase: review.verified_purchase || false,
        createdAt: new Date(review.created_at),
        updatedAt: new Date(review.updated_at)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error in getReviews:", errorMessage);
      return [];
    }
  }

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([{
          product_id: reviewData.productId,
          user_id: reviewData.userId,
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.comment,
          helpful_count: reviewData.helpfulCount,
          verified_purchase: reviewData.verifiedPurchase,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return null;
      }

      // Update product rating and review count
      await this.updateProductRating(reviewData.productId);

      return {
        id: data.id,
        productId: data.product_id,
        userId: data.user_id,
        userName: "", // Would be fetched separately
        userAvatar: "", // Would be fetched separately
        rating: data.rating,
        title: data.title || "",
        comment: data.comment || "",
        helpfulCount: data.helpful_count || 0,
        verifiedPurchase: data.verified_purchase || false,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error("Error in createReview:", error);
      return null;
    }
  }

  async updateProductRating(productId: string): Promise<void> {
    try {
      // Get all reviews for this product
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (error) {
        console.error("Error fetching reviews for rating update:", error);
        return;
      }

      if (reviews.length === 0) {
        // Reset rating if no reviews
        await supabase
          .from('products')
          .update({ 
            rating: 0,
            review_count: 0
          })
          .eq('id', productId);
        return;
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Update product rating
      await supabase
        .from('products')
        .update({ 
          rating: parseFloat(averageRating.toFixed(2)),
          review_count: reviews.length
        })
        .eq('id', productId);
    } catch (error) {
      console.error("Error updating product rating:", error);
    }
  }

  // Orders
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'>, items: Omit<OrderItem, 'id' | 'orderId'>[]): Promise<Order | null> {
    try {
      // Start a transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.userId,
          seller_id: orderData.sellerId,
          total_amount: orderData.totalAmount,
          status: orderData.status,
          payment_method: orderData.paymentMethod,
          shipping_address: orderData.shippingAddress,
          billing_address: orderData.billingAddress,
          tracking_number: orderData.trackingNumber,
          estimated_delivery: orderData.estimatedDelivery,
          delivered_at: orderData.deliveredAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        return null;
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        return null;
      }

      return {
        id: order.id,
        userId: order.user_id,
        sellerId: order.seller_id,
        totalAmount: order.total_amount,
        status: order.status as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
        paymentMethod: order.payment_method || "",
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address,
        trackingNumber: order.tracking_number || "",
        estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery) : undefined,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        items: [], // Would need to fetch items separately
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at)
      };
    } catch (error) {
      console.error("Error in createOrder:", error);
      return null;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user orders:", error);
        return [];
      }

      return data.map(order => ({
        id: order.id,
        userId: order.user_id,
        sellerId: order.seller_id,
        totalAmount: order.total_amount,
        status: order.status as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
        paymentMethod: order.payment_method || "",
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address,
        trackingNumber: order.tracking_number || "",
        estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery) : undefined,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        items: [], // Would need to fetch items separately
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at)
      }));
    } catch (error) {
      console.error("Error in getUserOrders:", error);
      return [];
    }
  }

  // Search
  async searchProducts(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      // Sanitize query to prevent complex parsing issues
      const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9_\-.\s]/g, '');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
        .limit(limit);

      if (error) {
        console.error("Error searching products:", error);
        return [];
      }

      return data.map(product => ({
        id: product.id,
        type: "product",
        title: product.name,
        description: product.description || "",
        imageUrl: product.image_url || "",
        price: product.price,
        rating: product.rating || 0,
        createdAt: new Date(product.created_at)
      }));
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return [];
    }
  }

  // Stats
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    try {
      // Get total products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (productsError) {
        console.error("Error fetching products count:", productsError);
      }

      // Get total orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      if (ordersError) {
        console.error("Error fetching orders count:", ordersError);
      }

      // Get total sellers count
      const { count: sellersCount, error: sellersError } = await supabase
        .from('products')
        .select('seller_id', { count: 'exact' })
        .neq('seller_id', null);

      if (sellersError) {
        console.error("Error fetching sellers count:", sellersError);
      }

      return {
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalSellers: sellersCount || 0,
        totalRevenue: 0, // Would need to calculate from orders
        featuredProducts: 0, // Would need to count featured products
        newArrivals: 0 // Would need to count recent products
      };
    } catch (error) {
      console.error("Error in getMarketplaceStats:", error);
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalSellers: 0,
        totalRevenue: 0,
        featuredProducts: 0,
        newArrivals: 0
      };
    }
  }

  async getSellerStats(sellerId: string): Promise<SellerStats> {
    try {
      // Get seller's products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId);

      if (productsError) {
        console.error("Error fetching seller products count:", productsError);
      }

      // Get seller's orders count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId);

      if (ordersError) {
        console.error("Error fetching seller orders count:", ordersError);
      }

      // Get seller's average rating
      const { data: products, error: ratingError } = await supabase
        .from('products')
        .select('rating')
        .eq('seller_id', sellerId);

      if (ratingError) {
        console.error("Error fetching seller ratings:", ratingError);
      }

      const averageRating = products && products.length > 0
        ? products.reduce((sum, product) => sum + (product.rating || 0), 0) / products.length
        : 0;

      // Get seller's marketplace revenue from unified wallet
      let totalRevenue = 0;
      try {
        const response = await fetch(`/api/wallet/sources?userId=${sellerId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const data = await response.json();
          totalRevenue = data.data?.sources?.marketplace?.amount || 0;
        }
      } catch (err) {
        console.warn('Could not fetch marketplace revenue from unified wallet:', err);
      }

      return {
        totalProducts: productsCount || 0,
        totalSales: ordersCount || 0,
        totalRevenue,
        averageRating: parseFloat(averageRating.toFixed(2)),
        responseTime: 0,
        customerSatisfaction: 0
      };
    } catch (error) {
      console.error("Error in getSellerStats:", error);
      return {
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        averageRating: 0,
        responseTime: 0,
        customerSatisfaction: 0
      };
    }
  }

  // Get seller's marketplace balance from unified wallet
  async getSellerBalance(sellerId: string): Promise<number> {
    try {
      const response = await fetch(`/api/wallet/balance?userId=${sellerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.balances?.marketplace || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching seller balance:", error);
      return 0;
    }
  }

  // Get sellers (using canonical store_profiles table)
  async getSellers(): Promise<SellerProfile[]> {
    try {
      // Get from canonical store_profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('store_profiles')
        .select(`
          *,
          users:profiles(username, full_name, avatar_url, bio)
        `)
        .eq('is_active', true);

      if (profilesError) {
        console.warn("Error fetching store profiles:", profilesError);
        // Fallback to using profiles table with store information
        const { data: profiles, error: profilesFailover } = await supabase
          .from('profiles')
          .select('*')
          .limit(20);

        if (profilesFailover) {
          console.error("Error fetching profiles:", profilesFailover);
          return [];
        }

        return profiles.map(user => ({
          id: user.id,
          username: user.username || '',
          name: user.full_name || 'Unknown User',
          avatar: user.avatar_url || '',
          bio: user.bio || '',
          joinedDate: user.created_at || new Date().toISOString(),
          isVerified: user.is_verified || false,
          rating: 0,
          reviewCount: 0,
          productCount: 0,
          salesCount: 0
        }));
      }

      return profiles.map(profile => ({
        id: profile.id,
        username: profile.users?.username || 'user',
        name: profile.users?.full_name || profile.store_name || 'Unknown Seller',
        avatar: profile.users?.avatar_url || profile.store_logo || '',
        bio: profile.store_description || profile.users?.bio || '',
        joinedDate: profile.created_at,
        isVerified: profile.verification_status === 'verified',
        rating: parseFloat(profile.store_rating?.toString() || '0'),
        reviewCount: profile.total_orders || 0,
        productCount: 0, // Would need to fetch from products table
        salesCount: profile.total_sales || 0
      }));
    } catch (error) {
      console.error("Error in getSellers:", error);
      return [];
    }
  }

  // Get reviews for products using canonical product_reviews table
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          id,
          product_id,
          user_id,
          order_id,
          rating,
          title,
          content,
          images,
          verified_purchase,
          helpful_count,
          is_featured,
          created_at,
          updated_at
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        console.error("Error fetching product reviews:", errorMessage);
        return [];
      }

      if (!data) return [];

      // Fetch user data separately to avoid FK dependency
      const userIds = [...new Set(data.map(r => r.user_id))];
      const users: { [key: string]: any } = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (usersData) {
          usersData.forEach((user: any) => {
            users[user.id] = user;
          });
        }
      }

      return data.map(review => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        userName: users[review.user_id]?.full_name || 'Anonymous User',
        userAvatar: users[review.user_id]?.avatar_url || '',
        rating: review.rating,
        title: review.title || '',
        comment: review.content || '',
        helpfulCount: review.helpful_count || 0,
        verifiedPurchase: review.verified_purchase || false,
        createdAt: new Date(review.created_at),
        updatedAt: new Date(review.updated_at)
      }));
    } catch (error) {
      console.error("Error in getProductReviews:", error);
      return [];
    }
  }

  // Flash Sales
  async getActiveFlashSales(): Promise<any[]> {
    try {
      // In a real implementation, we would fetch from the flash_sales table
      // For now, return an empty array as we're using mock data
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Error fetching flash sales:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching flash sales:", error);
      return [];
    }
  }

  async createFlashSale(flashSaleData: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('flash_sales')
        .insert([{
          title: flashSaleData.title,
          description: flashSaleData.description,
          discount_percentage: flashSaleData.discountPercentage,
          start_date: flashSaleData.startDate,
          end_date: flashSaleData.endDate,
          is_active: flashSaleData.isActive,
          featured_products: flashSaleData.featuredProducts,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating flash sale:", error);
        return null;
      }

      return {
        id: data.id,
        ...data
      };
    } catch (error) {
      console.error("Error creating flash sale:", error);
      return null;
    }
  }

  async updateFlashSale(id: string, updates: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('flash_sales')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating flash sale:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating flash sale:", error);
      return null;
    }
  }

  async deleteFlashSale(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting flash sale:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting flash sale:", error);
      return false;
    }
  }

  // Sponsored Products
  async getSponsoredProducts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sponsored_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Error fetching sponsored products:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching sponsored products:", error);
      return [];
    }
  }

  async createSponsoredProduct(sponsoredProductData: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('sponsored_products')
        .insert([{
          product_id: sponsoredProductData.productId,
          title: sponsoredProductData.title,
          start_date: sponsoredProductData.startDate,
          end_date: sponsoredProductData.endDate,
          is_active: sponsoredProductData.isActive,
          boost_level: sponsoredProductData.boostLevel,
          position: sponsoredProductData.position,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating sponsored product:", error);
        return null;
      }

      return {
        id: data.id,
        ...data
      };
    } catch (error) {
      console.error("Error creating sponsored product:", error);
      return null;
    }
  }

  async updateSponsoredProduct(id: string, updates: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('sponsored_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating sponsored product:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating sponsored product:", error);
      return null;
    }
  }

  async deleteSponsoredProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sponsored_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting sponsored product:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting sponsored product:", error);
      return false;
    }
  }

  // Campaigns
  async getCampaigns(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }

      return data.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description,
        type: campaign.type,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        bannerImage: campaign.banner_image,
        bannerText: campaign.banner_text,
        backgroundColor: campaign.background_color,
        textColor: campaign.text_color,
        discountType: campaign.discount_type,
        discountValue: campaign.discount_value,
        usageCount: campaign.usage_count,
        viewCount: campaign.view_count,
        clickCount: campaign.click_count,
        conversionCount: campaign.conversion_count,
        totalRevenue: campaign.total_revenue,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at
      }));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  }

  async createCampaign(campaignData: any): Promise<any | null> {
    try {
      // In a real implementation, we would insert into the campaigns table
      // For now, just return the data with an ID
      return {
        id: `campaign-${Date.now()}`,
        ...campaignData
      };
    } catch (error) {
      console.error("Error creating campaign:", error);
      return null;
    }
  }

  async updateCampaign(id: string, updates: any): Promise<any | null> {
    try {
      // In a real implementation, we would update the campaigns table
      // For now, just return the updates with the ID
      return {
        id,
        ...updates
      };
    } catch (error) {
      console.error("Error updating campaign:", error);
      return null;
    }
  }

  async deleteCampaign(id: string): Promise<boolean> {
    try {
      // In a real implementation, we would delete from the campaigns table
      // For now, just return true
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }
  }

  // Marketplace Ads
  async getActiveAds(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('marketplace_ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Error fetching ads:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching ads:", error instanceof Error ? error.message : JSON.stringify(error));
      return [];
    }
  }

  async createAd(adData: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_ads')
        .insert([{
          title: adData.title,
          description: adData.description,
          image_url: adData.imageUrl,
          target_url: adData.targetUrl,
          start_date: adData.startDate,
          end_date: adData.endDate,
          is_active: adData.isActive,
          position: adData.position,
          priority: adData.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating ad:", error instanceof Error ? error.message : JSON.stringify(error));
        return null;
      }

      return {
        id: data.id,
        ...data
      };
    } catch (error) {
      console.error("Error creating ad:", error);
      return null;
    }
  }

  async updateAd(id: string, updates: any): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_ads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ad:", error instanceof Error ? error.message : JSON.stringify(error));
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating ad:", error);
      return null;
    }
  }

  async deleteAd(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marketplace_ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting ad:", error instanceof Error ? error.message : JSON.stringify(error));
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting ad:", error);
      return false;
    }
  }

  // Get unique tags from all products
  async getProductTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('tags')
        .not('tags', 'is', null);

      if (error) {
        console.error("Error fetching product tags:", error);
        return [];
      }

      // Extract unique tags from all products
      const allTags = data.flatMap(product => product.tags || []);
      const uniqueTags = [...new Set(allTags)];
      
      return uniqueTags.slice(0, 20); // Return up to 20 tags
    } catch (error) {
      console.error("Error in getProductTags:", error);
      return [];
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error("Error deleting product:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      return false;
    }
  }

  // Advanced Search Methods

  // Get all unique brands from products
  async getBrands(): Promise<{ name: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null);

      if (error) {
        console.error("Error fetching brands:", error);
        return [];
      }

      const brandCounts = new Map<string, number>();
      data.forEach(product => {
        if (product.brand) {
          brandCounts.set(product.brand, (brandCounts.get(product.brand) || 0) + 1);
        }
      });

      return Array.from(brandCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50); // Return top 50 brands
    } catch (error) {
      console.error("Error in getBrands:", error);
      return [];
    }
  }

  // Get all product conditions
  async getProductConditions(): Promise<{ condition: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('condition');

      if (error) {
        console.error("Error fetching product conditions:", error);
        return [];
      }

      const conditionCounts = new Map<string, number>();
      data.forEach(product => {
        if (product.condition) {
          const condition = product.condition;
          conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
        }
      });

      return Array.from(conditionCounts.entries())
        .map(([condition, count]) => ({ condition, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Error in getProductConditions:", error);
      return [
        { condition: "new", count: 0 },
        { condition: "like_new", count: 0 },
        { condition: "used", count: 0 },
        { condition: "refurbished", count: 0 }
      ];
    }
  }

  // Get price statistics
  async getPriceStatistics(): Promise<{ min: number; max: number; avg: number }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('price');

      if (error || !data || data.length === 0) {
        return { min: 0, max: 1000, avg: 500 };
      }

      const prices = data.map(p => p.price || 0).filter(p => p > 0);
      if (prices.length === 0) {
        return { min: 0, max: 1000, avg: 500 };
      }

      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      return { min, max, avg };
    } catch (error) {
      console.error("Error in getPriceStatistics:", error);
      return { min: 0, max: 1000, avg: 500 };
    }
  }

  // Get rating distribution for filtering
  async getRatingStatistics(): Promise<{ rating: number; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('rating');

      if (error) {
        console.error("Error fetching rating statistics:", error);
        return [];
      }

      const ratingCounts = new Map<number, number>();
      data.forEach(product => {
        const rating = Math.ceil(product.rating || 0);
        if (rating >= 1 && rating <= 5) {
          ratingCounts.set(rating, (ratingCounts.get(rating) || 0) + 1);
        }
      });

      return [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: ratingCounts.get(rating) || 0
      }));
    } catch (error) {
      console.error("Error in getRatingStatistics:", error);
      return [];
    }
  }

  // Advanced search with faceted filters
  async advancedSearch(filters: {
    searchQuery?: string;
    categoryId?: string;
    brands?: string[];
    conditions?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    tags?: string[];
    sellerId?: string;
    sortBy?: "relevance" | "price-low" | "price-high" | "rating" | "newest" | "popular";
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*');

      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.brands && filters.brands.length > 0) {
        query = query.in('brand', filters.brands);
      }

      if (filters.conditions && filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.tags && filters.tags.length > 0) {
        // Search for products that contain any of the specified tags
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }

      // Apply sorting
      let orderBy: { column: string; ascending: boolean } | null = null;
      switch (filters.sortBy) {
        case "price-low":
          orderBy = { column: "price", ascending: true };
          break;
        case "price-high":
          orderBy = { column: "price", ascending: false };
          break;
        case "rating":
          orderBy = { column: "rating", ascending: false };
          break;
        case "newest":
          orderBy = { column: "created_at", ascending: false };
          break;
        case "popular":
          orderBy = { column: "review_count", ascending: false };
          break;
        case "relevance":
        default:
          orderBy = { column: "created_at", ascending: false };
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      const { data, error } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error in advanced search:", error);
        return [];
      }

      return data.map(product => ({
        id: product.id,
        sellerId: product.seller_id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        discountPrice: product.discount_price,
        image: product.image_url || "",
        images: product.image_url ? [product.image_url] : [],
        category: product.category || "",
        subcategory: product.subcategory || undefined,
        rating: product.rating || 0,
        reviewCount: product.review_count || 0,
        inStock: product.in_stock || false,
        stockQuantity: product.stock_quantity || 0,
        isNew: product.is_new || false,
        isFeatured: product.is_featured || false,
        isSponsored: product.is_sponsored || false,
        tags: product.tags || [],
        sellerName: product.seller?.full_name || "Unknown Seller",
        sellerAvatar: product.seller?.avatar_url || "",
        sellerVerified: product.seller?.is_verified || false,
        condition: product.condition || "new",
        brand: product.brand || undefined,
        model: product.model || undefined,
        createdAt: new Date(product.created_at).toISOString(),
        updatedAt: new Date(product.updated_at).toISOString()
      }));
    } catch (error) {
      console.error("Error in advancedSearch:", error);
      return [];
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query: string, limit: number = 10): Promise<{
    products: string[];
    brands: string[];
    categories: string[];
  }> {
    try {
      if (!query || query.length < 2) {
        return { products: [], brands: [], categories: [] };
      }

      // Get product suggestions
      const { data: productData } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(limit);

      const products = (productData || [])
        .map(p => p.name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, limit / 3);

      // Get brand suggestions
      const { data: brandData } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null)
        .ilike('brand', `%${query}%`)
        .limit(limit);

      const brands = (brandData || [])
        .map(p => p.brand)
        .filter((v, i, a) => a.indexOf(v) === i && v)
        .slice(0, limit / 3);

      // Get category suggestions
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(limit / 3);

      const categories = (categoryData || []).map(c => c.name);

      return {
        products: products as string[],
        brands: brands as string[],
        categories
      };
    } catch (error) {
      console.error("Error in getSearchSuggestions:", error);
      return { products: [], brands: [], categories: [] };
    }
  }

  // Get faceted search results with aggregations
  async getFacetedSearch(filters: {
    searchQuery?: string;
    categoryId?: string;
  }): Promise<{
    brands: { name: string; count: number }[];
    conditions: { condition: string; count: number }[];
    priceRange: { min: number; max: number };
    ratings: { rating: number; count: number }[];
  }> {
    try {
      let query = supabase
        .from('products')
        .select('brand, condition, price, rating');

      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.error("Error fetching faceted search:", error);
        return {
          brands: [],
          conditions: [],
          priceRange: { min: 0, max: 1000 },
          ratings: []
        };
      }

      // Calculate facets
      const brands = new Map<string, number>();
      const conditions = new Map<string, number>();
      const ratings = new Map<number, number>();
      let minPrice = Infinity;
      let maxPrice = 0;

      data.forEach(product => {
        if (product.brand) {
          brands.set(product.brand, (brands.get(product.brand) || 0) + 1);
        }
        if (product.condition) {
          conditions.set(product.condition, (conditions.get(product.condition) || 0) + 1);
        }
        if (product.rating) {
          const rating = Math.ceil(product.rating);
          ratings.set(rating, (ratings.get(rating) || 0) + 1);
        }
        if (product.price) {
          minPrice = Math.min(minPrice, product.price);
          maxPrice = Math.max(maxPrice, product.price);
        }
      });

      return {
        brands: Array.from(brands.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        conditions: Array.from(conditions.entries())
          .map(([condition, count]) => ({ condition, count }))
          .sort((a, b) => b.count - a.count),
        priceRange: {
          min: minPrice === Infinity ? 0 : minPrice,
          max: maxPrice || 1000
        },
        ratings: [5, 4, 3, 2, 1].map(rating => ({
          rating,
          count: ratings.get(rating) || 0
        }))
      };
    } catch (error) {
      console.error("Error in getFacetedSearch:", error);
      return {
        brands: [],
        conditions: [],
        priceRange: { min: 0, max: 1000 },
        ratings: []
      };
    }
  }

  // Count products matching filters (for pagination)
  async countProducts(filters: {
    searchQuery?: string;
    categoryId?: string;
    brands?: string[];
    conditions?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    tags?: string[];
    sellerId?: string;
  }): Promise<number> {
    try {
      let query = supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.brands && filters.brands.length > 0) {
        query = query.in('brand', filters.brands);
      }

      if (filters.conditions && filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }

      const { count, error } = await query;

      if (error) {
        console.error("Error counting products:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in countProducts:", error);
      return 0;
    }
  }
}

export const marketplaceService = new MarketplaceService();
