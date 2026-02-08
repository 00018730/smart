console.log("📘 Reading Engine – Phase 0 (FIXED)");

/* ===============================
   HARD FAIL SAFE
================================ */
if (!window.READING_TESTS) {
  alert("❌ reading-data.js not loaded");
  throw new Error("READING_TESTS missing");
}

/* ===============================
   URL PARAM
================================ */
const params = new URLSearchParams(window.location.search);
const testId = params.get("test");

if (!testId || !READING_TESTS[testId]) {
  document.body.innerHTML = `
    <div style="padding:40px">
      <h1>Test not found</h1>
      <p>Invalid reading test.</p>
    </div>
  `;
  throw new Error("Invalid test ID");
}

const test = READING_TESTS[testId];
console.log("✅ Reading test loaded:", testId);

/* ===============================
   DOM
================================ */
const passageTitleEl   = document.getElementById("passageTitle");
const passageContentEl = document.getElementById("passageContent");
const questionsBox     = document.getElementById("questionsBox");
const timerEl          = document.getElementById("timer");
const prevBtn          = document.getElementById("prevBtn");
const nextBtn          = document.getElementById("nextBtn");
const allQuestions = [];

/* ===============================
   STATE
================================ */
let currentPassageIndex = 0;
let timeLeft = test.timeLimit || 3600;
let timerInterval = null;
let activeMatchingOptions = [];
let activeDragOptions = [];
let usedDragOptions = {}; // { "A": 10 }
let navigatorEl = null;

const answers = {};   // ✅ FIX
const marked  = new Set();

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {


  startTimer();    // ONLY here
  renderPassage();
});


/* ===============================
   TIMER
================================ */
function startTimer() {
  updateTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    console.log("⏱️ timeLeft:", timeLeft);
    updateTimer();

    if (timeLeft <= 0) {
      console.log("⏱️ timer hit zero");
      clearInterval(timerInterval);
      finishReading();
    }
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* ===============================
   PASSAGE RENDER
================================ */
function renderPassage() {
  const passage = test.passages[currentPassageIndex];
  if (!passage) return;

  /* ---- Passage Title ---- */
  passageTitleEl.textContent = passage.title || "";

  /* ---- Passage Text ---- */
  passageContentEl.innerHTML = "";
  passage.text
    .split("\n")
    .filter(p => p.trim())
    .forEach(p => {
      const el = document.createElement("p");
      el.innerHTML = p.trim();
      passageContentEl.appendChild(el);
    });

  /* ---- Questions ---- */
  questionsBox.innerHTML = "";
  renderQuestions(passage.questions || []);      // ← FIRST
}

function buildAllQuestions() {
  allQuestions.length = 0;

  test.passages.forEach(passage => {
    passage.questions.forEach(q => {
      if (q.id) {
        allQuestions.push(q);
      }
    });
  });

  console.log("🧮 Navigator questions:", allQuestions.length);
  console.log("ALL QUESTIONS:", allQuestions);
}

/* ===============================
   QUESTIONS RENDER
================================ */
function renderQuestions(questions) {
  questions.forEach(q => {

    /* ===== INSTRUCTION ===== */
    if (q.type === "instruction") {
      const box = document.createElement("div");
      box.className = "reading-instruction";
      box.innerHTML = q.text.replace(/\n/g, "<br>");
      questionsBox.appendChild(box);
      return;
    }

    /* ================= MATCHING OPTIONS ================= */
if (q.type === "matching-options") {
  activeMatchingOptions = q.options.slice();
  return;
}

    /* ===== TITLE ===== */
    if (q.type === "title") {
      const el = document.createElement("div");
      el.className = "reading-title-inline";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ===== HEADING ===== */
    if (q.type === "heading") {
      const el = document.createElement("div");
      el.className = "reading-heading";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ===== TEXTLINE ===== */
    if (q.type === "textline") {
      const el = document.createElement("div");
      el.className = "reading-textline";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ===== GAP / SENTENCE ===== */
    if (q.type === "gap" || q.type === "sentence") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question gap-question";

      const value = answers[q.id] ?? "";

      wrap.innerHTML = `
  <p>
    ${q.before || ""}
    <span class="q-number">${q.id}</span>
    <input
      class="gap-input"
      type="text"
      value="${value}"
      autocomplete="off"
      spellcheck="false"
    />
    ${q.after || ""}
  </p>
`;

      wrap.querySelector("input").addEventListener("input", e => {
        answers[q.id] = e.target.value;
        renderNavigator();
        console.log("Answers:", answers);
      });

      questionsBox.appendChild(wrap);
      return;
    }

    /* ================= MATCHING (DROPDOWN) ================= */
if (q.type === "matching") {
  const wrap = document.createElement("div");
  wrap.className = "reading-question matching-question";

  const value = answers[q.id] || "";

  wrap.innerHTML = `
    <p>
      <span class="q-number">${q.id}</span>
      ${q.text}
      <select class="matching-select">
        <option value="">—</option>
        ${activeMatchingOptions.map(opt => {
          const letter = opt[0];
          return `
            <option value="${letter}" ${value === letter ? "selected" : ""}>
              ${opt}
            </option>
          `;
        }).join("")}
      </select>
    </p>
  `;

  const select = wrap.querySelector("select");
  select.addEventListener("change", e => {
    answers[q.id] = e.target.value;
    renderNavigator();
    console.log("Answers:", answers);
  });

  questionsBox.appendChild(wrap);
  return;
}

/* ================= DRAG OPTIONS ================= */
if (q.type === "drag-options") {
  activeDragOptions = q.options.slice();

  const box = document.createElement("div");
  box.className = "drag-options-box";

  box.innerHTML = activeDragOptions.map(opt => {
    const letter = opt[0];
    const hidden = usedDragOptions[letter] ? "hidden" : "";

    return `
      <div class="drag-option ${hidden}"
           draggable="true"
           data-value="${letter}">
        ${opt}
      </div>
    `;
  }).join("");

  box.querySelectorAll(".drag-option").forEach(el => {
    el.addEventListener("dragstart", onDragStart);
  });

  questionsBox.appendChild(box);
  return;
}

/* ================= DRAG DROP QUESTION ================= */
if (q.type === "drag-drop") {
  const wrap = document.createElement("div");
  wrap.className = "reading-question drag-question";

  const value = answers[q.id] || "";

  wrap.innerHTML = `
    <p>
      <span class="q-number">${q.id}</span>
      ${q.text}
      <span class="drop-zone"
            data-qid="${q.id}">
        ${value ? value.text : "Drop answer here"}
      </span>
    </p>
  `;

  const zone = wrap.querySelector(".drop-zone");

  zone.addEventListener("dragover", e => e.preventDefault());
  zone.addEventListener("drop", onDrop);

  questionsBox.appendChild(wrap);
  return;
}


    /* ===== MCQ (SINGLE) ===== */
    if (q.type === "mcq") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question mcq-question";

      wrap.innerHTML = `
        <p><span class="q-number">${q.id}</span> ${q.text}</p>
        <div class="mcq-list"></div>
      `;

      const list = wrap.querySelector(".mcq-list");

      q.options.forEach(opt => {
        const letter = opt[0];
        const box = document.createElement("div");
        box.className = "mcq-box";
        box.textContent = opt;

        if (answers[q.id] === letter) {
          box.classList.add("selected");
        }
        renderNavigator();

        box.onclick = () => {
          answers[q.id] = letter;
          list.querySelectorAll(".mcq-box")
            .forEach(b => b.classList.remove("selected"));
          box.classList.add("selected");
        };
        renderNavigator();

        list.appendChild(box);
      });

      questionsBox.appendChild(wrap);
      return;
    }

    /* ================= YNNG ================= */
if (q.type === "ynng") {
  const wrap = document.createElement("div");
  wrap.className = "reading-question ynng-question";

  wrap.innerHTML = `
    <p>
      <span class="q-number">${q.id}</span>
      ${q.text}
    </p>
    <div class="ynng-options">
      ${["Y", "N", "NG"].map(opt => `
        <div class="ynng-box ${answers[q.id] === opt ? "selected" : ""}"
             data-value="${opt}">
          ${opt === "Y" ? "Yes" : opt === "N" ? "No" : "Not Given"}
        </div>
      `).join("")}
    </div>
  `;

  wrap.querySelectorAll(".ynng-box").forEach(box => {
    box.addEventListener("click", () => {
      answers[q.id] = box.dataset.value;

      wrap.querySelectorAll(".ynng-box")
        .forEach(b => b.classList.remove("selected"));

      box.classList.add("selected");
    });
  });

  questionsBox.appendChild(wrap);
  return;
}

    /* ================= TFNG ================= */
if (q.type === "tfng") {
  const wrap = document.createElement("div");
  wrap.className = "reading-question tfng-question";

  wrap.innerHTML = `
    <p>
      <span class="q-number">${q.id}</span>
      ${q.text}
    </p>
    <div class="tfng-list"></div>
  `;

  const list = wrap.querySelector(".tfng-list");
  const options = ["True", "False", "Not Given"];

  options.forEach(opt => {
    const box = document.createElement("div");
    box.className = "tfng-box";
    box.textContent = opt;

    if (answers[q.id] === opt) {
      box.classList.add("selected");
    }

    box.addEventListener("click", () => {
      answers[q.id] = opt;

      list.querySelectorAll(".tfng-box")
        .forEach(b => b.classList.remove("selected"));

      box.classList.add("selected");
      console.log("Answers:", answers);
    });

    list.appendChild(box);
  });

  questionsBox.appendChild(wrap);
  return;
}

/* ================= SUMMARY COMPLETION ================= */
if (q.type === "summary") {
  const wrap = document.createElement("div");
  wrap.className = "reading-summary";

  wrap.innerHTML = `
    <div class="summary-instruction">
      <strong>${q.title}</strong><br>
      ${q.instruction.replace(/\n/g, "<br>")}
    </div>

    <div class="summary-options">
      ${q.options.map(opt => `
        <div class="summary-option">${opt}</div>
      `).join("")}
    </div>

    <div class="summary-text"></div>
  `;

  const textBox = wrap.querySelector(".summary-text");

  q.items.forEach(item => {
    const value = answers[item.id] || "";

    const line = document.createElement("p");
    line.innerHTML = `
      ${item.before}
      <input
        type="text"
        class="summary-input"
        value="${value}"
        data-id="${item.id}"
        autocomplete="off"
        spellcheck="false"
      />
      ${item.after}
    `;

    line.querySelector("input").addEventListener("input", e => {
      answers[item.id] = e.target.value.trim();
    });

    textBox.appendChild(line);
  });

  questionsBox.appendChild(wrap);
  return;
}


  });
}

/* ===============================
   NAVIGATION
================================ */
prevBtn.onclick = () => {
  if (currentPassageIndex > 0) {
    currentPassageIndex--;
    renderPassage();
  }
};

nextBtn.onclick = () => {
  if (currentPassageIndex < test.passages.length - 1) {
    currentPassageIndex++;
    renderPassage();
  }
};

function isAnswered(id) {
  const v = answers[id];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return true;
  return false;
}


function renderNavigator() {
  if (!navigatorEl) return;

  navigatorEl.innerHTML = "";

  allQuestions.forEach(q => {
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = q.id;

    if (isAnswered(q.id)) bubble.classList.add("answered");
    if (marked.has(q.id)) bubble.classList.add("marked");

    bubble.onclick = () => {
      if (marked.has(q.id)) {
        marked.delete(q.id);
      } else {
        marked.add(q.id);
      }
      renderNavigator();
    };

    navigatorEl.appendChild(bubble);
  });
}

function onDragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.value);
}

function onDrop(e) {
  e.preventDefault();

  const letter = e.dataTransfer.getData("text/plain");
  const zone = e.target.closest(".drop-zone");
  if (!zone) return;

  const qid = Number(zone.dataset.qid);

  // 🔹 find full option text
  const fullText = activeDragOptions.find(opt => opt.startsWith(letter));

  // restore previous
  if (answers[qid]) {
    delete usedDragOptions[answers[qid].letter];
  }

  // clear reused option
  if (usedDragOptions[letter]) {
    delete answers[usedDragOptions[letter]];
  }

  // ✅ store BOTH
  answers[qid] = {
    letter,
    text: fullText
  };

  usedDragOptions[letter] = qid;

  renderPassage();
}

/* ===============================
   BUBBLE FACTORY
================================ */
function createBubble(id) {
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = id;

  if (answers[id]) b.classList.add("answered");
  if (marked.has(id)) b.classList.add("marked");

  b.onclick = () => {
    marked.has(id) ? marked.delete(id) : marked.add(id);
    renderNavigator();
  };

  navigatorEl.appendChild(b);
}


function calculateScore() {
  let score = 0;

  test.passages.forEach(passage => {
    passage.questions.forEach(q => {

      /* ========= SKIP NON-QUESTIONS ========= */
      if (
        q.type === "title" ||
        q.type === "heading" ||
        q.type === "textline" ||
        q.type === "instruction" ||
        q.type === "matching-options" ||
        q.type === "drag-options"
      ) return;

      /* ========= GAP / SENTENCE ========= */
      if (q.type === "gap" || q.type === "sentence") {
        const user = answers[q.id];
        if (
          user &&
          user.trim().toLowerCase() ===
          String(q.answer).trim().toLowerCase()
        ) {
          score++;
        }
        return;
      }

      /* ========= MCQ (SINGLE) ========= */
      if (q.type === "mcq") {
        if (answers[q.id] === q.answer) {
          score++;
        }
        return;
      }

      /* ========= MATCHING (DROPDOWN) ========= */
      if (q.type === "matching") {
        if (answers[q.id] === q.answer) {
          score++;
        }
        return;
      }

      /* ========= TRUE / FALSE / NOT GIVEN ========= */
      if (q.type === "tfng") {
        if (
          answers[q.id] &&
          answers[q.id].toLowerCase() === q.answer.toLowerCase()
        ) {
          score++;
        }
        return;
      }

      /* ========= YES / NO / NOT GIVEN ========= */
      if (q.type === "ynng") {
        if (
          answers[q.id] &&
          answers[q.id].toLowerCase() === q.answer.toLowerCase()
        ) {
          score++;
        }
        return;
      }

      /* ========= DRAG & DROP ========= */
      if (q.type === "drag-drop") {
        const user = answers[q.id];
        if (user && user.letter === q.answer) {
          score++;
        }
        return;
      }

      /* ========= SUMMARY COMPLETION ========= */
      if (q.type === "summary" && Array.isArray(q.items)) {
        q.items.forEach(item => {
          const user = answers[item.id];
          if (
            user &&
            user.trim().toLowerCase() ===
            item.answer.trim().toLowerCase()
          ) {
            score++;
          }
        });
        return;
      }

    });
  });

  console.log("✅ FINAL SCORE:", score);
  return score;
}

/* ===============================
   FINISH
================================ */
function finishReading() {
  clearInterval(timerInterval);

  const attemptId = sessionStorage.getItem("attemptId");
  if (!attemptId) {
    alert("Attempt ID missing. Please contact staff.");
    return;
  }

  const score = calculateScore();

  fetch("/api/reading/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      attemptId,
      score,
      answers
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ Reading saved:", data);
    })
    .catch(err => {
      console.error("❌ Reading save failed:", err);
    });

  // Save locally for result page
  sessionStorage.setItem("readingScore", score);
  sessionStorage.setItem("readingFinished", "true");

  // Show finish modal (already built)
  document.body.style.overflow = "hidden";
  document.getElementById("readingFinishOverlay")
    .classList.remove("hidden");

    document.body.style.overflow = "hidden";

  const overlay = document.getElementById("readingFinishOverlay");
  const btn = document.getElementById("toWritingBtn");

  if (!overlay || !btn) {
    console.error("❌ Finish modal elements missing");
    return;
  }

  overlay.classList.remove("hidden");

  const mockId = testId.replace("reading_", ""); // reading_mock1

  btn.onclick = () => {
    window.location.href = `writing-instructions.html?mock=${mockId}`;
  };
}
