// ===============================
// Telegram init
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
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// ===============================
// State
// ===============================
let fill = 0;          // 0..100
let pouring = false;
let ended = false;
let discount = 10;

// ===============================
// Settings
// ===============================
const FILL_SPEED = 1.8;          // скорость налива
const DISCOUNT_THRESHOLD = 70;   // <70 = 10%, >=70 = 15%

// ===============================
// Helpers
// ===============================
function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function render() {
  if (liquidEl) {
    liquidEl.style.height = fill + "%";
  }
}

// ===============================
// Game flow
// ===============================
function resetGame() {
  fill = 0;
  pouring = false;
  ended = false;
  discount = 10;

  if (hintEl) {
    hintEl.textContent =
      "Нажмите и удерживайте «Лить». Отпустите — получите скидку.";
  }

  if (rewardBtn) rewardBtn.style.display = "none";
  if (restartBtn) restartBtn.style.display = "none";
  if (pourBtn) pourBtn.disabled = false;

  render();
}

function finishGame() {
  if (ended) return;

  ended = true;
  pouring = false;

  discount = fill >= DISCOUNT_THRESHOLD ? 15 : 10;

  if (hintEl) {
    hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
  }

  if (rewardBtn) {
    rewardBtn.textContent = `🎁 Получить ${discount}%`;
    rewardBtn.style.display = "block";
  }

  if (restartBtn) restartBtn.style.display = "block";
  if (pourBtn) pourBtn.disabled = true;
}

// ===============================
// Controls (ключевое: конец по отпусканию)
// ===============================
function startPour() {
  if (ended) return;
  pouring = true;
}

function stopPour() {
  if (!pouring || ended) return;
  pouring = false;
  finishGame();
}

if (pourBtn) {
  pourBtn.addEventListener("mousedown", startPour);
  pourBtn.addEventListener("mouseup", stopPour);
  pourBtn.addEventListener("mouseleave", stopPour);

  pourBtn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startPour();
    },
    { passive: false }
  );

  pourBtn.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      stopPour();
    },
    { passive: false }
  );

  pourBtn.addEventListener(
    "touchcancel",
    (e) => {
      e.preventDefault();
      stopPour();
    },
    { passive: false }
  );
}

window.addEventListener("mouseup", stopPour);
window.addEventListener("touchend", stopPour);
window.addEventListener("touchcancel", stopPour);

// ===============================
// Reward → AmoCRM (БЕЗ confirm, как раньше)
// ===============================
if (rewardBtn) {
  rewardBtn.addEventListener("click", () => {
    const crmUrl = "https://button.amocrm.ru/ddrtwr";

    const params = new URLSearchParams({
      source: "suritsa_game",
      discount: String(discount)
    });

    const finalUrl = crmUrl + "?" + params.toString();

    // Переход напрямую, без Telegram.openLink
    window.location.href = finalUrl;
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
  if (pouring && !ended) {
    fill = clamp(fill + FILL_SPEED);
    render();
  }
  requestAnimationFrame(tick);
}

// ===============================
// Start
// ===============================
resetGame();
requestAnimationFrame(tick);
