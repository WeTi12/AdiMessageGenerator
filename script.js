  async function loadMessage() {
    document.getElementById('message').innerText = "Loading...";
    document.getElementById("quote").style.visibility = "visible";
    const url = "https://gist.githubusercontent.com/WeTi12/61702558fca4580cba8d905333ad781d/raw/d7302967d334cbe3f27954b6a8df7d4641e6e12f/gistfile1.txt";
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Nie udało się wczytać pliku.");

        const text = await response.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');

        const count = parseInt(lines[0], 10);
        if (isNaN(count) || count < 1 || lines.length <= 1) {
            document.getElementById('message').innerText = "Nieprawidłowy format pliku.";
            return;
        }

        const randomIndex = Math.floor(Math.random() * count) + 1;
        const message = lines[randomIndex] || "(Brak wiadomości)";
        document.getElementById('message').innerText = `${message}`;
    } catch (err) {
        document.getElementById('message').innerText = "Błąd";
    }
}

function copyToClipboard() {
    var copyText = ":adi: ";
    var printText = '<span><img src="img/adison.png" alt="adi" class="image-adi">'
    copyText += document.getElementById("message").innerHTML;
    printText += document.getElementById("message").innerHTML;
    printText += '</span>'

    navigator.clipboard.writeText(copyText);

    printText

    document.getElementById("snackbar").innerHTML = "<div>Skopiowano: " + printText + "</div>";
    showSnackbar();
}

function showSnackbar() {
  var x = document.getElementById("snackbar");

  x.className = "show";

  setTimeout(function(){ x.className = x.className.replace("show", "hidden"); }, 3000);
}