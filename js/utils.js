/* ============================================================
   utils.js — 纯工具函数
   ============================================================ */
(function (global) {
  'use strict';

  var SIGN_LIST = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];

  var STATUS = {
    pending:  { label: '待审核', cls: 'st-pending' },
    approved: { label: '待回复', cls: 'st-approved' },
    answered: { label: '已回复', cls: 'st-answered' },
    rejected: { label: '已拒绝', cls: 'st-rejected' }
  };

  var CONTENT_TYPES = {
    article: { label: '图文', cls: 'type-article' },
    video:   { label: '视频', cls: 'type-video' }
  };

  var REJECT_TEMPLATES = ['超出答疑边界', '信息不完整', '重复提问', '涉及隐私敏感信息', '表述不清，请补充细节'];

  function statusLabel(s) { return (STATUS[s] && STATUS[s].label) || s || ''; }
  function statusCls(s) { return (STATUS[s] && STATUS[s].cls) || ''; }
  function typeLabel(t) { return (CONTENT_TYPES[t] && CONTENT_TYPES[t].label) || t || ''; }
  function typeCls(t) { return (CONTENT_TYPES[t] && CONTENT_TYPES[t].cls) || ''; }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function downloadCsv(filename, rows) {
    var esc = function (v) {
      v = (v === null || v === undefined) ? '' : String(v);
      if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
      return v;
    };
    var csv = rows.map(function (r) { return r.map(esc).join(','); }).join('\r\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  global.Utils = {
    SIGN_LIST: SIGN_LIST, STATUS: STATUS, CONTENT_TYPES: CONTENT_TYPES, REJECT_TEMPLATES: REJECT_TEMPLATES,
    statusLabel: statusLabel, statusCls: statusCls, typeLabel: typeLabel, typeCls: typeCls,
    escapeHtml: escapeHtml, fmt: fmt, fmtDate: fmtDate, uid: uid, toast: toast, downloadCsv: downloadCsv
  };
})(window);
