var currentScore = 0;
var bestScore = 0;
var currentMessage = "";
var currentCorrectAnswer = -1; // 0 - real adi, 1 - AI
var hasAnswered = false;

const AI_PARTS_URL = "http://146.59.35.24/ai_parts/";
const REAL_PARTS_URL = "http://146.59.35.24/original_parts/";

const FILES_GUARANTEED = 50;
const MESSAGE_TO_FETCH_RATIO = 4;

const STORAGE_KEY = "guessGameBestScore";

function initializeGuessGame() {
  loadBestScore();
  initCategory(0);
  initCategory(1);
  loadNextGuessMessage();
}

function loadBestScore() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    bestScore = parseInt(saved, 10);
  }
  updateScoreDisplay();
}

function saveBestScore() {
  localStorage.setItem(STORAGE_KEY, bestScore.toString());
}

function updateScoreDisplay() {
  document.getElementById("currentScore").innerText = currentScore;
  document.getElementById("bestScore").innerText = bestScore;
}

async function loadNextGuessMessage() {
  if (hasAnswered === false && currentCorrectAnswer !== -1) {
    snackbarShowMessage(`<div style="color: #ff4444;">⚠ Musisz odpowiedzieć! Wynik resetowany!</div>`, "error");
    currentScore = 0;
    updateScoreDisplay();
  }
  
  document.getElementById("guessMessage").innerText = "Loading...";
  hasAnswered = false;
  await new Promise((resolve) => setTimeout(resolve, 250));
  const quoteEl = document.getElementById("guessQuote");
  if (quoteEl) {
    quoteEl.classList.remove("feedback-correct", "feedback-incorrect");
  }
  setButtonsEnabled(true);
  
  try {
    currentCorrectAnswer = Math.random() < 0.5 ? 0 : 1;
    await initCategory(currentCorrectAnswer);
    const cache = getCache(currentCorrectAnswer);
    if (!cache.sentences.length) {
      document.getElementById("guessMessage").innerText = "Błąd podczas wczytywania wiadomości.";
      return;
    }

    const randomIndex = randInt(0, cache.sentences.length - 1);
    currentMessage = cache.sentences[randomIndex] || "(Brak wiadomości)";
    
    document.getElementById("guessMessage").innerText = currentMessage;

    cache.servedSinceLastFetch = (cache.servedSinceLastFetch || 0) + 1;
    if (cache.servedSinceLastFetch >= MESSAGE_TO_FETCH_RATIO && !allFilesFetched(currentCorrectAnswer)) {
      cache.servedSinceLastFetch = 0;
      fetchRandomUnfetched(currentCorrectAnswer);
    }
  } catch (err) {
    console.error(err);
    document.getElementById("guessMessage").innerText = "Błąd";
  }
}

function makeGuess(guess) {
  if (currentMessage === "" || currentCorrectAnswer === -1) {
    snackbarShowMessage("<div>Załaduj najpierw wiadomość!</div>", "error");
    return;
  }

  hasAnswered = true;
  setButtonsEnabled(false);
  const quoteEl = document.getElementById("guessQuote");
  const currentScoreEl = document.getElementById("currentScore");

  if (guess === currentCorrectAnswer) {
    currentScore++;
    
    if (currentScore > bestScore) {
      bestScore = currentScore;
      saveBestScore();
    }
    
    updateScoreDisplay();
    if (currentScoreEl) {
      currentScoreEl.classList.add("bump");
      setTimeout(() => currentScoreEl.classList.remove("bump"), 1750);
    }
    if (quoteEl) quoteEl.classList.add("feedback-correct");
    snackbarShowMessage(`<div>Poprawnie!</div>`, "success");
    
    setTimeout(() => {
      if (quoteEl) quoteEl.classList.remove("feedback-correct");
    }, 1750);
    loadNextGuessMessage();
  } else {
    if (quoteEl) quoteEl.classList.add("feedback-incorrect");
    snackbarShowMessage(`<div>Źle! Wynik resetowany!</div>`, "error");
    
    currentScore = 0;
    updateScoreDisplay();
    
    setTimeout(() => {
      if (quoteEl) quoteEl.classList.remove("feedback-incorrect");
    }, 1750);
    loadNextGuessMessage();
  }
}

function setButtonsEnabled(enabled) {
  const buttons = document.querySelectorAll('.button-guess');
  buttons.forEach(btn => {
    btn.classList.toggle('disabled', !enabled);
    btn.disabled = !enabled;
  });
}

function snackbarShowMessage(message, type) {
  const x = document.getElementById("snackbar");
  x.innerHTML = message;
  x.classList.remove("success", "error");
  if (type === "success") x.classList.add("success");
  else if (type === "error") x.classList.add("error");
  showSnackbar();
}

function showSnackbar() {
  const x = document.getElementById("snackbar");
  x.classList.remove("hide", "hidden");
  x.classList.add("show");
  setTimeout(function () {
    x.classList.remove("show");
    x.classList.add("hide");
  }, 3000);
}

function goBack() {
  window.location.href = "index.html";
}

function copyGuessToClipboard() {
  var copyText = ":adi: ";
  var printText = '<span><img src="img/adison.png" alt="adi" class="image-adi">';
  copyText += document.getElementById("guessMessage").innerHTML;
  printText += document.getElementById("guessMessage").innerHTML;
  printText += "</span>";

  navigator.clipboard.writeText(copyText);

  snackbarShowMessage("<div>Skopiowano: " + printText + "</div>");
}

const caches = {
  0: {
    baseUrl: REAL_PARTS_URL,
    totalFiles: null,
    fetchedFiles: new Set(),
    pending: new Set(),
    sentences: [],
    servedSinceLastFetch: 0,
    initPromise: null,
  },
  1: {
    baseUrl: AI_PARTS_URL,
    totalFiles: null,
    fetchedFiles: new Set(),
    pending: new Set(),
    sentences: [],
    servedSinceLastFetch: 0,
    initPromise: null,
  },
};

function getCache(view) {
  return caches[view === 1 ? 1 : 0];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function fetchFileParts(baseUrl, index) {
  const response = await fetch(`${baseUrl}${index}.txt`);
  if (!response.ok) throw new Error("Nie udało się wczytać pliku.");
  const text = await response.text();
  const lines = text
    .split("\n")
    .map((l) => l.trim());

  if (lines.length < 3) throw new Error("Nieprawidłowy format pliku.");

  const totalFiles = parseInt(lines[0], 10);
  const sentencesInFile = parseInt(lines[1], 10);
  if (isNaN(totalFiles) || isNaN(sentencesInFile)) {
    throw new Error("Nieprawidłowy format pliku.");
  }

  const sentences = lines.slice(2).filter((s) => s !== "");
  return { totalFiles, sentences };
}

async function fetchAndStore(view, index) {
  const cache = getCache(view);
  if (cache.fetchedFiles.has(index) || cache.pending.has(index)) return;
  cache.pending.add(index);
  try {
    const { totalFiles, sentences } = await fetchFileParts(cache.baseUrl, index);
    if (cache.totalFiles === null) cache.totalFiles = totalFiles;
    cache.sentences.push(...sentences);
    cache.fetchedFiles.add(index);
  } finally {
    cache.pending.delete(index);
  }
}

function allFilesFetched(view) {
  const cache = getCache(view);
  return cache.totalFiles !== null && cache.fetchedFiles.size >= cache.totalFiles;
}

async function initCategory(view) {
  const cache = getCache(view);
  if (cache.initPromise) return cache.initPromise;
  const firstIndex = randInt(1, FILES_GUARANTEED);
  cache.initPromise = fetchAndStore(view, firstIndex).catch(() => {
    cache.initPromise = null;
    throw new Error("Błąd inicjalizacji kategorii");
  });
  return cache.initPromise;
}

async function fetchRandomUnfetched(view) {
  const cache = getCache(view);
  if (cache.totalFiles === null) return;
  if (allFilesFetched(view)) return;

  const notFetched = [];
  for (let i = 1; i <= cache.totalFiles; i++) {
    if (!cache.fetchedFiles.has(i) && !cache.pending.has(i)) notFetched.push(i);
  }
  if (notFetched.length === 0) return;
  const index = notFetched[randInt(0, notFetched.length - 1)];
  return fetchAndStore(view, index);
}
