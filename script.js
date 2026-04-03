const API_BASE = 'http://127.0.0.1:8000';

let settings = { theme: 'dark' };

function loadSettings() {
  const saved = localStorage.getItem('chaiiwalaBirdSettings');
  if (saved) {
    settings = JSON.parse(saved);
    applySettings();
  }
}

function saveSettings() {
  localStorage.setItem('chaiiwalaBirdSettings', JSON.stringify(settings));
  sessionStorage.setItem('gameSettings', JSON.stringify(settings));
}

function applySettings() {
  if (settings.theme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('theme-toggle').checked = true;
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-toggle').checked = false;
  }
}

function toggleSettings() {
  document.getElementById('settings-panel').classList.toggle('active');
}

function toggleTheme() {
  settings.theme = document.getElementById('theme-toggle').checked ? 'light' : 'dark';
  applySettings();
  saveSettings();
}

// ── NAME ENTRY ──────────────────────────────────────────────────────────────

function openNameEntry() {
  const savedName = localStorage.getItem('playerName');
  if (savedName) {
    sessionStorage.setItem('playerName', savedName);
    openCharSelect();
    return;
  }
  const overlay = document.getElementById('name-overlay');
  overlay.classList.add('active');
  setTimeout(() => document.getElementById('player-name-input').focus(), 300);
}

function confirmName() {
  const input = document.getElementById('player-name-input');
  const name = input.value.trim();
  if (!name) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 500);
    input.placeholder = 'NAME CANNOT BE EMPTY!';
    return;
  }
  localStorage.setItem('playerName', name);
  sessionStorage.setItem('playerName', name);
  document.getElementById('name-overlay').classList.remove('active');
  openCharSelect();
}

window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  buildCharGrid();

  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirmName();
    });
  }
});

// ── CHARACTER SELECT ─────────────────────────────────────────────────────────

const characters = [
  { name: 'CHAI CUP', img: 'img/tea.png' },
  { name: 'MASCOT',   img: 'img/mascot.png' },
];

let current = 0;

function buildCharGrid() {
  const grid = document.getElementById('char-grid');
  if (!grid) return;

  grid.innerHTML = characters.map((char, i) => `
    <div class="char-tile ${i === current ? 'selected' : ''}" onclick="selectChar(${i})">
      <img src="${char.img}" alt="${char.name}" class="char-tile-img">
      <div class="char-tile-name">${char.name}</div>
    </div>
  `).join('');
}

function selectChar(index) {
  current = index;
  document.querySelectorAll('.char-tile').forEach((tile, i) => {
    tile.classList.toggle('selected', i === current);
  });
}

function openCharSelect() {
  buildCharGrid();
  document.getElementById('char-overlay').classList.add('active');
}

function confirmChar() {
  sessionStorage.setItem('selectedCharacter', JSON.stringify(characters[current]));
  setTimeout(() => { window.location.href = 'game.html'; }, 200);
}

// ── LEADERBOARD ──────────────────────────────────────────────────────────────

async function openLeaderboard() {
  document.getElementById('leaderboard-overlay').classList.add('active');
  await fetchLeaderboard();
}

function closeLeaderboard() {
  document.getElementById('leaderboard-overlay').classList.remove('active');
}

async function fetchLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '<div class="lb-loading">☕ Loading...</div>';

  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();

    if (!data || data.length === 0) {
      list.innerHTML = '<div class="lb-loading">No scores yet. Be the first!</div>';
      return;
    }

    const currentPlayer = localStorage.getItem('playerName') || '';

    list.innerHTML = data.map((entry, i) => {
      const rank = i + 1;
      const isMe = entry.name === currentPlayer;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      return `
        <div class="lb-row ${isMe ? 'lb-row-me' : ''} ${rank <= 3 ? 'lb-row-top' : ''}">
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${escapeHtml(entry.name)}</span>
          <span class="lb-score">${entry.score}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = '<div class="lb-loading lb-error">⚠ Could not reach server</div>';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}