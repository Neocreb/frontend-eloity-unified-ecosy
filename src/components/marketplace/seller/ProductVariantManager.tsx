import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronDown,
  ChevronUp,
  BarCode,
  DollarSign,
  Package,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface Variant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  discountPrice?: number;
  stock: number;
  image?: string;
}

interface ProductVariantManagerProps {
  productId: string;
  productName: string;
  basePrice: number;
  onVariantsChange?: (variants: Variant[]) => void;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  productId,
  productName,
  basePrice,
  onVariantsChange,
}) => {
  const { toast } = useToast();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Variant>>({
    sku: "",
    name: "",
    attributes: {},
    price: basePrice,
    stock: 0,
  });

  const generateSKU = (baseSku?: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return baseSku ? `${baseSku}-${timestamp}` : `SKU-${timestamp}-${random}`;
  };

  const handleAddVariant = () => {
    if (!formData.name || !formData.sku) {
      toast({
        title: "Error",
        description: "Name and SKU are required",
        variant: "destructive",
      });
      return;
    }

    const newVariant: Variant = {
      id: Date.now().toString(),
      sku: formData.sku,
      name: formData.name,
      attributes: formData.attributes || {},
      price: formData.price || basePrice,
      discountPrice: formData.discountPrice,
      stock: formData.stock || 0,
      image: formData.image,
    };

    let updatedVariants: Variant[];
    if (editingVariant) {
      updatedVariants = variants.map((v) => (v.id === editingVariant ? newVariant : v));
      setEditingVariant(null);
    } else {
      updatedVariants = [...variants, newVariant];
    }

    setVariants(updatedVariants);
    setFormData({ sku: "", name: "", attributes: {}, price: basePrice, stock: 0 });
    setShowForm(false);
    onVariantsChange?.(updatedVariants);

    toast({
      title: "Success",
      description: `Variant ${editingVariant ? "updated" : "added"}`,
    });
  };

  const handleDeleteVariant = (id: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      const updatedVariants = variants.filter((v) => v.id !== id);
      setVariants(updatedVariants);
      onVariantsChange?.(updatedVariants);
      toast({
        title: "Success",
        description: "Variant deleted",
      });
    }
  };

  const handleEditVariant = (variant: Variant) => {
    setFormData(variant);
    setEditingVariant(variant.id);
    setShowForm(true);
  };

  const handleGenerateSKU = () => {
    setFormData({
      ...formData,
      sku: generateSKU(formData.name?.substring(0, 3).toUpperCase()),
    });
  };

  const handleDuplicateVariant = (variant: Variant) => {
    const newVariant: Variant = {
      ...variant,
      id: Date.now().toString(),
      sku: generateSKU(variant.sku.substring(0, 3)),
    };

    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    onVariantsChange?.(updatedVariants);

    toast({
      title: "Success",
      description: "Variant duplicated",
    });
  };

  const handleAddAttribute = (key: string, value: string) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{productName} - Variants</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage product variants (different sizes, colors, etc.)
          </p>
        </div>
        <Badge variant="secondary">{variants.length} variants</Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription className="text-sm">
          Use variants to sell the same product in different configurations. Each variant can have
          its own price, SKU, and stock level.
        </AlertDescription>
      </Alert>

      {/* Add Variant Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingVariant ? "Edit Variant" : "Add New Variant"}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingVariant(null);
                  setFormData({ sku: "", name: "", attributes: {}, price: basePrice, stock: 0 });
                }}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-1">Variant Name *</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Red - Size L"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* SKU Field */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <BarCode className="w-4 h-4" />
                SKU *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if left empty"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateSKU}
                  className="gap-1"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Use a unique identifier for inventory tracking
              </p>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price *
                </label>
                <input
                  type="number"
                  value={formData.price || basePrice}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder={basePrice.toString()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Price</label>
                <input
                  type="number"
                  value={formData.discountPrice || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPrice: parseFloat(e.target.value) })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Stock Field */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock || 0}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Attributes */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Attributes (Optional)
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Attribute name (e.g., Color)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    id="attr-name"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., Red)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    id="attr-value"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nameInput = document.getElementById("attr-name") as HTMLInputElement;
                      const valueInput = document.getElementById("attr-value") as HTMLInputElement;
                      if (nameInput.value && valueInput.value) {
                        handleAddAttribute(nameInput.value, valueInput.value);
                        nameInput.value = "";
                        valueInput.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>

                {/* Attribute List */}
                {Object.entries(formData.attributes || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newAttrs = { ...formData.attributes };
                        delete newAttrs[key];
                        setFormData({ ...formData, attributes: newAttrs });
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddVariant} className="gap-2">
                <Plus className="w-4 h-4" />
                {editingVariant ? "Update Variant" : "Add Variant"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingVariant(null);
                  setFormData({ sku: "", name: "", attributes: {}, price: basePrice, stock: 0 });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </Button>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No variants yet</p>
            <p className="text-sm text-gray-500">Add your first variant to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <Card
              key={variant.id}
              className="cursor-pointer hover:border-gray-400 transition"
              onClick={() =>
                setExpandedVariant(
                  expandedVariant === variant.id ? null : variant.id
                )
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <h4 className="font-medium">{variant.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {variant.sku}
                        </span>
                        <span>${variant.price.toFixed(2)}</span>
                        <span>{variant.stock} in stock</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateVariant(variant);
                      }}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVariant(variant);
                      }}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVariant(variant.id);
                      }}
                      title="Delete"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="text-gray-400 ml-2">
                      {expandedVariant === variant.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVariant === variant.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="font-semibold">${variant.price.toFixed(2)}</p>
                      </div>
                      {variant.discountPrice && (
                        <div>
                          <p className="text-sm text-gray-600">Discount Price</p>
                          <p className="font-semibold">${variant.discountPrice.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Stock</p>
                        <p className="font-semibold">{variant.stock} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">SKU</p>
                        <p className="font-mono text-sm">{variant.sku}</p>
                      </div>
                    </div>

                    {Object.keys(variant.attributes).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Attributes</p>
                        <div className="space-y-1">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <strong>{key}:</strong> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {variants.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Variants</p>
                <p className="text-2xl font-bold">{variants.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold">{variants.reduce((sum, v) => sum + v.stock, 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="text-2xl font-bold">
                  ${Math.min(...variants.map((v) => v.price)).toFixed(2)} -{" "}
                  ${Math.max(...variants.map((v) => v.price)).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariantManager;
