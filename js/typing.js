// ============================================================================
// typing.js
// タイピングエンジン。キー入力の判定、ミス処理、単語選出、表示更新。
// ============================================================================

import { CONFIG } from './config.js';
import { State } from './state.js';
import { Dictionaries } from './dictionaries.js';
import { Battle } from './battle.js';
import { GhostKeyboard } from './ghost-keyboard.js';

// Game 側に委譲したいアクション(main.js で登録)
let onSetTier = null;
let onEscape = null;
export function setTypingHandlers({ setTier, escape }) {
  onSetTier = setTier;
  onEscape = escape;
}

export const Typing = {
  newWord() {
    const dictId = State.tierAssignments[State.currentTier];
    State.currentWord = Dictionaries.getWordFromDict(dictId, State.currentTier);
    State.typedIndex = 0;
    State.missCount = 0;
    State.hpRatio = 1.0;
    this.render();
    this.updateInfo();
    GhostKeyboard.highlightNext(State.currentWord[0]);
  },

  onKey(ev) {
    // Tab+数字で Tier 変更
    if (ev.key >= '1' && ev.key <= '3' && State._tabHeld) {
      ev.preventDefault();
      onSetTier && onSetTier(parseInt(ev.key));
      return;
    }
    if (ev.key === 'Tab') {
      ev.preventDefault();
      State._tabHeld = true;
      return;
    }
    if (ev.key === 'Escape') {
      if (State.currentScreen === 'battle') onEscape && onEscape();
      return;
    }
    if (State.currentScreen !== 'battle') return;
    const expected = State.currentWord[State.typedIndex];
    if (!expected) return;
    if (ev.key.length !== 1) return;
    ev.preventDefault();

    State.sessionStats.totalChars++;
    State.totalChars++;

    // キー統計(期待されたキーで集計)
    const keyCode = expected.toLowerCase();
    if (!State.keyStats[keyCode]) State.keyStats[keyCode] = { correct: 0, wrong: 0 };

    if (ev.key === expected) {
      State.typedIndex++;
      State.sessionStats.correctChars++;
      State.totalCorrectChars++;
      State.keyStats[keyCode].correct++;
      GhostKeyboard.flashPress(ev.key);
      if (State.typedIndex >= State.currentWord.length) {
        Battle.summon(State.currentTier, State.hpRatio);
        this.newWord();
        return;
      }
      // 次のキーをハイライト
      GhostKeyboard.highlightNext(State.currentWord[State.typedIndex]);
    } else {
      State.missCount++;
      State.sessionStats.misses++;
      State.keyStats[keyCode].wrong++;
      State.hpRatio = Math.max(CONFIG.minHpRatio, State.hpRatio - CONFIG.missHpReduction);
      GhostKeyboard.flashMiss(ev.key);
      const el = document.getElementById('word-display');
      el.classList.remove('miss-flash');
      void el.offsetWidth;
      el.classList.add('miss-flash');
    }
    this.render();
    this.updateInfo();
  },

  onKeyUp(ev) {
    if (ev.key === 'Tab') State._tabHeld = false;
  },

  render() {
    const el = document.getElementById('word-display');
    const w = State.currentWord;
    const i = State.typedIndex;
    const len = w.length;
    // 長文(特に Tier3)ははみ出さないようフォントを段階的に縮小
    let size = 36;
    if (len > 36) size = 20;
    else if (len > 28) size = 24;
    else if (len > 20) size = 28;
    else if (len > 14) size = 32;
    el.style.fontSize = `${size}px`;
    el.style.letterSpacing = size <= 24 ? '1px' : '2px';
    let html = '';
    html += `<span class="done">${this.escape(w.slice(0, i))}</span>`;
    if (i < w.length) {
      html += `<span class="current">${this.escape(w[i])}</span>`;
      html += `<span class="todo">${this.escape(w.slice(i + 1))}</span>`;
    }
    el.innerHTML = html;

    // コンテナサイズに収まるまで自動で縮小して、長文でもはみ出さないようにする
    while ((el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) && size > 14) {
      size -= 1;
      el.style.fontSize = `${size}px`;
      el.style.letterSpacing = size <= 24 ? '1px' : '2px';
    }
  },

  updateInfo() {
    // HP/KPM/Miss 表示は UI から削除されたため no-op
    // (記録は endBattle 時に結果画面・記録ページで反映される)
  },

  escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/ /g, '&nbsp;');
  },
};
