import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Product } from '@/types/marketplace';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils';

interface VirtualProductListProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onAddToWishlist: (productId: string) => void;
  onViewProduct?: (product: Product) => void;
  onMessageSeller?: (sellerId: string, productId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  columnsPerRow?: number;
  className?: string;
  showSellerInfo?: boolean;
}

/**
 * VirtualProductList Component
 * 
 * Uses react-window for virtual scrolling to efficiently render
 * large product lists. Only renders visible items to improve performance.
 * 
 * Features:
 * - Virtual scrolling for 1000+ products
 * - Configurable column count
 * - Infinite scroll support
 * - Responsive design
 */
const VirtualProductList: React.FC<VirtualProductListProps> = ({
  products,
  onAddToCart,
  onAddToWishlist,
  onViewProduct,
  onMessageSeller,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  columnsPerRow = 4,
  className,
  showSellerInfo = false,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  // Calculate grid dimensions
  const itemSize = 300; // Height of each product card with spacing
  const columnWidth = `${100 / columnsPerRow}%`;
  const rowHeight = itemSize;
  const totalRows = Math.ceil(products.length / columnsPerRow);

  // Group products into rows
  const rows = useMemo(() => {
    const grouped: Product[][] = [];
    for (let i = 0; i < products.length; i += columnsPerRow) {
      grouped.push(products.slice(i, i + columnsPerRow));
    }
    return grouped;
  }, [products, columnsPerRow]);

  // Handle scroll
  const handleScroll = useCallback(
    ({ scrollOffset: offset }: { scrollOffset: number }) => {
      setScrollOffset(offset);

      // Load more when near the end
      if (hasMore && onLoadMore) {
        const scrollHeight = totalRows * rowHeight;
        const visibleHeight = 600; // Approximate visible height
        const nearEnd = scrollHeight - offset - visibleHeight < 500;

        if (nearEnd) {
          onLoadMore();
        }
      }
    },
    [hasMore, onLoadMore, rowHeight, totalRows]
  );

  // Render a single row
  const Row: React.FC<{ index: number; style: React.CSSProperties }> = ({
    index,
    style,
  }) => {
    const rowProducts = rows[index] || [];

    return (
      <div
        style={style}
        className="flex gap-4 px-4 py-2"
      >
        {rowProducts.map((product) => (
          <div
            key={product.id}
            style={{ width: columnWidth }}
            className="flex-shrink-0"
          >
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onAddToWishlist={onAddToWishlist}
              onViewProduct={onViewProduct}
              onMessageSeller={onMessageSeller}
              showSellerInfo={showSellerInfo}
              className="h-full"
            />
          </div>
        ))}

        {/* Fill empty columns */}
        {rowProducts.length < columnsPerRow &&
          Array.from({ length: columnsPerRow - rowProducts.length }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                style={{ width: columnWidth }}
                className="flex-shrink-0"
              />
            )
          )}
      </div>
    );
  };

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your filters or search</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full bg-white', className)}>
      <List
        height={600} // Visible height in pixels
        itemCount={totalRows}
        itemSize={rowHeight}
        width="100%"
        onScroll={handleScroll}
      >
        {Row}
      </List>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full" />
            <p className="text-gray-600 mt-2">Loading more products...</p>
          </div>
        </div>
      )}

      {/* End of list */}
      {products.length > 0 && !hasMore && !isLoading && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <p>No more products to load</p>
        </div>
      )}
    </div>
  );
};

export default VirtualProductList;
