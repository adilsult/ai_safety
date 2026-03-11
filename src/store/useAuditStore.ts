import { create } from 'zustand';
import { AuditEntry } from '@/lib/types';

// ==========================================
// LocalStorage helpers
// ==========================================

const STORAGE_KEY = 'securerag-audit-log';

function loadFromStorage(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Restore Date objects
    return parsed.map((e: AuditEntry) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveToStorage(entries: AuditEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

// ==========================================
// Zustand store
// ==========================================

interface AuditState {
  entries: AuditEntry[];
  initialized: boolean;

  // Actions
  initFromStorage: () => void;
  addEntry: (entry: AuditEntry) => void;
  clearEntries: () => void;

  // Queries
  getEntriesByUser: (userId: string) => AuditEntry[];
  getRiskStats: () => {
    avgRisk: number;
    totalLeaks: number;
    blockedCount: number;
    totalEntries: number;
  };
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  initialized: false,

  initFromStorage: () => {
    if (get().initialized) return;
    const loaded = loadFromStorage();
    set({ entries: loaded, initialized: true });
  },

  addEntry: (entry) => {
    const updated = [entry, ...get().entries].slice(0, 500); // cap at 500 entries
    set({ entries: updated });
    saveToStorage(updated);
  },

  clearEntries: () => {
    set({ entries: [] });
    saveToStorage([]);
  },

  getEntriesByUser: (userId) => {
    return get().entries.filter((e) => e.userId === userId);
  },

  getRiskStats: () => {
    const entries = get().entries;
    const total = entries.length;

    if (total === 0) {
      return { avgRisk: 0, totalLeaks: 0, blockedCount: 0, totalEntries: 0 };
    }

    const avgRisk = Math.round(
      entries.reduce((sum, e) => sum + e.riskScore, 0) / total
    );
    const totalLeaks = entries.filter(
      (e) => e.status === 'leakage_detected' || e.status === 'partial_block'
    ).length;
    const blockedCount = entries.filter((e) => e.status === 'blocked').length;

    return { avgRisk, totalLeaks, blockedCount, totalEntries: total };
  },
}));
