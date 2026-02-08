const listeningScore =
  sessionStorage.getItem("listeningScore");
const readingScore =
  sessionStorage.getItem("readingScore");

document.getElementById("listeningScore").textContent =
  listeningScore !== null
    ? `${listeningScore} / 40`
    : "Not available";

document.getElementById("readingScore").textContent =
  readingScore !== null
    ? `${readingScore} / 40`
    : "Not available";
