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
// STATE
// ===============================
let fill = 0;
let foam = 0;
let pouring = false;
let ended = false;
let discount = 0;

// ===============================
// HELPERS
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calculateDiscount(fill) {
  if (fill < 30) return 5;
  if (fill < 65) return 10;
  return 15;
}

function render() {
  liquidEl.style.height = fill + "%";
  foamEl.style.height = foam + "%";
}

// ===============================
// GAME FLOW
// ===============================
function resetGame() {
  fill = 0;
  foam = 0;
  ended = false;
  discount = 0;

  hintEl.textContent = "Нажмите и удерживайте «Лить», затем отпустите.";
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
// CONTROLS
// ===============================
function startPour() {
  if (ended) return;
  pouring = true;
}

function stopPour() {
  if (!pouring) return;
  pouring = false;
  endGame(); // ⬅️ ВАЖНО: заканчиваем ИМЕННО ТУТ
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
// REWARD → CRM
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
// RESTART
// ===============================
restartBtn.addEventListener("click", resetGame);

// ===============================
// LOOP
// ===============================
function tick() {
  if (!ended && pouring) {
    fill += 1.2;
    foam += 0.6;

    fill = clamp(fill, 0, 100);
    foam = clamp(foam, 0, 100);

    render();
  }
  requestAnimationFrame(tick);
}

// ===============================
// START
// ===============================
resetGame();
requestAnimationFrame(tick);
