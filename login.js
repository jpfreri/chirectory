// Sign in / create account. On success, sends the browser to index.html, where
// auth-guard.js decides whether the account is approved yet.

(function () {
  if (!requireFirebaseReady()) return;

  var tabSignin = document.querySelector("#tab-signin");
  var tabSignup = document.querySelector("#tab-signup");
  var signinForm = document.querySelector("#signin-form");
  var signupForm = document.querySelector("#signup-form");

  tabSignin.addEventListener("click", function () { switchTab(true); });
  tabSignup.addEventListener("click", function () { switchTab(false); });

  function switchTab(showSignin) {
    tabSignin.classList.toggle("active", showSignin);
    tabSignup.classList.toggle("active", !showSignin);
    signinForm.hidden = !showSignin;
    signupForm.hidden = showSignin;
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  // True while a submit handler below is running its own Firestore write + navigation.
  // Without this, the ambient listener redirects to index.html the instant the Auth account
  // exists — before the signup's own users/{uid} doc finishes writing — and cuts it off.
  var authBusy = false;

  // Only for a session that already existed when this page loaded (e.g. navigating back here
  // while still signed in); the form handlers below manage their own post-success navigation.
  auth.onAuthStateChanged(function (user) {
    if (user && !authBusy) window.location.href = "index.html";
  });

  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.querySelector("#si-email").value.trim();
    var password = document.querySelector("#si-password").value;
    var errorEl = document.querySelector("#si-error");
    errorEl.hidden = true;
    authBusy = true;
    auth.signInWithEmailAndPassword(email, password).then(function () {
      window.location.href = "index.html";
    }).catch(function (err) {
      authBusy = false;
      showError(errorEl, err.message);
    });
  });

  signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.querySelector("#su-email").value.trim();
    var password = document.querySelector("#su-password").value;
    var password2 = document.querySelector("#su-password2").value;
    var errorEl = document.querySelector("#su-error");
    errorEl.hidden = true;

    if (password.length < 10) {
      showError(errorEl, "Password needs to be at least 10 characters.");
      return;
    }
    if (password !== password2) {
      showError(errorEl, "Passwords don't match.");
      return;
    }

    authBusy = true;
    auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
      return db.collection("users").doc(cred.user.uid).set({
        email: email,
        approved: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }).then(function () {
      signupForm.hidden = true;
      tabSignin.hidden = true;
      tabSignup.hidden = true;
      document.querySelector("#auth-pending").hidden = false;
    }).catch(function (err) {
      authBusy = false;
      showError(errorEl, err.message);
    });
  });
})();
