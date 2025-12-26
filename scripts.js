/* ====================== Seçiciler ===================== */
const $ = (s) => document.querySelector(s);

/* ===== TR Saatiyle Tarih (YYYY-MM-DD) ===== */
function getTRDateKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
        year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
}

/* ========================== Günün Notu ========================== */
async function yukleNotlar() {
    const el = $("#gunun-notu");
    const bugun = getTRDateKey();
    console.log("Bugünün Tarihi:", bugun);

    try {
        // Notlar klasöründeki dosyayı çeker, cache engellemek için sonuna tarih ekler
        const r = await fetch(`notlar/notlar.json?v=${Date.now()}`);
        if (!r.ok) throw new Error("Dosya bulunamadı");

        const notlar = await r.json();
        const mesaj = notlar[bugun];

        if (el) {
            el.textContent = mesaj || "Bugün için henüz bir not yazılmamış. ❤️";
        }
    } catch (err) {
        console.error("Not yükleme hatası:", err);
        if (el) el.textContent = "Notlar yüklenirken bir sorun oluştu.";
    }
}

/* ========================== Geri Sayım ========================== */
function geriSayim() {
    const hedef = new Date("2027-07-31T00:00:00");
    const el = $("#countdown");
    
    function guncelle() {
        const fark = hedef - new Date();
        if (fark <= 0) { if(el) el.textContent = "Geldik! 🎉"; return; }
        const g = Math.floor(fark / 86400000);
        const s = Math.floor((fark % 86400000) / 3600000);
        const d = Math.floor((fark % 3600000) / 60000);
        const sn = Math.floor((fark % 60000) / 1000);
        if(el) el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
    }
    guncelle();
    setInterval(guncelle, 1000);
}

/* ========================= Ekran Geçişleri ====================== */
function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    $("#" + id).classList.remove("hidden");
}

window.geriMenu = () => show("menu");
window.acLevelSecim = () => { buildLevels(); show("level-secim"); };
window.acOzelGunler = () => show("ozel-gunler");
window.geriLevelSecim = () => show("level-secim");

/* =================== Puzzle Mantığı ================= */
let maxLevel = parseInt(localStorage.getItem("maxLevel") || "1", 10);

function buildLevels() {
    const c = $("#level-buttons");
    c.innerHTML = "";
    for (let i = 1; i <= 21; i++) {
        const b = document.createElement("button");
        b.className = "primary";
        b.textContent = i <= maxLevel ? `Level ${i}` : `Level ${i} 🔒`;
        if (i <= maxLevel) b.onclick = () => startPuzzle(i); else b.disabled = true;
        c.appendChild(b);
    }
}

function startPuzzle(lvl) {
    show("puzzle");
    $("#level-title").textContent = `Level ${lvl}`;
    // Puzzle başlama fonksiyonlarını buraya ekleyebilirsin
}

/* ============================ Başlat ============================ */
window.onload = () => {
    yukleNotlar();
    geriSayim();
};