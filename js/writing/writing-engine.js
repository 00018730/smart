console.log("✍️ Writing Engine v1.1 – Supabase Integrated");

/* ===============================
    HARD FAIL SAFE
================================ */
if (!window.WRITING_TESTS) {
  alert("❌ writing-data.js not loaded");
  throw new Error("WRITING_TESTS missing");
}

/* ===============================
    URL PARAM
================================ */
const params = new URLSearchParams(window.location.search);
const testId = params.get("test");

if (!testId || !WRITING_TESTS[testId]) {
  document.body.innerHTML = `<div style="padding:40px"><h1>Test not found</h1></div>`;
  throw new Error("Invalid test ID");
}

const test = WRITING_TESTS[testId];

/* ===============================
    DOM & STATE
================================ */
const timerEl      = document.getElementById("timer");
const writingBox   = document.getElementById("writingBox");
const wordCountEl  = document.getElementById("wordCount");
const taskPanel    = document.querySelector(".task-box");
const footer       = document.querySelector(".writing-footer");

let currentTaskIndex = 0;
let timeLeft = test.timeLimit;
let timerInterval = null;
let attemptId = sessionStorage.getItem("attemptId");

// Fallback if session is lost (prevents crash)
if (!attemptId) {
  alert("Session lost. Please restart from the login page.");
}

const answers = {
  1: "",
  2: ""
};

/* ===============================
    INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  startTimer();
  renderTaskSwitchButtons();
  renderTask();
  setupWordCount();
  
  // Auto-save every 30 seconds
  setInterval(() => saveWritingToSupabase(false), 30000);
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
      finishWriting();
    }
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* ===============================
    TASK RENDERING
================================ */
function renderTaskSwitchButtons() {
  footer.innerHTML = "";
  test.tasks.forEach((task, index) => {
    const btn = document.createElement("button");
    btn.className = `nav-btn ${index === currentTaskIndex ? 'primary' : 'secondary'}`;
    btn.textContent = `Task ${task.id}`;
    btn.onclick = () => {
      saveCurrentAnswer();
      currentTaskIndex = index;
      renderTaskSwitchButtons();
      renderTask();
    };
    footer.appendChild(btn);
  });
}

function renderTask() {
  const task = test.tasks[currentTaskIndex];
  if (!task) return;

  // We wrap the question in the .task-question class which we just styled
  taskPanel.innerHTML = `
    <div class="task-instruction">
      <h2>${task.title}</h2>
      <p>${task.instruction.replace(/\n/g, "<br>")}</p>
    </div>
    
    <div class="task-question">
      ${task.question.replace(/\n/g, "<br>")}
    </div>
    
    <div id="image-slot"></div>
  `;

  if (task.image) {
    const imageSlot = document.getElementById("image-slot");
    const img = document.createElement("img");
    img.src = task.image;
    img.className = "writing-task-image"; // Uses the image style from your CSS
    imageSlot.appendChild(img);
  }

  writingBox.value = answers[task.id] || "";
  updateWordCount();
}

/* ===============================
    WORD COUNT & SAVING
================================ */
function setupWordCount() {
  writingBox.addEventListener("input", () => {
    updateWordCount();
    answers[test.tasks[currentTaskIndex].id] = writingBox.value;
  });
}

function updateWordCount() {
  const text = writingBox.value.trim();
  const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
  wordCountEl.textContent = `${count} words`;
}

function saveCurrentAnswer() {
  const taskId = test.tasks[currentTaskIndex].id;
  answers[taskId] = writingBox.value;
}

/* ===============================
    SUPABASE INTEGRATION
================================ */
async function saveWritingToSupabase(isFinal = false) {
  if (!window.supabaseClient || !attemptId) return;

  const payload = {
    writing_task1: answers[1],
    writing_task2: answers[2]
  };

  const { error } = await window.supabaseClient
    .from("test_attempts")
    .update(payload)
    .eq('id', attemptId);

  if (error) {
    console.error("❌ Writing save failed:", error.message);
  } else {
    console.log(isFinal ? "✅ Final submission saved" : "☁️ Writing autosaved");
  }
}

/* ===============================
    FINISH
================================ */
async function finishWriting() {
  clearInterval(timerInterval);
  
  // Show loading state
  document.body.innerHTML = `<div class="finish-screen"><h1>Saving your work...</h1></div>`;
  
  await saveWritingToSupabase(true);
  sessionStorage.setItem("writingFinished", "true");

  document.body.innerHTML = `
    <div class="finish-screen">
      <h1>Writing has ended</h1>
      <p>Your responses have been successfully saved to your mock record.</p>
      <button id="toResultsBtn" class="primary-btn">View Full Results</button>
    </div>
  `;

  document.getElementById("toResultsBtn").onclick = () => {
    window.location.href = "results.html";
  };
}