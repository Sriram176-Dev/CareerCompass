import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Landing from '@/pages/HomePlatform';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null }),
}));

// Mock framer-motion to avoid animation issues in tests
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
  LayeredButton: ({ children, href }: React.PropsWithChildren<{ href?: string }>) => <a href={href}>{children}</a>,
}));

// This suite renders the real Landing page (HomePlatform) and tests its
// embedded Navbar as it actually exists today: "Steps" / "Features" /
// "Categories" nav links, a "Career Compass" wordmark with a Compass icon,
// a "Get Started" CTA (or "Dashboard" when logged in), and a hamburger menu
// that toggles a mobile drawer. Earlier versions of this file tested a
// completely different, unrelated navbar (nav links "Developers"/"Pricing",
// CTA "Join Waitlist", a pixel-exact 187x25 logo) that never matched this
// product — those assertions are replaced here with the real content.
describe('Navbar (rendered inside HomePlatform)', () => {
  const renderNavbar = () => render(<BrowserRouter><Landing /></BrowserRouter>);

  it('renders the Career Compass wordmark linking home', () => {
    renderNavbar();
    const homeLink = screen.getByLabelText('Go to homepage');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Career Compass')).toBeInTheDocument();
  });

  it('renders all three navigation links with correct hrefs', () => {
    renderNavbar();
    expect(screen.getAllByRole('link', { name: 'Steps' })[0]).toHaveAttribute('href', '/#process');
    expect(screen.getAllByRole('link', { name: 'Features' })[0]).toHaveAttribute('href', '/#features');
    expect(screen.getAllByRole('link', { name: 'Categories' })[0]).toHaveAttribute('href', '/#categories');
  });

  it('hides the desktop nav-links container below the md breakpoint via Tailwind classes', () => {
    renderNavbar();
    const stepsLink = screen.getAllByRole('link', { name: 'Steps' })[0];
    const desktopContainer = stepsLink.parentElement;
    // jsdom doesn't evaluate @media queries, so the correct unit-level check
    // is that the container carries both "hidden" (default) and "md:flex"
    // (shown from 768px up), not an attempt to compute real visibility.
    expect(desktopContainer).toHaveClass('hidden');
    expect(desktopContainer).toHaveClass('md:flex');
  });

  it('shows a "Get Started" CTA when logged out', () => {
    renderNavbar();
    expect(screen.getAllByText('Get Started')[0]).toBeInTheDocument();
  });

  it('renders a mobile menu toggle button that is hidden on desktop (md:hidden)', () => {
    renderNavbar();
    const toggle = screen.getByLabelText('Open menu');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass('md:hidden');
  });

  it('opens the mobile drawer (with duplicate nav links) when the toggle is clicked', () => {
    renderNavbar();
    const toggle = screen.getByLabelText('Open menu');
    fireEvent.click(toggle);
    // Once open, "Steps" appears twice: once in the always-present desktop
    // container, once in the newly-rendered mobile drawer.
    expect(screen.getAllByRole('link', { name: 'Steps' }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes the mobile drawer when a drawer link is clicked', () => {
    renderNavbar();
    fireEvent.click(screen.getByLabelText('Open menu'));
    const drawerLinks = screen.getAllByRole('link', { name: 'Steps' });
    fireEvent.click(drawerLinks[drawerLinks.length - 1]);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('applies a fixed, blurred, scroll-aware background to the nav bar', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('fixed');
    expect(nav).toHaveClass('backdrop-blur-md');
  });
});
