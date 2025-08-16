// ---------------- Notlar ----------------
async function yukleNotlar() {
  try {
    const response = await fetch("notlar/notlar.json");
    const notlar = await response.json();
    const bugun = new Date().toISOString().split("T")[0];
    document.getElementById("gunun-notu").innerText = notlar[bugun] || "Bugün için not bulunamadı.";
  } catch (e) {
    document.getElementById("gunun-notu").innerText = "Notlar yüklenemedi.";
  }
}

// ---------------- Geri Sayım ----------------
function geriSayim() {
  const hedef = new Date("2027-07-31T00:00:00").getTime();
  setInterval(() => {
    const simdi = new Date().getTime();
    const fark = hedef - simdi;

    if (fark < 0) {
      document.getElementById("countdown").innerText = "Süre doldu!";
      return;
    }

    const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
    const saat = Math.floor((fark % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const dakika = Math.floor((fark % (1000 * 60 * 60)) / (1000 * 60));
    const saniye = Math.floor((fark % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerText =
      `${gun} Gün ${saat} Saat ${dakika} Dakika ${saniye} Saniye`;
  }, 1000);
}

// ---------------- Puzzle Oyun ----------------
let board = [];
let emptyIndex = 15;
let level = 1;
let maxLevel = 1;
const totalLevels = 20; // 🔑 tüm leveller görünsün

function acLevelSecim() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("puzzle").style.display = "none";
  document.getElementById("level-secim").style.display = "block";

  const container = document.getElementById("level-buttons");
  container.innerHTML = "";

  for (let i = 1; i <= totalLevels; i++) {
    let btn = document.createElement("button");
    if (i <= maxLevel) {
      btn.innerText = `Level ${i}`;
      btn.onclick = () => startPuzzle(i);
    } else {
      btn.innerText = `Level ${i} 🔒`;
      btn.disabled = true;
    }
    container.appendChild(btn);
  }
}

function startPuzzle(lvl) {
  level = lvl;
  document.getElementById("level-secim").style.display = "none";
  document.getElementById("puzzle").style.display = "block";
  document.getElementById("level-title").innerText = `Level ${level}`;
  initBoard();
}

function geriMenu() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("level-secim").style.display = "none";
}

function geriLevelSecim() {
  acLevelSecim();
}

// ---------------- Puzzle Mantığı ----------------
function initBoard() {
  const size = 4;
  board = [];
  for (let i = 0; i < size * size; i++) board.push(i);

  // karıştır
  board.sort(() => Math.random() - 0.5);

  emptyIndex = board.indexOf(15);
  renderBoard();
}

function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  for (let i = 0; i < board.length; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    if (board[i] === 15) {
      tile.classList.add("empty");
    } else {
      tile.style.backgroundImage = `url('levels/level${level}.jpg')`;

      let x = board[i] % 4;
      let y = Math.floor(board[i] / 4);
      tile.style.backgroundPosition = `-${x * 80}px -${y * 80}px`;

      tile.onclick = () => moveTile(i);
    }
    boardDiv.appendChild(tile);
  }
}

function moveTile(i) {
  const validMoves = [
    emptyIndex - 1, emptyIndex + 1,
    emptyIndex - 4, emptyIndex + 4
  ];

  if (validMoves.includes(i)) {
    [board[i], board[emptyIndex]] = [board[emptyIndex], board[i]];
    emptyIndex = i;
    renderBoard();
    if (checkWin()) {
      if (maxLevel < totalLevels) {
        maxLevel++;
      }
      acLevelSecim();
    }
  }
}

function checkWin() {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i) return false;
  }
  alert("Tebrikler 🎉 Puzzle tamamlandı!");
  return true;
}

// ---------------- Başlangıç ----------------
yukleNotlar();
geriSayim();
