function astar(map, startPx, startPy, endPx, endPy) {
  const toGrid = v => Math.floor(v / T);
  const sc = toGrid(startPx), sr = toGrid(startPy);
  const ec = toGrid(endPx),   er = toGrid(endPy);

  if (map[er]?.[ec] === 1 || map[sr]?.[sc] === 1) return null;
  if (sc === ec && sr === er) return null;

  const key = (r, c) => r * COLS + c;
  const h   = (r, c) => Math.abs(r - er) + Math.abs(c - ec);

  const open   = new Map();
  const closed = new Set();
  const g      = {};
  const parent = {};

  const startKey = key(sr, sc);
  g[startKey] = 0;
  open.set(startKey, { r: sr, c: sc, f: h(sr, sc) });

  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  while (open.size) {
    let bestKey, bestF = Infinity;
    for (const [k, node] of open) {
      if (node.f < bestF) { bestF = node.f; bestKey = k; }
    }

    const { r, c } = open.get(bestKey);
    open.delete(bestKey);
    closed.add(bestKey);

    if (r === er && c === ec) {
      const path = [];
      let k = bestKey;
      while (k !== undefined) {
        const nr = Math.floor(k / COLS), nc = k % COLS;
        path.unshift({ x: nc * T + T / 2, y: nr * T + T / 2 });
        k = parent[k];
      }
      return path;
    }

    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (map[nr][nc] === 1) continue;
      const nk = key(nr, nc);
      if (closed.has(nk)) continue;
      const ng = g[bestKey] + 1;
      if (g[nk] === undefined || ng < g[nk]) {
        g[nk] = ng;
        parent[nk] = bestKey;
        open.set(nk, { r: nr, c: nc, f: ng + h(nr, nc) });
      }
    }
  }
  return null;
}
