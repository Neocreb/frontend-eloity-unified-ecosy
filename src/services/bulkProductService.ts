import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/marketplace";

export interface ProductImportRow {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  condition?: string;
  stockQuantity: number;
  images?: string;
  tags?: string;
  sku?: string;
  weight?: number;
  dimensions?: string;
  [key: string]: any;
}

export interface ValidationError {
  rowIndex: number;
  field: string;
  value: any;
  error: string;
}

export interface ImportResult {
  successful: number;
  failed: number;
  skipped: number;
  errors: ValidationError[];
  createdProducts: string[];
}

export interface BulkImportBatch {
  id: string;
  sellerId: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  createdAt: string;
  completedAt?: string;
  errors: ValidationError[];
}

export class BulkProductService {
  // Parse CSV file
  static parseCSV(fileContent: string): ProductImportRow[] {
    const lines = fileContent.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV file must contain a header row and at least one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: ProductImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: ProductImportRow = {} as ProductImportRow;

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      if (Object.values(row).some((v) => v !== "")) {
        rows.push(row);
      }
    }

    return rows;
  }

  // Validate a single product row
  static validateProductRow(row: ProductImportRow, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.name || row.name.trim().length === 0) {
      errors.push({
        rowIndex,
        field: "name",
        value: row.name,
        error: "Product name is required",
      });
    } else if (row.name.length > 200) {
      errors.push({
        rowIndex,
        field: "name",
        value: row.name,
        error: "Product name must be 200 characters or less",
      });
    }

    if (!row.price || isNaN(parseFloat(row.price as any))) {
      errors.push({
        rowIndex,
        field: "price",
        value: row.price,
        error: "Price must be a valid number",
      });
    } else if (parseFloat(row.price as any) < 0) {
      errors.push({
        rowIndex,
        field: "price",
        value: row.price,
        error: "Price must be greater than 0",
      });
    }

    if (!row.category || row.category.trim().length === 0) {
      errors.push({
        rowIndex,
        field: "category",
        value: row.category,
        error: "Category is required",
      });
    }

    if (!row.stockQuantity || isNaN(parseInt(row.stockQuantity as any))) {
      errors.push({
        rowIndex,
        field: "stockQuantity",
        value: row.stockQuantity,
        error: "Stock quantity must be a valid integer",
      });
    } else if (parseInt(row.stockQuantity as any) < 0) {
      errors.push({
        rowIndex,
        field: "stockQuantity",
        value: row.stockQuantity,
        error: "Stock quantity cannot be negative",
      });
    }

    // Optional fields with validation
    if (row.discountPrice && !isNaN(parseFloat(row.discountPrice as any))) {
      const discount = parseFloat(row.discountPrice as any);
      const price = parseFloat(row.price as any);
      if (discount >= price) {
        errors.push({
          rowIndex,
          field: "discountPrice",
          value: row.discountPrice,
          error: "Discount price must be less than regular price",
        });
      }
    }

    if (row.weight && isNaN(parseFloat(row.weight as any))) {
      errors.push({
        rowIndex,
        field: "weight",
        value: row.weight,
        error: "Weight must be a valid number",
      });
    }

    if (row.condition && !["new", "like_new", "used", "refurbished"].includes(row.condition)) {
      errors.push({
        rowIndex,
        field: "condition",
        value: row.condition,
        error: "Condition must be one of: new, like_new, used, refurbished",
      });
    }

    return errors;
  }

  // Validate all rows
  static validateAll(rows: ProductImportRow[]): ValidationError[] {
    const allErrors: ValidationError[] = [];

    rows.forEach((row, index) => {
      const rowErrors = this.validateProductRow(row, index + 2); // +2 because of 0-index and header row
      allErrors.push(...rowErrors);
    });

    return allErrors;
  }

  // Generate CSV template
  static generateCSVTemplate(): string {
    const headers = [
      "name",
      "description",
      "price",
      "discountPrice",
      "category",
      "subcategory",
      "brand",
      "condition",
      "stockQuantity",
      "sku",
      "weight",
      "dimensions",
      "images",
      "tags",
    ];

    const sampleRows = [
      [
        "Sample Product 1",
        "High-quality product description",
        "99.99",
        "79.99",
        "Electronics",
        "Phones",
        "BrandA",
        "new",
        "50",
        "SKU-001",
        "0.5",
        "10x10x5 cm",
        "image1.jpg,image2.jpg",
        "tag1,tag2,tag3",
      ],
      [
        "Sample Product 2",
        "Another product with great features",
        "149.99",
        "",
        "Fashion",
        "Clothes",
        "BrandB",
        "new",
        "30",
        "SKU-002",
        "0.3",
        "M",
        "image3.jpg",
        "clothing,summer",
      ],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleRows.map((row) => row.join(",")),
    ].join("\n");

    return csvContent;
  }

  // Import products from parsed rows
  static async importProducts(
    sellerId: string,
    rows: ProductImportRow[]
  ): Promise<ImportResult> {
    const validationErrors = this.validateAll(rows);
    const validRows = rows.filter((_, index) => {
      const rowErrors = validationErrors.filter((e) => e.rowIndex === index + 2);
      return rowErrors.length === 0;
    });

    const result: ImportResult = {
      successful: 0,
      failed: validationErrors.length,
      skipped: 0,
      errors: validationErrors,
      createdProducts: [],
    };

    // Insert valid products
    for (const row of validRows) {
      try {
        const productData = {
          seller_id: sellerId,
          name: row.name,
          description: row.description || "",
          price: parseFloat(row.price as any),
          discount_price: row.discountPrice ? parseFloat(row.discountPrice as any) : null,
          category: row.category,
          subcategory: row.subcategory || null,
          brand: row.brand || null,
          condition: row.condition || "new",
          stock_quantity: parseInt(row.stockQuantity as any),
          sku: row.sku || null,
          weight: row.weight ? parseFloat(row.weight as any) : null,
          dimensions: row.dimensions || null,
          image_url: row.images ? row.images.split(",")[0].trim() : null,
          tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select("id");

        if (error) {
          result.errors.push({
            rowIndex: rows.indexOf(row) + 2,
            field: "general",
            value: row.name,
            error: `Failed to create product: ${error.message}`,
          });
          result.failed++;
        } else if (data && data.length > 0) {
          result.successful++;
          result.createdProducts.push(data[0].id);
        }
      } catch (error) {
        result.errors.push({
          rowIndex: rows.indexOf(row) + 2,
          field: "general",
          value: row.name,
          error: `Error creating product: ${(error as Error).message}`,
        });
        result.failed++;
      }
    }

    return result;
  }

  // Bulk update products
  static async updateProductsPrices(
    sellerId: string,
    updates: Array<{ productId: string; newPrice: number }>
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const result = { successful: 0, failed: 0, errors: [] as string[] };

    for (const { productId, newPrice } of updates) {
      try {
        const { error } = await supabase
          .from("products")
          .update({ price: newPrice, updated_at: new Date().toISOString() })
          .eq("id", productId)
          .eq("seller_id", sellerId);

        if (error) {
          result.errors.push(`Failed to update ${productId}: ${error.message}`);
          result.failed++;
        } else {
          result.successful++;
        }
      } catch (error) {
        result.errors.push(`Error updating ${productId}: ${(error as Error).message}`);
        result.failed++;
      }
    }

    return result;
  }

  // Bulk update stock quantities
  static async updateProductsStock(
    sellerId: string,
    updates: Array<{ productId: string; newQuantity: number }>
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const result = { successful: 0, failed: 0, errors: [] as string[] };

    for (const { productId, newQuantity } of updates) {
      try {
        const { error } = await supabase
          .from("products")
          .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", productId)
          .eq("seller_id", sellerId);

        if (error) {
          result.errors.push(`Failed to update stock for ${productId}: ${error.message}`);
          result.failed++;
        } else {
          result.successful++;
        }
      } catch (error) {
        result.errors.push(`Error updating stock for ${productId}: ${(error as Error).message}`);
        result.failed++;
      }
    }

    return result;
  }

  // Bulk update categories and tags
  static async updateProductsCategories(
    sellerId: string,
    updates: Array<{ productId: string; category: string; subcategory?: string; tags?: string[] }>
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const result = { successful: 0, failed: 0, errors: [] as string[] };

    for (const { productId, category, subcategory, tags } of updates) {
      try {
        const { error } = await supabase
          .from("products")
          .update({
            category,
            subcategory: subcategory || null,
            tags: tags || [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId)
          .eq("seller_id", sellerId);

        if (error) {
          result.errors.push(`Failed to update categories for ${productId}: ${error.message}`);
          result.failed++;
        } else {
          result.successful++;
        }
      } catch (error) {
        result.errors.push(
          `Error updating categories for ${productId}: ${(error as Error).message}`
        );
        result.failed++;
      }
    }

    return result;
  }

  // Get import history
  static async getImportHistory(
    sellerId: string,
    limit: number = 10
  ): Promise<BulkImportBatch[]> {
    try {
      const { data, error } = await supabase
        .from("bulk_import_batches")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching import history:", error);
        return [];
      }

      return (
        data?.map((batch) => ({
          id: batch.id,
          sellerId: batch.seller_id,
          status: batch.status,
          totalRows: batch.total_rows,
          successfulRows: batch.successful_rows,
          failedRows: batch.failed_rows,
          createdAt: batch.created_at,
          completedAt: batch.completed_at,
          errors: batch.errors || [],
        })) || []
      );
    } catch (error) {
      console.error("Error in getImportHistory:", error);
      return [];
    }
  }
}

export const bulkProductService = new BulkProductService();
