// Apply the saved theme before first paint. No attribute = follow the OS.
try {
  const t = localStorage.getItem("theme")
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t
} catch {}
