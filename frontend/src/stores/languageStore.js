import { create } from 'zustand'

export const useLanguageStore = create((set) => ({
  language: localStorage.getItem('language') || 'ru',

  setLanguage: (lang) => {
    localStorage.setItem('language', lang)
    set({ language: lang })
  },
}))
