'use client';
/**
 * The page frame of both apps: a dark sidebar with navigation on the left, a header on top,
 * and the page content. On small screens the sidebar becomes a slide-in menu.
 *
 * The apps decide WHAT is in the sidebar (the web app shows only what the user's permissions
 * allow, see apps/web/app/(app)/layout.tsx); this component only decides how it looks.
 *
 *   <AppShell
 *     brand={{ name: 'EduPlatform', subtitle: 'Sri Vidya Junior College' }}
 *     sections={[{ title: 'Academics', items: [{ href: '/students', label: 'Students', icon: <Users /> }] }]}
 *     headerEnd={<UserMenu />}
 *   >
 *     {children}
 *   </AppShell>
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export interface NavSection {
  /** Optional heading above a group of links, e.g. "Academics". */
  title?: string;
  items: NavItem[];
}

export interface AppShellProps {
  brand: { name: string; subtitle?: string };
  sections: NavSection[];
  /** Right side of the header, typically the user menu. */
  headerEnd?: ReactNode;
  children: ReactNode;
}

export function AppShell({ brand, sections, headerEnd, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <nav aria-label="Main" className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div className="px-3">
        <div className="text-base font-semibold text-white">{brand.name}</div>
        {brand.subtitle && (
          <div className="mt-0.5 text-xs text-sidebar-muted">{brand.subtitle}</div>
        )}
      </div>
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && (
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {section.title}
            </div>
          )}
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
                isActive(item.href)
                  ? 'bg-sidebar-accent font-medium text-white'
                  : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-white',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-sidebar text-sidebar-foreground md:block">
        {sidebar}
      </aside>

      {/* Mobile: slide-in sidebar with a dark overlay behind it */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="-ml-1 rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <div className="text-sm font-medium md:hidden">{brand.name}</div>
          <div className="ml-auto flex items-center gap-2">{headerEnd}</div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}

/** Three-line "hamburger" icon, drawn inline so this component has no icon dependency. */
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
