const ADMIN_PASSWORD = "medha@admin";
const BASE_URL = "https://script.google.com/macros/s/AKfycbxx71__r-MOGpMhlnSmprVzkwq3higbUHemY3qN-X80EJaVWRHnK1HYP72N89mA7171/exec";

const REQUEST_SHEET_ID = "1J3BqxjpEw2ZhNo3DY_-5TNkaBKNrIgKqLEPXuxa4_eY";
const STUDENT_MASTER_SHEET_ID = "1eEiktXg_yZCac0EZk9ZtWzonQtpNTGKJ4DoEGyobybw";

let isAuthenticated = false;
let refreshInterval = null;

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

  fetch(`${BASE_URL}?adminStats=true`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("pendingCount").innerText = data.pending ?? 0;
      document.getElementById("completedCount").innerText = data.completed ?? 0;
      document.getElementById("totalCount").innerText = data.total ?? 0;
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
