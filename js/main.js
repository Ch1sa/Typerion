// ============================================================================
// main.js
// エントリポイント。Game を window に公開し、モジュール間の結線を行う。
// ============================================================================

import { Game } from './game.js';
import { setBattleEndHandler } from './battle.js';
import { setTypingHandlers } from './typing.js';

// HTML インラインの onclick="Game.xxx()" から呼び出せるように公開
window.Game = Game;

// 戦闘終了時のコールバックを Battle モジュールに登録
setBattleEndHandler((victory) => Game.endBattle(victory));

// Typing からの Tier 切替・撤退の呼び出しを Game に委譲
setTypingHandlers({
  setTier: (t) => Game.setTier(t),
  escape: () => Game.endBattle(false, true),
});

// DOM 準備完了後にゲーム初期化
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => Game.init());
} else {
  Game.init();
}
