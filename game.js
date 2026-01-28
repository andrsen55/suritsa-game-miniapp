// ===============================
// Telegram WebApp init
// ===============================
const isTG = !!(window.Telegram && Telegram.WebApp);

if (isTG) {
  Telegram.WebApp.expand();
  Telegram.WebApp.ready();
}

// ===============================
// DOM
// ===============================
const liquidEl = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const scoreEl = document.getElementById("score");
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// ===============================
// Game state
// ===============================
let fill = 0;        // 0..100
let foam = 0;        // 0..100
let wildness = 0;    // 0..100
let pouring = false;
let ended = false;

let discount = 0;   // итоговая скидка %

const TARGET_FILL = 85;
const FILL_SPEED = 0.55;
const CALM_DECAY = 0.965;
const FOAM_SETTLE = 0.985;

// ===============================
// Helpers
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getDiscountByResult(fill, foam) {
  const diff = Math.abs(fill - TARGET_FILL);

  if (diff <= 4 && foam < 10) return 15;
  if (diff <= 7 && foam < 20) return 10;
  if (diff <= 10 && foam < 30) return 5;
  return 0;
}

function setState() {
  if (wildness < 22) stateEl.textContent = "Calm";
  else if (wildness < 55) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function haptic(type) {
  if (!isTG || !Telegram.WebApp.HapticFeedback) return;
  try {
    if (type === "success") Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    if (type === "error") Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    if (type === "light") Telegram.WebApp.HapticFeedback.impactOccurred("light");
  } catch (e) {}
}

function render() {
  liquidEl.style.height = fill.toFixed(2) + "%";
  foamEl.style.height = foam.toFixed(2) + "%";
  setState();
}

// ===============================
// Game flow
// ===============================
function resetGame() {
  fill = 0;
  foam = 0;
  wildness = 0;
  pouring = false;
  ended = false;
  discount = 0;

  scoreEl.textContent = "";
  hintEl.textContent = "Зажмите кнопку «Лить». Спокойно — меньше пены.";

  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function endGame() {
  if (ended) return;
  ended = true;
  pouring = false;

  discount = getDiscountByResult(fill, foam);

  if (discount === 0) {
    hintEl.textContent = "Слишком бурно. Попробуйте ещё раз 🙂";
    haptic("error");
    restartBtn.style.display = "block";
  } else {
    hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
    rewardBtn.textContent = `🎁 Получить ${discount}%`;
    rewardBtn.style.display = "block";
    restartBtn.style.display = "block";
    haptic(discount >= 10 ? "success" : "light");
  }

  pourBtn.disabled = true;
}

// ===============================
// Controls
// ===============================
function startPour() {
  if (ended) return;
  pouring = true;
  wildness += 6;
  wildness = clamp(wildness, 0, 100);
}

function stopPour() {
  pouring = false;
}

pourBtn.addEventListener("mousedown", startPour);
window.addEventListener("mouseup", stopPour);

pourBtn.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    startPour();
  },
  { passive: false }
);

window.addEventListener("touchend", stopPour);
window.addEventListener("touchcancel", stopPour);

// ===============================
// Reward → AmaCRM → второй бот
// ===============================
rewardBtn.addEventListener("click", () => {
  const crmUrl = "https://button.amocrm.ru/ddrtwr";

  const params = new URLSearchParams({
    source: "suritsa_game",
    discount: String(discount),
    state: stateEl.textContent
  });

  const finalUrl = crmUrl + "?" + params.toString();

  if (isTG) {
    Telegram.WebApp.openLink(finalUrl);
  } else {
    window.open(finalUrl, "_blank");
  }
});

// ===============================
// Restart
// ===============================
restartBtn.addEventListener("click", resetGame);

// ===============================
// Main loop
// ===============================
function tick() {
  if (!ended) {
    if (pouring) {
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

// ===============================
// Start
// ===============================
resetGame();
requestAnimationFrame(tick);
