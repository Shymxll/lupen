function _knapsackDP(items, capacity) {
  const n = items.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const it = items[i - 1];
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c];
      if (it.weight <= c && dp[i - 1][c - it.weight] + it.value > dp[i][c])
        dp[i][c] = dp[i - 1][c - it.weight] + it.value;
    }
  }
  const selected = []; let c = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][c] !== dp[i - 1][c]) { selected.push(items[i - 1].id); c -= items[i - 1].weight; }
  }
  return selected;
}

GameScene.prototype._solveKnapsack = async function(items, capacity) {
  const applyResult = (selected_ids) => {
    this.optimalIds   = selected_ids;
    this.optimalValue = items
      .filter(it => selected_ids.includes(it.id))
      .reduce((s, it) => s + it.value, 0);
    this._highlightTargets(selected_ids);
  };

  try {
    const res = await fetch('http://localhost:8000/solve-knapsack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, capacity }),
    });
    const { selected_ids } = await res.json();
    applyResult(selected_ids);
  } catch (e) {
    console.warn('Knapsack API unavailable — using local DP solver.', e.message);
    applyResult(_knapsackDP(items, capacity));
  }
};

GameScene.prototype._highlightTargets = function(ids) {
  if (!ids || ids.length === 0) return;
  ids.forEach(id => {
    const sprite = this.itemSprites[id];
    if (!sprite || !sprite.active) return;
  });
  this.targetsTxt.setText(`Hedef: ${ids.length} mücevher`);
};
