// ============================================================================
// records.js
// 個人記録ページの描画。
// サマリー / ヒートマップ / 苦手キー / 指別統計 / スコア推移 / ステージベスト / 履歴
// ============================================================================

import { State } from './state.js';

export const Records = {
  // キーボード配列 (US QWERTY) - ヒートマップ描画用
  keyboardLayout: [
    { row: 1, keys: ['`','1','2','3','4','5','6','7','8','9','0','-','='] },
    { row: 2, keys: ['q','w','e','r','t','y','u','i','o','p','[',']','\\'] },
    { row: 3, keys: ['a','s','d','f','g','h','j','k','l',';',"'"] },
    { row: 4, keys: ['z','x','c','v','b','n','m',',','.','/'] },
  ],
  // 指の担当キー(タッチタイピング標準)
  fingerMap: {
    '左小指': ['`','1','q','a','z','tab','shift'],
    '左薬指': ['2','w','s','x'],
    '左中指': ['3','e','d','c'],
    '左人差指': ['4','5','r','t','f','g','v','b'],
    '右人差指': ['6','7','y','u','h','j','n','m'],
    '右中指': ['8','i','k',','],
    '右薬指': ['9','o','l','.'],
    '右小指': ['0','-','=','p','[',']','\\',';',"'",'/','enter','shift'],
    '親指': [' '],
  },

  render() {
    this.renderSummary();
    this.renderHeatmap();
    this.renderWeakKeys();
    this.renderFingers();
    this.renderHistoryTable();
  },

  renderSummary() {
    const grid = document.getElementById('stats-grid');
    const startDate = document.getElementById('records-start-date');

    const totalChars = State.totalChars;
    const accuracy = State.totalChars > 0
      ? (State.totalCorrectChars / State.totalChars * 100).toFixed(2) + '%'
      : '-';
    const avgKpm = this.calcAverageKpm();
    const totalDays = State.playDates.length;
    const totalPlays = State.history.length;

    startDate.textContent = `プレイ開始: ${State.firstPlayDate || '-'}`;

    const stats = [
      { label: '総打鍵数', value: totalChars.toLocaleString() },
      { label: '正確率', value: accuracy },
      { label: '平均 KPM', value: avgKpm },
      { label: '総プレイ回数', value: totalPlays.toLocaleString() },
      { label: 'プレイ日数', value: totalDays + '日' },
    ];

    grid.innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="label">${s.label}</div>
        <div class="value">${s.value}</div>
      </div>
    `).join('');
  },

  calcAverageKpm() {
    const recent = State.history.slice(0, 10);
    if (recent.length === 0) return '-';
    const sum = recent.reduce((a, h) => a + (h.kpm || 0), 0);
    return Math.round(sum / recent.length);
  },

  renderHeatmap() {
    const container = document.getElementById('keyboard-heatmap');
    const rows = this.keyboardLayout.map(r => {
      const cells = r.keys.map(k => this.makeKeyCell(k)).join('');
      return `<div class="kb-row row-${r.row}">${cells}</div>`;
    }).join('');
    // スペースキー行
    const spaceStats = State.keyStats[' '] || { correct: 0, wrong: 0 };
    const spaceClass = this.getHeatmapClass(spaceStats);
    const spaceRow = `<div class="kb-row row-4" style="padding-left:0;"><div class="kb-key space ${spaceClass}">space</div></div>`;
    container.innerHTML = `<div class="keyboard-map">${rows}${spaceRow}</div>`;
  },

  makeKeyCell(k) {
    const stats = State.keyStats[k] || { correct: 0, wrong: 0 };
    const cls = this.getHeatmapClass(stats);
    return `<div class="kb-key ${cls}">${k}</div>`;
  },

  getHeatmapClass(stats) {
    const total = stats.correct + stats.wrong;
    if (total < 5) return '';
    const rate = stats.wrong / total;
    if (rate > 0.10) return 'miss-extreme';
    if (rate > 0.05) return 'miss-high';
    if (rate > 0.02) return 'miss-mid';
    return 'miss-low';
  },

  renderWeakKeys() {
    const container = document.getElementById('weak-keys-list');
    const entries = Object.entries(State.keyStats)
      .filter(([k, s]) => (s.correct + s.wrong) >= 10)
      .map(([k, s]) => ({
        key: k,
        total: s.correct + s.wrong,
        wrong: s.wrong,
        rate: s.wrong / (s.correct + s.wrong),
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    if (entries.length === 0) {
      container.innerHTML = '<div class="weak-keys-empty">まだデータが少ないです（10打以上のキーから集計）</div>';
      return;
    }
    container.innerHTML = entries.map((e, i) => `
      <div class="weak-key-row">
        <span class="weak-key-name">${i + 1}. [${this.formatWeakKeyLabel(e.key)}]</span>
        <span class="weak-key-rate">
          ミス率 <strong>${(e.rate * 100).toFixed(1)}%</strong> (${e.wrong}/${e.total})
        </span>
      </div>
    `).join('');
  },

  formatWeakKeyLabel(key) {
    if (key === ' ') return 'SPACE';
    if (key.length === 1) return key.toUpperCase();
    return key.toUpperCase();
  },

  renderFingers() {
    const container = document.getElementById('finger-stats');
    const order = [
      { label: '小指', key: '左小指' },
      { label: '薬指', key: '左薬指' },
      { label: '中指', key: '左中指' },
      { label: '人差指', key: '左人差指' },
      { label: '親指', key: '親指' },
      { label: '親指', key: '親指' },
      { label: '人差指', key: '右人差指' },
      { label: '中指', key: '右中指' },
      { label: '薬指', key: '右薬指' },
      { label: '小指', key: '右小指' },
    ];
    const cell = (item) => {
      const keys = this.fingerMap[item.key] || [];
      let correct = 0;
      let wrong = 0;
      for (const k of keys) {
        const s = State.keyStats[k];
        if (s) { correct += s.correct; wrong += s.wrong; }
      }
      const total = correct + wrong;
      const rate = total > 0 ? (correct / total * 100).toFixed(1) + '%' : '-';
      return `
        <div class="finger-cell">
          <div class="finger-name">${item.label}</div>
          <div class="rate">${rate}</div>
          <div class="keys">${total.toLocaleString()} keys</div>
        </div>
      `;
    };

    container.innerHTML = `
      <div class="finger-matrix">
        <div class="finger-group">
          <div class="finger-group-label">左手</div>
          <div class="finger-group-row">
            ${order.slice(0, 5).map(cell).join('')}
          </div>
        </div>
        <div class="finger-group">
          <div class="finger-group-label">右手</div>
          <div class="finger-group-row">
            ${order.slice(5).map(cell).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderHistoryTable() {
    const tbody = document.getElementById('history-tbody');
    const recent = State.history.slice(0, 10);
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-dim); text-align:center; padding:12px;">プレイ履歴なし</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(h => {
      const d = new Date(h.date);
      const dateStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      const resultLabel = { win: 'WIN', lose: 'LOSE', retreat: '撤退' }[h.result] || '-';
      const resultCls = 'result-' + h.result;
      return `
        <tr>
          <td>${dateStr}</td>
          <td>S${h.stageId}: ${h.stageName}</td>
          <td class="${resultCls}">${resultLabel}</td>
          <td>${h.kpm}</td>
          <td>${(h.accuracy * 100).toFixed(1)}%</td>
          <td>${h.score.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  },
};
