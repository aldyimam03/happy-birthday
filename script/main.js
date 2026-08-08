"use strict";

const DEFAULT_CONFIG = {
  greeting: "Hai...",
  name: "Seseorang yang Spesial",
  greetingText: "Hari ini adalah harimu.",
  wishText: "Semoga semua hal baik selalu menemukan jalan menuju kamu.",
  imagePath: "img/sarah.jpeg",
  text1: "Ini hari ulang tahunmu! 🎉",
  textInChatBox: "Selamat ulang tahun! Semoga panjang umur dan bahagia selalu...",
  sendButtonLabel: "Kirim",
  text2: "Awalnya, hanya itu yang ingin kukirim.",
  text3: "Tapi kemudian aku berhenti sejenak.",
  text4: "Aku ingin membuat sesuatu yang",
  text4Adjective: "spesial",
  text5Entry: "Karena,",
  text5Content: "kamu memang spesial",
  smiley: ":)",
  wishHeading: "Selamat Ulang Tahun!",
  outroText: "Sekarang, bilang padaku kalau kamu menyukainya.",
  replayText: "Putar sekali lagi",
  outroSmiley: ":)",
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
  experience: $("#experience"),
  audio: $("#birthdayAudio"),
  audioToggle: $("#audioToggle"),
  skipButton: $("#skipButton"),
  replayButton: $("#replayButton"),
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
  const finalScene = await showScene("#sceneFinal", 78, signal);
  await Promise.all([
    animate($(".portrait-wrap"), [{ opacity: 0, transform: "scale(.7) rotate(-5deg)" }, { opacity: 1, transform: "scale(1) rotate(0)" }], { duration: 900 }),
    animate($(".final-copy"), [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 900, delay: 250 }),
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
elements.portrait.addEventListener("error", () => {
  elements.portrait.src = "img/favicon.png";
  showError("Foto utama tidak ditemukan, jadi gambar cadangan digunakan.");
}, { once: true });
document.addEventListener("visibilitychange", () => {
  if (!appStarted) return;
  if (document.hidden) elements.audio.pause(); else playAudio();
});

loadConfig();
