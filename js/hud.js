GameScene.prototype._makeHUD = function() {
  this._hudObjects = [];

  const el = id => document.getElementById(id);

  const txtEl = (id) => ({
    setText(v)  { el(id).textContent = v; return this; },
    setColor(c) { el(id).style.color = c; return this; },
    setAlpha(a) { el(id).style.opacity = a; return this; },
  });

  this.stBg   = {};
  this.stFill = {
    setSize(w)      { el('hud-stamina-fill').style.width = (w / 150 * 100) + '%'; return this; },
    setFillStyle(c) { el('hud-stamina-fill').style.background = '#' + c.toString(16).padStart(6, '0'); return this; },
  };

  this.itemTxt    = txtEl('hud-items');
  this.weightTxt  = txtEl('hud-weight');
  this.targetsTxt = txtEl('hud-targets');
  this.heartsTxt  = txtEl('hud-hearts');
  this.ultiTxt    = txtEl('hud-ulti');
  this.alertTxt   = txtEl('hud-alert');
  this.timerTxt   = txtEl('hud-timer');

  this._updateHeartsHUD();
};

GameScene.prototype._updateHeartsHUD = function() {
  this.heartsTxt.setText('♥'.repeat(Math.max(0, this.lives)) + '♡'.repeat(Math.max(0, 3 - this.lives)));
};

GameScene.prototype._updateUltiHUD = function() {
  if (this.ultiUsed) {
    const secs = Math.ceil(this.ultiCooldown || 0);
    this.ultiTxt.setText(`Q: ULTI [${secs}s]`);
    this.ultiTxt.setColor('#444444');
  } else {
    this.ultiTxt.setText('Q: ULTI [READY]');
    this.ultiTxt.setColor('#ff4444');
  }
};

GameScene.prototype._updateTimerHUD = function() {
  const secs = Math.ceil(this.timeLeft);
  this.timerTxt.setText(`${secs}`);
  if (secs <= 10) this.timerTxt.setColor('#ff3344');
  else if (secs <= 20) this.timerTxt.setColor('#ffaa22');
  else this.timerTxt.setColor('#ffcc00');
};

GameScene.prototype._updateItemHUD = function() {
  const slotsEl = document.getElementById('hud-bag-slots');
  if (!slotsEl) return;
  slotsEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const div = document.createElement('div');
    const item = this.inventory[i];
    if (item) {
      const hex = '#' + item.color.toString(16).padStart(6, '0');
      div.className = 'bag-slot filled';
      div.style.borderColor = hex;
      div.innerHTML =
        `<span class="bag-dot" style="background:${hex}"></span>` +
        `<span class="bag-name">${item.name}</span>`;
    } else {
      div.className = 'bag-slot empty';
    }
    slotsEl.appendChild(div);
  }
};

GameScene.prototype._updateWeightHUD = function() {
  const w = this.totalWeight;
  const color = w === 0 ? '#22cc55' : w <= 7 ? '#ffaa22' : '#ff3333';
  this.weightTxt.setText(`${w} / 22`).setColor(color);
  const fill = document.getElementById('hud-vol-bar-fill');
  if (fill) {
    fill.style.width = (w / 22 * 100) + '%';
    fill.style.background = color;
  }
};

GameScene.prototype._updateCollectBar = function(item, progress) {
  if (!this.collectBarGfx) {
    this.collectBarGfx = this.add.graphics().setDepth(60);
    this.uiCam.ignore(this.collectBarGfx);
  }
  const g = this.collectBarGfx;
  g.clear();
  const bw = 32, bh = 5;
  const bx = item.x - bw / 2, by = item.y - 22;
  g.fillStyle(0x222222, 0.85);
  g.fillRect(bx, by, bw, bh);
  g.fillStyle(0x00ff66, 1);
  g.fillRect(bx, by, bw * Math.min(progress, 1), bh);
};

GameScene.prototype._hideCollectBar = function() {
  if (this.collectBarGfx) this.collectBarGfx.clear();
};
