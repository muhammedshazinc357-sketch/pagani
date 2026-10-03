(() => {
  "use strict";

  const TOTAL_FRAMES = 240;
  const framePath = (n) => `images/huayra-sequence/${n}.jpg`;

  const canvas = document.getElementById("heroCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const heroSticky = document.querySelector(".hero-sticky");
  const heroScroll = document.querySelector(".hero-scroll");
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  const loaderPercent = document.getElementById("loaderPercent");
  const frameNumber = document.getElementById("frameNumber");
  const fallback = document.getElementById("heroFallback");
  const navbar = document.getElementById("navbar");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  const frames = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let lastFrame = -1;
  let rafPending = false;
  let hasFrames = false;

  const phases = [
    { start: 0.00, end: 0.23, phase: "01 / ORIGIN", title: "HUAYRA BC", subtitle: "MACCHINA VOLANTE", tag: "THE FLYING MACHINE", meta: "20 UNITS PRODUCED WORLDWIDE  /  €2,600,000" },
    { start: 0.23, end: 0.50, phase: "02 / FORM", title: "CARBON SCULPTURE", subtitle: "AERODYNAMIC MASTERY", tag: "CARBOTANIUM™", meta: "ACTIVE AERODYNAMICS  /  CARBON FIBER  /  TITANIUM" },
    { start: 0.50, end: 0.76, phase: "03 / RITUAL", title: "BUTTERFLY DOORS", subtitle: "THE THEATRE OF ENTRY", tag: "73°", meta: "PRECISION MECHANISM  /  HAND-BUILT INTERIOR" },
    { start: 0.76, end: 1.00, phase: "04 / POWER", title: "AMG V12 BITURBO", subtitle: "745 HP / 1,000 NM", tag: "0–100 KM/H IN 2.8 SEC", meta: "6.0 LITRES  /  ENGINEERED WITHOUT COMPROMISE" }
  ];

  const hud = {
    phase: document.getElementById("hudPhase"),
    title: document.getElementById("hudTitle"),
    subtitle: document.getElementById("hudSubtitle"),
    tag: document.getElementById("hudTag"),
    meta: document.getElementById("hudMeta")
  };

  const specs = [
    ["ENGINE", "V12 BITURBO AMG"],
    ["DISPLACEMENT", "6.0 LITRES"],
    ["POWER", "745 HP"],
    ["TORQUE", "1,000 NM"],
    ["WEIGHT", "1,218 KG"],
    ["TOP SPEED", "380 KM/H"],
    ["0–100 KM/H", "2.8 SEC"],
    ["UNITS BUILT", "20 TOTAL"]
  ];

  document.getElementById("specGrid").innerHTML = specs.map(([a,b]) =>
    `<div class="spec-item"><span>${a}</span><b>${b}</b></div>`
  ).join("");

  function setCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (lastFrame >= 0) drawFrame(lastFrame);
  }

  function drawFrame(index) {
    if (!frames[index] || !frames[index].complete || !frames[index].naturalWidth) return;
    const img = frames[index];
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width, ch = rect.height;
    ctx.clearRect(0, 0, cw, ch);

    // Contain behavior: the complete car remains uncropped.
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    lastFrame = index;
    frameNumber.textContent = String(index + 1).padStart(3, "0");
  }

  function updateHUD(progress) {
    const p = Math.max(0, Math.min(1, progress));
    const phase = phases.find(x => p >= x.start && p <= x.end) || phases[phases.length - 1];
    const values = [hud.phase, hud.title, hud.subtitle, hud.tag, hud.meta];
    const next = [phase.phase, phase.title, phase.subtitle, phase.tag, phase.meta];
    values.forEach((el, i) => {
      if (el.textContent !== next[i]) {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        el.style.filter = "blur(5px)";
        setTimeout(() => {
          el.textContent = next[i];
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.filter = "blur(0)";
        }, 120);
      }
    });
  }

  function progressFromScroll() {
    const rect = heroScroll.getBoundingClientRect();
    const total = heroScroll.offsetHeight - window.innerHeight;
    const passed = Math.min(Math.max(-rect.top, 0), total);
    return total > 0 ? passed / total : 0;
  }

  function render() {
    rafPending = false;
    const progress = progressFromScroll();
    const index = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
    if (index !== lastFrame) drawFrame(index);
    updateHUD(progress);
  }

  function requestRender() {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(render);
    }
  }

  function preload() {
    return new Promise(resolve => {
      let finished = 0;
      const update = () => {
        finished++;
        loadedCount = finished;
        const percent = Math.round((finished / TOTAL_FRAMES) * 100);
        loaderBar.style.width = percent + "%";
        loaderPercent.textContent = percent + "%";
        if (finished === TOTAL_FRAMES) resolve(true);
      };

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.decoding = "async";
        img.onload = update;
        img.onerror = update;
        img.src = framePath(i);
        frames[i - 1] = img;
      }
    });
  }

  function probeFrames() {
    return new Promise(resolve => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = framePath(1);
    });
  }

  async function init() {
    const exists = await probeFrames();
    if (!exists) {
      // Keep the site usable when the supplied cinematic JPG sequence has not yet been copied.
      loaderBar.style.width = "100%";
      loaderPercent.textContent = "100%";
      setTimeout(() => loader.classList.add("hidden"), 350);
      return;
    }

    hasFrames = true;
    heroSticky.classList.add("has-frames");
    await preload();
    drawFrame(0);
    setTimeout(() => loader.classList.add("hidden"), 350);
  }

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", setCanvasSize);
  menuToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });

  setCanvasSize();
  init();
})();
