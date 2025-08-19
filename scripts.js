// scripts.js — Özel Günler (yıllık bildirimli, JSON'suz) + Puzzle

/* ===== Yardımcı seçici ===== */
const $ = (s) => document.querySelector(s);
const boardDiv = $("#board");

/* ===== Tarih yardımcıları (TR saati) ===== */
function getTRDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}
function getTRMonthDayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // MM-DD
}

/* ===== Günün Notu (opsiyonel; notlar yoksa sessiz geçer) ===== */
let _currentNoteKey = null;
async function yukleNotlar(force = false) {
  try {
    const bugun = getTRDateKey();
    if (!force && _currentNoteKey === bugun) return;
    _currentNoteKey = bugun;

    // notlar/notlar.json dosyan yoksa hata verir; bu catch'te sessiz geçer
    const r = await fetch("notlar/notlar.json", { cache: "no-store" });
    const notlar = await r.json();
    $("#gunun-notu").textContent = notlar[bugun] || "";
  } catch {
    // dosya yoksa veya hata varsa görmezden gel
  }
}
setInterval(() => yukleNotlar(false), 60 * 1000);

/* ===== Geri Sayım ===== */
function geriSayim() {
  const hedef = new Date("2027-07-31T00:00:00");
  const el = $("#countdown");
  function tick() {
    const fark = hedef - new Date();
    if (fark <= 0) { el.textContent = "Geldik! 🎉"; return; }
    const g  = Math.floor(fark / 86400000);
    const s  = Math.floor((fark % 86400000) / 3600000);
    const d  = Math.floor((fark % 3600000) / 60000);
    const sn = Math.floor((fark % 60000) / 1000);
    el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ===== Ekran geçişleri ===== */
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
}
function geriMenu() { show("menu"); }
function acLevelSecim() { buildLevels(); show("level-secim"); }
function geriLevelSecim() { acLevelSecim(); }

/* ===== Level Seçim / Kilit ===== */
const totalLevels = 21; // levels/level1.jpg ... level21.jpg
let maxLevel = parseInt(localStorage.getItem("maxLevel") || "1", 10);
function setMaxLevel(v) {
  if (v > maxLevel) { maxLevel = v; localStorage.setItem("maxLevel", String(v)); }
}
function buildLevels() {
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

/* ===== Puzzle (4x4 Sliding) ===== */
const size = 4;
let board = [], emptyIndex = 15, level = 1;

function boardSizePx() {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(260, Math.min(Math.round(vmin * 0.9), 520));
}
function startPuzzle(lvl) {
  const ov = document.getElementById("win-overlay");
  if (ov) ov.classList.add("hidden");

  level = lvl;
  show("puzzle");
  $("#level-title").textContent = `Level ${level}`;

  initBoard();
  renderBoard();
}
function initBoard() {
  board = Array.from({ length: size * size }, (_, i) => i);
  emptyIndex = board.length - 1;
  // Basit karışım
  for (let k = 0; k < 300; k++) {
    const n = neighborsOf(emptyIndex);
    const pick = n[Math.floor(Math.random() * n.length)];
    [board[pick], board[emptyIndex]] = [board[emptyIndex], board[pick]];
    emptyIndex = pick;
  }
}
function neighborsOf(i) {
  const r = Math.floor(i / size), c = i % size, res = [];
  if (r > 0) res.push(i - size);
  if (r < size - 1) res.push(i + size);
  if (c > 0) res.push(i - 1);
  if (c < size - 1) res.push(i + 1);
  return res;
}
function renderBoard() {
  const B = boardSizePx();
  boardDiv.style.setProperty("--board", `${B}px`);
  boardDiv.style.width  = `${B}px`;
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
  if (checkWin()) showWin();
}
function showWin() {
  if (level === maxLevel && maxLevel < totalLevels) setMaxLevel(maxLevel + 1);

  const img = document.getElementById("win-image");
  if (img) {
    img.src = `levels/level${level}.jpg`;
    img.style.width = Math.min(window.innerWidth * 0.9, 520) + "px";
    img.style.height = "auto";
  }
  const ov = document.getElementById("win-overlay");
  if (ov) ov.classList.remove("hidden");

  const back = document.getElementById("win-back");
  if (back) back.onclick = () => {
    if (ov) ov.classList.add("hidden");
    acLevelSecim();
  };
}
function checkWin() {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i) return false;
  }
  return true;
}
window.addEventListener("resize", () => {
  if (!$("#puzzle").classList.contains("hidden")) renderBoard();
  const winImg = document.getElementById("win-image");
  const winOv = document.getElementById("win-overlay");
  if (winImg && winOv && !winOv.classList.contains("hidden")) {
    winImg.style.width = Math.min(window.innerWidth * 0.9, 520) + "px";
  }
});

/* ===== Özel Günler (JSON yok — sadece uygulama içinden ekleme/silme, yıllık bildirim) ===== */
const USER_KEY = "ozelGunlerUser";             // { "YYYY-MM-DD": "Açıklama", ... }
const ANNOUNCE_KEY = "lastAnniversaryAlert";   // "YYYY-MM-DD" (gün içinde bir kez alert)

function getUserOzelGunler() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "{}"); }
  catch { return {}; }
}
function setUserOzelGunler(obj) {
  localStorage.setItem(USER_KEY, JSON.stringify(obj || {}));
}

/* Listeyi doldur */
function renderOzelGunlerList() {
  const ul = $("#ozel-gunler-list");
  if (!ul) return;

  const data = getUserOzelGunler();
  const keys = Object.keys(data).sort(); // YYYY-MM-DD sıralı
  ul.innerHTML = keys.length ? "" : "<li>Henüz özel gün yok. 💛</li>";
  keys.forEach(k => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.gap = "8px";

    const span = document.createElement("span");
    span.textContent = `${k}: ${data[k]}`;
    li.appendChild(span);

    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Sil";
    del.onclick = () => silOzelGun(k);
    li.appendChild(del);

    ul.appendChild(li);
  });
}

/* Ekle / Sil */
function kaydetOzelGun() {
  const d = $("#ozel-date").value; // YYYY-MM-DD
  const t = ($("#ozel-text").value || "").trim();
  if (!d || !t) return alert("Tarih ve açıklama gerekli.");

  const user = getUserOzelGunler();
  user[d] = t;
  setUserOzelGunler(user);

  $("#ozel-date").value = "";
  $("#ozel-text").value = "";

  renderOzelGunlerList();
  checkBugunYillikOzelGun(true);
}
function silOzelGun(tarih) {
  const user = getUserOzelGunler();
  delete user[tarih];
  setUserOzelGunler(user);

  renderOzelGunlerList();
  checkBugunYillikOzelGun(true);
}

/* Ekran aç */
function acOzelGunler() {
  show("ozel-gunler");
  renderOzelGunlerList();
}

/* Yıllık tekrar: bugünle MM-DD eşleşiyorsa banner + gün içinde bir kez alert */
function checkBugunYillikOzelGun(forceAlert = false) {
  const banner = $("#ozel-gun-banner");
  if (!banner) return;

  const bugunYMD = getTRDateKey();
  const bugunMD  = getTRMonthDayKey();
  const tum = getUserOzelGunler();

  const eslesen = [];
  for (const [ymd, aciklama] of Object.entries(tum)) {
    if (typeof ymd === "string" && ymd.length === 10 && ymd.slice(5) === bugunMD) {
      eslesen.push(aciklama);
    }
  }

  banner.classList.add("hidden");
  banner.textContent = "";

  if (eslesen.length > 0) {
    const msg = eslesen.join(" • ");
    banner.classList.remove("hidden");
    banner.textContent = `🌸 Bugün özel gün: ${msg}`;

    const lastShown = localStorage.getItem(ANNOUNCE_KEY);
    if (forceAlert || lastShown !== bugunYMD) {
      alert(`🌸 Bugün özel gün: ${msg}`);
      localStorage.setItem(ANNOUNCE_KEY, bugunYMD);
    }
  }
}

/* ===== Başlat ===== */
yukleNotlar(true);          // varsa; yoksa sessiz geçer
geriSayim();
checkBugunYillikOzelGun();

// Form buton bağlama
const ekleBtn = $("#ozel-ekle");
if (ekleBtn) ekleBtn.addEventListener("click", kaydetOzelGun);
