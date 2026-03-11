'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard,
  FlaskConical,
  Crosshair,
  ScrollText,
  BookOpen,
  Shield,
  X,
  Github,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { redTeamAttacks } from '@/lib/mock-data';

const navItems = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'RAG Playground', href: '/playground', icon: FlaskConical },
  { label: 'Red Team Simulator', href: '/redteam', icon: Crosshair },
  { label: 'Audit Log', href: '/audit', icon: ScrollText },
  { label: 'How It Works', href: '/docs', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-600/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-sm font-bold text-transparent">
                SecureRAG
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] font-semibold text-amber-400"
              >
                DEMO
              </Badge>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 lg:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Dashboard
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024)
                    toggleSidebar();
                }}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                {item.label}
                {item.href === '/redteam' && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto px-1.5 py-0 text-[9px]',
                      isActive
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    )}
                  >
                    {redTeamAttacks.length}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-800 p-3">
          <div className="space-y-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Separator className="bg-slate-800" />
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-medium text-white shadow-lg shadow-violet-600/20 hover:from-violet-700 hover:to-purple-700"
              size="sm"
            >
              <CalendarCheck className="mr-2 h-3.5 w-3.5" />
              Book a Demo
            </Button>
          </div>
          <div className="mt-3 rounded-lg bg-slate-900/50 p-2.5 text-center">
            <p className="text-[10px] font-medium text-slate-500">
              Human Delta AI &middot; v0.1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
