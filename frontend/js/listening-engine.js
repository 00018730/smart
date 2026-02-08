console.log("🎧 Listening Engine v1.1 – FIXED");

/* ===============================
   HARD FAIL SAFE
================================ */
if (!window.LISTENING_TESTS) {
  alert("❌ listening-data.js not loaded");
  throw new Error("LISTENING_TESTS missing");
}

/* ===============================
   URL PARAM
================================ */
const params = new URLSearchParams(window.location.search);
const testId = params.get("test");

if (!testId || !LISTENING_TESTS[testId]) {
  document.body.innerHTML = `
    <div class="finish-screen">
      <h1>Test not found</h1>
      <p>Invalid listening test.</p>
    </div>
  `;
  throw new Error("Invalid test ID");
}

const test = LISTENING_TESTS[testId];
console.log("✅ Test loaded:", testId);

/* ===============================
   DOM
================================ */
const audioPlayer   = document.getElementById("audioPlayer");
const audioProgress = document.getElementById("audioProgress");
const timerEl       = document.getElementById("timer");
const instructionsEl= document.getElementById("instructions");
const questionsBox  = document.getElementById("questionsBox");
const navigatorEl   = document.getElementById("questionNavigator");
const sectionsEl    = document.querySelector(".sections");
const prevBtn       = document.getElementById("prevBtn");
const nextBtn       = document.getElementById("nextBtn");

/* ===============================
   STATE
================================ */
let currentPart = 0;
let transferTime = 120;
let transferInterval = null;
let examLocked = true;
let finished = false;
let violations = 0;
let violationCooldown = false;
let activeDragOptions = [];
let usedOptions = {}; // { "E": 27 }
let endingInProgress = false;
let transferFinished = false;


const answers = {};
const marked  = new Set();

/* ===============================
   PAGE LOCK
================================ */
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

function onVisibilityChange() {
  if (!examLocked || finished || endingInProgress) return;
  if (document.hidden) handleViolation();
}

function onWindowBlur() {
  if (!examLocked || finished || endingInProgress) return;
  handleViolation();
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("visibilitychange", onVisibilityChange);
window.addEventListener("blur", onWindowBlur);
  setupAudio();
  renderSections();
  renderCurrentPart();
  timerEl.classList.add("hidden");
});

/* ===============================
   AUDIO
================================ */
function setupAudio() {
  audioPlayer.src = test.audio;
  audioPlayer.preload = "auto";
  audioPlayer.muted = true;

  audioPlayer.addEventListener("canplay", () => {
    audioPlayer.play().then(() => {
      audioPlayer.muted = false;
    }).catch(() => {});
  }, { once: true });

  audioPlayer.addEventListener("timeupdate", () => {
    if (!audioPlayer.duration) return;
    audioProgress.style.width =
      (audioPlayer.currentTime / audioPlayer.duration) * 100 + "%";
  });

  audioPlayer.addEventListener("ended", startTransferTime);
}

/* ===============================
   SECTIONS
================================ */
function renderSections() {
  sectionsEl.innerHTML = "";

  test.parts.forEach((part, index) => {
    const btn = document.createElement("button");
    btn.className = "section-btn";
    btn.textContent = `Part ${part.part}`;
    if (index === currentPart) btn.classList.add("active");

    btn.onclick = () => {
      currentPart = index;
      updateSectionUI();
    };

    sectionsEl.appendChild(btn);
  });
}

function updateSectionUI() {
  document.querySelectorAll(".section-btn").forEach((b, i) =>
    b.classList.toggle("active", i === currentPart)
  );
  renderCurrentPart();
}

/* ===============================
   PART RENDER
================================ */
function renderCurrentPart() {
  const part = test.parts[currentPart];
  renderInstructions(part.instructions);
  renderQuestions(part.questions);
  renderNavigator(part.questions);
}

/* ===============================
   INSTRUCTIONS
================================ */
function renderInstructions(instructions) {
  instructionsEl.innerHTML = "";

  const list = Array.isArray(instructions) ? instructions : [instructions];

  list.forEach(i => {
    if (i.title) {
      instructionsEl.innerHTML += `<h2 class="instruction-title">${i.title}</h2>`;
    }
    if (i.task) {
      instructionsEl.innerHTML += `
        <p class="instruction-task">${i.task.replace(/\n/g, "<br>")}</p>
      `;
    }
    if (i.rule) {
      instructionsEl.innerHTML += `<p class="instruction-rule">${i.rule}</p>`;
    }
  });
}

/* ===============================
   QUESTIONS (FIXED)
================================ */
function renderQuestions(questions) {
  questionsBox.innerHTML = "";

  questions.forEach(q => {

        /* ================= MCQ MULTI (CHOOSE TWO) ================= */
if (q.type === "mcq-multi") {
  const key = q.qNumbers.join("-");

  if (!Array.isArray(answers[key])) {
    answers[key] = [];
  }

  const selected = answers[key];

  const wrap = document.createElement("div");
  wrap.className = "question mcq-multi";

  wrap.innerHTML = `
    <p class="mcq-multi-instruction">
      <strong>Questions ${q.qNumbers.join("–")}</strong><br>
      ${q.instruction}
    </p>

    <p class="mcq-multi-text">${q.text}</p>

    <div class="mcq-list"></div>
  `;

  const list = wrap.querySelector(".mcq-list");

  q.options.forEach(opt => {
    const letter = opt[0];
    const box = document.createElement("div");

    box.className = "mcq-box";
    box.textContent = opt;

    if (selected.includes(letter)) {
      box.classList.add("selected");
    }

    box.onclick = () => {
      const index = selected.indexOf(letter);

      // already selected → remove
      if (index !== -1) {
        selected.splice(index, 1);
      }
      // not selected
      else {
        // replace oldest if limit reached
        if (selected.length === q.qNumbers.length) {
          selected.shift();
        }
        selected.push(letter);
      }

      answers[key] = [...selected];

      // update UI immediately
      list.querySelectorAll(".mcq-box").forEach(b =>
        b.classList.remove("selected")
      );

      answers[key].forEach(l => {
        [...list.children]
          .find(b => b.textContent.startsWith(l))
          ?.classList.add("selected");
      });

      renderNavigator(test.parts[currentPart].questions);
    };

    list.appendChild(box);
  });

  questionsBox.appendChild(wrap);
  return;
}

    /* ===== TITLE ===== */
    if (q.type === "title") {
      const el = document.createElement("div");
      el.className = "q-title";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ===== HEADING ===== */
    if (q.type === "heading") {
      const el = document.createElement("div");
      el.className = "q-heading";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ===== TEXTLINE ===== */
    if (q.type === "textline") {
      const el = document.createElement("div");
      el.className = "q-textline";
      el.textContent = q.text;
      questionsBox.appendChild(el);
      return;
    }

    /* ================= INSTRUCTION (DRAG OPTIONS OWNER) ================= */
if (q.type === "instruction") {
  // initialize option bank for this instruction
  activeDragOptions = Array.isArray(q.options) ? q.options.slice() : [];

  const box = document.createElement("div");
  box.className = "instruction-box";

  box.innerHTML = `
    ${q.title ? `<div class="instruction-title">${q.title}</div>` : ""}
    ${q.task ? `<div class="instruction-task">${q.task.replace(/\n/g, "<br>")}</div>` : ""}
    ${q.rule ? `<div class="instruction-rule">${q.rule}</div>` : ""}
    <div class="drag-options">
      ${activeDragOptions.map(opt => {
        const letter = opt[0]; // A, B, C...
        const hidden = usedOptions[letter] ? "drag-option-hidden" : "";

        return `
          <div class="drag-option ${hidden}"
               draggable="true"
               data-value="${letter}"
               ondragstart="onDragStart(event)">
            ${opt}
          </div>
        `;
      }).join("")}
    </div>
  `;

  questionsBox.appendChild(box);
  return;
}


    /* ===== GAP ===== */
    if (q.type === "gap") {
      const wrap = document.createElement("div");
      wrap.className = "question";

      const value = answers[q.id] || "";

      wrap.innerHTML = `
        <p>
          ${q.before || ""}
          <span class="q-number">${q.id}</span>
          <input
            type="text"
            class="gap-box"
            value="${value}"
            autocomplete="off"
            spellcheck="false"
          />
          ${q.after || ""}
        </p>
      `;

      wrap.querySelector("input").addEventListener("input", e => {
        answers[q.id] = e.target.value;
        renderNavigator(test.parts[currentPart].questions);
      });

      questionsBox.appendChild(wrap);
      return;
    }

    if (q.type === "drag") {
  const wrap = document.createElement("div");
  wrap.className = "question drag-question";

  const value = answers[q.id] || "";

  wrap.innerHTML = `
  <p class="drag-line">
    <span class="q-number">${q.id}</span>
    <span class="drag-text">${q.text}</span>
    <span class="drop-zone"
          data-qid="${q.id}"
          ondragover="allowDrop(event)"
          ondrop="onDrop(event)">
      ${answers[q.id] ? answers[q.id].text : "Drop answer here"}
    </span>
  </p>
`;

  questionsBox.appendChild(wrap);
  return;
}


    /* ===== MCQ (SINGLE) ===== */
    if (q.type === "mcq") {
      const wrap = document.createElement("div");
      wrap.className = "question";

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

        box.addEventListener("click", () => {
          answers[q.id] = letter;

          list.querySelectorAll(".mcq-box")
            .forEach(b => b.classList.remove("selected"));
          box.classList.add("selected");

          renderNavigator(test.parts[currentPart].questions);
        });

        list.appendChild(box);
      });

      questionsBox.appendChild(wrap);
      return;
    }

  });
}

/* ===============================
   NAVIGATOR
================================ */
function renderNavigator(questions) {
  navigatorEl.innerHTML = "";

  questions.forEach(q => {

    /* ================= MCQ-MULTI (17–18 etc.) ================= */
    if (q.type === "mcq-multi" && Array.isArray(q.qNumbers)) {
      const key = q.qNumbers.join("-");
      const count = answers[key]?.length || 0;

      q.qNumbers.forEach((num, index) => {
        const b = document.createElement("div");
        b.className = "bubble";
        b.textContent = num;

        // bubble logic you approved
        if (
          (count >= 1 && index === 0) ||
          (count === q.qNumbers.length)
        ) {
          b.classList.add("answered");
        }

        if (marked.has(num)) b.classList.add("marked");

        b.onclick = () => {
          marked.has(num)
            ? marked.delete(num)
            : marked.add(num);
          renderNavigator(questions);
        };

        navigatorEl.appendChild(b);
      });

      return; // move to next question object
    }

    /* ================= NORMAL QUESTIONS ================= */
    if (q.id) {
      const b = document.createElement("div");
      b.className = "bubble";
      b.textContent = q.id;

      if (answers[q.id]) b.classList.add("answered");
      if (marked.has(q.id)) b.classList.add("marked");

      b.onclick = () => {
        marked.has(q.id)
          ? marked.delete(q.id)
          : marked.add(q.id);
        renderNavigator(questions);
      };

      navigatorEl.appendChild(b);
    }

    // titles, headings, textlines → ignored
  });
}

function allowDrop(e) {
  e.preventDefault();
}

function onDragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.value);
}

function onDrop(e) {
  e.preventDefault();

  const letter = e.dataTransfer.getData("text/plain");
  const zone = e.target.closest(".drop-zone");
  if (!zone) return;

  const qid = zone.dataset.qid; // Remove Number() to keep it consistent with your data keys

  // 🔹 find FULL option text
  const fullText = activeDragOptions.find(opt =>
    opt.startsWith(letter)
  );

  if (!fullText) return;

  // restore previous answer
  if (answers[qid]) {
    delete usedOptions[answers[qid].letter];
  }

  // remove reused option from other question
  if (usedOptions[letter]) {
    delete answers[usedOptions[letter]];
  }

  // ✅ STORE OBJECT
  answers[qid] = {
    letter,
    text: fullText
  };

  usedOptions[letter] = qid;

  renderCurrentPart();
}




/* ===============================
   TIMER
================================ */
function startTransferTime() {
  if (transferFinished) return;

  timerEl.classList.remove("hidden");

  transferInterval = setInterval(() => {
    transferTime--;
    updateTimer();

    if (transferTime <= 0) {
      clearInterval(transferInterval);
      transferFinished = true;

      // 🔴 force end even if no violations
      endingInProgress = true;

      setTimeout(() => {
        finishListening();
      }, 50);
    }
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(transferTime / 60);
  const s = transferTime % 60;
  timerEl.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ===============================
   VIOLATIONS
================================ */

function handleViolation() {
  // hard stop if already finishing
  if (finished || endingInProgress) return;

  violations++;

  // FIRST violation → warning only
  if (violations === 1) {
    endingInProgress = true; // 🔒 lock immediately

    alert(
      "⚠️ Warning!\n\n" +
      "Leaving the listening test is not allowed.\n" +
      "If you leave again, the test will end automatically."
    );

    // 🔓 unlock AFTER alert safely
    setTimeout(() => {
      endingInProgress = false;
    }, 50);

    return;
  }

  // SECOND violation → END TEST
  endingInProgress = true;

  // stop any running timers/audio safely
  clearInterval(transferInterval);
  audioPlayer.pause();

  // defer finish to avoid race conditions
  setTimeout(() => {
    finishListening();
  }, 50);
}

/* ===============================
   SCORING
================================ */
function calculateScore() {
  console.log("🧮 Starting Final Scoring...");
  let score = 0;

  test.parts.forEach(part => {
    part.questions.forEach(q => {
      // 1. SKIP DECORATIVE ITEMS
      if (!q.id && !q.qNumbers) return;

      /* --- GAP FILLING --- */
      if (q.type === "gap") {
        const user = answers[q.id] ? String(answers[q.id]).trim().toLowerCase() : "";
        const correct = q.answer ? String(q.answer).trim().toLowerCase() : "";
        if (user === correct && user !== "") {
          score++;
        }
      }

      /* --- MCQ (SINGLE) --- */
      else if (q.type === "mcq") {
        if (answers[q.id] === q.answer) {
          score++;
        }
      }

      /* --- DRAG & DROP --- */
      else if (q.type === "drag") {
        const userObj = answers[q.id];
        // Ensure we compare the .letter property to the answer in data
        if (userObj && userObj.letter) {
          if (userObj.letter.toUpperCase() === q.answer.toUpperCase()) {
            score++;
          }
        }
      }

      /* --- MCQ MULTI (FIXED FOR DATA INCONSISTENCY) --- */
      else if (q.type === "mcq-multi") {
        const key = q.qNumbers.join("-");
        const userChoices = answers[key];
        
        // Handle your data having both 'answer' and 'answers' keys
        const correctArray = q.answer || q.answers;

        if (Array.isArray(userChoices) && Array.isArray(correctArray)) {
          const normalizedCorrect = correctArray.map(a => a.trim().toUpperCase());
          userChoices.forEach(choice => {
            if (normalizedCorrect.includes(choice.trim().toUpperCase())) {
              score++;
            }
          });
        }
      }
    });
  });

  console.log("🎯 Final Score Calculated:", score);
  return score;
}

function showFinishModal({ title, message, buttonText, onClick }) {
  const overlay = document.getElementById("finishOverlay");
  const titleEl = document.getElementById("finishTitle");
  const msgEl   = document.getElementById("finishMessage");
  const btn     = document.getElementById("finishBtn");

  titleEl.textContent = title;
  msgEl.textContent   = message;
  btn.textContent     = buttonText;

  btn.onclick = onClick;

  overlay.classList.remove("hidden");
}



/* ===============================
   FINISH
================================ */

/* ===============================
   TIMER (STABILIZED)
================================ */
function startTransferTime() {
  if (transferFinished || transferInterval) return; // Prevent double intervals

  timerEl.classList.remove("hidden");
  console.log("Timer Started");

  transferInterval = setInterval(() => {
    transferTime--;
    updateTimer();

    if (transferTime <= 0) {
      clearInterval(transferInterval);
      transferInterval = null; 
      transferFinished = true;
      endingInProgress = true;

      console.log("Timer hit zero, launching finish...");
      // Wrap in timeout to escape the interval's execution context
      setTimeout(() => {
        finishListening();
      }, 10);
    }
  }, 1000);
}

/* ===============================
   FINISH (FAIL-SAFE VERSION)
================================ */
/* ===============================
   FINISH (INTEGRATED & PROTECTED)
================================ */
function finishListening() {
  if (finished) return;
  finished = true;
  
  console.log("🏁 Finish Sequence Initiated");

  // 1. IMMEDIATE CLEANUP (Stop the noise)
  endingInProgress = false;
  clearInterval(transferInterval);
  
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.onended = null;
    audioPlayer.ontimeupdate = null;
  }

  // Remove listeners so handleViolation doesn't trigger during transition
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("blur", onWindowBlur);

  // 2. SCORING (Wrapped in a safety gate)
  let score = 0;
  try {
    score = calculateScore();
  } catch (error) {
    console.error("❌ Scoring crashed, but we are continuing:", error);
    // This prevents the "freeze" - if scoring fails, we still show the modal
  }

  // 3. PERSISTENCE
  const attemptId = sessionStorage.getItem("attemptId");
  sessionStorage.setItem("listeningScore", score);
  sessionStorage.setItem("listeningFinished", "true");

  // 4. SERVER SYNC (Supabase)
  if (attemptId) {
    console.log("📤 Sending results to server...");
    fetch("/api/listening/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        score,
        answers
      })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Saved to Supabase:", data))
    .catch(err => console.error("❌ Supabase Save Failed:", err));
  }

  // 5. UI DISPLAY (The end goal)
  try {
    showFinishModal({
      title: "Listening has ended",
      message: `You may continue to Reading.`,
      buttonText: "Continue to Reading",
      onClick: () => {
        examLocked = false;
        // Logic to transition to the reading part of the specific mock
        const mockId = testId.replace("listening_", "");
        window.location.href = `reading-instructions.html?mock=${mockId}`;
      }
    });
  } catch (uiError) {
    console.error("❌ Modal display failed:", uiError);
    // Hard fallback if the modal fails for some reason
    alert("Test complete. Press OK to move to Reading.");
    const mockId = testId.replace("listening_", "");
    window.location.href = `reading-instructions.html?mock=${mockId}`;
  }
}