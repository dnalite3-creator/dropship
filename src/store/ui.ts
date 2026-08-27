import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  cartOpen: boolean;
  searchOpen: boolean;
  theme: Theme;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      cartOpen: false,
      searchOpen: false,
      theme: 'dark',
      setCartOpen: (v) => set({ cartOpen: v }),
      setSearchOpen: (v) => set({ searchOpen: v }),
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'voltra-ui' }
  )
);
