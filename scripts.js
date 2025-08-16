/* ===== Yardımcı ===== */
const $ = (s)=>document.querySelector(s);
const boardDiv = $("#board");

/* ===== Günün Notu ===== */
async function yukleNotlar(){
  try{
    const r = await fetch("notlar/notlar.json", {cache:"no-store"});
    const notlar = await r.json();
    const bugun = new Date().toISOString().slice(0,10);
    $("#gunun-notu").textContent = notlar[bugun] || "Bugün için not bulunamadı.";
  }catch{
    $("#gunun-notu").textContent = "Notlar yüklenemedi.";
  }
}

/* ===== Geri Sayım ===== */
function geriSayim(){
  const hedef = new Date("2027-07-31T00:00:00").getTime();
  const el = $("#countdown");
  function tick(){
    const fark = hedef - Date.now();
    if(fark<=0){ el.textContent="Süre doldu!"; return; }
    const g=Math.floor(fark/86400000);
    const s=Math.floor((fark%86400000)/3600000);
    const d=Math.floor((fark%3600000)/60000);
    const sn=Math.floor((fark%60000)/1000);
    el.textContent = `${g} Gün ${s} Saat ${d} Dakika ${sn} Saniye`;
  }
  tick(); setInterval(tick,1000);
}

/* ===== Level Seçim / Kilit ===== */
const totalLevels = 21;                            // kaç görsel varsa ona göre ayarla
let maxLevel = parseInt(localStorage.getItem("maxLevel")||"1",10);
function setMaxLevel(v){ maxLevel = v; localStorage.setItem("maxLevel", String(v)); }

function acLevelSecim(){
  $("#menu").classList.add("hidden");
  $("#puzzle").classList.add("hidden");
  $("#level-secim").classList.remove("hidden");

  const c = $("#level-buttons"); c.innerHTML="";
  for(let i=1;i<=totalLevels;i++){
    const b=document.createElement("button");
    b.textContent = (i<=maxLevel) ? `Level ${i}` : `Level ${i} 🔒`;
    if(i<=maxLevel) b.onclick = ()=> startPuzzle(i);
    else b.disabled = true;
    c.appendChild(b);
  }
}
function geriMenu(){
  $("#level-secim").classList.add("hidden");
  $("#menu").classList.remove("hidden");
}
function geriLevelSecim(){ acLevelSecim(); }

/* ===== Puzzle (4x4 sliding) ===== */
const size = 4;
let board=[], emptyIndex=15, level=1;

function boardSizePx(){
  // CSS değişkeni ile uyumlu (min 260, %90 vmin, max 520)
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  return Math.max(260, Math.min(Math.round(vmin*0.9), 520));
}

function startPuzzle(lvl){
  level = lvl;
  $("#level-secim").classList.add("hidden");
  $("#puzzle").classList.remove("hidden");
  $("#level-title").textContent = `Level ${level}`;

  initBoard();
  renderBoard();          // ilk çizim
}

function initBoard(){
  board = Array.from({length:size*size},(_,i)=>i);  // 0..15
  // çözülebilir karıştırma: boşluğu rasgele komşularla çok kez kaydır
  emptyIndex = board.indexOf(15);
  for(let i=0;i<400;i++){
    const nb = neighborsOf(emptyIndex);
    const swapWith = nb[Math.floor(Math.random()*nb.length)];
    [board[emptyIndex], board[swapWith]] = [board[swapWith], board[emptyIndex]];
    emptyIndex = swapWith;
  }
}

function neighborsOf(i){
  const res=[]; const r=Math.floor(i/size), c=i%size;
  if(r>0) res.push(i-size);
  if(r<size-1) res.push(i+size);
  if(c>0) res.push(i-1);
  if(c<size-1) res.push(i+1);
  return res;
}

function renderBoard(){
  // tahta boyutunu ekrana göre ayarla
  const B = boardSizePx();
  boardDiv.style.setProperty('--board', `${B}px`);
  boardDiv.style.width = `${B}px`;
  boardDiv.style.height = `${B}px`;
  boardDiv.innerHTML = "";
  // parçaları yerleştir
  for(let i=0;i<board.length;i++){
    const tile = document.createElement("div");
    tile.className = "tile";
    if(board[i]===size*size-1){
      tile.classList.add("empty");
    }else{
      const x = board[i] % size;
      const y = Math.floor(board[i] / size);
      tile.style.backgroundImage = `url('levels/level${level}.jpg')`;
      tile.style.backgroundSize = `${B}px ${B}px`;
      tile.style.backgroundPosition = `-${(B/size)*x}px -${(B/size)*y}px`;
      tile.addEventListener("click", ()=> onTileClick(i));
    }
    boardDiv.appendChild(tile);
  }
}

function onTileClick(i){
  if(!neighborsOf(emptyIndex).includes(i)) return; // yan yana değil
  [board[i], board[emptyIndex]] = [board[emptyIndex], board[i]];
  emptyIndex = i;
  renderBoard();
  if(checkWin()){
    alert("Tebrikler 🎉 Puzzle tamamlandı!");
    if(maxLevel < totalLevels) setMaxLevel(maxLevel+1);
    acLevelSecim();
  }
}

function checkWin(){
  for(let i=0;i<board.length;i++){ if(board[i]!==i) return false; }
  return true;
}

// Ekran döndürme / yeniden boyutlandırmada puzzle'ı yeniden çizer
window.addEventListener("resize", ()=>{
  if(!$("#puzzle").classList.contains("hidden")) renderBoard();
});

/* ===== Başlat ===== */
yukleNotlar();
geriSayim();
