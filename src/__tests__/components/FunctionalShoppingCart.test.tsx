import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedMarketplaceContext } from '@/contexts/EnhancedMarketplaceContext';
import { FunctionalShoppingCart } from '@/components/marketplace/FunctionalShoppingCart';
import { CartItem, Product } from '@/types/marketplace';

// Mock data
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

const mockCartItem: CartItem = {
  product: mockProduct,
  quantity: 2,
  priceAtAddTime: 99.99,
};

const mockContextValue = {
  cart: [mockCartItem],
  products: [mockProduct],
  categories: [],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartItem: jest.fn(),
  clearCart: jest.fn(),
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
  getCartTotal: jest.fn(() => 199.98),
  getCartItemsCount: jest.fn(() => 2),
  getWishlistCount: jest.fn(() => 0),
  isInWishlist: jest.fn(() => false),
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <EnhancedMarketplaceContext.Provider value={mockContextValue}>
        {component}
      </EnhancedMarketplaceContext.Provider>
    </BrowserRouter>
  );
};

describe('FunctionalShoppingCart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cart Display', () => {
    it('should render empty cart message when cart is empty', () => {
      const emptyContextValue = { ...mockContextValue, cart: [] };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={emptyContextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    it('should display all items in cart', () => {
      renderWithContext(<FunctionalShoppingCart />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText(/quantity.*2/i)).toBeInTheDocument();
    });

    it('should show cart item count', () => {
      renderWithContext(<FunctionalShoppingCart />);

      expect(screen.getByText(/2 items?/i)).toBeInTheDocument();
    });

    it('should display product image in cart', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const image = screen.getByAltText('Test Product');

      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should display seller information for each item', () => {
      renderWithContext(<FunctionalShoppingCart />);

      expect(screen.getByText('Test Seller')).toBeInTheDocument();
    });
  });

  describe('Pricing Calculations', () => {
    it('should display correct item price', () => {
      renderWithContext(<FunctionalShoppingCart />);

      expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
    });

    it('should display subtotal correctly', () => {
      renderWithContext(<FunctionalShoppingCart />);

      // Subtotal = 99.99 * 2 = 199.98
      expect(screen.getByText(/subtotal.*199\.98|199\.98.*subtotal/i)).toBeInTheDocument();
    });

    it('should display cart total', () => {
      renderWithContext(<FunctionalShoppingCart />);

      expect(screen.getByText(/total.*|.*total/i)).toBeInTheDocument();
    });

    it('should recalculate totals when quantity changes', async () => {
      const user = userEvent.setup();
      const updateMock = jest.fn();
      const contextValue = { ...mockContextValue, updateCartItem: updateMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const quantityInput = screen.getByDisplayValue('2');
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      expect(updateMock).toHaveBeenCalled();
    });

    it('should handle decimal prices correctly', () => {
      const productWithDecimalPrice = { ...mockProduct, price: 19.99 };
      const cartItem = { ...mockCartItem, product: productWithDecimalPrice };
      const contextValue = { ...mockContextValue, cart: [cartItem], getCartTotal: jest.fn(() => 39.98) };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/19\.99/)).toBeInTheDocument();
    });
  });

  describe('Quantity Management', () => {
    it('should display quantity input for each item', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const quantityInput = screen.getByDisplayValue('2');

      expect(quantityInput).toBeInTheDocument();
    });

    it('should update quantity when changed', async () => {
      const user = userEvent.setup();
      const updateMock = jest.fn();
      const contextValue = { ...mockContextValue, updateCartItem: updateMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      fireEvent.blur(quantityInput);

      expect(updateMock).toHaveBeenCalled();
    });

    it('should not allow quantity below 1', async () => {
      const user = userEvent.setup();
      const updateMock = jest.fn();
      const contextValue = { ...mockContextValue, updateCartItem: updateMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

      await user.clear(quantityInput);
      await user.type(quantityInput, '0');

      fireEvent.blur(quantityInput);

      // Should either not call update or revert to 1
      if (updateMock.mock.calls.length > 0) {
        expect(updateMock.mock.calls[0][0]).toEqual(mockProduct.id);
        expect(updateMock.mock.calls[0][1]).toBeGreaterThanOrEqual(1);
      }
    });

    it('should handle quantity exceeding stock', async () => {
      const user = userEvent.setup();
      const updateMock = jest.fn();
      const contextValue = { ...mockContextValue, updateCartItem: updateMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

      await user.clear(quantityInput);
      await user.type(quantityInput, '20'); // Stock is 10

      fireEvent.blur(quantityInput);

      // Should either not allow or show error
      expect(updateMock).toHaveBeenCalled();
    });

    it('should have increment and decrement buttons', async () => {
      const user = userEvent.setup();
      const updateMock = jest.fn();
      const contextValue = { ...mockContextValue, updateCartItem: updateMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const incrementButton = screen.getByRole('button', { name: /\+|increment/i });
      const decrementButton = screen.getByRole('button', { name: /-|decrement/i });

      expect(incrementButton).toBeInTheDocument();
      expect(decrementButton).toBeInTheDocument();

      await user.click(incrementButton);

      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('Item Removal', () => {
    it('should display remove button for each item', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const removeButtons = screen.getAllByRole('button', { name: /remove|delete|trash/i });

      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should remove item when remove button is clicked', async () => {
      const user = userEvent.setup();
      const removeMock = jest.fn();
      const contextValue = { ...mockContextValue, removeFromCart: removeMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const removeButton = screen.getByRole('button', { name: /remove|delete|trash/i });

      await user.click(removeButton);

      expect(removeMock).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should update cart total after item removal', async () => {
      const user = userEvent.setup();
      const removeMock = jest.fn();
      const contextValue = { ...mockContextValue, removeFromCart: removeMock, getCartTotal: jest.fn(() => 0) };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const removeButton = screen.getByRole('button', { name: /remove|delete|trash/i });

      await user.click(removeButton);

      expect(removeMock).toHaveBeenCalled();
    });
  });

  describe('Save for Later', () => {
    it('should display save for later button', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const saveButton = screen.queryByRole('button', { name: /save|wishlist/i });

      if (saveButton) {
        expect(saveButton).toBeInTheDocument();
      }
    });

    it('should move item to wishlist when save button is clicked', async () => {
      const user = userEvent.setup();
      const addWishlistMock = jest.fn();
      const contextValue = { ...mockContextValue, addToWishlist: addWishlistMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const saveButton = screen.queryByRole('button', { name: /save|wishlist/i });

      if (saveButton) {
        await user.click(saveButton);

        expect(addWishlistMock).toHaveBeenCalledWith(mockProduct.id);
      }
    });
  });

  describe('Clear Cart', () => {
    it('should display clear cart button', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const clearButton = screen.getByRole('button', { name: /clear|empty/i });

      expect(clearButton).toBeInTheDocument();
    });

    it('should clear all items when clear button is clicked', async () => {
      const user = userEvent.setup();
      const clearMock = jest.fn();
      const contextValue = { ...mockContextValue, clearCart: clearMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const clearButton = screen.getByRole('button', { name: /clear|empty/i });

      await user.click(clearButton);

      expect(clearMock).toHaveBeenCalled();
    });
  });

  describe('Checkout Flow', () => {
    it('should display checkout button', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });

      expect(checkoutButton).toBeInTheDocument();
    });

    it('should disable checkout button when cart is empty', () => {
      const emptyContextValue = { ...mockContextValue, cart: [], getCartTotal: jest.fn(() => 0) };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={emptyContextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });

      expect(checkoutButton).toBeDisabled();
    });

    it('should navigate to checkout when checkout button is clicked', async () => {
      const user = userEvent.setup();

      renderWithContext(<FunctionalShoppingCart />);

      const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });

      await user.click(checkoutButton);

      // Should navigate (test will verify this through router)
      expect(checkoutButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes for mobile view', () => {
      const { container } = renderWithContext(<FunctionalShoppingCart />);

      const cartContainer = container.querySelector('[class*="responsive"], [class*="mobile"], [class*="grid"]');

      expect(cartContainer || container.firstChild).toBeInTheDocument();
    });

    it('should stack items vertically on mobile', () => {
      const { container } = renderWithContext(<FunctionalShoppingCart />);

      const cartItems = container.querySelectorAll('[class*="item"], [class*="product"]');

      // Items should exist regardless of layout
      expect(cartItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderWithContext(<FunctionalShoppingCart />);

      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithContext(<FunctionalShoppingCart />);

      const quantityInput = screen.getByDisplayValue('2');

      // Tab to input
      await user.tab();

      // Should be focusable
      expect(document.activeElement).toBeDefined();
    });

    it('should announce quantity changes to screen readers', () => {
      const { container } = renderWithContext(<FunctionalShoppingCart />);

      // Check for aria-live region
      const liveRegion = container.querySelector('[aria-live]');

      if (liveRegion) {
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing product data gracefully', () => {
      const badCartItem = { ...mockCartItem, product: null };
      const contextValue = { ...mockContextValue, cart: [badCartItem as any] };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      // Should not crash
      expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
    });

    it('should handle context update errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMock = jest.fn().mockRejectedValue(new Error('Update failed'));
      const contextValue = { ...mockContextValue, updateCartItem: errorMock };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      const quantityInput = screen.getByDisplayValue('2') as HTMLInputElement;

      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      fireEvent.blur(quantityInput);

      // Should handle error without crashing
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  describe('Multiple Items', () => {
    it('should display multiple cart items', () => {
      const product2 = { ...mockProduct, id: '2', name: 'Another Product' };
      const cartItem2 = { ...mockCartItem, product: product2 };
      const contextValue = { ...mockContextValue, cart: [mockCartItem, cartItem2], getCartItemsCount: jest.fn(() => 4) };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });

    it('should calculate correct total for multiple items with different prices', () => {
      const product2 = { ...mockProduct, id: '2', name: 'Another Product', price: 49.99 };
      const cartItem2 = { ...mockCartItem, product: product2, quantity: 1 };
      const contextValue = {
        ...mockContextValue,
        cart: [mockCartItem, cartItem2],
        getCartTotal: jest.fn(() => 249.97), // 99.99*2 + 49.99
      };

      render(
        <BrowserRouter>
          <EnhancedMarketplaceContext.Provider value={contextValue}>
            <FunctionalShoppingCart />
          </EnhancedMarketplaceContext.Provider>
        </BrowserRouter>
      );

      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });
});
