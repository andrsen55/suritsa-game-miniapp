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
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// ===============================
// State
// ===============================
let fill = 0;        // 0..100
let foam = 0;        // 0..100
let wildness = 0;    // 0..100
let pouring = false;
let ended = false;

let discount = 10;   // 10 или 15

// ===============================
// Tuning
// ===============================
const FILL_SPEED = 1.2;       // быстрее, чтобы удобно тестировать
const FOAM_SPEED = 0.6;
const WILD_UP = 0.9;
const CALM_DECAY = 0.965;
const FOAM_SETTLE = 0.985;

// Порог скидки:
const DISCOUNT_15_THRESHOLD = 80; // >= 80% = 15%, иначе 10%

// ===============================
// Helpers
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function updateState() {
  if (!stateEl) return;
  if (wildness < 25) stateEl.textContent = "Calm";
  else if (wildness < 60) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function render() {
  if (liquidEl) liquidEl.style.height = fill.toFixed(1) + "%";
  if (foamEl) foamEl.style.height = foam.toFixed(1) + "%";
  updateState();
}

function calcDiscountByFill(fillValue) {
  return (fillValue >= DISCOUNT_15_THRESHOLD) ? 15 : 10;
}

function showResult() {
  discount = calcDiscountByFill(fill);

  if (hintEl) hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
  if (rewardBtn) {
    rewardBtn.textContent = `🎁 Получить ${discount}%`;
    rewardBtn.style.display = "block";
  }
  if (restartBtn) restartBtn.style.display = "block";
  if (pourBtn) pourBtn.disabled = true;

  ended = true;
  pouring = false;
}

function resetGame() {
  fill = 0;
  foam = 0;
  wildness = 0;
  pouring = false;
  ended = false;
  discount = 10;

  if (hintEl) hintEl.textContent = "Нажмите и удерживайте «Лить». Отпустите раньше — 10%, дольше — 15%.";
  if (rewardBtn) rewardBtn.style.display = "none";
  if (restartBtn) restartBtn.style.display = "none";
  if (pourBtn) pourBtn.disabled = false;

  render();
}

// ===============================
// Controls (ВАЖНО: завершаем по отпусканию)
// ===============================
function startPour(e) {
  if (ended) return;
  pouring = true;
}

function stopPour(e) {
  if (ended) return;
  if (!pouring) return;
  pouring = false;

  // ⬅️ ВАЖНО: заканчиваем игру именно при отпускании
  showResult();
}

// Ловим отпускание надежно: и на кнопке, и на окне
if (pourBtn) {
  pourBtn.addEventListener("mousedown", startPour);
  pourBtn.addEventListener("mouseup", stopPour);
  pourBtn.addEventListener("mouseleave", stopPour);

  pourBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startPour(e);
  }, { passive: false });

  pourBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopPour(e);
  }, { passive: false });

  pourBtn.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    stopPour(e);
  }, { passive: false });
}

window.addEventListener("mouseup", stopPour);
window.addEventListener("touchend", stopPour);
window.addEventListener("touchcancel", stopPour);

// ===============================
// Reward → CRM
// ===============================
if (rewardBtn) {
  rewardBtn.addEventListener("click", () => {
    const crmUrl = "https://button.amocrm.ru/ddrtwr";

    const params = new URLSearchParams({
      source: "suritsa_game",
      discount: String(discount),
      fill: fill.toFixed(1)
    });

    const finalUrl = crmUrl + "?" + params.toString();

    if (isTG) {
      Telegram.WebApp.openLink(finalUrl);
    } else {
      window.open(finalUrl, "_blank");
    }
  });
}

// ===============================
// Restart
// ===============================
if (restartBtn) {
  restartBtn.addEventListener("click", resetGame);
}

// ===============================
// Loop
// ===============================
function tick() {
  if (!ended && pouring) {
    fill += FILL_SPEED;
    wildness += WILD_UP;
    foam += FOAM_SPEED;

    fill = clamp(fill, 0, 100);
    wildness = clamp(wildness, 0, 100);
    foam = clamp(foam, 0, 100);

    render();

    // На всякий случай: если долил до 100 — тоже завершаем
    if (fill >= 100) showResult();
  }

  if (!ended && !pouring) {
    // лёгкое «успокоение» когда не льём
    wildness *= CALM_DECAY;
    foam *= FOAM_SETTLE;
    wildness = clamp(wildness, 0, 100);
    foam = clamp(foam, 0, 100);
    render();
  }

  requestAnimationFrame(tick);
}

// ===============================
// Start
// ===============================
resetGame();
requestAnimationFrame(tick);
