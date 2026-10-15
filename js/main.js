/* ============================================================
   main.js — 启动入口
   ============================================================ */
(function (global) {
  'use strict';
  global.Seed.seedIfNeeded();
  global.Issue.apply();
  global.Router.start();
})(window);
