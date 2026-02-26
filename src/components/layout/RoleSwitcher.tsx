'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { UserRole } from '@/lib/types';
import { roleLabels, users } from '@/lib/mock-data';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const accessBadges: Record<UserRole, { label: string; color: string }> = {
  ceo: { label: 'Full Access', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  sales_rep: { label: 'Sales + Internal', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  support_analyst: { label: 'Support + Public', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  external_partner: { label: 'Public Only', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

const avatarColors: Record<UserRole, string> = {
  ceo: 'bg-violet-600',
  sales_rep: 'bg-blue-600',
  support_analyst: 'bg-emerald-600',
  external_partner: 'bg-slate-600',
};

export function RoleSwitcher() {
  const { currentUser, setCurrentRole } = useAppStore();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (role: UserRole) => {
      if (role === currentUser.role) {
        setOpen(false);
        return;
      }
      setCurrentRole(role);
      setOpen(false);

      const user = users[role];
      toast.success('Permission scope updated', {
        description: `Switched to ${user.name} (${roleLabels[role]}).`,
      });
    },
    [currentUser.role, setCurrentRole]
  );

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 transition-all hover:border-slate-600 hover:bg-slate-800/70"
      >
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white',
            avatarColors[currentUser.role]
          )}
        >
          {currentUser.avatar}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-medium text-slate-200">
            {currentUser.name}
          </p>
          <p className="text-[10px] text-slate-500">{roleLabels[currentUser.role]}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-700/50 bg-slate-900 p-1.5 shadow-2xl shadow-black/40"
            >
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Switch Role
              </p>
              {(Object.keys(users) as UserRole[]).map((role) => {
                const user = users[role];
                const badge = accessBadges[role];
                const isSelected = role === currentUser.role;

                return (
                  <button
                    key={role}
                    onClick={() => handleSelect(role)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      isSelected
                        ? 'bg-violet-600/10'
                        : 'hover:bg-slate-800/70'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                        avatarColors[role]
                      )}
                    >
                      {user.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">
                          {user.name}
                        </p>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-violet-400" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {roleLabels[role]} &middot; {user.department}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        badge.color
                      )}
                    >
                      {badge.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
