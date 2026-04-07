import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import EnhancedProductDetail from '@/components/marketplace/EnhancedProductDetail';
import MarketplaceBreadcrumb from '@/components/marketplace/MarketplaceBreadcrumb';

const DetailedProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();

  if (!productId) {
    return <Navigate to="/app/marketplace" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <MarketplaceBreadcrumb />
        <EnhancedProductDetail productId={productId} />
      </div>
    </div>
  );
};

export default DetailedProductPage;
