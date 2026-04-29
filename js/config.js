// ============================================================================
// config.js
// ゲームの設定値(バランス調整値) + 緊急フォールバック辞書
// ============================================================================

export const CONFIG = {
  version: '1.4.2',
  storagePrefix: 'typerion_v1_',

  tiers: {
    1: { hp: 40,  atk: 8,  speed: 1.8, color: '#7fc8a9', emoji: '🌱' },
    2: { hp: 120, atk: 20, speed: 1.2, color: '#e8ab47', emoji: '🌿' },
    3: { hp: 400, atk: 60, speed: 0.8, color: '#c4715e', emoji: '🌲' },
  },

  enemy: { hp: 50, atk: 6, speed: 0.9, emoji: '🐛' },

  missHpReduction: 0.05,
  minHpRatio: 0.3,

  baseLevels: [
    { lv: 1, name: 'Seed',         hp: 1000,  emoji: '🌱', needMaturity: 0 },
    { lv: 2, name: 'Sapling',      hp: 3000,  emoji: '🌿', needMaturity: 5000 },
    { lv: 3, name: 'Ancient Tree', hp: 10000, emoji: '🌳', needMaturity: 20000, autoAttack: true },
  ],

  stages: [
    { id: 1, name: 'Forest Edge',    spawnInterval: 4000, enemyHp: 1000,  waveCount: 10, unlock: 0 },
    { id: 2, name: 'Shaded Grove',   spawnInterval: 3200, enemyHp: 2000,  waveCount: 15, unlock: 2000 },
    { id: 3, name: 'Deep Woods',     spawnInterval: 2500, enemyHp: 4000,  waveCount: 20, unlock: 8000 },
    { id: 4, name: 'Cursed Hollow',  spawnInterval: 1800, enemyHp: 8000,  waveCount: 25, unlock: 20000 },
    { id: 5, name: 'Ancient Ruins',  spawnInterval: 1200, enemyHp: 15000, waveCount: 30, unlock: 50000 },
  ],
};

/** 緊急フォールバック辞書(manifest 読み込み失敗時に使う) */
export const FALLBACK_DICT = {
  id: 'fallback',
  name: 'フォールバック',
  tier1: ['fff', 'jjj', 'asdf', 'jkl;', 'dash', 'lass'],
  tier2: ['keyboard', 'practice', 'network', 'system'],
  tier3: ['The quick brown fox jumps over the lazy dog.'],
};
