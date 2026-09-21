// Admin-only, one-time (and reusable) push of data.js's contents into Firestore's
// roster/data document, which is what auth-guard.js actually serves to approved members.
// Re-run this any time data.js is edited to sync the change live.

(function () {
  if (!requireFirebaseReady()) return;

  var status = document.querySelector("#migrate-status");
  var btn = document.querySelector("#migrate-btn");

  auth.onAuthStateChanged(function (user) {
    if (!user) { window.location.href = "login.html"; return; }
    if (!ADMIN_UID || ADMIN_UID === "REPLACE_WITH_YOUR_UID" || user.uid !== ADMIN_UID) {
      window.location.href = "index.html";
      return;
    }
    var count = (window.CHIRECTORY && window.CHIRECTORY.members) ? window.CHIRECTORY.members.length : 0;
    status.textContent = "Signed in as admin. " + count + " members loaded from data.js, ready to push.";
    btn.hidden = false;
  });

  btn.addEventListener("click", function () {
    btn.disabled = true;
    status.textContent = "Pushing…";
    db.collection("roster").doc("data").set(window.CHIRECTORY || { members: [], stats: [] })
      .then(function () {
        var count = (window.CHIRECTORY && window.CHIRECTORY.members) ? window.CHIRECTORY.members.length : 0;
        status.textContent = "Done — Firestore now has " + count + " members.";
      })
      .catch(function (err) {
        status.textContent = "Error: " + err.message;
        btn.disabled = false;
      });
  });
})();
