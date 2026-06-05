/* ============================================================
   Upitnik za nove studente — custom replika Typeform forme
   ============================================================ */

/* ⬇️⬇️⬇️  OVDE ZALEPI SVOJ MAKE WEBHOOK URL  ⬇️⬇️⬇️
   (Make → Webhooks → Custom webhook → Copy address)            */
const WEBHOOK_URL = "https://hook.eu2.make.com/jo528r7cpkdtfywh3vppfmmxmat7txtf";
/* ⬆️⬆️⬆️  ----------------------------------  ⬆️⬆️⬆️         */

/* Ako je true, na submit ćeš u browser konzoli (F12) videti
   tačan JSON koji se šalje — korisno za testiranje pre Make-a. */
const DEBUG = true;

/* Trajanje animacije prelaza između koraka (ms) — uskladi sa CSS-om */
const TRANSITION_MS = 400;
/* Pauza pre auto-prelaska kad se izabere opcija (ms) */
const AUTONEXT_MS = 350;
/* Da li prikazati "Preskoči" na opcionim pitanjima (klijent još odlučuje) */
const SHOW_SKIP = false;

/* ------------------------------------------------------------
   Pitanja (izvučena 1:1 sa Typeform forme AGLMXbqN)
   ------------------------------------------------------------ */
const QUESTIONS = [
  { ref: "ime",        title: "Tvoje ime",        type: "short_text", required: true,  desc: "npr. Marko, Ana" },
  { ref: "prezime",    title: "Tvoje prezime",    type: "short_text", required: true },
  { ref: "email",      title: "Email adresa",     type: "email",      required: true },
  { ref: "telefon",    title: "Broj telefona",    type: "phone",      required: true },
  { ref: "pol",        title: "Pol",              type: "choice",     required: true,
    choices: ["Muški", "Ženski"] },
  { ref: "datum_rodjenja", title: "Datum rođenja", type: "date",      required: false,
    desc: "Nije obavezno, ali bismo voleli da znamo kada ti je rođendan ☺️" },
  { ref: "instagram",  title: "Instagram username", type: "short_text", required: false },
  { ref: "odakle",     title: "Odakle si?",       type: "short_text", required: false, desc: "npr. Beograd, Niš, Zagreb" },
  { ref: "opis_sebe",  title: "Kako bi ukratko opisao/la sebe?", type: "short_text", required: false,
    desc: "npr: Imam 24 godine i upravo završavam FON i želim da naučim UI UX design, živim od toga i radim freelance/za firmu od kuće" },
  { ref: "gde_cuo",    title: "Gde si prvi put čuo/la za Nauči Dizajn?", type: "short_text", required: false },
  { ref: "razlozi",    title: "Koja su 3 glavna razloga zbog kojih upisuješ kurs?", type: "short_text", required: false },
  { ref: "prepreke",   title: "Koje 3 stvari su te za malo sprečile da upišeš kurs?", type: "short_text", required: false },
  { ref: "brige",      title: "Šta te najviše brine kod učenja nove veštine?", type: "short_text", required: false,
    desc: "npr. da li ću imati dovoljno vremena za učenje, da li ću uspeti da nađem klijente..." },
  { ref: "zbunjuje",   title: "Šta te najviše zbunjuje u vezi našeg sajta/kurseva?", type: "long_text", required: false },
  { ref: "opis_prijatelju", title: "Da nas opisuješ nekom prijatelju, kako bi nas opisao/la?", type: "long_text", required: false,
    desc: "(Napiši baš kao da šalješ njima poruku)" },
  { ref: "feedback",   title: "Imaš još pitanja ili feedback za nas? Imaš ideju za neki proizvod koji nemamo, a koji bi tebe lično oduševio?", type: "short_text", required: false,
    desc: "Slobodno podeli sve to sa nama ☺️" },
];

const WELCOME = {
  title: "Da otključaš svoj kurs samo odgovori na ovih par pitanja 😊",
  desc:  "Odmah nakon završetka ankete na mejl će ti stići pristup kursu",
  button: "Start",
  time:  "Takes X minutes",   // promeni X po želji (npr. "Takes 2 minutes")
};

const THANKYOU = {
  line1: "Hvala ti na popunjavanju ovog upitnika, proveri email jer ti brzo",
  line2: "stiže pristup kursu 🚀",
  desc:  "Srećno sa edukacijom, idemo da napravimo rezultat 🍀",
};

/* Skriveni podaci koji stižu kroz URL (?course=...&package=...&eid=...) */
const HIDDEN_KEYS = ["course", "package", "eid"];

/* Striktna email validacija */
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/* ============================================================
   Stanje + helperi
   ============================================================ */
const answers = {};                 // { ref: value }
const slides = [];                  // svi DOM slide-ovi po redu
const itiInstances = {};            // { ref: intl-tel-input instanca }
let current = 0;
let animating = false;

const app = document.getElementById("app");
const progressFill = document.getElementById("progress-fill");

const CHEVRON_LEFT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
const CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getHidden() {
  // Typeform linkovi koriste # (hash): ...#course=webdesign&package=pro
  // Podržavamo i # i ? (query), hash ima prednost.
  const search = new URLSearchParams(location.search);
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const out = {};
  HIDDEN_KEYS.forEach(k => { out[k] = hash.get(k) || search.get(k) || ""; });
  return out;
}

/* Hi-res zastava (28x20) na telefon inputu — pravim sliku po izabranoj državi */
function upgradeSelectedFlag(slide) {
  const el = slide.querySelector(".iti__selected-country .iti__flag");
  if (!el) return;
  const cls = Array.from(el.classList).find(c => /^iti__[a-z]{2}$/.test(c));
  if (!cls) return;
  el.style.backgroundImage = `url(https://flagcdn.com/w80/${cls.slice(5)}.png)`;
}

/* ============================================================
   Render
   ============================================================ */
function buildSlide(html, opts = {}) {
  const slide = document.createElement("section");
  slide.className = "slide" + (opts.screen ? " slide--screen" : "");
  slide.innerHTML = `<div class="slide__inner">${html}</div>`;
  app.appendChild(slide);
  slides.push(slide);
  return slide;
}

function renderWelcome() {
  const slide = buildSlide(`
    <h1 class="screen-title">${esc(WELCOME.title)}</h1>
    <p class="screen-desc">${esc(WELCOME.desc)}</p>
    <div class="actions actions--center">
      <button class="btn btn--big" data-action="next">${esc(WELCOME.button)}</button>
    </div>
    <p class="screen-time">${CLOCK}<span>${esc(WELCOME.time)}</span></p>
  `, { screen: true });
  slide.querySelector('[data-action="next"]').addEventListener("click", () => goNext());
}

function fieldHTML(q) {
  switch (q.type) {
    case "long_text":
      return `<div class="field"><textarea class="text-area" rows="1" placeholder="Upiši odgovor ovde..."></textarea></div>`;
    case "email":
      return `<div class="field"><input class="text-input" type="email" inputmode="email" placeholder="ime@email.com" /></div>`;
    case "date":
      return `<div class="field date-field">
        <div class="date-part"><label>Month</label><input class="date-mm text-input" inputmode="numeric" maxlength="2" placeholder="MM" /></div>
        <span class="date-sep">/</span>
        <div class="date-part"><label>Day</label><input class="date-dd text-input" inputmode="numeric" maxlength="2" placeholder="DD" /></div>
        <span class="date-sep">/</span>
        <div class="date-part date-part--year"><label>Year</label><input class="date-yyyy text-input" inputmode="numeric" maxlength="4" placeholder="YYYY" /></div>
      </div>`;
    case "phone":
      return `<div class="field"><input class="text-input" type="tel" inputmode="tel" placeholder="060 1234567" /></div>`;
    case "choice":
      return `<div class="choices">${q.choices.map((c, i) => `
        <button class="choice" data-value="${esc(c)}">
          <span class="choice__key">${String.fromCharCode(65 + i)}</span>
          <span>${esc(c)}</span>
        </button>`).join("")}</div>`;
    default: // short_text
      return `<div class="field"><input class="text-input" type="text" placeholder="Upiši odgovor ovde..." /></div>`;
  }
}

function actionsHTML(q, index) {
  const isLast = index === QUESTIONS.length - 1;
  const nextLabel = isLast ? "Potvrdi" : "Dalje";
  const skip = (SHOW_SKIP && !q.required)
    ? `<button class="btn btn--skip" data-action="skip">Preskoči</button>` : "";
  return `
    <div class="error-msg" data-error></div>
    <div class="actions">
      <button class="btn btn--back" data-action="back" aria-label="Nazad">${CHEVRON_LEFT}</button>
      <button class="btn" data-action="next" disabled>${nextLabel}</button>
      ${skip}
    </div>`;
}

function renderQuestion(q, index) {
  const number = index + 1;
  const reqMark = q.required ? `<span class="req">*</span>` : "";
  const desc = q.desc ? `<p class="q-desc">${esc(q.desc)}</p>` : "";

  const slide = buildSlide(`
    <div class="q-head">
      <span class="q-number">${number}</span>
      <h2 class="q-title">${esc(q.title)}${reqMark}</h2>
    </div>
    ${desc}
    ${fieldHTML(q)}
    ${actionsHTML(q, index)}
  `);
  slide.dataset.ref = q.ref;

  slide.querySelector('[data-action="back"]').addEventListener("click", goPrev);
  slide.querySelector('[data-action="next"]').addEventListener("click", () => trySubmitField(q, slide));
  const skipBtn = slide.querySelector('[data-action="skip"]');
  if (skipBtn) skipBtn.addEventListener("click", () => { answers[q.ref] = ""; goNext(true); });

  if (q.type === "choice") {
    slide.querySelectorAll(".choice").forEach(btn => {
      btn.addEventListener("click", () => {
        slide.querySelectorAll(".choice").forEach(b => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        answers[q.ref] = btn.dataset.value;
        refreshNext(q, slide);
        setTimeout(() => goNext(), AUTONEXT_MS);   // auto-next
      });
    });
  } else if (q.type === "date") {
    const mm = slide.querySelector(".date-mm");
    const dd = slide.querySelector(".date-dd");
    const yy = slide.querySelector(".date-yyyy");
    const onlyDigits = el => { el.value = el.value.replace(/\D/g, ""); };
    mm.addEventListener("input", () => { onlyDigits(mm); if (mm.value.length === 2) dd.focus(); refreshNext(q, slide); });
    dd.addEventListener("input", () => { onlyDigits(dd); if (dd.value.length === 2) yy.focus(); refreshNext(q, slide); });
    yy.addEventListener("input", () => { onlyDigits(yy); refreshNext(q, slide); });
  } else {
    const input = slide.querySelector(".text-input, .text-area");

    if (q.type === "long_text") {
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
      });
    }

    if (q.type === "phone" && window.intlTelInput) {
      const iti = window.intlTelInput(input, {
        initialCountry: "rs",
        countrySearch: true,
      });
      itiInstances[q.ref] = iti;
      upgradeSelectedFlag(slide);
      input.addEventListener("countrychange", () => { upgradeSelectedFlag(slide); refreshNext(q, slide); });
      // utils (validacija + getNumber) — učitaj jednom i ručno zakači (v23 caka)
      if (!window.intlTelInput.utils && !window.__itiUtils) {
        window.__itiUtils = import("https://cdn.jsdelivr.net/npm/intl-tel-input@23.8.0/build/js/utils.js")
          .then(m => { window.intlTelInput.utils = m.default; });
      }
      if (window.__itiUtils) window.__itiUtils.then(() => refreshNext(q, slide));
    }

    input.addEventListener("input", () => refreshNext(q, slide));
  }

  return slide;
}

function renderThankYou() {
  buildSlide(`
    <h1 class="screen-title">${esc(THANKYOU.line1)}<br>${esc(THANKYOU.line2)}</h1>
    <p class="screen-desc">${esc(THANKYOU.desc)}</p>
  `, { screen: true });
}

/* ============================================================
   Čitanje + validacija
   ============================================================ */
function readDate(slide) {
  const mm = slide.querySelector(".date-mm").value;
  const dd = slide.querySelector(".date-dd").value;
  const yy = slide.querySelector(".date-yyyy").value;
  if (!mm && !dd && !yy) return "";
  return `${mm}/${dd}/${yy}`;           // MM/DD/YYYY (kao na Typeform-u)
}

function readField(q, slide) {
  if (q.type === "choice") return answers[q.ref] || "";
  if (q.type === "date") return readDate(slide);
  if (q.type === "phone") {
    const iti = itiInstances[q.ref];
    const raw = slide.querySelector(".text-input").value.trim();
    if (!raw) return "";
    return iti && iti.getNumber() ? iti.getNumber() : raw;
  }
  const el = slide.querySelector(".text-input, .text-area");
  return el ? el.value.trim() : "";
}

function isValid(q, slide) {
  if (q.type === "choice") return !!answers[q.ref];

  const value = readField(q, slide);
  if (!value) return !q.required;

  if (q.type === "email") return EMAIL_RE.test(value);
  if (q.type === "phone") {
    const iti = itiInstances[q.ref];
    if (iti && typeof iti.isValidNumber === "function" && iti.getNumber()) {
      const v = iti.isValidNumber();
      if (v !== null && v !== undefined) return v;
    }
    return value.replace(/\D/g, "").length >= 8; // fallback dok utils ne stigne
  }
  if (q.type === "date") {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return false;
    const mo = +m[1], da = +m[2];
    return mo >= 1 && mo <= 12 && da >= 1 && da <= 31;
  }
  return true;
}

function refreshNext(q, slide) {
  const nextBtn = slide.querySelector('[data-action="next"]');
  const ok = isValid(q, slide);
  nextBtn.disabled = !ok;
  if (ok) { const e = slide.querySelector("[data-error]"); if (e) e.textContent = ""; }
}

function trySubmitField(q, slide) {
  if (!isValid(q, slide)) {
    const errEl = slide.querySelector("[data-error]");
    if (errEl) {
      if (q.type === "email") errEl.textContent = "Unesi ispravnu email adresu.";
      else if (q.type === "phone") errEl.textContent = "Unesi ispravan broj telefona.";
      else if (q.type === "date") errEl.textContent = "Format: MM / DD / YYYY";
      else errEl.textContent = "Ovo polje je obavezno.";
    }
    return;
  }
  answers[q.ref] = readField(q, slide);
  goNext();
}

/* ============================================================
   Navigacija
   ============================================================ */
function showSlide(index) {
  slides.forEach((s, i) => {
    s.classList.toggle("is-active", i === index);
    s.classList.toggle("is-past", i < index);
  });
  current = index;
  updateProgress();
  focusActive();
  const ref = slides[index].dataset.ref;
  const q = QUESTIONS.find(x => x.ref === ref);
  if (q) refreshNext(q, slides[index]);
}

function focusActive() {
  const s = slides[current];
  const input = s.querySelector(".text-input, .text-area");
  if (input) setTimeout(() => input.focus(), TRANSITION_MS * 0.4);
}

function updateProgress() {
  const total = QUESTIONS.length;
  const qIndex = Math.min(Math.max(current - 1, 0), total);
  const pct = current === 0 ? 0 : (qIndex / total) * 100;
  progressFill.style.width = Math.min(pct, 100) + "%";
}

function goNext(force) {
  if (animating) return;
  const leaving = slides[current];
  const ref = leaving.dataset.ref;
  const q = QUESTIONS.find(x => x.ref === ref);

  if (q && !force) {
    if (!isValid(q, leaving)) { trySubmitField(q, leaving); return; }
    answers[ref] = readField(q, leaving);
  }

  const thankYouIndex = slides.length - 1;
  if (current === thankYouIndex - 1) submitForm();
  if (current < slides.length - 1) {
    animating = true;
    setTimeout(() => { animating = false; }, TRANSITION_MS);
    showSlide(current + 1);
  }
}

function goPrev() {
  if (animating) return;
  if (current > 0) {
    animating = true;
    setTimeout(() => { animating = false; }, TRANSITION_MS);
    showSlide(current - 1);
  }
}

document.addEventListener("keydown", (e) => {
  const s = slides[current];
  if (!s) return;
  const ref = s.dataset.ref;
  const q = QUESTIONS.find(x => x.ref === ref);

  if (e.key === "Enter") {
    if (!q) { e.preventDefault(); goNext(); return; }
    if (q.type === "long_text" && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const nextBtn = s.querySelector('[data-action="next"]');
    if (nextBtn && !nextBtn.disabled) goNext();
    else trySubmitField(q, s);
  }
});

/* ============================================================
   Slanje na webhook
   ============================================================ */
async function submitForm() {
  const payload = {
    form: "Upitnik za nove studente",
    form_id: "AGLMXbqN",
    submitted_at: new Date().toISOString(),
    hidden: getHidden(),
    answers: QUESTIONS.map(q => ({
      ref: q.ref,
      question: q.title,
      type: q.type,
      answer: answers[q.ref] || "",
    })),
  };

  if (DEBUG) console.log("📤 Payload koji se šalje:", JSON.parse(JSON.stringify(payload)));

  if (!WEBHOOK_URL) {
    console.warn("⚠️ WEBHOOK_URL nije postavljen u form.js — podaci se NE šalju nigde (samo prikaz u konzoli).");
    return;
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (DEBUG) console.log("✅ Poslato na webhook.");
  } catch (err) {
    console.error("❌ Greška pri slanju na webhook:", err);
  }
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  renderWelcome();
  QUESTIONS.forEach((q, i) => renderQuestion(q, i));
  renderThankYou();
  showSlide(0);
}

init();
