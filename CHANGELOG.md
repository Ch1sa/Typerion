# CHANGELOG

## v1.4.2 (2026-04-24)

### Changed - 戦場ビジュアル大幅強化 / UI整理
- **戦場背景を野原風のイラストに**
  - 空・遠景の丘・草原の3層構造(Canvas 描画)
  - 流れる雲、ランダム配置の草と花(黄・ピンク・白)
  - 平坦な緑一色から、自然な屋外フィールド感へ
- **攻撃エフェクトを追加**
  - ダメージ発生時にパーティクル(8個)+ 衝撃波(白い円の拡散)
  - ユニット/敵撃破時 & 拠点被弾時は大型の爆発(14粒子)
  - 被弾の視認性が大幅アップ
- **キャラクター・HPバーをさらに拡大**
  - 拠点: 56px → 60px、HPバー: 80×8 → 90×10
  - 自軍ユニット: 36px → 40px、HPバー: 44×4 → 50×6
  - 敵: 32px → 34px、HPバー: 36×4 → 42×5
  - 拠点の HP 数値テキストに黒縁どりで視認性向上
- **戦場の高さ**: min-height 220px → 280px

### Changed - Tier 選択の簡素化
- Tierボタンを「Tab+数字 + 絵文字」のみのシンプルな表示に
- 「短語/標準/長文」や辞書名の重複表示を削除
- ボタン自体のサイズは大きく(padding 10px → 14px、font-size 14 → 15px)
- HP/KPM/Miss 表示を削除(ゲーム画面をすっきりと)

### Changed - 設定画面の文言整理
- 各セクションの補足説明文(p タグ)を削除
- h3 タイトルと操作UIだけの見通しの良いレイアウトに
- フォントサイズも 13px → 15px(h3)、12px → 13px(button)

### Changed - 指の色分けを濃く
- 小指: `#d96b6b` → `#c73232`(はっきりした赤)
- 薬指: `#e8ab47` → `#d68a1a`(深いオレンジ)
- 中指: `#7fc8a9` → `#3a9c6d`(濃い緑)
- 人差指: `#5a9fb8` → `#2e7fa6`(深い青)
- 親指: `#a8aeae` → `#707878`(濃いグレー)
- 凡例文字も text-dim → text、font-size 11px → 12px、太字化

### Changed - 記録・ステージ選択画面の文字拡大
- ステージカード h3: 14px → 16px、meta: 11px → 13px
- 結果画面: フォント 13px → 15px、padding 拡大
- 記録サマリーカード: value 22px → 26px、label 10px → 12px
- 指別統計カード: frate 16px → 20px、fname 11px → 13px
- 履歴テーブル: 11px → 13px
- ステージベスト: sb-score 14px → 17px
- menu-btn: 14px → 16px、min-width 240px → 260px

### Fixed
- 連続ミス時のフレームずれ防止で dt 制限(50ms 上限)を追加

## v1.4.1 (2026-04-24)

### Changed - UI可視性の改善
- **戦場のユニット・敵・拠点を大型化**
  - 拠点: 40px → 56px、自軍ユニット: 24px → 36px、敵: 20px → 32px
  - HPバーも拠点 60×6 → 80×8、ユニット/敵 30×3 → 44×4 / 36×4 に拡大
  - 近接判定・拠点到達判定も拡大サイズに合わせて調整
- **ゴースト・キーボードを白系背景+キー大型化**
  - 器の背景: アイボリー → 白パネル、内側に微妙な影
  - キーサイズ: 34×30 → 42×38px、フォント: 12px → 14px
  - 指色の下線も太く(3px → 4px)
- **戦闘画面の文字を大きく**
  - ワード表示: 28px → 32px
  - Tier選択ボタン: 12px → 14px
  - HP/KPM/Miss 表示: 11px → 13px
  - ステージ名/Wave: 12px → 14px
  - ヘッダー: h1 16px → 18px、stats 13px → 15px
- **画面右下のバージョン表記を削除**
- レスポンシブのブレークポイントとサイズも新基準に合わせて調整

## v1.4.0 (2026-04-24)

### Changed - ファイル構造の大幅リファクタ
- **単一の index.html(2425行/80KB)を ES Modules で分割**
  - `index.html` は 274行まで圧縮(HTML構造のみ)
  - CSS: 7ファイル(base/layout/battle/keyboard/overlays/records/responsive)
  - JS: 10ファイル(config/storage/dictionaries/state/battle/typing/ghost-keyboard/records/game/main)
- **動作は完全に同一**(機能変更なし、構成変更のみ)
- **依存関係が明示的に**:
  - `import { X } from './module.js'` / `export const X` で依存を宣言
  - 循環依存はコールバック登録パターンで回避(Battle/Typing ⇄ Game)
- モジュール別に編集・検索できるようになり、メンテナンス性が大幅向上

### Files
```
typerion/
├── index.html              (274行)
├── css/
│   ├── base.css            変数・リセット・グローバル
│   ├── layout.css          header・loading・toast
│   ├── battle.css          戦場・詠唱エリア
│   ├── keyboard.css        ゴーストキーボード
│   ├── overlays.css        モーダル・ボタン・カード
│   ├── records.css         記録ページ
│   └── responsive.css      メディアクエリ
├── js/
│   ├── config.js           CONFIG・FALLBACK_DICT
│   ├── storage.js          LocalStorage ラッパー
│   ├── dictionaries.js     辞書読み込み
│   ├── state.js            ゲーム状態
│   ├── battle.js           タワーディフェンス
│   ├── typing.js           タイピングエンジン
│   ├── ghost-keyboard.js   キーボード表示
│   ├── records.js          記録画面
│   ├── game.js             画面遷移・全体制御
│   └── main.js             エントリポイント
└── dictionaries/           (既存)
```

### Breaking
- **ローカルでの file:// 直開きは更に動かなくなった**
  - ES Modules は CORS 制約下で動くため、HTTPサーバー経由必須
  - `python3 -m http.server` または Cloudflare Pages 経由で開く
  - 元々辞書 fetch で同じ制約があったが、JS 自体も同じ扱いに

## v1.3.1 (2026-04-23)

### Fixed
- **戦闘画面の Canvas が表示されない不具合を修正**
  - ステージ開始時に Canvas のリサイズが走らず、描画サイズが 0x0 になっていた
  - `Battle.start()` 内で `resize()` を呼び、`startStage()` で `requestAnimationFrame` によるレイアウト反映待ちを追加

### Changed
- **全体を Light Forest テーマに配色変更**(暗い配色から明るい配色へ)
  - 背景: 生成り/アイボリー(`#f4f1ea`)
  - アクセント: 深緑(`#3a8a6a`、植物をイメージ)
  - 戦場の背景: 若葉色〜薄緑のグラデーション
  - キーボード・ボタン・パネル・カード類を白ベースに統一
  - 影を柔らかく、境界を border で明示
- Canvas 描画色(HPバー・地面ライン・テキスト)を明るい背景に合わせて調整
- 指の担当色・ステージユニット色も新パレットに揃えた

## v1.3.0 (2026-04-23)

### Added - ゴースト・キーボード / 3分割レイアウト
- **ゴースト・キーボード**を戦闘画面中央に追加
  - QWERTY 配列の仮想キーボード表示
  - 次に打つキーを青く点灯・浮き上がり演出
  - 正しく打つと黄色く光る、ミスすると赤く光る
  - 担当指が下線の色でわかる(小指=赤/薬指=黄/中指=緑/人差指=青/親指=灰)
  - F/J キーにはホームポジション目印(·)
- 戦闘画面を **3分割レイアウト** に再構成
  - 上: 戦場(Canvas)
  - 中: ゴースト・キーボード
  - 下: Tier 選択 + ワード表示 + HP/KPM/Miss info
- ヘルプ画面にゴースト・キーボードの説明追加

### Changed
- 戦場の最小高さを 280px → 180px に(キーボード分のスペース確保)

## v1.2.0 (2026-04-23)

### Added - 個人記録ページ
- **📊 記録画面** をホームから開けるように
- **サマリーカード 8種** - 総打鍵数 / 正確率 / 最高KPM / 平均KPM / 連続プレイ日数 / 総プレイ数 / 成熟度 / 累計プレイ時間
- **キーボードヒートマップ** - ミス率で色分け(青→黄→橙→赤)、%表示つき
- **苦手キー TOP 5** - ミス率ランキング
- **指別の正確率** - 8本の指ごと集計、弱い指を色分け
- **スコア推移グラフ** - 直近20件の KPM と正確率の折れ線(Canvas描画)
- **ステージ別ベストスコア** - KPM/正確率/日付つき
- **プレイ履歴テーブル** - 直近10件の詳細ログ
- 設定画面に「記録だけリセット」ボタン追加(成熟度は保持)

### Changed
- データスキーマ拡張(keyStats, stageBests, history, playDates, maxKpm, totalPlayMs, firstPlayDate)
- セーブデータの export/import に記録データを含めた
- フッタのバージョン表示を 1.2.0 に

## v1.1.0 (2026-04-23)

### Added
- 外部辞書ファイル対応(`/dictionaries/*.json`)
- 4つのデフォルト辞書を収録
  - ホームポジション特化(home-row.json)
  - 英単語頻出(en-common.json) - Google Trillion Word Corpus ベース
  - プログラミング・コマンド(coding.json)
  - 日本語ローマ字(ja-roma.json)
- 5つの辞書プリセット(初心者/英語/コーディング/日本語/ミックス)
- Tier ごとに辞書を個別選択できる UI
- プレイ中のTierボタンに現在使用中の辞書名を表示
- 遊び方ヘルプ画面
- トースト通知

### Changed
- 辞書データを本体 HTML から外部 JSON へ分離(軽量化)
- 設定画面のレイアウトをセクション構造に整理

### Fixed
- ミス時の shake アニメーションが連続ミスで再生されない問題を修正

## v1.0.0 (初版)

### Added
- タイピングエンジン(入力判定・ミス処理)
- Tier 切替システム(Tab+1/2/3)
- タワーディフェンス本体(Canvas 描画、ユニット・敵・拠点)
- 5ステージ(Forest Edge ~ Ancient Ruins)
- 成熟度システム、拠点進化(Seed → Sapling → Ancient Tree)
- LocalStorage による永続化
- セーブデータ/辞書のエクスポート・インポート
- 全データリセット機能
