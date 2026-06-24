// ═══════════════════════════════════════════════════════════════
// Euclides Test — Advanced Audio, Particle & Confetti Effects
// ═══════════════════════════════════════════════════════════════

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play subtle UI synth sound effects using Web Audio API
export function playClick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    /* browser policy block */
  }
}

export function playSuccess() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Quick major arpeggio chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.08, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  } catch (e) {
    /* ignore */
  }
}

export function playError() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    // Filter to make it less harsh
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.25);
  } catch (e) {
    /* ignore */
  }
}

export function playTransition() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.35);
  } catch (e) {
    /* ignore */
  }
}

// --- Confetti particle engine ---
interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

let confettiCanvas: HTMLCanvasElement | null = null;
let confettiCtx: CanvasRenderingContext2D | null = null;
let confettiParticles: ConfettiParticle[] = [];
let confettiAnimationId: number | null = null;

function initConfettiCanvas() {
  if (confettiCanvas) return;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.style.position = "fixed";
  confettiCanvas.style.inset = "0";
  confettiCanvas.style.width = "100vw";
  confettiCanvas.style.height = "100vh";
  confettiCanvas.style.pointerEvents = "none";
  confettiCanvas.style.zIndex = "99999";
  document.body.appendChild(confettiCanvas);

  confettiCtx = confettiCanvas.getContext("2d");
  
  const resize = () => {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  };
  window.addEventListener("resize", resize);
  resize();
}

export function triggerConfetti() {
  initConfettiCanvas();
  const colors = [
    "#22c55e", // Green
    "#eab308", // Yellow
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#00ffcc", // Cyan
  ];

  const count = 120;
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight + 10;

  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: startX + (Math.random() - 0.5) * 100,
      y: startY - Math.random() * 50,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 15,
      speedY: -Math.random() * 20 - 10,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  if (!confettiAnimationId) {
    animateConfetti();
  }
}

function animateConfetti() {
  if (!confettiCtx || !confettiCanvas) return;
  
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.speedY += 0.45; // gravity
    p.speedX *= 0.98; // friction
    p.rotation += p.rotationSpeed;
    
    if (p.y > confettiCanvas.height) {
      p.opacity -= 0.05;
    }

    if (p.opacity <= 0) {
      confettiParticles.splice(i, 1);
      continue;
    }

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = p.opacity;
    
    // Draw rectangles with a slight glow
    confettiCtx.shadowBlur = 6;
    confettiCtx.shadowColor = p.color;
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5);
    
    confettiCtx.restore();
  }

  if (confettiParticles.length > 0) {
    confettiAnimationId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimationId = null;
    if (confettiCanvas && confettiCanvas.parentNode) {
      confettiCanvas.parentNode.removeChild(confettiCanvas);
      confettiCanvas = null;
      confettiCtx = null;
    }
  }
}

// --- Floating Math Symbols background ---
interface MathParticle {
  x: number;
  y: number;
  size: number;
  text: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  maxOpacity: number;
}

const MATH_SYMBOLS = [
  "π", "√", "∑", "∫", "x", "y", "∞", "Δ", "θ", "f(x)", "E=mc²", "a²+b²=c²", "λ", "log(n)", "n!", "lim", "∪", "∩"
];

let particlesCanvas: HTMLCanvasElement | null = null;
let particlesCtx: CanvasRenderingContext2D | null = null;
let mathParticles: MathParticle[] = [];

export function initMathParticles() {
  particlesCanvas = document.getElementById("math-particles-canvas") as HTMLCanvasElement;
  if (!particlesCanvas) return;

  particlesCtx = particlesCanvas.getContext("2d");
  
  const resize = () => {
    if (particlesCanvas) {
      particlesCanvas.width = window.innerWidth;
      particlesCanvas.height = window.innerHeight;
    }
  };
  window.addEventListener("resize", resize);
  resize();

  // Initialize particles
  const count = 35;
  for (let i = 0; i < count; i++) {
    mathParticles.push(createMathParticle(true));
  }

  animateMathParticles();
}

function createMathParticle(randomY = false): MathParticle {
  const canvasWidth = particlesCanvas ? particlesCanvas.width : window.innerWidth;
  const canvasHeight = particlesCanvas ? particlesCanvas.height : window.innerHeight;

  return {
    x: Math.random() * canvasWidth,
    y: randomY ? Math.random() * canvasHeight : canvasHeight + 20,
    size: Math.random() * 12 + 10,
    text: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
    speedX: (Math.random() - 0.5) * 0.4,
    speedY: -Math.random() * 0.6 - 0.2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.015,
    opacity: 0,
    maxOpacity: Math.random() * 0.22 + 0.08,
  };
}

function animateMathParticles() {
  if (!particlesCtx || !particlesCanvas) return;

  const w = particlesCanvas.width;
  const h = particlesCanvas.height;

  particlesCtx.clearRect(0, 0, w, h);

  // 🏟️ Draw subtle soccer field tactical lines in the background
  drawTacticalField(particlesCtx, w, h);

  // Update and draw floating symbols
  for (let i = 0; i < mathParticles.length; i++) {
    const p = mathParticles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.rotation += p.rotationSpeed;

    // Fade in initially, fade out near the top
    if (p.y < h - 100 && p.opacity < p.maxOpacity) {
      p.opacity += 0.005;
    }
    if (p.y < 80) {
      p.opacity -= 0.008;
    }

    // Reset if it goes off screen
    if (p.y < -20 || p.x < -20 || p.x > w + 20 || p.opacity <= 0) {
      mathParticles[i] = createMathParticle(false);
      continue;
    }

    particlesCtx.save();
    particlesCtx.translate(p.x, p.y);
    particlesCtx.rotate(p.rotation);
    particlesCtx.globalAlpha = Math.max(0, p.opacity);
    
    // Draw glowing text
    particlesCtx.shadowBlur = 8;
    particlesCtx.shadowColor = "rgba(34, 197, 94, 0.4)";
    particlesCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
    particlesCtx.font = `600 ${p.size}px 'Space Grotesk', sans-serif`;
    particlesCtx.fillText(p.text, 0, 0);

    particlesCtx.restore();
  }

  requestAnimationFrame(animateMathParticles);
}

// Renders faint glowing lines outlining a soccer tactical pitch
function drawTacticalField(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(34, 197, 94, 0.035)"; // Super faint green
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;

  const margin = 40;
  const pw = w - margin * 2;
  const ph = h - margin * 2;

  // Center line
  ctx.beginPath();
  ctx.moveTo(w / 2, margin);
  ctx.lineTo(w / 2, h - margin);
  ctx.stroke();

  // Center Circle
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  // Outer Border
  ctx.strokeRect(margin, margin, pw, ph);

  // Penalty Boxes (Top and Bottom or Left and Right depending on aspect)
  if (w > h) {
    // Left Penalty Box
    ctx.strokeRect(margin, h / 2 - ph * 0.25, pw * 0.15, ph * 0.5);
    // Right Penalty Box
    ctx.strokeRect(w - margin - pw * 0.15, h / 2 - ph * 0.25, pw * 0.15, ph * 0.5);
    
    // Goals
    ctx.strokeRect(margin - 10, h / 2 - ph * 0.1, 10, ph * 0.2);
    ctx.strokeRect(w - margin, h / 2 - ph * 0.1, 10, ph * 0.2);
  } else {
    // Top Penalty Box
    ctx.strokeRect(w / 2 - pw * 0.25, margin, pw * 0.5, ph * 0.15);
    // Bottom Penalty Box
    ctx.strokeRect(w / 2 - pw * 0.25, h - margin - ph * 0.15, pw * 0.5, ph * 0.15);
  }

  ctx.restore();
}

// --- Typing animation for Hero subtitle ---
export function initTypingAnimation() {
  const el = document.querySelector(".hero-desc");
  if (!el) return;

  const element = el;
  const fullText = "Explore atividades interativas com tema de futebol, desafie seu raciocínio lógico e dispute o topo do pódio global da nossa Arena Matemática.";
  element.textContent = "";
  let index = 0;

  function type() {
    if (index < fullText.length) {
      element.textContent += fullText.charAt(index);
      index++;
      setTimeout(type, 18);
    }
  }

  // Trigger typing effect slightly after page load
  setTimeout(type, 800);
}

// --- Mutation Observer to watch class changes and trigger chimes/confetti automatically ---
export function initFeedbackWatcher() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        const target = mutation.target as HTMLElement;
        const className = typeof target.className === "string"
          ? target.className
          : (target.getAttribute("class") || "");

        if (className.includes("ok") || className.includes("success") || className.includes("correta")) {
          // Prevent multiple double plays
          const lastPlay = target.getAttribute("data-last-play-success") || "0";
          if (Date.now() - parseInt(lastPlay) > 400) {
            target.setAttribute("data-last-play-success", Date.now().toString());
            playSuccess();
            triggerConfetti();
          }
        } else if (className.includes("erro") || className.includes("incorrect")) {
          const lastPlay = target.getAttribute("data-last-play-error") || "0";
          if (Date.now() - parseInt(lastPlay) > 400) {
            target.setAttribute("data-last-play-error", Date.now().toString());
            playError();
          }
        }
      }
    });
  });

  // Observe elements that show feedback
  const config = { attributes: true, subtree: true, attributeFilter: ["class"] };
  observer.observe(document.body, config);

  // Monitor clicks on the page to play subtle click feedback on buttons and tabs
  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, .nav-tab, .ranking-tab, select, input[type='checkbox']")) {
      playClick();
    }
  });
}

// --- Premium Toast Notification System ---
export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const container = document.getElementById("toast-container") || (() => {
    const el = document.createElement("div");
    el.id = "toast-container";
    el.style.position = "fixed";
    el.style.bottom = "24px";
    el.style.right = "24px";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.gap = "12px";
    el.style.zIndex = "999999";
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement("div");
  toast.className = `toast glass-card ${type}`;
  toast.style.padding = "14px 22px";
  toast.style.borderRadius = "var(--radius)";
  toast.style.border = "1px solid rgba(255, 255, 255, 0.08)";
  toast.style.borderLeft = `4px solid ${type === "success" ? "var(--copa-verde)" : type === "error" ? "var(--danger)" : "var(--copa-azul)"}`;
  toast.style.color = "#fff";
  toast.style.fontSize = "0.92rem";
  toast.style.fontWeight = "500";
  toast.style.boxShadow = "var(--shadow-card)";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "12px";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
  
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.innerHTML = `<span style="font-size: 1.1rem;">${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Trigger transition
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 4200);
}

// Expose on window for easy global access and override native alert
if (typeof window !== "undefined") {
  (window as any).EuclidesEffects = {
    playClick,
    playSuccess,
    playError,
    playTransition,
    triggerConfetti,
    showToast,
  };

  // Override standard alerts with the premium toast system
  window.alert = (msg: string) => {
    const lower = msg.toLowerCase();
    let type: "success" | "error" | "info" = "info";
    if (lower.includes("sucesso") || lower.includes("aprovado") || lower.includes("salvo") || lower.includes("liberado") || lower.includes("concluido") || lower.includes("concluído") || lower.includes("iniciada")) {
      type = "success";
    } else if (lower.includes("erro") || lower.includes("falhou") || lower.includes("rejeitado") || lower.includes("inválido") || lower.includes("não encontrado") || lower.includes("deletar")) {
      type = "error";
    }
    showToast(msg, type);
  };
}

export function initThemeToggle() {
  const toggle = document.getElementById("btn-theme-toggle");
  if (!toggle) return;

  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);

  toggle.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("theme", activeTheme);
  });
}

export function initParallax() {
  const orbs = document.querySelectorAll(".bg-orb");
  const canvas = document.getElementById("math-particles-canvas");
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
    const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    
    if (canvas) {
      canvas.style.transform = `translate(${x * 12}px, ${y * 12}px)`;
    }
    
    orbs.forEach((orb, index) => {
      const depth = (index + 1) * 20;
      (orb as HTMLElement).style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });
}



export function initScrollAnimation() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: "0px 0px -20px 0px"
  });

  const animTargets = document.querySelectorAll(".glass-card, .member-card, .gallery-item, .view-section, .hero-copy, .quote-card, .hero-media-frame");
  animTargets.forEach((el) => {
    el.classList.add("scroll-animate");
    observer.observe(el);
  });
}

export function initEasterEgg() {
  let inputBuffer = "";
  const SECRET = "euclides";
  
  window.addEventListener("keydown", (e) => {
    inputBuffer += e.key.toLowerCase();
    if (inputBuffer.length > 20) {
      inputBuffer = inputBuffer.slice(-20);
    }
    
    if (inputBuffer.endsWith(SECRET)) {
      inputBuffer = "";
      triggerConfetti();
      playSuccess();
      showToast("📐 Teorema de Euclides Ativado! +1000 de QI ⚡", "success");
      
      const brandMark = document.querySelector(".brand-mark");
      if (brandMark) {
        brandMark.animate([
          { transform: "rotate(0deg)" },
          { transform: "rotate(360deg)" }
        ], {
          duration: 1000,
          iterations: 1,
          easing: "ease-in-out"
        });
      }
    }
  });
}
