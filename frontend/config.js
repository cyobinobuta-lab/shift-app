// ============================================================
//  config.js — GASのURLをここだけ変える
// ============================================================
const CONFIG = {
  // GASをWebアプリとして公開したときのURLを貼り付ける
  GAS_URL: "https://script.google.com/macros/library/d/1P-1MpdMihADgrzgeEsS90kTRxQcgMfOqmFLNAuSwOPo6W57EEFCSDkfq/3",

  // クイック登録の時間設定
  QUICK_PRESETS: [
    { label: "1日",    icon: "sun",     start: "09:00", end: "17:00" },
    { label: "午前",   icon: "sunrise", start: "09:00", end: "12:00" },
    { label: "午後",   icon: "sunset",  start: "13:00", end: "17:00" },
    { label: "手動",   icon: "edit",    start: "",      end: ""      },
  ]
};
