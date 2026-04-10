import { useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import Footer from './Footer'

const NAV_ITEMS = [
  { to: '/analyze', label: 'Gap Analysis' },
  { to: '/students', label: '학생 관리' },
  { to: '/tests', label: '시험 관리' },
  { to: '/analysis', label: 'AI 분석' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col font-[var(--font-body)]">
      <header className="bg-white border-b border-[var(--color-card-border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-[var(--font-heading)] text-[var(--color-navy)] group-hover:text-[var(--color-gold)] transition-colors">
              CurriculumMind
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-navy)] text-white'
                      : 'text-[var(--color-navy-light)] hover:bg-[var(--color-table-header)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--color-navy)] hover:bg-[var(--color-table-header)]"
            aria-label="메뉴 열기"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-[var(--color-card-border)] px-6 py-3 space-y-1">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-navy)] text-white'
                      : 'text-[var(--color-navy-light)] hover:bg-[var(--color-table-header)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
