GameScene.prototype._makeTextures = function() {
  let g;

  // Floor tile
  g = this.make.graphics({ add: false });
  g.fillStyle(0x0b0b18); g.fillRect(0, 0, T, T);
  g.lineStyle(1, 0x111125, 1); g.strokeRect(0, 0, T, T);
  g.generateTexture('floor', T, T); g.destroy();

  // Wall tile
  g = this.make.graphics({ add: false });
  g.fillStyle(0x18183a); g.fillRect(0, 0, T, T);
  g.fillStyle(0x20204a); g.fillRect(2, 2, T-4, T-4);
  g.fillStyle(0x282858); g.fillRect(5, 5, T-10, T-10);
  g.lineStyle(1, 0x363688, 0.8); g.strokeRect(1, 1, T-2, T-2);
  g.generateTexture('wall', T, T); g.destroy();

  // Item — gold money bag
  g = this.make.graphics({ add: false });
  g.fillStyle(0xffee44, 0.10); g.fillCircle(12, 12, 11);
  g.fillStyle(0x996600); g.fillCircle(12, 5, 4);
  g.fillStyle(0xb87700); g.fillEllipse(12, 14, 16, 14);
  g.fillStyle(0xffaa00); g.fillEllipse(12, 13, 11, 10);
  g.fillStyle(0xffffff, 0.30); g.fillEllipse(9, 10, 5, 4);
  g.generateTexture('item', 24, 24); g.destroy();

  // Exit door — glowing green portal
  g = this.make.graphics({ add: false });
  g.fillStyle(0x001a00); g.fillRect(0, 0, T, T);
  g.fillStyle(0x004d1a); g.fillRect(3, 3, T-6, T-6);
  g.fillStyle(0x00aa44); g.fillRect(6, 6, T-12, T-12);
  g.fillStyle(0x00ff66); g.fillRect(9, 9, T-18, T-18);
  g.lineStyle(2, 0x00ff44, 1); g.strokeRect(2, 2, T-4, T-4);
  g.lineStyle(1, 0x44ffaa, 0.6); g.strokeRect(5, 5, T-10, T-10);
  g.generateTexture('exit', T, T); g.destroy();
};
