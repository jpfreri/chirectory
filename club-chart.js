// Club org chart: President -> VP -> Co-Council -> Officers -> the rest.
// Each person links to their member page.

// Not auto-run: auth-guard.js calls this once an approved session has loaded the roster.
window.initChirectoryPage = function () {
  var root = document.querySelector("#chart");

  // The authoritative Co-Council roster (everyone here is Co-Council; some hold
  // an additional role shown alongside).
  var CO_COUNCIL = [
    "Cannon Poore", "Cotter Hensal", "Eric Talamantes", "Grayson Harrod",
    "Jacob McWatters", "JP Freri", "Luke Patterson", "Noah Page", "Steven Holland",
  ];

  var byName = {};
  MEMBERS.forEach(function (m, idx) { byName[m.name] = { m: m, idx: idx }; });

  function indexOfOfficer(title) {
    for (var i = 0; i < MEMBERS.length; i++) {
      if ((MEMBERS[i].officer || "").trim().toLowerCase() === title) return i;
    }
    return -1;
  }

  var presIdx = indexOfOfficer("president");
  var vpIdx = indexOfOfficer("vice president");

  var placed = {};
  if (presIdx >= 0) placed[presIdx] = true;
  if (vpIdx >= 0) placed[vpIdx] = true;

  var council = [];
  CO_COUNCIL.forEach(function (name) {
    var e = byName[name];
    if (e) { council.push(e); placed[e.idx] = true; }
  });

  var officers = [], rest = [];
  MEMBERS.forEach(function (m, idx) {
    if (placed[idx]) return;
    if ((m.officer || "").trim() !== "") officers.push({ m: m, idx: idx });
    else rest.push({ m: m, idx: idx });
  });
  function byNameAsc(a, b) { return a.m.name.localeCompare(b.m.name); }
  officers.sort(byNameAsc);
  rest.sort(byNameAsc);

  function personCard(idx, m, roleText, cls) {
    return el("a", { class: "person" + (cls ? " " + cls : ""), href: "member.html?i=" + idx }, [
      el("span", { class: "p-name", text: m.name }),
      roleText ? el("span", { class: "p-role", text: roleText }) : null,
    ]);
  }

  // For a Co-Council member, show "Co-Council" plus any extra role they hold.
  function councilRole(m) {
    var o = (m.officer || "").trim();
    if (o === "" || o.toLowerCase() === "co-council") return "Co-Council";
    return "Co-Council · " + o;
  }

  var frag = document.createDocumentFragment();

  // Leadership spine
  if (presIdx >= 0) {
    frag.appendChild(el("div", { class: "lead-row" }, personCard(presIdx, MEMBERS[presIdx], "President", "lead")));
    frag.appendChild(el("div", { class: "connector" }));
  }
  if (vpIdx >= 0) {
    frag.appendChild(el("div", { class: "lead-row" }, personCard(vpIdx, MEMBERS[vpIdx], "Vice President", "lead")));
    frag.appendChild(el("div", { class: "connector" }));
  }

  function tier(label, list, roleFn, cardCls) {
    var heading = el("h2", { class: "tier-label", text: label + " " });
    heading.appendChild(el("span", { class: "tier-count", text: "(" + list.length + ")" }));
    var grid = el("div", { class: "tier-grid" });
    list.forEach(function (e) { grid.appendChild(personCard(e.idx, e.m, roleFn(e.m), cardCls)); });
    return el("section", { class: "tier" }, [heading, grid]);
  }

  frag.appendChild(tier("Co-Council", council, councilRole, "council"));
  frag.appendChild(tier("Officers", officers, function (m) { return (m.officer || "").trim(); }, null));
  frag.appendChild(tier("Members", rest, function () { return ""; }, null));

  root.appendChild(frag);
};
