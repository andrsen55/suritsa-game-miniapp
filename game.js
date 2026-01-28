let fill = 0;
let foam = 0;
let score = 0;
let pouring = false;
let wildness = 0;

const liquid = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const scoreEl = document.getElementById("score");
const pourBtn = document.getElementById("pourBtn");
const rewardBtn = document.getElementById("rewardBtn");

function updateState() {
  if (wildness < 20) stateEl.textContent = "Calm";
  else if (wildness < 50) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";
}

function gameLoop() {
  if (pouring) {
    fill += 0.4;
    wildness += 1;
    foam += wildness * 0.01;
  } else {
    wildness *= 0.95;
    foam *= 0.98;
  }

  fill = Math.min(fill, 100);
  foam = Math.min(foam, 100);

  liquid.style.height = fill + "%";
  foamEl.style.height = foam + "%";

  updateState();

  if (fill >= 100) endGame();
}

function endGame() {
  pouring = false;
  clearInterval(loop);

  const target = 85;
  const diff = Math.abs(fill - target) + foam;

  score = Math.max(0, Math.floor(100 - diff));
  scoreEl.textContent = "Очки: " + score;

  rewardBtn.style.display = "block";
}

pourBtn.addEventListener("mousedown", () => pouring = true);
pourBtn.addEventListener("mouseup", () => pouring = false);
pourBtn.addEventListener("touchstart", () => pouring = true);
pourBtn.addEventListener("touchend", () => pouring = false);

rewardBtn.addEventListener("click", () => {
  // ПОКА ЗАГЛУШКА
  window.location.href = "https://example.com";
});

const loop = setInterval(gameLoop, 50);
