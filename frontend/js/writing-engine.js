console.log("✍️ Writing Engine v1 – CORE");

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
  document.body.innerHTML = `
    <div style="padding:40px">
      <h1>Test not found</h1>
      <p>Invalid writing test.</p>
    </div>
  `;
  throw new Error("Invalid test ID");
}

const test = WRITING_TESTS[testId];
console.log("✅ Writing test loaded:", testId);

/* ===============================
   DOM
================================ */
const timerEl      = document.getElementById("timer");
const writingBox  = document.getElementById("writingBox");
const wordCountEl = document.getElementById("wordCount");

const taskPanel   = document.querySelector(".task-box");
const footer      = document.querySelector(".writing-footer");

/* ===============================
   STATE
================================ */
let currentTaskIndex = 0;
let timeLeft = test.timeLimit;
let timerInterval = null;

// store answers separately
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
  timerEl.textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* ===============================
   TASK SWITCH BUTTONS
================================ */
function renderTaskSwitchButtons() {
  footer.innerHTML = "";

  test.tasks.forEach((task, index) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.textContent = `Task ${task.id}`;

    if (index === currentTaskIndex) {
      btn.classList.add("primary");
    } else {
      btn.classList.add("secondary");
    }

    btn.onclick = () => {
      saveCurrentAnswer();
      currentTaskIndex = index;
      renderTaskSwitchButtons();
      renderTask();
    };

    footer.appendChild(btn);
  });
}

/* ===============================
   RENDER TASK
================================ */
function renderTask() {
  const task = test.tasks[currentTaskIndex];
  if (!task) return;

  taskPanel.innerHTML = "";

  // Instruction
  const instruction = document.createElement("div");
  instruction.className = "task-instruction";
  instruction.innerHTML = `
    <h2>${task.title}</h2>
    <p>${task.instruction.replace(/\n/g, "<br>")}</p>
  `;
  taskPanel.appendChild(instruction);

  // Question text
  const question = document.createElement("div");
  question.className = "task-question";
  question.innerHTML = task.question.replace(/\n/g, "<br>");
  taskPanel.appendChild(question);
  // Image (Task 1 only)
  if (task.image) {
    const img = document.createElement("img");
    img.src = task.image;
    img.alt = "Task 1 graph";
    img.style.width = "100%";
    img.style.marginBottom = "20px";
    taskPanel.appendChild(img);
  }



  // Load saved answer
  writingBox.value = answers[task.id] || "";
  updateWordCount();
}

/* ===============================
   WORD COUNT
================================ */
function setupWordCount() {
  writingBox.addEventListener("input", () => {
    updateWordCount();
    answers[test.tasks[currentTaskIndex].id] = writingBox.value;
  });
}

function updateWordCount() {
  const text = writingBox.value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  wordCountEl.textContent = `${count} words`;
}

function saveCurrentAnswer() {
  const taskId = test.tasks[currentTaskIndex].id;
  answers[taskId] = writingBox.value;
}

function saveWritingToSupabase() {
  const attemptId = sessionStorage.getItem("attemptId");

  if (!attemptId) return;

  // IMPORTANT: Save whatever is currently in the textarea to the answers object 
  // before sending, so the "autosave" includes the latest keystrokes.
  saveCurrentAnswer(); 

  fetch("/api/writing/upsert", { // Change endpoint name to 'upsert'
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId,
      task1: answers[1] || "",
      task2: answers[2] || "",
      wordsTask1: countWords(answers[1] || ""),
      wordsTask2: countWords(answers[2] || "")
    })
  })
  .then(res => res.json())
  .then(data => console.log("💾 Progress Synced"))
  .catch(err => console.error("❌ Sync failed:", err));
}

// Keep it at 10 or 15 seconds to be kind to your server
setInterval(saveWritingToSupabase, 15000);

function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

setInterval(saveWritingToSupabase, 30000);


/* ===============================
   FINISH
================================ */
function finishWriting() {
  saveWritingToSupabase();

  document.body.innerHTML = `
    <div class="finish-screen">
      <h1>Writing has ended</h1>
      <p>Your responses have been saved.</p>
      <button id="toResultsBtn">Go to Results</button>
    </div>
  `;

  document.getElementById("toResultsBtn").onclick = () => {
    window.location.href = "results.html";
  };
}
