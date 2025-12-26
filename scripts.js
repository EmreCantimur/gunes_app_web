import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

// Tarih Anahtarı (YYYY-MM-DD)
function getTRDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

// Günün Notunu Yükle
async function yukleNotlar() {
  const bugun = getTRDateKey();
  try {
    // Klasör içindeki notlar.json'a gider
    const r = await fetch(`notlar/notlar.json?v=${Date.now()}`); 
    if (!r.ok) throw new Error("Dosya bulunamadı");
    
    const notlar = await r.json();
    const mesaj = notlar[bugun];
    
    const el = $("#gunun-notu");
    if (el) {
      el.textContent = mesaj || ""; 
    }
  } catch (err) {
    console.error("Notlar yüklenemedi:", err);
  }
}

// Geri Sayım
function geriSayim() {
  const hedef = new Date("2027-07-31T00:00:00");
  const el = $("#countdown");
  setInterval(() => {
    const fark = hedef - new Date();
    if (fark <= 0) { if(el) el.textContent = "Geldik! 🎉"; return; }
    const g = Math.floor(fark / 86400000);
    const s = Math.floor((fark % 86400000) / 3600000);
    const d = Math.floor((fark % 3600000) / 60000);
    const sn = Math.floor((fark % 60000) / 1000);
    if(el) el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
  }, 1000);
}

// ... (Buradan sonrası senin orijinal Puzzle ve Özel Günler kodlarınla aynı kalabilir) ...
// Ancak eksik fonksiyonları tamamlamak için aşağıdakileri kontrol et:

window.acLevelSecim = () => { buildLevels(); show("level-secim"); };
window.geriMenu = () => show("menu");
window.acOzelGunler = () => { show("ozel-gunler"); listeleOzelGunler(); };
window.geriLevelSecim = () => show("level-secim");

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  $("#" + id).classList.remove("hidden");
}

// Başlat
yukleNotlar();
geriSayim();
// (Firebase onSnapshot dinleyicilerini de buraya ekleyebilirsin)