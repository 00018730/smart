// This name must match the 'export const supabase' in client.js
import { supabase } from './supabase/client.js';

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

    // We use the ID "fullName" from your HTML for the username input
    const username = document.getElementById("fullName").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      errorMsg.textContent = "Please enter both username and password";
      errorMsg.style.color = "red";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const mockId = params.get("mock");

    if (!mockId) {
      alert("Mock test not selected. Please return to the home page.");
      return;
    }

    try {
      // 1. Check if the student exists in the 'students' table
      const { data: student, error: authError } = await supabase
        .from('students')
        .select('username')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle(); // Returns null if no match found

      if (authError) throw authError;

      if (!student) {
        errorMsg.textContent = "Invalid username or password";
        errorMsg.style.color = "red";
        return;
      }

      // 2. If authorized, create the test attempt in 'test_attempts'
      const { data: attemptData, error: attemptError } = await supabase
        .from('test_attempts')
        .insert([
          { 
            full_name: username, 
            mock_id: mockId, 
            status: "in_progress" 
          }
        ])
        .select();

      if (attemptError) throw attemptError;

      if (attemptData && attemptData.length > 0) {
        const attemptId = attemptData[0].id;

        // Save session info
        sessionStorage.setItem("attemptId", attemptId);
        sessionStorage.setItem("studentName", username);
        sessionStorage.setItem("mockId", mockId);

        // Redirect to instructions
        window.location.href = `listening-instructions.html?mock=${mockId}`;
      }
    } catch (err) {
      console.error("Supabase Error:", err.message || err);
      alert("An error occurred during login. Check console for details.");
    }
  });
});