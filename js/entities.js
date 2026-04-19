GameScene.prototype._makeMap = function() {
  this.walls = this.physics.add.staticGroup();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * T + T / 2, y = r * T + T / 2;
      if (MAP[r][c] === 1) {
        const w = this.walls.create(x, y, 'wall');
        w.body.setSize(T, T); w.refreshBody();
      } else {
        this.add.image(x, y, 'floor');
      }
    }
  }
};

GameScene.prototype._makeEntities = function() {
  const ITEM_DATA = [
    { id: 0, col: 11, row: 2,  weight: 4, value: 7 },
    { id: 1, col: 17, row: 7,  weight: 6, value: 9 },
    { id: 2, col: 3,  row: 12, weight: 3, value: 5 },
  ];

  // Items
  this.itemGroup   = this.physics.add.staticGroup();
  this.itemSprites = {};
  this.itemGlows   = {};

  ITEM_DATA.forEach(data => {
    const item = this.itemGroup.create(data.col * T + T / 2, data.row * T + T / 2, 'item');
    item.body.setSize(16, 16); item.refreshBody();
    item.itemId = data.id;
    this.itemSprites[data.id] = item;
    this.tweens.add({
      targets: item, scaleX: 1.18, scaleY: 1.18,
      duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  });

  this._solveKnapsack(ITEM_DATA, 10);

  // Exit door — col 5, row 1
  this.exitDoor = this.physics.add.staticSprite(T * 5.5, T * 1.5, 'exit');
  this.exitDoor.body.setSize(T - 4, T - 4); this.exitDoor.refreshBody();
  this.exitDoor.setAlpha(0.35);
  this.exitLabel = this.add.text(T * 5.5, T * 1.5 - 22, 'EXIT', {
    fontSize: '9px', color: '#004d1a', fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(10);

  // Player
  this.player = this.physics.add.sprite(T * 1.5, T * 1.5, 'player');
  this.player.setCollideWorldBounds(true);
  this.player.body.setSize(16, 16);

  // Two police officers
  this.policeList = [
    this.physics.add.sprite(T * 18.5, T * 13.5, 'police'), // chaser
    this.physics.add.sprite(T * 18.5, T * 1.5,  'police'), // interceptor
  ];
  this.policeList.forEach(cop => {
    cop.setCollideWorldBounds(true);
    cop.body.setSize(18, 18);
    this.physics.add.collider(cop, this.walls);
    this.physics.add.overlap(this.player, cop, () => this._onCatch());
  });

  // ULTI lines graphics layer
  this.ultiGraphics = this.add.graphics().setDepth(50);

  this.physics.add.collider(this.player, this.walls);

  // Item pickup
  this.physics.add.overlap(this.player, this.itemGroup, (_, item) => {
    if (this.caught || this.won) return;
    this.tweens.killTweensOf(item);
    if (this.itemGlows[item.itemId]) {
      this.tweens.killTweensOf(this.itemGlows[item.itemId]);
      this.itemGlows[item.itemId].destroy();
      delete this.itemGlows[item.itemId];
    }
    item.destroy();
    this.collected++;
    this.lastItemPos = { x: this.player.x, y: this.player.y };
    this._updateItemHUD();

    if (this.collected >= 3) {
      this.tweens.killTweensOf(this.exitDoor);
      this.exitDoor.setAlpha(1);
      this.exitLabel.setColor('#00ff66');
      this.exitLabel.setText('EXIT ←');
      this.tweens.add({ targets: this.exitDoor, alpha: 0.55, duration: 450, yoyo: true, repeat: -1 });
      this.itemTxt.setText('ALL ITEMS → EXIT!');
    }
  });

  // Exit door overlap (win)
  this.physics.add.overlap(this.player, this.exitDoor, () => {
    if (this.collected >= 3 && !this.won && !this.caught) {
      this.won = true;
      const score = this.collected * 100 + this.lives * 200;
      this._end('YOU WIN!', '#33ff88', score);
    }
  });
};
