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
// Game state
// ===============================
let fill = 0;        // 0..100
let foam = 0;        // 0..100
let wildness = 0;
let pouring = false;
let ended = false;

let discount = 0;   // 5 / 10 / 15

// ===============================
// Helpers
// ===============================
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calculateDiscountSoft(fill) {
  if (fill < 35) return 5;
  if (fill < 70) return 10;
  return 15;
}

function updateState() {
  if (wildness < 30) stateEl.textContent = "Calm";
  else if (wildness < 65) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function haptic(type) {
  if (!isTG || !Telegram.WebApp.HapticFeedback) return;
  try {
    if (type === "success") Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    if (type === "light") Telegram.WebApp.HapticFeedback.impactOccurred("light");
  } catch (e) {}
}

function render() {
  liquidEl.style.height = fill.toFixed(1) + "%";
  foamEl.style.height = foam.toFixed(1) + "%";
  updateState();
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

  hintEl.textContent = "Наливайте квас. Результат появится сразу 👇";

  rewardBtn.style.display = "none";
  restartBtn.style.display = "none";
  pourBtn.disabled = false;

  render();
}

function endGame() {
  if (ended) return;
  ended = true;
  pouring = false;

  discount = calculateDiscountSoft(fill);

  hintEl.textContent = `🎉 Ваша скидка ${discount}%`;
  rewardBtn.textContent = `🎁 Получить ${discount}%`;
  rewardBtn.style.display = "block";
  restartBtn.style.display = "block";

  haptic(discount === 15 ? "success" : "light");

  pourBtn.disabled = true;
}

// ===============================
// Controls
// ===============================
function startPour() {
  if (ended) return;
  pouring = true;
  wildness += 4;
}

function stopPour() {
  pouring = false;
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
// Reward → AmaCRM
// ===============================
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

// ===============================
// Restart
// ===============================
restartBtn.addEventListener("click", resetGame);

// ===============================
// Loop
// ===============================
function tick() {
  if (!ended) {
    if (pouring) {
      fill += 0.7;
      wildness += 0.6;
      foam += 0.4;
    } else {
      wildness *= 0.97;
      foam *= 0.985;
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
