const t = (value) => window.__t(value);

function wireSelect(prefix) {
  const button = document.getElementById(prefix),
    list = document.getElementById(prefix === "sup-issue" ? "sup-list" : "ux-req-list"),
    value = document.getElementById(`${prefix}-v`);
  if (!button || !list || !value) return;
  const field = button.closest(".input-field"),
    options = [...list.children];
  let highlighted = -1;
  const mark = (index) => {
    highlighted = index;
    options.forEach((option, i) => option.classList.toggle("is-hl", i === index));
    if (options[index]) {
      button.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    }
  };
  const close = () => {
    list.hidden = true;
    field.classList.remove("is-open");
    field.closest(".ux-req-f")?.classList.remove("is-up");
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-activedescendant");
  };
  const open = () => {
    list.hidden = false;
    field.classList.add("is-open");
    field.closest(".ux-req-f")?.classList.add("is-up");
    button.setAttribute("aria-expanded", "true");
    mark(
      Math.max(
        0,
        options.findIndex((option) => option.dataset.v === value.value),
      ),
    );
  };
  const choose = (index) => {
    const option = options[index];
    if (!option || button.disabled) return;
    value.value = option.dataset.v;
    const label = button.querySelector("span");
    if (label) label.textContent = option.textContent;
    else button.firstChild.textContent = option.textContent;
    button.classList.remove("is-empty");
    button.removeAttribute("aria-invalid");
    options.forEach((item, i) => item.setAttribute("aria-selected", String(i === index)));
    close();
    button.focus();
    const wrapper = button.closest(".input");
    wrapper?.classList.remove("is-error");
    wrapper?.querySelector(".input-message")?.setAttribute("hidden", "");
  };
  button.addEventListener("click", () => (list.hidden ? open() : close()));
  button.addEventListener("keydown", (event) => {
    if (list.hidden && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
      return;
    }
    if (list.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") close();
    else if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Enter" || event.key === " ") choose(highlighted);
      else
        mark(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? options.length - 1
              : Math.max(0, Math.min(options.length - 1, highlighted + (event.key === "ArrowDown" ? 1 : -1))),
        );
    }
  });
  options.forEach((option, index) => {
    option.addEventListener("pointerdown", (event) => event.preventDefault());
    option.addEventListener("click", () => choose(index));
    option.addEventListener("pointermove", () => mark(index));
  });
  document.addEventListener("pointerdown", (event) => {
    if (!field.contains(event.target)) close();
  });
  button.form?.addEventListener("vickand:sending", close);
  button.form?.addEventListener("reset", () => {
    value.value = "";
    const label = button.querySelector("span");
    if (label) label.textContent = t("-Select option-");
    button.classList.add("is-empty");
    options.forEach((item) => item.setAttribute("aria-selected", "false"));
    close();
  });
}
wireSelect("ux-req-help");
wireSelect("sup-issue");

function celebrateSubscription(button) {
  if (window.__reduced || typeof button.animate !== "function") return;
  const colors = ["#ff5c00", "#e9e037", "#2ecf49", "#2f9de1", "#7a47d3"];
  const bounds = button.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "subscribe-confetti";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);

  const particleCount = 42;
  const animations = [];
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("span");
    const size = 6 + Math.random() * 6;
    Object.assign(particle.style, {
      left: `${bounds.left + bounds.width / 2}px`,
      top: `${bounds.top + bounds.height / 2}px`,
      width: `${size}px`,
      height: `${Math.random() < 0.5 ? size : size * 0.45}px`,
      backgroundColor: colors[i % colors.length],
      borderRadius: Math.random() < 0.4 ? "50%" : "2px",
    });
    layer.append(particle);
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 90 + Math.random() * 150;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.8;
    animations.push(
      particle.animate(
        [
          { transform: "translate(-50%,-50%) scale(.3) rotate(0)", opacity: 1 },
          {
            transform: `translate(${x}px,${y}px) scale(1) rotate(${Math.random() * 540 - 270}deg)`,
            opacity: 1,
            offset: 0.3,
          },
          {
            transform: `translate(${x * 1.1}px,${y + 160}px) scale(.9) rotate(${Math.random() * 720 - 360}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 2400 + Math.random() * 1600,
          delay: Math.random() * 120,
          easing: "cubic-bezier(.15,.7,.3,1)",
          fill: "forwards",
        },
      ).finished,
    );
  }
  Promise.allSettled(animations).then(() => layer.remove());
}

function configureForm(form, kind) {
  if (!form) return;
  let previous = "",
    requestId = "",
    sending = false;
  const submit = form.querySelector('button[type="submit"]'),
    label = submit?.querySelector(".soon-btn-label,.ux-req-label,span") || submit;
  const original = label?.textContent;
  let status = form.querySelector(".form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.appendChild(status);
  }
  status.classList.add("form-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.hidden = false;
    status.dataset.error = String(error);
  };
  const waitlistEmail = kind === "waitlist" ? form.querySelector('input[type="email"]') : null;
  const waitlistBox = waitlistEmail?.closest(".input");
  const waitlistMessage = waitlistBox?.querySelector(".input-message");
  let resetTimer;
  let buttonWidthAnimation;
  const setWaitlistDone = (done) => {
    const tick = submit.querySelector(".tick");
    const animateWidth =
      !window.__reduced && typeof submit.animate === "function" && getComputedStyle(form).flexDirection !== "column";
    const previousWidth = animateWidth ? submit.getBoundingClientRect().width : 0;
    buttonWidthAnimation?.cancel();
    label.textContent = done ? t("Subscribed") : original;
    if (animateWidth) {
      // Measure the destination at its final icon width, then let the authored tick transition play.
      tick.style.width = done ? "20px" : "0px";
      tick.style.marginRight = done ? "0px" : "";
      tick.style.transition = "none";
      const targetWidth = submit.getBoundingClientRect().width;
      tick.style.width = "";
      tick.style.marginRight = "";
      void tick.offsetWidth;
      tick.style.transition = "";
      if (previousWidth !== targetWidth) {
        buttonWidthAnimation = submit.animate([{ width: `${previousWidth}px` }, { width: `${targetWidth}px` }], {
          duration: done ? 350 : 300,
          easing: done ? "cubic-bezier(.3,1.3,.5,1)" : "ease",
        });
      }
    }
    form.classList.toggle("is-done", done);
    waitlistEmail.readOnly = done;
    waitlistBox.classList.toggle("is-success", done);
    waitlistMessage.textContent = t(done ? "Thank you for subscribing!" : "Enter a valid email address");
    waitlistMessage.hidden = !done;
    if (done) submit.setAttribute("aria-disabled", "true");
    else submit.removeAttribute("aria-disabled");
  };
  const resetWaitlist = () => {
    if (!form.classList.contains("is-done")) return;
    clearTimeout(resetTimer);
    setWaitlistDone(false);
    form.dataset.sent = "false";
  };
  if (waitlistEmail) {
    waitlistEmail.addEventListener("focus", resetWaitlist);
    waitlistEmail.addEventListener("pointerdown", resetWaitlist);
    form.addEventListener("animationend", (event) => {
      if (event.animationName === "soon-shake") form.classList.remove("is-shake");
    });
  }
  const fieldError = (field) => {
    const target = field.type === "hidden" ? document.getElementById(field.id.replace(/-v$/, "")) : field;
    const wrapper = target?.closest(".input");
    wrapper?.classList.add("is-error");
    target?.setAttribute("aria-invalid", "true");
    const message = wrapper?.querySelector(".input-message");
    if (message) message.hidden = false;
    return target;
  };
  form.addEventListener("input", (event) => {
    const field = event.target;
    field.removeAttribute("aria-invalid");
    const wrapper = field.closest(".input");
    wrapper?.classList.remove("is-error");
    wrapper?.querySelector(".input-message")?.setAttribute("hidden", "");
    if (waitlistEmail) resetWaitlist();
    if (form.dataset.sent === "true") {
      form.dataset.sent = "false";
      form.classList.remove("is-done");
      if (label) label.textContent = original;
      setStatus("");
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || (waitlistEmail && form.classList.contains("is-done"))) return;
    let firstInvalid;
    form.querySelectorAll("[required]").forEach((field) => {
      const valid =
        field.type === "checkbox"
          ? field.checked
          : field.type === "email"
            ? field.validity.valid && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(field.value.trim())
            : Boolean(field.value.trim());
      if (!valid) {
        const target = fieldError(field);
        firstInvalid ||= target;
      }
    });
    if (firstInvalid) {
      if (waitlistEmail) {
        setStatus("");
        form.classList.remove("is-shake");
        void form.offsetWidth;
        form.classList.add("is-shake");
      } else setStatus(t("Complete the highlighted fields."), true);
      firstInvalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      kind,
      email: data.email || form.querySelector('[type="email"]')?.value,
      website: data.website || "",
      locale: document.documentElement.lang,
    };
    if (kind === "contact")
      Object.assign(payload, { name: data.name, help: data.help, link: data.link || "", message: data.message || "" });
    if (kind === "support") Object.assign(payload, { name: data.name, issue: data.issue, details: data.details });
    if (kind === "waitlist")
      Object.assign(payload, {
        launchConsent: true,
        consentVersion: form.dataset.consentVersion,
      });
    const body = JSON.stringify(payload);
    if (body !== previous) {
      previous = body;
      requestId = crypto.randomUUID();
    }
    sending = true;
    const controls = [...form.elements].map((control) => ({ control, disabled: control.disabled }));
    controls.forEach(({ control }) => {
      control.disabled = true;
    });
    form.dispatchEvent(new Event("vickand:sending"));
    form.setAttribute("aria-busy", "true");
    if (label && !waitlistEmail) label.textContent = t("Sending…");
    setStatus("");
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestId },
        body,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true)
        throw new Error(
          response.status === 400
            ? t("Please check your details and try again.")
            : t("Your message was not sent. Please try again or email support@vickand.com."),
        );
      previous = "";
      requestId = "";
      form.reset();
      form.dataset.sent = "true";
      if (waitlistEmail) {
        setWaitlistDone(true);
        resetTimer = setTimeout(resetWaitlist, 10000);
      } else {
        form.classList.add("is-done");
        if (label) label.textContent = t("Request sent");
        if (kind === "support") {
          const modal = form.closest(".sup-modal");
          modal?.classList.add("is-sent");
          modal?.querySelector(".sup-ok")?.focus({ preventScroll: true });
        }
        setStatus(t("Your request reached us. We’ll reply by email."));
      }
    } catch (error) {
      if (label) label.textContent = original;
      setStatus(
        error.name === "AbortError" || error instanceof TypeError
          ? t("We could not confirm delivery. Try again; your details are still here.")
          : error.message,
        true,
      );
    } finally {
      clearTimeout(timeout);
      sending = false;
      controls.forEach(({ control, disabled }) => {
        control.disabled = disabled;
      });
      form.removeAttribute("aria-busy");
    }
    if (waitlistEmail && form.classList.contains("is-done")) celebrateSubscription(submit);
  });
}
configureForm(document.getElementById("subscribe-form"), "waitlist");
configureForm(document.getElementById("ux-req-form"), "contact");
configureForm(document.getElementById("sup-form"), "support");
