// Admin-only: lists pending signups (approve/reject) and approved accounts (revoke).
// Access itself is enforced twice — here (so non-admins bounce to index.html) and, for real,
// by firestore.rules (isAdmin()), since a client-side redirect alone isn't security.

(function () {
  if (!requireFirebaseReady()) return;

  var pendingList = document.querySelector("#pending-list");
  var approvedList = document.querySelector("#approved-list");
  var pendingCount = document.querySelector("#pending-count");
  var approvedCount = document.querySelector("#approved-count");
  var pendingEmpty = document.querySelector("#pending-empty");

  auth.onAuthStateChanged(function (user) {
    if (!user) { window.location.href = "login.html"; return; }
    if (!ADMIN_UID || ADMIN_UID === "REPLACE_WITH_YOUR_UID" || user.uid !== ADMIN_UID) {
      window.location.href = "index.html";
      return;
    }
    load();
  });

  document.querySelector("#refresh-btn").addEventListener("click", load);

  function load() {
    db.collection("users").get().then(function (snap) {
      var pending = [], approved = [];
      snap.forEach(function (doc) {
        var d = doc.data();
        (d.approved ? approved : pending).push({ id: doc.id, email: d.email || "(no email)" });
      });
      render(pendingList, pending, true);
      render(approvedList, approved, false);
      pendingCount.textContent = String(pending.length);
      approvedCount.textContent = String(approved.length);
      pendingEmpty.hidden = pending.length !== 0;
    }).catch(function (err) {
      pendingList.textContent = "Error loading accounts: " + err.message;
    });
  }

  function render(container, rows, isPending) {
    container.innerHTML = "";
    rows.forEach(function (row) {
      var item = document.createElement("div");
      item.className = "admin-row";

      var email = document.createElement("span");
      email.className = "admin-email";
      email.textContent = row.email;
      item.appendChild(email);

      var actions = document.createElement("span");
      actions.className = "admin-actions";

      if (isPending) {
        var approveBtn = document.createElement("button");
        approveBtn.type = "button";
        approveBtn.className = "admin-approve";
        approveBtn.textContent = "Approve";
        approveBtn.addEventListener("click", function () { setApproved(row.id, true); });
        actions.appendChild(approveBtn);

        var rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.className = "admin-reject";
        rejectBtn.textContent = "Reject";
        rejectBtn.addEventListener("click", function () { removeUser(row.id); });
        actions.appendChild(rejectBtn);
      } else {
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "admin-remove";
        removeBtn.textContent = "Remove";
        removeBtn.title = "Send back to Pending — they lose access until re-approved.";
        removeBtn.addEventListener("click", function () {
          if (window.confirm("Remove " + row.email + "'s access? They'll go back to Pending and need re-approval to get back in.")) {
            setApproved(row.id, false);
          }
        });
        actions.appendChild(removeBtn);
      }

      item.appendChild(actions);
      container.appendChild(item);
    });
  }

  function setApproved(uid, value) {
    db.collection("users").doc(uid).update({ approved: value }).then(load);
  }

  function removeUser(uid) {
    db.collection("users").doc(uid).delete().then(load);
  }
})();
