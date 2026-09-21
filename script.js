// Directory page: accordion of members (collapsed = name only), Ctrl+F-style
// search with highlighting, rush-class filter, expand-all, and the stats charts.

var listEl = document.querySelector("#list");
var emptyEl = document.querySelector("#empty");
var countEl = document.querySelector("#count");
var searchEl = document.querySelector("#search");
var filterEl = document.querySelector("#filter");
var jumpEl = document.querySelector("#jump");
var toggleAllEl = document.querySelector("#toggle-all");

var userOpen = new Set();   // member indices the user explicitly expanded (survives re-render)
var cardsByIdx = [];        // cardsByIdx[memberIndex] -> current card element

// ---- expand / collapse with a reliable height animation ----
function setOpen(card, open, animate) {
  if (animate === undefined) animate = true;
  var toggle = card.querySelector(".toggle");
  var panel = card.querySelector(".panel");
  var inner = panel.firstElementChild;

  card.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  if (open) panel.removeAttribute("inert");

  if (!animate) {
    panel.style.transition = "none";
    panel.style.height = open ? "auto" : "0px";
    if (!open) panel.setAttribute("inert", "");
    void panel.offsetHeight;
    panel.style.transition = "";
    return;
  }

  if (open) {
    panel.style.height = "0px";
    void panel.offsetHeight;                 // reflow so 0 -> N animates (even for fresh panels)
    panel.style.height = inner.offsetHeight + "px";
    panel.addEventListener("transitionend", function te(e) {
      if (e.propertyName !== "height") return;
      panel.removeEventListener("transitionend", te);
      if (card.classList.contains("open")) panel.style.height = "auto";
    });
  } else {
    panel.style.height = inner.offsetHeight + "px";
    void panel.offsetHeight;
    panel.style.height = "0px";
    panel.setAttribute("inert", "");
  }
}

function buildCard(m, idx, q) {
  var card = el("div", { class: "card", "data-idx": String(idx) });
  var panelId = "panel-" + idx, nameId = "name-" + idx;

  var nameSpan = el("span", { class: "nm", id: nameId });
  appendHighlighted(nameSpan, m.name, q);     // collapsed header shows ONLY the name

  var toggle = el("button", {
    type: "button", class: "toggle", "aria-expanded": "false", "aria-controls": panelId,
  }, [
    nameSpan,
    el("span", { class: "chev", "aria-hidden": "true", text: "▾" }),
  ]);

  var panel = el("div", {
    class: "panel", id: panelId, "aria-labelledby": nameId, inert: "",
  }, el("div", { class: "panel-inner" }, buildDetailDL(m, q)));

  card.append(toggle, panel);
  toggle.addEventListener("click", function () {
    var open = !card.classList.contains("open");
    setOpen(card, open);
    if (open) userOpen.add(idx); else userOpen.delete(idx);
    syncToggleAllLabel();
  });
  return card;
}

function render() {
  var q = searchEl.value.trim().toLowerCase();
  var cls = filterEl.value;

  var filtered = MEMBERS
    .map(function (m, idx) { return { m: m, idx: idx }; })
    .filter(function (o) {
      if (cls && o.m.rushClass !== cls) return false;
      return memberMatches(o.m, q);
    });

  listEl.innerHTML = "";
  cardsByIdx.length = 0;

  var groups = new Map();
  filtered.forEach(function (o) {
    var g = o.m.rushClass || "Unlisted";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(o);
  });

  groups.forEach(function (arr, g) {
    listEl.appendChild(el("div", { class: "group-head", text: g === "Unlisted" ? g : "Rush Class " + g }));
    arr.forEach(function (o) {
      var c = buildCard(o.m, o.idx, q);
      cardsByIdx[o.idx] = c;
      listEl.appendChild(c);
      // Open if the user opened it, or (Ctrl+F behavior) the match is inside a hidden field.
      if (userOpen.has(o.idx) || (q && detailMatches(o.m, q))) setOpen(c, true, false);
    });
  });

  emptyEl.hidden = filtered.length !== 0;
  var filtering = q !== "" || cls !== "";
  countEl.textContent =
    filtered.length === 0 ? "No members match" :
    filtering ? filtered.length + " of " + MEMBERS.length + " members" :
    MEMBERS.length + " members";
  syncToggleAllLabel();
}

function syncToggleAllLabel() {
  var visible = listEl.querySelectorAll(".card");
  var allOpen = visible.length > 0 && [].every.call(visible, function (c) { return c.classList.contains("open"); });
  toggleAllEl.textContent = allOpen ? "Collapse all" : "Expand all";
}

function init() {
  // Populate the "Jump to a member" select (alphabetical) -> navigates to its own page.
  MEMBERS.map(function (m, idx) { return { m: m, idx: idx }; })
    .sort(function (a, b) { return a.m.name.localeCompare(b.m.name); })
    .forEach(function (o) { jumpEl.appendChild(el("option", { value: String(o.idx), text: o.m.name })); });

  // Populate the rush-class filter in first-seen order.
  var seen = [];
  MEMBERS.forEach(function (m) { if (m.rushClass && seen.indexOf(m.rushClass) === -1) seen.push(m.rushClass); });
  seen.forEach(function (c) { filterEl.appendChild(el("option", { value: c, text: c })); });

  jumpEl.addEventListener("change", function () {
    if (jumpEl.value === "") return;
    window.location.href = "member.html?i=" + encodeURIComponent(jumpEl.value);
  });

  searchEl.addEventListener("input", render);
  filterEl.addEventListener("change", render);

  toggleAllEl.addEventListener("click", function () {
    var visible = [].slice.call(listEl.querySelectorAll(".card"));
    var anyClosed = visible.some(function (c) { return !c.classList.contains("open"); });
    visible.forEach(function (c) {
      var idx = Number(c.dataset.idx);
      setOpen(c, anyClosed, false);
      if (anyClosed) userOpen.add(idx); else userOpen.delete(idx);
    });
    syncToggleAllLabel();
  });

  render();
  renderStats();
}

// ---- stats: a table + bar graph for each breakdown ----
var SVGNS = "http://www.w3.org/2000/svg";
function svg(tag, props, kids) {
  var n = document.createElementNS(SVGNS, tag);
  if (props) Object.keys(props).forEach(function (k) {
    if (k === "text") n.textContent = props[k]; else n.setAttribute(k, props[k]);
  });
  (Array.isArray(kids) ? kids : (kids ? [kids] : [])).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
}

function buildBarChart(stat) {
  var rows = stat.rows;
  var maxN = Math.max.apply(null, rows.map(function (r) { return Number(r.number) || 0; }).concat([1]));
  var rowH = 30, padTop = 6, labelW = 150, barX = labelW + 8, chartW = 460, barMax = chartW - barX - 66;
  var h = padTop * 2 + rows.length * rowH;
  var node = svg("svg", {
    class: "barchart", viewBox: "0 0 " + chartW + " " + h, role: "img",
    "aria-label": stat.title + " bar chart",
  });
  rows.forEach(function (r, i) {
    var n = Number(r.number) || 0;
    var y = padTop + i * rowH;
    var cy = y + rowH / 2;
    var w = Math.max(0, (n / maxN) * barMax);
    node.appendChild(svg("text", { x: String(labelW), y: String(cy), "text-anchor": "end", "dominant-baseline": "middle", class: "bc-label", text: r.label }));
    node.appendChild(svg("rect", { x: String(barX), y: String(y + 7), width: String(w), height: String(rowH - 14), rx: "4", class: "bc-bar" }));
    node.appendChild(svg("text", { x: String(barX + w + 6), y: String(cy), "dominant-baseline": "middle", class: "bc-val", text: r.percent || String(n) }));
  });
  return node;
}

function buildTable(stat) {
  var table = el("table", { class: "stat-table" });
  var thead = el("thead", {}, el("tr", {}, [
    el("th", { text: stat.title }), el("th", { class: "num", text: "#" }), el("th", { class: "num", text: "%" }),
  ]));
  var tbody = el("tbody");
  stat.rows.forEach(function (r) {
    tbody.appendChild(el("tr", {}, [
      el("td", { text: r.label }),
      el("td", { class: "num", text: String(r.number) }),
      el("td", { class: "num", text: r.percent || "" }),
    ]));
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  if (stat.total) {
    table.appendChild(el("tfoot", {}, el("tr", {}, [
      el("td", { text: "Total" }),
      el("td", { class: "num", text: String(stat.total.number) }),
      el("td", { class: "num", text: stat.total.percent || "" }),
    ])));
  }
  return table;
}

function renderStats() {
  var wrap = document.querySelector("#stats");
  wrap.innerHTML = "";
  // Chart only the breakdowns whose totals match the 52-member roster.
  // ("Class" is kept in data.js for fidelity but its source total is 55, so it's not charted.)
  var breakdowns = STATS.filter(function (s) { return s.title !== "Class"; });
  if (!breakdowns.length) return;
  wrap.appendChild(el("h2", { text: "Club Stats" }));
  wrap.appendChild(el("p", { class: "sub", text: "Affiliation and relationship status breakdowns" }));
  breakdowns.forEach(function (stat) {
    // Order rows most -> least so 0% always sinks to the bottom.
    var sortedRows = stat.rows.slice().sort(function (a, b) {
      var d = (Number(b.number) || 0) - (Number(a.number) || 0);
      return d !== 0 ? d : a.label.localeCompare(b.label);
    });
    var s = { title: stat.title, rows: sortedRows, total: stat.total };
    wrap.appendChild(el("div", { class: "statcard" }, [
      el("h3", { text: s.title }),
      el("div", { class: "stat-body" }, [
        el("div", { class: "chart-wrap" }, buildBarChart(s)),
        buildTable(s),
      ]),
    ]));
  });
}

// Not auto-run: auth-guard.js calls this once an approved session has loaded the roster.
window.initChirectoryPage = init;
