// --- Telegram WebApp helpers ---
const isTG = !!(window.Telegram && Telegram.WebApp);

if (isTG) {
  Telegram.WebApp.expand();
  Telegram.WebApp.ready();
}

// --- DOM ---
const liquidEl = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const scoreEl = document.getElementById("score");
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// --- Game state ---
let fill = 0;          // 0..100
let foam = 0;          // 0..100
let score = 0;

let pouring = false;
let wildness = 0;      // 0..100
let lastPourToggleAt = 0;

let running = true;
let ended = false;

// Tune here
const TARGET_FILL = 85;        // target line approx
const FILL_SPEED = 0.55;       // per tick while pouring
const CALM_DECAY = 0.965;      // how fast wildness calms down
const FOAM_SETTLE = 0.985;     // foam settling when not pouring

// --- Utility ---
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function setStateFromWildness(){
  if (wildness < 22) stateEl.textContent = "Calm";
  else if (wildness < 55) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function haptic(type){
  if (!isTG || !Telegram.WebApp.HapticFeedback) return;
  try{
    if (type === "success") Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    if (type === "error") Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    if (type === "light") Telegram.WebApp.HapticFeedback.impactOccurred("light");
  }catch(e){}
}

function render(){
  liquidEl.style.height = fill.toFixed(2) + "%";
  foamEl.style.height = foam.toFixed(2) + "%";
  setStateFromWildness();
}

function resetGame(){
  fill = 0;
  foam = 0;
  score = 0;
  pouring = false;
  wildness = 0;
  ended = false;

  scoreEl.textContent = "Очки: 0";
  hintEl.textContent = "Зажмите «Лить», чтобы наливать. Резко — будет пена.";

  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function endGame(){
  if (ended) return;
  ended = true;
  pouring = false;

  // score: closeness + foam penalty
  const diff = Math.abs(fill - TARGET_FILL);
  const foamPenalty = foam * 0.9;
  const raw = 100 - (diff * 1.2) - foamPenalty;

  score = Math.floor(clamp(raw, 0, 100));
  scoreEl.textContent = "Очки: " + score;

  // feedback
  if (score >= 75) {
    hintEl.textContent = "Отлично! Квас спокойный, пены мало. Забирайте скидку 👇";
    haptic("success");
  } else if (score >= 45) {
    hintEl.textContent = "Неплохо. Чуть спокойнее — и будет идеал. Можете забрать скидку 👇";
    haptic("light");
  } else {
    hintEl.textContent = "Слишком бурно — много пены. Попробуйте ещё раз 😉";
    haptic("error");
  }

  rewardBtn.style.display = "block";
  restartBtn.style.display = "block";
  pourBtn.disabled = true;
}

function onPourStart(){
  if (ended) return;
  pouring = true;

  // "living" reaction: rapid toggles increase wildness
  const now = Date.now();
  const dt = now - lastPourToggleAt;
  lastPourToggleAt = now;

  if (dt < 260) wildness += 8;      // нервный стиль
  else if (dt < 600) wildness += 4;
  else wildness += 2;

  wildness = clamp(wildness, 0, 100);
}

function onPourEnd(){
  if (ended) return;
  pouring = false;
  lastPourToggleAt = Date.now();
}

// Input (mouse + touch)
pourBtn.addEventListener("mousedown", onPourStart);
window.addEventListener("mouseup", onPourEnd);

pourBtn.addEventListener("touchstart", (e) => { e.preventDefault(); onPourStart(); }, {passive:false});
window.addEventListener("touchend", onPourEnd);
window.addEventListener("touchcancel", onPourEnd);

// Reward -> CRM
rewardBtn.addEventListener("click", () => {
  // 1) ВСТАВЬ СЮДА СВОЮ ССЫЛКУ НА ФОРМУ/ЛЕНДИНГ/AmaCRM
  const crmUrl = "https://ТВОЯ_ССЫЛКА_НА_CRM";

  // 2) Параметры, которые уйдут в ссылке
  const params = new URLSearchParams({
    source: "suritsa_game",
    score: String(score),
    state: stateEl.textContent
  });

  const url = crmUrl.includes("?") ? (crmUrl + "&" + params.toString()) : (crmUrl + "?" + params.toString());

  // Можно закрыть WebApp после перехода (по желанию)
  // if (isTG) Telegram.WebApp.close();

  window.location.href = url;
});

// Restart
restartBtn.addEventListener("click", () => resetGame());

// Main loop
function tick(){
  if (!running) return;

  if (!ended) {
    if (pouring) {
      // fill up
      fill += FILL_SPEED;

      // wildness climbs while pouring
      wildness += 0.9;

      // foam growth depends on wildness
      const foamGrow = (wildness / 100) * 1.25;
      foam += foamGrow;

    } else {
      // calm down + settle foam
      wildness *= CALM_DECAY;
      foam *= FOAM_SETTLE;
    }

    // clamp
    fill = clamp(fill, 0, 100);
    wildness = clamp(wildness, 0, 100);
    foam = clamp(foam, 0, 100);

    // auto end if overflow
    if (fill >= 100) endGame();

    render();
  }

  requestAnimationFrame(tick);
}

// start
resetGame();
requestAnimationFrame(tick);
