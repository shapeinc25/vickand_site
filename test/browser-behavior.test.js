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
  form.querySelector("[name=launchConsent]").checked = true;
  return form;
}
function submit(w, form) {
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

test("pending form locks its fields and ignores a second submit; accepted delivery restores controls", async (t) => {
  const { w, d, run } = fixture(t);
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
  assert.equal(form.querySelector("[name=email]").disabled, true);
  assert.equal(form.getAttribute("aria-busy"), "true");
  submit(w, form);
  assert.equal(calls.length, 1);
  complete({ ok: true, json: async () => ({ ok: true }) });
  await settle();
  assert.equal(form.querySelector("[name=email]").disabled, false);
  assert.equal(form.querySelector("[name=email]").value, "");
  assert.match(form.querySelector(".form-status").textContent, /request reached us/);
  assert.equal(form.querySelector(".form-status").parentElement, form);
  assert.equal(form.querySelector(".form-status").dataset.error, "false");
  assert.equal(form.hasAttribute("aria-busy"), false);
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
test("missing release consent cannot reach the API", (t) => {
  const { w, d, run } = fixture(t);
  let calls = 0;
  w.fetch = () => {
    calls++;
  };
  run("src/scripts/common/forms.js");
  const form = fillWaitlist(d);
  form.querySelector("[name=launchConsent]").checked = false;
  submit(w, form);
  assert.equal(calls, 0);
  assert.match(form.querySelector(".form-status").textContent, /choose whether/);
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
test("navigation can reopen during its closing transition and Tab can traverse links", (t) => {
  const { w, d, run } = fixture(t, source("src/partials/layout/header.html") + "<button id=outside>Outside</button>");
  w.__reduced = false;
  const advance = clock(w);
  run("src/scripts/common/header-menu.js");
  const button = d.querySelector(".hdr-menu-btn"),
    panel = d.querySelector(".hdr-menu-panel");
  button.click();
  advance(16);
  button.click();
  button.click();
  advance(300);
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(panel.hidden, false);
  assert.equal(panel.classList.contains("is-open"), true);
  const links = panel.querySelectorAll("a");
  links[0].focus();
  links[0].dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
  links[1].focus();
  advance(250);
  assert.equal(panel.hidden, false);
  d.querySelector("#outside").focus();
  advance(250);
  assert.equal(panel.hidden, true);
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
  advance(40);
  assert.equal(d.activeElement.id, "sup-name");
});
test("comparison keyboard tabs keep selected panel, note, focus and tab stop together", (t) => {
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
test("initial motion preference works without storage and ignores invalid query overrides", (t) => {
  const script = source("src/partials/layout/head.html").match(/<script>([\s\S]*?)<\/script>/)[1];
  const blocked = fixture(t, "", "https://vickand.test/?motion=paused");
  Object.defineProperty(blocked.w, "localStorage", {
    get() {
      throw new Error("blocked");
    },
  });
  blocked.w.eval(script);
  assert.equal(blocked.d.documentElement.dataset.motion, "paused");
  const saved = fixture(t, "", "https://vickand.test/?motion=unknown");
  saved.w.localStorage.setItem("vickand-motion", "paused");
  saved.w.eval(script);
  assert.equal(saved.d.documentElement.dataset.motion, "paused");
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
