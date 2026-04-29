// ============================================================================
// state.js
// ゲーム全体の状態。永続化データ(LocalStorage)とセッションデータを持つ。
// ============================================================================

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { Dictionaries } from './dictionaries.js';

export const State = {
  // 永続化データ
  maturityScore: 0,
  totalCorrectChars: 0,
  totalChars: 0,
  accuracy: 1.0,
  clearedStages: [],
  tierAssignments: { 1: 'home-row', 2: 'en-common', 3: 'coding' },

  // 記録機能
  keyStats: {},         // { key: {correct, wrong} }
  stageBests: {},       // { stageId: {score, kpm, accuracy, date} }
  history: [],          // [{date, stageId, stageName, result, kpm, accuracy, score, units, kills}]
  playDates: [],        // ['2026-04-23', ...] 重複排除済み
  maxKpm: 0,
  totalPlayMs: 0,
  firstPlayDate: null,

  // セッションデータ(永続化しない)
  currentScreen: 'home',
  currentStage: null,
  currentTier: 1,
  currentWord: '',
  typedIndex: 0,
  missCount: 0,
  hpRatio: 1.0,
  sessionStats: null,
  _tabHeld: false,

  load() {
    this.maturityScore = Storage.get('maturityScore', 0);
    this.totalCorrectChars = Storage.get('totalCorrectChars', 0);
    this.totalChars = Storage.get('totalChars', 0);
    this.accuracy = this.totalChars > 0 ? this.totalCorrectChars / this.totalChars : 1.0;
    this.clearedStages = Storage.get('clearedStages', []);
    const saved = Storage.get('tierAssignments', null);
    if (saved) this.tierAssignments = saved;
    Storage.remove('customDicts');
    Storage.remove('currentPreset');
    // 記録
    this.keyStats = Storage.get('keyStats', {});
    this.stageBests = Storage.get('stageBests', {});
    this.history = Storage.get('history', []);
    this.playDates = Storage.get('playDates', []);
    this.maxKpm = Storage.get('maxKpm', 0);
    this.totalPlayMs = Storage.get('totalPlayMs', 0);
    this.firstPlayDate = Storage.get('firstPlayDate', null);
  },

  save() {
    Storage.set('maturityScore', this.maturityScore);
    Storage.set('totalCorrectChars', this.totalCorrectChars);
    Storage.set('totalChars', this.totalChars);
    Storage.set('clearedStages', this.clearedStages);
    Storage.set('tierAssignments', this.tierAssignments);
    // 記録
    Storage.set('keyStats', this.keyStats);
    Storage.set('stageBests', this.stageBests);
    Storage.set('history', this.history);
    Storage.set('playDates', this.playDates);
    Storage.set('maxKpm', this.maxKpm);
    Storage.set('totalPlayMs', this.totalPlayMs);
    Storage.set('firstPlayDate', this.firstPlayDate);
  },

  /** manifest 上に存在しない辞書 ID（旧カスタム辞書等）を既定へ置き換え */
  sanitizeTierAssignments() {
    const dicts = Dictionaries.manifest?.dictionaries;
    if (!dicts?.length) return;
    const valid = new Set(dicts.map(d => d.id));
    const defaults = { 1: 'home-row', 2: 'en-common', 3: 'coding' };
    let dirty = false;
    for (const t of [1, 2, 3]) {
      const id = this.tierAssignments[t];
      if (valid.has(id)) continue;
      const next = valid.has(defaults[t]) ? defaults[t] : dicts[0].id;
      this.tierAssignments[t] = next;
      dirty = true;
    }
    if (dirty) this.save();
  },

  getBaseLevel() {
    let lv = CONFIG.baseLevels[0];
    for (const b of CONFIG.baseLevels) {
      if (this.maturityScore >= b.needMaturity) lv = b;
    }
    return lv;
  },
};
