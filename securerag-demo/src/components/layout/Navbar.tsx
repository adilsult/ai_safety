'use client';

import { usePathname } from 'next/navigation';
import { RoleSwitcher } from './RoleSwitcher';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

const pageTitles: Record<string, string> = {
  '/overview': 'Risk Overview',
  '/playground': 'RAG Playground',
  '/redteam': 'Red Team Simulator',
  '/audit': 'Audit Log',
  '/docs': 'How It Works',
};

export function Navbar() {
  const { toggleSidebar } = useAppStore();
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md lg:pl-[17rem]">
      {/* Left — mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5 text-slate-400" />
        </Button>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="hidden text-slate-500 sm:inline">Dashboard</span>
          <ChevronRight className="hidden h-3.5 w-3.5 text-slate-600 sm:inline" />
          <span className="font-medium text-slate-200">{pageTitle}</span>
        </div>
      </div>

      {/* Right — bell + live badge + role switcher */}
      <div className="flex items-center gap-3">
        {/* Live Demo badge */}
        <Badge
          variant="outline"
          className="hidden items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 md:inline-flex"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Demo
        </Badge>

        {/* Notifications bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-slate-400 hover:text-slate-200"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            3
          </span>
        </Button>

        {/* Separator */}
        <div className="hidden h-6 w-px bg-slate-800 sm:block" />

        {/* Role Switcher */}
        <RoleSwitcher />
      </div>
    </header>
  );
}
