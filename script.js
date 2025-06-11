var currentView = 0; // 0 - adison, 1 - AIderv1
var url = "";

var queue = [];
// document.getElementById("undo").disabled = true; 

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
    document.getElementById("message").innerText = `${message}`;
    // document.getElementById("undo").disabled = false;
  } catch (err) {
    document.getElementById("message").innerText = "Błąd";
  }
}

function ohShitGoBack() {
    if (!queue.length) {
        document.getElementById("snackbar").innerHTML =
        "<div>Nie ma zadnych wiadomosci zapisanych typie</div>";
        showSnackbar();
        // document.getElementById("undo").disabled = true; 
        return;
    }

    const index = removeFromFront();
    if (!queue.length) {
        // document.getElementById("undo").disabled = true; 
    }
    const message = lines[index] || "(Brak wiadomości)";
    document.getElementById("message").innerText = `${message}`;
}

function addToFront(num) {
    queue.unshift(num);
}

function removeFromFront() {
    return queue.shift();
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

  document.getElementById("snackbar").innerHTML =
    "<div>Skopiowano: " + printText + "</div>";
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
  queue = [];
  // document.getElementById("undo").disabled = true; 

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
  // document.getElementById("undo").disabled = true; 
}


