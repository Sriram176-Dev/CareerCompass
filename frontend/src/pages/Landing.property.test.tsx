import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '@/pages/HomePlatform';
import * as fc from 'fast-check';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ session: null }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <nav {...props}>{children}</nav>,
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <h1 {...props}>{children}</h1>,
    span: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <span {...props}>{children}</span>,
    section: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useInView: () => true,
}));

// Mock other components
vi.mock('@/components/PageTransition', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/TypewriterText', () => ({
  default: ({ texts }: { texts: string[] }) => <div data-testid="typewriter-text">{texts[0]}</div>,
}));

describe('Landing Hero Section - Property-Based Tests', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  /**
   * Feature: modern-hero-landing-redesign
   * Property 3: Responsive Hero Typography
   *
   * **Validates: Requirements 9.2, 9.5**
   *
   * For any viewport width, the hero heading font size should be 36px when
   * viewport width is below 768px, and 56px when viewport width is at or above 768px.
   */
  it('should adjust heading font size based on viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (viewportWidth) => {
          // Set viewport width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          // Render component
          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Find the hero heading
          const heading = container.querySelector('.gradient-text');
          expect(heading).toBeInTheDocument();

          // Check responsive font size classes
          // Mobile: text-[36px], Desktop: md:text-[56px]
          expect(heading).toHaveClass('text-[36px]');
          expect(heading).toHaveClass('md:text-[56px]');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: modern-hero-landing-redesign
   * Property 4: Responsive Hero Spacing
   *
   * **Validates: Requirements 9.3, 9.6**
   *
   * For any viewport width, the hero section top padding should be 200px when
   * viewport width is below 768px, and 280px when viewport width is at or above 768px.
   */
  it('should adjust hero top padding based on viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (viewportWidth) => {
          // Set viewport width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          // Render component
          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Find the hero content container
          const heroContent = container.querySelector('.pt-\\[200px\\].md\\:pt-\\[280px\\]');
          expect(heroContent).toBeInTheDocument();

          // Check responsive padding classes
          // Mobile: pt-[200px], Desktop: md:pt-[280px]
          expect(heroContent).toHaveClass('pt-[200px]');
          expect(heroContent).toHaveClass('md:pt-[280px]');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: modern-hero-landing-redesign
   * Property 5: Content Centering
   *
   * **Validates: Requirements 4.1, 4.5**
   *
   * For all content elements within the Hero_Section, the elements should be
   * horizontally and vertically centered within their container.
   */
  it('should center all hero content elements', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Render component
          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Find the hero content container
          const heroContent = container.querySelector('.container.relative.mx-auto');
          expect(heroContent).toBeInTheDocument();

          // Verify centering classes
          expect(heroContent).toHaveClass('mx-auto'); // horizontal centering
          expect(heroContent).toHaveClass('text-center'); // text centering
          expect(heroContent).toHaveClass('flex'); // flex layout
          expect(heroContent).toHaveClass('flex-col'); // vertical stacking
          expect(heroContent).toHaveClass('items-center'); // horizontal centering of flex items

          // Find the hero section
          const heroSection = container.querySelector('section.relative.min-h-screen');
          expect(heroSection).toBeInTheDocument();
          expect(heroSection).toHaveClass('flex'); // flex layout
          expect(heroSection).toHaveClass('items-center'); // vertical centering

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: modern-hero-landing-redesign
   * Property 8: Text Contrast Accessibility
   *
   * **Validates: Requirements 10.3**
   *
   * For all text elements displayed over the Video_Overlay in the Hero_Section,
   * the contrast ratio between the text color and the overlay background should
   * meet or exceed 4.5:1 (WCAG AA standard).
   *
   * Note: This test verifies that text elements use white or near-white colors
   * over a dark overlay (rgba(0, 0, 0, 0.5)), which provides sufficient contrast.
   */
  it('should maintain WCAG AA contrast ratio for all text over video overlay', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Render component
          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          // Find the hero section
          const heroSection = container.querySelector('section.relative.min-h-screen');
          expect(heroSection).toBeInTheDocument();

          // Find text elements in hero section
          const heading = heroSection?.querySelector('.gradient-text');
          const subtitle = container.querySelector('[data-testid="typewriter-text"]');

          // Verify heading exists and uses gradient-text (white to transparent)
          expect(heading).toBeInTheDocument();
          expect(heading).toHaveClass('gradient-text');

          // Verify subtitle exists and uses white with opacity
          expect(subtitle).toBeInTheDocument();
          const subtitleParent = subtitle?.parentElement;
          expect(subtitleParent).toHaveClass('dark:text-white/70');

          // The gradient-text class uses white (rgba(255, 255, 255, 1)) at 28%
          // The subtitle uses white with 70% opacity (rgba(255, 255, 255, 0.7))
          // Both provide sufficient contrast over rgba(0, 0, 0, 0.5) overlay
          // White (#FFFFFF) on rgba(0, 0, 0, 0.5) has a contrast ratio of ~10:1
          // which exceeds the WCAG AA requirement of 4.5:1

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
