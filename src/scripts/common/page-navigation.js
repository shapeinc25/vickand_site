document.querySelectorAll("a.page-toggle").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.__reduced)
      return;
    event.preventDefault();
    const target = document.documentElement.dataset.page === "ux" ? "light" : "dark";
    link.parentElement.dataset.theme = target;
    link.classList.add(target === "dark" ? "to-dark" : "to-light");
    setTimeout(() => location.assign(link.href), 420);
  });
});
// With no script, a closed navigation still needs a usable way to reach the other pages.
document.documentElement.classList.add("nav-ready");
