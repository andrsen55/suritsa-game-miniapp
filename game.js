// Telegram init
const isTG = !!(window.Telegram && Telegram.WebApp);
if (isTG) {
  Telegram.WebApp.expand();
  Telegram.WebApp.ready();
}

// DOM
const liquidEl = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const hintEl = document.getElementById("hint");

const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");
const restartBtn = document.getElementById("restartBtn");

// State
let fill = 0;
let pouring = false;
let ended = false;
let discount = 10;

// Settings
const FILL_SPEED = 1.6;
const DISCOUNT_THRESHOLD = 75;

// Helpers
function clamp(v) {
  return Math.max(0, Math.min(100, v));
}

function render() {
  liquidEl.style.height = fill + "%";
}

function resetGame() {
  fill = 0;
  pouring = false;
  ended = false;
  discount = 10;

  hintEl.textContent =
    "Нажмите и удерживайте «Лить». Отпустите — получите скидку.";

  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function finishGame() {
  if (ended) return;
  ended = true;
  pouring = false;

  discount = fill >= DISCOUNT_THRESHOLD ? 15 : 10;

  hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
  rewardBtn.textContent = `🎁 Получить ${discount}%`;
  rewardBtn.style.display = "block";
  restartBtn.style.display = "block";
  pourBtn.disabled = true;
}

// Controls
function startPour(e) {
  if (ended) return;
  pouring = true;
}

function stopPour(e) {
  if (!pouring || ended) return;
  pouring = false;
  finishGame();
}

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

window.addEventListener("mouseup", stopPour);
window.addEventListener("touchend", stopPour);

// Reward
rewardBtn.addEventListener("click", () => {
  const crmUrl = "https://button.amocrm.ru/ddrtwr";
  const params = new URLSearchParams({
    source: "suritsa_game",
    discount: discount,
  });

  const finalUrl = crmUrl + "?" + params.toString();

  if (isTG) {
    Telegram.WebApp.openLink(finalUrl);
  } else {
    window.open(finalUrl, "_blank");
  }
});

// Restart
restartBtn.addEventListener("click", resetGame);

// Loop
function tick() {
  if (pouring && !ended) {
    fill = clamp(fill + FILL_SPEED);
    render();
  }
  requestAnimationFrame(tick);
}

// Start
resetGame();
requestAnimationFrame(tick);
