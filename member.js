// Single-member page: reads ?i=<index> and shows only that member's info.

// Not auto-run: auth-guard.js calls this once an approved session has loaded the roster.
window.initChirectoryPage = function () {
  var params = new URLSearchParams(window.location.search);
  var raw = params.get("i");
  // Reject missing/empty before coercing — Number(null) and Number("") are both 0,
  // which would otherwise show member 0 when the page is opened with no ?i=.
  var i = (raw === null || raw.trim() === "") ? NaN : Number(raw);
  var m = (Number.isInteger(i) && i >= 0 && i < MEMBERS.length) ? MEMBERS[i] : null;
  var root = document.querySelector("#member");

  if (!m) {
    root.appendChild(el("p", { class: "empty-note", text: "Member not found." }));
    return;
  }

  document.title = m.name + " · Chirectory";

  // Photo space — reserved for a future picture. If a member gains a `photo`
  // field (a URL/path) in the data, it renders here; otherwise a placeholder holds the spot.
  var photo = el("div", { class: "member-photo" });
  if (m.photo) {
    photo.classList.add("has-photo");
    photo.appendChild(el("img", { class: "member-photo-img", src: m.photo, alt: m.name }));
  } else {
    photo.appendChild(el("span", { class: "photo-hint", "aria-hidden": "true", text: "👤" }));
    photo.appendChild(el("span", { class: "sr-only", text: "Photo coming soon" }));
  }

  var titles = el("div", { class: "member-titles" }, [
    el("h1", { class: "member-name", text: m.name }),
    m.rushClass ? el("p", { class: "member-sub", text: "Rush Class " + m.rushClass }) : null,
  ]);

  var header = el("div", { class: "member-head" }, [photo, titles]);

  // Rush class is already shown in the sub-header, so omit it from the detail list.
  root.appendChild(el("div", { class: "member-card" }, [header, buildDetailDL(m, "", ["rushClass"])]));
};
