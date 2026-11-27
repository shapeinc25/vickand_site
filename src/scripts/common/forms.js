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
    if (form.dataset.sent === "true") {
      form.dataset.sent = "false";
      form.classList.remove("is-done");
      if (label) label.textContent = original;
      setStatus("");
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    let firstInvalid;
    form.querySelectorAll("[required]").forEach((field) => {
      const valid =
        field.type === "checkbox"
          ? field.checked
          : field.type === "email"
            ? field.validity.valid && field.value.trim()
            : Boolean(field.value.trim());
      if (!valid) {
        const target = fieldError(field);
        firstInvalid ||= target;
      }
    });
    if (firstInvalid) {
      setStatus(
        t(
          kind === "waitlist"
            ? "Enter your email and choose whether to request release news."
            : "Complete the highlighted fields.",
        ),
        true,
      );
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
        launchConsent: data.launchConsent === "on",
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
    if (label) label.textContent = t("Sending…");
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
      form.dataset.sent = "true";
      form.classList.add("is-done");
      if (label) label.textContent = t("Request sent");
      if (kind === "support") {
        const modal = form.closest(".sup-modal");
        modal?.classList.add("is-sent");
        modal?.querySelector(".sup-ok")?.focus({ preventScroll: true });
      }
      setStatus(
        t(
          kind === "waitlist"
            ? "Your request reached us. You can withdraw it at any time."
            : "Your request reached us. We’ll reply by email.",
        ),
      );
      form.reset();
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
  });
}
configureForm(document.getElementById("subscribe-form"), "waitlist");
configureForm(document.getElementById("ux-req-form"), "contact");
configureForm(document.getElementById("sup-form"), "support");
