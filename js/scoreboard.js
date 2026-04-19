const SCORE_KEY = 'lupen_scores';

function getScores() {
  return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
}

function saveScore({ name, score, jewelPct, timePct, won, date }) {
  const scores = getScores();
  scores.push({ name, score, jewelPct, timePct, won, date });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 20)));
}

function renderScoreboard() {
  const tbody = document.querySelector('#scoreboard-table tbody');
  if (!tbody) return;
  const scores = getScores();
  tbody.innerHTML = '';
  if (scores.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" style="text-align:center;color:#555">Henüz skor yok</td>';
    tbody.appendChild(tr);
    return;
  }
  scores.forEach((entry, i) => {
    const tr = document.createElement('tr');
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    tr.innerHTML =
      `<td>${medal}</td>` +
      `<td class="sb-name">${entry.name || '—'}</td>` +
      `<td class="sb-score">${entry.score}</td>` +
      `<td>${entry.jewelPct}%</td>` +
      `<td>${entry.timePct}%</td>` +
      `<td class="${entry.won ? 'sb-win' : 'sb-lose'}">${entry.won ? 'K' : 'X'}</td>`;
    tbody.appendChild(tr);
  });
}

function showEndOverlay({ msg, won, finalScore, jewel_ratio, time_ratio,
                          playerItems, optimalItems, playerValue, optimalValue,
                          timeLeft, onRestart }) {
  const overlay = document.getElementById('endgame-overlay');
  if (!overlay) return;

  document.getElementById('end-title').textContent = msg;
  document.getElementById('end-title').className =
    'end-title ' + (won ? 'end-win' : 'end-lose');

  const jewelPct = Math.round(jewel_ratio * 100);
  const timePct  = Math.round(time_ratio  * 100);

  // Player jewels
  const playerList = document.getElementById('end-player-list');
  playerList.innerHTML = playerItems.length === 0
    ? '<span class="end-empty">Hiç mücevher toplanmadı</span>'
    : playerItems.map(it => {
        const hex = '#' + it.color.toString(16).padStart(6, '0');
        return `<span class="end-jewel-tag" style="border-color:${hex}">` +
               `<span class="end-jewel-dot" style="background:${hex}"></span>` +
               `${it.name} <em>(+${it.value})</em></span>`;
      }).join('');

  const playerTotal = document.getElementById('end-player-total');
  playerTotal.textContent = `Toplam değer: ${playerValue}`;

  // Optimal jewels
  const optList = document.getElementById('end-optimal-list');
  optList.innerHTML = optimalItems.map(it => {
    const hex = '#' + it.color.toString(16).padStart(6, '0');
    return `<span class="end-jewel-tag" style="border-color:${hex}">` +
           `<span class="end-jewel-dot" style="background:${hex}"></span>` +
           `${it.name} <em>(+${it.value})</em></span>`;
  }).join('');

  const optTotal = document.getElementById('end-optimal-total');
  optTotal.textContent = `Toplam değer: ${optimalValue}`;

  // Score breakdown
  document.getElementById('end-jewel-pct').textContent  = `Mücevher verimliliği: ${jewelPct}%`;
  document.getElementById('end-time-pct').textContent   = `Süre bonusu: ${timePct}%${won ? ` (${timeLeft}s kaldı)` : ' (kazanılmadı)'}`;
  document.getElementById('end-final-score').textContent = `SKOR: ${finalScore} / 1000`;

  overlay.dataset.score     = finalScore;
  overlay.dataset.jewelPct  = jewelPct;
  overlay.dataset.timePct   = timePct;
  overlay.dataset.won       = won ? '1' : '0';

  const saveBtn = document.getElementById('end-save-btn');
  saveBtn.onclick = () => {
    const name = document.getElementById('end-name-input').value.trim() || 'Anonim';
    saveScore({
      name,
      score:    finalScore,
      jewelPct,
      timePct,
      won,
      date: new Date().toLocaleDateString('tr-TR'),
    });
    saveBtn.textContent = 'Kaydedildi ✓';
    saveBtn.disabled = true;
  };

  document.getElementById('end-scoreboard-btn').onclick = () => {
    renderScoreboard();
    document.getElementById('scoreboard-overlay').style.display = 'flex';
  };

  document.getElementById('end-restart-btn').onclick = onRestart;

  document.addEventListener('keydown', function onR(e) {
    if (e.key === 'r' || e.key === 'R') {
      document.removeEventListener('keydown', onR);
      onRestart();
    }
  });

  overlay.style.display = 'flex';
}

function hideEndOverlay() {
  const overlay = document.getElementById('endgame-overlay');
  if (overlay) overlay.style.display = 'none';
  const sb = document.getElementById('scoreboard-overlay');
  if (sb) sb.style.display = 'none';
  const nameInput = document.getElementById('end-name-input');
  if (nameInput) nameInput.value = '';
  const saveBtn = document.getElementById('end-save-btn');
  if (saveBtn) { saveBtn.textContent = 'Skoru Kaydet'; saveBtn.disabled = false; }
}
