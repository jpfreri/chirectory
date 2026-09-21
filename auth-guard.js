// Gates index.html / member.html / club-chart.html behind Firebase sign-in + admin approval.
// Content stays hidden (see the .chir-gated rule in styles.css) until this confirms an
// approved session and has loaded the roster from Firestore, at which point it hands off to
// the page's own window.initChirectoryPage().

(function () {
  if (!requireFirebaseReady()) return;

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function showGate(html) {
    var existing = document.querySelector("#chir-gate");
    if (existing) existing.remove();
    var gate = document.createElement("div");
    gate.id = "chir-gate";
    gate.className = "chir-gate";
    gate.innerHTML = html;
    document.body.appendChild(gate);
    return gate;
  }

  function clearGate() {
    var existing = document.querySelector("#chir-gate");
    if (existing) existing.remove();
  }

  function addSignOutButton() {
    if (document.querySelector("#chir-signout-fixed")) return;
    var btn = document.createElement("button");
    btn.id = "chir-signout-fixed";
    btn.type = "button";
    btn.className = "chir-signout-fixed";
    btn.textContent = "Sign out";
    btn.addEventListener("click", function () { auth.signOut(); });
    document.body.appendChild(btn);
  }

  // Admin-only "Admin" link, slotted into the existing top-right nav cluster.
  function addAdminNavLink() {
    var nav = document.querySelector(".topnav");
    if (!nav || nav.querySelector(".admin-nav-link")) return;
    var link = document.createElement("a");
    link.href = "admin.html";
    link.className = "topnav-btn admin-nav-link";
    link.innerHTML = '<span class="tn-ico" aria-hidden="true">🔑</span><span class="tn-lbl">Admin</span>';
    nav.appendChild(link);
  }

  showGate('<div class="chir-gate-card"><h2>Chirectory</h2><p>Checking your session&hellip;</p></div>');

  auth.onAuthStateChanged(function (user) {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    db.collection("users").doc(user.uid).get().then(function (snap) {
      var approved = snap.exists && snap.data().approved === true;
      var isAdmin = typeof ADMIN_UID !== "undefined" && user.uid === ADMIN_UID;

      if (!approved && !isAdmin) {
        showGate(
          '<div class="chir-gate-card">' +
            "<h2>Pending approval</h2>" +
            "<p>Your account (" + escapeHtml(user.email) + ") hasn&rsquo;t been approved yet. " +
            "Check back soon, or reach out to an officer.</p>" +
            '<button type="button" id="chir-signout">Sign out</button>' +
          "</div>"
        );
        document.querySelector("#chir-signout").addEventListener("click", function () { auth.signOut(); });
        return;
      }

      db.collection("roster").doc("data").get().then(function (rosterSnap) {
        setChirectoryData(rosterSnap.exists ? rosterSnap.data() : { members: [], stats: [] });
        clearGate();
        document.body.classList.add("chir-ready");
        addSignOutButton();
        if (isAdmin) addAdminNavLink();
        if (typeof window.initChirectoryPage === "function") window.initChirectoryPage();
      }).catch(function (err) {
        showGate('<div class="chir-gate-card"><h2>Couldn&rsquo;t load the roster</h2><p>' + escapeHtml(err.message) + "</p></div>");
      });
    }).catch(function (err) {
      showGate('<div class="chir-gate-card"><h2>Something went wrong</h2><p>' + escapeHtml(err.message) + "</p></div>");
    });
  });
})();
