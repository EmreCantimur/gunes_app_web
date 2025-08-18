/* ===== Yardımcı ===== */
const $ = (s) => document.querySelector(s);
const boardDiv = $("#board");

/* ===== Türkiye Saatine Göre Tarih Anahtarı ===== */
/* en-CA + Europe/Istanbul -> "YYYY-MM-DD" formatı */
function getTRDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/* ===== Günün Notu (Yerel TR Saatiyle) ===== */
let _currentNoteKey = null;
async function yukleNotlar(force = false) {
  try {
    const bugun = getTRDateKey();
    if (!force && _currentNoteKey === bugun) return; // aynı güne tekrar yükleme
    _currentNoteKey = bugun;

    const r = await fetch("notlar/notlar.json", { cache: "no-store" });
    const notlar = await r.json();
    $("#gunun-notu").textContent = notlar[bugun] || "";
  } catch {
    // sessiz geç
  }
}

/* Gece yarısı kaçırılmasın diye her dakika kontrol */
setInterval(() => yukleNotlar(false), 60 * 1000);

/* ===== Geri Sayım (opsiyonel) ===== */
function geriSayim() {
  // Örnek hedef: 2027-07-31 00:00:00 (istemiyorsan kaldır)
  const hedef = new Date("2027-07-31T00:00:00");
  const el = $("#countdown");

  function tick() {
    const fark = hedef - new Date();
    if (fark <= 0) {
      el.textContent = "Geldik! 🎉";
      return;
    }
    const g = Math.floor(fark / 86400000);
    const s = Math.floor((fark % 86400000) / 3600000);
    const d = Math.floor((fark % 3600000) / 60000);
    const sn = Math.floor((fark % 60000) / 1000);
    el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ===== Level Seçim / Kilit ===== */
const totalLevels = 21; // levels/level1.jpg ... level21.jpg
let maxLevel = parseInt(localStorage.getItem("maxLevel") || "1", 10);
function setMaxLevel(v) {
  maxLevel = v;
  localStorage.setItem("maxLevel", String(v));
}

function acLevelSecim() {
  $("#menu").classList.add("hidden");
  $("#puzzle").classList.add("hidden");
  $("#level-secim").classList.remove("hidden");

  const c = $("#level-buttons");
  c.innerHTML = "";
  for (let i = 1; i <= totalLevels; i++) {
    const b = document.createElement("button");
    b.textContent = i <= maxLevel ? `Level ${i}` : `Level ${i} 🔒`;
    if (i <= maxLevel) b.onclick = () => startPuzzle(i);
    else b.disabled = true;
    c.appendChild(b);
  }
}
function geriMenu() {
  $("#level-secim").classList.add("hidden");
  $("#menu").classList.remove("hidden");
}
function geriLevelSecim() {
  acLevelSecim();
}

/* ===== Puzzle (4x4 Sliding) ===== */
const size = 4;
let board = [],
  emptyIndex = 15,
  level = 1;

function boardSizePx() {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(260, Math.min(Math.round(vmin * 0.9), 520));
}

function startPuzzle(lvl) {
  const ov = document.getElementById("win-overlay");
  if (ov) ov.classList.add("hidden");

  level = lvl;
  $("#level-secim").classList.add("hidden");
  $("#puzzle").classList.remove("hidden");
  $("#level-title").textContent = `Level ${level}`;

  initBoard();
  renderBoard();
}

function initBoard() {
  board = Array.from({ length: size * size }, (_, i) => i);
  emptyIndex = board.length - 1;
  // Basit karışım (çözülebilirlik kontrolü olmadan)
  for (let k = 0; k < 300; k++) {
    const n = neighborsOf(emptyIndex);
    const pick = n[Math.floor(Math.random() * n.length)];
    [board[pick], board[emptyIndex]] = [board[emptyIndex], board[pick]];
    emptyIndex = pick;
  }
}

function neighborsOf(i) {
  const r = Math.floor(i / size);
  const c = i % size;
  const res = [];
  if (r > 0) res.push(i - size);
  if (r < size - 1) res.push(i + size);
  if (c > 0) res.push(i - 1);
  if (c < size - 1) res.push(i + 1);
  return res;
}

function renderBoard() {
  const B = boardSizePx();
  boardDiv.style.setProperty("--board", `${B}px`);
  boardDiv.style.width = `${B}px`;
  boardDiv.style.height = `${B}px`;
  boardDiv.innerHTML = "";

  for (let i = 0; i < board.length; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (board[i] === size * size - 1) {
      tile.classList.add("empty");
    } else {
      const x = board[i] % size;
      const y = Math.floor(board[i] / size);
      tile.style.backgroundImage = `url('levels/level${level}.jpg')`;
      tile.style.backgroundSize = `${B}px ${B}px`;
      tile.style.backgroundPosition = `-${(B / size) * x}px -${(B / size) * y}px`;
      tile.addEventListener("click", () => onTileClick(i));
    }
    boardDiv.appendChild(tile);
  }
}

function onTileClick(i) {
  if (!neighborsOf(emptyIndex).includes(i)) return;
  [board[i], board[emptyIndex]] = [board[emptyIndex], board[i]];
  emptyIndex = i;
  renderBoard();
  if (checkWin()) {
    showWin();
  }
}

function showWin() {
  // Bir sonraki leveli aç
  if (maxLevel < totalLevels) setMaxLevel(maxLevel + 1);

  // Tam görseli göster
  const img = document.getElementById("win-image");
  img.src = `levels/level${level}.jpg`;
  img.style.width = Math.min(window.innerWidth*0.9, 520) + 'px';
  img.style.height = 'auto';

  document.getElementById("win-overlay").classList.remove("hidden");

  // Buton: level seçimine dön
  document.getElementById("win-back").onclick = () => {
    document.getElementById("win-overlay").classList.add("hidden");
    acLevelSecim();
  };
}

function checkWin() {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i) return false;
  }
  return true;
}

// Yeniden boyutlandırmada tahtayı yeniden çiz
window.addEventListener("resize", () => {
  if (!$("#puzzle").classList.contains("hidden")) renderBoard();
});

/* ===== Başlat ===== */
yukleNotlar(true);
geriSayim();

// Tamamlanan görseli, pencere yeniden boyutlanınca da uygun ölçüye getir
window.addEventListener("resize", () => {
  const winImg = document.getElementById("win-image");
  const winOv = document.getElementById("win-overlay");
  if (winImg && winOv && !winOv.classList.contains("hidden")) {
    winImg.style.width = Math.min(window.innerWidth*0.9, 520) + "px";
  }
});
