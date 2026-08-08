"use strict";

const DEFAULT_CONFIG = {
  greeting: "Hi...",
  name: "Sarah Aqila Rahman",
  greetingText: "I really like your name btw!",
  wishText: "Hopefully at your current age, what you are pursuing you can achieve 🙌🏻",
  imagePath: "img/sarah.jpeg",
  text1: "It's your birthday!!! :D",
  textInChatBox: "Happy birthday to you!! Yeee! Many many happy blah...",
  sendButtonLabel: "Send",
  text2: "That's what I was going to do.",
  text3: "But then I stopped.",
  text4: "I realised, I wanted to do something",
  text4Adjective: "special",
  text5Entry: "Because,",
  text5Content: "You are Special",
  smiley: ":)",
  wishHeading: "Happy Birthday!",
  outroText: "Okay, now come back and tell me if you liked it.",
  finalNote: "I hope this little surprise made you smile. Happy birthday, Sarah. May this year be gentle, exciting, and full of good things for you. ❤️",
  replayText: "Or click, if you want to watch it again.",
  shareLabel: "Share this moment",
  shareText: "A little birthday surprise for Sarah Aqila Rahman 🎉",
  siteUrl: "",
  outroSmiley: "❤️❤️❤️",
};

const $ = (selector) => document.querySelector(selector);
const delay = (milliseconds, signal) => new Promise((resolve) => {
  const timer = window.setTimeout(resolve, milliseconds);
  signal?.addEventListener("abort", () => {
    window.clearTimeout(timer);
    resolve();
  }, { once: true });
});

const elements = {
  startScreen: $("#startScreen"),
  startButton: $("#startButton"),
  startSubtitle: $("#startSubtitle"),
  loader: $("#loader"),
  loaderBar: $("#loaderBar"),
  loaderText: $("#loaderText"),
  experience: $("#experience"),
  audio: $("#birthdayAudio"),
  audioToggle: $("#audioToggle"),
  skipButton: $("#skipButton"),
  replayButton: $("#replayButton"),
  shareButton: $("#shareButton"),
  shareStatus: $("#shareStatus"),
  progress: $("#progress span"),
  error: $("#errorMessage"),
  portrait: $("#portrait"),
};

let config = { ...DEFAULT_CONFIG };
let sequenceController = null;
let appStarted = false;
let musicEnabled = true;
let activeScene = null;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function loadConfig() {
  try {
    const response = await fetch("customize.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const incoming = await response.json();
    config = Object.fromEntries(Object.entries(DEFAULT_CONFIG).map(([key, fallback]) => [
      key,
      typeof incoming[key] === "string" && incoming[key].trim() ? incoming[key].trim() : fallback,
    ]));
  } catch (error) {
    showError("Pesan personal gagal dimuat. Kejutan tetap berjalan dengan teks bawaan.");
    console.error("Gagal memuat customize.json:", error);
  }

  document.querySelectorAll("[data-field]").forEach((node) => {
    const key = node.dataset.field;
    if (Object.hasOwn(config, key)) node.textContent = config[key];
  });
  elements.portrait.src = config.imagePath;
  elements.portrait.alt = `Foto ${config.name}`;
  document.title = `Selamat Ulang Tahun, ${config.name}! 🎉`;
  elements.startSubtitle.textContent = `Ada pesan spesial untuk ${config.name}. Aktifkan suara, lalu buka saat kamu siap.`;
  applySocialMetadata();
}

function applySocialMetadata() {
  document.querySelector('meta[property="og:description"]').content = config.shareText;
  if (!config.siteUrl) return;
  try {
    const pageUrl = new URL(config.siteUrl);
    document.querySelector('meta[property="og:image"]').content = new URL(config.imagePath, pageUrl).href;
    let urlMeta = document.querySelector('meta[property="og:url"]');
    if (!urlMeta) {
      urlMeta = document.createElement("meta");
      urlMeta.setAttribute("property", "og:url");
      document.head.append(urlMeta);
    }
    urlMeta.content = pageUrl.href;
  } catch (error) {
    console.warn("siteUrl di customize.json tidak valid:", error);
  }
}

function updateLoader(percent, message) {
  elements.loaderBar.style.width = `${percent}%`;
  elements.loaderText.textContent = message;
}

function waitForAudio() {
  if (elements.audio.readyState >= 2) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    elements.audio.addEventListener("canplay", finish, { once: true });
    elements.audio.addEventListener("error", finish, { once: true });
    window.setTimeout(finish, 5000);
    elements.audio.load();
  });
}

async function preloadAssets() {
  updateLoader(20, "Memuat foto…");
  try {
    if (!elements.portrait.complete) await elements.portrait.decode();
  } catch (error) {
    console.warn("Foto belum selesai dimuat:", error);
  }
  updateLoader(60, "Memuat musik…");
  await waitForAudio();
  updateLoader(100, "Kejutan sudah siap!");
  elements.startButton.disabled = false;
  window.setTimeout(() => { elements.loader.hidden = true; }, 450);
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
  window.setTimeout(() => { elements.error.hidden = true; }, 6000);
}

function setAudioButton() {
  const playing = musicEnabled && !elements.audio.paused;
  elements.audioToggle.textContent = playing ? "🔊" : "🔇";
  elements.audioToggle.setAttribute("aria-label", playing ? "Matikan musik" : "Nyalakan musik");
  elements.audioToggle.setAttribute("aria-pressed", String(!musicEnabled));
}

async function playAudio() {
  if (!musicEnabled || !appStarted || document.hidden) return;
  try { await elements.audio.play(); } catch (error) {
    musicEnabled = false;
    console.warn("Audio tidak dapat diputar:", error);
  }
  setAudioButton();
}

function animate(node, keyframes, options = {}) {
  if (reduceMotion) {
    Object.assign(node.style, keyframes.at(-1));
    return Promise.resolve();
  }
  const animation = node.animate(keyframes, { duration: 650, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both", ...options });
  return animation.finished.catch(() => undefined);
}

async function showScene(selector, progress, signal) {
  if (signal.aborted) return null;
  if (activeScene) {
    await animate(activeScene, [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-18px)" }], { duration: 380 });
    activeScene.classList.remove("is-active");
  }
  activeScene = $(selector);
  activeScene.classList.add("is-active");
  elements.progress.style.width = `${progress}%`;
  await animate(activeScene, [{ opacity: 0, transform: "translateY(18px) scale(.985)" }, { opacity: 1, transform: "translateY(0) scale(1)" }]);
  return activeScene;
}

async function typeChat(signal) {
  const node = $("#chatText");
  const value = config.textInChatBox;
  if (reduceMotion) { node.textContent = value; return; }
  node.textContent = "";
  node.classList.add("typing-caret");
  for (const character of value) {
    if (signal.aborted) break;
    node.textContent += character;
    await delay(character === " " ? 18 : 35, signal);
  }
  node.classList.remove("typing-caret");
}

async function playSequence() {
  sequenceController?.abort();
  sequenceController = new AbortController();
  const { signal } = sequenceController;

  await showScene("#sceneGreeting", 10, signal);
  await delay(reduceMotion ? 1000 : 2800, signal);
  if (signal.aborted) return;
  await showScene("#sceneBirthday", 25, signal);
  await delay(reduceMotion ? 1000 : 2200, signal);
  if (signal.aborted) return;
  await showScene("#sceneChat", 40, signal);
  await typeChat(signal);
  await delay(reduceMotion ? 700 : 1100, signal);

  const ideas = [...document.querySelectorAll(".idea")];
  ideas.forEach((idea) => {
    idea.style.opacity = "0";
    idea.style.visibility = "hidden";
  });
  await showScene("#sceneIdeas", 55, signal);
  for (const [index, idea] of ideas.entries()) {
    if (signal.aborted) return;
    idea.style.visibility = "visible";
    await animate(idea, [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "translateY(0)" }]);
    await delay(reduceMotion ? 850 : index === ideas.length - 1 ? 2000 : 1450, signal);
    await animate(idea, [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-18px)" }], { duration: 380 });
    idea.style.visibility = "hidden";
  }

  if (signal.aborted) return;
  createBalloons();
  const portraitWrap = $(".portrait-wrap");
  const finalCopy = $(".final-copy");
  portraitWrap.style.opacity = "0";
  finalCopy.style.opacity = "0";
  const finalScene = await showScene("#sceneFinal", 78, signal);
  launchConfetti();
  await Promise.all([
    animate(portraitWrap, [{ opacity: 0, transform: "scale(.7) rotate(-5deg)" }, { opacity: 1, transform: "scale(1) rotate(0)" }], { duration: 900 }),
    animate(finalCopy, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 250 }),
  ]);
  await delay(reduceMotion ? 1800 : 6500, signal);
  if (signal.aborted || !finalScene) return;
  await showOutro(signal);
}

async function showOutro(signal = new AbortController().signal) {
  await showScene("#sceneOutro", 100, signal);
  elements.skipButton.hidden = true;
  elements.replayButton.focus({ preventScroll: true });
}

function createBalloons() {
  const container = $("#balloons");
  if (container.childElementCount) return;
  const sources = ["img/ballon1.svg", "img/ballon2.svg", "img/ballon3.svg"];
  for (let index = 0; index < 18; index += 1) {
    const balloon = document.createElement("img");
    balloon.className = "balloon";
    balloon.src = sources[index % sources.length];
    balloon.alt = "";
    balloon.style.left = `${(index * 37) % 96}%`;
    balloon.style.setProperty("--delay", `${(index % 7) * -1.1}s`);
    balloon.style.setProperty("--duration", `${7 + (index % 5)}s`);
    balloon.style.setProperty("--drift", `${(index % 2 ? 1 : -1) * (20 + index)}px`);
    container.append(balloon);
  }
}

function launchConfetti() {
  if (reduceMotion) return;
  const canvas = $("#confetti");
  const context = canvas.getContext("2d");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  canvas.width = bounds.width * ratio;
  canvas.height = bounds.height * ratio;
  context.scale(ratio, ratio);
  const colors = ["#e94f87", "#ffb84d", "#7bdcb5", "#8067e8", "#ff6b57"];
  const pieces = Array.from({ length: 90 }, (_, index) => ({
    x: bounds.width / 2 + (Math.random() - .5) * 120,
    y: bounds.height * .35,
    vx: (Math.random() - .5) * 12,
    vy: -5 - Math.random() * 9,
    gravity: .18 + Math.random() * .08,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - .5) * .25,
    size: 5 + Math.random() * 7,
    color: colors[index % colors.length],
  }));
  const startedAt = performance.now();

  function draw(now) {
    context.clearRect(0, 0, bounds.width, bounds.height);
    for (const piece of pieces) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += piece.gravity;
      piece.rotation += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .66);
      context.restore();
    }
    if (now - startedAt < 4200) requestAnimationFrame(draw);
    else context.clearRect(0, 0, bounds.width, bounds.height);
  }
  requestAnimationFrame(draw);
}

async function startApp() {
  appStarted = true;
  elements.startScreen.hidden = true;
  elements.experience.hidden = false;
  elements.skipButton.hidden = false;
  elements.audio.currentTime = 0;
  await playAudio();
  playSequence();
}

elements.startButton.addEventListener("click", startApp);
elements.audioToggle.addEventListener("click", async () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) await playAudio(); else elements.audio.pause();
  setAudioButton();
});
elements.skipButton.addEventListener("click", async () => {
  sequenceController?.abort();
  createBalloons();
  await showOutro();
});
elements.replayButton.addEventListener("click", () => {
  document.querySelectorAll(".idea").forEach((idea) => {
    idea.style.opacity = "0";
    idea.style.visibility = "hidden";
  });
  elements.skipButton.hidden = false;
  elements.audio.currentTime = 0;
  playAudio();
  playSequence();
});
elements.shareButton.addEventListener("click", async () => {
  const url = config.siteUrl || window.location.href;
  const shareData = { title: document.title, text: config.shareText, url };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      elements.shareStatus.textContent = "Shared with love ❤️";
    } else {
      await navigator.clipboard.writeText(url);
      elements.shareStatus.textContent = "Link copied! ❤️";
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      elements.shareStatus.textContent = "Copy the link from your browser to share it.";
    }
  }
});
elements.portrait.addEventListener("error", () => {
  elements.portrait.src = "img/favicon.png";
  showError("Foto utama tidak ditemukan, jadi gambar cadangan digunakan.");
}, { once: true });
document.addEventListener("visibilitychange", () => {
  if (!appStarted) return;
  if (document.hidden) elements.audio.pause(); else playAudio();
});

loadConfig().then(preloadAssets);
