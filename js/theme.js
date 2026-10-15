/* ============================================================
   theme.js — 深色/浅色主题切换
   选择存 localStorage（ysyl_theme），图标：上半太阳 / 下半月亮
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'ysyl_theme';

  function current() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
  }
  function apply() { document.documentElement.setAttribute('data-theme', current()); }
  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    document.documentElement.setAttribute('data-theme', next);
    return next;
  }

  // 上半太阳 / 下半月亮 图标（currentColor 随文字色）
  function iconSVG(size) {
    var s = size || 18;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round">'
      + '<line x1="12" y1="2.5" x2="12" y2="4.8"/>'
      + '<line x1="6.2" y1="4.6" x2="7.6" y2="6.6"/>'
      + '<line x1="17.8" y1="4.6" x2="16.4" y2="6.6"/>'
      + '</g>'
      + '<path d="M7.2 11 A4.8 4.8 0 0 1 16.8 11 Z" fill="currentColor"/>'
      + '<line x1="2" y1="12.6" x2="22" y2="12.6" stroke="currentColor" stroke-width="1.3"/>'
      + '<path d="M15.1 13.8 A4.1 4.1 0 1 0 15.1 21.4 A3.2 3.2 0 1 1 15.1 13.8 Z" fill="currentColor"/>'
      + '</svg>';
  }

  global.Theme = { current: current, apply: apply, toggle: toggle, iconSVG: iconSVG };
})(window);
