/* Dropdown behaviour: click to open, arrows to move, Enter/Space to pick, Esc to close. */
(function () {
  document.querySelectorAll("[data-dropdown]").forEach(function (dd) {
    var trigger = dd.querySelector(".dropdown-trigger");
    var menu = dd.querySelector(".dropdown-menu");
    var value = dd.querySelector(".dropdown-value");
    var items = Array.prototype.slice.call(menu.querySelectorAll(".dropdown-item"));
    items.forEach(function (i) {
      i.tabIndex = -1;
    });
    function setOpen(open, focusIndex) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
      if (open) {
        var sel = items.findIndex(function (i) {
          return i.getAttribute("aria-selected") === "true";
        });
        items[focusIndex != null ? focusIndex : Math.max(sel, 0)].focus();
      }
    }
    function pick(item) {
      items.forEach(function (i) {
        i.setAttribute("aria-selected", i === item ? "true" : "false");
      });
      if (value) value.textContent = item.textContent.trim();
      setOpen(false);
      trigger.focus();
    }
    trigger.addEventListener("click", function () {
      setOpen(menu.hidden);
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setOpen(true);
      }
    });
    items.forEach(function (item, idx) {
      item.addEventListener("click", function () {
        pick(item);
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[(idx + 1) % items.length].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[(idx - 1 + items.length) % items.length].focus();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick(item);
        } else if (e.key === "Escape") {
          setOpen(false);
          trigger.focus();
        } else if (e.key === "Tab") {
          setOpen(false);
        }
      });
    });
    document.addEventListener("click", function (e) {
      if (!dd.contains(e.target) && !menu.hidden) setOpen(false);
    });
  });
})();
