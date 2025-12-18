import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  image?: string;
  inStock: boolean;
  stockQuantity?: number;
  sku?: string;
}

interface VariantOption {
  name: string;
  values: string[];
  type?: 'color' | 'size' | 'material' | 'other';
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  basePrice: number;
  onVariantSelect: (variant: ProductVariant, updatedPrice: number) => void;
  selectedVariant?: ProductVariant;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  basePrice,
  onVariantSelect,
  selectedVariant
}) => {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [matchedVariant, setMatchedVariant] = useState<ProductVariant | null>(selectedVariant || null);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [currentPrice, setCurrentPrice] = useState(basePrice);

  // Extract variant options from variants array
  useEffect(() => {
    if (!variants || variants.length === 0) return;

    const optionsMap: Record<string, Set<string>> = {};
    
    // Group variants by their option names
    variants.forEach(variant => {
      const option = variant.name; // e.g., "Color" or "Size"
      if (!optionsMap[option]) {
        optionsMap[option] = new Set();
      }
      optionsMap[option].add(variant.value);
    });

    // Convert to VariantOption array
    const options: VariantOption[] = Object.entries(optionsMap).map(([name, values]) => {
      let type: 'color' | 'size' | 'material' | 'other' = 'other';
      if (name.toLowerCase().includes('color')) type = 'color';
      else if (name.toLowerCase().includes('size')) type = 'size';
      else if (name.toLowerCase().includes('material')) type = 'material';

      return {
        name,
        values: Array.from(values),
        type
      };
    });

    setVariantOptions(options);
  }, [variants]);

  // Find matching variant when selections change
  useEffect(() => {
    if (Object.keys(selected).length === 0 || variants.length === 0) return;

    // Find variant that matches current selections
    const matched = variants.find(v => {
      const optionName = v.name;
      return selected[optionName] === v.value;
    });

    if (matched) {
      setMatchedVariant(matched);
      setCurrentPrice(matched.price || basePrice);
      onVariantSelect(matched, matched.price || basePrice);
    }
  }, [selected, variants, basePrice, onVariantSelect]);

  const handleVariantChange = (optionName: string, value: string) => {
    setSelected(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const getColorDisplay = (value: string) => {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#10B981',
      'yellow': '#FBBF24',
      'purple': '#A855F7',
      'gray': '#6B7280',
      'pink': '#EC4899',
      'orange': '#F97316',
      'brown': '#92400E',
      'navy': '#001F3F',
      'silver': '#C0C0C0',
      'gold': '#FFD700'
    };
    
    return colorMap[value.toLowerCase()] || null;
  };

  if (variantOptions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Variant Options */}
          {variantOptions.map(option => (
            <div key={option.name}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  {option.name}
                </label>
                {selected[option.name] && (
                  <span className="text-sm text-gray-600">
                    Selected: <strong>{selected[option.name]}</strong>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {option.values.map(value => {
                  // Find variant with this option value
                  const variantWithOption = variants.find(
                    v => v.name === option.name && v.value === value
                  );
                  
                  const isSelected = selected[option.name] === value;
                  const isInStock = variantWithOption?.inStock ?? true;

                  return (
                    <button
                      key={`${option.name}-${value}`}
                      onClick={() => handleVariantChange(option.name, value)}
                      disabled={!isInStock}
                      className={cn(
                        'relative transition-all duration-200',
                        option.type === 'color'
                          ? 'w-10 h-10 rounded-full border-2 flex-shrink-0'
                          : 'px-4 py-2 rounded border-2 text-sm font-medium'
                      )}
                      style={
                        option.type === 'color'
                          ? {
                              backgroundColor: getColorDisplay(value) || '#E5E7EB',
                              borderColor: isSelected ? '#000000' : '#D1D5DB',
                              opacity: isInStock ? 1 : 0.5,
                              cursor: isInStock ? 'pointer' : 'not-allowed'
                            }
                          : undefined
                      }
                      title={!isInStock ? 'Out of stock' : value}
                    >
                      {option.type !== 'color' && value}
                      
                      {isSelected && option.type === 'color' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-white drop-shadow-lg" />
                        </div>
                      )}

                      {!isInStock && option.type !== 'color' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-current rotate-45 origin-center" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stock Status for this option */}
              {selected[option.name] && (
                <div className="mt-2">
                  {variantWithOption => {
                    const variant = variants.find(
                      v => v.name === option.name && v.value === selected[option.name]
                    );
                    if (!variant) return null;

                    return (
                      <div className="flex items-center gap-2 text-sm">
                        {variant.inStock ? (
                          <>
                            <CheckCircle2 size={16} className="text-green-600" />
                            <span className="text-green-700">
                              In stock
                              {variant.stockQuantity && variant.stockQuantity <= 10 && (
                                <span className="ml-1">
                                  ({variant.stockQuantity} left)
                                </span>
                              )}
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-red-600" />
                            <span className="text-red-700">Out of stock</span>
                          </>
                        )}
                      </div>
                    );
                  }}
                </div>
              )}
            </div>
          ))}

          {/* Price Display */}
          <div className="pt-4 border-t">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-600">Price:</span>
              <span className="text-2xl font-bold text-primary">
                ${currentPrice.toFixed(2)}
              </span>
              {currentPrice !== basePrice && (
                <span className="text-sm text-gray-500 line-through">
                  ${basePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Variant Info */}
          {matchedVariant && (
            <div className="bg-gray-50 rounded p-3 space-y-2">
              {matchedVariant.sku && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">SKU:</span> {matchedVariant.sku}
                </div>
              )}
              
              {matchedVariant.stockQuantity !== undefined && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Available:</span> {matchedVariant.stockQuantity} units
                </div>
              )}

              {!matchedVariant.inStock && (
                <Badge variant="destructive" className="text-xs">
                  This variant is currently unavailable
                </Badge>
              )}

              {matchedVariant.stockQuantity !== undefined && matchedVariant.stockQuantity <= 5 && matchedVariant.inStock && (
                <Badge variant="secondary" className="text-xs">
                  Only {matchedVariant.stockQuantity} left - order soon!
                </Badge>
              )}
            </div>
          )}

          {/* Selection Status */}
          {Object.keys(selected).length > 0 && Object.keys(selected).length === variantOptions.length && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
              <CheckCircle2 size={16} />
              <span>All options selected. Ready to add to cart!</span>
            </div>
          )}

          {Object.keys(selected).length > 0 && Object.keys(selected).length < variantOptions.length && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded">
              <AlertCircle size={16} />
              <span>Please select all variant options</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantSelector;
