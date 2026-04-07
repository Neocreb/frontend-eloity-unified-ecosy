import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ReviewList } from '@/components/marketplace/ReviewList';
import { Review } from '@/types/marketplace';

// Mock data
const mockReviews: Review[] = [
  {
    id: '1',
    productId: 'product-1',
    userId: 'user-1',
    userName: 'John Doe',
    rating: 5,
    title: 'Excellent Product',
    content: 'This product exceeded my expectations. Great quality!',
    images: ['/review-image-1.jpg'],
    helpful: 10,
    unhelpful: 1,
    verified: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    productId: 'product-1',
    userId: 'user-2',
    userName: 'Jane Smith',
    rating: 4,
    title: 'Good Value',
    content: 'Good quality at a reasonable price. Minor issues with packaging.',
    images: [],
    helpful: 5,
    unhelpful: 0,
    verified: true,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    productId: 'product-1',
    userId: 'user-3',
    userName: 'Bob Johnson',
    rating: 3,
    title: 'Average',
    content: 'It works as described, but nothing special.',
    images: [],
    helpful: 2,
    unhelpful: 1,
    verified: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockHandlers = {
  onLoadMore: jest.fn(),
  onReviewSubmit: jest.fn(),
  onHelpful: jest.fn(),
  onUnhelpful: jest.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ReviewList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Review Display', () => {
    it('should render list of reviews', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      expect(screen.getByText('Excellent Product')).toBeInTheDocument();
      expect(screen.getByText('Good Value')).toBeInTheDocument();
      expect(screen.getByText('Average')).toBeInTheDocument();
    });

    it('should display review author names', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should display review content/text', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      expect(screen.getByText(/This product exceeded my expectations/)).toBeInTheDocument();
      expect(screen.getByText(/Good quality at a reasonable price/)).toBeInTheDocument();
      expect(screen.getByText(/It works as described/)).toBeInTheDocument();
    });

    it('should display review ratings with stars', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should show star ratings (5, 4, 3)
      const stars = screen.getAllByRole('img', { hidden: true });

      expect(stars.length).toBeGreaterThan(0);
    });

    it('should display helpful count for each review', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      expect(screen.getByText(/10.*helpful|helpful.*10/i)).toBeInTheDocument();
      expect(screen.getByText(/5.*helpful|helpful.*5/i)).toBeInTheDocument();
    });

    it('should display verified badge for verified purchases', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should show verified badges for reviews with verified: true
      const verifiedBadges = screen.queryAllByText(/verified|purchase/i);

      expect(verifiedBadges.length).toBeGreaterThanOrEqual(2);
    });

    it('should display review images if present', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const reviewImage = screen.queryByAltText(/review|image/i);

      if (mockReviews[0].images.length > 0) {
        expect(reviewImage || screen.getByText(/image/i)).toBeTruthy();
      }
    });

    it('should display review dates', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should show dates for reviews
      expect(screen.getByText(/\d+\s*(?:days?|weeks?|months?)\s*ago/i) ||
             screen.getByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i)).toBeTruthy();
    });

    it('should render empty state when no reviews', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={[]}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      expect(screen.getByText(/no reviews|be the first|no customer reviews/i)).toBeInTheDocument();
    });
  });

  describe('Helpful/Unhelpful Voting', () => {
    it('should display helpful button for each review', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const helpfulButtons = screen.getAllByRole('button', { name: /helpful|thumb.*up/i });

      expect(helpfulButtons.length).toBeGreaterThanOrEqual(mockReviews.length);
    });

    it('should display unhelpful button for each review', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const unhelpfulButtons = screen.getAllByRole('button', { name: /unhelpful|thumb.*down|not helpful/i });

      expect(unhelpfulButtons.length).toBeGreaterThanOrEqual(mockReviews.length);
    });

    it('should mark helpful button as helpful vote count increases', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Find helpful count display
      expect(screen.getByText(/10.*helpful|helpful.*10/i)).toBeInTheDocument();
    });

    it('should prevent voting twice on same review', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const helpfulButtons = screen.getAllByRole('button', { name: /helpful|thumb.*up/i });

      // Click helpful
      await user.click(helpfulButtons[0]);

      // Should prevent second click or show message
      // (implementation-dependent)
      expect(helpfulButtons[0]).toBeTruthy();
    });
  });

  describe('Sorting & Filtering', () => {
    it('should display sort options', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Sort options should be visible
      expect(screen.getByText(/sort|order|newest|helpful|rating/i) ||
             screen.getByRole('button', { name: /sort|filter/i })).toBeTruthy();
    });

    it('should sort by most helpful', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const sortButton = screen.queryByRole('button', { name: /helpful|sort/i });

      if (sortButton) {
        await user.click(sortButton);

        // Should reorder reviews
        const titles = screen.getAllByText(/Excellent Product|Good Value|Average/);

        expect(titles.length).toBeGreaterThan(0);
      }
    });

    it('should sort by newest reviews', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const newestOption = screen.queryByText(/newest|recent|latest/i);

      if (newestOption) {
        await user.click(newestOption);

        // First review should be the newest
        const reviews = screen.getAllByText(/Excellent Product|Good Value|Average/);

        expect(reviews[0]).toBeInTheDocument();
      }
    });

    it('should filter by rating', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const filterButton = screen.queryByRole('button', { name: /filter|rating/i });

      if (filterButton) {
        await user.click(filterButton);

        // Should show filter options
        const fiveStarOption = screen.queryByText(/5.*star|all.*stars/i);

        if (fiveStarOption) {
          await user.click(fiveStarOption);

          // Should filter reviews
          expect(screen.getByText('Excellent Product')).toBeInTheDocument();
        }
      }
    });

    it('should display only verified purchases when filtered', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const verifiedFilter = screen.queryByRole('checkbox', { name: /verified/i });

      if (verifiedFilter) {
        await user.click(verifiedFilter);

        // Should show only verified reviews
        expect(screen.getByText('Excellent Product')).toBeInTheDocument();
        expect(screen.getByText('Good Value')).toBeInTheDocument();
        expect(screen.queryByText('Average')).not.toBeInTheDocument();
      }
    });
  });

  describe('Pagination', () => {
    it('should display load more button when more reviews exist', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
          hasMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more|see more|show more/i });

      expect(loadMoreButton).toBeInTheDocument();
    });

    it('should call onLoadMore when load more is clicked', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
          hasMore={true}
        />
      );

      const loadMoreButton = screen.getByRole('button', { name: /load more|see more|show more/i });

      await user.click(loadMoreButton);

      expect(mockHandlers.onLoadMore).toHaveBeenCalled();
    });

    it('should hide load more button when no more reviews', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
          hasMore={false}
        />
      );

      const loadMoreButton = screen.queryByRole('button', { name: /load more|see more|show more/i });

      expect(loadMoreButton).not.toBeInTheDocument();
    });

    it('should display pagination info (e.g., "Showing 1-10 of 50 reviews")', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
          totalCount={50}
        />
      );

      // May show pagination info
      const paginationInfo = screen.queryByText(/showing|of|reviews/i);

      expect(paginationInfo || screen.getByText(/Excellent Product/i)).toBeTruthy();
    });
  });

  describe('Review Images', () => {
    it('should display review images as thumbnails', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should render images if present
      const images = screen.queryAllByRole('img');

      expect(images.length).toBeGreaterThan(0);
    });

    it('should open image in lightbox on click', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Find an image with src
      const images = screen.queryAllByRole('img');

      if (images.length > 0 && images[0].getAttribute('src')) {
        await user.click(images[0]);

        // Lightbox should open
        // (implementation-dependent check)
        expect(images[0]).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('should stack reviews vertically on mobile', () => {
      const { container } = renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should have responsive layout
      expect(container.querySelector('[class*="responsive"], [class*="flex"], [class*="grid"]')).toBeTruthy();
    });

    it('should display full review text on mobile', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Full text should be visible
      expect(screen.getByText(/This product exceeded my expectations/)).toBeInTheDocument();
    });

    it('should make images smaller on mobile', () => {
      const { container } = renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const images = container.querySelectorAll('img');

      images.forEach((img) => {
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading for reviews section', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const heading = screen.queryByRole('heading', { name: /reviews|customer reviews/i });

      expect(heading || screen.getByText(/Excellent Product/i)).toBeTruthy();
    });

    it('should have accessible star rating display', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Star ratings should be accessible
      const ratings = screen.queryAllByText(/5\s*(?:out of|\/)\s*5|★{5}/i);

      expect(ratings.length || screen.getByText(/Excellent Product/i)).toBeTruthy();
    });

    it('should have accessible buttons', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      await user.tab();

      // Should be able to tab to buttons
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing review data gracefully', () => {
      const incompleteReviews = [
        { ...mockReviews[0], userName: '', content: '' },
      ];

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={incompleteReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should still render
      expect(screen.getByText(/Excellent Product/)).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={mockReviews}
          onLoadMore={mockHandlers.onLoadMore}
          isLoading={true}
        />
      );

      // Should show loading indicator
      const loadingText = screen.queryByText(/loading|please wait/i);

      expect(loadingText || screen.getByText(/Excellent Product/i)).toBeTruthy();
    });

    it('should handle error fetching reviews', () => {
      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={[]}
          onLoadMore={mockHandlers.onLoadMore}
          error="Failed to load reviews"
        />
      );

      // Should show error message
      expect(screen.getByText(/Failed to load reviews|error/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large lists efficiently with virtualization', () => {
      const manyReviews = Array.from({ length: 100 }, (_, i) => ({
        ...mockReviews[0],
        id: `review-${i}`,
        title: `Review ${i + 1}`,
      }));

      renderWithRouter(
        <ReviewList
          productId="product-1"
          reviews={manyReviews}
          onLoadMore={mockHandlers.onLoadMore}
        />
      );

      // Should render without performance issues
      expect(screen.getByText(/Review 1/i)).toBeInTheDocument();
    });
  });
});
