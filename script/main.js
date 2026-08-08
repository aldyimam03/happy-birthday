"use strict";

const DEFAULT_CONFIG = {
  greeting: "Hi...",
  name: "Sarah Aqila Rahman",
  greetingText: "I really like your name btw!",
  wishText: "Hopefully at your current age, what you are pursuing you can achieve 🙌🏻",
  imagePath: "img/AhaConvert_sarah_1.webp",
  portraitPhotos: [
    "img/AhaConvert_sarah_1.webp",
    "img/AhaConvert_sarah_2.webp",
    "img/AhaConvert_sarah_3.webp",
    "img/AhaConvert_sarah_4.webp",
    "img/AhaConvert_sarah_5.webp",
  ],
  portraitFocus: ["50% 45%", "50% 42%", "50% 42%", "50% 38%", "50% 42%"],
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
  replayPrompt: "Or click, if you want to watch",
  replayLabel: "Watch it again",
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
  openingGift: $("#openingGift"),
  giftLid: $("#giftLid"),
  loader: $("#loader"),
  loaderBar: $("#loaderBar"),
  loaderText: $("#loaderText"),
  experience: $("#experience"),
  audio: $("#birthdayAudio"),
  audioToggle: $("#audioToggle"),
  volumeSlider: $("#volumeSlider"),
  skipButton: $("#skipButton"),
  replayButton: $("#replayButton"),
  shareButton: $("#shareButton"),
  shareStatus: $("#shareStatus"),
  reviewScene: $("#reviewScene"),
  reviewContent: $("#reviewContent"),
  reviewControls: $("#reviewControls"),
  reviewPrevious: $("#reviewPrevious"),
  reviewNext: $("#reviewNext"),
  progress: $("#progress span"),
  error: $("#errorMessage"),
  portrait: $("#portrait"),
  portraits: [...document.querySelectorAll(".portrait-bubble")],
  chatSendButton: $("#chatSendButton"),
  chatCursorHint: $("#chatCursorHint"),
};

let config = { ...DEFAULT_CONFIG };
let sequenceController = null;
let appStarted = false;
let musicEnabled = true;
let currentVolume = 0.35;
let activeScene = null;
let progressAnimation = null;
let reviewSlides = [];
let reviewIndex = -1;
let reviewReady = false;
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
  elements.portraits.forEach((portrait, index) => {
    portrait.src = config.portraitPhotos[index] || config.imagePath;
    portrait.alt = `Foto ${config.name} ${index + 1}`;
    portrait.style.objectPosition = config.portraitFocus[index] || "50% 50%";
  });
  document.title = `Selamat Ulang Tahun, ${config.name}! 🎉`;
  elements.startSubtitle.textContent = `Ada pesan spesial untuk ${config.name}. Aktifkan suara, lalu buka saat kamu siap.`;
  renderGallery();
  prepareAnimatedText();
  buildReviewSlides();
  applySocialMetadata();
}

function buildReviewSlides() {
  reviewSlides = [
    { type: "text", title: `${config.greeting} ${config.name}`, body: config.greetingText },
    { type: "text", title: config.text1 },
    { type: "text", title: "A little birthday message", body: config.textInChatBox },
    { type: "text", title: config.text2 },
    { type: "text", title: config.text3 },
    { type: "text", title: `${config.text4} ${config.text4Adjective}.` },
    { type: "text", title: config.text5Entry, body: `${config.text5Content} ${config.smiley}` },
    ...config.galleryPhotos.map((source, index) => ({
      type: "photo",
      source,
      caption: config.galleryCaptions[index] || `Memory ${index + 1}`,
      focus: config.galleryFocus[index] || "50% 50%",
    })),
    { type: "text", title: config.galleryMore },
    { type: "final" },
  ];
  reviewIndex = reviewSlides.length;
}

function renderReviewSlide(slide) {
  elements.reviewContent.replaceChildren();
  if (slide.type === "photo") {
    const figure = document.createElement("figure");
    figure.className = "review-photo-card";
    const image = document.createElement("img");
    image.src = slide.source;
    image.alt = slide.caption;
    image.style.objectPosition = slide.focus;
    const detectReviewOrientation = () => {
      figure.classList.toggle("is-portrait", image.naturalHeight > image.naturalWidth);
    };
    image.addEventListener("load", detectReviewOrientation, { once: true });
    if (image.complete) detectReviewOrientation();
    const caption = document.createElement("figcaption");
    caption.textContent = slide.caption;
    figure.append(image, caption);
    elements.reviewContent.append(figure);
    return;
  }
  if (slide.type === "final") {
    const wrapper = document.createElement("div");
    wrapper.className = "review-final";
    const portraits = $(".portrait-wrap").cloneNode(true);
    const copy = $(".final-copy").cloneNode(true);
    portraits.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    portraits.querySelectorAll(".portrait-bubble, .hat").forEach((node) => {
      node.hidden = false;
      node.style.opacity = "1";
      node.style.visibility = "visible";
    });
    copy.hidden = false;
    copy.style.opacity = "1";
    copy.querySelectorAll(".text-piece").forEach((piece) => { piece.style.opacity = "1"; });
    wrapper.append(portraits, copy);
    elements.reviewContent.append(wrapper);
    return;
  }
  const card = document.createElement("article");
  card.className = "review-text-card";
  const title = document.createElement("h2");
  title.textContent = slide.title;
  card.append(title);
  if (slide.body) {
    const body = document.createElement("p");
    body.textContent = slide.body;
    card.append(body);
  }
  elements.reviewContent.append(card);
}

function showOutroForReview() {
  elements.reviewScene.classList.remove("is-active");
  elements.reviewScene.hidden = true;
  activeScene = $("#sceneOutro");
  activeScene.classList.add("is-active");
  reviewIndex = reviewSlides.length;
  setReviewProgress(100);
}

function setReviewProgress(targetPercent) {
  const trackWidth = elements.progress.parentElement.getBoundingClientRect().width;
  const currentWidth = elements.progress.getBoundingClientRect().width;
  const currentPercent = trackWidth ? Math.min(100, (currentWidth / trackWidth) * 100) : 0;
  progressAnimation?.cancel();
  elements.progress.style.width = `${currentPercent}%`;
  progressAnimation = elements.progress.animate(
    [{ width: `${currentPercent}%` }, { width: `${targetPercent}%` }],
    { duration: 360, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" },
  );
}

function navigateReview(direction) {
  if (!reviewReady) return;
  if (reviewIndex === reviewSlides.length) {
    reviewIndex = direction < 0 ? reviewSlides.length - 1 : 0;
  } else {
    reviewIndex += direction;
    if (reviewIndex < 0 || reviewIndex >= reviewSlides.length) {
      showOutroForReview();
      return;
    }
  }
  activeScene?.classList.remove("is-active");
  elements.reviewScene.hidden = false;
  elements.reviewScene.classList.add("is-active");
  activeScene = elements.reviewScene;
  renderReviewSlide(reviewSlides[reviewIndex]);
  setReviewProgress(((reviewIndex + 1) / (reviewSlides.length + 1)) * 100);
  animate(elements.reviewContent, [
    { opacity: 0, transform: `translateX(${direction > 0 ? 24 : -24}px) scale(.985)` },
    { opacity: 1, transform: "translateX(0) scale(1)" },
  ], { duration: 360 });
}

function splitAnimatedText(selector, mode = "words") {
  const node = $(selector);
  if (!node || node.dataset.textPrepared) return;
  const value = node.textContent.trim();
  node.dataset.textPrepared = "true";
  node.setAttribute("aria-label", value);
  node.replaceChildren();
  const parts = mode === "letters" ? [...value] : value.split(/(\s+)/);
  parts.forEach((part) => {
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    if (/^\s+$/.test(part)) {
      span.className = "text-space";
      span.textContent = " ";
    } else {
      span.className = "text-piece";
      span.textContent = part;
    }
    node.append(span);
  });
}

function prepareAnimatedText() {
  splitAnimatedText('[data-field="name"]', "letters");
  splitAnimatedText('[data-field="text1"]');
  splitAnimatedText('[data-field="galleryTitle"]');
  splitAnimatedText('[data-field="wishHeading"]', "letters");
}

function animateTextPieces(selector, variant = "rise") {
  const pieces = [...document.querySelectorAll(`${selector} .text-piece`)];
  const starts = {
    rise: { opacity: 0, transform: "translateY(24px) rotateX(-55deg)" },
    pop: { opacity: 0, transform: "scale(.35) rotate(-7deg)" },
    alternate: null,
    letters: { opacity: 0, transform: "translateY(-30px) rotate(12deg) scale(.7)" },
    name: null,
  };
  return Promise.all(pieces.map((piece, index) => {
    const start = variant === "alternate"
      ? { opacity: 0, transform: `translateX(${index % 2 ? 30 : -30}px) rotate(${index % 2 ? 3 : -3}deg)` }
      : variant === "name"
        ? {
          opacity: 0,
          transform: `translate3d(${index % 2 ? 16 : -16}px, -18px, 0) scale(${1.9 - Math.min(index * 0.035, 0.45)}) rotate(${index % 2 ? 14 : -14}deg)`,
        }
      : starts[variant];
    return animate(piece, [start, { opacity: 1, transform: "translate(0) rotate(0) scale(1)" }], {
      duration: variant === "letters" ? 520 : variant === "name" ? 560 : 620,
      delay: index * (variant === "letters" ? 55 : variant === "name" ? 44 : 110),
      easing: variant === "pop" || variant === "letters" || variant === "name" ? "cubic-bezier(.34, 1.56, .64, 1)" : "cubic-bezier(.22, 1, .36, 1)",
    });
  }));
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
  await Promise.all(elements.portraits.map(async (portrait) => {
    try {
      if (!portrait.complete) await portrait.decode();
    } catch (error) {
      console.warn(`Foto Sarah belum selesai dimuat: ${portrait.src}`, error);
    }
  }));
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
  const levelIcon = currentVolume > 0.66 ? "🔊" : currentVolume > 0.2 ? "🔉" : "🔈";
  elements.audioToggle.textContent = playing ? levelIcon : "🔇";
  elements.audioToggle.setAttribute("aria-label", playing ? "Matikan musik" : "Nyalakan musik");
  elements.audioToggle.setAttribute("aria-pressed", String(!musicEnabled));
}

function applyVolume(volume) {
  currentVolume = Math.max(0, Math.min(1, volume));
  elements.audio.volume = currentVolume;
  if (elements.volumeSlider) {
    elements.volumeSlider.value = String(Math.round(currentVolume * 100));
    elements.volumeSlider.setAttribute("aria-valuenow", elements.volumeSlider.value);
    elements.volumeSlider.setAttribute("aria-valuetext", `${elements.volumeSlider.value}%`);
  }
  if (musicEnabled && currentVolume === 0) {
    musicEnabled = false;
  } else if (!musicEnabled && currentVolume > 0) {
    musicEnabled = true;
  }
  setAudioButton();
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
  const wordCount = (value) => value.trim().split(/\s+/).length;
  const greetingTextMotion = Math.max(0, 620 + ((wordCount(config.name) - 1) * 110) - 650);
  const birthdayTextMotion = Math.max(0, 620 + ((wordCount(config.text1) - 1) * 110) - 650);
  const galleryTextMotion = Math.max(0, 620 + ((wordCount(config.galleryTitle) - 1) * 110) - 650);
  const wishTextMotion = 520 + (([...config.wishHeading].filter((character) => character.trim()).length - 1) * 55);
  const greetingAndBirthday = 650 + 2800 + 1030 + 2200;
  const chat = Math.max(1030, 380 + typingDuration) + 1100;
  const ideas = 1030 + (4 * (700 + 380)) + (3 * 1450) + 2000;
  const gallery = 1030 + (config.galleryPhotos.length * (700 + 2100 + 450)) + 750 + 2200;
  const portraits = 700 + (Math.max(0, config.portraitPhotos.length - 1) * 480) + 980;
  const finalAndOutro = 1030 + portraits + wishTextMotion + 6500 + 1030;
  return greetingAndBirthday + greetingTextMotion + birthdayTextMotion + chat + ideas + gallery + galleryTextMotion + finalAndOutro;
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

function setProgressPaused(paused) {
  if (!progressAnimation) return;
  if (paused) progressAnimation.pause();
  else progressAnimation.play();
}

function resetRuntimeAnimations() {
  const animatedSelectors = [
    ".scene",
    ".text-piece",
    ".idea",
    ".memory-card",
    ".gallery-more",
    ".portrait-bubble",
    ".portrait-wrap .hat",
    ".final-copy",
    "#reviewContent",
    "#progress span",
  ];
  document.querySelectorAll(animatedSelectors.join(",")).forEach((node) => {
    node.getAnimations().forEach((animation) => animation.cancel());
  });
  document.querySelectorAll(".text-piece").forEach((piece) => {
    piece.style.opacity = "0";
    piece.style.transform = "";
  });
  const chatNode = $("#chatText");
  chatNode.textContent = "";
  chatNode.classList.remove("typing-caret");
  elements.chatSendButton.disabled = true;
  elements.chatSendButton.classList.remove("is-visible", "is-sent");
  elements.chatCursorHint.classList.remove("is-visible");
  document.querySelectorAll(".portrait-bubble").forEach((portrait) => {
    portrait.hidden = true;
    portrait.style.opacity = "0";
    portrait.style.transform = "";
  });
  const partyHat = $(".portrait-wrap .hat");
  partyHat.hidden = true;
  partyHat.style.opacity = "0";
  partyHat.style.transform = "";
  const finalCopy = $(".final-copy");
  finalCopy.hidden = true;
  finalCopy.style.opacity = "0";
  finalCopy.style.transform = "";
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

async function showChatSendPrompt(signal) {
  if (signal.aborted) return;
  elements.chatSendButton.disabled = false;
  elements.chatSendButton.classList.add("is-visible");
  if (!reduceMotion) {
    await animate(elements.chatSendButton, [
      { opacity: 0, transform: "translateY(12px) scale(.96)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ], { duration: 320, easing: "cubic-bezier(.34, 1.56, .64, 1)" });
  }
  if (signal.aborted) return;
  elements.chatCursorHint.classList.add("is-visible");
}

async function autoSendChat(signal) {
  if (signal.aborted) return;
  setProgressPaused(true);
  await delay(reduceMotion ? 240 : 920, signal);
  if (signal.aborted) {
    setProgressPaused(false);
    return;
  }
  elements.chatSendButton.classList.add("is-sent");
  await animate(elements.chatSendButton, [
    { transform: "translateY(0) scale(1)" },
    { transform: "translateY(1px) scale(.93)", offset: .45 },
    { transform: "translateY(0) scale(1)" },
  ], { duration: reduceMotion ? 120 : 260, easing: "cubic-bezier(.34, 1.56, .64, 1)" });
  elements.chatCursorHint.classList.remove("is-visible");
  elements.chatSendButton.disabled = true;
  setProgressPaused(false);
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

  let greetingAnimation;
  await showScene("#sceneGreeting", 10, signal, () => {
    greetingAnimation = animateTextPieces('[data-field="name"]', "name");
  });
  await greetingAnimation;
  await delay(reduceMotion ? 1000 : 2800, signal);
  if (signal.aborted) return;
  let birthdayAnimation;
  await showScene("#sceneBirthday", 25, signal, () => {
    birthdayAnimation = animateTextPieces('[data-field="text1"]', "pop");
  });
  await birthdayAnimation;
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
  if (signal.aborted) return;
  await showChatSendPrompt(signal);
  if (signal.aborted) return;
  await autoSendChat(signal);
  if (signal.aborted) return;
  await delay(reduceMotion ? 180 : 360, signal);

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
  let galleryTitleAnimation;
  await showScene("#sceneGallery", 68, signal, () => {
    galleryTitleAnimation = animateTextPieces('[data-field="galleryTitle"]', "alternate");
  });
  await galleryTitleAnimation;
  await playGallery(signal);
  if (signal.aborted) return;
  createBalloons();
  const portraitWrap = $(".portrait-wrap");
  const finalCopy = $(".final-copy");
  const portraitBubbles = [...document.querySelectorAll(".portrait-bubble")];
  const partyHat = $(".portrait-wrap .hat");
  portraitWrap.style.opacity = "1";
  portraitBubbles.forEach((portrait) => {
    portrait.hidden = true;
    portrait.style.opacity = "0";
  });
  partyHat.hidden = true;
  partyHat.style.opacity = "0";
  finalCopy.hidden = true;
  finalCopy.style.opacity = "0";
  const finalScene = await showScene("#sceneFinal", 84, signal);
  for (const [index, portrait] of portraitBubbles.entries()) {
    if (signal.aborted) return;
    portrait.hidden = false;
    await animate(portrait, [
      { opacity: 0, transform: `translateX(${index === 0 ? 0 : index % 2 ? 24 : -24}px) scale(.55) rotate(${index % 2 ? 10 : -10}deg)` },
      { opacity: 1, transform: "translateX(0) scale(1) rotate(0)" },
    ], { duration: index === 0 ? 700 : 480, easing: "cubic-bezier(.34, 1.56, .64, 1)" });
  }
  partyHat.hidden = false;
  finalCopy.hidden = false;
  await Promise.all([
    animate(partyHat, [{ opacity: 0, transform: "translateX(-50%) translateY(-30px) rotate(-16deg)" }, { opacity: 1, transform: "translateX(-50%) translateY(0) rotate(-4deg)" }], { duration: 550 }),
    animate(finalCopy, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 800, delay: 180 }),
  ]);
  await animateTextPieces('[data-field="wishHeading"]', "letters");
  launchConfetti();
  await delay(reduceMotion ? 1800 : 6500, signal);
  if (signal.aborted || !finalScene) return;
  await showOutro(signal);
}

async function showOutro(signal = new AbortController().signal) {
  await showScene("#sceneOutro", 100, signal);
  finishProgress();
  elements.skipButton.hidden = true;
  reviewReady = true;
  reviewIndex = reviewSlides.length;
  elements.reviewControls.hidden = false;
  elements.replayButton.focus({ preventScroll: true });
}

function createBalloons() {
  const container = $("#balloons");
  if (container.childElementCount) return;
  const sources = ["img/ballon1.svg", "img/ballon2.svg", "img/ballon3.svg"];
  const colorVariants = [
    "hue-rotate(0deg) saturate(1)",
    "hue-rotate(35deg) saturate(1.12)",
    "hue-rotate(75deg) saturate(1.18)",
    "hue-rotate(120deg) saturate(1.15)",
    "hue-rotate(185deg) saturate(1.08)",
    "hue-rotate(245deg) saturate(1.14)",
    "hue-rotate(300deg) saturate(1.1)",
    "hue-rotate(330deg) saturate(1.06)",
  ];
  for (let index = 0; index < 60; index += 1) {
    const balloon = document.createElement("img");
    balloon.className = "balloon";
    balloon.src = sources[index % sources.length];
    balloon.alt = "";
    balloon.style.left = `${(index * 17) % 98}%`;
    balloon.style.setProperty("--delay", `${(index % 9) * -0.95}s`);
    balloon.style.setProperty("--duration", `${6.5 + (index % 6)}s`);
    balloon.style.setProperty("--drift", `${(index % 2 ? 1 : -1) * (18 + (index * 1.5))}px`);
    balloon.style.setProperty("--lift", `${122 + (index % 4) * 6}vh`);
    balloon.style.setProperty("--balloon-scale", `${0.82 + (index % 5) * 0.08}`);
    balloon.style.setProperty("--balloon-filter", colorVariants[index % colorVariants.length]);
    balloon.style.zIndex = String(1 + (index % 4));
    balloon.style.opacity = String(0.56 + ((index % 5) * 0.08));
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

async function playOpeningTransition() {
  const glow = $(".gift-glow");
  const sparks = [...document.querySelectorAll(".gift-spark")];
  const startContent = [
    $(".start-card > .eyebrow"),
    $(".start-card > h1"),
    elements.startSubtitle,
    elements.loader,
    elements.startButton,
  ];

  await Promise.all([
    ...startContent.map((node) => animate(node, [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(10px)" },
    ], { duration: reduceMotion ? 80 : 320 })),
    animate(elements.openingGift, [
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 1, transform: "translateY(-7px) scale(1.05)", offset: .62 },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ], { duration: reduceMotion ? 80 : 420 }),
  ]);

  await Promise.all([
    animate(elements.giftLid, [
      { transform: "translateY(0) rotate(0)" },
      { transform: "translateY(-46px) translateX(13px) rotate(18deg)" },
    ], { duration: reduceMotion ? 100 : 520, easing: "cubic-bezier(.34, 1.56, .64, 1)" }),
    animate(glow, [{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(3.2)" }], { duration: reduceMotion ? 100 : 600 }),
    ...sparks.map((spark, index) => animate(spark, [
      { opacity: 0, transform: "translate(0, 0) scale(.4) rotate(0)" },
      { opacity: 1, transform: `translate(var(--spark-x), var(--spark-y)) scale(1) rotate(${index % 2 ? 40 : -40}deg)`, offset: .7 },
      { opacity: 0, transform: `translate(var(--spark-x), calc(var(--spark-y) - 18px)) scale(.7)` },
    ], { duration: reduceMotion ? 100 : 850, delay: reduceMotion ? 0 : index * 70 })),
  ]);

  await delay(reduceMotion ? 50 : 260);
  await Promise.all([
    animate(elements.openingGift, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(10)" },
    ], { duration: reduceMotion ? 120 : 800, easing: "cubic-bezier(.7, 0, .84, 0)" }),
    animate(elements.startScreen, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(1.16)" },
    ], { duration: reduceMotion ? 120 : 800, easing: "cubic-bezier(.7, 0, .84, 0)" }),
  ]);
}

async function startApp() {
  appStarted = true;
  elements.startButton.disabled = true;
  elements.startScreen.classList.add("is-opening");
  elements.experience.hidden = false;
  elements.skipButton.hidden = false;
  elements.audio.currentTime = 0;
  await playAudio();
  await playOpeningTransition();
  elements.startScreen.hidden = true;
  elements.startScreen.classList.remove("is-opening");
  playSequence();
}

elements.startButton.addEventListener("click", startApp);
elements.audioToggle.addEventListener("click", async () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) await playAudio(); else elements.audio.pause();
  setAudioButton();
});
elements.volumeSlider?.addEventListener("input", async (event) => {
  const nextVolume = Number(event.target.value) / 100;
  const wasMuted = !musicEnabled;
  applyVolume(nextVolume);
  if (musicEnabled) {
    await playAudio();
  } else if (!wasMuted) {
    elements.audio.pause();
  }
});
elements.skipButton.addEventListener("click", async () => {
  sequenceController?.abort();
  finishProgress(450);
  createBalloons();
  await showOutro();
});
elements.replayButton.addEventListener("click", () => {
  reviewReady = false;
  elements.reviewControls.hidden = true;
  elements.reviewScene.hidden = true;
  resetRuntimeAnimations();
  document.querySelectorAll(".idea").forEach((idea) => {
    idea.style.opacity = "0";
    idea.style.visibility = "hidden";
  });
  elements.skipButton.hidden = false;
  elements.audio.currentTime = 0;
  playAudio();
  playSequence();
});
elements.reviewPrevious.addEventListener("click", () => navigateReview(-1));
elements.reviewNext.addEventListener("click", () => navigateReview(1));
elements.shareButton.addEventListener("click", async () => {
  animate(elements.shareButton, [
    { transform: "scale(1)" },
    { transform: "scale(.95)", offset: .35 },
    { transform: "scale(1.06)", offset: .72 },
    { transform: "scale(1)" },
  ], { duration: 520, easing: "cubic-bezier(.34, 1.56, .64, 1)" });
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
elements.portraits.forEach((portrait) => {
  portrait.addEventListener("error", () => {
    portrait.src = "img/favicon.png";
    showError("Salah satu foto Sarah tidak ditemukan, jadi gambar cadangan digunakan.");
  }, { once: true });
});
document.addEventListener("visibilitychange", () => {
  if (!appStarted) return;
  if (document.hidden) elements.audio.pause(); else playAudio();
});

applyVolume(currentVolume);
loadConfig().then(preloadAssets);
