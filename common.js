// Shared helpers + data access for the Chirectory pages.
// Loaded after data.js. All data is rendered with textContent (never innerHTML),
// so member-supplied text can never inject markup.

var DATA = { members: [], stats: [] };
var MEMBERS = DATA.members;
var STATS = DATA.stats;

// Called by auth-guard.js once Firestore hands back the roster (replaces the old
// synchronous data.js <script> load — data now only arrives after an approved sign-in).
function setChirectoryData(data) {
  DATA = data || { members: [], stats: [] };
  MEMBERS = DATA.members || [];
  STATS = DATA.stats || [];
  window.CHIRECTORY = DATA;
}

// Fields shown in an expanded member panel / on the member page.
var DETAIL_FIELDS = [
  ["rushClass", "Rush Class"],
  ["room", "Room"],
  ["major", "Major"],
  ["hometown", "Hometown"],
  ["birthday", "Birthday"],
  ["phone", "Phone"],
  ["officer", "Officer Position"],
  ["status", "Makeout Status"],
  ["partner", "Makeout Partner"],
];

// Fields the search box looks through — every field shown on a card, so "any word" works.
var SEARCH_FIELDS = ["name", "rushClass", "room", "major", "hometown", "birthday", "phone", "officer", "status", "partner"];

// Safe element builder. `text` sets textContent; any other key -> attribute.
function el(tag, props, kids) {
  props = props || {};
  var n = document.createElement(tag);
  Object.keys(props).forEach(function (k) {
    if (k === "class") n.className = props[k];
    else if (k === "text") n.textContent = props[k];
    else n.setAttribute(k, props[k]);
  });
  (Array.isArray(kids) ? kids : (kids ? [kids] : [])).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
}

// Append `text` to `parent`, wrapping case-insensitive matches of `q` in <mark>
// (the Ctrl+F-style highlight). Uses textContent only — safe against injection.
function appendHighlighted(parent, text, q) {
  text = text == null ? "" : String(text);
  if (!q) { parent.appendChild(document.createTextNode(text)); return; }
  var lower = text.toLowerCase(), ql = q.toLowerCase(), i = 0, idx;
  while ((idx = lower.indexOf(ql, i)) !== -1) {
    if (idx > i) parent.appendChild(document.createTextNode(text.slice(i, idx)));
    var mark = document.createElement("mark");
    mark.textContent = text.slice(idx, idx + q.length);
    parent.appendChild(mark);
    i = idx + q.length;
  }
  if (i < text.length) parent.appendChild(document.createTextNode(text.slice(i)));
}

// Build the <dl> of a member's details. `q` (optional) highlights matches;
// `skipKeys` (optional array) omits fields already shown elsewhere on the page.
function buildDetailDL(m, q, skipKeys) {
  skipKeys = skipKeys || [];
  var dl = el("dl", { class: "info" });
  DETAIL_FIELDS.forEach(function (pair) {
    var key = pair[0], label = pair[1];
    if (skipKeys.indexOf(key) !== -1) return;
    var val = (m[key] || "").trim();
    if (!val) return;
    dl.appendChild(el("dt", { text: label }));
    if (key === "phone") {
      var tel = val.replace(/[^0-9+]/g, "");
      var a = el("a", { href: "tel:" + tel });
      appendHighlighted(a, val, q);
      dl.appendChild(el("dd", {}, a));
    } else {
      var dd = el("dd", {});
      appendHighlighted(dd, val, q);
      dl.appendChild(dd);
    }
  });
  return dl;
}

// Does any searchable field contain q? (q already lower-cased; "" = match all)
function memberMatches(m, q) {
  if (!q) return true;
  if (SEARCH_FIELDS.some(function (k) { return (m[k] || "").toLowerCase().indexOf(q) !== -1; })) return true;
  // Also match a phone by raw digits, so "8703079233" works even though it's stored "(870) 307-9233".
  var qDigits = q.replace(/\D/g, "");
  return qDigits !== "" && (m.phone || "").replace(/\D/g, "").indexOf(qDigits) !== -1;
}

// Does a match occur in a *detail* field (not the always-visible name)?
function detailMatches(m, q) {
  if (!q) return false;
  return DETAIL_FIELDS.some(function (pair) { return (m[pair[0]] || "").toLowerCase().indexOf(q) !== -1; });
}

// ---- theme (bright beige / dark navy) ----
var THEME_KEY = "chirectory-theme";

function currentTheme() {
  var t = document.documentElement.getAttribute("data-theme");
  if (t === "bright" || t === "dark") return t;
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "bright";
}

function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* private mode / file:// */ }
}

// Top-right cluster on every page: Directory + Club Chart links + the Bright/Dark toggle.
function initTopNav() {
  var nav = el("div", { class: "topnav" });
  var onChart = location.pathname.indexOf("club-chart") !== -1;

  function navLink(href, ico, lbl, active) {
    var props = { class: "topnav-btn" + (active ? " active" : ""), href: href, "aria-label": lbl };
    if (active) props["aria-current"] = "page";
    return el("a", props, [
      el("span", { class: "tn-ico", "aria-hidden": "true", text: ico }),
      el("span", { class: "tn-lbl", text: lbl }),
    ]);
  }

  // Both destinations are always available; the current page is marked active.
  nav.appendChild(navLink("index.html", "📖", "Directory", !onChart));
  nav.appendChild(navLink("club-chart.html", "📊", "Club Chart", onChart));

  // theme toggle (icon + label so the label can hide on tiny screens)
  var themeBtn = el("button", { type: "button", class: "topnav-btn theme-toggle" });
  var tIco = el("span", { class: "tn-ico", "aria-hidden": "true" });
  var tLbl = el("span", { class: "tn-lbl" });
  themeBtn.append(tIco, tLbl);
  function refresh() {
    var t = currentTheme();
    tIco.textContent = t === "dark" ? "☀️" : "🌙";
    tLbl.textContent = t === "dark" ? "Bright" : "Dark";
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to bright mode" : "Switch to dark mode");
  }
  themeBtn.addEventListener("click", function () {
    applyTheme(currentTheme() === "dark" ? "bright" : "dark");
    refresh();
  });
  refresh();

  nav.appendChild(themeBtn);
  document.body.appendChild(nav);
}

initTopNav();
