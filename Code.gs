/*************************************************
 MEDHA FINANCIAL SYSTEM – CLEAN BACKEND
 Google Apps Script Web App (JSONP + Email)
*************************************************/

/***********************
 CONFIGURATION
************************/
const ADMIN_EMAIL = "mssc1@medhatrust.org"; // 🔁 CHANGE THIS
const STUDENT_SHEET_ID = "1eEiktXg_yZCac0EZk9ZtWzonQtpNTGKJ4DoEGyobybw";
const REQUEST_SHEET_ID = "1J3BqxjpEw2ZhNo3DY_-5TNkaBKNrIgKqLEPXuxa4_eY";
const STUDENT_SHEET_NAME = "Student_DB";
const REQUEST_SHEET_NAME = "Requests_DB";

/***********************
 JSON / JSONP HELPER
************************/
function jsonResponse(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService.createTextOutput(
      `${callback}(${json});`
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/***********************
 DO GET – STUDENT FETCH / ADMIN STATS
************************/
function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ error: "Invalid request" }, null);
  }

  const callback = e.parameter.callback || null;

  // 🔹 FETCH STUDENT DETAILS
  if (e.parameter.mssid) {
    const sh = SpreadsheetApp
      .openById(STUDENT_SHEET_ID)
      .getSheetByName(STUDENT_SHEET_NAME);

    if (!sh) {
      return jsonResponse({ error: "Student sheet not found" }, callback);
    }

    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(e.parameter.mssid).trim()) {
        return jsonResponse({
          name: data[i][1],
          college: data[i][2]
        }, callback);
      }
    }

    return jsonResponse({ error: "Student not found" }, callback);
  }

  // 🔹 ADMIN STATS
  if (e.parameter.adminStats) {
    const sh = SpreadsheetApp
      .openById(REQUEST_SHEET_ID)
      .getSheetByName(REQUEST_SHEET_NAME);

    if (!sh) {
      return jsonResponse({ pending: 0, completed: 0, total: 0 }, callback);
    }

    const data = sh.getDataRange().getValues();
    let pending = 0, completed = 0;

    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][13] || "").trim();
      if (status === "Pending") pending++;
      if (status === "Completed") completed++;
    }

    return jsonResponse({
      pending,
      completed,
      total: pending + completed
    }, callback);
  }

  return jsonResponse({ error: "Invalid request" }, callback);
}

/***********************
 DO POST – STORE REQUEST + EMAIL
************************/
function doPost(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("ERROR: Missing parameters");
  }

  const sh = SpreadsheetApp
    .openById(REQUEST_SHEET_ID)
    .getSheetByName(REQUEST_SHEET_NAME);

  const reqId = generateRequestId();
  const now = new Date();

  // 🔹 MAIN REQUEST
  sh.appendRow([
    reqId,
    now,
    e.parameter.mssid,
    e.parameter.name,
    e.parameter.year,
    e.parameter.college,
    e.parameter.requestType,
    e.parameter.amount,
    e.parameter.category,
    e.parameter.subCategory,
    e.parameter.paymentMode,
    e.parameter.details,
    e.parameter.dueDate,
    e.parameter.attachmentLink || "",
    "Pending"
  ]);

  // 🔹 GROUP MEMBERS
  let members = [];
  if (e.parameter.requestType === "Group") {
    try {
      members = JSON.parse(e.parameter.groupMembers || "[]");
    } catch (err) {
      members = [];
    }

    members.forEach(m => {
      sh.appendRow([
        reqId,
        now,
        m.mssid,
        m.name,
        m.year,
        m.college,
        "Group",
        e.parameter.amount,
        e.parameter.category,
        e.parameter.subCategory,
        e.parameter.paymentMode,
        e.parameter.details,
        e.parameter.dueDate,
        "",
        "Pending"
      ]);
    });
  }

  // 🔹 EMAIL NOTIFICATION
  sendAdminNotification({
    reqId,
    mssid: e.parameter.mssid,
    name: e.parameter.name,
    college: e.parameter.college,
    year: e.parameter.year,
    requestType: e.parameter.requestType,
    amount: e.parameter.amount,
    category: e.parameter.category,
    subCategory: e.parameter.subCategory,
    paymentMode: e.parameter.paymentMode,
    dueDate: e.parameter.dueDate,
    details: e.parameter.details,
    date: now.toLocaleString(),
    groupMembers: members
  });

  return ContentService.createTextOutput(reqId);
}

/***********************
 GENERATE REQUEST ID (MONTHLY)
************************/
function generateRequestId() {
  const sh = SpreadsheetApp
    .openById(REQUEST_SHEET_ID)
    .getSheetByName(REQUEST_SHEET_NAME);

  const month = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMM"
  );

  const ids = sh.getRange(2, 1, sh.getLastRow()).getValues();
  const count = ids.filter(r => r[0] && String(r[0]).includes(month)).length + 1;

  return `MSS-${month}-${String(count).padStart(2, "0")}`;
}

/***********************
 SEND ADMIN EMAIL
************************/
function sendAdminNotification(d) {
  try {
    const html = `
      <div style="font-family: Arial; max-width: 600px;">
        <h2>📋 New Student Request</h2>
        <p><b>Request ID:</b> ${d.reqId}</p>
        <p><b>Name:</b> ${d.name}</p>
        <p><b>MSS ID:</b> ${d.mssid}</p>
        <p><b>College:</b> ${d.college}</p>
        <p><b>Amount:</b> ₹${d.amount}</p>
        <p><b>Category:</b> ${d.category}</p>
        <p><b>Due Date:</b> ${d.dueDate}</p>
        ${d.details ? `<p><b>Details:</b> ${d.details}</p>` : ""}
        ${d.groupMembers.length ? `
          <p><b>Group Members:</b></p>
          <ul>${d.groupMembers.map(m => `<li>${m.name} (${m.mssid})</li>`).join("")}</ul>
        ` : ""}
      </div>
    `;

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: `🔔 New Request ${d.reqId}`,
      htmlBody: html
    });
  } catch (err) {
    Logger.log("Email error: " + err);
  }
}

/***********************
 AUTHORIZE EMAIL (RUN ONCE)
************************/
function authorizeEmailPermissions() {
  MailApp.sendEmail(
    ADMIN_EMAIL,
    "Authorization Successful",
    "Email permissions granted."
  );
}
