// js/select-test.js

document.querySelectorAll(".test-card").forEach(card => {
  card.querySelector("button").onclick = () => {
    const mock = card.dataset.test; // mock1, mock2, etc
    window.location.href = `login.html?mock=${mock}`;
  };
});

