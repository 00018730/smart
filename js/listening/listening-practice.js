console.log("🎧 Listening Practice Engine – Supabase Mode");

/* ===============================
    STATE & URL PARAMS
================================ */
const params = new URLSearchParams(window.location.search);
const testId = params.get("test");
let test = null; 

let currentPart = 0;
let finished = false;
const answers = {};
const marked = new Set();
let activeDragOptions = [];
let usedOptions = {}; 

// DOM Elements
let audioPlayer, audioProgress, timerEl, instructionsEl, questionsBox, navigatorEl, sectionsEl;

/* ===============================
    INIT (ASYNC FETCH)
================================ */
document.addEventListener("DOMContentLoaded", async () => {
    if (!testId) {
        alert("No test selected!");
        window.location.href = "practice-selection.html";
        return;
    }

    // 1. Fetch from Supabase
    test = await fetchPracticeData(testId);

    if (!test) {
        document.body.innerHTML = `
            <div style="text-align:center; padding-top:100px; font-family:sans-serif;">
                <h1>Test Not Found</h1>
                <p>Could not load: <strong>${testId}</strong></p>
                <button onclick="window.location.href='practice-selection.html'">Back to Selection</button>
            </div>`;
        return;
    }

    // 2. Initialize DOM Reference
    initDOMElements();

    // 3. Set Title
    const titleEl = document.getElementById('headerTitle');
    if (titleEl) titleEl.textContent = formatTestTitle(testId);

    // 4. Start UI
    setupAudio();
    renderSections();
    renderCurrentPart();
    if(timerEl) timerEl.classList.add("hidden");
});

async function fetchPracticeData(id) {
    if (!window.supabaseClient) {
        console.error("Supabase client not found on window");
        return null;
    }
    const { data, error } = await window.supabaseClient
        .from('listening_tests')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return data.content; 
}

function initDOMElements() {
    audioPlayer    = document.getElementById("audioPlayer");
    audioProgress  = document.getElementById("audioProgress");
    timerEl        = document.getElementById("timer");
    instructionsEl = document.getElementById("instructions");
    questionsBox   = document.getElementById("questionsBox");
    navigatorEl    = document.getElementById("questionNavigator");
    sectionsEl     = document.querySelector(".sections");

    // NEW: Submit Button Logic
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.onclick = () => {
            if (confirm("Are you sure you want to submit? This will end your practice session.")) {
                finishPractice();
            }
        };
    }
}

/* ===============================
    AUDIO CORE
================================ */
function setupAudio() {
    audioPlayer.src = test.audio;
    audioPlayer.preload = "auto";
    
    // Auto-play logic
    audioPlayer.muted = true;
    audioPlayer.addEventListener("canplay", () => {
        audioPlayer.play().then(() => {
            audioPlayer.muted = false;
        }).catch(e => console.warn("Autoplay blocked."));
    }, { once: true });

    audioPlayer.addEventListener("timeupdate", () => {
        if (!audioPlayer.duration) return;
        audioProgress.style.width = (audioPlayer.currentTime / audioPlayer.duration) * 100 + "%";
    });
}

/* ===============================
    RENDERING ENGINE
================================ */
function renderSections() {
    sectionsEl.innerHTML = "";
    test.parts.forEach((part, index) => {
        const btn = document.createElement("button");
        btn.className = `section-btn ${index === currentPart ? 'active' : ''}`;
        btn.textContent = `Part ${part.part}`;
        btn.onclick = () => { currentPart = index; updateSectionUI(); };
        sectionsEl.appendChild(btn);
    });
}

function updateSectionUI() {
    document.querySelectorAll(".section-btn").forEach((b, i) => b.classList.toggle("active", i === currentPart));
    renderCurrentPart();
}

function renderCurrentPart() {
    const part = test.parts[currentPart];
    //renderInstructions(part.instructions);
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

function renderQuestions(questions, instructions) {
    questionsBox.innerHTML = "";
    
    // Safety: ensure instructions is always an array
    const instructionList = Array.isArray(instructions) ? instructions : (instructions ? [instructions] : []);

    questions.forEach((q, index) => {
        
        /* ===============================
           DYNAMIC INSTRUCTION PLACEMENT 
           (Kept for backward compatibility)
        =============================== */
        instructionList.forEach(ins => {
            if (ins.title && q.id && ins.title.includes(q.id)) {
                const insDiv = document.createElement("div");
                insDiv.className = "instructions mid-section-instruction"; 
                insDiv.innerHTML = `
                    ${ins.title ? `<h2 class="instruction-title">${ins.title}</h2>` : ""}
                    ${ins.task ? `<p class="instruction-task">${ins.task.replace(/\n/g, "<br>")}</p>` : ""}
                `;
                questionsBox.appendChild(insDiv);
            }
        });

        /* ===============================
           EXISTING & NEW QUESTION TYPES
        =============================== */
        
        // NEW: Instruction as a Question Type
        

        // 1. MCQ MULTI
        // 1. MCQ MULTI
if (q.type === "mcq-multi") {
    const key = q.qNumbers.join("-");
    if (!Array.isArray(answers[key])) answers[key] = [];
    const selected = answers[key];

    const wrap = document.createElement("div");
    wrap.className = "question mcq-multi";
    wrap.innerHTML = `
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
                // Limit selection to the number of expected answers
                if (selected.length === q.qNumbers.length) selected.shift();
                selected.push(letter);
            }
            answers[key] = [...selected];
            renderQuestions(questions, instructions); 
            renderNavigator(questions);
        };
        list.appendChild(box);
    });
    questionsBox.appendChild(wrap);
}

        // 2. DECORATIVE ELEMENTS
        else if (["title", "heading", "textline"].includes(q.type)) {
            const el = document.createElement("div");
            el.className = `q-${q.type}`;
            el.textContent = q.text;
            questionsBox.appendChild(el);
        }

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

        // 3. MAP IMAGE HANDLER
        else if (q.type === "map-image") {
    const imgWrap = document.createElement("div");
    imgWrap.className = "map-wrap";
    imgWrap.innerHTML = `<img src="${q.src}" style="width:100%; height:auto;" alt="Test Map">`;
    questionsBox.appendChild(imgWrap);
}

        // 4. GAP FILL
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

        // 5. DROPDOWN (For Maps)
        // Replace your existing 'dropdown' else-if block with this:
else if (q.type === "dropdown") {
    const wrap = document.createElement("div");
    wrap.className = "question dropdown-question";
    const optionsHTML = q.options.map(opt => 
        `<option value="${opt}" ${answers[q.id] === opt ? 'selected' : ''}>${opt}</option>`
    ).join("");
    
    wrap.innerHTML = `
        <p>
            <span class="q-number">${q.id}</span> 
            <span class="q-text">${q.text}</span>
            <select class="map-dropdown" data-qid="${q.id}">
                <option value="">Select...</option>
                ${optionsHTML}
            </select>
        </p>
    `;
    
    wrap.querySelector("select").onchange = (e) => {
        answers[q.id] = e.target.value;
        renderNavigator(questions);
    };
    questionsBox.appendChild(wrap);
}

        // 6. DRAG DROP TARGET
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

        // 7. MCQ SINGLE
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
                    renderQuestions(questions, instructions); 
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
    NAVIGATOR
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
    SCORING & FINISH
================================ */
function calculateScore() {
    let score = 0;
    test.parts.forEach(part => {
        part.questions.forEach(q => {
            // 1. GAP FILL (Text)
            if (q.type === "gap") {
                const user = answers[q.id] ? String(answers[q.id]).trim().toLowerCase() : "";
                const correct = q.answer ? String(q.answer).trim().toLowerCase() : "";
                if (user === correct && user !== "") score++;
            } 
            
            // 2. MCQ & DROPDOWN (Letter based)
            else if (q.type === "mcq" || q.type === "dropdown") {
                const userAns = answers[q.id] ? String(answers[q.id]).trim().toUpperCase() : "";
                const correctAns = q.answer ? String(q.answer).trim().toUpperCase() : "";
                if (userAns === correctAns && userAns !== "") score++;
            } 
            
            // 3. DRAG (Matching)
            else if (q.type === "drag") {
                // Check if your onDrop saves the whole object or just the letter
                const userVal = typeof answers[q.id] === 'object' ? answers[q.id]?.letter : answers[q.id];
                const userAns = userVal ? String(userVal).trim().toUpperCase() : "";
                const correctAns = q.answer ? String(q.answer).trim().toUpperCase() : "";
                
                if (userAns === correctAns && userAns !== "") score++;
            } 
            
            // 4. MCQ MULTI (Multiple letters)
            else if (q.type === "mcq-multi") {
                const key = q.qNumbers.join("-");
                const userAns = Array.isArray(answers[key]) ? answers[key] : [];
                const correctAns = Array.isArray(q.answer) ? q.answer : []; 
                
                // IELTS standard: Each correct letter in a multi-choice usually counts as 1 point
                correctAns.forEach(letter => {
                    if (userAns.includes(letter.toUpperCase())) {
                        score++;
                    }
                });
            }
        });
    });
    return score;
}

function finishPractice() {
    if (finished) return;
    finished = true;

    // Stop everything immediately
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = ""; // Clear source to stop buffering
    }
    
    // Clear any active timers
    if (window.transferInterval) {
        clearInterval(window.transferInterval);
    }

    const finalScore = calculateScore();
    
    // Show the modal with the score
    showFinishModal({
        title: "Practice Completed!",
        message: `You scored ${finalScore} out of 40.`,
        buttonText: "Back to Books",
        onClick: () => {
            window.location.href = "practice-selection.html?type=listening";
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

function formatTestTitle(id) {
    if(id.startsWith('cam')) {
        const book = id.match(/cam(\d+)/)?.[1] || "";
        const testNum = id.match(/test(\d+)/)?.[1] || "";
        return `Cambridge ${book} - Test ${testNum}`;
    }
    return "Listening Practice";
}