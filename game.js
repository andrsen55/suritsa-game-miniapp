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
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// ===============================
// State
// ===============================
let fill = 0;
let foam = 0;
let pouring = false;
let ended = false;
let discount = 0;

// ===============================
// Helpers
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calculateDiscount(fill) {
  // 👉 ТОЛЬКО 10% И 15%
  if (fill < 70) return 10;
  return 15;
}

function render() {
  liquidEl.style.height = fill + "%";
  foamEl.style.height = foam + "%";
}

// ===============================
// Game flow
// ===============================
function resetGame() {
  fill = 0;
  foam = 0;
  pouring = false;
  ended = false;
  discount = 0;

  hintEl.textContent = "Наливайте. Отпустите кнопку — получите скидку.";
  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function endGame() {
  if (ended) return;
  ended = true;
  pouring = false;

  discount = calculateDiscount(fill);

  hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
  rewardBtn.textContent = `🎁 Получить ${discount}%`;
  rewardBtn.style.display = "block";
  restartBtn.style.display = "block";
  pourBtn.disabled = true;
}

// ===============================
// Controls
// ===============================
function startPour() {
  if (ended) return;
  pouring = true;
}

function stopPour() {
  if (!pouring) return;
  pouring = false;
  endGame();
}

pourBtn.addEventListener("mousedown", startPour);
window.addEventListener("mouseup", stopPour);

pourBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startPour();
}, { passive: false });

window.addEventListener("touchend", stopPour);
window.addEventListener("touchcancel", stopPour);

// ===============================
// Reward → CRM
// ===============================
rewardBtn.addEventListener("click", () => {
  const crmUrl = "https://button.amocrm.ru/ddrtwr";

  const params = new URLSearchParams({
    source: "suritsa_game",
    discount: discount
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
// Loop
// ===============================
function tick() {
  if (!ended && pouring) {
    fill += 1.4;
    foam += 0.6;

    fill = clamp(fill, 0, 100);
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
