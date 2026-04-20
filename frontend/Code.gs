// ============================================================
//  勤務可能時間管理アプリ — GAS バックエンド
//  シート名: employees / schedules / sessions
// ============================================================

var SS = SpreadsheetApp.getActiveSpreadsheet();

// ---------- JST日時ヘルパー ----------
function nowJST() {
  var now = new Date();
  var jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().replace("Z", "+09:00");
}

function formatDate(d) {
  if (!d) return "";
  var dt;
  if (d instanceof Date) {
    dt = d;
  } else {
    dt = new Date(d);
  }
  if (isNaN(dt.getTime())) return String(d);
  // JST補正
  var jst = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
  var y = jst.getUTCFullYear();
  var m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  var day = String(jst.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

// ---------- シート取得ヘルパー ----------
function getSheet(name) {
  var sh = SS.getSheetByName(name);
  if (!sh) throw new Error("シート「" + name + "」が見つかりません");
  return sh;
}

// ---------- CORS ヘッダー付きレスポンス ----------
function makeRes(data) {
  var res = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return res;
}

// ---------- エントリポイント ----------
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === "login")           return makeRes(login(body));
    if (action === "addSchedule")     return makeRes(addSchedule(body));
    if (action === "updateSchedule")  return makeRes(updateSchedule(body));
    if (action === "deleteSchedule")  return makeRes(deleteSchedule(body));
    if (action === "addEmployee")     return makeRes(addEmployee(body));
    if (action === "updateEmployee")  return makeRes(updateEmployee(body));
    if (action === "deleteEmployee")  return makeRes(deleteEmployee(body));
    if (action === "logout")          return makeRes(logout(body));

    return makeRes({ ok: false, error: "不明なaction: " + action });
  } catch (err) {
    return makeRes({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var token  = e.parameter.token;

    if (action === "ping")             return makeRes({ ok: true });
    if (action === "getMySchedules")    return makeRes(getMySchedules(e.parameter));
    if (action === "getAllSchedules")    return makeRes(getAllSchedules(e.parameter));
    if (action === "getSchedulesByDate")return makeRes(getSchedulesByDate(e.parameter));
    if (action === "getMonthlySummary") return makeRes(getMonthlySummary(e.parameter));
    if (action === "getEmployees")      return makeRes(getEmployees(e.parameter));

    return makeRes({ ok: false, error: "不明なaction: " + action });
  } catch (err) {
    return makeRes({ ok: false, error: err.message });
  }
}

// ============================================================
//  認証
// ============================================================

function login(body) {
  var name = (body.name || "").trim();
  var pass = (body.password || "").trim();
  if (!name || !pass) return { ok: false, error: "名前とパスワードを入力してください" };

  var sh = getSheet("employees");
  var rows = sh.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    // A=id B=name C=password D=role E=created_at F=is_active
    if (r[1] === name && String(r[2]) === String(pass) && r[5] === true) {
      var token = generateToken();
      saveSession(token, r[0], r[1], r[3]);
      return { ok: true, token: token, employeeId: r[0], name: r[1], role: r[3] };
    }
  }
  return { ok: false, error: "名前またはパスワードが違います" };
}

function logout(body) {
  var token = body.token;
  var sh = getSheet("sessions");
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: true };
}

function generateToken() {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var t = "";
  for (var i = 0; i < 32; i++) t += chars.charAt(Math.floor(Math.random() * chars.length));
  return t;
}

function saveSession(token, empId, name, role) {
  var sh = getSheet("sessions");
  sh.appendRow([token, empId, name, role, nowJST()]);
}

function verifyToken(token) {
  if (!token) return null;
  var sh = getSheet("sessions");
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      return { employeeId: rows[i][1], name: rows[i][2], role: rows[i][3] };
    }
  }
  return null;
}

// ============================================================
//  スケジュール
// ============================================================

function addSchedule(body) {
  var user = verifyToken(body.token);
  if (!user) return { ok: false, error: "ログインが必要です" };
  if (user.role === "viewer") return { ok: false, error: "閲覧のみモードでは登録できません" };

  var sh = getSheet("schedules");
  var now = nowJST();
  var id  = "REC" + String(Date.now()).slice(-7);
  var hours = calcHours(body.startTime, body.endTime);

  sh.appendRow([
    id,
    body.employeeId || user.employeeId,
    body.name       || user.name,
    String(body.workDate),
    String(body.startTime),
    String(body.endTime),
    hours,
    body.note || "",
    now,
    now
  ]);
  return { ok: true, recordId: id, hours: hours };
}

function updateSchedule(body) {
  var user = verifyToken(body.token);
  if (!user) return { ok: false, error: "ログインが必要です" };
  if (user.role === "viewer") return { ok: false, error: "閲覧のみモードでは編集できません" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === body.recordId) {
      if (user.role !== "admin" && rows[i][1] !== user.employeeId) {
        return { ok: false, error: "編集権限がありません" };
      }
      var hours = calcHours(body.startTime, body.endTime);
      sh.getRange(i + 1, 5).setValue(body.workDate);
      sh.getRange(i + 1, 6).setValue(body.startTime);
      sh.getRange(i + 1, 7).setValue(body.endTime);
      sh.getRange(i + 1, 8).setValue(hours);
      sh.getRange(i + 1, 9).setValue(body.note || "");
      sh.getRange(i + 1, 11).setValue(nowJST());
      return { ok: true, hours: hours };
    }
  }
  return { ok: false, error: "レコードが見つかりません" };
}

function deleteSchedule(body) {
  var user = verifyToken(body.token);
  if (!user) return { ok: false, error: "ログインが必要です" };
  if (user.role === "viewer") return { ok: false, error: "閲覧のみモードでは削除できません" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === body.recordId) {
      if (user.role !== "admin" && rows[i][1] !== user.employeeId) {
        return { ok: false, error: "削除権限がありません" };
      }
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: "レコードが見つかりません" };
}

function getMySchedules(params) {
  var user = verifyToken(params.token);
  if (!user) return { ok: false, error: "ログインが必要です" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[1] !== user.employeeId) continue;
    if (params.month && !formatDate(r[3]).startsWith(params.month)) continue;
    result.push(rowToSchedule(r));
  }
  result.sort(function(a, b) { return a.workDate > b.workDate ? 1 : -1; });
  return { ok: true, data: result };
}

function getAllSchedules(params) {
  var user = verifyToken(params.token);
  if (!user) return { ok: false, error: "ログインが必要です" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (params.month && !formatDate(r[3]).startsWith(params.month)) continue;
    result.push(rowToSchedule(r));
  }
  result.sort(function(a, b) { return a.workDate > b.workDate ? 1 : -1; });
  return { ok: true, data: result };
}

function getSchedulesByDate(params) {
  var user = verifyToken(params.token);
  if (!user) return { ok: false, error: "ログインが必要です" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();
  var byDate = {};

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var d = formatDate(r[3]);
    if (params.from && d < params.from) continue;
    if (params.to   && d > params.to)   continue;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(rowToSchedule(r));
  }
  return { ok: true, data: byDate };
}

function getMonthlySummary(params) {
  var user = verifyToken(params.token);
  if (!user) return { ok: false, error: "ログインが必要です" };

  var sh = getSheet("schedules");
  var rows = sh.getDataRange().getValues();
  var summary = {};

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var d = formatDate(r[3]);
    var month = d.substring(0, 7);
    if (params.month && month !== params.month) continue;
    var empId = r[1];
    var empName = r[2];
    var hours = parseFloat(r[6]) || 0;
    if (!summary[empId]) summary[empId] = { employeeId: empId, name: empName, totalHours: 0, days: 0 };
    summary[empId].totalHours += hours;
    summary[empId].days += 1;
  }
  var result = Object.values(summary).map(function(s) {
    s.totalHours = Math.round(s.totalHours * 10) / 10;
    return s;
  });
  return { ok: true, data: result };
}

function formatTime(t) {
  if (!t) return "";
  if (t instanceof Date) {
    var jst = new Date(t.getTime() + 9 * 60 * 60 * 1000);
    var h = String(jst.getUTCHours()).padStart(2, "0");
    var m = String(jst.getUTCMinutes()).padStart(2, "0");
    return h + ":" + m;
  }
  return String(t);
}

function rowToSchedule(r) {
  return {
    recordId:   r[0],
    employeeId: r[1],
    name:       r[2],
    workDate:   formatDate(r[3]),
    startTime:  formatTime(r[4]),
    endTime:    formatTime(r[5]),
    hours:      parseFloat(r[6]) || 0,
    note:       r[7] || "",
    createdAt:  r[8] ? r[8].toString() : "",
    updatedAt:  r[9] ? r[9].toString() : ""
  };
}

function calcHours(start, end) {
  if (!start || !end) return 0;
  var s = start.split(":").map(Number);
  var e = end.split(":").map(Number);
  var diff = (e[0] * 60 + e[1]) - (s[0] * 60 + s[1]);
  return diff > 0 ? Math.round(diff / 6) / 10 : 0;
}

// ============================================================
//  従業員管理 (管理者のみ)
// ============================================================

function getEmployees(params) {
  var user = verifyToken(params.token);
  if (!user) return { ok: false, error: "ログインが必要です" };
  if (user.role !== "admin") return { ok: false, error: "管理者権限が必要です" };

  var sh = getSheet("employees");
  var rows = sh.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[5] !== true) continue;
    result.push({ employeeId: r[0], name: r[1], role: r[3], createdAt: r[4] ? r[4].toString() : "" });
  }
  return { ok: true, data: result };
}

function addEmployee(body) {
  var user = verifyToken(body.token);
  if (!user || user.role !== "admin") return { ok: false, error: "管理者権限が必要です" };

  var sh = getSheet("employees");
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === body.name && rows[i][5] === true) {
      return { ok: false, error: "同じ名前の従業員がすでに存在します" };
    }
  }
  var id = "EMP" + String(Date.now()).slice(-6);
  sh.appendRow([id, body.name, String(body.password), body.role || "user", nowJST(), true]);
  return { ok: true, employeeId: id };
}

function updateEmployee(body) {
  var user = verifyToken(body.token);
  if (!user || user.role !== "admin") return { ok: false, error: "管理者権限が必要です" };

  var sh = getSheet("employees");
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === body.employeeId) {
      if (body.password) sh.getRange(i + 1, 3).setValue(body.password);
      if (body.role)     sh.getRange(i + 1, 4).setValue(body.role);
      return { ok: true };
    }
  }
  return { ok: false, error: "従業員が見つかりません" };
}

function deleteEmployee(body) {
  var user = verifyToken(body.token);
  if (!user || user.role !== "admin") return { ok: false, error: "管理者権限が必要です" };

  var sh = getSheet("employees");
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === body.employeeId) {
      sh.getRange(i + 1, 6).setValue(false);
      return { ok: true };
    }
  }
  return { ok: false, error: "従業員が見つかりません" };
}

// ============================================================
//  初期セットアップ — 一度だけ実行する関数
// ============================================================
function setupSheets() {
  var empSh = SS.getSheetByName("employees") || SS.insertSheet("employees");
  empSh.clearContents();
  empSh.getRange(1, 1, 1, 6).setValues([["employee_id","name","password","role","created_at","is_active"]]);
  empSh.appendRow(["EMP000001","管理者","admin123","admin",nowJST(),true]);

  var schSh = SS.getSheetByName("schedules") || SS.insertSheet("schedules");
  schSh.clearContents();
  schSh.getRange(1, 1, 1, 10).setValues([["record_id","employee_id","name","work_date","start_time","end_time","hours","note","created_at","updated_at"]]);

  var sesSh = SS.getSheetByName("sessions") || SS.insertSheet("sessions");
  sesSh.clearContents();
  sesSh.getRange(1, 1, 1, 5).setValues([["token","employee_id","name","role","created_at"]]);

  SpreadsheetApp.getUi().alert("セットアップ完了！\n管理者アカウント: 名前「管理者」/ パスワード「admin123」");
}
