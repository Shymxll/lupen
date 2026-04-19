GameScene.prototype._makeHUD = function() {
  this._hudObjects = [];
  const push = obj => { this._hudObjects.push(obj); return obj; };
  const d = 60;

  push(this.add.text(10, 10, 'STAMINA', { fontSize: '9px', color: '#44446a', fontFamily: 'monospace' }).setDepth(d));

  this.stBg   = push(this.add.rectangle(85, 18, 150, 10, 0x0e0e22).setDepth(d));
  this.stFill = push(this.add.rectangle(10, 18, 150, 10, 0x22cc55).setDepth(d + 1).setOrigin(0, 0.5));

  this.itemTxt    = push(this.add.text(10, 30, 'ITEMS: 0 / 3', { fontSize: '11px', color: '#ffcc00', fontFamily: 'monospace' }).setDepth(d));
  this.targetsTxt = push(this.add.text(10, 44, 'Targets: …',   { fontSize: '11px', color: '#44ffff', fontFamily: 'monospace' }).setDepth(d));

  this.heartsTxt  = push(this.add.text(10, 60, '♥♥♥', {
    fontSize: '18px', color: '#ff3355', fontFamily: 'monospace'
  }).setDepth(d));

  this.ultiTxt = push(this.add.text(10, ROWS * T - 32, 'Q: ULTI [READY]', {
    fontSize: '10px', color: '#ff4444', fontFamily: 'monospace'
  }).setDepth(d));

  push(this.add.text(10, ROWS * T - 18, 'WASD: move   SHIFT: sprint', { fontSize: '9px', color: '#22224a', fontFamily: 'monospace' }).setDepth(d));

  this.alertTxt = push(this.add.text(COLS * T / 2, 10, '', {
    fontSize: '13px', color: '#ff3344', fontFamily: 'monospace', fontStyle: 'bold'
  }).setDepth(d).setOrigin(0.5, 0));
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

GameScene.prototype._updateItemHUD = function() {
  if (this.collected < 3) {
    this.itemTxt.setText(`ITEMS: ${this.collected} / 3`);
  }
};
