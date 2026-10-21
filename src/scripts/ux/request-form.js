(function () {
  "use strict";
  var f = document.getElementById("ux-req-form");
  if (!f) return;
  // every "Request Free Scoping" link scrolls to the request form
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.btn");
    if (!a || !/^\s*Request Free Scoping/.test(a.textContent)) return;
    var sec = document.getElementById("ux-req");
    if (!sec) return;
    e.preventDefault();
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  var label = f.querySelector(".ux-req-label"),
    okMsg = document.getElementById("ux-req-ok");
  function resetSelect() {
    var vb = document.getElementById("ux-req-help");
    if (!vb) return;
    document.getElementById("ux-req-help-v").value = "";
    vb.firstChild.textContent = "-Select option-";
    vb.classList.add("is-empty");
    [].forEach.call(document.querySelectorAll("#ux-req-list li"), function (o) {
      o.setAttribute("aria-selected", "false");
    });
  }
  // back to the normal state as soon as the person wants to write again
  function again() {
    if (!f.classList.contains("is-done")) return;
    f.classList.remove("is-done");
    label.textContent = "Request Free Scoping";
    okMsg.hidden = true;
    f.querySelectorAll("input.input-control,textarea").forEach(function (c) {
      c.readOnly = false;
    });
  }
  f.addEventListener("focusin", again);
  f.addEventListener("pointerdown", function (e) {
    if (!e.target.closest(".btn")) again();
  });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    f.querySelectorAll("[required]").forEach(function (c) {
      var bad = !c.value.trim() || (c.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.value));
      var w = c.closest(".input");
      w.classList.toggle("is-error", bad);
      var m = w.querySelector(".input-message");
      if (m) m.hidden = !bad;
      if (bad) ok = false;
    });
    if (!ok) {
      f.classList.remove("is-shake");
      void f.offsetWidth;
      f.classList.add("is-shake");
      var b = f.querySelector(".is-error .input-control");
      if (b) b.focus();
      return;
    }
    if (f.classList.contains("is-done")) return;
    // success: the button turns green and draws a tick, the fields empty and lock, a green message appears
    f.classList.remove("is-shake");
    f.reset();
    resetSelect();
    f.querySelectorAll("input.input-control,textarea").forEach(function (c) {
      c.readOnly = true;
    });
    label.textContent = "Request sent";
    f.classList.add("is-done");
    okMsg.hidden = false;
  });
  var btn = document.getElementById("ux-req-help"),
    list = document.getElementById("ux-req-list"),
    val = document.getElementById("ux-req-help-v");
  if (btn && list && val) {
    var fld = btn.closest(".input-field"),
      items = [].slice.call(list.children),
      hl = -1;
    function mark(i) {
      items.forEach(function (o, k) {
        o.classList.toggle("is-hl", k === i);
      });
      hl = i;
      if (i > -1) {
        btn.setAttribute("aria-activedescendant", items[i].id);
        items[i].scrollIntoView({ block: "nearest" });
      }
    }
    function open() {
      list.hidden = false;
      fld.classList.add("is-open");
      fld.closest(".ux-req-f").classList.add("is-up");
      btn.setAttribute("aria-expanded", "true");
      var cur = items.findIndex(function (o) {
        return o.getAttribute("aria-selected") === "true";
      });
      mark(cur > -1 ? cur : 0);
    }
    function shut() {
      list.hidden = true;
      fld.classList.remove("is-open");
      fld.closest(".ux-req-f").classList.remove("is-up");
      btn.setAttribute("aria-expanded", "false");
      btn.removeAttribute("aria-activedescendant");
    }
    function pick(i) {
      items.forEach(function (o, k) {
        o.setAttribute("aria-selected", k === i ? "true" : "false");
      });
      val.value = items[i].dataset.v;
      btn.firstChild.textContent = items[i].dataset.v;
      btn.classList.remove("is-empty");
      btn.closest(".input").classList.remove("is-error");
      var em = btn.closest(".input").querySelector(".input-message");
      if (em) em.hidden = true;
      shut();
      btn.focus();
    }
    btn.addEventListener("click", function () {
      list.hidden ? open() : shut();
    });
    btn.addEventListener("keydown", function (e) {
      var k = e.key;
      if (list.hidden) {
        if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
          e.preventDefault();
          open();
        }
        return;
      }
      if (k === "ArrowDown") {
        e.preventDefault();
        mark(Math.min(items.length - 1, hl + 1));
      } else if (k === "ArrowUp") {
        e.preventDefault();
        mark(Math.max(0, hl - 1));
      } else if (k === "Home") {
        e.preventDefault();
        mark(0);
      } else if (k === "End") {
        e.preventDefault();
        mark(items.length - 1);
      } else if (k === "Enter" || k === " ") {
        e.preventDefault();
        if (hl > -1) pick(hl);
      } else if (k === "Escape") {
        e.preventDefault();
        shut();
      } else if (k === "Tab") shut();
    });
    items.forEach(function (o, i) {
      o.addEventListener("mousemove", function () {
        if (hl !== i) mark(i);
      });
      o.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      o.addEventListener("click", function () {
        pick(i);
      });
    });
    document.addEventListener("pointerdown", function (e) {
      if (!list.hidden && !fld.contains(e.target)) shut();
    });
  }
  f.addEventListener("input", function (e) {
    var w = e.target.closest(".input");
    if (w) {
      w.classList.remove("is-error");
      var m = w.querySelector(".input-message");
      if (m) m.hidden = true;
    }
  });
})();
