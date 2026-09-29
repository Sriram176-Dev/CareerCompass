import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    h2: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => <h3 {...props}>{children}</h3>,
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

// ThemeToggle is now removed for permanent dark mode

describe('Landing Hero Section - Unit Tests', () => {
  describe('Hero Heading', () => {
    it('should display correct heading text', () => {
      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = screen.getByText('Career Guidance at the Speed of AI');
      expect(heading).toBeInTheDocument();
    });

    it('should have max-width of 800px', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = container.querySelector('.gradient-text');
      expect(heading).toHaveStyle({ maxWidth: '800px' });
    });

    it('should have 36px font size on mobile and 56px on desktop', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = container.querySelector('.gradient-text');
      expect(heading).toHaveClass('text-[36px]');
      expect(heading).toHaveClass('md:text-[56px]');
    });

    it('should have bold font weight', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = container.querySelector('.gradient-text');
      expect(heading).toHaveClass('font-bold');
    });

    it('should have 1.2 line height', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = container.querySelector('.gradient-text');
      expect(heading).toHaveClass('leading-[1.2]');
    });

    it('should apply gradient-text class', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heading = container.querySelector('.gradient-text');
      expect(heading).toHaveClass('gradient-text');
    });
  });

  describe('Hero Subtitle', () => {
    it('should display subtitle text', () => {
      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitle = screen.getByTestId('typewriter-text');
      expect(subtitle).toBeInTheDocument();
    });

    it('should have 16px font size', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitleContainer = container.querySelector('[data-testid="typewriter-text"]')?.parentElement;
      expect(subtitleContainer).toHaveStyle({ fontSize: '16px' });
    });

    it('should have 70% opacity white color in dark mode', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitleContainer = container.querySelector('[data-testid="typewriter-text"]')?.parentElement;
      expect(subtitleContainer).toHaveClass('dark:text-white/70');
    });

    it('should have max-width of 680px', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitleContainer = container.querySelector('[data-testid="typewriter-text"]')?.parentElement;
      expect(subtitleContainer).toHaveStyle({ maxWidth: '680px' });
    });

    it('should have medium (500) font weight', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitleContainer = container.querySelector('[data-testid="typewriter-text"]')?.parentElement;
      expect(subtitleContainer).toHaveStyle({ fontWeight: 500 });
    });

    it('should be positioned 24px below heading', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const subtitleContainer = container.querySelector('[data-testid="typewriter-text"]')?.parentElement;
      expect(subtitleContainer).toHaveClass('mt-[24px]');
    });
  });

  describe('Hero Spacing', () => {
    it('should have 200px top padding on mobile and 280px on desktop', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heroContent = container.querySelector('.container.relative.mx-auto');
      expect(heroContent).toHaveClass('pt-[200px]');
      expect(heroContent).toHaveClass('md:pt-[280px]');
    });

    it('should have 102px bottom padding', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heroContent = container.querySelector('.container.relative.mx-auto');
      expect(heroContent).toHaveClass('pb-[102px]');
    });

    it('should have 40px vertical gap between badge and heading group', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // The heading and subtitle group has mt-[40px] from the badge
      const headingGroup = container.querySelector('.flex.flex-col.items-center.mt-\\[40px\\]');
      expect(headingGroup).toBeInTheDocument();
      expect(headingGroup).toHaveClass('mt-[40px]');
    });

    it('should have 40px vertical gap between subtitle and CTA buttons', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // The CTA buttons container has mt-[40px]
      const ctaContainer = container.querySelector('.flex.flex-col.items-center.gap-4.sm\\:flex-row.sm\\:justify-center.mt-\\[40px\\]');
      expect(ctaContainer).toBeInTheDocument();
      expect(ctaContainer).toHaveClass('mt-[40px]');
    });
  });

  describe('Hero Content Centering', () => {
    it('should horizontally center content container', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heroContent = container.querySelector('.container.relative.mx-auto');
      expect(heroContent).toHaveClass('mx-auto');
      expect(heroContent).toHaveClass('text-center');
    });

    it('should vertically center content elements', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heroContent = container.querySelector('.container.relative.mx-auto');
      expect(heroContent).toHaveClass('flex');
      expect(heroContent).toHaveClass('flex-col');
      expect(heroContent).toHaveClass('items-center');
    });

    it('should center hero section vertically', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const heroSection = container.querySelector('section.relative.min-h-screen');
      expect(heroSection).toHaveClass('flex');
      expect(heroSection).toHaveClass('items-center');
    });
  });

  // BadgePill was removed from the hero in a later redesign — no equivalent
  // element exists to test here anymore.

  describe('VideoBackground Component', () => {
    it('should render VideoBackground with correct video URL', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute(
        'src',
        'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4'
      );
    });

    it('should have overlay with 0 opacity (HomePlatform supplies its own theme-aware overlay instead)', () => {
      const { container } = render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      // HomePlatform passes overlayOpacity={0} to VideoBackground and layers
      // its own separate theme-aware overlay div on top instead.
      const overlay = container.querySelector('.absolute.inset-0.z-10');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)' });
    });
  });

  describe('LayeredButton Components', () => {
    it('should render primary CTA buttons', () => {
      render(
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      );

      expect(screen.getByText('Start Career Discovery')).toBeInTheDocument();
      expect(screen.getByText('Explore All Careers')).toBeInTheDocument();
    });
  });
});
