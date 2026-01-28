// Telegram WebApp init
const isTG = !!(window.Telegram && Telegram.WebApp);
if (isTG) {
  Telegram.WebApp.expand();
  Telegram.WebApp.ready();
}

// DOM
const liquidEl = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const scoreEl = document.getElementById("score");
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// Game state
let fill = 0;       // 0..100
let foam = 0;       // 0..100
let wildness = 0;   // 0..100
let pouring = false;
let ended = false;
let score = 0;

// Tune
const TARGET_FILL = 85;
const FILL_SPEED = 0.55;
const CALM_DECAY = 0.965;
const FOAM_SETTLE = 0.985;

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function haptic(type){
  if (!isTG || !Telegram.WebApp.HapticFeedback) return;
  try{
    if (type === "success") Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    if (type === "error") Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    if (type === "light") Telegram.WebApp.HapticFeedback.impactOccurred("light");
  }catch(e){}
}

function updateState(){
  if (wildness < 22) stateEl.textContent = "Calm";
  else if (wildness < 55) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function render(){
  liquidEl.style.height = fill.toFixed(2) + "%";
  foamEl.style.height = foam.toFixed(2) + "%";
  updateState();
}

function resetGame(){
  fill = 0;
  foam = 0;
  wildness = 0;
  pouring = false;
  ended = false;
  score = 0;

  scoreEl.textContent = "Очки: 0";
  hintEl.textContent = "Зажмите кнопку «Лить». Резко — будет больше пены.";

  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function endGame(){
  if (ended) return;
  ended = true;
  pouring = false;

  const diff = Math.abs(fill - TARGET_FILL);
  const foamPenalty = foam * 0.9;
  const raw = 100 - (diff * 1.2) - foamPenalty;
  score = Math.floor(clamp(raw, 0, 100));

  scoreEl.textContent = "Очки: " + score;

  if (score >= 75) {
    hintEl.textContent = "Отлично! Почти идеально. Забирайте скидку 👇";
    haptic("success");
  } else if (score >= 45) {
    hintEl.textContent = "Неплохо! Чуть спокойнее — будет идеально. Скидка доступна 👇";
    haptic("light");
  } else {
    hintEl.textContent = "Слишком бурно — много пены. Попробуйте ещё раз 🙂";
    haptic("error");
  }

  rewardBtn.style.display = "block";
  restartBtn.style.display = "block";
  pourBtn.disabled = true;
}

// Controls (mouse + touch)
function startPour(){
  if (ended) return;
  pouring = true;
  wildness += 6;
  wildness = clamp(wildness, 0, 100);
}

function stopPour(){
  pouring = false;
}

pourBtn.addEventListener("mousedown", startPour);
window.addEventListener("mouseup", stopPour);

pourBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startPour();
}, {passive:false});

window.addEventListener("touchend", stopPour);
window.addEventListener("touchcancel", stopPour);

// Reward -> AmaCRM
rewardBtn.addEventListener("click", () => {
  const crmUrl = "https://button.amocrm.ru/ddrtwr";
  const params = new URLSearchParams({
    source: "suritsa_game",
    score: String(score),
    state: stateEl.textContent
  });
  window.location.href = crmUrl + "?" + params.toString();
});

// Restart
restartBtn.addEventListener("click", resetGame);

// Loop
function tick(){
  if (!ended){
    if (pouring){
      fill += FILL_SPEED;
      wildness += 0.9;
      foam += (wildness / 100) * 1.25;
    } else {
      wildness *= CALM_DECAY;
      foam *= FOAM_SETTLE;
    }

    fill = clamp(fill, 0, 100);
    wildness = clamp(wildness, 0, 100);
    foam = clamp(foam, 0, 100);

    if (fill >= 100) endGame();

    render();
  }

  requestAnimationFrame(tick);
}

// Start
resetGame();
requestAnimationFrame(tick);
