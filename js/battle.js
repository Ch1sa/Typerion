// ============================================================================
// battle.js
// タワーディフェンス本体。Canvas に戦場を描画、ユニット/敵の戦闘ロジック。
// ============================================================================

import { CONFIG } from './config.js';
import { State } from './state.js';

let onBattleEnd = null;
export function setBattleEndHandler(fn) { onBattleEnd = fn; }

export const Battle = {
  canvas: null, ctx: null,
  units: [], enemies: [],
  particles: [],
  shockwaves: [],
  grassTufts: [],
  clouds: [],
  baseHp: 1000, enemyBaseHp: 1000,
  maxBaseHp: 1000, maxEnemyBaseHp: 1000,
  baseHitAnim: 0, enemyBaseHitAnim: 0,
  lastSpawn: 0, running: false, stageCleared: false,
  enemiesSpawned: 0, enemiesKilled: 0, unitsSummoned: 0,
  stage: null, startTime: 0,
  lastFrame: 0,

  init() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.generateScenery();
  },

  generateScenery() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.grassTufts = [];
    const groundY = H / 2 + 50;
    const tuftCount = Math.floor(W / 18);
    for (let i = 0; i < tuftCount; i++) {
      this.grassTufts.push({
        x: Math.random() * W,
        y: groundY + 4 + Math.random() * (H - groundY - 8),
        size: 2 + Math.random() * 3,
        shade: Math.random(),
      });
    }
    for (let i = 0; i < Math.floor(W / 80); i++) {
      this.grassTufts.push({
        x: Math.random() * W,
        y: groundY + 8 + Math.random() * (H - groundY - 16),
        size: 3,
        flower: true,
      });
    }
    this.clouds = [];
    const cloudCount = Math.max(3, Math.floor(W / 220));
    for (let i = 0; i < cloudCount; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: 15 + Math.random() * (H / 2 - 40),
        size: 20 + Math.random() * 30,
        speed: 0.1 + Math.random() * 0.15,
      });
    }
  },

  start(stage) {
    this.stage = stage;
    this.units = []; this.enemies = [];
    this.particles = [];
    this.shockwaves = [];
    this.baseHp = State.getBaseLevel().hp;
    this.maxBaseHp = this.baseHp;
    this.enemyBaseHp = stage.enemyHp;
    this.maxEnemyBaseHp = stage.enemyHp;
    this.lastSpawn = performance.now();
    this.running = true;
    this.stageCleared = false;
    this.baseHitAnim = 0;
    this.enemyBaseHitAnim = 0;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.unitsSummoned = 0;
    this.startTime = performance.now();
    this.lastFrame = performance.now();
    this.resize();
    this.loop();
  },

  stop() { this.running = false; },

  summon(tier, hpRatio) {
    const spec = CONFIG.tiers[tier];
    const hp = Math.max(spec.hp * CONFIG.minHpRatio, spec.hp * hpRatio);
    this.units.push({
      x: 75,
      y: this.canvas.height / 2 + (Math.random() - 0.5) * 40,
      hp, maxHp: spec.hp,
      atk: spec.atk, speed: spec.speed,
      color: spec.color, emoji: spec.emoji,
      tier, cooldown: 0, attackAnim: 0,
    });
    this.unitsSummoned++;
  },

  spawnEnemy() {
    this.enemies.push({
      x: this.canvas.width - 75,
      y: this.canvas.height / 2 + (Math.random() - 0.5) * 40,
      hp: CONFIG.enemy.hp + this.stage.id * 10,
      maxHp: CONFIG.enemy.hp + this.stage.id * 10,
      atk: CONFIG.enemy.atk + this.stage.id * 2,
      speed: CONFIG.enemy.speed,
      cooldown: 0, attackAnim: 0,
    });
    this.enemiesSpawned++;
  },

  burst(x, y, color = '#ffd34d') {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1.0,
        size: 3 + Math.random() * 2,
        color,
      });
    }
    this.shockwaves.push({ x, y, r: 4, life: 1.0 });
  },

  bigBurst(x, y, color = '#ff6b6b') {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1.2,
        size: 4 + Math.random() * 3,
        color,
      });
    }
    this.shockwaves.push({ x, y, r: 6, life: 1.2, big: true });
  },

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;

    if (now - this.lastSpawn > this.stage.spawnInterval && this.enemiesSpawned < this.stage.waveCount) {
      this.spawnEnemy();
      this.lastSpawn = now;
    }

    for (const u of this.units) {
      const target = this.findNearest(u, this.enemies);
      if (target && Math.abs(u.x - target.x) < 50) {
        u.cooldown -= dt;
        if (u.cooldown <= 0) {
          target.hp -= u.atk;
          u.cooldown = 600;
          u.attackAnim = 180;
          this.burst(target.x, target.y, u.color);
        }
      } else if (this.enemies.length > 0 || this.enemyBaseHp > 0) {
        u.x += u.speed;
      }
      if (u.x > this.canvas.width - 60 && this.enemyBaseHp > 0) {
        u.cooldown -= dt;
        if (u.cooldown <= 0) {
          this.enemyBaseHp -= u.atk;
          u.cooldown = 600;
          u.attackAnim = 180;
          this.enemyBaseHitAnim = 220;
          this.bigBurst(this.canvas.width - 50, this.canvas.height / 2, '#ffd34d');
        }
      }
    }

    for (const e of this.enemies) {
      const target = this.findNearest(e, this.units);
      const baseAttackX = 118;
      if (target && Math.abs(e.x - target.x) < 50) {
        e.cooldown -= dt;
        if (e.cooldown <= 0) {
          target.hp -= e.atk;
          e.cooldown = 600;
          e.attackAnim = 180;
          this.burst(target.x, target.y, '#d96b6b');
        }
      } else if (e.x > baseAttackX) {
        e.x -= e.speed;
      }
      if (e.x <= baseAttackX) {
        e.cooldown -= dt;
        if (e.cooldown <= 0) {
          this.baseHp -= e.atk;
          e.cooldown = 600;
          e.attackAnim = 180;
          this.baseHitAnim = 220;
          this.bigBurst(72, this.canvas.height / 2, '#ff6b6b');
        }
      }
    }

    this.baseHitAnim = Math.max(0, this.baseHitAnim - dt);
    this.enemyBaseHitAnim = Math.max(0, this.enemyBaseHitAnim - dt);
    for (const u of this.units) u.attackAnim = Math.max(0, (u.attackAnim || 0) - dt);
    for (const e of this.enemies) e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt);

    if (State.getBaseLevel().autoAttack) {
      for (const e of this.enemies) if (e.x < 200) e.hp -= 1;
    }

    for (const u of this.units) {
      if (u.hp <= 0) this.bigBurst(u.x, u.y, u.color);
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) this.bigBurst(e.x, e.y, '#888');
    }
    this.units = this.units.filter(u => u.hp > 0);
    const killedNow = this.enemies.filter(e => e.hp <= 0).length;
    this.enemiesKilled += killedNow;
    this.enemies = this.enemies.filter(e => e.hp > 0);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.97;
      p.life -= dt / 500;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const s of this.shockwaves) {
      s.r += s.big ? 3 : 2;
      s.life -= dt / 400;
    }
    this.shockwaves = this.shockwaves.filter(s => s.life > 0);

    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > this.canvas.width + c.size) c.x = -c.size;
    }

    if (this.enemyBaseHp <= 0) {
      this.running = false;
      this.stageCleared = true;
      setTimeout(() => onBattleEnd && onBattleEnd(true), 500);
    } else if (this.baseHp <= 0) {
      this.running = false;
      setTimeout(() => onBattleEnd && onBattleEnd(false), 500);
    }

    this.draw();
    requestAnimationFrame(() => this.loop());
  },

  findNearest(from, arr) {
    let best = null, bestD = Infinity;
    for (const t of arr) {
      const d = Math.abs(from.x - t.x);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  },

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const y = H / 2;

    // 空
    const skyGrad = ctx.createLinearGradient(0, 0, 0, y + 40);
    skyGrad.addColorStop(0, '#a8dff0');
    skyGrad.addColorStop(1, '#d6f1e3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, y + 40);

    // 遠景の丘
    ctx.fillStyle = '#a8d89c';
    ctx.beginPath();
    ctx.ellipse(W * 0.3, y + 60, W * 0.5, 80, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#95c58a';
    ctx.beginPath();
    ctx.ellipse(W * 0.75, y + 70, W * 0.4, 60, 0, Math.PI, 0);
    ctx.fill();

    // 草原
    const grassGrad = ctx.createLinearGradient(0, y + 40, 0, H);
    grassGrad.addColorStop(0, '#7db870');
    grassGrad.addColorStop(0.5, '#88c179');
    grassGrad.addColorStop(1, '#74a662');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, y + 40, W, H - (y + 40));

    // 雲
    for (const c of this.clouds) this.drawCloud(c);

    // 草と花
    for (const g of this.grassTufts) {
      if (g.flower) {
        ctx.fillStyle = ['#ffd84d', '#f4a6c9', '#ffffff'][Math.floor(g.x) % 3];
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc33';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = g.shade > 0.5 ? '#5a9046' : '#6ba056';
        ctx.beginPath();
        ctx.moveTo(g.x - g.size, g.y);
        ctx.lineTo(g.x, g.y - g.size * 2);
        ctx.lineTo(g.x + g.size, g.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 戦闘ライン(薄く)
    ctx.strokeStyle = 'rgba(42,61,58,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 50);
    ctx.lineTo(W, y + 50);
    ctx.stroke();

    // 拠点
    this.drawBase(72, y, State.getBaseLevel().emoji, this.baseHp, this.maxBaseHp, '#3b82f6', this.baseHitAnim);
    this.drawBase(W - 72, y, '🪹', this.enemyBaseHp, this.maxEnemyBaseHp, '#d96b6b', this.enemyBaseHitAnim);

    for (const u of this.units) this.drawUnit(u);
    for (const e of this.enemies) this.drawEnemy(e);

    // 衝撃波
    for (const s of this.shockwaves) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${s.life * 0.7})`;
      ctx.lineWidth = s.big ? 3 : 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // パーティクル
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ステージ情報
    const info = `${this.stage.name} | Wave ${this.enemiesSpawned}/${this.stage.waveCount}`;
    ctx.font = 'bold 15px ' + (getComputedStyle(document.body).fontFamily);
    const textW = ctx.measureText(info).width;
    ctx.fillStyle = 'rgba(42,61,58,0.7)';
    ctx.fillRect(10, 10, textW + 16, 26);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(info, 18, 23);
    ctx.textBaseline = 'alphabetic';
  },

  drawCloud(c) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size * 0.5, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.5, c.y + c.size * 0.1, c.size * 0.4, 0, Math.PI * 2);
    ctx.arc(c.x + c.size, c.y, c.size * 0.45, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.3, c.y - c.size * 0.1, c.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  },

  drawBase(x, y, emoji, hp, maxHp, color, hitAnim = 0) {
    const ctx = this.ctx;
    const hitRatio = Math.max(0, hitAnim / 220);
    const pulse = 1 + hitRatio * 0.08;
    ctx.save();
    ctx.translate(x, y + 10);
    // 比率は維持しつつ、被弾時に軽く脈動
    ctx.scale(pulse, pulse);
    ctx.font = '72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
    const w = 118;
    const h = 10;
    const barY = y + 42;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(x - w/2, barY, w, h);
    ctx.strokeStyle = 'rgba(42,61,58,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w/2, barY, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x - w/2 + 1, barY + 1, (w - 2) * Math.max(0, hp/maxHp), h - 2);
    // HPはバーの真下に中央寄せで表示
    const hpText = `${Math.max(0, Math.ceil(hp)).toLocaleString()} / ${Math.ceil(maxHp).toLocaleString()}`;
    const textY = barY + h + 16;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(42,61,58,0.9)';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeText(hpText, x, textY);
    ctx.fillText(hpText, x, textY);
    ctx.textBaseline = 'alphabetic';
  },

  drawUnit(u) {
    const ctx = this.ctx;
    const attackRatio = Math.max(0, (u.attackAnim || 0) / 180);
    const attackOffset = attackRatio * 5;
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.emoji, u.x + attackOffset, u.y + 14);
    const w = 50;
    const h = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(u.x - w/2, u.y - 28, w, h);
    ctx.strokeStyle = 'rgba(42,61,58,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(u.x - w/2, u.y - 28, w, h);
    // 味方HPバーは背景の草色と被らないよう、青系グラデで視認性を上げる
    const unitHpW = (w - 2) * Math.max(0, u.hp / u.maxHp);
    const hpGrad = ctx.createLinearGradient(u.x - w / 2, 0, u.x + w / 2, 0);
    hpGrad.addColorStop(0, '#60a5fa');
    hpGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(u.x - w/2 + 1, u.y - 27, unitHpW, h - 2);
  },

  drawEnemy(e) {
    const ctx = this.ctx;
    const attackRatio = Math.max(0, (e.attackAnim || 0) / 180);
    const attackOffset = attackRatio * 5;
    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(CONFIG.enemy.emoji, e.x - attackOffset, e.y + 12);
    const w = 42;
    const h = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(e.x - w/2, e.y - 24, w, h);
    ctx.strokeStyle = 'rgba(42,61,58,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(e.x - w/2, e.y - 24, w, h);
    ctx.fillStyle = '#d96b6b';
    ctx.fillRect(e.x - w/2 + 1, e.y - 23, (w - 2) * Math.max(0, e.hp/e.maxHp), h - 2);
  },
};
