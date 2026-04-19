GameScene.prototype._solveKnapsack = async function(items, capacity) {
  try {
    const res = await fetch('http://localhost:8000/solve-knapsack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, capacity }),
    });
    const { selected_ids } = await res.json();
    this._highlightTargets(selected_ids);
  } catch (e) {
    console.warn('Knapsack API unavailable — targets not highlighted.', e.message);
  }
};

GameScene.prototype._highlightTargets = function(ids) {
  if (!ids || ids.length === 0) return;
  ids.forEach(id => {
    const sprite = this.itemSprites[id];
    if (!sprite || !sprite.active) return;
    sprite.setTint(0x44ffff);
    const ring = this.add.circle(sprite.x, sprite.y, 14, 0x00eeff, 0.45).setDepth(5);
    this.tweens.add({
      targets: ring, alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 900, repeat: -1, ease: 'Quad.easeOut',
    });
    this.itemGlows[id] = ring;
  });
  this.targetsTxt.setText(`Targets: ${ids.length} item${ids.length !== 1 ? 's' : ''}`);
};
