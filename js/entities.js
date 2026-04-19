const ITEM_DATA = [
  // Topaz ×2
  { id: 0, col: 11, row: 2,  weight: 1, value: 3,  color: 0xffdd00, name: 'Topaz'  },
  { id: 5, col: 9,  row: 3,  weight: 1, value: 3,  color: 0xffdd00, name: 'Topaz'  },
  // Zümrüt ×2
  { id: 1, col: 17, row: 7,  weight: 2, value: 6,  color: 0x00ff66, name: 'Zümrüt' },
  { id: 6, col: 5,  row: 10, weight: 2, value: 6,  color: 0x00ff66, name: 'Zümrüt' },
  // Yakut ×2
  { id: 2, col: 3,  row: 12, weight: 4, value: 9,  color: 0xff3333, name: 'Yakut'  },
  { id: 7, col: 14, row: 6,  weight: 4, value: 9,  color: 0xff3333, name: 'Yakut'  },
  // Safir ×2
  { id: 3, col: 7,  row: 8,  weight: 6, value: 13, color: 0x3399ff, name: 'Safir'  },
  { id: 8, col: 8,  row: 11, weight: 6, value: 13, color: 0x3399ff, name: 'Safir'  },
  // Elmas ×2
  { id: 4, col: 17, row: 12, weight: 9, value: 20, color: 0xffffff, name: 'Elmas'  },
  { id: 9, col: 13, row: 13, weight: 9, value: 20, color: 0xffffff, name: 'Elmas'  },
];

GameScene.prototype._makeMap = function() {
  this.walls = this.physics.add.staticGroup();
  this.floorTiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * T + T / 2, y = r * T + T / 2;
      if (MAP[r][c] === 1) {
        const w = this.walls.create(x, y, 'wall');
        w.body.setSize(T, T); w.refreshBody();
      } else {
        this.floorTiles.push(this.add.image(x, y, 'floor'));
      }
    }
  }
};

GameScene.prototype._makeEntities = function() {

  // Items
  this.itemGroup   = this.physics.add.staticGroup();
  this.itemSprites = {};
  this.itemGlows   = {};

  ITEM_DATA.forEach(data => {
    const item = this.itemGroup.create(data.col * T + T / 2, data.row * T + T / 2, 'item');
    item.body.setSize(16, 16); item.refreshBody();
    item.itemId = data.id;
    item.itemWeight = data.weight;
    item.setTint(data.color);
    this.itemSprites[data.id] = item;
  });

  this._solveKnapsack(ITEM_DATA, 22);

  // Exit door — col 5, row 1
  this.exitDoor = this.physics.add.staticSprite(T * 5.5, T * 1.5, 'exit');
  this.exitDoor.body.setSize(T - 4, T - 4); this.exitDoor.refreshBody();
  this.exitDoor.setAlpha(0.35);
  this.exitLabel = this.add.text(T * 5.5, T * 1.5 - 22, 'EXIT', {
    fontSize: '9px', color: '#004d1a', fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(10);

  // Player
  this.player = this.physics.add.sprite(T * 1.5, T * 1.5, 'player');
  this.player.setDisplaySize(34, 36);
  this.player.setCollideWorldBounds(true);
  this.player.body.setSize(16, 16);

  // Two police officers
  this.policeList = [
    this.physics.add.sprite(T * 18.5, T * 13.5, 'police'), // chaser
    this.physics.add.sprite(T * 18.5, T * 1.5,  'police'), // interceptor
  ];
  this.policeList.forEach(cop => {
    cop.setDisplaySize(34, 36);
    cop.setCollideWorldBounds(true);
    cop.body.setSize(18, 18);
    this.physics.add.collider(cop, this.walls);
  });

  // ULTI lines graphics layer
  this.ultiGraphics = this.add.graphics().setDepth(50);

  this.physics.add.collider(this.player, this.walls);

  // Exit door overlap (win) — door opens after collecting >= 3 jewels
  this.physics.add.overlap(this.player, this.exitDoor, () => {
    if (this.collected >= 3 && !this.won && !this.caught && !this.doorClosed) {
      this.won = true;
      this._end('YOU WIN!', '#33ff88');
    }
  });
};

GameScene.prototype._collectItem = function(item) {
  if (!item || !item.active) return;
  if (this.totalWeight + item.itemWeight > 22) {
    this._showBagFullWarning();
    return;
  }
  this.tweens.killTweensOf(item);
  if (this.itemGlows[item.itemId]) {
    this.tweens.killTweensOf(this.itemGlows[item.itemId]);
    this.itemGlows[item.itemId].destroy();
    delete this.itemGlows[item.itemId];
  }
  if (this.fGlows && this.fGlows[item.itemId]) {
    this.fGlows[item.itemId].stop();
    delete this.fGlows[item.itemId];
  }
  if (this.fRings && this.fRings[item.itemId]) {
    this.fRings[item.itemId].destroy();
    delete this.fRings[item.itemId];
  }
  item.destroy();
  this.collected++;
  this.inventory.push(ITEM_DATA.find(d => d.id === item.itemId));
  this.totalWeight += item.itemWeight;
  this.lastItemPos = { x: this.player.x, y: this.player.y };
  this._updateItemHUD();

  if (this.collected >= 3) {
    this.tweens.killTweensOf(this.exitDoor);
    this.exitDoor.setAlpha(1);
    this.exitLabel.setColor('#00ff66');
    this.exitLabel.setText('EXIT ←');
    this.tweens.add({ targets: this.exitDoor, alpha: 0.55, duration: 450, yoyo: true, repeat: -1 });
  }
};

GameScene.prototype._showBagFullWarning = function() {
  if (this._bagFullWarning) return;
  const cam = this.cameras.main;
  this._bagFullWarning = this.add.text(
    cam.width / 2, 80,
    'Çanta dolu!',
    { fontSize: '22px', color: '#ff3333', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }
  ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

  this.time.delayedCall(1200, () => {
    if (this._bagFullWarning) {
      this._bagFullWarning.destroy();
      this._bagFullWarning = null;
    }
  });
};
