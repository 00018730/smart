console.log("🔐 Login loaded");


const SUPABASE_URL = "https://imdqpbxqrxrlbxlqeeju.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHFwYnhxcnhybGJ4bHFlZWp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI0NjMyMCwiZXhwIjoyMDg0ODIyMzIwfQ.U82C7IPzAu6mCvSU4-QCBtAMUL2arJsom8cGv_f0YhY";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!fullName || !password) {
    errorMsg.textContent = "All fields are required";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const mockId = params.get("mock");

  if (!mockId) {
    alert("Mock test not selected");
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/attempts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        full_name: fullName,
        mock_id: mockId,
        status: "in_progress"
      })
    });

    if (!res.ok) {
      throw new Error("Failed to create attempt");
    }

    const data = await res.json();
    const attemptId = data[0].id;

    // ✅ STORE ATTEMPT
    sessionStorage.setItem("attemptId", attemptId);
    sessionStorage.setItem("mockId", mockId);
    sessionStorage.setItem("studentName", fullName);

    console.log("✅ Attempt created:", attemptId);

    window.location.href = `listening-instructions.html?mock=${mockId}`;

  } catch (err) {
    console.error(err);
    alert("Login failed. Please try again.");
  }
});

console.log("ATTEMPT ID:", attemptId);
