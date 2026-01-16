var currentView = 0; // 0 - adison, 1 - AIderv1
var url = "";

var queue = [];

async function loadMessage() {
  document.getElementById("message").innerText = "Loading...";
  document.getElementById("quote").style.visibility = "visible";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Nie udało się wczytać pliku.");

    const text = await response.text();
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const count = parseInt(lines[0], 10);
    if (isNaN(count) || count < 1 || lines.length <= 1) {
      document.getElementById("message").innerText =
        "Nieprawidłowy format pliku.";
      return;
    }

    const randomIndex = Math.floor(Math.random() * count) + 1;

    const message = lines[randomIndex] || "(Brak wiadomości)";
    printMessage(message);
    addMessageToQueue(message, currentView);
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
      url =
        "https://gist.githubusercontent.com/WeTi12/61702558fca4580cba8d905333ad781d/raw/7c70b91722b91071d310c2b818a155dc65819d02/gistfile1.txt";
      currentView = 0;
      break;
    case 1:
      document.getElementById("aiv1").classList.add("button-with-icon-set");
      document.getElementById("real").classList.remove("button-with-icon-set");
      url =
        "https://raw.githubusercontent.com/WeTi12/AdiMessageMarkov/refs/heads/master/generated_markov.txt";
      currentView = 1;
      break;
  }
}

function initializeBaseView() {
  document.getElementById("real").classList.add("button-with-icon-set");
  document.getElementById("aiv1").classList.remove("button-with-icon-set");
  url =
    "https://gist.githubusercontent.com/WeTi12/61702558fca4580cba8d905333ad781d/raw/7c70b91722b91071d310c2b818a155dc65819d02/gistfile1.txt";
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
