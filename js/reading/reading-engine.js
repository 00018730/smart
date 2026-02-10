console.log("📘 Reading Engine – Phase 1 (Supabase Integrated)");

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
const navigatorEl      = document.getElementById("questionNavigator"); // Ensure this ID exists in HTML
const allQuestions = [];

/* ===============================
    STATE
================================ */
let currentPassageIndex = 0;
let timeLeft = test.timeLimit || 3600;
let timerInterval = null;
let activeMatchingOptions = [];
let activeDragOptions = [];
let usedDragOptions = {}; 

const answers = {};   
const marked  = new Set();

/* ===============================
    INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  buildAllQuestions(); // Populate the question list for the navigator
  startTimer();
  renderPassage();
  renderNavigator();
});

/* ===============================
    TIMER
================================ */
function startTimer() {
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishReading();
    }
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* ===============================
    PASSAGE RENDER
================================ */
function renderPassage() {
  const passage = test.passages[currentPassageIndex];
  if (!passage) return;

  passageTitleEl.textContent = passage.title || "";
  passageContentEl.innerHTML = "";
  passage.text.split("\n").filter(p => p.trim()).forEach(p => {
    const el = document.createElement("p");
    el.innerHTML = p.trim();
    passageContentEl.appendChild(el);
  });

  questionsBox.innerHTML = "";
  renderQuestions(passage.questions || []);      
}

function buildAllQuestions() {
  allQuestions.length = 0;
  test.passages.forEach(passage => {
    passage.questions.forEach(q => {
      if (q.id) allQuestions.push(q);
      else if (q.type === "summary" && q.items) {
          q.items.forEach(item => allQuestions.push(item));
      }
    });
  });
}

/* ===============================
    QUESTIONS RENDER (TYPES)
================================ */
function renderQuestions(questions) {
  questions.forEach(q => {
    if (q.type === "instruction") {
      const box = document.createElement("div");
      box.className = "reading-instruction";
      box.innerHTML = q.text.replace(/\n/g, "<br>");
      questionsBox.appendChild(box);
    }
    else if (q.type === "matching-options") {
      activeMatchingOptions = q.options.slice();
    }
    else if (["title", "heading", "textline"].includes(q.type)) {
      const el = document.createElement("div");
      el.className = `reading-${q.type}${q.type === 'title' ? '-inline' : ''}`;
      el.textContent = q.text;
      questionsBox.appendChild(el);
    }
    else if (q.type === "gap" || q.type === "sentence") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question gap-question";
      wrap.innerHTML = `
        <p>${q.before || ""} <span class="q-number">${q.id}</span>
        <input class="gap-input" type="text" value="${answers[q.id] ?? ""}" autocomplete="off" spellcheck="false" />
        ${q.after || ""}</p>`;
      wrap.querySelector("input").addEventListener("input", e => {
        answers[q.id] = e.target.value;
        renderNavigator();
      });
      questionsBox.appendChild(wrap);
    }
    else if (q.type === "matching") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question matching-question";
      wrap.innerHTML = `
        <p><span class="q-number">${q.id}</span> ${q.text}
        <select class="matching-select"><option value="">—</option>
        ${activeMatchingOptions.map(opt => `<option value="${opt[0]}" ${answers[q.id] === opt[0] ? "selected" : ""}>${opt}</option>`).join("")}
        </select></p>`;
      wrap.querySelector("select").addEventListener("change", e => {
        answers[q.id] = e.target.value;
        renderNavigator();
      });
      questionsBox.appendChild(wrap);
    }
    else if (q.type === "drag-options") {
      activeDragOptions = q.options.slice();
      const box = document.createElement("div");
      box.className = "drag-options-box";
      box.innerHTML = activeDragOptions.map(opt => {
        const letter = opt[0];
        return `<div class="drag-option ${usedDragOptions[letter] ? "hidden" : ""}" draggable="true" data-value="${letter}">${opt}</div>`;
      }).join("");
      box.querySelectorAll(".drag-option").forEach(el => el.addEventListener("dragstart", onDragStart));
      questionsBox.appendChild(box);
    }
    else if (q.type === "drag-drop") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question drag-question";
      wrap.innerHTML = `
        <p><span class="q-number">${q.id}</span> ${q.text}
        <span class="drop-zone" data-qid="${q.id}">${answers[q.id] ? answers[q.id].text : "Drop answer here"}</span></p>`;
      const zone = wrap.querySelector(".drop-zone");
      zone.addEventListener("dragover", e => e.preventDefault());
      zone.addEventListener("drop", onDrop);
      questionsBox.appendChild(wrap);
    }
    else if (q.type === "mcq") {
      const wrap = document.createElement("div");
      wrap.className = "reading-question mcq-question";
      wrap.innerHTML = `<p><span class="q-number">${q.id}</span> ${q.text}</p><div class="mcq-list"></div>`;
      const list = wrap.querySelector(".mcq-list");
      q.options.forEach(opt => {
        const letter = opt[0];
        const box = document.createElement("div");
        box.className = `mcq-box ${answers[q.id] === letter ? "selected" : ""}`;
        box.textContent = opt;
        box.onclick = () => {
          answers[q.id] = letter;
          renderPassage(); // Re-render to update selected UI
          renderNavigator();
        };
        list.appendChild(box);
      });
      questionsBox.appendChild(wrap);
    }
    else if (q.type === "ynng" || q.type === "tfng") {
      const options = q.type === "ynng" ? ["Y", "N", "NG"] : ["True", "False", "Not Given"];
      const labels = q.type === "ynng" ? ["Yes", "No", "Not Given"] : options;
      const wrap = document.createElement("div");
      wrap.className = `reading-question ${q.type}-question`;
      wrap.innerHTML = `<p><span class="q-number">${q.id}</span> ${q.text}</p>
        <div class="${q.type}-options">
          ${options.map((opt, i) => `<div class="${q.type}-box ${answers[q.id] === opt ? "selected" : ""}" data-value="${opt}">${labels[i]}</div>`).join("")}
        </div>`;
      wrap.querySelectorAll(`.${q.type}-box`).forEach(box => {
        box.onclick = () => {
          answers[q.id] = box.dataset.value;
          renderPassage();
          renderNavigator();
        };
      });
      questionsBox.appendChild(wrap);
    }
    else if (q.type === "summary") {
      const wrap = document.createElement("div");
      wrap.className = "reading-summary";
      wrap.innerHTML = `
        <div class="summary-instruction"><strong>${q.title}</strong><br>${q.instruction.replace(/\n/g, "<br>")}</div>
        <div class="summary-options">${q.options.map(opt => `<div class="summary-option">${opt}</div>`).join("")}</div>
        <div class="summary-text"></div>`;
      const textBox = wrap.querySelector(".summary-text");
      q.items.forEach(item => {
        const line = document.createElement("p");
        line.innerHTML = `${item.before} <input type="text" class="summary-input" value="${answers[item.id] || ""}" data-id="${item.id}" autocomplete="off" spellcheck="false" /> ${item.after}`;
        line.querySelector("input").addEventListener("input", e => {
          answers[item.id] = e.target.value.trim();
          renderNavigator();
        });
        textBox.appendChild(line);
      });
      questionsBox.appendChild(wrap);
    }
  });
}

/* ===============================
    NAVIGATION & DRAG ACTIONS
================================ */
prevBtn.onclick = () => { if (currentPassageIndex > 0) { currentPassageIndex--; renderPassage(); } };
nextBtn.onclick = () => { if (currentPassageIndex < test.passages.length - 1) { currentPassageIndex++; renderPassage(); } };

function onDragStart(e) { e.dataTransfer.setData("text/plain", e.target.dataset.value); }
function onDrop(e) {
  e.preventDefault();
  const letter = e.dataTransfer.getData("text/plain");
  const zone = e.target.closest(".drop-zone");
  if (!zone) return;
  const qid = zone.dataset.qid;
  const fullText = activeDragOptions.find(opt => opt.startsWith(letter));
  if (answers[qid]) delete usedDragOptions[answers[qid].letter];
  if (usedDragOptions[letter]) delete answers[usedDragOptions[letter]];
  answers[qid] = { letter, text: fullText };
  usedDragOptions[letter] = qid;
  renderPassage();
  renderNavigator();
}

/* ===============================
    NAVIGATOR
================================ */
function isAnswered(id) {
  const v = answers[id];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "object") return true;
  return false;
}

function renderNavigator() {
  if (!navigatorEl) return;
  navigatorEl.innerHTML = "";
  allQuestions.forEach(q => {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${isAnswered(q.id) ? 'answered' : ''} ${marked.has(q.id) ? 'marked' : ''}`;
    bubble.textContent = q.id;
    bubble.onclick = () => {
      marked.has(q.id) ? marked.delete(q.id) : marked.add(q.id);
      renderNavigator();
    };
    navigatorEl.appendChild(bubble);
  });
}

/* ===============================
    SCORING
================================ */
function calculateScore() {
  let score = 0;
  test.passages.forEach(passage => {
    passage.questions.forEach(q => {
      if (["title", "heading", "textline", "instruction", "matching-options", "drag-options"].includes(q.type)) return;

      if (q.type === "gap" || q.type === "sentence") {
        if (answers[q.id]?.trim().toLowerCase() === String(q.answer).trim().toLowerCase()) score++;
      } 
      else if (q.type === "mcq" || q.type === "matching") {
        if (answers[q.id] === q.answer) score++;
      } 
      else if (q.type === "tfng" || q.type === "ynng") {
        if (answers[q.id]?.toLowerCase() === q.answer.toLowerCase()) score++;
      } 
      else if (q.type === "drag-drop") {
        if (answers[q.id]?.letter === q.answer) score++;
      } 
      else if (q.type === "summary" && q.items) {
        q.items.forEach(item => {
          if (answers[item.id]?.trim().toLowerCase() === item.answer.trim().toLowerCase()) score++;
        });
      }
    });
  });
  return score;
}

/* ===============================
    FINISH & SUPABASE SYNC
================================ */
async function finishReading() {
  clearInterval(timerInterval);
  const attemptId = sessionStorage.getItem("attemptId");
  if (!attemptId) {
    alert("Attempt ID missing. Score cannot be saved.");
    return;
  }

  const score = calculateScore();

  // --- SUPABASE INTEGRATION ---
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('test_attempts')
        .update({ 
            reading_score: score
        })
        .eq('id', attemptId);

      if (error) throw error;
      console.log("✅ Reading score saved to Supabase");
    } catch (err) {
      console.error("❌ Supabase Save Failed:", err.message);
    }
  }

  sessionStorage.setItem("readingScore", score);
  sessionStorage.setItem("readingFinished", "true");

  document.body.style.overflow = "hidden";
  const overlay = document.getElementById("readingFinishOverlay");
  const btn = document.getElementById("toWritingBtn");

  if (overlay) overlay.classList.remove("hidden");
  if (btn) {
    const mockId = testId.replace("reading_", "");
    btn.onclick = () => {
      window.location.href = `writing-instructions.html?mock=${mockId}`;
    };
  }
}