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
  galleryTitle: "Some moments I’ll always keep",
  galleryMore: "And so many more memories still waiting for us...",
  galleryPhotos: [
    "img/AhaConvert_our_1.webp",
    "img/AhaConvert_our_2.webp",
    "img/AhaConvert_our_3.webp",
    "img/AhaConvert_our_4.webp",
    "img/AhaConvert_our_5.webp",
  ],
  galleryCaptions: [
    "A beautiful view, made better with you.",
    "One of those days worth remembering.",
    "The kind of happiness I want to keep.",
    "Every little adventure feels special with you.",
    "And, of course, our wonderfully silly moments.",
  ],
  galleryFocus: ["50% 58%", "50% 50%", "50% 50%", "50% 50%", "50% 53%"],
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
let progressAnimation = null;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function loadConfig() {
  try {
    const response = await fetch("customize.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const incoming = await response.json();
    config = Object.fromEntries(Object.entries(DEFAULT_CONFIG).map(([key, fallback]) => {
      const customValue = incoming[key];
      if (Array.isArray(fallback)) {
        return [key, Array.isArray(customValue) && customValue.length ? customValue : fallback];
      }
      return [key, typeof customValue === "string" && customValue.trim() ? customValue.trim() : fallback];
    }));
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
  renderGallery();
  applySocialMetadata();
}

function renderGallery() {
  const stage = $("#galleryStage");
  const dots = $("#galleryDots");
  stage.replaceChildren();
  dots.replaceChildren();
  config.galleryPhotos.forEach((source, index) => {
    const figure = document.createElement("figure");
    figure.className = "memory-card";
    const photoFrame = document.createElement("div");
    photoFrame.className = "memory-photo-frame";
    const photo = document.createElement("img");
    photo.src = source;
    photo.style.objectPosition = config.galleryFocus[index] || "50% 50%";
    photo.alt = `Kenangan bersama ${config.name}, foto ${index + 1}`;
    photo.loading = "eager";
    const detectOrientation = () => {
      figure.classList.toggle("is-portrait", photo.naturalHeight > photo.naturalWidth);
    };
    photo.addEventListener("load", detectOrientation, { once: true });
    if (photo.complete) detectOrientation();
    const caption = document.createElement("figcaption");
    caption.textContent = config.galleryCaptions[index] || `Memory ${index + 1}`;
    photoFrame.append(photo);
    figure.append(photoFrame, caption);
    stage.append(figure);

    const dot = document.createElement("span");
    dots.append(dot);
  });
  const more = document.createElement("p");
  more.id = "galleryMore";
  more.className = "gallery-more";
  more.dataset.field = "galleryMore";
  more.textContent = config.galleryMore;
  stage.append(more);
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
  updateLoader(15, "Memuat foto utama…");
  try {
    if (!elements.portrait.complete) await elements.portrait.decode();
  } catch (error) {
    console.warn("Foto belum selesai dimuat:", error);
  }
  updateLoader(35, "Memuat kenangan…");
  const galleryImages = [...document.querySelectorAll(".memory-card img")];
  await Promise.all(galleryImages.map(async (image) => {
    try {
      if (!image.complete) await image.decode();
    } catch (error) {
      console.warn(`Foto galeri gagal dimuat: ${image.src}`, error);
    }
  }));
  updateLoader(75, "Memuat musik…");
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

function estimateSequenceDuration() {
  if (reduceMotion) {
    return 6500 + (config.galleryPhotos.length * 1100);
  }
  const typingDuration = [...config.textInChatBox].reduce((total, character) => total + (character === " " ? 18 : 35), 0);
  const greetingAndBirthday = 650 + 2800 + 1030 + 2200;
  const chat = Math.max(1030, 380 + typingDuration) + 1100;
  const ideas = 1030 + (4 * (700 + 380)) + (3 * 1450) + 2000;
  const gallery = 1030 + (config.galleryPhotos.length * (700 + 2100 + 450)) + 750 + 2200;
  const finalAndOutro = 1030 + 900 + 6500 + 1030;
  return greetingAndBirthday + chat + ideas + gallery + finalAndOutro;
}

function startProgress() {
  progressAnimation?.cancel();
  elements.progress.style.width = "0%";
  progressAnimation = elements.progress.animate(
    [{ width: "0%" }, { width: "100%" }],
    { duration: estimateSequenceDuration(), easing: "linear", fill: "forwards" },
  );
}

function finishProgress(duration = 700) {
  const trackWidth = elements.progress.parentElement.getBoundingClientRect().width;
  const currentWidth = elements.progress.getBoundingClientRect().width;
  const currentPercent = trackWidth ? Math.min(100, (currentWidth / trackWidth) * 100) : 0;
  progressAnimation?.cancel();
  elements.progress.style.width = `${currentPercent}%`;
  progressAnimation = elements.progress.animate(
    [{ width: `${currentPercent}%` }, { width: "100%" }],
    { duration, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" },
  );
}

async function showScene(selector, progress, signal, onActivated) {
  if (signal.aborted) return null;
  if (activeScene) {
    await animate(activeScene, [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-18px)" }], { duration: 380 });
    activeScene.classList.remove("is-active");
  }
  activeScene = $(selector);
  activeScene.classList.add("is-active");
  onActivated?.();
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

async function playGallery(signal) {
  const cards = [...document.querySelectorAll(".memory-card")];
  const dots = [...document.querySelectorAll(".gallery-dots span")];
  const more = $("#galleryMore");
  more.style.opacity = "0";
  more.style.visibility = "hidden";
  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.visibility = "hidden";
  });

  for (const [index, card] of cards.entries()) {
    if (signal.aborted) return;
    card.style.visibility = "visible";
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
    await animate(card, [
      { opacity: 0, transform: "translateX(28px) scale(.96) rotate(2deg)" },
      { opacity: 1, transform: `translateX(0) scale(1) rotate(${index % 2 ? 1 : -1}deg)` },
    ], { duration: 700 });
    await delay(reduceMotion ? 1100 : 2100, signal);
    await animate(card, [
      { opacity: 1, transform: `translateX(0) scale(1) rotate(${index % 2 ? 1 : -1}deg)` },
      { opacity: 0, transform: "translateX(-28px) scale(.97) rotate(-2deg)" },
    ], { duration: 450 });
    card.style.visibility = "hidden";
  }
  if (signal.aborted) return;
  dots.forEach((dot) => dot.classList.remove("is-active"));
  more.style.visibility = "visible";
  await animate(more, [
    { opacity: 0, transform: "translateY(18px) scale(.97)" },
    { opacity: 1, transform: "translateY(0) scale(1)" },
  ], { duration: 750 });
  await delay(reduceMotion ? 1100 : 2200, signal);
}

async function playSequence() {
  sequenceController?.abort();
  sequenceController = new AbortController();
  const { signal } = sequenceController;
  startProgress();

  await showScene("#sceneGreeting", 10, signal);
  await delay(reduceMotion ? 1000 : 2800, signal);
  if (signal.aborted) return;
  await showScene("#sceneBirthday", 25, signal);
  await delay(reduceMotion ? 1000 : 2200, signal);
  if (signal.aborted) return;
  const chatNode = $("#chatText");
  if (reduceMotion) {
    chatNode.textContent = config.textInChatBox;
  } else {
    chatNode.textContent = "";
    chatNode.classList.add("typing-caret");
  }
  let typingPromise;
  await showScene("#sceneChat", 40, signal, () => {
    typingPromise = typeChat(signal);
  });
  await typingPromise;
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
  await showScene("#sceneGallery", 68, signal);
  await playGallery(signal);
  if (signal.aborted) return;
  createBalloons();
  const portraitWrap = $(".portrait-wrap");
  const finalCopy = $(".final-copy");
  portraitWrap.style.opacity = "0";
  finalCopy.style.opacity = "0";
  const finalScene = await showScene("#sceneFinal", 84, signal);
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
  finishProgress();
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
  finishProgress(450);
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
