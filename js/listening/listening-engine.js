console.log("🎧 Listening Engine v1.2 – Production Ready");

/* ===============================
    HARD FAIL SAFE
================================ */
if (!window.LISTENING_TESTS) {
  alert("❌ listening-data.js not loaded");
  throw new Error("LISTENING_TESTS missing");
}

/* ===============================
    URL PARAMS & INITIALIZATION
================================ */
const params = new URLSearchParams(window.location.search);
const testId = params.get("test");


if (!testId || !LISTENING_TESTS[testId]) {
  document.body.innerHTML = `
    <div class="finish-screen">
      <h1>Test not found</h1>
      <p>Invalid listening test selection.</p>
    </div>
  `;
  throw new Error("Invalid test ID");
}

const test = LISTENING_TESTS[testId];
console.log("✅ Test loaded:", testId);

/* ===============================
    DOM ELEMENTS
================================ */
const audioPlayer   = document.getElementById("audioPlayer");
const audioProgress = document.getElementById("audioProgress");
const timerEl       = document.getElementById("timer");
const instructionsEl= document.getElementById("instructions");
const questionsBox  = document.getElementById("questionsBox");
const navigatorEl   = document.getElementById("questionNavigator");
const sectionsEl    = document.querySelector(".sections");

/* ===============================
    STATE MANAGEMENT
================================ */
let currentPart = 0;
let transferTime = 120;
let transferInterval = null;
let examLocked = true;
let finished = false;
let violations = 0;
let endingInProgress = false;
let transferFinished = false;

const answers = {};
const marked  = new Set();
let activeDragOptions = [];
let usedOptions = {}; 

/* ===============================
    ANTI-CHEAT / PAGE LOCK
================================ */
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => history.pushState(null, "", location.href));

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
    AUDIO CORE
================================ */
function setupAudio() {
  audioPlayer.src = test.audio;
  audioPlayer.preload = "auto";
  audioPlayer.muted = true;

  audioPlayer.addEventListener("canplay", () => {
    audioPlayer.play().then(() => {
      audioPlayer.muted = false;
    }).catch(e => console.warn("Autoplay blocked, waiting for interaction."));
  }, { once: true });

  audioPlayer.addEventListener("timeupdate", () => {
    if (!audioPlayer.duration) return;
    audioProgress.style.width = (audioPlayer.currentTime / audioPlayer.duration) * 100 + "%";
  });

  audioPlayer.addEventListener("ended", startTransferTime);
}

/* ===============================
    RENDERING ENGINE (UI)
================================ */
function renderSections() {
  sectionsEl.innerHTML = "";
  test.parts.forEach((part, index) => {
    const btn = document.createElement("button");
    btn.className = `section-btn ${index === currentPart ? 'active' : ''}`;
    btn.textContent = `Part ${part.part}`;
    btn.onclick = () => {
      currentPart = index;
      updateSectionUI();
    };
    sectionsEl.appendChild(btn);
  });
}

function updateSectionUI() {
  document.querySelectorAll(".section-btn").forEach((b, i) => b.classList.toggle("active", i === currentPart));
  renderCurrentPart();
}

function renderCurrentPart() {
  const part = test.parts[currentPart];
  renderInstructions(part.instructions);
  renderQuestions(part.questions);
  renderNavigator(part.questions);
}

function renderInstructions(instructions) {
  instructionsEl.innerHTML = "";
  const list = Array.isArray(instructions) ? instructions : [instructions];
  list.forEach(i => {
    if (i.title) instructionsEl.innerHTML += `<h2 class="instruction-title">${i.title}</h2>`;
    if (i.task) instructionsEl.innerHTML += `<p class="instruction-task">${i.task.replace(/\n/g, "<br>")}</p>`;
    if (i.rule) instructionsEl.innerHTML += `<p class="instruction-rule">${i.rule}</p>`;
  });
}

/* ===============================
    QUESTION TYPES HANDLERS
================================ */
function renderQuestions(questions) {
  questionsBox.innerHTML = "";

  questions.forEach(q => {
    // MCQ MULTI
    if (q.type === "mcq-multi") {
      const key = q.qNumbers.join("-");
      if (!Array.isArray(answers[key])) answers[key] = [];
      const selected = answers[key];

      const wrap = document.createElement("div");
      wrap.className = "question mcq-multi";
      wrap.innerHTML = `
        <p class="mcq-multi-instruction"><strong>Questions ${q.qNumbers.join("–")}</strong><br>${q.instruction}</p>
        <p class="mcq-multi-text">${q.text}</p>
        <div class="mcq-list"></div>
      `;

      const list = wrap.querySelector(".mcq-list");
      q.options.forEach(opt => {
        const letter = opt[0];
        const box = document.createElement("div");
        box.className = `mcq-box ${selected.includes(letter) ? 'selected' : ''}`;
        box.textContent = opt;
        box.onclick = () => {
          const idx = selected.indexOf(letter);
          if (idx !== -1) selected.splice(idx, 1);
          else {
            if (selected.length === q.qNumbers.length) selected.shift();
            selected.push(letter);
          }
          answers[key] = [...selected];
          renderQuestions(questions); // Refresh UI
          renderNavigator(questions);
        };
        list.appendChild(box);
      });
      questionsBox.appendChild(wrap);
    }

    // DECORATIVE ELEMENTS
    else if (["title", "heading", "textline"].includes(q.type)) {
      const el = document.createElement("div");
      el.className = `q-${q.type}`;
      el.textContent = q.text;
      questionsBox.appendChild(el);
    }

    // DRAG OPTIONS BANK
    else if (q.type === "instruction") {
      activeDragOptions = Array.isArray(q.options) ? q.options.slice() : [];
      const box = document.createElement("div");
      box.className = "instruction-box";
      box.innerHTML = `
        ${q.title ? `<div class="instruction-title">${q.title}</div>` : ""}
        ${q.task ? `<div class="instruction-task">${q.task.replace(/\n/g, "<br>")}</div>` : ""}
        <div class="drag-options">
          ${activeDragOptions.map(opt => {
            const letter = opt[0];
            const hidden = usedOptions[letter] ? "drag-option-hidden" : "";
            return `<div class="drag-option ${hidden}" draggable="true" data-value="${letter}" ondragstart="onDragStart(event)">${opt}</div>`;
          }).join("")}
        </div>
      `;
      questionsBox.appendChild(box);
    }

    // GAP FILL
    // GAP FILL
    else if (q.type === "gap") {
      const wrap = document.createElement("div");
      wrap.className = "question";
      wrap.innerHTML = `
        <p>
          ${q.before || ""} 
          <span class="q-number">${q.id}</span>
          <input type="text" class="gap-box" value="${answers[q.id] || ""}" autocomplete="off" spellcheck="false" />
          ${q.after || ""}
        </p>
      `;
      wrap.querySelector("input").addEventListener("input", e => {
        answers[q.id] = e.target.value;
        renderNavigator(questions);
      });
      questionsBox.appendChild(wrap);
    }

    // DRAG DROP TARGET
    else if (q.type === "drag") {
      const wrap = document.createElement("div");
      wrap.className = "question drag-question";
      wrap.innerHTML = `
        <p class="drag-line"><span class="q-number">${q.id}</span> <span class="drag-text">${q.text}</span>
        <span class="drop-zone" data-qid="${q.id}" ondragover="allowDrop(event)" ondrop="onDrop(event)">
          ${answers[q.id] ? answers[q.id].text : "Drop answer here"}
        </span></p>
      `;
      questionsBox.appendChild(wrap);
    }

    // MCQ SINGLE
    else if (q.type === "mcq") {
      const wrap = document.createElement("div");
      wrap.className = "question";
      wrap.innerHTML = `<p><span class="q-number">${q.id}</span> ${q.text}</p><div class="mcq-list"></div>`;
      const list = wrap.querySelector(".mcq-list");
      q.options.forEach(opt => {
        const letter = opt[0];
        const box = document.createElement("div");
        box.className = `mcq-box ${answers[q.id] === letter ? 'selected' : ''}`;
        box.textContent = opt;
        box.onclick = () => {
          answers[q.id] = letter;
          renderQuestions(questions);
          renderNavigator(questions);
        };
        list.appendChild(box);
      });
      questionsBox.appendChild(wrap);
    }
  });
}

/* ===============================
    DRAG & DROP LOGIC
================================ */
function allowDrop(e) { e.preventDefault(); }
function onDragStart(e) { e.dataTransfer.setData("text/plain", e.target.dataset.value); }
function onDrop(e) {
  e.preventDefault();
  const letter = e.dataTransfer.getData("text/plain");
  const zone = e.target.closest(".drop-zone");
  if (!zone) return;
  const qid = zone.dataset.qid;
  const fullText = activeDragOptions.find(opt => opt.startsWith(letter));
  if (!fullText) return;

  if (answers[qid]) delete usedOptions[answers[qid].letter];
  if (usedOptions[letter]) delete answers[usedOptions[letter]];

  answers[qid] = { letter, text: fullText };
  usedOptions[letter] = qid;
  renderCurrentPart();
}

/* ===============================
    NAVIGATOR BUBBLES
================================ */
function renderNavigator(questions) {
  navigatorEl.innerHTML = "";
  questions.forEach(q => {
    if (q.type === "mcq-multi" && Array.isArray(q.qNumbers)) {
      const key = q.qNumbers.join("-");
      const count = answers[key]?.length || 0;
      q.qNumbers.forEach((num, index) => {
        createBubble(num, (count >= 1 && index === 0) || (count === q.qNumbers.length));
      });
    } else if (q.id) {
      createBubble(q.id, !!answers[q.id]);
    }
  });
}

function createBubble(id, isAnswered) {
  const b = document.createElement("div");
  b.className = `bubble ${isAnswered ? 'answered' : ''} ${marked.has(id) ? 'marked' : ''}`;
  b.textContent = id;
  b.onclick = () => {
    marked.has(id) ? marked.delete(id) : marked.add(id);
    renderNavigator(test.parts[currentPart].questions);
  };
  navigatorEl.appendChild(b);
}

/* ===============================
    TIMER & VIOLATIONS
================================ */
function startTransferTime() {
  if (transferFinished || transferInterval) return;
  timerEl.classList.remove("hidden");
  transferInterval = setInterval(() => {
    transferTime--;
    const m = Math.floor(transferTime / 60);
    const s = transferTime % 60;
    timerEl.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

    if (transferTime <= 0) {
      clearInterval(transferInterval);
      transferFinished = true;
      finishListening();
    }
  }, 1000);
}

function handleViolation() {
  if (finished || endingInProgress) return;
  violations++;
  if (violations === 1) {
    endingInProgress = true;
    alert("⚠️ Warning! Leaving the test is not allowed. Next time, the test will end.");
    setTimeout(() => endingInProgress = false, 100);
  } else {
    finishListening();
  }
}

/* ===============================
    SCORING LOGIC
================================ */
function calculateScore() {
  let score = 0;
  test.parts.forEach(part => {
    part.questions.forEach(q => {
      if (!q.id && !q.qNumbers) return;

      // ... inside calculateScore() ...
if (q.type === "gap") {
  const user = answers[q.id] ? String(answers[q.id]).trim().toLowerCase() : "";
  const correct = q.answer ? String(q.answer).trim().toLowerCase() : "";
  
  if (user === correct && user !== "") {
    score++;
  }
} 
      else if (q.type === "mcq") {
        if (answers[q.id] === q.answer) score++;
      } 
      else if (q.type === "drag") {
        if (answers[q.id]?.letter?.toUpperCase() === q.answer?.toUpperCase()) score++;
      } 
      else if (q.type === "mcq-multi") {
        const key = q.qNumbers.join("-");
        const userChoices = answers[key];
        const correctArray = q.answer || q.answers;
        if (Array.isArray(userChoices) && Array.isArray(correctArray)) {
          const normCorrect = correctArray.map(a => a.trim().toUpperCase());
          userChoices.forEach(c => { if (normCorrect.includes(c.trim().toUpperCase())) score++; });
        }
      }
    });
  });
  return score;
}

/* ===============================
    FINISH & SUPABASE SYNC
================================ */
async function finishListening() {
  if (finished) return;
  finished = true;
  endingInProgress = true;

  // Cleanup
  clearInterval(transferInterval);
  if (audioPlayer) audioPlayer.pause();
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("blur", onWindowBlur);

  const finalScore = calculateScore();
  const attemptId = sessionStorage.getItem("attemptId");
console.log("🔍 Attempt ID found in Storage:", attemptId); // CHECK THIS

if (attemptId && window.supabaseClient) {
    try {
        const { data, error } = await window.supabaseClient
            .from('test_attempts')
            .update({ listening_score: finalScore })
            .eq('id', attemptId)
            .select(); // This helps confirm if the row was actually found
            
        if (error) {
            console.error("❌ Supabase Error:", error.message);
        } else if (data.length === 0) {
            console.warn("⚠️ Row found? No. The ID might not exist in the DB.");
        } else {
            console.log("✅ Successfully updated row:", data);
        }
    } catch (e) {
        console.error("❌ Script Crash:", e);
    }
} else {
    console.error("❌ Cannot sync: AttemptID is missing OR SupabaseClient is null");
}

  // Session storage fallback
  sessionStorage.setItem("listeningScore", finalScore);
  sessionStorage.setItem("listeningFinished", "true");

  // Show UI
  showFinishModal({
    title: "Listening Section Completed",
    message: `Continue to the Reading section.`,
    buttonText: "Continue to Reading",
    onClick: () => {
      examLocked = false;
      const mockId = testId.replace("listening_", "");
      window.location.href = `reading-instructions.html?mock=${mockId}`;
    }
  });
}

function showFinishModal({ title, message, buttonText, onClick }) {
  const overlay = document.getElementById("finishOverlay");
  document.getElementById("finishTitle").textContent = title;
  document.getElementById("finishMessage").textContent = message;
  const btn = document.getElementById("finishBtn");
  btn.textContent = buttonText;
  btn.onclick = onClick;
  overlay.classList.remove("hidden");
}