var currentView = 0; // 0 - adison, 1 - AIderv1

const AI_PARTS_URL = "http://146.59.35.24/ai_parts/"
const REAL_PARTS_URL = "http://146.59.35.24/original_parts/"

const FILES_GUARANTEED = 50;
const MESSAGE_TO_FETCH_RATIO = 7;

var queue = [];

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

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCache(view) {
  return caches[view === 1 ? 1 : 0];
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

async function loadMessage() {
  document.getElementById("message").innerText = "Loading...";
  document.getElementById("quote").style.visibility = "visible";
  try {
    await initCategory(currentView);
    const cache = getCache(currentView);

    if (!cache.sentences.length) {
      document.getElementById("message").innerText = "Błąd";
      return;
    }

    const randomIndex = randInt(0, cache.sentences.length - 1);
    const message = cache.sentences[randomIndex] || "(Brak wiadomości)";
    printMessage(message);
    addMessageToQueue(message, currentView);

    cache.servedSinceLastFetch = (cache.servedSinceLastFetch || 0) + 1;
    if (cache.servedSinceLastFetch >= MESSAGE_TO_FETCH_RATIO && !allFilesFetched(currentView)) {
      cache.servedSinceLastFetch = 0;
      fetchRandomUnfetched(currentView);
    }

    switchBackButton();
  } catch (err) {
    document.getElementById("message").innerText = "Błąd";
  }
}

function ohShitGoBack() {
  if (queue.length) {
    queue.pop();
    const lastMessage = queue.pop();

    if (lastMessage) {
      changeView(lastMessage.view);
      printMessage(lastMessage.message);
      addMessageToQueue(lastMessage.message, lastMessage.view);
    } else {
      snackbarShowMessage("<div>To byla ostatnia wiadomość</div>")
    }
  }
  switchBackButton();
  toggleBadgeVisibility();
}

function copyToClipboard() {
  var copyText = ":adi: ";
  var printText =
    '<span><img src="img/adison.png" alt="adi" class="image-adi">';
  copyText += document.getElementById("message").innerHTML;
  printText += document.getElementById("message").innerHTML;
  printText += "</span>";

  navigator.clipboard.writeText(copyText);

  printText;

  snackbarShowMessage("<div>Skopiowano: " + printText + "</div>")
}

function snackbarShowMessage(message) {
  document.getElementById("snackbar").innerHTML = message;
  showSnackbar();
}

function showSnackbar() {
  var x = document.getElementById("snackbar");

  x.className = "show";

  setTimeout(function () {
    x.className = x.className.replace("show", "hidden");
  }, 3000);
}

function changeView(view) {
  switch (view) {
    case 0:
      document.getElementById("real").classList.add("button-with-icon-set");
      document.getElementById("aiv1").classList.remove("button-with-icon-set");
      currentView = 0;
      break;
    case 1:
      document.getElementById("aiv1").classList.add("button-with-icon-set");
      document.getElementById("real").classList.remove("button-with-icon-set");
      currentView = 1;
      break;
  }
}

function initializeBaseView() {
  document.getElementById("real").classList.add("button-with-icon-set");
  document.getElementById("aiv1").classList.remove("button-with-icon-set");
  currentView = 0;
  queue = [];
  switchBackButton();
  toggleBadgeVisibility();
}

function printMessage(message) {
  document.getElementById("message").innerText = `${message}`;
}

function addMessageToQueue(message, view) {
  const msg = { message: message, view: view };
  queue.push(msg);
  toggleBadgeVisibility();
}

function switchBackButton() {
  if (queue.length > 1) {
    document.getElementById("undo").style.display = "block"; 
  } else {
    document.getElementById("undo").style.display = "none"; 
  }
}

function toggleBadgeVisibility() {
  const badge = document.querySelector(".button-badge");
  if (queue.length > 1) {
    badge.style.display = "block";
    badge.innerText = queue.length - 1;
  } else {
    badge.style.display = "none";
  }
}

function goToGuessGame() {
  window.location.href = "guess.html";
}

async function initApp() {
  try {
    initializeBaseView();
  } catch (e) {}
  initCategory(0);
  initCategory(1);
}

window.addEventListener("DOMContentLoaded", initApp);
