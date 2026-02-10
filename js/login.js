console.log("🔐 Login loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  if (!form) {
    console.error("❌ loginForm not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
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

    // ... existing code ...
try {
  const { data, error } = await window.supabaseClient
    .from('test_attempts') // <--- Changed from 'attempts' to 'test_attempts'
    .insert([
      { 
        full_name: fullName, 
        mock_id: mockId, 
        status: "in_progress" 
      }
    ])
    .select();
// ... rest of the code ... // This acts like "return=representation"

      if (error) throw error;

      if (data && data.length > 0) {
        const attemptId = data[0].id;

        sessionStorage.setItem("attemptId", attemptId);
        sessionStorage.setItem("studentName", fullName);
        sessionStorage.setItem("mockId", mockId);

        window.location.href = `listening-instructions.html?mock=${mockId}`;
      }
    } catch (err) {
      console.error("Supabase Error:", err.message || err);
      alert("Login failed. Please try again.");
    }
  });
});
