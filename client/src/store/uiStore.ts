import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    theme: 'light',
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));