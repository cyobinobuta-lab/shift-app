// ============================================================
//  api.js — GASとの通信を一元管理
// ============================================================

const API = {
  // ---- GET リクエスト ----
  async get(action, params = {}) {
    const token = Auth.getToken();
    const qs = new URLSearchParams({ action, token: token || "", ...params }).toString();
    const res = await fetch(`${CONFIG.GAS_URL}?${qs}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "エラーが発生しました");
    return data;
  },

  // ---- POST リクエスト ----
  async post(action, body = {}) {
    const token = Auth.getToken();
    const res = await fetch(CONFIG.GAS_URL, {
      method: "POST",
      body: JSON.stringify({ action, token: token || "", ...body }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "エラーが発生しました");
    return data;
  },

  // ---- 各APIメソッド ----
  login:              (name, password)   => API.post("login", { name, password }),
  logout:             ()                 => API.post("logout"),
  getMySchedules:     (month)            => API.get("getMySchedules", month ? { month } : {}),
  getAllSchedules:     (month)            => API.get("getAllSchedules", month ? { month } : {}),
  getSchedulesByDate: (from, to)         => API.get("getSchedulesByDate", { from, to }),
  getMonthlySummary:  (month)            => API.get("getMonthlySummary", month ? { month } : {}),
  getEmployees:       ()                 => API.get("getEmployees"),
  addSchedule:        (data)             => API.post("addSchedule", data),
  updateSchedule:     (data)             => API.post("updateSchedule", data),
  deleteSchedule:     (recordId)         => API.post("deleteSchedule", { recordId }),
  addEmployee:        (data)             => API.post("addEmployee", data),
  updateEmployee:     (data)             => API.post("updateEmployee", data),
  deleteEmployee:     (employeeId)       => API.post("deleteEmployee", { employeeId }),
};

// ============================================================
//  Auth — ログイン状態管理
// ============================================================
const Auth = {
  KEY_TOKEN: "shift_token",
  KEY_USER:  "shift_user",

  save(token, user) {
    localStorage.setItem(this.KEY_TOKEN, token);
    localStorage.setItem(this.KEY_USER, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(this.KEY_TOKEN);
    localStorage.removeItem(this.KEY_USER);
  },
  getToken()  { return localStorage.getItem(this.KEY_TOKEN); },
  getUser()   { const u = localStorage.getItem(this.KEY_USER); return u ? JSON.parse(u) : null; },
  isLoggedIn(){ return !!this.getToken(); },
  isAdmin()   { const u = this.getUser(); return u && u.role === "admin"; },
  isViewer()  { const u = this.getUser(); return u && u.role === "viewer"; },
};
