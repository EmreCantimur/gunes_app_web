import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBw9zwUGLjMk16qKU6zkFz7IoWNSNGffss",
  authDomain: "project-1371525806305179448.firebaseapp.com",
  projectId: "project-1371525806305179448",
  storageBucket: "project-1371525806305179448.appspot.com",
  messagingSenderId: "697623565863",
  appId: "1:697623565863:web:f852470fad4397c42f6002",
  measurementId: "G-3JDB935SSD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colOzelGunler = collection(db, "ozelGunler");

const $ = (s) => document.querySelector(s);
const boardDiv = $("#board");

// --- TARİH FONKSİYONLARI ---
function getTRDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()); // Çıktı: YYYY-MM-DD
}

function getTRMonthDayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    month: "2-digit", day: "2-digit",
  }).format(new Date()); // Çıktı: MM-DD
}

// --- GÜNÜN NOTU (ÇALIŞAN VERSİYON) ---
async function yukleNotlar() {
  try {
    const bugun = getTRDateKey();
    console.log("Aranan tarih anahtarı:", bugun);

    // Cache engellemek için sonuna rastgele sayı ekledik
    const r = await fetch(`notlar/notlar.json?v=${Date.now()}`);
    if (!r.ok) throw new Error("Dosya bulunamadı");

    const notlar = await r.json();
    const mesaj = notlar[bugun];

    const el = $("#gunun-notu");
    if (el) {
      el.textContent = mesaj || ""; 
    }
  } catch (err) {
    console.warn("Not yüklenirken bir hata oluştu. Dosya yolunu kontrol et.");
  }
}

// --- GERİ SAYIM ---
function geriSayim() {
  const hedef = new Date("2027-07-31T00:00:00");
  const el = $("#countdown");
  setInterval(() => {
    const fark = hedef - new Date();
    if (fark <= 0) { el.textContent = "Geldik! 🎉"; return; }
    const g = Math.floor(fark / 86400000);
    const s = Math.floor((fark % 86400000) / 3600000);
    const d = Math.floor((fark % 3600000) / 60000);
    const sn = Math.floor((fark % 60000) / 1000);
    el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
  }, 1000);
}

// --- PUZZLE MANTIĞI ---
const totalLevels = 21;
let maxLevel = parseInt(localStorage.getItem("maxLevel") || "1", 10);
const size = 4;
let board = [], emptyIndex = 15, currentLevel = 1;

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
}

function buildLevels() {
  const c = $("#level-buttons");
  c.innerHTML = "";
  for (let i = 1; i <= totalLevels; i++) {
    const b = document.createElement("button");
    b.textContent = i <= maxLevel ? `Level ${i}` : `Level ${i} 🔒`;
    b.disabled = i > maxLevel;
    b.onclick = () => startPuzzle(i);
    c.appendChild(b);
  }
}

function startPuzzle(lvl) {
  currentLevel = lvl;
  show("puzzle");
  $("#level-title").textContent = `Level ${currentLevel}`;
  $("#win-overlay").classList.add("hidden");
  initBoard();
  renderBoard();
}

function initBoard() {
  board = Array.from({ length: 16 }, (_, i) => i);
  emptyIndex = 15;
  for (let k = 0; k < 200; k++) {
    const n = neighborsOf(emptyIndex);
    const pick = n[Math.floor(Math.random() * n.length)];
    [board[pick], board[emptyIndex]] = [board[emptyIndex], board[pick]];
    emptyIndex = pick;
  }
}

function neighborsOf(i) {
  const r = Math.floor(i / 4), c = i % 4, res = [];
  if (r > 0) res.push(i - 4);
  if (r < 3) res.push(i + 4);
  if (c > 0) res.push(i - 1);
  if (c < 3) res.push(i + 1);
  return res;
}

function renderBoard() {
  const B = Math.min(window.innerWidth * 0.9, 500);
  boardDiv.style.width = B + "px";
  boardDiv.style.height = B + "px";
  boardDiv.innerHTML = "";

  board.forEach((val, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (val === 15) {
      tile.classList.add("empty");
    } else {
      const x = val % 4, y = Math.floor(val / 4);
      tile.style.backgroundImage = `url('levels/level${currentLevel}.jpg')`;
      tile.style.backgroundSize = `${B}px ${B}px`;
      tile.style.backgroundPosition = `-${(B / 4) * x}px -${(B / 4) * y}px`;
      tile.onclick = () => {
        if (neighborsOf(emptyIndex).includes(i)) {
          [board[i], board[emptyIndex]] = [board[emptyIndex], board[i]];
          emptyIndex = i;
          renderBoard();
          if (board.every((v, idx) => v === idx)) showWin();
        }
      };
    }
    boardDiv.appendChild(tile);
  });
}

function showWin() {
  if (currentLevel === maxLevel && maxLevel < totalLevels) {
    maxLevel++;
    localStorage.setItem("maxLevel", maxLevel);
  }
  const img = $("#win-image");
  img.src = `levels/level${currentLevel}.jpg`;
  $("#win-overlay").classList.remove("hidden");
  $("#win-back").onclick = () => { show("level-secim"); buildLevels(); };
}

// --- FIRESTORE ÖZEL GÜNLER ---
function acOzelGunler() {
  show("ozel-gunler");
  const q = query(colOzelGunler, orderBy("date", "asc"));
  onSnapshot(q, snap => {
    const ul = $("#ozel-gunler-list");
    ul.innerHTML = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.innerHTML = `<span>${data.date}: ${data.text}</span> <button onclick="window.sil('${docSnap.id}')">Sil</button>`;
      ul.appendChild(li);
    });
  });
}

async function kaydetOzelGun() {
  const d = $("#ozel-date").value;
  const t = $("#ozel-text").value.trim();
  if (d && t) {
    await addDoc(colOzelGunler, { date: d, text: t, createdAt: serverTimestamp() });
    $("#ozel-date").value = ""; $("#ozel-text").value = "";
  }
}

function checkBanner() {
  const bugunMD = getTRMonthDayKey();
  onSnapshot(query(colOzelGunler), snap => {
    const matches = [];
    snap.forEach(docSnap => {
      const { date, text } = docSnap.data();
      if (date.slice(5) === bugunMD) matches.push(text);
    });
    const banner = $("#ozel-gun-banner");
    if (matches.length > 0) {
      banner.textContent = "🌸 Bugün: " + matches.join(" • ");
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  });
}

// --- BAŞLATMA ---
window.sil = async (id) => await deleteDoc(doc(colOzelGunler, id));
window.acLevelSecim = () => { buildLevels(); show("level-secim"); };
window.geriMenu = () => show("menu");
window.acOzelGunler = acOzelGunler;
window.geriLevelSecim = () => show("level-secim");

$("#ozel-ekle").onclick = kaydetOzelGun;

yukleNotlar();
geriSayim();
checkBanner();