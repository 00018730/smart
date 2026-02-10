import { supabase } from './supabase/client.js';

document.getElementById('enrollForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = document.getElementById('studentName').value.trim();
  const phoneNumber = document.getElementById('studentPhone').value.trim();
  const errorEl = document.getElementById('regError');
  const successEl = document.getElementById('regSuccess');

  errorEl.textContent = "";
  successEl.textContent = "";

  try {
    // Insert into the new dedicated enrollments table
    const { error } = await supabase
      .from('enrollments')
      .insert([{ 
        full_name: fullName, 
        phone_number: phoneNumber 
      }]);

    if (error) throw error;

    successEl.textContent = "Thank you! We will contact you soon.";
    
    // Reset form
    document.getElementById('enrollForm').reset();

  } catch (err) {
    console.error("Enrollment Error:", err.message);
    errorEl.textContent = "Something went wrong. Please try again.";
  }
});