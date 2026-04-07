import { render, screen, waitFor } from '@testing-library/react';
import OptimizedImage from '@/components/marketplace/OptimizedImage';

describe('OptimizedImage Component', () => {
  const mockImageUrl = 'https://example.com/product.jpg';
  const mockAltText = 'Test Product Image';

  beforeEach(() => {
    // Mock fetch for image requests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with alt text', async () => {
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} />);
    
    await waitFor(() => {
      const img = screen.getByAltText(mockAltText);
      expect(img).toBeInTheDocument();
    });
  });

  test('applies lazy loading by default', async () => {
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} />);
    
    await waitFor(() => {
      const img = screen.getByAltText(mockAltText);
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  test('uses eager loading when priority is set', async () => {
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} priority />);
    
    await waitFor(() => {
      const img = screen.getByAltText(mockAltText);
      expect(img).toHaveAttribute('loading', 'eager');
    });
  });

  test('shows error state when image fails to load', async () => {
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} />);
    
    // Simulate image load error
    const img = screen.getByAltText(mockAltText) as HTMLImageElement;
    const event = new Event('error');
    img.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('Image not available')).toBeInTheDocument();
    });
  });

  test('applies custom className', () => {
    const customClass = 'custom-image-class';
    const { container } = render(
      <OptimizedImage src={mockImageUrl} alt={mockAltText} className={customClass} />
    );

    const wrapper = container.querySelector('.w-full.h-full.object-cover');
    expect(wrapper).toBeInTheDocument();
  });

  test('handles quality settings', async () => {
    const { rerender } = render(
      <OptimizedImage src={mockImageUrl} alt={mockAltText} quality="high" />
    );

    await waitFor(() => {
      const img = screen.getByAltText(mockAltText);
      expect(img).toBeInTheDocument();
    });

    rerender(<OptimizedImage src={mockImageUrl} alt={mockAltText} quality="low" />);

    await waitFor(() => {
      const img = screen.getByAltText(mockAltText);
      expect(img).toBeInTheDocument();
    });
  });

  test('respects container aspect ratio', () => {
    const { container } = render(
      <OptimizedImage
        src={mockImageUrl}
        alt={mockAltText}
        width={300}
        height={200}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    const style = wrapper.getAttribute('style');
    expect(style).toContain('aspectRatio');
  });

  test('calls onLoad callback when image loads', async () => {
    const onLoad = jest.fn();
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} onLoad={onLoad} />);

    // Simulate load event
    await waitFor(() => {
      const img = screen.getByAltText(mockAltText) as HTMLImageElement;
      img.dispatchEvent(new Event('load'));
      expect(onLoad).toHaveBeenCalled();
    });
  });

  test('calls onError callback when image fails', async () => {
    const onError = jest.fn();
    render(<OptimizedImage src={mockImageUrl} alt={mockAltText} onError={onError} />);

    // Simulate error event
    await waitFor(() => {
      const img = screen.getByAltText(mockAltText) as HTMLImageElement;
      img.dispatchEvent(new Event('error'));
      expect(onError).toHaveBeenCalled();
    });
  });
});
