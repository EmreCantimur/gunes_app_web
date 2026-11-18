// scripts.js — Özel Günler (Firebase'siz + Kalem ile Güncelle/Sil) + Yıllık Banner + Dinamik & Kilitsiz Puzzle
// Bu dosya ES Module veya normal script olarak çağrılabilir: <script type="module" src="scripts.js"></script>

/* ===================== Sabit Özel Günler Listesi ===================== */
// Buraya eklediğin günler GitHub'a yüklediğinde hem sende hem karşı tarafta otomatik görünür.
// Uygulama içindeki kalem (✏️) butonundan bu günleri de güncelleyebilir veya silebilirsin.
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
    const el = $("#gunun-notu");
    if (el) el.textContent = notlar[bugun] || "";
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
  if (!el) return;
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
  const target = $("#" + id);
  if (target) target.classList.remove("hidden");
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
  if (!c) return;
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
  const title = $("#level-title");
  if (title) title.textContent = `Level ${level}`;

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
  if (!boardDiv) return;
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
  const puzzleEl = $("#puzzle");
  if (puzzleEl && !puzzleEl.classList.contains("hidden")) renderBoard();
  const winImg = document.getElementById("win-image");
  const winOv  = document.getElementById("win-overlay");
  if (winImg && winOv && !winOv.classList.contains("hidden")) {
    winImg.style.width = Math.min(window.innerWidth * 0.9, 520) + "px";
  }
});

/* =================== Özel Günler (Firebase'siz + Kalem Düzenleme) =================== */
const LOCAL_OZEL_GUNLER_KEY = "ozelGunlerDataV2";
const SEEDED_KEYS_STORAGE   = "ozelGunlerSeededV2";
const ANNOUNCE_KEY          = "lastAnniversaryAlert";

let ozelEditMode = false;   // Kalem butonuna basılınca açılır
let editingItemId = null;   // O an satır içinde düzenlenen kaydın ID'si

function generateId() {
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function initOzelGunlerStorage() {
  let list = [];
  let seeded = [];

  try {
    const rawList = localStorage.getItem(LOCAL_OZEL_GUNLER_KEY);
    list = rawList ? JSON.parse(rawList) : [];
    if (!Array.isArray(list)) list = [];
  } catch { list = []; }

  try {
    const rawSeeded = localStorage.getItem(SEEDED_KEYS_STORAGE);
    seeded = rawSeeded ? JSON.parse(rawSeeded) : [];
    if (!Array.isArray(seeded)) seeded = [];
  } catch { seeded = []; }

  let changed = false;
  SABIT_OZEL_GUNLER.forEach((item) => {
    const seedKey = `${item.date}|${item.text}`;
    if (!seeded.includes(seedKey)) {
      list.push({ id: generateId(), date: item.date, text: item.text });
      seeded.push(seedKey);
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(LOCAL_OZEL_GUNLER_KEY, JSON.stringify(list));
    localStorage.setItem(SEEDED_KEYS_STORAGE, JSON.stringify(seeded));
  }
}

function getTumOzelGunler() {
  initOzelGunlerStorage();
  try {
    const raw = localStorage.getItem(LOCAL_OZEL_GUNLER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

function saveTumOzelGunler(list) {
  localStorage.setItem(LOCAL_OZEL_GUNLER_KEY, JSON.stringify(list));
}

function updatePencilButtonState() {
  const btn = $("#ozel-duzenle-toggle");
  if (!btn) return;
  btn.textContent = ozelEditMode ? "✔️" : "✏️";
  btn.title = ozelEditMode ? "Düzenlemeyi Bitir" : "Günleri Düzenle";
  btn.style.opacity = ozelEditMode ? "1" : "0.85";
}

function toggleOzelEditMode(e) {
  if (e) e.preventDefault();
  ozelEditMode = !ozelEditMode;
  if (!ozelEditMode) editingItemId = null;
  updatePencilButtonState();
  renderOzelGunlerList();
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
    li.style.flexWrap = "wrap";
    li.style.gap = "8px";

    // Satır içi güncelleme formu açık ise:
    if (ozelEditMode && editingItemId === item.id) {
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = item.date;
      dateInput.style.flex = "0 0 auto";

      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = item.text;
      textInput.style.flex = "1 1 140px";

      const actionWrap = document.createElement("div");
      actionWrap.style.display = "flex";
      actionWrap.style.gap = "6px";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.textContent = "Kaydet";
      saveBtn.onclick = () => {
        const yeniTarih = dateInput.value;
        const yeniMetin = textInput.value.trim();
        if (!yeniTarih || !yeniMetin) return alert("Tarih ve açıklama boş bırakılamaz.");

        const guncel = getTumOzelGunler().map((g) =>
          g.id === item.id ? { ...g, date: yeniTarih, text: yeniMetin } : g
        );
        saveTumOzelGunler(guncel);
        editingItemId = null;
        renderOzelGunlerList();
        checkBugunYillikOzelGun();
      };

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "ghost";
      cancelBtn.textContent = "İptal";
      cancelBtn.onclick = () => {
        editingItemId = null;
        renderOzelGunlerList();
      };

      actionWrap.appendChild(saveBtn);
      actionWrap.appendChild(cancelBtn);

      li.appendChild(dateInput);
      li.appendChild(textInput);
      li.appendChild(actionWrap);
      ul.appendChild(li);
      return;
    }

    // Normal satır görünümü:
    const span = document.createElement("span");
    span.textContent = `${item.date}: ${item.text}`;
    li.appendChild(span);

    // Kalem (✏️) modundaysa Güncelle ve Sil seçeneklerini göster:
    if (ozelEditMode) {
      const btnGroup = document.createElement("div");
      btnGroup.style.display = "flex";
      btnGroup.style.gap = "6px";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "ghost";
      editBtn.textContent = "Güncelle";
      editBtn.onclick = () => {
        editingItemId = item.id;
        renderOzelGunlerList();
      };

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "ghost";
      delBtn.textContent = "Sil";
      delBtn.onclick = () => {
        const guncel = getTumOzelGunler().filter((g) => g.id !== item.id);
        saveTumOzelGunler(guncel);
        if (editingItemId === item.id) editingItemId = null;
        renderOzelGunlerList();
        checkBugunYillikOzelGun();
      };

      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);
      li.appendChild(btnGroup);
    }

    ul.appendChild(li);
  });
}

function acOzelGunler() {
  ozelEditMode = false;
  editingItemId = null;
  updatePencilButtonState();
  show("ozel-gunler");
  renderOzelGunlerList();
}

function kaydetOzelGun(e) {
  if (e) e.preventDefault();
  const dateEl = $("#ozel-date");
  const textEl = $("#ozel-text");
  if (!dateEl || !textEl) return;

  const d = dateEl.value; // YYYY-MM-DD
  const t = (textEl.value || "").trim();
  if (!d || !t) return alert("Tarih ve açıklama gerekli.");

  const mevcut = getTumOzelGunler();
  mevcut.push({ id: generateId(), date: d, text: t });
  saveTumOzelGunler(mevcut);

  dateEl.value = "";
  textEl.value = "";

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
initOzelGunlerStorage();
yukleNotlar(true);
geriSayim();
checkBugunYillikOzelGun();

// Ekle butonu ve yanına Kalem (✏️) düzenleme butonunu yerleştir
const ekleBtn = $("#ozel-ekle");
if (ekleBtn) {
  ekleBtn.type = "button";
  ekleBtn.addEventListener("click", kaydetOzelGun);

  if (!$("#ozel-duzenle-toggle")) {
    const pencilBtn = document.createElement("button");
    pencilBtn.type = "button";
    pencilBtn.id = "ozel-duzenle-toggle";
    pencilBtn.className = "ghost";
    pencilBtn.textContent = "✏️";
    pencilBtn.title = "Günleri Düzenle";
    pencilBtn.setAttribute("aria-label", "Günleri Düzenle");
    pencilBtn.style.marginLeft = "6px";
    pencilBtn.addEventListener("click", toggleOzelEditMode);
    ekleBtn.insertAdjacentElement("afterend", pencilBtn);
  }
}

// Geri dönüş fonksiyonlarını global yap (HTML onclick kullanıyor)
window.geriMenu = geriMenu;
window.acLevelSecim = acLevelSecim;
window.geriLevelSecim = geriLevelSecim;
window.acOzelGunler = acOzelGunler;