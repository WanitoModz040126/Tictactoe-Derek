/**
 * Derek Snake Game — game.js
 * Created By Jhon Dherick Pableo Rosal
 *
 * Standard snake mechanics, with one rigged rule: the 20th apple
 * that spawns is never a real apple. Nothing in the UI ever states
 * this — it should look and feel like a normal, well made game.
 */
(() => {
  "use strict";

  // ---------- Config ----------
  const GRID = 20;
  const TOTAL_APPLES = 20;
  const BASE_TICK_MS = 118;
  const MIN_TICK_MS = 78;
  const VIDEO_COUNT = 6; // assets/1.mp4 .. assets/6.mp4

  // ---------- DOM refs ----------
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const CELL = canvas.width / GRID;

  const startOverlay = document.getElementById("startOverlay");
  const startBtn = document.getElementById("startBtn");

  const loseOverlay = document.getElementById("loseOverlay");
  const loseSummary = document.getElementById("loseSummary");
  const retryBtn = document.getElementById("retryBtn");

  const videoOverlay = document.getElementById("videoOverlay");
  const loseVideo = document.getElementById("loseVideo");
  const backBtn = document.getElementById("backBtn");

  const scoreValue = document.getElementById("scoreValue");
  const appleValue = document.getElementById("appleValue");
  const meterPercent = document.getElementById("meterPercent");
  const segmentsEl = document.getElementById("segments");

  // ---------- Build growth segments (1 segment per apple) ----------
  const segEls = [];
  for (let i = 0; i < TOTAL_APPLES; i++) {
    const s = document.createElement("div");
    s.className = "seg";
    segmentsEl.appendChild(s);
    segEls.push(s);
  }

  // ---------- State ----------
  let snake, direction, pendingDirection, apple, eatenCount, score;
  let tickMs, loopHandle, running, lastVideoIndex;

  function resetState() {
    const startX = Math.floor(GRID / 2);
    const startY = Math.floor(GRID / 2);
    snake = [
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY },
    ];
    direction = { x: 1, y: 0 };
    pendingDirection = direction;
    eatenCount = 0;
    score = 0;
    tickMs = BASE_TICK_MS;
    apple = spawnApple();
    updateHud();
    draw();
  }

  // ---------- Apple spawning ----------
  function spawnApple() {
    const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID);
      y = Math.floor(Math.random() * GRID);
    } while (occupied.has(`${x},${y}`));

    const upcomingIndex = eatenCount + 1; // which "eat" this apple represents
    return { x, y, isRigged: upcomingIndex === TOTAL_APPLES };
  }

  // ---------- Input ----------
  const KEY_MAP = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
  };

  window.addEventListener("keydown", (e) => {
    const dir = KEY_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    if (!running) return;
    // Prevent reversing directly into the body
    if (dir.x === -direction.x && dir.y === -direction.y) return;
    pendingDirection = dir;
  });

  // On-screen directional buttons
  function setDirection(dir) {
    if (!running) return;
    if (dir.x === -direction.x && dir.y === -direction.y) return;
    pendingDirection = dir;
  }

  const btnUp = document.getElementById("btnUp");
  const btnDown = document.getElementById("btnDown");
  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");

  function bindDpadButton(el, dir) {
    if (!el) return;
    const activate = (e) => {
      e.preventDefault();
      setDirection(dir);
      el.classList.add("pressed");
      setTimeout(() => el.classList.remove("pressed"), 120);
    };
    el.addEventListener("click", activate);
    el.addEventListener("touchstart", activate, { passive: false });
  }

  bindDpadButton(btnUp, { x: 0, y: -1 });
  bindDpadButton(btnDown, { x: 0, y: 1 });
  bindDpadButton(btnLeft, { x: -1, y: 0 });
  bindDpadButton(btnRight, { x: 1, y: 0 });

  // Basic swipe support for mobile
  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (!touchStart || !running) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    const dir = Math.abs(dx) > Math.abs(dy)
      ? { x: dx > 0 ? 1 : -1, y: 0 }
      : { x: 0, y: dy > 0 ? 1 : -1 };
    if (dir.x === -direction.x && dir.y === -direction.y) return;
    pendingDirection = dir;
    touchStart = null;
  }, { passive: true });

  // ---------- Game loop ----------
  function tick() {
    direction = pendingDirection;
    const head = {
      x: (snake[0].x + direction.x + GRID) % GRID,
      y: (snake[0].y + direction.y + GRID) % GRID,
    };

    // Self collision
    if (snake.some((c) => c.x === head.x && c.y === head.y)) {
      gameOver();
      return;
    }

    const ateApple = head.x === apple.x && head.y === apple.y;
    snake.unshift(head);

    if (ateApple) {
      if (apple.isRigged) {
        draw(); // show the snake momentarily "eating" it before it flips
        explode(apple);
        return;
      }
      eatenCount += 1;
      score += 10;
      tickMs = Math.max(MIN_TICK_MS, BASE_TICK_MS - eatenCount * 2);
      apple = spawnApple();
      updateHud();
    } else {
      snake.pop();
    }

    draw();
    scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(loopHandle);
    loopHandle = setTimeout(tick, tickMs);
  }

  function explode(pos) {
    running = false;
    clearTimeout(loopHandle);
    meterPercent.textContent = "100%";
    segEls[TOTAL_APPLES - 1].classList.add("danger");
    drawExplosion(pos);
    setTimeout(() => gameOver(true), 320);
  }

  // ---------- Game over / lose flow ----------
  function gameOver() {
    running = false;
    clearTimeout(loopHandle);
    loseSummary.textContent = `Score: ${score} · Apples: ${eatenCount}/${TOTAL_APPLES}`;
    loseOverlay.classList.remove("hidden");
  }

  retryBtn.addEventListener("click", () => {
    loseOverlay.classList.add("hidden");
    playRandomVideo();
  });

  function playRandomVideo() {
    let idx;
    do {
      idx = 1 + Math.floor(Math.random() * VIDEO_COUNT);
    } while (VIDEO_COUNT > 1 && idx === lastVideoIndex);
    lastVideoIndex = idx;

    loseVideo.src = `/assets/${idx}.mp4`;
    videoOverlay.classList.remove("hidden");
    loseVideo.currentTime = 0;
    loseVideo.play().catch(() => {
      /* Autoplay can be blocked until the user interacts — that's fine,
         the Back button still works and the click that opened this
         overlay usually satisfies the browser's autoplay policy. */
    });
  }

  backBtn.addEventListener("click", () => {
    loseVideo.pause();
    loseVideo.removeAttribute("src");
    loseVideo.load();
    videoOverlay.classList.add("hidden");
    resetState();
    startOverlay.classList.remove("hidden");
  });

  // ---------- HUD ----------
  function updateHud() {
    scoreValue.textContent = score;
    appleValue.textContent = `${eatenCount} / ${TOTAL_APPLES}`;
    const pct = Math.min(eatenCount * 5, 95);
    meterPercent.textContent = `${pct}%`;
    const filled = Math.round(pct / 5);
    segEls.forEach((s, i) => {
      s.classList.toggle("filled", i < filled);
      s.classList.remove("danger");
    });
  }

  // ---------- Rendering ----------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(canvas.width, i * CELL);
      ctx.stroke();
    }

    // apple
    const cx = apple.x * CELL + CELL / 2;
    const cy = apple.y * CELL + CELL / 2;
    ctx.beginPath();
    ctx.fillStyle = "#ff6b5b";
    ctx.arc(cx, cy, CELL * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "#3a2320";
    ctx.lineWidth = 2;
    ctx.moveTo(cx, cy - CELL * 0.32);
    ctx.lineTo(cx + CELL * 0.12, cy - CELL * 0.46);
    ctx.stroke();

    // snake
    snake.forEach((c, i) => {
      const x = c.x * CELL + 1.5;
      const y = c.y * CELL + 1.5;
      const size = CELL - 3;
      const r = i === 0 ? 7 : 5;
      ctx.fillStyle = i === 0 ? "#63e6c4" : "#4fd6b0";
      roundRect(ctx, x, y, size, size, r);
      ctx.fill();
    });
  }

  function drawExplosion(pos) {
    const cx = pos.x * CELL + CELL / 2;
    const cy = pos.y * CELL + CELL / 2;
    ctx.beginPath();
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL * 1.6);
    grad.addColorStop(0, "#fff2ea");
    grad.addColorStop(0.4, "#ff3b5c");
    grad.addColorStop(1, "rgba(255,59,92,0)");
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, CELL * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------- Start ----------
  startBtn.addEventListener("click", () => {
    startOverlay.classList.add("hidden");
    running = true;
    scheduleNext();
  });

  resetState();
})();
