
'use client';

import { create } from 'zustand';

type TopLoaderState = {
  isLoading: boolean;
  start: () => void;
  finish: () => void;
};

export const useTopLoaderStore = create<TopLoaderState>((set) => ({
  isLoading: false,
  start: () => set({ isLoading: true }),
  finish: () => set({ isLoading: false }),
}));
