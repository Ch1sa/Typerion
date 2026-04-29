// ============================================================================
// ghost-keyboard.js
// タッチタイピング補助用のキーボード表示。
// 次に打つキー・担当指をハイライト、押下/ミスで光らせる。
// ============================================================================

export const GhostKeyboard = {
  // 各キーの定義(位置情報・指の担当・shift 時の文字)
  rows: [
    [
      { key: '`', shift: '~', finger: 'f-left-pinky' },
      { key: '1', shift: '!', finger: 'f-left-pinky' },
      { key: '2', shift: '@', finger: 'f-left-ring' },
      { key: '3', shift: '#', finger: 'f-left-middle' },
      { key: '4', shift: '$', finger: 'f-left-index' },
      { key: '5', shift: '%', finger: 'f-left-index' },
      { key: '6', shift: '^', finger: 'f-right-index' },
      { key: '7', shift: '&', finger: 'f-right-index' },
      { key: '8', shift: '*', finger: 'f-right-middle' },
      { key: '9', shift: '(', finger: 'f-right-ring' },
      { key: '0', shift: ')', finger: 'f-right-pinky' },
      { key: '-', shift: '_', finger: 'f-right-pinky' },
      { key: '=', shift: '+', finger: 'f-right-pinky' },
    ],
    [
      { key: 'q', shift: 'Q', finger: 'f-left-pinky' },
      { key: 'w', shift: 'W', finger: 'f-left-ring' },
      { key: 'e', shift: 'E', finger: 'f-left-middle' },
      { key: 'r', shift: 'R', finger: 'f-left-index' },
      { key: 't', shift: 'T', finger: 'f-left-index' },
      { key: 'y', shift: 'Y', finger: 'f-right-index' },
      { key: 'u', shift: 'U', finger: 'f-right-index' },
      { key: 'i', shift: 'I', finger: 'f-right-middle' },
      { key: 'o', shift: 'O', finger: 'f-right-ring' },
      { key: 'p', shift: 'P', finger: 'f-right-pinky' },
      { key: '[', shift: '{', finger: 'f-right-pinky' },
      { key: ']', shift: '}', finger: 'f-right-pinky' },
      { key: '\\', shift: '|', finger: 'f-right-pinky' },
    ],
    [
      { key: 'a', shift: 'A', finger: 'f-left-pinky' },
      { key: 's', shift: 'S', finger: 'f-left-ring' },
      { key: 'd', shift: 'D', finger: 'f-left-middle' },
      { key: 'f', shift: 'F', finger: 'f-left-index' },
      { key: 'g', shift: 'G', finger: 'f-left-index' },
      { key: 'h', shift: 'H', finger: 'f-right-index' },
      { key: 'j', shift: 'J', finger: 'f-right-index' },
      { key: 'k', shift: 'K', finger: 'f-right-middle' },
      { key: 'l', shift: 'L', finger: 'f-right-ring' },
      { key: ';', shift: ':', finger: 'f-right-pinky' },
      { key: "'", shift: '"', finger: 'f-right-pinky' },
    ],
    [
      { key: 'z', shift: 'Z', finger: 'f-left-pinky' },
      { key: 'x', shift: 'X', finger: 'f-left-ring' },
      { key: 'c', shift: 'C', finger: 'f-left-middle' },
      { key: 'v', shift: 'V', finger: 'f-left-index' },
      { key: 'b', shift: 'B', finger: 'f-left-index' },
      { key: 'n', shift: 'N', finger: 'f-right-index' },
      { key: 'm', shift: 'M', finger: 'f-right-index' },
      { key: ',', shift: '<', finger: 'f-right-middle' },
      { key: '.', shift: '>', finger: 'f-right-ring' },
      { key: '/', shift: '?', finger: 'f-right-pinky' },
    ],
  ],

  // フラットな lookup: 文字 → { element, finger, needsShift, baseKey }
  keyMap: {},
  rendered: false,

  render() {
    const container = document.getElementById('ghost-keyboard');
    if (!container) return;
    container.innerHTML = '';
    this.keyMap = {};

    this.rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = `gk-row r${ri + 1}`;
      row.forEach(k => {
        const el = document.createElement('div');
        el.className = `gk-key ${k.finger}`;
        // ホームポジションのF,Jにはぽっちを擬似表現
        const displayText = (k.key === 'f' || k.key === 'j') ? k.key + '·' : k.key;
        el.textContent = displayText;
        el.dataset.key = k.key;
        rowEl.appendChild(el);
        this.keyMap[k.key] = { el, finger: k.finger, needsShift: false, baseKey: k.key };
        if (k.shift && k.shift !== k.key) {
          this.keyMap[k.shift] = { el, finger: k.finger, needsShift: true, baseKey: k.key };
        }
      });
      container.appendChild(rowEl);
    });

    // 5段目: スペースキー
    const spaceRow = document.createElement('div');
    spaceRow.className = 'gk-row r4';
    const spaceEl = document.createElement('div');
    spaceEl.className = 'gk-key space f-thumb';
    spaceEl.textContent = 'space';
    spaceEl.dataset.key = ' ';
    spaceRow.appendChild(spaceEl);
    container.appendChild(spaceRow);
    this.keyMap[' '] = { el: spaceEl, finger: 'f-thumb', needsShift: false, baseKey: ' ' };

    // 凡例
    const legend = document.createElement('div');
    legend.className = 'gk-fingers';
    legend.innerHTML = `
      <span><span class="f-chip" style="background:#c73232;"></span>小指</span>
      <span><span class="f-chip" style="background:#d68a1a;"></span>薬指</span>
      <span><span class="f-chip" style="background:#3a9c6d;"></span>中指</span>
      <span><span class="f-chip" style="background:#2e7fa6;"></span>人差指</span>
      <span><span class="f-chip" style="background:#707878;"></span>親指</span>
    `;
    container.appendChild(legend);

    this.rendered = true;
  },

  /** 次に打つキーをハイライト */
  highlightNext(char) {
    document.querySelectorAll('.gk-key.next, .gk-key.shift-hint').forEach(el => {
      el.classList.remove('next', 'shift-hint');
    });
    if (char === undefined || char === null) return;
    const info = this.keyMap[char];
    if (info) info.el.classList.add('next');
  },

  /** 正しく打たれた時に一瞬光らせる */
  flashPress(char) {
    const lookupKey = typeof char === 'string' ? char : String(char);
    const info = this.keyMap[lookupKey] || this.keyMap[lookupKey.toLowerCase()];
    if (!info) return;
    info.el.classList.add('pressed');
    setTimeout(() => info.el.classList.remove('pressed'), 120);
  },

  /** ミスした時 */
  flashMiss(char) {
    const lookupKey = typeof char === 'string' ? char : String(char);
    const info = this.keyMap[lookupKey] || this.keyMap[lookupKey.toLowerCase()];
    if (!info) return;
    info.el.classList.add('miss-flash');
    setTimeout(() => info.el.classList.remove('miss-flash'), 300);
  },

  clear() {
    document.querySelectorAll('.gk-key').forEach(el => {
      el.classList.remove('next', 'pressed', 'miss-flash', 'shift-hint');
    });
  },
};
