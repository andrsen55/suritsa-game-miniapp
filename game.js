const liquid = document.getElementById("liquid");
const foamEl = document.getElementById("foam");
const stateEl = document.getElementById("state");
const scoreEl = document.getElementById("score");

const pourBtn = document.getElementById("pourBtnFixed");

let fill = 0;
let foam = 0;
let pouring = false;
let wildness = 0;
let score = 0;

function update() {
  if (pouring) {
    fill += 0.6;
    wildness += 1;
    foam += wildness * 0.01;
  } else {
    wildness *= 0.96;
    foam *= 0.98;
  }

  fill = Math.min(fill, 100);
  foam = Math.min(foam, 100);

  liquid.style.height = fill + "%";
  foamEl.style.height = foam + "%";

  if (wildness < 20) stateEl.textContent = "Calm";
  else if (wildness < 50) stateEl.textContent = "Active";
  else stateEl.textContent = "Wild";

  if (fill >= 100) {
    pouring = false;
    score = Math.max(0, Math.floor(100 - Math.abs(fill - 85) - foam));
    scoreEl.textContent = "Очки: " + score;
  }
}

pourBtn.addEventListener("mousedown", () => pouring = true);
window.addEventListener("mouseup", () => pouring = false);

pourBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pouring = true;
}, { passive: false });

window.addEventListener("touchend", () => pouring = false);

setInterval(update, 50);
