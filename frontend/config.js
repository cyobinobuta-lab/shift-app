// ============================================================
//  config.js — GASのURLをここだけ変える
// ============================================================
const CONFIG = {
  // GASをWebアプリとして公開したときのURLを貼り付ける
  GAS_URL: "https://script.google.com/macros/s/AKfycbxjQfkZ1dUsFA1FZwXMBWw2j-NRFDzNi5sLJcKHZRhX1wbqsABwNI1SH8Nb_zLRjYMg/exec",

  // クイック登録の時間設定
  QUICK_PRESETS: [
    { label: "1日",    icon: "sun",     start: "09:00", end: "17:00" },
    { label: "午前",   icon: "sunrise", start: "09:00", end: "12:00" },
    { label: "午後",   icon: "sunset",  start: "13:00", end: "17:00" },
    { label: "手動",   icon: "edit",    start: "",      end: ""      },
  ]
};
