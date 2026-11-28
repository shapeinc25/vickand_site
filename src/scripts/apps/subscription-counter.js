const count = document.querySelector('#soon-count[data-count-source="demo"]');
const card = count?.closest(".soon-counter");

function rollCount() {
  const initial = Number(count.dataset.count);
  const format = new Intl.NumberFormat("en-US");
  const before = format.format(initial);
  const after = format.format(initial + 1);
  const bounds = card.getBoundingClientRect();

  if (
    window.__reduced ||
    document.hidden ||
    typeof card.animate !== "function" ||
    bounds.bottom <= 0 ||
    bounds.top >= window.innerHeight ||
    card.classList.contains("is-flipped")
  ) {
    count.textContent = after;
    return;
  }

  const content = document.createDocumentFragment();
  const animations = [];
  const digits = before.padStart(after.length).split("");
  const finalDigits = [...after];
  const columns = [];
  // Match the reference's right-to-left stagger while preserving the visual digit order.
  for (let i = finalDigits.length - 1; i >= 0; i--) {
    const finalDigit = finalDigits[i];
    const previousDigit = digits[i];
    const cell = document.createElement("span");
    cell.className = "odo";
    cell.setAttribute("aria-hidden", "true");
    const column = document.createElement("span");
    column.className = "odo-col";
    cell.append(column);
    content.prepend(cell);

    const sequence = [finalDigit];
    if (/\d/.test(finalDigit) && previousDigit !== finalDigit) {
      const first = /\d/.test(previousDigit) ? Number(previousDigit) : (Number(finalDigit) + 9) % 10;
      const steps = (Number(finalDigit) - first + 10) % 10;
      for (let j = steps - 1; j >= 0; j--) sequence.unshift((first + j) % 10);
      columns.push({ column, steps });
    }
    for (const digit of sequence) {
      const glyph = document.createElement("span");
      glyph.textContent = digit;
      column.append(glyph);
    }
  }
  count.classList.add("is-odo");
  count.replaceChildren(content);

  const digitHeight = count.querySelector(".odo").offsetHeight;
  columns.forEach(({ column, steps }, index) => {
    animations.push(
      column.animate([{ transform: "translateY(0)" }, { transform: `translateY(-${steps * digitHeight}px)` }], {
        duration: 280 + (steps + 1) * 90,
        delay: 1000 + index * 120,
        easing: "cubic-bezier(.3,1.45,.55,1)",
        fill: "both",
      }).finished,
    );
  });
  animations.push(
    card.animate([{ scale: 1 }, { scale: 1.04 }, { scale: 1 }], {
      duration: 520,
      delay: 1000,
      easing: "ease-out",
    }).finished,
  );

  Promise.allSettled(animations).then(() => {
    count.textContent = after;
    count.classList.remove("is-odo");
  });
}

if (card) document.addEventListener("vickand:subscribed", rollCount, { once: true });
