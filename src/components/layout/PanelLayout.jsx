import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LogOut, Menu, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

/**
 * Shared shell for all three panels: collapsible sidebar, top bar with avatar
 * menu, footer, and optional mobile bottom navigation.
 *
 * nav: [{ section?: string, items: [{ to, label, icon, end? }] }]
 */
export default function PanelLayout({
  nav,
  brandSuffix,
  footerLink,
  bottomNav = false,
  practice = false,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const flatItems = nav.flatMap((g) => g.items);

  return (
    <div className="flex h-full">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-200 lg:static ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link to="." className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.svg" alt="" className="size-8 shrink-0" />
            {!collapsed && (
              <span className="truncate text-lg font-bold tracking-tight">
                Invest<span className="text-accent">Ledger</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden size-7 place-items-center rounded-md bg-surface-2 text-muted hover:text-text lg:grid"
          >
            {collapsed ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {nav.map((group, i) => (
            <div key={group.section ?? i}>
              {group.section && !collapsed && (
                <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-muted/70 uppercase">
                  {group.section}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      title={collapsed ? label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/15 text-text ring-1 ring-primary/40'
                            : 'text-muted hover:bg-surface-2 hover:text-text'
                        } ${collapsed ? 'lg:justify-center' : ''}`
                      }
                    >
                      <Icon className="size-5 shrink-0" />
                      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {footerLink && !collapsed && (
          <div className="border-t border-border p-4">
            <Link
              to={footerLink.to}
              className="flex items-center justify-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-muted hover:text-text"
            >
              {footerLink.icon && <footerLink.icon className="size-4" />}
              {footerLink.label}
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-lg bg-surface-2 text-muted lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            {brandSuffix && <span className="text-sm font-semibold text-muted">{brandSuffix}</span>}
            {practice && <Badge tone="primary">Practice mode — virtual funds only</Badge>}
          </div>
          <AvatarMenu />
        </header>

        <main className={`flex-1 overflow-y-auto px-4 py-6 sm:px-8 ${bottomNav ? 'pb-24' : ''}`}>
          <Outlet />
          <footer className="mt-12 text-xs text-muted">
            © {new Date().getFullYear()} InvestLedger · Practice platform
          </footer>
        </main>

        {bottomNav && (
          <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-border bg-sidebar/95 py-2 backdrop-blur lg:hidden">
            {flatItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? 'text-accent' : 'text-muted'}`
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function AvatarMenu() {
  const { profile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-accent to-primary-strong text-white"
      >
        <UserRound className="size-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-surface p-2 shadow-2xl">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold">{profile?.name}</p>
            <p className="truncate text-xs text-muted">{profile?.email}</p>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
