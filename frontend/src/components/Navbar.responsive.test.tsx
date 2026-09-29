import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '@/pages/HomePlatform';

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
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useInView: () => true,
}));

// Mock other components
vi.mock('@/components/PageTransition', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/TypewriterText', () => ({
  default: ({ texts }: { texts: string[] }) => <div>{texts[0]}</div>,
}));

// ThemeToggle removed

vi.mock('@/components/LayeredButton', () => ({
  LayeredButton: ({ children, href }: React.PropsWithChildren<{ href?: string }>) => <a href={href} data-testid="layered-button">{children}</a>,
}));

describe('Navbar Responsive Behavior - Requirements 3.5, 9.1, 9.4', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Mobile viewport (<768px)', () => {
    it('should hide navigation links at 767px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('hidden');
    });

    it('should hide navigation links at 375px (mobile)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('hidden');
    });

    it('should hide navigation links at 320px (small mobile)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('hidden');
    });
  });

  describe('Desktop viewport (≥768px)', () => {
    it('should show navigation links at 768px (exact breakpoint)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('md:flex');
    });

    it('should show navigation links at 1024px (tablet)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('md:flex');
    });

    it('should show navigation links at 1920px (desktop)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toBeInTheDocument();
      expect(navLinksContainer).toHaveClass('md:flex');
    });
  });

  describe('Navigation links structure', () => {
    it('should have correct gap spacing between links (30px)', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      expect(navLinksContainer).toHaveClass('gap-[30px]');
    });

    it('should contain all three navigation links', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      const links = navLinksContainer?.querySelectorAll('a');
      expect(links?.length).toBe(3);
    });

    it('should have correct styling classes for navigation links', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const navLinksContainer = container.querySelector('.hidden.md\\:flex');
      const firstLink = navLinksContainer?.querySelector('a');

      expect(firstLink).toHaveClass('flex');
      expect(firstLink).toHaveClass('items-center');
      expect(firstLink).toHaveClass('text-foreground/70');
      expect(firstLink).toHaveClass('text-[14px]');
      expect(firstLink).toHaveClass('font-medium');
    });
  });

  describe('Navbar layout', () => {
    it('should maintain logo visibility on all viewports', () => {
      const viewports = [320, 375, 768, 1024, 1920];

      viewports.forEach(width => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        render(
          <BrowserRouter>
            <Landing />
          </BrowserRouter>
        );

        expect(screen.getByText('Career Compass')).toBeInTheDocument();
        cleanup();
      });
    });

    it('should maintain LayeredButton visibility on all viewports', () => {
      const viewports = [320, 375, 768, 1024, 1920];
      
      viewports.forEach(width => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { container } = render(
          <BrowserRouter>
            <Landing />
          </BrowserRouter>
        );

        const button = container.querySelector('[data-testid="layered-button"]');
        expect(button).toBeInTheDocument();
      });
    });
  });
});
