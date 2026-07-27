import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navLinks = [
  { path: '/features', label: 'Features' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/enterprise', label: 'Enterprise' },
  { path: '/blog', label: 'Blog' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact' },
];

const footerSections = [
  {
    title: 'Product',
    links: [
      { path: '/features', label: 'Features' },
      { path: '/pricing', label: 'Pricing' },
      { path: '/enterprise', label: 'Enterprise' },
      { path: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { path: '/blog', label: 'Blog' },
      { path: '/faq', label: 'FAQ' },
      { path: '/docs', label: 'Documentation' },
      { path: '/api', label: 'API Reference' },
    ],
  },
  {
    title: 'Company',
    links: [
      { path: '/about', label: 'About' },
      { path: '/contact', label: 'Contact' },
      { path: '/careers', label: 'Careers' },
      { path: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { path: '/legal/privacy', label: 'Privacy Policy' },
      { path: '/legal/terms', label: 'Terms of Service' },
      { path: '/legal/cookies', label: 'Cookie Policy' },
      { path: '/legal/dpa', label: 'DPA' },
    ],
  },
];

export default function MarketingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-green-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md" role="banner">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white">O</div>
            <span className="text-lg font-bold">OwnChatGPTBusiness</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  location.pathname === link.path ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-4 flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-green-600 hover:to-emerald-700"
              >
                Get Started
              </Link>
            </div>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden" role="navigation" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
              <Link to="/login" className="rounded-lg px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100">
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-2 text-center text-sm font-medium text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1" role="main">
        <Outlet />
      </main>

      <footer className="border-t border-gray-100 bg-gray-50" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-gray-600 transition-colors hover:text-green-600">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} OwnChatGPTBusiness. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
