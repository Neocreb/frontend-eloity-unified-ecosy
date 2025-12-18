import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'inch';
}

interface ProductSpecification {
  name: string;
  value: string;
}

interface ProductSpecificationsProps {
  specifications?: ProductSpecification[];
  brand?: string;
  model?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  material?: string;
  color?: string;
  condition?: 'new' | 'used' | 'refurbished';
  warranty?: string;
  productType?: 'physical' | 'digital' | 'service';
  sku?: string;
  manufacturer?: string;
  barcode?: string;
}

const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({
  specifications = [],
  brand,
  model,
  weight,
  dimensions,
  material,
  color,
  condition,
  warranty,
  productType,
  sku,
  manufacturer,
  barcode
}) => {
  const [copiedSpec, setCopiedSpec] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSpec(label);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
      duration: 2000
    });
    setTimeout(() => setCopiedSpec(null), 2000);
  };

  const printSpecifications = () => {
    const content = buildSpecContent();
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Product Specifications</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .spec-group { margin-bottom: 20px; }
              .spec-group h3 { color: #666; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
              .spec-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .spec-label { font-weight: bold; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const buildSpecContent = () => {
    let html = '<h1>Product Specifications</h1>';

    if (brand || model || condition || productType) {
      html += '<div class="spec-group"><h3>General Information</h3>';
      if (brand) html += `<div class="spec-item"><span class="spec-label">Brand:</span><span>${brand}</span></div>`;
      if (model) html += `<div class="spec-item"><span class="spec-label">Model:</span><span>${model}</span></div>`;
      if (condition) html += `<div class="spec-item"><span class="spec-label">Condition:</span><span>${condition.charAt(0).toUpperCase() + condition.slice(1)}</span></div>`;
      if (productType) html += `<div class="spec-item"><span class="spec-label">Product Type:</span><span>${productType.charAt(0).toUpperCase() + productType.slice(1)}</span></div>`;
      html += '</div>';
    }

    if (material || color || weight || dimensions) {
      html += '<div class="spec-group"><h3>Physical Properties</h3>';
      if (material) html += `<div class="spec-item"><span class="spec-label">Material:</span><span>${material}</span></div>`;
      if (color) html += `<div class="spec-item"><span class="spec-label">Color:</span><span>${color}</span></div>`;
      if (weight) html += `<div class="spec-item"><span class="spec-label">Weight:</span><span>${weight} kg</span></div>`;
      if (dimensions) {
        html += `<div class="spec-item"><span class="spec-label">Dimensions:</span><span>${dimensions.length} x ${dimensions.width} x ${dimensions.height} ${dimensions.unit}</span></div>`;
      }
      html += '</div>';
    }

    if (warranty || sku || manufacturer || barcode) {
      html += '<div class="spec-group"><h3>Additional Information</h3>';
      if (warranty) html += `<div class="spec-item"><span class="spec-label">Warranty:</span><span>${warranty}</span></div>`;
      if (sku) html += `<div class="spec-item"><span class="spec-label">SKU:</span><span>${sku}</span></div>`;
      if (manufacturer) html += `<div class="spec-item"><span class="spec-label">Manufacturer:</span><span>${manufacturer}</span></div>`;
      if (barcode) html += `<div class="spec-item"><span class="spec-label">Barcode:</span><span>${barcode}</span></div>`;
      html += '</div>';
    }

    if (specifications.length > 0) {
      html += '<div class="spec-group"><h3>Technical Specifications</h3>';
      specifications.forEach(spec => {
        html += `<div class="spec-item"><span class="spec-label">${spec.name}:</span><span>${spec.value}</span></div>`;
      });
      html += '</div>';
    }

    return html;
  };

  const allSpecs = [
    ...(brand ? [{ name: 'Brand', value: brand }] : []),
    ...(model ? [{ name: 'Model', value: model }] : []),
    ...(condition ? [{ name: 'Condition', value: condition.charAt(0).toUpperCase() + condition.slice(1) }] : []),
    ...(productType ? [{ name: 'Product Type', value: productType.charAt(0).toUpperCase() + productType.slice(1) }] : []),
    ...(material ? [{ name: 'Material', value: material }] : []),
    ...(color ? [{ name: 'Color', value: color }] : []),
    ...(weight ? [{ name: 'Weight', value: `${weight} kg` }] : []),
    ...(dimensions ? [{ name: 'Dimensions', value: `${dimensions.length} x ${dimensions.width} x ${dimensions.height} ${dimensions.unit}` }] : []),
    ...(warranty ? [{ name: 'Warranty', value: warranty }] : []),
    ...(sku ? [{ name: 'SKU', value: sku }] : []),
    ...(manufacturer ? [{ name: 'Manufacturer', value: manufacturer }] : []),
    ...(barcode ? [{ name: 'Barcode', value: barcode }] : []),
    ...specifications
  ];

  if (allSpecs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Product Specifications</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={printSpecifications}
            className="gap-2"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const text = allSpecs
                .map(spec => `${spec.name}: ${spec.value}`)
                .join('\n');
              copyToClipboard(text, 'Specifications');
            }}
            className="gap-2"
          >
            <Copy size={16} />
            <span className="hidden sm:inline">Copy</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* General Information */}
        {(brand || model || condition || productType) && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase">General Information</h4>
            <div className="space-y-3">
              {brand && <SpecItem label="Brand" value={brand} />}
              {model && <SpecItem label="Model" value={model} />}
              {condition && <SpecItem label="Condition" value={condition.charAt(0).toUpperCase() + condition.slice(1)} />}
              {productType && <SpecItem label="Product Type" value={productType.charAt(0).toUpperCase() + productType.slice(1)} />}
            </div>
          </div>
        )}

        {/* Physical Properties */}
        {(material || color || weight || dimensions) && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase">Physical Properties</h4>
            <div className="space-y-3">
              {material && <SpecItem label="Material" value={material} />}
              {color && <SpecItem label="Color" value={color} />}
              {weight && <SpecItem label="Weight" value={`${weight} kg`} />}
              {dimensions && (
                <SpecItem 
                  label="Dimensions" 
                  value={`${dimensions.length} × ${dimensions.width} × ${dimensions.height} ${dimensions.unit}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(warranty || sku || manufacturer || barcode) && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase">Additional Information</h4>
            <div className="space-y-3">
              {warranty && <SpecItem label="Warranty" value={warranty} />}
              {sku && <SpecItem label="SKU" value={sku} copyable />}
              {manufacturer && <SpecItem label="Manufacturer" value={manufacturer} />}
              {barcode && <SpecItem label="Barcode" value={barcode} copyable />}
            </div>
          </div>
        )}

        {/* Technical Specifications */}
        {specifications.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase">Technical Specifications</h4>
            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <SpecItem key={index} label={spec.name} value={spec.value} />
              ))}
            </div>
          </div>
        )}

        {/* Comparison Note */}
        <div className="pt-4 border-t bg-blue-50 p-4 rounded">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> You can compare these specifications with similar products to make the best choice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface SpecItemProps {
  label: string;
  value: string;
  copyable?: boolean;
}

const SpecItem: React.FC<SpecItemProps> = ({ label, value, copyable }) => {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
      duration: 2000
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group">
      <div className="flex-1">
        <span className="text-xs font-medium text-gray-600 block mb-1">{label}</span>
        <span className="text-sm text-gray-900 break-words">{value}</span>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className={cn(
            'ml-3 p-1 rounded opacity-0 group-hover:opacity-100 transition-all',
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          )}
          title="Copy to clipboard"
        >
          <Copy size={14} />
        </button>
      )}
    </div>
  );
};

export default ProductSpecifications;
