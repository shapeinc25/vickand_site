import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const source = (file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const apps = source("src/pages/index.html"),
  ux = source("src/pages/ux/index.html");
const support = source("src/partials/components/support-dialog.html");
function fixture(t, html = apps, url = "https://vickand.test/") {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const w = dom.window;
  w.__t = (value) => value;
  w.__reduced = true;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.vkCancelRaf = () => {};
  w.vkRaf = () => 0;
  w.vkGameRaf = () => 0;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  return { w, d: w.document, run: (file) => w.eval(source(file)) };
}
function clock(w) {
  let now = 0,
    id = 0;
  const tasks = new Map();
  w.setTimeout = (fn, delay = 0) => {
    tasks.set(++id, { fn, at: now + delay });
    return id;
  };
  w.clearTimeout = (i) => tasks.delete(i);
  w.requestAnimationFrame = (fn) => w.setTimeout(() => fn(now), 16);
  w.cancelAnimationFrame = w.clearTimeout;
  return (ms) => {
    const end = now + ms;
    for (let count = 0; count < 10000; count++) {
      const next = [...tasks].filter(([, v]) => v.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;
      tasks.delete(next[0]);
      next[1].fn();
    }
    now = end;
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));
function fillWaitlist(d) {
  const form = d.querySelector("#subscribe-form");
  form.querySelector("[name=email]").value = "qa@example.invalid";
  return form;
}
function submit(w, form) {
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

test("pending form locks its fields and ignores a second submit; accepted delivery restores controls", async (t) => {
  const { w, d, run } = fixture(t);
  const advance = clock(w);
  let complete;
  const calls = [];
  w.fetch = (...args) => {
    calls.push(args);
    return new Promise((resolve) => (complete = resolve));
  };
  run("src/scripts/common/forms.js");
  const form = fillWaitlist(d);
  submit(w, form);
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(calls[0][1].body).launchConsent, true);
  assert.equal(JSON.parse(calls[0][1].body).consentVersion, "launch-submit-2026-11-27");
  assert.equal(form.querySelector("[name=email]").disabled, true);
  assert.equal(form.getAttribute("aria-busy"), "true");
  submit(w, form);
  assert.equal(calls.length, 1);
  complete({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  assert.equal(form.querySelector("[name=email]").disabled, false);
  assert.equal(form.querySelector("[name=email]").value, "");
  assert.equal(form.querySelector(".soon-btn-label").textContent, "Subscribed");
  assert.equal(form.querySelector("#subscribe-msg").textContent, "Thank you for subscribing!");
  assert.equal(form.querySelector("#subscribe-msg").hidden, false);
  assert.equal(form.querySelector("[name=email]").readOnly, true);
  assert.equal(form.classList.contains("is-done"), true);
  assert.equal(form.hasAttribute("aria-busy"), false);
  submit(w, form);
  assert.equal(calls.length, 1);
  advance(9999);
  assert.equal(form.classList.contains("is-done"), true);
  advance(1);
  assert.equal(form.classList.contains("is-done"), false);
  assert.equal(form.querySelector(".soon-btn-label").textContent, "Subscribe");
  assert.equal(form.querySelector("#subscribe-msg").hidden, true);
  assert.equal(form.querySelector("[name=email]").readOnly, false);
  submit(w, fillWaitlist(d));
  complete({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  form.querySelector("[name=email]").focus();
  assert.equal(form.classList.contains("is-done"), false);
  assert.equal(form.querySelector("[name=email]").readOnly, false);
});
test("retryable network failure preserves values and reuses its idempotency key", async (t) => {
  const { w, d, run } = fixture(t);
  const calls = [];
  w.fetch = async (...args) => {
    calls.push(args);
    throw new w.TypeError("offline");
  };
  run("src/scripts/common/forms.js");
  const form = fillWaitlist(d);
  submit(w, form);
  await settle();
  submit(w, form);
  await settle();
  assert.equal(form.querySelector("[name=email]").value, "qa@example.invalid");
  assert.equal(form.querySelector("[name=email]").disabled, false);
  assert.equal(calls[0][1].headers["Idempotency-Key"], calls[1][1].headers["Idempotency-Key"]);
  assert.match(form.querySelector(".form-status").textContent, /could not confirm delivery/);
});
test("missing or incomplete release email shows the reference error and cannot reach the API", (t) => {
  const { w, d, run } = fixture(t);
  w.__reduced = false;
  let calls = 0;
  w.fetch = () => {
    calls++;
  };
  run("src/scripts/common/forms.js");
  const form = fillWaitlist(d);
  const email = form.querySelector("[name=email]");
  for (const invalid of ["", "test", "test@example", "test@.invalid"]) {
    email.value = invalid;
    submit(w, form);
    assert.equal(email.getAttribute("aria-invalid"), "true");
    assert.equal(form.classList.contains("is-shake"), true);
    assert.equal(form.querySelector("#subscribe-msg").hidden, false);
    assert.equal(form.querySelector(".form-status").textContent, "");
  }
  assert.equal(calls, 0);
  email.value = "qa@example.invalid";
  email.dispatchEvent(new w.Event("input", { bubbles: true }));
  assert.equal(email.hasAttribute("aria-invalid"), false);
  assert.equal(form.querySelector("#subscribe-msg").hidden, true);
});
test("choosing a valid custom option clears the previous invalid state", (t) => {
  const { w, d, run } = fixture(t, ux);
  run("src/scripts/common/forms.js");
  const form = d.querySelector("#ux-req-form");
  submit(w, form);
  const select = d.querySelector("#ux-req-help");
  assert.equal(select.getAttribute("aria-invalid"), "true");
  select.click();
  const option = d.querySelector("#ux-req-list [data-v]");
  option.click();
  assert.equal(select.hasAttribute("aria-invalid"), false);
  assert.equal(d.querySelector("#ux-req-help-v").value, option.dataset.v);
});
test("UX request restores the reference error and confirmation states around the real response", async (t) => {
  const { w, d, run } = fixture(t, ux);
  w.__reduced = false;
  let complete;
  let sends = 0;
  w.fetch = () => {
    sends++;
    return new Promise((resolve) => (complete = resolve));
  };
  const form = d.querySelector("#ux-req-form");
  const name = form.elements.namedItem("name");
  const email = form.elements.namedItem("email");
  const message = form.querySelector(".ux-req-ok");
  run("src/scripts/common/forms.js");
  submit(w, form);
  assert.ok(form.classList.contains("is-shake"));
  assert.equal(form.querySelector(".form-status").textContent, "");
  assert.equal(d.activeElement, name);
  assert.equal(sends, 0);
  name.value = "QA";
  email.value = "qa@example.invalid";
  form.querySelector("#ux-req-help").click();
  form.querySelector("#ux-req-list [data-v]").click();
  const project = form.elements.namedItem("message");
  project.value = "   ";
  submit(w, form);
  assert.equal(sends, 0);
  assert.equal(d.activeElement, project);
  assert.equal(project.getAttribute("aria-invalid"), "true");
  assert.equal(d.querySelector("#ux-req-msg-error").hidden, false);
  project.value = "Please review the onboarding.";
  // The product link may be left blank.
  submit(w, form);
  assert.equal(message.hidden, true);
  complete({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  assert.ok(form.classList.contains("is-done"));
  assert.equal(message.hidden, false);
  assert.equal(name.readOnly, true);
  assert.equal(name.value, "");
  submit(w, form);
  assert.equal(sends, 1);
  name.focus();
  assert.equal(name.readOnly, false);
  assert.equal(message.hidden, true);
  assert.equal(form.querySelector(".ux-req-label").textContent, "Request Free Scoping");
});
test("closing and reopening support clears the draft and ignores a response for the old dialog", async (t) => {
  const { w, d, run } = fixture(t, '<button id="open" data-support-dialog>Support</button>' + support);
  w.__reduced = false;
  const advance = clock(w);
  let complete;
  w.fetch = () => new Promise((resolve) => (complete = resolve));
  run("src/scripts/common/forms.js");
  run("src/scripts/common/support-dialog.js");
  const modal = d.querySelector("#sup-modal");
  const form = d.querySelector("#sup-form");
  const open = d.querySelector("#open");
  open.click();
  advance(70);
  form.elements.namedItem("name").value = "Old draft";
  form.elements.namedItem("email").value = "qa@example.invalid";
  form.querySelector("#sup-issue").click();
  form.querySelector("#sup-list [data-v]").click();
  submit(w, form);
  modal.querySelector(".sup-close").click();
  open.click();
  assert.equal(form.elements.namedItem("name").value, "");
  assert.equal(form.elements.namedItem("issue").value, "");
  complete({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  assert.equal(modal.classList.contains("is-sent"), false);
  assert.equal(form.elements.namedItem("email").disabled, false);
});
test("support uses the shared success button before showing its confirmation", async (t) => {
  const { w, d, run } = fixture(t, '<button id="open" data-support-dialog>Support</button>' + support);
  w.__reduced = false;
  const advance = clock(w);
  w.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  run("src/scripts/common/forms.js");
  run("src/scripts/common/support-dialog.js");
  d.querySelector("#open").click();
  advance(70);
  const form = d.querySelector("#sup-form");
  const modal = d.querySelector("#sup-modal");
  form.elements.namedItem("email").value = "qa@example.invalid";
  form.querySelector("#sup-issue").click();
  form.querySelector("#sup-list [data-v]").click();
  submit(w, form);
  assert.equal(form.classList.contains("is-done"), false);
  await settle();
  assert.ok(form.classList.contains("is-done"));
  assert.equal(form.querySelector(".form-submit span").textContent, "Request sent");
  assert.equal(modal.classList.contains("is-sent"), false);
  advance(750);
  assert.ok(modal.classList.contains("is-sent"));
  assert.equal(d.activeElement, modal.querySelector(".sup-ok"));
});
test("the short UX story swipe is exclusive to compact touch screens", (t) => {
  const { w, d, run } = fixture(t, ux);
  const advance = clock(w);
  const story = d.querySelector("#ux-story");
  const stage = story.querySelector(".ux-story-stage");
  const first = story.querySelector(".ux-sp-a .ux-tb");
  const second = story.querySelector(".ux-sp-b .ux-tb");
  let width = 390;
  let touch = false;
  let top = -156;
  w.__reduced = false;
  Object.defineProperty(w, "innerWidth", { get: () => width });
  Object.defineProperty(w, "innerHeight", { value: 780 });
  Object.defineProperty(stage, "clientHeight", { value: 780 });
  Object.defineProperty(story, "offsetParent", { value: d.body });
  story.getBoundingClientRect = () => ({ top });
  w.matchMedia = (query) => ({
    get matches() {
      return width <= 760 && (!query.includes("pointer: coarse") || touch);
    },
    addEventListener() {},
  });
  const update = () => {
    w.dispatchEvent(new w.Event("resize"));
    advance(16);
  };
  run("src/scripts/ux/story.js");
  assert.equal(story.dataset.storyStep, undefined);
  assert.equal(first.style.getPropertyValue("--o"), "1.000");
  assert.equal(second.style.getPropertyValue("--o"), "0.000");
  touch = true;
  update();
  assert.equal(story.dataset.storyStep, "second");
  top = 0;
  update();
  assert.equal(story.dataset.storyStep, "first");
  width = 1280;
  top = -1560;
  update();
  assert.equal(story.dataset.storyStep, undefined);
  assert.ok(Number(second.style.getPropertyValue("--o")) > 0);
});

test("navigation reopens immediately and excludes closed links from keyboard focus", (t) => {
  const { w, d, run } = fixture(t, source("src/partials/layout/header.html") + "<button id=outside>Outside</button>");
  run("src/scripts/common/header-menu.js");
  const button = d.querySelector(".hdr-menu-btn");
  const panel = d.querySelector(".hdr-menu-panel");
  assert.equal(panel.inert, true);
  button.click();
  button.click();
  button.click();
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(panel.inert, false);
  assert.ok(panel.classList.contains("is-open"));
  const links = panel.querySelectorAll("a");
  links[0].focus();
  links[1].focus();
  assert.equal(panel.inert, false);
  links[1].dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(panel.inert, true);
  assert.equal(d.activeElement, button);
  button.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  assert.equal(d.activeElement, links[0]);
  d.querySelector("#outside").focus();
  assert.equal(panel.inert, true);
  assert.equal(panel.classList.contains("is-open"), false);
});
test("closing support before its opening animation cannot steal focus back", (t) => {
  const { w, d, run } = fixture(
    t,
    "<button id=trigger data-support-dialog>Support</button><div class=view>Page</div>" + support,
  );
  w.__reduced = false;
  const advance = clock(w);
  run("src/scripts/common/support-dialog.js");
  const trigger = d.querySelector("#trigger");
  trigger.click();
  d.querySelector(".sup-close").click();
  advance(400);
  assert.equal(d.querySelector("#sup-modal").hidden, true);
  assert.equal(d.activeElement, trigger);
  assert.equal(d.querySelector(".view").inert, false);
  trigger.click();
  advance(70);
  assert.equal(d.activeElement.id, "sup-name");
});
test("comparison keyboard tabs keep selected panel, focus and tab stop together", (t) => {
  const { w, d, run } = fixture(t, ux);
  run("src/scripts/ux/before-after.js");
  const dots = d.querySelectorAll("#ux-cmp-dots button");
  dots[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
  assert.equal(dots[1].getAttribute("aria-selected"), "true");
  assert.equal(dots[1].tabIndex, 0);
  assert.equal(dots[0].tabIndex, -1);
  assert.equal(d.activeElement, dots[1]);
  assert.equal(d.querySelectorAll(".ux-cmp-slide")[1].getAttribute("aria-hidden"), "false");
});
function gameFixture(t) {
  const f = fixture(t);
  f.w.__reduced = false;
  const advance = clock(f.w);
  f.w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {} });
  for (const selector of [".soon-grid", ".soon-balls"]) {
    const e = f.d.querySelector(selector);
    Object.defineProperties(e, { clientWidth: { value: 300 }, clientHeight: { value: 240 } });
  }
  f.run("src/scripts/apps/counter-card/index.js");
  return { ...f, advance };
}
test("rapid close/reopen through all three games cannot erase the next memory board", (t) => {
  const { d, advance } = gameFixture(t),
    front = d.querySelector(".soon-front"),
    close = d.querySelector(".soon-close");
  for (let i = 0; i < 3; i++) {
    front.click();
    close.click();
  }
  front.click();
  const count = d.querySelectorAll(".soon-cell").length;
  assert.ok(count > 0);
  advance(850);
  assert.equal(d.querySelectorAll(".soon-cell").length, count);
  assert.equal(d.querySelector(".soon-back").inert, false);
  assert.equal(front.inert, true);
});
test("memory game supports roving arrow-key focus and Escape returns to the front", (t) => {
  const { w, d } = gameFixture(t);
  const front = d.querySelector(".soon-front");
  front.click();
  const cells = d.querySelectorAll(".soon-cell");
  cells[0].focus();
  cells[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
  assert.equal(d.activeElement, cells[1]);
  assert.equal(cells[1].tabIndex, 0);
  assert.equal(cells[0].tabIndex, -1);
  cells[1].dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(d.querySelector(".soon-back").inert, true);
  assert.equal(d.activeElement, front);
});
test("source hero shuffle keeps all four products and seamless duplicate cards", (t) => {
  const { w, d, run } = fixture(t);
  w.__lang = "en";
  w.__SHOTS = JSON.parse(source("src/data/screenshots.json"));
  w.__DD = ["day1", "day2", "day3"];
  w.__SM = ["shape1", "shape2", "shape3"];
  w.__setScreen = (element, value) => (element.dataset.selected = value);
  for (let n = 0; n < 100; n++) {
    run("src/scripts/apps/hero-images.js");
    const cards = [...d.querySelectorAll(".hero-track > a")];
    const ids = cards.slice(0, 6).map((card) => card.getAttribute("href"));
    assert.equal(new Set(ids).size, 4);
    for (let i = 0; i < 6; i++) {
      assert.equal(new Set([ids[i], ids[(i + 1) % 6], ids[(i + 2) % 6]]).size, 3);
      assert.equal(cards[i].getAttribute("href"), cards[i + 6].getAttribute("href"));
      assert.equal(
        cards[i].querySelector(".mock-bg").dataset.selected,
        cards[i + 6].querySelector(".mock-bg").dataset.selected,
      );
    }
  }
});
test("initial motion follows the device even when an old site preference is saved", (t) => {
  const script = source("src/partials/layout/head.html").match(/<script>([\s\S]*?)<\/script>/)[1];
  const { w, d } = fixture(t);
  w.localStorage.setItem("vickand-motion", "paused");
  w.eval(script);
  assert.equal(d.documentElement.dataset.motion, undefined);
  w.matchMedia = (query) => ({ matches: query === "(prefers-reduced-motion: reduce)" });
  w.eval(script);
  assert.equal(d.documentElement.dataset.motion, "paused");
});

test("support locks document pages and restores existing background inert states", (t) => {
  const { d, run } = fixture(
    t,
    '<button id="trigger" data-support-dialog>Support</button><main>Document</main><footer class="site-footer">Footer</footer>' +
      support,
  );
  const main = d.querySelector("main"),
    footer = d.querySelector("footer");
  footer.inert = true;
  run("src/scripts/common/support-dialog.js");
  d.querySelector("#trigger").click();
  assert.equal(main.inert, true);
  assert.equal(footer.inert, true);
  d.querySelector(".sup-close").click();
  assert.equal(main.inert, false);
  assert.equal(footer.inert, true);
});
