import { create } from 'zustand';
import { User, UserRole, RiskMetrics, SecurityLevel } from '@/lib/types';
import { documents, users, sampleLeakageEvents } from '@/lib/mock-data';
import { calculateRoleLeakageRisk } from '@/lib/permissions';

interface AppState {
  // Current user state
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setCurrentRole: (role: UserRole) => void;

  // Documents
  documents: typeof documents;

  // UI mode
  activeMode: 'comparison' | 'secure_only';
  setActiveMode: (mode: 'comparison' | 'secure_only') => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Computed metrics
  getRiskMetrics: () => RiskMetrics;
}

export const useAppStore = create<AppState>((set) => ({
  // Default user: Marcus Rodriguez (Sales Rep) — shows the most interesting leakage
  currentUser: users.sales_rep,

  setCurrentUser: (user) => set({ currentUser: user }),

  setCurrentRole: (role) => set({ currentUser: users[role] }),

  documents,

  activeMode: 'comparison',
  setActiveMode: (mode) => set({ activeMode: mode }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  getRiskMetrics: () => {
    const roles: UserRole[] = ['ceo', 'sales_rep', 'support_analyst', 'external_partner'];
    const byRole = {} as Record<UserRole, number>;

    for (const role of roles) {
      byRole[role] = calculateRoleLeakageRisk(role);
    }

    const bySecurityLevel: Record<SecurityLevel, number> = {
      public: 0,
      internal: 15,
      confidential: 55,
      top_secret: 92,
    };

    const topRiskyDocuments = documents
      .filter((d) => d.securityLevel === 'top_secret' || d.securityLevel === 'confidential')
      .map((d) => ({
        documentId: d.id,
        title: d.title,
        riskScore: d.securityLevel === 'top_secret' ? 90 + d.sensitiveFields.length : 60 + d.sensitiveFields.length,
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    return {
      overallScore: 72,
      byRole,
      bySecurityLevel,
      totalQueries: 1247,
      blockedQueries: 342,
      leakageEvents: sampleLeakageEvents.length,
      topRiskyDocuments,
    };
  },
}));
