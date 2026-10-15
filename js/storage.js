/* ============================================================
   storage.js — 底层存储抽象（本版 localStorage）
   接入真实 API 时：service.js 内实现改为 HTTP 调用即可。
   ============================================================ */
(function (global) {
  'use strict';

  var PREFIX = 'ysyl_';

  var KEYS = {
    users: 'users',
    questions: 'questions',
    contents: 'contents',
    paidContents: 'paidContents',
    redeemCodes: 'redeemCodes',
    admins: 'admins',
    session: 'session',
    seeded: 'seeded'
  };

  function read(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function write(key, value) { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
  function readList(key) { return read(key) || []; }
  function writeList(key, list) { write(key, list); }

  function resetAll() {
    Object.keys(KEYS).forEach(function (k) { localStorage.removeItem(PREFIX + KEYS[k]); });
    if (global.Seed) global.Seed.seedIfNeeded();
  }

  global.Store = { KEYS: KEYS, read: read, write: write, readList: readList, writeList: writeList, resetAll: resetAll };
})(window);
