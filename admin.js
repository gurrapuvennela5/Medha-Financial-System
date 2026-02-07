const ADMIN_PASSWORD = "medha@admin";
const BASE_URL = "https://script.google.com/macros/s/AKfycbxu8D_d2lV_jBkYVSkoMR7bN_F40u_jHfWKT91jKnYgx_w24IKeJFlez1_ATCe0bIOZ/exec";

const REQUEST_SHEET_ID = "1J3BqxjpEw2ZhNo3DY_-5TNkaBKNrIgKqLEPXuxa4_eY";
const STUDENT_MASTER_SHEET_ID = "1eEiktXg_yZCac0EZk9ZtWzonQtpNTGKJ4DoEGyobybw";

let isAuthenticated = false;
let refreshInterval = null;

function fetchJsonp(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Request timed out"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Network error"));
    };

    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

/* ===============================
   LOGIN
================================ */

function adminLogin() {
  const pass = document.getElementById("adminPassword").value.trim();

  if (!pass) return alert("Enter password");

  if (pass === ADMIN_PASSWORD) {
    isAuthenticated = true;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadDashboard();

    // 🔁 Auto refresh every 30 seconds
    refreshInterval = setInterval(loadDashboard, 30000);
  } else {
    alert("❌ Invalid password");
    document.getElementById("adminPassword").value = "";
  }
}

/* ===============================
   DASHBOARD STATS (LIVE)
================================ */

function loadDashboard() {
  if (!isAuthenticated) return;

  fetchJsonp(`${BASE_URL}?adminStats=true`)
    .then(data => {
      document.getElementById("pendingCount").innerText = data?.pending ?? 0;
      document.getElementById("completedCount").innerText = data?.completed ?? 0;
      document.getElementById("totalCount").innerText = data?.total ?? 0;
    })
    .catch(() => {
      document.getElementById("pendingCount").innerText = 0;
      document.getElementById("completedCount").innerText = 0;
      document.getElementById("totalCount").innerText = 0;
    });
}

/* ===============================
   LOGOUT
================================ */

function logoutAdmin() {
  isAuthenticated = false;
  clearInterval(refreshInterval);
  window.location.href = "index.html";
}

/* ===============================
   DOWNLOADS
================================ */

function downloadStudentMaster() {
  if (!isAuthenticated) return alert("Login first");

  window.open(
    `https://docs.google.com/spreadsheets/d/${STUDENT_MASTER_SHEET_ID}/export?format=xlsx`
  );
}

function downloadAllRequests() {
  if (!isAuthenticated) return alert("Login first");

  window.open(
    `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/export?format=xlsx`
  );
}

/* ===============================
   DATE FILTER (BEST POSSIBLE)
================================ */

function downloadRequestsWithDateFilter() {
  if (!isAuthenticated) return alert("Login first");

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!start || !end) {
    alert("Select both dates");
    return;
  }

  if (new Date(start) > new Date(end)) {
    alert("Invalid date range");
    return;
  }

  alert(
`Google Sheets limitation:

The sheet will now open.
Apply filter on DATE column:
Between ${start} and ${end}

Then use:
File → Download → Excel`
  );

  window.open(
    `https://docs.google.com/spreadsheets/d/${REQUEST_SHEET_ID}/edit`
  );
}

/* ===============================
   PASSWORD TOGGLE
================================ */

function togglePassword() {
  const pwd = document.getElementById("adminPassword");
  pwd.type = pwd.type === "password" ? "text" : "password";
}
