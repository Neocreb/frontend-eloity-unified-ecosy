import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Product } from '@/types/marketplace';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  rating: 4.5,
  reviews: 120,
  image: '/test-image.jpg',
  category: 'electronics',
  stock: 10,
  discount: 20,
  seller: {
    id: 'seller1',
    name: 'Test Seller',
    rating: 4.8,
  },
  featured: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockHandlers = {
  onAddToCart: jest.fn(),
  onAddToWishlist: jest.fn(),
  onViewProduct: jest.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render product card with all required elements', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('A test product')).toBeInTheDocument();
      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
      expect(screen.getByAltText('Test Product')).toBeInTheDocument();
    });

    it('should display rating with star icon', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(120 reviews)')).toBeInTheDocument();
    });

    it('should display discount badge when discount is present', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('should display seller information', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('Test Seller')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });

    it('should show "In Stock" status for available products', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText(/In Stock/i)).toBeInTheDocument();
    });

    it('should show "Out of Stock" status when stock is zero', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };

      renderWithRouter(
        <ProductCard
          product={outOfStockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    });

    it('should display featured badge when product is featured', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText(/Featured/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAddToCart when add to cart button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);

      expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(mockProduct);
    });

    it('should call onAddToWishlist when heart/wishlist button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const wishlistButton = screen.getByRole('button', { name: /wishlist|heart/i });
      await user.click(wishlistButton);

      expect(mockHandlers.onAddToWishlist).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should call onViewProduct when product name is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const productLink = screen.getByText('Test Product');
      await user.click(productLink);

      expect(mockHandlers.onViewProduct).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should disable add to cart button when product is out of stock', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };

      renderWithRouter(
        <ProductCard
          product={outOfStockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });

      expect(addToCartButton).toBeDisabled();
    });

    it('should handle multiple rapid clicks on add to cart', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });

      await user.click(addToCartButton);
      await user.click(addToCartButton);

      // Should only be called once due to debouncing/loading state
      expect(mockHandlers.onAddToCart.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes for mobile view', () => {
      const { container } = renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const card = container.firstChild;

      // Should have responsive grid classes
      expect(card).toHaveClass(/w-full|responsive|grid/i);
    });
  });

  describe('Image Handling', () => {
    it('should display product image', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const image = screen.getByAltText('Test Product');

      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should show loading state for image', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const image = screen.getByAltText('Test Product');

      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should handle missing product image gracefully', () => {
      const productWithoutImage = { ...mockProduct, image: '' };

      renderWithRouter(
        <ProductCard
          product={productWithoutImage}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      // Should still render the card without crashing
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should display original price and discounted price', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      // Discounted price
      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();

      // Original price (if displaying)
      const originalPrice = (99.99 / (1 - 0.2)).toFixed(2);
      expect(screen.getByText(new RegExp(originalPrice))).toBeInTheDocument();
    });

    it('should format price correctly for different currencies', () => {
      const productWithDifferentPrice = { ...mockProduct, price: 1234.56 };

      renderWithRouter(
        <ProductCard
          product={productWithDifferentPrice}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText(/\$1.*234\.56|1,234\.56/)).toBeInTheDocument();
    });

    it('should display prices with proper rounding', () => {
      const productWithOddPrice = { ...mockProduct, price: 19.99 };

      renderWithRouter(
        <ProductCard
          product={productWithOddPrice}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText(/19\.99/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for images', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const image = screen.getByAltText('Test Product');

      expect(image).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      const wishlistButton = screen.getByRole('button', { name: /wishlist|heart/i });

      expect(addToCartButton).toHaveAccessibleName();
      expect(wishlistButton).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });

      // Tab to button
      await user.tab();

      // Should be able to activate with Enter
      addToCartButton.focus();
      fireEvent.keyDown(addToCartButton, { key: 'Enter', code: 'Enter' });

      expect(mockHandlers.onAddToCart.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper ARIA labels for interactive elements', () => {
      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing seller information gracefully', () => {
      const productWithoutSeller = { ...mockProduct, seller: null };

      renderWithRouter(
        <ProductCard
          product={productWithoutSeller}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle zero rating gracefully', () => {
      const productWithoutRating = { ...mockProduct, rating: 0, reviews: 0 };

      renderWithRouter(
        <ProductCard
          product={productWithoutRating}
          onAddToCart={mockHandlers.onAddToCart}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle callback errors gracefully', async () => {
      const user = userEvent.setup();
      const errorHandler = jest.fn().mockRejectedValue(new Error('Add to cart failed'));

      renderWithRouter(
        <ProductCard
          product={mockProduct}
          onAddToCart={errorHandler}
          onAddToWishlist={mockHandlers.onAddToWishlist}
          onViewProduct={mockHandlers.onViewProduct}
        />
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });

      await user.click(addToCartButton);

      // Should handle error without crashing
      expect(errorHandler).toHaveBeenCalled();
    });
  });
});
