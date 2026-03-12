
const audio = {
  backgroundMusic: new Audio('audio/background-music.mp3'),
  jump: new Audio('audio/sfx_wing.mp3'),
  score: new Audio('audio/sfx_point.mp3'),
  death: new Audio('audio/sfx_die.mp3')
};


audio.backgroundMusic.loop = true;
audio.backgroundMusic.volume = 0.3;


let settings = {
  theme: 'dark',
  musicEnabled: true,
  sfxEnabled: true
};


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
  

  document.getElementById('music-toggle').checked = settings.musicEnabled;
  if (settings.musicEnabled) {
    playBackgroundMusic();
  } else {
    audio.backgroundMusic.pause();
  }
  

  document.getElementById('sfx-toggle').checked = settings.sfxEnabled;
}


function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('active');
}


function toggleTheme() {
  settings.theme = document.getElementById('theme-toggle').checked ? 'light' : 'dark';
  applySettings();
  saveSettings();
}


function toggleMusic() {
  settings.musicEnabled = document.getElementById('music-toggle').checked;
  applySettings();
  saveSettings();
}


function toggleSFX() {
  settings.sfxEnabled = document.getElementById('sfx-toggle').checked;
  saveSettings();
}


function playBackgroundMusic() {
  if (settings.musicEnabled) {
    audio.backgroundMusic.play().catch(err => {
      console.log('Background music autoplay prevented:', err);
    });
  }
}


function playSFX(sound) {
  if (settings.sfxEnabled && audio[sound]) {
    audio[sound].currentTime = 0;
    audio[sound].play().catch(err => {
      console.log('Sound effect failed:', err);
    });
  }
}


const characters = [
  { name: 'CHAI CUP',   img: 'img/tea.png' },
  { name: 'BURGER',     img: 'img/burger.png' },
  { name: 'CHIPS',      img: 'img/chips.png' },
  { name: 'SAMOSA',     img: 'img/samosa.png' },
];

let current = 0;

function buildDots() {
  const dots = document.getElementById('dots');
  dots.innerHTML = characters.map((_, i) =>
    `<div class="dot ${i === current ? 'active' : ''}" id="dot-${i}"></div>`
  ).join('');
}

function updateChar() {
  const imgEl = document.getElementById('char-img');
  const nameEl = document.getElementById('char-name');


  imgEl.style.animation = 'none';
  imgEl.offsetHeight; 
  imgEl.style.animation = '';

  imgEl.src = characters[current].img;
  nameEl.textContent = characters[current].name;

  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
  });
}

function prevChar() {
  current = (current - 1 + characters.length) % characters.length;
  updateChar();
  playSFX('jump');
}

function nextChar() {
  current = (current + 1) % characters.length;
  updateChar();
  playSFX('jump'); 
}

function openCharSelect() {
  buildDots();
  updateChar();
  document.getElementById('char-overlay').classList.add('active');
  playSFX('score'); 
}

function confirmChar() {
  const selected = characters[current];

  sessionStorage.setItem('selectedCharacter', JSON.stringify(selected));
  playSFX('score');
  

  setTimeout(() => {
    window.location.href = 'game.html';
  }, 200);
}


window.addEventListener('DOMContentLoaded', () => {
  buildDots();
  loadSettings();

  document.addEventListener('click', playBackgroundMusic, { once: true });
  document.addEventListener('touchstart', playBackgroundMusic, { once: true });
});