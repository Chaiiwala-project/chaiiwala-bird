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

    // Re-trigger animation
    imgEl.style.animation = 'none';
    imgEl.offsetHeight; // reflow
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
    // Pass selected character to game — store in sessionStorage
    sessionStorage.setItem('selectedCharacter', JSON.stringify(selected));
    // Navigate to game
    window.location.href = 'game.html';
  }

  buildDots();