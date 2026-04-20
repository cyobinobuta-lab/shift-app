// ============================================================
//  app.js — 画面制御・ルーティング
// ============================================================

// ---------- ユーティリティ ----------
const $ = (id) => document.getElementById(id);

function todayJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth()+1).padStart(2,"0")}-${String(jst.getUTCDate()).padStart(2,"0")}`;
}
function fmtDate(d) {
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtJP(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  const y = parseInt(parts[0]), mo = parseInt(parts[1])-1, dd = parseInt(parts[2]);
  const d = new Date(y, mo, dd);
  const days = ["日","月","火","水","木","金","土"];
  return `${mo+1}月${dd}日（${days[d.getDay()]}）`;
}
function calcHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? Math.round(diff / 6) / 10 : 0;
}
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
}
function showToast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}
function showLoading(show) {
  $("loading").style.display = show ? "flex" : "none";
}

// ============================================================
//  ルーター — 画面の表示切り替え
// ============================================================
const Router = {
  current: null,
  go(screenId, params = {}) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const sc = $(screenId);
    if (sc) sc.classList.add("active");
    this.current = screenId;
    if (screenId === "screen-home")       Screen.Home.load();
    if (screenId === "screen-register")   Screen.Register.init(params);
    if (screenId === "screen-my-list")    Screen.MyList.load();
    if (screenId === "screen-calendar")   Screen.Calendar.load();
    if (screenId === "screen-admin-dashboard") Screen.AdminDashboard.load();
    if (screenId === "screen-admin-employees") Screen.AdminEmployees.load();
    if (screenId === "screen-admin-date") Screen.AdminDate.load();
    if (screenId === "screen-admin-monthly") Screen.AdminMonthly.load();
    this.updateNav(screenId);
  },
  updateNav(screenId) {
    document.querySelectorAll(".nav-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.screen === screenId);
    });
  }
};

// ============================================================
//  ログイン画面
// ============================================================
const LoginScreen = {
  async submit() {
    const name = $("login-name").value.trim();
    const pass = $("login-pass").value.trim();
    if (!name || !pass) { showToast("名前とパスワードを入力してください", "error"); return; }
    showLoading(true);
    try {
      const res = await API.login(name, pass);
      Auth.save(res.token, { employeeId: res.employeeId, name: res.name, role: res.role });
      initApp();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// ============================================================
//  アプリ初期化
// ============================================================
function initApp() {
  if (!Auth.isLoggedIn()) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $("screen-login").classList.add("active");
    buildNav([]);
    return;
  }
  const user = Auth.getUser();
  const navUserName = $("nav-user-name");
  if (navUserName) navUserName.textContent = user.name;

  if (Auth.isAdmin()) {
    buildNav([
      { id: "screen-admin-dashboard", label: "ホーム",    icon: "grid" },
      { id: "screen-calendar",        label: "カレンダー", icon: "cal" },
      { id: "screen-admin-date",      label: "日付別",    icon: "list" },
      { id: "screen-register",        label: "登録",      icon: "plus" },
      { id: "screen-my-list",         label: "自分",      icon: "cal" },
      { id: "screen-admin-monthly",   label: "月集計",    icon: "chart" },
      { id: "screen-admin-employees", label: "従業員",    icon: "people" },
    ]);
    Router.go("screen-admin-dashboard");
  } else if (Auth.isViewer()) {
    buildNav([
      { id: "screen-calendar",   label: "カレンダー", icon: "cal" },
      { id: "screen-admin-date", label: "日付別",    icon: "list" },
    ]);
    Router.go("screen-calendar");
  } else {
    buildNav([
      { id: "screen-home",     label: "ホーム",    icon: "grid" },
      { id: "screen-register", label: "登録",      icon: "plus" },
      { id: "screen-calendar", label: "カレンダー", icon: "cal" },
      { id: "screen-my-list",  label: "一覧",      icon: "list" },
    ]);
    Router.go("screen-home");
  }
}

function buildNav(items) {
  const nav = $("bottom-nav");
  nav.innerHTML = items.map(item => `
    <button class="nav-btn" data-screen="${item.id}" onclick="Router.go('${item.id}')">
      ${navIcon(item.icon)}
      <span>${item.label}</span>
    </button>
  `).join("");
}

function navIcon(name) {
  const icons = {
    grid:   `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor"/></svg>`,
    plus:   `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    cal:    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h16" stroke="currentColor" stroke-width="1.5"/><path d="M7 2v3M13 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    list:   `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 8h16" stroke="currentColor" stroke-width="1.5"/><path d="M7 2v3M13 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    chart:  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="11" width="3" height="6" rx="1" fill="currentColor"/><rect x="8" y="7" width="3" height="10" rx="1" fill="currentColor"/><rect x="13" y="4" width="3" height="13" rx="1" fill="currentColor"/></svg>`,
    people: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 4a3 3 0 010 6M18 17c0-2.761-1.79-5.12-4.25-5.84" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };
  return icons[name] || "";
}

// ============================================================
//  Screen.Home — 従業員ホーム
// ============================================================
Screen = {};
Screen.Home = {
  async load() {
    const user = Auth.getUser();
    $("home-user").textContent = user.name;
    showLoading(true);
    try {
      const month = currentMonth();
      const res = await API.getMySchedules(month);
      const data = res.data || [];
      const total = data.reduce((s, r) => s + r.hours, 0);

      $("home-month-total").textContent = `${Math.round(total * 10) / 10}h`;
      $("home-month-label").textContent = `${month.replace("-","年")}月 · ${data.length}日登録`;

      // 累計
      // 今月の日数表示
      $("home-all-total").textContent = `${data.length}日`;
      $("home-days-label").textContent = `${month.replace("-","年")}月 登録済み`;

      // 直近30件
      const recent = data.slice(-30).reverse();
      $("home-recent").innerHTML = recent.length === 0
        ? `<p style="color:var(--color-text-secondary);font-size:13px;text-align:center;padding:12px 0">まだ登録がありません</p>`
        : recent.map(r => scheduleItemHTML(r, true)).join("");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// ============================================================
//  Screen.Register — 登録フォーム
// ============================================================
Screen.Register = {
  editingId: null,

  init(params = {}) {
    this.editingId = params.recordId || null;
    const today = fmtDate(new Date());
    $("reg-date").value = params.workDate || today;
    $("reg-start").value = params.startTime || "";
    $("reg-end").value   = params.endTime   || "";
    $("reg-note").value  = params.note      || "";
    $("reg-submit-label").textContent = this.editingId ? "更新する" : "登録する";
    this.calcPreview();

    // クイックボタン
    const presets = CONFIG.QUICK_PRESETS;
    $("quick-btns").innerHTML = presets.map((p, i) => `
      <button class="quick-btn" onclick="Screen.Register.selectPreset(${i})">
        <span class="q-label">${p.label}</span>
        <span class="q-time">${p.start ? p.start + "〜" + p.end : "自由入力"}</span>
      </button>
    `).join("");
  },

  selectPreset(i) {
    const p = CONFIG.QUICK_PRESETS[i];
    document.querySelectorAll(".quick-btn").forEach((b, j) => b.classList.toggle("active", i === j));
    if (p.start) {
      $("reg-start").value = p.start;
      $("reg-end").value   = p.end;
      this.calcPreview();
    }
  },

  calcPreview() {
    const h = calcHours($("reg-start").value, $("reg-end").value);
    $("reg-hours-preview").textContent = h > 0 ? `${h} 時間` : "— 時間";
  },

  async submit() {
    const workDate  = $("reg-date").value;
    const startTime = $("reg-start").value;
    const endTime   = $("reg-end").value;
    const note      = $("reg-note").value;

    if (!workDate || !startTime || !endTime) {
      showToast("日付・開始時間・終了時間は必須です", "error");
      return;
    }
    const hours = calcHours(startTime, endTime);
    if (hours <= 0) { showToast("終了時間は開始時間より後にしてください", "error"); return; }

    showLoading(true);
    try {
      if (this.editingId) {
        await API.updateSchedule({ recordId: this.editingId, workDate, startTime, endTime, note });
        showToast("更新しました");
      } else {
        await API.addSchedule({ workDate, startTime, endTime, note });
        Cache.clear();
        showToast("登録しました");
      }
      this.editingId = null;
      Router.go("screen-my-list");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// ============================================================
//  Screen.MyList — 自分の登録一覧
// ============================================================
Screen.MyList = {
  data: [],
  month: currentMonth(),

  async load() {
    $("mylist-month").value = this.month;
    showLoading(true);
    try {
      const res = await API.getMySchedules(this.month);
      this.data = res.data || [];
      this.render();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },

  render() {
    const total = this.data.reduce((s, r) => s + r.hours, 0);
    $("mylist-total").textContent = `合計 ${Math.round(total * 10) / 10} 時間`;

    const canEdit = !Auth.isViewer();
    $("mylist-body").innerHTML = this.data.length === 0
      ? `<p style="color:var(--color-text-secondary);font-size:13px;text-align:center;padding:20px 0">登録がありません</p>`
      : this.data.map(r => scheduleItemHTML(r, false, canEdit)).join("");
  },

  changeMonth(val) {
    this.month = val;
    this.load();
  }
};

// ============================================================
//  カレンダー画面 (共通 — 従業員・管理者両方で使う)
// ============================================================
Screen.Calendar = {
  range: 2,
  offsetWeeks: 0,
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selEmp: null,
  allSchedules: [],
  employees: [],

  async load() {
    showLoading(true);
    try {
      const res = await API.getAllSchedules();
      this.allSchedules = res.data || [];

      if (Auth.isAdmin()) {
        // 管理者はgetEmployeesで全員取得（閲覧者除く）
        const empRes = await API.getEmployees();
        this.employees = (empRes.data || []).filter(e => e.role !== "viewer");
      } else {
        // 一般従業員・閲覧者はスケジュールデータから従業員一覧を生成
        const empMap = {};
        (this.allSchedules || []).forEach(s => {
          if (!empMap[s.employeeId]) {
            empMap[s.employeeId] = { employeeId: s.employeeId, name: s.name };
          }
        });
        this.employees = Object.values(empMap);
      }
      this.render();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },

  render() {
    this.renderAvatars();
    this.renderCalendar();
    this.updatePeriodLabel();
  },

  getStart() {
    const today = new Date();
    if (this.range === 4) {
      return new Date(this.currentYear, this.currentMonth, 1);
    }
    const dow = (today.getDay() + 6) % 7;
    const mon = new Date(today);
    mon.setDate(today.getDate() - dow + this.offsetWeeks * 7);
    return mon;
  },

  getDays() {
    const s = this.getStart();
    if (this.range === 4) {
      const fm = new Date(s.getFullYear(), s.getMonth(), 1);
      const dow = (fm.getDay() + 6) % 7;
      const cs = new Date(fm);
      cs.setDate(1 - dow);
      return Array.from({length: 42}, (_, i) => { const d = new Date(cs); d.setDate(cs.getDate() + i); return d; });
    }
    return Array.from({length: this.range * 7}, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  },

  updatePeriodLabel() {
    const days = this.getDays();
    const s = days[0], e = days[days.length - 1];
    const fmt = d => `${d.getMonth()+1}月${d.getDate()}日`;
    $("cal-period-label").textContent = this.range === 4
      ? `${s.getMonth()+1}月`
      : `${fmt(s)}〜${fmt(e)}`;
  },

  shiftsForDay(ds) {
    return this.allSchedules.filter(sh =>
      sh.workDate === ds && (this.selEmp === null || sh.employeeId === this.selEmp)
    );
  },

  empColors: [
    {bg:"#E6F1FB",tc:"#0C447C"},
    {bg:"#E1F5EE",tc:"#085041"},
    {bg:"#FAEEDA",tc:"#633806"},
    {bg:"#FAECE7",tc:"#712B13"},
    {bg:"#EEEDFE",tc:"#3C3489"},
    {bg:"#FEF0EB",tc:"#993C1D"},
  ],

  getEmpColor(employeeId) {
    const idx = this.employees.findIndex(e => e.employeeId === employeeId);
    return this.empColors[idx % this.empColors.length] || this.empColors[0];
  },

  getEmpInit(employeeId) {
    const emp = this.employees.find(e => e.employeeId === employeeId);
    return emp ? emp.name.charAt(0) : "?";
  },

  renderAvatars() {
    const strip = $("cal-avatar-strip");
    if (!strip) return;
    const isAdmin = Auth.isAdmin();

    let html = "";
    // 全員ボタン（先頭）
    const allSel = this.selEmp === null;
    html += `<div class="av-item" onclick="Screen.Calendar.selectEmp(null)">
      <div class="av-ring${allSel?" av-sel":""}">
        <div class="av-face" style="background:var(--color-background-secondary);font-size:10px;color:var(--color-text-secondary);font-weight:600">全</div>
      </div>
      <span class="av-name" style="font-size:9px;color:${allSel?"#E8501A":""}">全員</span>
    </div>`;

    this.employees.forEach(emp => {
      const sel = this.selEmp === emp.employeeId;
      const c = this.getEmpColor(emp.employeeId);
      const init = emp.name.charAt(0);
      // 管理者はタップで詳細、それ以外はフィルター
      const tapFn = isAdmin
        ? `Screen.Calendar.showEmpDetail('${emp.employeeId}')`
        : `Screen.Calendar.selectEmp('${emp.employeeId}')`;
      html += `<div class="av-item" onclick="${tapFn}">
        <div class="av-ring${sel?" av-sel":""}">
          <div class="av-face" style="background:${c.bg};color:${c.tc}">${init}</div>
        </div>
        <span class="av-name" style="color:${sel?"#E8501A":""}">${emp.name.split(" ")[0]}</span>
      </div>`;
    });
    strip.innerHTML = html;
  },

  selectEmp(id) {
    this.selEmp = (this.selEmp === id) ? null : id;
    this.renderAvatars();
    this.renderCalendar();
    // 詳細パネルを閉じる
    const p = $("cal-emp-detail");
    if (p) p.style.display = "none";
  },



  renderCalendar() {
    const days = this.getDays();
    const wrap = $("cal-grid");
    if (!wrap) return;

    if (this.range === 1) {
      wrap.innerHTML = this.buildOneWeek(days);
    } else if (this.range === 2) {
      wrap.innerHTML = this.buildTwoWeek(days);
    } else {
      wrap.innerHTML = this.buildMiniCal(days);
    }
    this.updatePeriodLabel();
  },

  DN: ["日","月","火","水","木","金","土"],

  dayHeadCls(dow) {
    return dow === 0 ? "color:#E24B4A" : dow === 6 ? "color:#185FA5" : "color:var(--color-text-secondary)";
  },

  buildShiftChip(sh, showName = true) {
    const c = this.getEmpColor(sh.employeeId);
    const init = this.getEmpInit(sh.employeeId);
    return `<div class="shift-chip" style="background:${c.bg}">
      <div class="chip-av" style="background:${c.bg};color:${c.tc}">${init}</div>
      <div class="chip-info">
        ${showName ? `<span class="chip-name" style="color:${c.tc}">${sh.name.split(" ")[0]}</span>` : ""}
        <span class="chip-time" style="color:${c.tc}">${sh.startTime}〜${sh.endTime}</span>
      </div>
    </div>`;
  },

  buildTwoWeek(days) {
    let html = `<div class="two-week-wrap">`;
    for (let w = 0; w < 2; w++) {
      const week = days.slice(w * 7, w * 7 + 7);
      const wl = `${week[0].getMonth()+1}月${week[0].getDate()}日〜${week[6].getMonth()+1}月${week[6].getDate()}日`;
      html += `<div class="week-block"><div class="week-label-row">${wl}</div>`;
      html += `<div class="day-cols-7">`;
      week.forEach(d => {
        const cl = this.dayHeadCls(d.getDay());
        const isT = fmtDate(d) === todayJST();
        const numEl = isT
          ? `<span class="today-num">${d.getDate()}</span>`
          : `<span style="${cl}">${d.getDate()}</span>`;
        html += `<div class="day-head"><span class="dh-dn" style="${cl}">${this.DN[d.getDay()]}</span>${numEl}</div>`;
      });
      html += `</div><div class="day-cols-7">`;
      week.forEach(d => {
        const shifts = this.shiftsForDay(fmtDate(d));
        const ds = fmtDate(d);
        const canAdd = !Auth.isViewer();
        html += `<div class="day-cell-lg" onclick="Screen.Calendar.cellClick('${ds}',event)" style="cursor:pointer">`;
        shifts.slice(0, 2).forEach(sh => html += this.buildShiftChip(sh));
        if (shifts.length > 2) html += `<div class="more-lbl">+${shifts.length - 2}</div>`;
        if (canAdd && shifts.length === 0) html += `<div class="add-hint">＋</div>`;
        html += `</div>`;
      });
      html += `</div></div>`;
    }
    return html + `</div>`;
  },

  buildOneWeek(days) {
    const empList = this.selEmp !== null
      ? this.employees.filter(e => e.employeeId === this.selEmp)
      : this.employees;
    let html = `<div class="ow-wrap">`;
    html += `<div class="ow-head-row"><div class="ow-corner"></div>`;
    days.forEach(d => {
      const cl = this.dayHeadCls(d.getDay());
      const isT = fmtDate(d) === todayJST();
      html += `<div class="ow-head-day" style="${cl}">
        <span>${this.DN[d.getDay()]}</span>
        ${isT ? `<span class="today-num sm">${d.getDate()}</span>` : `<span style="font-size:14px;font-weight:500">${d.getDate()}</span>`}
      </div>`;
    });
    html += `</div>`;
    empList.forEach(emp => {
      const c = this.getEmpColor(emp.employeeId);
      html += `<div class="ow-row"><div class="ow-emp-cell">
        <div class="ow-av" style="background:${c.bg};color:${c.tc}">${emp.name.charAt(0)}</div>
        <span class="ow-emp-name">${emp.name.split(" ")[0]}</span>
      </div>`;
      days.forEach(d => {
        const sh = this.allSchedules.find(s => s.workDate === fmtDate(d) && s.employeeId === emp.employeeId
          && (this.selEmp === null || s.employeeId === this.selEmp));
        html += `<div class="ow-cell">`;
        if (sh) html += `<div class="ow-bar" style="background:${c.bg};color:${c.tc}">${sh.startTime}<br>${sh.endTime}<br><span style="font-size:8px">${sh.hours}h</span></div>`;
        html += `</div>`;
      });
      html += `</div>`;
    });
    return html + `</div>`;
  },

  buildMiniCal(days) {
    const refMonth = this.range === 4 ? this.getStart().getMonth() : -1;
    let html = `<div class="mini-cal-wrap">`;
    html += `<div class="day-cols-7 mini-head">`;
    this.DN.forEach((n, i) => {
      const cl = i === 0 ? "color:#E24B4A" : i === 6 ? "color:#185FA5" : "";
      html += `<div class="mini-head-cell" style="${cl}">${n}</div>`;
    });
    html += `</div>`;
    for (let row = 0; row < days.length / 7; row++) {
      html += `<div class="day-cols-7">`;
      for (let col = 0; col < 7; col++) {
        const d = days[row * 7 + col];
        const ds = fmtDate(d);
        const isOther = refMonth >= 0 && d.getMonth() !== refMonth;
        const shifts = this.shiftsForDay(ds);
        const isT = ds === todayJST();
        const cl = isOther ? "color:var(--color-border-secondary)"
          : d.getDay() === 0 ? "color:#E24B4A" : d.getDay() === 6 ? "color:#185FA5" : "color:var(--color-text-secondary)";
        const canAddMini = !Auth.isViewer();
        html += `<div class="day-cell-sm" ${canAddMini?`onclick="Screen.Calendar.cellClick('${ds}',event)" style="cursor:pointer"`:""}>`;
        html += isT
          ? `<div class="today-num mini">${d.getDate()}</div>`
          : `<div style="font-size:10px;font-weight:500;${cl};text-align:center;margin-bottom:2px">${d.getDate()}</div>`;
        shifts.slice(0, 3).forEach(sh => {
          const c = this.getEmpColor(sh.employeeId);
          html += `<div style="background:${c.bg};border-radius:3px;padding:1px 2px;margin-bottom:1px;display:flex;align-items:center;gap:2px">
            <div style="width:10px;height:10px;border-radius:50%;background:${c.bg};color:${c.tc};font-size:7px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0">${this.getEmpInit(sh.employeeId)}</div>
            <span style="font-size:7px;color:${c.tc};white-space:nowrap;overflow:hidden;flex:1">${sh.startTime}</span>
          </div>`;
        });
        if (shifts.length > 3) html += `<div style="font-size:8px;color:var(--color-text-secondary);text-align:center">+${shifts.length - 3}</div>`;
        html += `</div>`;
      }
      html += `</div>`;
    }
    return html + `</div>`;
  },

  setRange(r) {
    this.range = r;
    this.offsetWeeks = 0;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    document.querySelectorAll(".cal-rtab").forEach((b, i) => b.classList.toggle("active", [1,2,3,4][i] === r));
    this.renderCalendar();
  },
  navigate(dir) {
    if (this.range === 4) {
      this.currentMonth += dir;
      if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
      if (this.currentMonth < 0)  { this.currentMonth = 11; this.currentYear--; }
    } else {
      this.offsetWeeks += dir;
    }
    this.renderCalendar();
  },
  goToday() {
    this.offsetWeeks = 0;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.renderCalendar();
  },
};



// 管理者: 従業員詳細モーダル
Screen.Calendar.showEmpDetail = function(empId) {
  const emp = this.employees.find(e => e.employeeId === empId);
  if (!emp) return;
  const c = this.getEmpColor(empId);
  const shifts = this.allSchedules
    .filter(s => s.employeeId === empId)
    .sort((a, b) => a.workDate > b.workDate ? 1 : -1);
  const total = shifts.reduce((s, r) => s + r.hours, 0);

  const panel = $("cal-emp-detail");
  if (!panel) return;

  if (panel.dataset.empId === empId && panel.style.display !== "none") {
    panel.style.display = "none";
    panel.dataset.empId = "";
    this.selEmp = null;
    this.renderAvatars();
    this.renderCalendar();
    return;
  }

  this.selEmp = empId;
  this.renderAvatars();
  this.renderCalendar();
  panel.dataset.empId = empId;
  panel.style.display = "block";

  panel.innerHTML = `
    <div class="detail-card" style="margin-top:10px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:50%;background:${c.bg};color:${c.tc};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600">${emp.name.charAt(0)}</div>
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--color-text-primary)">${emp.name}</div>
          <div style="font-size:11px;color:var(--color-text-secondary)">合計 ${total.toFixed(1)}時間 / ${shifts.length}日登録</div>
        </div>
        <button onclick="$('cal-emp-detail').style.display='none';Screen.Calendar.selEmp=null;Screen.Calendar.renderAvatars();Screen.Calendar.renderCalendar();" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-text-secondary)">✕</button>
      </div>
      ${shifts.slice(0, 10).map(s => {
        const parts = (s.workDate||"").split("-");
        const mo = parseInt(parts[1])||1, dd = parseInt(parts[2])||1;
        const wd = new Date(parseInt(parts[0])||2026, mo-1, dd);
        const dns = ["日","月","火","水","木","金","土"];
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-top:0.5px solid #f0f0f0">
          <span style="font-size:12px;color:var(--color-text-secondary)">${mo}/${dd}（${dns[wd.getDay()]}）</span>
          <span style="font-size:12px;font-weight:600;color:var(--color-text-primary)">${(s.startTime||"").substring(0,5)}〜${(s.endTime||"").substring(0,5)}</span>
          <span style="font-size:11px;color:#E8501A;font-weight:600">${s.hours.toFixed(1)}h</span>
        </div>`;
      }).join("")}
      ${shifts.length > 10 ? `<div style="font-size:11px;color:var(--color-text-secondary);text-align:center;padding:6px 0">他 ${shifts.length-10} 件...</div>` : ""}
    </div>`;
};


// セルクリック：登録可能なら登録フォームへ
Screen.Calendar.cellClick = function(dateStr, e) {
  if (e) e.stopPropagation();
  if (!Auth.isViewer()) {
    Screen.Register.init({ workDate: dateStr });
    Router.go("screen-register");
  }
};

// カレンダーのセルから登録（後方互換）
Screen.Calendar.addFromCell = function(dateStr) {
  Screen.Register.init({ workDate: dateStr });
  Router.go("screen-register");
};

// ============================================================
//  Screen.AdminDashboard
// ============================================================
Screen.AdminDashboard = {
  async load() {
    const user = Auth.getUser();
    $("admin-dash-user").textContent = user.name;
    showLoading(true);
    try {
      const month = currentMonth();
      const sumRes = await API.getMonthlySummary(month);
      const summary = sumRes.data || [];
      const totalH = summary.reduce((s, r) => s + r.totalHours, 0);
      const headCount = summary.length;

      $("admin-head-count").textContent = `${headCount}人`;
      $("admin-total-hours").textContent = `${Math.round(totalH * 10) / 10}h`;
      $("admin-month-label").textContent = `${month.replace("-","年")}月`;

      // 従業員別ランキング
      const sorted = [...summary].sort((a, b) => b.totalHours - a.totalHours);
      $("admin-emp-summary").innerHTML = sorted.map((s, i) => `
        <div class="emp-row">
          <div class="emp-rank">${i + 1}</div>
          <div style="flex:1">
            <div class="emp-name">${s.name}</div>
            <div class="emp-sub">${s.days}日登録</div>
          </div>
          <span class="emp-total">${s.totalHours.toFixed(1)}h</span>
        </div>
      `).join("");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// ============================================================
//  Screen.AdminDate — 日付別一覧
// ============================================================
Screen.AdminDate = {
  // 過去〜未来まで全期間表示
  async load() {
    const from = fmtDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    const to   = fmtDate(new Date(new Date().setDate(new Date().getDate() + 60)));
    showLoading(true);
    try {
      const res = await API.getSchedulesByDate(from, to);
      const byDate = res.data || {};
      const dates = Object.keys(byDate).sort();

      $("admin-date-list").innerHTML = dates.length === 0
        ? `<p style="color:var(--color-text-secondary);font-size:13px;text-align:center;padding:20px 0">登録がありません</p>`
        : dates.map(ds => {
            const shifts = byDate[ds];
            const dayTotal = shifts.reduce((s, r) => s + r.hours, 0);
            return `<div class="date-group">
              <div class="date-group-head">
                <span class="date-group-title">${fmtJP(ds)}</span>
                <span class="date-badge">${shifts.length}人 / ${Math.round(dayTotal * 10) / 10}h</span>
              </div>
              ${shifts.map(r => adminScheduleItemHTML(r)).join("")}
            </div>`;
          }).join("");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// 管理者用スケジュール行（編集・削除ボタン付き）
function adminScheduleItemHTML(r) {
  const parts = (r.workDate || "").split("-");
  const y = parseInt(parts[0])||2026, mo = parseInt(parts[1])||1, dd = parseInt(parts[2])||1;
  const d = new Date(y, mo - 1, dd);
  const days = ["日","月","火","水","木","金","土"];
  const startDisp = (r.startTime||"").substring(0,5);
  const endDisp   = (r.endTime||"").substring(0,5);
  const tagCls = r.hours >= 7 ? "tag-full" : (r.endTime||"") <= "12:30" ? "tag-am" : (r.startTime||"") >= "12:30" ? "tag-pm" : "tag-custom";
  const tagLabel = r.hours >= 7 ? "1日" : (r.endTime||"") <= "12:30" ? "午前" : (r.startTime||"") >= "12:30" ? "午後" : "カスタム";

  return `<div class="schedule-item">
    <div class="sched-date-box">
      <span class="sched-month">${mo}月</span>
      <span class="sched-day">${dd}</span>
      <span class="sched-dow">${days[d.getDay()]}</span>
    </div>
    <div class="sched-info">
      <div class="sched-who">${r.name}</div>
      <div class="sched-time">${startDisp} 〜 ${endDisp}</div>
      <div class="sched-hours">${r.hours.toFixed(1)}時間${r.note ? " · " + r.note : ""}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <span class="sched-tag ${tagCls}">${tagLabel}</span>
      ${Auth.isAdmin() ? `
      <button class="btn-sm btn-outline" onclick="adminEditSchedule('${r.recordId}','${r.workDate}','${r.startTime}','${r.endTime}','${r.note||""}','${r.employeeId}','${r.name}')">編集</button>
      <button class="btn-sm btn-danger" onclick="adminDeleteSchedule('${r.recordId}')">削除</button>
      ` : ""}
    </div>
  </div>`;
}

// 管理者による編集
function adminEditSchedule(recordId, workDate, startTime, endTime, note, employeeId, name) {
  const newDate  = prompt("日付（例：2026-04-25）", workDate);
  if (!newDate) return;
  const newStart = prompt("開始時間（例：09:00）", startTime.substring(0,5));
  if (!newStart) return;
  const newEnd   = prompt("終了時間（例：17:00）", endTime.substring(0,5));
  if (!newEnd) return;
  const newNote  = prompt("備考（任意）", note);

  showLoading(true);
  API.updateSchedule({ recordId, workDate: newDate, startTime: newStart, endTime: newEnd, note: newNote || "" })
    .then(() => { Cache.clear(); showToast("更新しました"); Screen.AdminDate.load(); })
    .catch(e => showToast(e.message, "error"))
    .finally(() => showLoading(false));
}

// 管理者による削除
async function adminDeleteSchedule(recordId) {
  if (!confirm("この登録を削除しますか？")) return;
  showLoading(true);
  try {
    await API.deleteSchedule(recordId);
    Cache.clear();
    showToast("削除しました");
    Screen.AdminDate.load();
  } catch(e) {
    showToast(e.message, "error");
  } finally {
    showLoading(false);
  }
}

// ============================================================
//  Screen.AdminMonthly — 月別集計
// ============================================================
Screen.AdminMonthly = {
  month: currentMonth(),
  async load() {
    $("admin-monthly-month").value = this.month;
    showLoading(true);
    try {
      const res = await API.getMonthlySummary(this.month);
      const summary = res.data || [];
      const total = summary.reduce((s, r) => s + r.totalHours, 0);
      $("admin-monthly-total").textContent = `合計 ${Math.round(total * 10) / 10} 時間`;
      $("admin-monthly-list").innerHTML = summary.length === 0
        ? `<p style="color:var(--color-text-secondary);font-size:13px;text-align:center;padding:20px 0">登録がありません</p>`
        : summary.sort((a, b) => b.totalHours - a.totalHours).map(s => `
          <div class="emp-row">
            <div style="flex:1">
              <div class="emp-name">${s.name}</div>
              <div class="emp-sub">${s.days}日登録</div>
            </div>
            <span class="emp-total">${s.totalHours.toFixed(1)}h</span>
          </div>
        `).join("");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },
  changeMonth(val) { this.month = val; this.load(); }
};

// ============================================================
//  Screen.AdminEmployees — 従業員管理
// ============================================================
Screen.AdminEmployees = {
  async load() {
    showLoading(true);
    try {
      const res = await API.getEmployees();
      const emps = res.data || [];
      $("admin-emp-list").innerHTML = emps.map(emp => `
        <div class="emp-manage-row">
          <div style="flex:1">
            <div class="emp-name">${emp.name}</div>
            <div class="emp-sub">${emp.role === "admin" ? "管理者" : emp.role === "viewer" ? "閲覧のみ" : "一般従業員"}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn-sm btn-outline" onclick="Screen.AdminEmployees.editRole('${emp.employeeId}','${emp.name}','${emp.role}')">権限</button>
            <button class="btn-sm btn-danger" onclick="Screen.AdminEmployees.deleteEmp('${emp.employeeId}','${emp.name}')">削除</button>
          </div>
        </div>
      `).join("");
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },

  async addEmployee() {
    const name = $("new-emp-name").value.trim();
    const pass = $("new-emp-pass").value.trim();
    const role = $("new-emp-role").value;
    if (!name || !pass) { showToast("名前とパスワードを入力してください", "error"); return; }
    showLoading(true);
    try {
      await API.addEmployee({ name, password: pass, role });
      showToast("従業員を追加しました");
      $("new-emp-name").value = "";
      $("new-emp-pass").value = "";
      this.load();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },

  async editRole(empId, name, currentRole) {
    const roles = ["user", "viewer", "admin"];
    const labels = { user: "一般従業員", viewer: "閲覧のみ", admin: "管理者" };
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    if (!confirm(`${name} を「${labels[nextRole]}」に変更しますか？`)) return;
    const newRole = nextRole;
    showLoading(true);
    try {
      await API.updateEmployee({ employeeId: empId, role: newRole });
      showToast("権限を変更しました");
      this.load();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  },

  async deleteEmp(empId, name) {
    if (!confirm(`${name} を削除しますか？`)) return;
    showLoading(true);
    try {
      await API.deleteEmployee(empId);
      showToast("削除しました");
      this.load();
    } catch(e) {
      showToast(e.message, "error");
    } finally {
      showLoading(false);
    }
  }
};

// ============================================================
//  共通 — スケジュールアイテムHTML
// ============================================================
function scheduleItemHTML(r, compact = false, showActions = false, showName = false) {
  // タイムゾーンずれを防ぐためにYYYY-MM-DDを直接パース
  const parts = (r.workDate || "").split("-");
  const y = parseInt(parts[0])||2026, mo = parseInt(parts[1])||1, dd = parseInt(parts[2])||1;
  const d = new Date(y, mo - 1, dd);
  const days = ["日","月","火","水","木","金","土"];
  const tagCls = r.hours >= 7 ? "tag-full" : (r.endTime||"") <= "12:30" ? "tag-am" : (r.startTime||"") >= "12:30" ? "tag-pm" : "tag-custom";
  const tagLabel = r.hours >= 7 ? "1日" : (r.endTime||"") <= "12:30" ? "午前" : (r.startTime||"") >= "12:30" ? "午後" : "カスタム";
  const startDisp = (r.startTime||"").substring(0,5);
  const endDisp   = (r.endTime||"").substring(0,5);

  return `<div class="schedule-item">
    <div class="sched-date-box">
      <span class="sched-month">${mo}月</span>
      <span class="sched-day">${dd}</span>
      <span class="sched-dow">${days[d.getDay()]}</span>
    </div>
    <div class="sched-info">
      ${showName ? `<div class="sched-who">${r.name}</div>` : ""}
      <div class="sched-time">${startDisp} 〜 ${endDisp}</div>
      <div class="sched-hours">${r.hours.toFixed(1)}時間${r.note ? " · " + r.note : ""}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <span class="sched-tag ${tagCls}">${tagLabel}</span>
      ${showActions ? `
        <button class="btn-sm btn-outline" onclick="Screen.Register.init({recordId:'${r.recordId}',workDate:'${r.workDate}',startTime:'${r.startTime}',endTime:'${r.endTime}',note:'${r.note||""}'});Router.go('screen-register')">編集</button>
        <button class="btn-sm btn-danger" onclick="deleteSchedule('${r.recordId}')">削除</button>
      ` : ""}
    </div>
  </div>`;
}

async function deleteSchedule(recordId) {
  if (Auth.isViewer()) { showToast("閲覧のみモードでは削除できません", "error"); return; }
  if (!confirm("この登録を削除しますか？")) return;
  showLoading(true);
  try {
    await API.deleteSchedule(recordId);
    showToast("削除しました");
    Screen.MyList.load();
  } catch(e) {
    showToast(e.message, "error");
  } finally {
    showLoading(false);
  }
}

async function handleLogout() {
  showLoading(true);
  try {
    await API.logout();
  } finally {
    Auth.clear();
    showLoading(false);
    initApp();
  }
}


// ============================================================
//  パスワード表示切り替え
// ============================================================
function togglePass() {
  const inp = document.getElementById("login-pass");
  const btn = document.getElementById("pass-toggle");
  if (inp.type === "password") {
    inp.type = "text";
    btn.textContent = "隠す";
    btn.style.color = "#E8501A";
  } else {
    inp.type = "password";
    btn.textContent = "表示";
    btn.style.color = "#aaa";
  }
}

// ============================================================
//  キャッシュ — GASへのリクエストを減らして速度改善
// ============================================================
const Cache = {
  store: {},
  set(key, data, ttl = 30000) {
    this.store[key] = { data, expires: Date.now() + ttl };
  },
  get(key) {
    const item = this.store[key];
    if (!item || Date.now() > item.expires) return null;
    return item.data;
  },
  clear(prefix = "") {
    if (!prefix) { this.store = {}; return; }
    Object.keys(this.store).forEach(k => { if (k.startsWith(prefix)) delete this.store[k]; });
  }
};

// ============================================================
//  GASウォームアップ — 起動時にpingを送って速度改善
// ============================================================
function warmupGAS() {
  fetch(`${CONFIG.GAS_URL}?action=ping&token=`)
    .catch(() => {});
}

// ---------- 起動 ----------
document.addEventListener("DOMContentLoaded", () => { warmupGAS(); initApp(); });
