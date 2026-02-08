const translations = {
  en: {
    centerName: "Smart Learning Center",
    heroTitle: "Learn English.<br>Build Confidence.<br>Achieve Results.",
    heroText:
      "IELTS preparation and English courses designed for real progress — not memorization.",
    enrollBtn: "Enroll Now",
    practiceBtn: "Try Practice Test"
  },

  uz: {
    centerName: "Smart O‘quv Markazi",
    heroTitle: "Ingliz tilini o‘rganing.<br>Ishonch hosil qiling.<br>Natijaga erishing.",
    heroText:
      "Haqiqiy rivojlanish uchun tuzilgan IELTS va ingliz tili kurslari.",
    enrollBtn: "Ro‘yxatdan o‘tish",
    practiceBtn: "Sinov testini boshlash"
  },

  ru: {
    centerName: "Учебный Центр Smart",
    heroTitle: "Изучайте английский.<br>Уверенность.<br>Результат.",
    heroText:
      "Курсы английского языка и подготовка к IELTS для реального прогресса.",
    enrollBtn: "Записаться",
    practiceBtn: "Пробный тест"
  }
};

function setLanguage(lang) {
  const elements = document.querySelectorAll("[data-i18n]");

  elements.forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  localStorage.setItem("lang", lang);
}

document.querySelectorAll("[data-lang]").forEach(btn => {
  btn.addEventListener("click", () => {
    setLanguage(btn.dataset.lang);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("langToggle");
  const dropdown = document.getElementById("langDropdown");
  const currentFlag = document.getElementById("currentFlag");

  const LANGS = {
  en: "assets/flags/uk.jpg",
  uz: "assets/flags/uzb.jpg",
  ru: "assets/flags/ru.jpg"
};

function setLanguage(lang) {
  localStorage.setItem("lang", lang);
  currentFlag.src = LANGS[lang];
}

  // Load saved language
  const savedLang = localStorage.getItem("lang") || "en";
  setLanguage(savedLang);

  // Toggle dropdown
  toggle.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  // Select language
  dropdown.querySelectorAll("button[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
      dropdown.style.display = "none";
    });
  });

  // Close when clicking outside
  document.addEventListener("click", e => {
    if (!e.target.closest(".lang-switcher")) {
      dropdown.style.display = "none";
    }
  });
});
