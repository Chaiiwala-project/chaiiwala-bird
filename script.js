let settings = {
  theme: 'dark',

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

}

function nextChar() {
  current = (current + 1) % characters.length;
  updateChar();

}

function openCharSelect() {
  buildDots();
  updateChar();
  document.getElementById('char-overlay').classList.add('active');

}

function confirmChar() {
  const selected = characters[current];

  sessionStorage.setItem('selectedCharacter', JSON.stringify(selected));

  

  setTimeout(() => {
    window.location.href = 'game.html';
  }, 200);
}


window.addEventListener('DOMContentLoaded', () => {
  buildDots();
  loadSettings();

});