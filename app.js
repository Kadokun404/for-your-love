(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- marquee ---------- */
  $$(".marquee-track").forEach((t) => {
    const items = (t.dataset.items || "").split("|");
    const group = items.map((i) => `<span>${i}</span><span class="dot">✺</span>`).join("");
    const half = group.repeat(3);
    t.innerHTML = half + half;
  });

  /* ---------- page wipe transition ---------- */
  const wipe = document.createElement("div");
  wipe.className = "wipe enter";
  document.body.appendChild(wipe);
  wipe.addEventListener("animationend", () => {
    if (wipe.classList.contains("enter")) wipe.className = "wipe";
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-go]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    wipe.className = "wipe leave";
    setTimeout(() => (location.href = a.href), reduce ? 0 : 430);
  });
  addEventListener("pageshow", (e) => {
    if (e.persisted) wipe.className = "wipe";
  });

  /* ---------- draggable stickers ---------- */
  $$(".sticker").forEach((el) => {
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false;
    el.addEventListener("pointerdown", (e) => {
      drag = true; sx = e.clientX; sy = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.classList.add("drag");
    });
    el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      el.style.setProperty("--dx", ox + e.clientX - sx + "px");
      el.style.setProperty("--dy", oy + e.clientY - sy + "px");
    });
    const end = (e) => {
      if (!drag) return;
      drag = false;
      ox += e.clientX - sx; oy += e.clientY - sy;
      el.classList.remove("drag");
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* ---------- confetti ---------- */
  window.confetti = (x = innerWidth / 2, y = innerHeight / 2) => {
    if (reduce) return;
    let c = $("#confetti");
    if (!c) { c = document.createElement("canvas"); c.id = "confetti"; document.body.appendChild(c); }
    const ctx = c.getContext("2d");
    const dpr = devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#FFD93D", "#FF6B9D", "#4D96FF", "#6BCB77", "#FF8C42", "#B388FF"];
    const ps = Array.from({ length: 150 }, () => ({
      x, y,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 17 - 4,
      s: 8 + Math.random() * 10,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    let t = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => {
        p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.strokeRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
      });
      if (++t < 160) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  };

  /* ---------- pembukaan: amplop ---------- */
  const env = $("#env");
  if (env) {
    const openBtn = $("#openBtn");
    const nextBtn = $("#nextBtn");
    const hint = $("#hint");
    const open = () => {
      if (env.classList.contains("open")) return;
      env.classList.add("open");
      env.setAttribute("aria-expanded", "true");
      openBtn.hidden = true;
      nextBtn.hidden = false;
      hint.textContent = "udah kebuka. lanjut yuk ↓";
      const r = env.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2);
    };
    env.addEventListener("click", open);
    env.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    openBtn.addEventListener("click", open);
  }

  /* ---------- ungkapan: tumpukan kartu ---------- */
  const deck = $("#deck");
  if (deck) {
    const slides = $$(".slide", deck);
    const bars = $$(".bar");
    const cur = $("#cur");
    const prev = $("#prev");
    const next = $("#next");
    const toEnd = $("#toEnd");
    const total = slides.length;
    const pad = (n) => String(n).padStart(2, "0");
    $("#total").textContent = "/" + pad(total);
    let i = 0;

    const render = () => {
      slides.forEach((s, k) => {
        const d = k - i;
        s.dataset.pos = d < 0 ? "gone" : d > 2 ? "far" : String(d);
        s.setAttribute("aria-hidden", d !== 0);
      });
      bars.forEach((b, k) => (b.className = "bar" + (k < i ? " done" : k === i ? " on" : "")));
      cur.textContent = pad(i + 1);
      prev.disabled = i === 0;
      const end = i === total - 1;
      next.hidden = end;
      toEnd.hidden = !end;
    };
    const go = (n) => { i = Math.max(0, Math.min(total - 1, n)); render(); };

    next.addEventListener("click", () => go(i + 1));
    prev.addEventListener("click", () => go(i - 1));
    deck.addEventListener("click", () => { if (i < total - 1) go(i + 1); });
    addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    });
    let tx = 0;
    deck.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
    deck.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
    });
    render();
  }

  /* ---------- penutup: jawaban ---------- */
  $$("[data-answer]").forEach((b) => {
    b.addEventListener("click", () => {
      const reply = $("#reply");
      const now = b.dataset.answer === "now";
      reply.className = "reply show" + (now ? "" : " soft");
      reply.textContent = now
        ? "Oke! Kabarin Alpinan sekarang ya. Dia lagi nunggu, deg-degan."
        : "Siap, nggak ada yang buru-buru. Makasih udah mau baca sampai sini.";
      if (now) {
        const r = b.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top);
      }
    });
  });
})();
