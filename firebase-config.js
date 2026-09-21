// Firebase project config.
// Firebase console > Project settings > General > "Your apps" > web app > SDK setup and
// configuration > Config. Paste your own values below; nothing else in this file changes.
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyD92--mu1U_gfchHQiAEPH_I883dYuEaHc",
  authDomain: "chirectory.firebaseapp.com",
  projectId: "chirectory",
  storageBucket: "chirectory.firebasestorage.app",
  messagingSenderId: "600190864403",
  appId: "1:600190864403:web:992835b2a1d9e23a0043e6",
  measurementId: "G-BRPQX80BRC",
};

var FIREBASE_READY = FIREBASE_CONFIG.apiKey !== "REPLACE_ME";

var auth, db;
if (FIREBASE_READY) {
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
}

// Shared "Firebase isn't set up yet" screen, used by every page that needs auth/db.
function requireFirebaseReady() {
  if (FIREBASE_READY) return true;
  document.body.innerHTML =
    '<div class="wrap"><div class="auth-card">' +
    "<h2>Firebase isn&rsquo;t configured yet</h2>" +
    "<p>Paste your project&rsquo;s config into <code>firebase-config.js</code> " +
    "(see README.md for the exact steps), then reload this page.</p>" +
    "</div></div>";
  return false;
}
