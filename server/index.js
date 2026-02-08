require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "IELTS backend running" });
});








/* ===== LOGIN / CREATE ATTEMPT ===== */
app.post("/api/attempts", async (req, res) => {
  try {
    const { fullName } = req.body;

    if (!fullName || fullName.trim().length < 3) {
      return res.status(400).json({ error: "Invalid name" });
    }

    const { data, error } = await supabase
      .from("attempts")
      .insert({
        full_name: fullName.trim(),
        status: "in_progress"
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "DB error" });
    }

    res.json({ attemptId: data.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   SUBMIT LISTENING RESULT
================================ */
app.post("/api/listening/submit", async (req, res) => {
  const { attemptId, score, answers } = req.body;

  if (!attemptId) {
    return res.status(400).json({ error: "attemptId missing" });
  }

  const { error } = await supabase
    .from("listening_results")
    .insert({
      attempt_id: attemptId,
      score,
      answers
    });

  if (error) {
    console.error("❌ Listening save error:", error);
    return res.status(500).json({ error: "DB insert failed" });
  }

  res.json({ success: true });
});



/* ===== READING SUBMIT ===== */
app.post("/api/reading/submit", async (req, res) => {
  try {
    console.log("📥 READING SUBMIT RECEIVED:", req.body);

    const { attemptId, score, answers } = req.body;

    if (!attemptId) {
      return res.status(400).json({ error: "attemptId missing" });
    }

    const { error } = await supabase
      .from("reading_results")
      .insert([
        {
          attempt_id: attemptId,
          score,
          answers
        }
      ]);

    if (error) {
      console.error("❌ Reading submit error:", error);
      return res.status(500).json({ error: "DB insert failed" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 Reading submit crash:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===== WRITING SUBMIT ===== */
app.post("/api/writing/submit", async (req, res) => {
  const { attemptId, task1, task2 } = req.body;

  if (!attemptId) {
    return res.status(400).json({ error: "attemptId missing" });
  }

  // .upsert will Update the row if attempt_id exists, otherwise Insert
  const { error } = await supabase
    .from("writing_results")
    .upsert(
      {
        attempt_id: attemptId,
        task1: task1 || "",
        task2: task2 || "",
        updated_at: new Date() // Good practice to track last sync
      }, 
      { onConflict: 'attempt_id' } 
    );

  if (error) {
    console.error("Writing sync error:", error);
    return res.status(500).json({ error: "DB sync failed" });
  }

  res.json({ success: true, message: "Progress synced" });
});



app.post("/api/attempts/:id/finish", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("attempts")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to finish attempt" });
  }

  res.json({ success: true });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
