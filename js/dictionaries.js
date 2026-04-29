// ============================================================================
// dictionaries.js
// 辞書の読み込み・管理。外部 JSON(manifest + dictionaries/) に対応。
// ============================================================================

import { FALLBACK_DICT } from './config.js';

export const Dictionaries = {
  manifest: null,       // manifest.json の内容
  loaded: {},           // id -> 辞書データ(tier1/tier2/tier3 を含む)

  async loadManifest() {
    try {
      const r = await fetch('./dictionaries/manifest.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error('manifest fetch failed');
      this.manifest = await r.json();
    } catch (e) {
      console.warn('manifest load failed, using fallback', e);
      this.manifest = {
        version: '0.0.0',
        dictionaries: [{ id: 'fallback', file: null, name: 'フォールバック', recommended_tier: [1,2,3] }],
      };
      this.loaded['fallback'] = FALLBACK_DICT;
    }
  },

  async loadDict(id) {
    if (this.loaded[id]) return this.loaded[id];
    const meta = this.manifest.dictionaries.find(d => d.id === id);
    if (!meta || !meta.file) return FALLBACK_DICT;
    try {
      const r = await fetch(`./dictionaries/${meta.file}`, { cache: 'no-cache' });
      if (!r.ok) throw new Error('dict fetch failed');
      const data = await r.json();
      this.loaded[id] = data;
      return data;
    } catch (e) {
      console.warn(`dict load failed: ${id}`, e);
      return FALLBACK_DICT;
    }
  },

  /** 複数辞書をまとめて先読み(tierAssignments の値から) */
  async preloadForAssignments(assignments) {
    const ids = [...new Set(Object.values(assignments))];
    await Promise.all(ids.map(id => this.loadDict(id)));
  },

  getWordFromDict(dictId, tier) {
    const dict = this.loaded[dictId] || FALLBACK_DICT;
    const list = dict['tier' + tier];
    if (!list || list.length === 0) {
      // 該当Tierが空なら、他のTierからフォールバック
      for (const t of [tier, 1, 2, 3]) {
        const l = dict['tier' + t];
        if (l && l.length > 0) return l[Math.floor(Math.random() * l.length)];
      }
      return FALLBACK_DICT.tier1[0];
    }
    return list[Math.floor(Math.random() * list.length)];
  },

  getDictName(id) {
    const meta = this.manifest?.dictionaries?.find(d => d.id === id);
    return meta ? meta.name : id;
  },
};
