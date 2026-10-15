/* ============================================================
   issue.js — 星座月刊系统
   期号 = 星座月（按公历日期自动切换，运营可后台覆盖）
   每月一组视觉变量（主题色）+ 卷首语 + 星盘圆母题 SVG。
   换期号只换变量与封面，不改页面结构。
   ============================================================ */
(function (global) {
  'use strict';

  // 12 期：sign 星座 / glyph 符号 / start 起始月日 / accent 主题色 / deep 深色 / motto 默认卷首语
  var ISSUES = [
    { sign: '白羊', glyph: '\u2648', start: [3, 21],  accent: '#C0533A', deep: '#8F3A28', motto: '勇敢不是不怕，是怕了也先迈出那一步。' },
    { sign: '金牛', glyph: '\u2649', start: [4, 20],  accent: '#5F7350', deep: '#43533A', motto: '慢慢来的东西，才真正属于你。' },
    { sign: '双子', glyph: '\u264A', start: [5, 21],  accent: '#C29A3E', deep: '#8F6F2A', motto: '好奇心走到哪里，路就铺到哪里。' },
    { sign: '巨蟹', glyph: '\u264B', start: [6, 22],  accent: '#6E8FA3', deep: '#4E6878', motto: '先安顿好自己的心，再照顾全世界。' },
    { sign: '狮子', glyph: '\u264C', start: [7, 23],  accent: '#C77F2E', deep: '#93591F', motto: '把光用在该用的地方，你就是自己的太阳。' },
    { sign: '处女', glyph: '\u264D', start: [8, 23],  accent: '#857A55', deep: '#5E553B', motto: '把紧绷的弦松半寸，日子才弹得出声。' },
    { sign: '天秤', glyph: '\u264E', start: [9, 23],  accent: '#B4835A', deep: '#85603F', motto: '好的关系，是两个人都不必委屈自己。' },
    { sign: '天蝎', glyph: '\u264F', start: [10, 24], accent: '#5A4468', deep: '#3E2F4B', motto: '敢直视深渊的人，才配得上真正的亲密。' },
    { sign: '射手', glyph: '\u2650', start: [11, 23], accent: '#3F6E8C', deep: '#2C4E64', motto: '远方不在地图上，在你肯出发的那一刻。' },
    { sign: '摩羯', glyph: '\u2651', start: [12, 22], accent: '#4E5A48', deep: '#384135', motto: '山顶不催你，它只等一直走的人。' },
    { sign: '水瓶', glyph: '\u2652', start: [1, 20],  accent: '#3E7C7B', deep: '#2C5857', motto: '和别人不一样，恰恰是你的用处。' },
    { sign: '双鱼', glyph: '\u2653', start: [2, 19],  accent: '#5E7BA6', deep: '#425873', motto: '柔软不是软弱，是装得下更多心事的海。' }
  ];

  function autoSign(date) {
    var m = date.getMonth() + 1, d = date.getDate();
    var cur = ISSUES[0];
    // 找出 start <= (m,d) 的最后一期（按年序）
    var best = null;
    ISSUES.forEach(function (it) {
      var sm = it.start[0], sd = it.start[1];
      if (m > sm || (m === sm && d >= sd)) { if (!best || sm > best.start[0] || (sm === best.start[0] && sd >= best.start[1])) best = it; }
    });
    // 跨年：摩羯(12/22) 与 1 月 1 日-1 月 19 日之间
    if (!best) best = ISSUES[9]; // 摩羯
    return best.sign;
  }

  function resolve() {
    var now = new Date();
    var settings = (global.DataService && global.DataService.getIssueSettingsSync)
      ? global.DataService.getIssueSettingsSync() : { sign: 'auto', motto: '' };
    var sign = (settings && settings.sign && settings.sign !== 'auto') ? settings.sign : autoSign(now);
    var def = ISSUES.filter(function (i) { return i.sign === sign; })[0] || ISSUES[6];
    var ym = now.getFullYear() + '.' + ('0' + (now.getMonth() + 1)).slice(-2);
    return {
      sign: def.sign,
      glyph: def.glyph + '︎',
      accent: def.accent,
      deep: def.deep,
      label: def.sign + '月号',
      ym: ym,
      motto: (settings && settings.motto) ? settings.motto : def.motto,
      overridden: !!(settings && settings.sign && settings.sign !== 'auto')
    };
  }

  function apply() {
    var it = resolve();
    var r = document.documentElement.style;
    r.setProperty('--accent', it.accent);
    r.setProperty('--accent-deep', it.deep);
    r.setProperty('--tint', it.accent + '1F'); // 12% 透明度
    global.__ISSUE = it;
    return it;
  }

  function current() { return global.__ISSUE || apply(); }

  // ================= 星盘圆（全站视觉母题） =================
  // 生成星盘 SVG：外圈 12 等分刻度 + 星座符号 + 内圈 + 相位线 + 中心当月符号
  function chartSVG(size, opts) {
    opts = opts || {};
    var it = current();
    var a = it.accent, deep = it.deep;
    var cx = 200, cy = 200, R1 = 192, R2 = 158, R3 = 108;
    var parts = [];
    parts.push('<svg viewBox="0 0 400 400" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    // 外圈
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R1 + '" fill="none" stroke="' + a + '" stroke-width="1.6"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R2 + '" fill="none" stroke="' + a + '" stroke-width=".7" opacity=".65"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R3 + '" fill="none" stroke="' + a + '" stroke-width=".9" opacity=".8"/>');
    // 12 等分刻度 + 符号
    var glyphs = ISSUES.map(function (i) { return i.glyph + '︎'; });
    for (var k = 0; k < 12; k++) {
      var ang = -90 + k * 30, rad = ang * Math.PI / 180;
      var x1 = cx + R2 * Math.cos(rad), y1 = cy + R2 * Math.sin(rad);
      var x2 = cx + R1 * Math.cos(rad), y2 = cy + R1 * Math.sin(rad);
      var isCur = ISSUES[k].sign === it.sign;
      parts.push('<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + (isCur ? deep : a) + '" stroke-width="' + (isCur ? 3 : 1) + '" opacity="' + (isCur ? 1 : .55) + '"/>');
      var gx = cx + ((R1 + R2) / 2 + 1) * Math.cos(rad + Math.PI / 12);
      var gy = cy + ((R1 + R2) / 2 + 1) * Math.sin(rad + Math.PI / 12);
      parts.push('<text x="' + gx.toFixed(1) + '" y="' + gy.toFixed(1) + '" font-size="15" font-family="Segoe UI Symbol,Noto Sans Symbols 2,sans-serif" fill="' + (isCur ? deep : a) + '" opacity="' + (isCur ? 1 : .6) + '" text-anchor="middle" dominant-baseline="central">' + glyphs[k] + '</text>');
    }
    // 相位线（内圈上的和弦：三分相三角 + 几条弦）
    function pt(deg, r) { var rd = deg * Math.PI / 180; return [cx + r * Math.cos(rd), cy + r * Math.sin(rd)]; }
    var curIdx = 0;
    ISSUES.forEach(function (i, ix) { if (i.sign === it.sign) curIdx = ix; });
    var base = -90 + curIdx * 30 + 15;
    var p1 = pt(base, R3), p2 = pt(base + 120, R3), p3 = pt(base + 240, R3);
    parts.push('<polygon points="' + p1.join(',') + ' ' + p2.join(',') + ' ' + p3.join(',') + '" fill="none" stroke="' + deep + '" stroke-width="1" opacity=".55"/>');
    var q1 = pt(base + 60, R3), q2 = pt(base + 210, R3), q3 = pt(base + 300, R3);
    parts.push('<line x1="' + q1[0].toFixed(1) + '" y1="' + q1[1].toFixed(1) + '" x2="' + q2[0].toFixed(1) + '" y2="' + q2[1].toFixed(1) + '" stroke="' + a + '" stroke-width=".7" opacity=".4"/>');
    parts.push('<line x1="' + q3[0].toFixed(1) + '" y1="' + q3[1].toFixed(1) + '" x2="' + q1[0].toFixed(1) + '" y2="' + q1[1].toFixed(1) + '" stroke="' + a + '" stroke-width=".7" opacity=".4"/>');
    // 中心：当月符号
    if (!opts.bare) {
      parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="30" fill="' + a + '" opacity=".14"/>');
      parts.push('<text x="' + cx + '" y="' + cy + '" font-size="34" font-family="Segoe UI Symbol,Noto Sans Symbols 2,sans-serif" fill="' + deep + '" text-anchor="middle" dominant-baseline="central">' + it.glyph + '</text>');
    }
    parts.push('</svg>');
    return parts.join('');
  }

  // 小号圆点装饰（分隔用）
  function dotSVG(size, color) {
    return '<svg viewBox="0 0 10 10" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="5" cy="5" r="3.2" fill="none" stroke="' + (color || current().accent) + '" stroke-width="1.2"/></svg>';
  }

  global.Issue = { apply: apply, current: current, chartSVG: chartSVG, dotSVG: dotSVG, ISSUES: ISSUES };
})(window);
