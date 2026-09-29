import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '@/pages/HomePlatform';
import * as fc from 'fast-check';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <nav {...props}>{children}</nav>,
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <h1 {...props}>{children}</h1>,
    span: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useInView: () => true,
}));

vi.mock('@/components/PageTransition', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/TypewriterText', () => ({
  default: ({ texts }: { texts: string[] }) => <div>{texts[0]}</div>,
}));

vi.mock('@/components/VideoBackground', () => ({
  VideoBackground: () => <div data-testid="video-background" />,
}));

vi.mock('@/components/LayeredButton', () => ({
  LayeredButton: ({ children, href }: React.PropsWithChildren<{ href?: string }>) => (
    <a href={href} data-testid="layered-button">
      {children}
    </a>
  ),
}));

// Rewritten against the real HomePlatform navbar: 3 links ("Steps",
// "Features", "Categories"), colored with the token text-foreground/70
// (not a hardcoded text-white), and no chevron icons or gap-[14px] spacing
// — that styling belonged to an unrelated stale template this file was
// previously testing against.
describe('Navbar - Property-Based Tests', () => {
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
   * For any viewport width, jsdom cannot evaluate @media queries, so the
   * meaningful, viewport-independent property to check is that the nav
   * links container always carries both "hidden" (mobile default) and
   * "md:flex" (desktop override) — the two classes together are what
   * implement the responsive show/hide, regardless of window.innerWidth.
   */
  it('should always render the nav-links container with responsive hidden/md:flex classes, independent of viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (viewportWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          const navLinksContainer = container.querySelector('.hidden.md\\:flex');
          expect(navLinksContainer).toBeInTheDocument();
          expect(navLinksContainer).toHaveClass('hidden');
          expect(navLinksContainer).toHaveClass('md:flex');

          const navLinks = navLinksContainer?.querySelectorAll('a');
          expect(navLinks?.length).toBe(3);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For all navigation links in the Navbar, each link should share the
   * same real, current styling: muted foreground color, 14px font,
   * medium weight, hover-to-primary transition.
   */
  it('should apply consistent styling to all navigation links', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(
            <BrowserRouter>
              <Landing />
            </BrowserRouter>
          );

          const navLinksContainer = container.querySelector('.hidden.md\\:flex');
          expect(navLinksContainer).toBeInTheDocument();

          const navLinks = navLinksContainer?.querySelectorAll('a');
          expect(navLinks).toBeDefined();
          expect(navLinks!.length).toBe(3);

          navLinks?.forEach((link) => {
            expect(link).toHaveClass('text-foreground/70');
            expect(link).toHaveClass('text-[14px]');
            expect(link).toHaveClass('font-medium');
            expect(link).toHaveClass('flex');
            expect(link).toHaveClass('items-center');
            expect(link).toHaveClass('hover:text-primary');
          });

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
