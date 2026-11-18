// scripts.js — Özel Günler (Firebase'siz Sabit + Yerel Kayıt) + Yıllık Banner + Dinamik & Kilitsiz Puzzle
// Bu dosya ES Module veya normal script olarak çağrılabilir: <script type="module" src="scripts.js"></script>

/* ===================== Sabit Özel Günler Listesi ===================== */
// Buraya eklediğin günler GitHub'a yüklediğinde hem sende hem karşı tarafta görünür.
// Format: { date: "YYYY-MM-DD", text: "Açıklama" }
const SABIT_OZEL_GUNLER = [
  { date: "2024-01-29", text: "Tanışma Yıl Dönümümüz ❤️" },
  { date: "2025-08-03", text: "Doğum Günün Kutlu Olsun Güzelim 🎂" }
];

/* ====================== Yardımcı / Seçiciler ===================== */
const $ = (s) => document.querySelector(s);
const boardDiv = $("#board");

/* ===== TR saatine göre tarih anahtarları ===== */
function getTRDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d); // YYYY-MM-DD
}
function getTRMonthDayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    month: "2-digit", day: "2-digit",
  }).format(d); // MM-DD
}

/* ===== Günün Notu (opsiyonel dosya yoksa sessiz geç) ===== */
let _currentNoteKey = null;
async function yukleNotlar(force = false) {
  try {
    const bugun = getTRDateKey();
    if (!force && _currentNoteKey === bugun) return;
    _currentNoteKey = bugun;

    const r = await fetch("notlar/notlar.json", { cache: "no-store" });
    const notlar = await r.json();
    $("#gunun-notu").textContent = notlar[bugun] || "";
  } catch { /* notlar.json yoksa görmezden gel */ }
}
setInterval(() => {
  yukleNotlar(false);
  checkBugunYillikOzelGun();
}, 60 * 1000);

/* ========================== Geri Sayım ========================== */
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

/* ========================= Ekran Geçişleri ====================== */
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
}
function geriMenu() { show("menu"); }
function acLevelSecim() { buildLevels(); show("level-secim"); }
function geriLevelSecim() { acLevelSecim(); }

/* ============== Dinamik Level Algılama & Kilitsiz Seçim ============== */
let totalLevels = 0;

function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = `${url}?t=${Date.now()}`;
  });
}

async function detectTotalLevels() {
  let count = 0;
  const batchSize = 10;

  while (true) {
    const checks = [];
    for (let i = count + 1; i <= count + batchSize; i++) {
      checks.push(checkImageExists(`levels/level${i}.jpg`));
    }
    const results = await Promise.all(checks);
    const firstMissing = results.indexOf(false);
    if (firstMissing === -1) {
      count += batchSize;
    } else {
      count += firstMissing;
      break;
    }
  }

  totalLevels = count;
  return totalLevels;
}

async function buildLevels() {
  const c = $("#level-buttons");
  c.innerHTML = "<p>Bölümler yükleniyor...</p>";

  const count = await detectTotalLevels();
  c.innerHTML = "";

  if (count === 0) {
    c.innerHTML = "<p>Henüz bölüm fotoğrafı bulunamadı.</p>";
    return;
  }

  for (let i = 1; i <= count; i++) {
    const b = document.createElement("button");
    b.textContent = `Level ${i}`;
    b.onclick = () => startPuzzle(i);
    c.appendChild(b);
  }
}

/* =========================== Puzzle ============================= */
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
  const img = document.getElementById("win-image");
  if (img) {
    img.src = `levels/level${level}.jpg`;
    img.style.width = Math.min(window.innerWidth * 0.9, 520) + "px";
    img.style.height = "auto";
  }
  const ov = document.getElementById("win-overlay");
  if (ov) ov.classList.remove("hidden");
  const back = document.getElementById("win-back");
  if (back) back.onclick = () => { if (ov) ov.classList.add("hidden"); acLevelSecim(); };
}
function checkWin() {
  for (let i = 0; i < board.length; i++) { if (board[i] !== i) return false; }
  return true;
}
window.addEventListener("resize", () => {
  if (!$("#puzzle").classList.contains("hidden")) renderBoard();
  const winImg = document.getElementById("win-image");
  const winOv  = document.getElementById("win-overlay");
  if (winImg && winOv && !winOv.classList.contains("hidden")) {
    winImg.style.width = Math.min(window.innerWidth * 0.9, 520) + "px";
  }
});

/* =================== Özel Günler (Firebase'siz) =================== */
const LOCAL_OZEL_GUNLER_KEY = "ozelGunlerLocal";
const ANNOUNCE_KEY = "lastAnniversaryAlert"; // gün içinde bir kez alert

function getLocalOzelGunler() {
  try {
    const raw = localStorage.getItem(LOCAL_OZEL_GUNLER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalOzelGunler(list) {
  localStorage.setItem(LOCAL_OZEL_GUNLER_KEY, JSON.stringify(list));
}

function getTumOzelGunler() {
  const sabitler = SABIT_OZEL_GUNLER.map((item) => ({
    date: item.date,
    text: item.text,
    sabit: true,
    localIndex: -1
  }));

  const yereller = getLocalOzelGunler().map((item, idx) => ({
    date: item.date,
    text: item.text,
    sabit: false,
    localIndex: idx
  }));

  return [...sabitler, ...yereller].sort((a, b) => a.date.localeCompare(b.date));
}

function renderOzelGunlerList() {
  const ul = $("#ozel-gunler-list");
  if (!ul) return;

  const tumGunler = getTumOzelGunler();
  ul.innerHTML = "";

  if (tumGunler.length === 0) {
    ul.innerHTML = "<li>Henüz özel gün yok. 💛</li>";
    return;
  }

  tumGunler.forEach((item) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.gap = "8px";

    const span = document.createElement("span");
    span.textContent = `${item.date}: ${item.text}`;
    li.appendChild(span);

    if (!item.sabit) {
      const del = document.createElement("button");
      del.className = "ghost";
      del.textContent = "Sil";
      del.onclick = () => {
        const guncel = getLocalOzelGunler();
        guncel.splice(item.localIndex, 1);
        saveLocalOzelGunler(guncel);
        renderOzelGunlerList();
        checkBugunYillikOzelGun();
      };
      li.appendChild(del);
    }

    ul.appendChild(li);
  });
}

function acOzelGunler() {
  show("ozel-gunler");
  renderOzelGunlerList();
}

function kaydetOzelGun() {
  const d = $("#ozel-date").value; // YYYY-MM-DD
  const t = ($("#ozel-text").value || "").trim();
  if (!d || !t) return alert("Tarih ve açıklama gerekli.");

  const mevcut = getLocalOzelGunler();
  mevcut.push({ date: d, text: t });
  saveLocalOzelGunler(mevcut);

  $("#ozel-date").value = "";
  $("#ozel-text").value = "";

  renderOzelGunlerList();
  checkBugunYillikOzelGun();
}

// Ana ekranda: yıl dönümü / özel gün kontrolü (ay-gün eşleşmesi)
function checkBugunYillikOzelGun() {
  const bugunYMD = getTRDateKey();
  const bugunMD  = getTRMonthDayKey();

  const matches = getTumOzelGunler()
    .filter((item) => typeof item.date === "string" && item.date.length === 10 && item.date.slice(5) === bugunMD)
    .map((item) => item.text);

  const banner = $("#ozel-gun-banner");
  if (!banner) return;

  banner.classList.add("hidden");
  banner.textContent = "";

  if (matches.length > 0) {
    const msg = matches.join(" • ");
    banner.classList.remove("hidden");
    banner.textContent = `🌸 Bugün özel gün: ${msg}`;

    const lastShown = localStorage.getItem(ANNOUNCE_KEY);
    if (lastShown !== bugunYMD) {
      alert(`🌸 Bugün özel gün: ${msg}`);
      localStorage.setItem(ANNOUNCE_KEY, bugunYMD);
    }
  }
}

/* ============================ Başlat ============================ */
yukleNotlar(true);
geriSayim();
checkBugunYillikOzelGun();

// Buton bağlama
const ekleBtn = $("#ozel-ekle");
if (ekleBtn) ekleBtn.addEventListener("click", kaydetOzelGun);

// Geri dönüş fonksiyonlarını global yap (HTML onclick kullanıyor)
window.geriMenu = geriMenu;
window.acLevelSecim = acLevelSecim;
window.geriLevelSecim = geriLevelSecim;
window.acOzelGunler = acOzelGunler;
