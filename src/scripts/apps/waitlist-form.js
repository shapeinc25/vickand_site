import { reducedMotion } from "../common/motion.js";

(function () {
  "use strict";

  // Waitlist form
  var form = document.getElementById("subscribe-form");
  if (form) {
    var input = document.getElementById("subscribe-email");
    var box = input.closest(".input");
    var message = document.getElementById("subscribe-msg");
    var setError = function (on) {
      box.classList.toggle("is-error", on);
      input.setAttribute("aria-invalid", on ? "true" : "false");
      if (on) message.textContent = "Enter a valid email address";
      message.hidden = !on;
    };
    input.addEventListener("input", function () {
      setError(false);
    });
    form.addEventListener("animationend", function (e) {
      if (e.animationName === "soon-shake") form.classList.remove("is-shake");
    });
    var submit = form.querySelector(".soon-submit");
    var label = submit.querySelector(".soon-btn-label");
    var countEl = document.getElementById("soon-count");
    var reduce = reducedMotion;

    // Mechanical counter: every changed digit is a drum that rolls through the digits in between
    function rollCounter(from, to) {
      var fmt = function (n) {
        return n.toLocaleString("en-US");
      };
      var a = fmt(from),
        b = fmt(to);
      countEl.setAttribute("aria-label", b);
      countEl.textContent = "";
      countEl.classList.add("is-odo");
      var pad = b.length - a.length;
      if (pad > 0) a = new Array(pad + 1).join(" ") + a;
      var step = 0;
      for (var k = b.length - 1; k >= 0; k--) {
        var ch = b.charAt(k),
          old = a.charAt(k);
        var cell = document.createElement("span");
        cell.className = "odo";
        cell.setAttribute("aria-hidden", "true");
        var col = document.createElement("span");
        col.className = "odo-col";
        var seq = [];
        if (/\d/.test(ch) && old !== ch) {
          var d = /\d/.test(old) ? +old : (+ch + 9) % 10,
            e = +ch;
          seq.push(d);
          while (d !== e) {
            d = (d + 1) % 10;
            seq.push(d);
          }
        } else seq.push(ch);
        seq.forEach(function (v) {
          var r = document.createElement("span");
          r.textContent = v;
          col.appendChild(r);
        });
        cell.appendChild(col);
        countEl.insertBefore(cell, countEl.firstChild);
        if (seq.length > 1 && !reduce) {
          var dist = (seq.length - 1) * 72;
          col.animate([{ transform: "translateY(0)" }, { transform: "translateY(-" + dist + "px)" }], {
            duration: 280 + seq.length * 90,
            delay: 1000 + step * 120,
            easing: "cubic-bezier(.3,1.45,.55,1)",
            fill: "both",
          });
          step++;
        } else if (seq.length > 1) col.style.transform = "translateY(-" + (seq.length - 1) * 72 + "px)";
      }
      if (!reduce)
        countEl
          .closest(".soon-counter")
          .animate([{ scale: 1 }, { scale: 1.04 }, { scale: 1 }], { duration: 520, delay: 1000, easing: "ease-out" });
    }

    function confetti(origin) {
      if (reduce) return;
      var colors = ["#ff5c00", "#e9e037", "#2ecf49", "#2f9de1", "#7a47d3"];
      var r = origin.getBoundingClientRect(),
        cx = r.left + r.width / 2,
        cy = r.top + r.height / 2;
      var layer = document.createElement("div");
      layer.style.cssText = "position:fixed;inset:0;overflow:hidden;z-index:1000;pointer-events:none";
      document.body.appendChild(layer);
      var n = 42,
        done = 0;
      for (var q = 0; q < n; q++) {
        var p = document.createElement("span"),
          size = 6 + Math.random() * 6;
        p.style.cssText =
          "position:absolute;left:" +
          cx +
          "px;top:" +
          cy +
          "px;width:" +
          size +
          "px;height:" +
          (Math.random() < 0.5 ? size : size * 0.45) +
          "px;background:" +
          colors[q % colors.length] +
          ";border-radius:" +
          (Math.random() < 0.4 ? "50%" : "2px");
        layer.appendChild(p);
        var ang = (q / n) * Math.PI * 2 + Math.random() * 0.4,
          dist = 90 + Math.random() * 150;
        var x = Math.cos(ang) * dist,
          y = Math.sin(ang) * dist * 0.8;
        var an = p.animate(
          [
            { transform: "translate(-50%,-50%) scale(.3) rotate(0)", opacity: 1 },
            {
              transform: "translate(" + x + "px," + y + "px) scale(1) rotate(" + (Math.random() * 540 - 270) + "deg)",
              opacity: 1,
              offset: 0.3,
            },
            {
              transform:
                "translate(" +
                x * 1.1 +
                "px," +
                (y + 160) +
                "px) scale(.9) rotate(" +
                (Math.random() * 720 - 360) +
                "deg)",
              opacity: 0,
            },
          ],
          {
            duration: 2400 + Math.random() * 1600,
            delay: Math.random() * 120,
            easing: "cubic-bezier(.15,.7,.3,1)",
            fill: "forwards",
          },
        );
        an.onfinish = function () {
          if (++done === n) layer.remove();
        };
      }
    }

    // Back to the default state as soon as the person wants to type again
    var resetTimer;
    function resetForm() {
      clearTimeout(resetTimer);
      if (!form.classList.contains("is-done")) return;
      var w0 = submit.getBoundingClientRect().width;
      form.classList.remove("is-done");
      label.textContent = "Subscribe";
      input.readOnly = false;
      input.tabIndex = 0;
      box.classList.remove("is-success", "is-error");
      message.hidden = true;
      message.textContent = "Enter a valid email address";
      input.setAttribute("aria-invalid", "false");
      if (getComputedStyle(form).flexDirection !== "column") {
        var tk = submit.querySelector(".tick");
        tk.style.transition = "none";
        tk.style.width = "0px";
        tk.style.marginRight = "-8px";
        submit.style.width = "auto";
        var w1 = submit.getBoundingClientRect().width;
        tk.style.width = "";
        tk.style.marginRight = "";
        void tk.offsetWidth;
        tk.style.transition = "";
        submit.style.width = w0 + "px";
        void submit.offsetWidth;
        submit.style.transition = "width .3s ease, background-color .15s ease";
        submit.style.width = w1 + "px";
        setTimeout(function () {
          submit.style.width = "";
          submit.style.transition = "";
        }, 350);
      } else {
        submit.style.width = "";
        submit.style.transition = "";
      }
    }
    input.addEventListener("focus", resetForm);
    input.addEventListener("pointerdown", resetForm);
    input.addEventListener("keydown", function (e) {
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") resetForm();
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (form.classList.contains("is-done")) return;
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      setError(!valid);
      if (!valid) {
        form.classList.remove("is-shake");
        void form.offsetWidth;
        form.classList.add("is-shake");
        return;
      }
      // Success: button turns green, tick draws itself, button pops, confetti flies, the counter rolls
      var w0 = submit.getBoundingClientRect().width;
      submit.style.width = w0 + "px";
      submit.style.boxSizing = "border-box";
      label.textContent = "Subscribed";
      form.classList.add("is-done");
      form.reset();
      input.readOnly = true;
      input.tabIndex = -1;
      message.textContent = "Thank you for subscribing!";
      message.hidden = false;
      box.classList.add("is-success");
      box.classList.remove("is-error");
      var tk = submit.querySelector(".tick");
      tk.style.transition = "none";
      tk.style.width = "20px";
      tk.style.marginRight = "0";
      submit.style.width = "auto";
      var w1 = submit.getBoundingClientRect().width;
      tk.style.width = "";
      tk.style.marginRight = "";
      void tk.offsetWidth;
      tk.style.transition = "";
      submit.style.width = w0 + "px";
      void submit.offsetWidth;
      submit.style.transition = "width .35s cubic-bezier(.3,1.3,.5,1), background-color .15s ease";
      submit.style.width = w1 + "px";
      if (getComputedStyle(form).flexDirection === "column") {
        submit.style.width = "";
        submit.style.transition = "";
      }
      resetTimer = setTimeout(resetForm, 10000); // back to default after 10 seconds
      confetti(submit);
      rollCounter(+countEl.getAttribute("data-count"), +countEl.getAttribute("data-count") + 1);
    });
  }
})();
