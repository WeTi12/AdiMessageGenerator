var currentScore = 0;
var bestScore = 0;
var currentMessage = "";
var currentCorrectAnswer = -1; // 0 - real adi, 1 - AI
var hasAnswered = false;

const REAL_ADI_URL = "https://gist.githubusercontent.com/WeTi12/e8da2a744a317d3ddb748b03f2068d9d/raw/fe935cae27adca9ab7f2a4e4ea5f217a37a3717a/gistfile1.txt";
const AI_URL = "https://raw.githubusercontent.com/WeTi12/AdiMessageMarkov/refs/heads/master/generated_markov.txt";

const STORAGE_KEY = "guessGameBestScore";

function initializeGuessGame() {
  loadBestScore();
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
    const url = currentCorrectAnswer === 0 ? REAL_ADI_URL : AI_URL;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Nie udało się wczytać wiadomości.");

    const text = await response.text();
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const count = parseInt(lines[0], 10);
    if (isNaN(count) || count < 1 || lines.length <= 1) {
      document.getElementById("guessMessage").innerText = "Błąd podczas wczytywania wiadomości.";
      return;
    }

    const randomIndex = Math.floor(Math.random() * count) + 1;
    currentMessage = lines[randomIndex] || "(Brak wiadomości)";
    
    document.getElementById("guessMessage").innerText = currentMessage;
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
