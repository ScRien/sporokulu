document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  const currentTheme = localStorage.getItem("theme");

  // Sayfa yüklenince tema uygula
  if (currentTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "🌙";
  } else {
    themeIcon.textContent = "🌞";
  }

  // Butona basınca tema değiştir
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    if (isDark) {
      localStorage.setItem("theme", "dark");
      themeIcon.textContent = "🌙";
    } else {
      localStorage.setItem("theme", "light");
      themeIcon.textContent = "🌞";
    }
  });
});
