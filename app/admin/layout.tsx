'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/teams', label: 'Teams & Players' },
  { href: '/admin/tournaments', label: 'Tournaments' },
  { href: '/admin/fixtures', label: 'Fixtures' },
  { href: '/admin/fixtures/new', label: '+ New Fixture' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#000000]">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#111111] border-r border-[#1a1a1a] min-h-screen p-5">
        <div className="mb-8">
          <div className="font-condensed font-black text-lg uppercase tracking-wider text-white mb-1">
            ⚽ CCI FOOTBALL
          </div>
          <div className="ea-label">Admin Panel</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-condensed font-bold text-sm uppercase tracking-wider block px-3 py-2.5 transition-colors rounded-r-lg ${
                pathname === link.href
                  ? 'bg-[#00E676]/10 text-[#00E676] border-l-2 border-[#00E676]'
                  : 'text-[#3d6b3d] hover:text-white hover:bg-[#1a1a1a] border-l-2 border-transparent'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <Link
            href="/admin/logout"
            className="font-condensed font-bold text-sm uppercase tracking-wider block px-3 py-2.5 text-[#ff7a7a] hover:text-white hover:bg-[#1a1a1a] border-l-2 border-transparent rounded-r-lg transition-colors"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* ── Mobile top bar ── */}
        <header className="md:hidden flex items-center justify-between bg-[#111111] border-b border-[#1a1a1a] px-4 py-3.5">
          <span className="font-condensed font-black text-base uppercase tracking-wider text-white">
            ⚽ CCI FOOTBALL
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            className="text-[#3d6b3d] hover:text-white p-1 transition-colors"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </header>

        {/* ── Mobile dropdown nav ── */}
        {menuOpen && (
          <nav className="md:hidden bg-[#111111] border-b border-[#1a1a1a] px-4 pb-3 flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`font-condensed font-bold text-sm uppercase tracking-wider block rounded-lg px-3 py-2.5 transition-colors ${
                  pathname === link.href
                    ? 'bg-[#00E676]/10 text-[#00E676]'
                    : 'text-[#3d6b3d] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
