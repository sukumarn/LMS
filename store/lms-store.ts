"use client";

import { create } from "zustand";

type LMSState = {
  sidebarCollapsed: boolean;
  offerOpen: boolean;
  activeLessonId: string;
  notes: string[];
  userRole: string | null;
  toggleSidebar: () => void;
  setOfferOpen: (open: boolean) => void;
  setActiveLessonId: (id: string) => void;
  addNote: (note: string) => void;
  setUserRole: (role: string | null) => void;
};

export const useLMSStore = create<LMSState>((set) => ({
  sidebarCollapsed: false,
  offerOpen: true,
  activeLessonId: "",
  notes: [],
  userRole: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setOfferOpen: (offerOpen) => set({ offerOpen }),
  setActiveLessonId: (activeLessonId) => set({ activeLessonId }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  setUserRole: (userRole) => set({ userRole }),
}));
