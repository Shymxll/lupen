class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  preload() {
    this.load.image('player',   'assets/thief.png');
    this.load.image('police',   'assets/policeman.png');
    this.load.image('topaz',    'assets/topaz.png');
    this.load.image('emerald',  'assets/emerald.png');
    this.load.image('yakut',    'assets/yakut.png');
    this.load.image('sapphire', 'assets/sapphere.png');
    this.load.image('diamond',  'assets/diamond.png');
    this.load.audio('bgmusic',  'assets/Ludwig van Beethoven - Turkish March, from The Ruins of Athens (piano solo version).mp3');
  }

  create() {
    this.caught    = false;
    this.won       = false;
    this.gameStarted = false;
    this.collected   = 0;
    this.inventory   = [];
    this.totalWeight = 0;
    this.stamina     = 100;
    this.alertTimer = 0;

    this.lives       = 3;
    this.invincible  = false;
    this.lastItemPos = { x: T * 1.5, y: T * 1.5 };

    this.ultiUsed    = false;
    this.ultiCooldown = 0;
    this.ultraActive = false;

    this.fSkillUnlocked = false;
    this.fSkillUsed     = false;
    this.fSkillCooldown = 0;
    this.fActive        = false;
    this.fGlows         = {};
    this.fRings         = {};

    this.playerSpotted = false;
    this.timeLeft  = 90;
    this.doorClosed = false;

    this.optimalIds   = [];
    this.optimalValue = 0;

    this._makeTextures();
    this._makeMap();
    this._makeEntities();
    this._makeHUD();

    this.keys = this.input.keyboard.addKeys({
      up:       'W',
      down:     'S',
      left:     'A',
      right:    'D',
      sprint:   Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ulti:     'Q',
      interact: 'E',
      reveal:   'F',
    });
    this.nearbyItem    = null;
    this.collectProgress = 0;

    this.cameras.main
      .setBounds(0, 0, COLS * T, ROWS * T)
      .startFollow(this.player, true, 0.1, 0.1)
      .setZoom(2);
    this.cameras.main.ignore(this._hudObjects);

    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height).setScroll(0, 0).setName('ui');

    this.scale.on('resize', (gameSize) => {
      const w = gameSize.width, h = gameSize.height;
      this.cameras.main.setSize(w, h);
      this.uiCam.setSize(w, h);
    });
    this.uiCam.ignore([
      ...this.floorTiles,
      this.walls,
      this.itemGroup,
      this.exitDoor,
      this.exitLabel,
      this.player,
      ...this.policeList,
      this.ultiGraphics,
    ]);

    this._showPregameOverlay();
  }

  _onCatch() {
    if (this.caught || this.won || this.invincible) return;
    this.lives--;
    this._updateHeartsHUD();

    if (this.lives <= 0) {
      this.caught = true;
      this._end('GAME OVER', '#ff3344');
      return;
    }

    this.player.setPosition(this.lastItemPos.x, this.lastItemPos.y);
    this.player.setVelocity(0, 0);
    this.ultiCooldown = 0;
    this.ultiUsed = false;
    if (this.ultraActive) {
      this.ultraActive = false;
      this.ultiGraphics.clear();
      this.policeList.forEach(cop => { cop.body.moves = true; });
    }
    this._updateUltiHUD();

    if (this.fActive) {
      this.fActive = false;
      this._clearFGlows();
      this.policeList.forEach(cop => {
        if (cop._fSavedVel) { cop.body.moves = true; cop._fSavedVel = null; }
      });
    }
    this.fSkillCooldown = 0;
    this.fSkillUsed = false;
    this._updateFSkillHUD();

    this.invincible = true;
    this.time.delayedCall(1500, () => { this.invincible = false; });
    this.tweens.add({
      targets: this.player, alpha: 0, duration: 150,
      yoyo: true, repeat: 4,
      onComplete: () => this.player.setAlpha(1)
    });
  }

  _activateUlti() {
    this.cameras.main.zoomTo(1.2, 400);
    this.ultiUsed = true;
    this.ultiCooldown = 10;
    this.ultraActive = true;
    this._updateUltiHUD();

    this.policeList.forEach(cop => {
      cop._savedVel = { x: cop.body.velocity.x, y: cop.body.velocity.y };
      cop.setVelocity(0, 0);
      cop.body.moves = false;
    });

    this.time.delayedCall(2000, () => {
      if (!this.caught && !this.won) {
        this.policeList.forEach(cop => {
          cop.body.moves = true;
          cop.setVelocity(cop._savedVel.x, cop._savedVel.y);
        });
      }
      this.ultraActive = false;
      this.cameras.main.zoomTo(2, 500);
      this.ultiGraphics.clear();
    });
  }

  _closeDoor() {
    this.doorClosed = true;
    this.caught = true;
    this.timerTxt.setColor('#ff3344');
    this._end('TIME\'S UP!', '#ff3344');
  }

  _end(msg, color) {
    if (this.bgMusic) this.bgMusic.stop();
    this.player.setVelocity(0, 0);
    this.policeList.forEach(cop => {
      cop.setVelocity(0, 0);
      cop.body.moves = false;
    });
    if (this.ultraActive) {
      this.ultraActive = false;
      this.ultiGraphics.clear();
    }

    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    this.add.rectangle(cx, cy, 280, 64, 0x000000, 0.88)
      .setScrollFactor(0).setDepth(200);
    this.add.text(cx, cy, msg, {
      fontSize: '36px', color, fontFamily: 'monospace', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.time.delayedCall(700, () => {
      this._showEndOverlay(msg, this.won);
    });
  }

  _showEndOverlay(msg, won) {
    const playerValue  = this.inventory.reduce((s, it) => s + it.value, 0);
    const optimalValue = this.optimalValue || 1;
    const jewel_ratio  = Math.min(1, playerValue / optimalValue);
    const time_ratio   = won ? Math.max(0, this.timeLeft / 90) : 0;
    const finalScore   = Math.round(jewel_ratio * 600 + time_ratio * 400);
    const optimalItems = ITEM_DATA.filter(it => (this.optimalIds || []).includes(it.id));

    showEndOverlay({
      msg,
      won,
      finalScore,
      jewel_ratio,
      time_ratio,
      playerItems:  this.inventory,
      optimalItems,
      playerValue,
      optimalValue,
      timeLeft: Math.ceil(this.timeLeft),
      onRestart: () => {
        hideEndOverlay();
        this.scene.restart();
      },
    });
  }

  update(time, delta) {
    if (!this.gameStarted || this.caught || this.won) {
      this._hideCollectBar();
      return;
    }
    const dt = delta / 1000;

    // Detect nearby item via manual distance check (avoids physics timing issues)
    this.nearbyItem = null;
    this.itemGroup.getChildren().forEach(item => {
      if (item.active && Math.hypot(this.player.x - item.x, this.player.y - item.y) < 35) {
        this.nearbyItem = item;
      }
    });

    // Hold-E collection mechanic
    if (this.nearbyItem && this.keys.interact.isDown) {
      this.collectProgress += delta;
      const required = this.nearbyItem.itemWeight * 350;
      this._updateCollectBar(this.nearbyItem, this.collectProgress / required);
      if (this.collectProgress >= required) {
        const item = this.nearbyItem;
        this.nearbyItem = null;
        this.collectProgress = 0;
        this._hideCollectBar();
        this._collectItem(item);
      }
    } else {
      this.collectProgress = 0;
      this._hideCollectBar();
    }

    if (this.ultiUsed && this.ultiCooldown > 0) {
      this.ultiCooldown -= dt;
      if (this.ultiCooldown <= 0) {
        this.ultiCooldown = 0;
        this.ultiUsed = false;
        this._updateUltiHUD();
      } else {
        this._updateUltiHUD();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ulti) && !this.ultiUsed && !this.ultraActive) {
      this._activateUlti();
    }

    if (this.fSkillUsed && this.fSkillCooldown > 0) {
      this.fSkillCooldown -= dt;
      if (this.fSkillCooldown <= 0) {
        this.fSkillCooldown = 0;
        this.fSkillUsed = false;
        this._updateFSkillHUD();
      } else {
        this._updateFSkillHUD();
      }
    }

    if (this.fSkillUnlocked && !this.fSkillUsed && !this.fActive) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.reveal)) {
        this._activateReveal();
      }
    }

    if (this.ultraActive) {
      this.ultiGraphics.clear();
      this.ultiGraphics.lineStyle(2, 0xff2222, 0.85);
      this.policeList.forEach(cop => {
        const path = cop._path;
        if (!path || path.length < 2) return;
        this.ultiGraphics.beginPath();
        this.ultiGraphics.moveTo(cop.x, cop.y);
        for (let i = cop._pathIdx || 1; i < path.length; i++) {
          this.ultiGraphics.lineTo(path[i].x, path[i].y);
        }
        this.ultiGraphics.strokePath();
      });
    }

    const sprinting = this.keys.sprint.isDown && this.stamina > 0;
    this.stamina = sprinting
      ? Math.max(0, this.stamina - 28 * dt)
      : Math.min(100, this.stamina + 20 * dt);

    const wMult = Math.max(0.5, 1 - this.totalWeight / 44);
    const spd = (sprinting ? 195 : 115) * wMult;
    let vx = 0, vy = 0;
    if (this.keys.left.isDown)       vx = -1;
    else if (this.keys.right.isDown) vx =  1;
    if (this.keys.up.isDown)         vy = -1;
    else if (this.keys.down.isDown)  vy =  1;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx * spd, vy * spd);

    if (!this.ultraActive) {
      const px = this.player.x, py = this.player.y;

      this.playerSpotted = this.policeList.some(c => Math.hypot(px - c.x, py - c.y) < 200);

      this._pathTimer = (this._pathTimer || 0) + delta;
      if (this._pathTimer > 500) {
        this._pathTimer = 0;
        this.policeList.forEach((cop, i) => {
          let tx = px, ty = py;
          if (i === 1 && this.playerSpotted) {
            tx = px + this.player.body.velocity.x * 0.8;
            ty = py + this.player.body.velocity.y * 0.8;
          }
          cop._path = astar(MAP, cop.x, cop.y, tx, ty);
          cop._pathIdx = 1;
        });
      }

      const speeds = [80, 75];
      this.policeList.forEach((cop, i) => {
        const path = cop._path;
        if (!path || cop._pathIdx >= path.length) {
          cop.setVelocity(0, 0);
          return;
        }
        const target = path[cop._pathIdx];
        const dx = target.x - cop.x, dy = target.y - cop.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) { cop._pathIdx++; return; }
        cop.setVelocity((dx / dist) * speeds[i], (dy / dist) * speeds[i]);
      });
    }

    if (!this.doorClosed) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this._closeDoor();
      }
      this._updateTimerHUD();
    }

    if (!this.fSkillUnlocked && this.timeLeft <= 75) {
      this.fSkillUnlocked = true;
      this._updateFSkillHUD();
      const notif = this.add.text(
        this.scale.width / 2, this.scale.height - 60,
        'F YETENEĞİ AÇILDI!',
        { fontSize: '16px', color: '#ffdd00', fontFamily: 'monospace', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }
      ).setScrollFactor(0).setDepth(200).setOrigin(0.5);
      this.tweens.add({ targets: notif, alpha: 0, y: notif.y - 30, duration: 2500, ease: 'Quad.easeIn', onComplete: () => notif.destroy() });
    }

    const pct = this.stamina / 100;
    this.stFill.setSize(150 * pct, 10);
    this.stFill.setFillStyle(pct > 0.5 ? 0x22cc55 : pct > 0.25 ? 0xffaa22 : 0xff3333);

    this._updateWeightHUD();

    const minDist = Math.min(...this.policeList.map(c => Math.hypot(this.player.x - c.x, this.player.y - c.y)));
    if (minDist < 22) this._onCatch();
    if (minDist < 160) this.alertTimer = 2;
    if (this.bgMusic && this.bgMusic.isPlaying) {
      const targetRate = minDist < 160 ? 2 : 1;
      if (this.bgMusic.rate !== targetRate) this.bgMusic.setRate(targetRate);
    }
    if (this.alertTimer > 0) {
      this.alertTimer -= dt;
      this.alertTxt.setText('!! POLICE NEARBY !!');
      this.alertTxt.setAlpha(0.5 + 0.5 * Math.sin(time * 0.012));
      if (this.alertTimer <= 0) {
        this.alertTxt.setText('');
        this.alertTxt.setAlpha(1);
      }
    }
  }
}

GameScene.prototype._activateReveal = function() {
  const uncollected = (this.optimalIds || []).filter(
    id => this.itemSprites[id] && this.itemSprites[id].active
  );
  if (uncollected.length === 0) return;

  this.fSkillUsed = true;
  this.fSkillCooldown = 20;
  this.fActive = true;
  this._updateFSkillHUD();

  this.policeList.forEach(cop => {
    cop._fSavedVel = { x: cop.body.velocity.x, y: cop.body.velocity.y };
    cop.setVelocity(0, 0);
    cop.body.moves = false;
  });
  this.time.delayedCall(2000, () => {
    if (!this.caught && !this.won) {
      this.policeList.forEach(cop => {
        cop.body.moves = true;
        if (cop._fSavedVel) { cop.setVelocity(cop._fSavedVel.x, cop._fSavedVel.y); cop._fSavedVel = null; }
      });
    }
  });

  uncollected.forEach(id => {
    const sprite = this.itemSprites[id];
    sprite.setTint(0xffdd00);
    this.fGlows[id] = this.tweens.add({
      targets: sprite, alpha: 0.1, duration: 200,
      yoyo: true, repeat: -1, ease: 'Linear',
    });
    const ring = this.add.circle(sprite.x, sprite.y, 18, 0xffdd00, 0.55).setDepth(6);
    this.uiCam.ignore(ring);
    this.tweens.add({ targets: ring, alpha: 0, scaleX: 2.8, scaleY: 2.8, duration: 500, repeat: -1, ease: 'Quad.easeOut' });
    this.fRings[id] = ring;
  });

  this.time.delayedCall(5000, () => {
    if (this.fActive) {
      this._clearFGlows();
      this.fActive = false;
      this._updateFSkillHUD();
    }
  });
};

GameScene.prototype._clearFGlows = function() {
  Object.keys(this.fGlows).forEach(id => {
    const tw = this.fGlows[id];
    if (tw) tw.stop();
    const sp = this.itemSprites[id];
    if (sp && sp.active) { sp.setAlpha(1); sp.clearTint(); }
  });
  this.fGlows = {};
  Object.values(this.fRings).forEach(r => { if (r) r.destroy(); });
  this.fRings = {};
};

GameScene.prototype._showPregameOverlay = function() {
  this.physics.pause();
  const overlay = document.getElementById('pregame-overlay');
  overlay.style.display = 'flex';

  const list = document.getElementById('pg-jewel-list');
  list.innerHTML = '';
  const seenNames = new Set();
  ITEM_DATA.forEach(item => {
    if (seenNames.has(item.name)) return;
    seenNames.add(item.name);
    const hex = '#' + item.color.toString(16).padStart(6, '0');
    const card = document.createElement('div');
    card.className = 'jewel-card';
    card.style.borderLeftColor = hex;
    card.innerHTML =
      `<span class="jewel-dot" style="background:${hex}"></span>` +
      `<span class="jewel-name">${item.name}</span>` +
      `<span class="jewel-stat">Hacim: ${item.weight}</span>` +
      `<span class="jewel-stat">Değer: ${item.value}</span>`;
    list.appendChild(card);
  });

  document.getElementById('pregame-start-btn').onclick = () => {
    overlay.style.display = 'none';
    this.gameStarted = true;
    this.physics.resume();
    if (!this.bgMusic) {
      this.bgMusic = this.sound.add('bgmusic', { loop: true, volume: 0.7 });
    }
    this.bgMusic.play();
  };
};
