// ============================================================================
// game.js
// 画面遷移と全体制御。ホーム/ステージ選択/戦闘/結果/設定/記録/ヘルプ の切替。
// HTML の onclick から呼ばれるため、main.js で window.Game に公開される。
// ============================================================================

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { Dictionaries } from './dictionaries.js';
import { State } from './state.js';
import { Battle } from './battle.js';
import { Typing } from './typing.js';
import { GhostKeyboard } from './ghost-keyboard.js';
import { Records } from './records.js';

export const Game = {
  async init() {
    State.load();
    await Dictionaries.loadManifest();
    State.sanitizeTierAssignments();
    await Dictionaries.preloadForAssignments(State.tierAssignments);
    Battle.init();
    GhostKeyboard.render();
    this.updateHeader();
    this.updateHomeScreen();
    this.updateTierDictLabels();

    window.addEventListener('keydown', (e) => Typing.onKey(e));
    window.addEventListener('keyup', (e) => Typing.onKeyUp(e));

    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    this.showScreen('home');
  },

  updateHeader() {
    document.getElementById('stat-maturity').textContent = Math.floor(State.maturityScore).toLocaleString();
    document.getElementById('stat-baselevel').textContent = State.getBaseLevel().lv;
    document.getElementById('stat-accuracy').textContent =
      State.totalChars > 0 ? (State.accuracy * 100).toFixed(1) + '%' : '-';
  },

  updateHomeScreen() {
    document.getElementById('home-base-preview').textContent = State.getBaseLevel().emoji;
  },

  updateTierDictLabels() {
    for (const t of [1, 2, 3]) {
      const el = document.getElementById(`stage-select-dict-${t}`);
      if (el) el.textContent = Dictionaries.getDictName(State.tierAssignments[t]);
    }
  },

  showScreen(name) {
    State.currentScreen = name;
    document.getElementById('app').classList.toggle('battle-mode', name === 'battle');
    document.getElementById('home-screen').classList.toggle('hidden', name !== 'home');
    document.getElementById('stage-select').classList.toggle('hidden', name !== 'stageSelect');
    document.getElementById('result-screen').classList.toggle('hidden', name !== 'result');
    document.getElementById('settings-screen').classList.toggle('hidden', name !== 'settings');
    document.getElementById('help-screen').classList.toggle('hidden', name !== 'help');
    document.getElementById('records-screen').classList.toggle('hidden', name !== 'records');
    const inBattle = name === 'battle';
    document.getElementById('battlefield').style.visibility = inBattle ? 'visible' : 'hidden';
    document.getElementById('ghost-keyboard').style.visibility = inBattle ? 'visible' : 'hidden';
    document.getElementById('ghost-keyboard').style.display = inBattle ? 'flex' : 'none';
    document.getElementById('casting').style.visibility = inBattle ? 'visible' : 'hidden';
  },

  backToHome() {
    Battle.stop();
    this.showScreen('home');
    this.updateHeader();
    this.updateHomeScreen();
  },

  openStageSelect() {
    this.showScreen('stageSelect');
    this.updateTierDictLabels();
    const list = document.getElementById('stage-list');
    list.innerHTML = '';
    for (const st of CONFIG.stages) {
      const locked = State.maturityScore < st.unlock;
      const difficulty = this.getStageDifficulty(st);
      const stars = '★'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
      const card = document.createElement('div');
      card.className = 'stage-card' + (locked ? ' locked' : '');
      card.style.opacity = locked ? 0.4 : 1;
      card.style.cursor = locked ? 'not-allowed' : 'pointer';
      card.innerHTML = `
        <h3>
          <span class="stage-id">STAGE ${st.id}</span>
          <span class="stage-name">${st.name}</span>
        </h3>
        <div class="difficulty" aria-label="難易度 ${difficulty}">
          <span class="label">難易度</span>
          <span class="stars">${stars}</span>
        </div>
        <div class="meta">
          <div><span>敵HP</span><strong>${st.enemyHp.toLocaleString()}</strong></div>
          <div><span>湧き間隔</span><strong>${(st.spawnInterval/1000).toFixed(1)}s</strong></div>
          <div><span>Wave数</span><strong>${st.waveCount}</strong></div>
          ${locked
            ? `<div class="lock-note">🔒 成熟度 ${st.unlock.toLocaleString()} で解放</div>`
            : `<div class="lock-note clear">挑戦可能</div>`
          }
        </div>
      `;
      if (!locked) card.onclick = () => this.startStage(st);
      list.appendChild(card);
    }
  },

  getStageDifficulty(stage) {
    let score = 0;
    score += stage.id * 0.5;
    score += Math.min(2, stage.waveCount / 12);
    score += Math.min(2, stage.enemyHp / 3500);
    score += stage.spawnInterval < 1300 ? 1.2 : stage.spawnInterval < 1800 ? 0.6 : 0;
    if (score >= 4.2) return 3;
    if (score >= 2.4) return 2;
    return 1;
  },

  async startStage(stage) {
    await Dictionaries.preloadForAssignments(State.tierAssignments);
    State.currentStage = stage;
    State.sessionStats = {
      startTime: performance.now(),
      correctChars: 0,
      totalChars: 0,
      misses: 0,
    };
    this.showScreen('battle');
    // DOM のレイアウト反映を待ってから Canvas resize + 戦闘開始
    requestAnimationFrame(() => {
      Battle.start(stage);
      Typing.newWord();
    });
  },

  endBattle(victory, escaped = false) {
    Battle.stop();
    GhostKeyboard.clear();
    const s = State.sessionStats;
    const accuracy = s.totalChars > 0 ? s.correctChars / s.totalChars : 0;
    const elapsedMs = performance.now() - s.startTime;
    const elapsed = elapsedMs / 1000 / 60;
    const kpm = elapsed > 0 ? Math.round(s.correctChars / elapsed) : 0;

    let gained = 0;
    if (victory && !escaped) {
      gained = Math.floor(s.correctChars * accuracy * (1 + State.currentStage.id * 0.2));
      State.maturityScore += gained;
      if (!State.clearedStages.includes(State.currentStage.id)) {
        State.clearedStages.push(State.currentStage.id);
      }
    }
    State.accuracy = State.totalChars > 0 ? State.totalCorrectChars / State.totalChars : 1.0;

    // === 記録追加 ===
    State.totalPlayMs += elapsedMs;
    if (kpm > State.maxKpm) State.maxKpm = kpm;

    const today = new Date().toISOString().slice(0, 10);
    if (!State.firstPlayDate) State.firstPlayDate = today;
    if (!State.playDates.includes(today)) {
      State.playDates.push(today);
      State.playDates.sort();
    }

    const result = escaped ? 'retreat' : (victory ? 'win' : 'lose');
    const historyEntry = {
      date: new Date().toISOString(),
      stageId: State.currentStage.id,
      stageName: State.currentStage.name,
      result,
      kpm,
      accuracy,
      score: gained,
      units: Battle.unitsSummoned,
      kills: Battle.enemiesKilled,
    };
    State.history.unshift(historyEntry);
    if (State.history.length > 50) State.history.length = 50;

    if (victory && !escaped) {
      const sid = State.currentStage.id;
      const prev = State.stageBests[sid];
      if (!prev || gained > prev.score) {
        State.stageBests[sid] = { score: gained, kpm, accuracy, date: historyEntry.date };
      }
    }

    State.save();

    document.getElementById('result-title').textContent = escaped ? 'RETREAT' : (victory ? 'STAGE CLEAR' : 'GAME OVER');
    document.getElementById('r-score').textContent = gained.toLocaleString();
    document.getElementById('r-accuracy').textContent = (accuracy * 100).toFixed(1) + '%';
    document.getElementById('r-kpm').textContent = kpm;
    document.getElementById('r-units').textContent = Battle.unitsSummoned;
    document.getElementById('r-kills').textContent = Battle.enemiesKilled;
    document.getElementById('r-maturity').textContent = gained.toLocaleString();
    this.showScreen('result');
    this.updateHeader();
    this.updateHomeScreen();
  },

  setTier(t) {
    State.currentTier = t;
    document.querySelectorAll('.tier-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.tier) === t);
    });
    if (State.currentScreen === 'battle') Typing.newWord();
  },

  async setTierDict(tier, dictId) {
    State.tierAssignments[tier] = dictId;
    await Dictionaries.loadDict(dictId);
    State.save();
    this.updateTierDictLabels();
  },

  openSettings() {
    this.showScreen('settings');
    this.renderSettings();
  },

  renderSettings() {
    this.renderTierSelectors();
  },

  renderTierSelectors() {
    const dicts = [...(Dictionaries.manifest?.dictionaries || [])];
    for (const t of [1, 2, 3]) {
      const sel = document.getElementById(`dict-select-${t}`);
      sel.innerHTML = '';
      for (const d of dicts) {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        if (State.tierAssignments[t] === d.id) opt.selected = true;
        sel.appendChild(opt);
      }
    }
  },

  openHelp() { this.showScreen('help'); },

  openRecords() {
    this.showScreen('records');
    requestAnimationFrame(() => Records.render());
  },

  // ---- セーブ ----
  exportSave() {
    const data = {
      version: CONFIG.version,
      maturityScore: State.maturityScore,
      totalCorrectChars: State.totalCorrectChars,
      totalChars: State.totalChars,
      clearedStages: State.clearedStages,
      tierAssignments: State.tierAssignments,
      keyStats: State.keyStats,
      stageBests: State.stageBests,
      history: State.history,
      playDates: State.playDates,
      maxKpm: State.maxKpm,
      totalPlayMs: State.totalPlayMs,
      firstPlayDate: State.firstPlayDate,
    };
    this.download('typerion-save.json', JSON.stringify(data, null, 2));
    this.toast('セーブデータをエクスポート');
  },

  uploadSave(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = async (e) => {
      try {
        const d = JSON.parse(e.target.result);
        State.maturityScore = d.maturityScore || 0;
        State.totalCorrectChars = d.totalCorrectChars || 0;
        State.totalChars = d.totalChars || 0;
        State.clearedStages = d.clearedStages || [];
        if (d.tierAssignments) State.tierAssignments = d.tierAssignments;
        State.keyStats = d.keyStats || {};
        State.stageBests = d.stageBests || {};
        State.history = d.history || [];
        State.playDates = d.playDates || [];
        State.maxKpm = d.maxKpm || 0;
        State.totalPlayMs = d.totalPlayMs || 0;
        State.firstPlayDate = d.firstPlayDate || null;
        State.save();
        State.sanitizeTierAssignments();
        await Dictionaries.preloadForAssignments(State.tierAssignments);
        this.updateHeader();
        this.updateHomeScreen();
        this.updateTierDictLabels();
        this.renderSettings();
        this.toast('セーブデータを読み込みました');
      } catch (err) {
        this.toast('読み込み失敗: ' + err.message, true);
      }
    };
    r.readAsText(file);
    ev.target.value = '';
  },

  _resetConfirmKind: null,

  openResetConfirm(kind) {
    this._resetConfirmKind = kind;
    const dlg = document.getElementById('reset-confirm-dialog');
    const title = document.getElementById('reset-confirm-title');
    const msg = document.getElementById('reset-confirm-message');
    const okBtn = document.getElementById('reset-confirm-ok');
    if (kind === 'records') {
      title.textContent = '記録をリセット';
      msg.textContent =
        'キー統計・プレイ履歴・ベストスコアなどの記録を消去します。成熟度と設定は保持されます。この操作は取り消せません。';
      okBtn.textContent = '記録をリセット';
    } else {
      title.textContent = '全データをリセット';
      msg.textContent =
        '成熟度・辞書の割当・記録など、このアプリに保存したすべてのデータが消去されます。取り消しはできません。';
      okBtn.textContent = 'すべて削除';
    }
    dlg.classList.remove('hidden');
    dlg.setAttribute('aria-hidden', 'false');
  },

  closeResetConfirm() {
    const dlg = document.getElementById('reset-confirm-dialog');
    dlg.classList.add('hidden');
    dlg.setAttribute('aria-hidden', 'true');
    this._resetConfirmKind = null;
  },

  confirmResetExecute() {
    const kind = this._resetConfirmKind;
    if (!kind) return;
    this.closeResetConfirm();
    if (kind === 'records') {
      State.keyStats = {};
      State.stageBests = {};
      State.history = [];
      State.playDates = [];
      State.maxKpm = 0;
      State.totalPlayMs = 0;
      State.firstPlayDate = null;
      State.save();
      this.toast('記録をリセット');
      return;
    }
    if (kind === 'hard') {
      Storage.clear();
      State.load();
      this.updateHeader();
      this.updateHomeScreen();
      this.updateTierDictLabels();
      this.renderSettings();
      this.toast('リセット完了');
      this.backToHome();
    }
  },

  download(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  toast(msg, error = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.borderColor = error ? 'var(--ng)' : 'var(--accent)';
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
  },
};
