// ============================================================================
// storage.js
// LocalStorage のラッパー。prefix 付きで名前空間を切る。
// ============================================================================

import { CONFIG } from './config.js';

export const Storage = {
  k: (key) => CONFIG.storagePrefix + key,
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.k(key));
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(this.k(key), JSON.stringify(value)); }
    catch(e) { console.error('Storage set failed', e); }
  },
  remove(key) { localStorage.removeItem(this.k(key)); },
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix));
    keys.forEach(k => localStorage.removeItem(k));
  },
};
