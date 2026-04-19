class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.caught    = false;
    this.won       = false;
    this.collected = 0;
    this.stamina   = 100;
    this.alertTimer = 0;

    this.lives       = 3;
    this.invincible  = false;
    this.lastItemPos = { x: T * 1.5, y: T * 1.5 };

    this.ultiUsed    = false;
    this.ultiCooldown = 0;
    this.ultraActive = false;

    this.playerSpotted = false;

    this._makeTextures();
    this._makeMap();
    this._makeEntities();
    this._makeHUD();

    this.keys = this.input.keyboard.addKeys({
      up:     'W',
      down:   'S',
      left:   'A',
      right:  'D',
      sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ulti:   'Q',
    });

    this.cameras.main
      .setBounds(0, 0, COLS * T, ROWS * T)
      .startFollow(this.player, true, 0.1, 0.1);
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

    this.invincible = true;
    this.time.delayedCall(1500, () => { this.invincible = false; });
    this.tweens.add({
      targets: this.player, alpha: 0, duration: 150,
      yoyo: true, repeat: 4,
      onComplete: () => this.player.setAlpha(1)
    });
  }

  _activateUlti() {
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
      this.ultiGraphics.clear();
    });
  }

  _end(msg, color, score = 0) {
    this.player.setVelocity(0, 0);
    this.policeList.forEach(cop => {
      cop.setVelocity(0, 0);
      cop.body.moves = false;
    });
    if (this.ultraActive) {
      this.ultraActive = false;
      this.ultiGraphics.clear();
    }

    const cx = COLS * T / 2, cy = ROWS * T / 2;
    this.add.rectangle(cx, cy, 420, 190, 0x000000, 0.93)
      .setScrollFactor(0).setDepth(200);
    this.add.text(cx, cy - 55, msg, {
      fontSize: '48px', color, fontFamily: 'monospace', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    if (score > 0) {
      this.add.text(cx, cy + 5, `SCORE: ${score}`, {
        fontSize: '22px', color: '#ffcc00', fontFamily: 'monospace'
      }).setScrollFactor(0).setDepth(201).setOrigin(0.5);
    }

    this.add.text(cx, cy + 50, 'Press  R  to restart', {
      fontSize: '14px', color: '#666688', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.input.keyboard.once('keydown-R', () => this.scene.restart());
  }

  update(time, delta) {
    if (this.caught || this.won) return;
    const dt = delta / 1000;

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

    const spd = sprinting ? 195 : 115;
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

    const pct = this.stamina / 100;
    this.stFill.setSize(150 * pct, 10);
    this.stFill.setFillStyle(pct > 0.5 ? 0x22cc55 : pct > 0.25 ? 0xffaa22 : 0xff3333);

    if (this.collected < 3) {
      this.itemTxt.setText(`ITEMS: ${this.collected} / 3`);
    }

    const minDist = Math.min(...this.policeList.map(c => Math.hypot(this.player.x - c.x, this.player.y - c.y)));
    if (minDist < 160) this.alertTimer = 2;
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
