/* ============================================================
   views-site.js — 用户前端视图与交互
   首页 / 内容 / 内容详情 / 付费墙 / 活动占位 / 答疑
   ============================================================ */
(function (global) {
  'use strict';

  var U = global.Utils;
  var DS = global.DataService;
  var Auth = global.Auth;

  function $(sel) { return document.querySelector(sel); }
  function val(sel) { var el = $(sel); return el ? el.value : ''; }
  function esc(s) { return U.escapeHtml(s); }

  function navbar(title, rightHtml, back) {
    var backBtn = back === false ? '' : '<button class="back" onclick="Router.back()">‹</button>';
    return '<div class="navbar">' + backBtn
      + '<div class="title">' + esc(title) + '</div>'
      + '<div class="right">' + (rightHtml || '') + '</div></div>';
  }

  function statusTag(status) { return '<span class="status ' + U.statusCls(status) + '">' + U.statusLabel(status) + '</span>'; }
  function visTag(v) { return '<span class="vis-tag">' + (v === 'public' ? '公开' : '私密') + '</span>'; }
  function typeTag(t) { return '<span class="type-tag ' + U.typeCls(t) + '">' + U.typeLabel(t) + '</span>'; }

  function signOptions(selected) {
    var opts = '<option value="">请选择</option>';
    U.SIGN_LIST.forEach(function (s) {
      opts += '<option value="' + s + '"' + (s === selected ? ' selected' : '') + '>' + s + '</option>';
    });
    return opts;
  }

  function contentCover(c) {
    var inner;
    if (c.type === 'video') inner = '<div class="play"></div>';
    else inner = '<div class="cc-glyph">' + global.Issue.current().glyph + '</div>';
    return '<div class="content-cover">' + inner + '</div>';
  }

  function contentCard(c) {
    return '<a class="content-card" href="#/content/' + c.id + '">'
      + contentCover(c)
      + '<div class="content-body">'
      + '<div class="content-title">' + esc(c.title) + '</div>'
      + '<div class="content-summary">' + esc(c.summary) + '</div>'
      + '<div class="content-meta">' + typeTag(c.type) + '<span>' + esc(c.author) + '</span><span style="margin-left:auto">' + U.fmtDate(c.updatedAt) + '</span></div>'
      + '</div></a>';
  }

  // ================= 首页（月刊封面） =================
  var SIGN_EN = { '白羊': 'ARIES', '金牛': 'TAURUS', '双子': 'GEMINI', '巨蟹': 'CANCER', '狮子': 'LEO', '处女': 'VIRGO', '天秤': 'LIBRA', '天蝎': 'SCORPIO', '射手': 'SAGITTARIUS', '摩羯': 'CAPRICORN', '水瓶': 'AQUARIUS', '双鱼': 'PISCES' };

  async function renderHome() {
    var s = Auth.getSession();
    var it = global.Issue.current();
    var authHtml = s && s.role === 'user'
      ? '<span class="r" onclick="Router.go(\'#/me\')">我的</span>'
      : '<span class="r" onclick="Router.go(\'#/login\')">登录</span>';

    var user = s && s.role === 'user' ? await DS.getUserById(s.userId) : null;
    var sunSign = user ? (user.sunSign || '') : '';
    var risingSign = user ? (user.risingSign || '') : '';

    // 栏目导向（五个圆）
    var circles = [
      ['测', '测一测', '#/test'],
      ['看', '药寮方', '#/content'],
      ['问', '来问', '#/qa'],
      ['学', '良方铺', '#/paid'],
      ['聚', '活动', '#/activity']
    ].map(function (c) {
      return '<div class="nav-circle" onclick="Router.go(\'' + c[2] + '\')"><div class="nc-o">' + c[0] + '</div><div class="nc-l">' + c[1] + '</div></div>';
    }).join('');

    // 本月推荐：测试
    var tests = global.Quiz.listTests().filter(function (x) { return x.status !== 'soon'; });
    var testHtml = tests.map(function (x) {
      return '<div class="test-card" onclick="Router.go(\'#/test/' + x.id + '\')">'
        + '<div class="tc-badge">' + esc(x.badge) + '</div>'
        + '<div class="tc-title">' + esc(x.title) + '</div>'
        + '<div class="tc-sub">' + esc(x.sub) + '</div>'
        + '<div class="tc-meta">' + esc(x.meta) + '<span class="tc-go">开始 ›</span></div>'
        + '</div>';
    }).join('');

    // 专属推荐：按用户太阳/上升星座匹配内容标签
    var recommendHtml = '';
    if (sunSign || risingSign) {
      var rec = await DS.listRecommendedContents(sunSign, risingSign);
      if (rec.length) {
        var recTitle = '专属推荐';
        if (sunSign && risingSign) { recTitle = '太阳' + sunSign + ' · 上升' + risingSign; }
        else if (sunSign) { recTitle = '太阳' + sunSign; }
        else if (risingSign) { recTitle = '上升' + risingSign; }
        recommendHtml = '<div class="sec-head"><span class="t">' + recTitle + '</span></div>' + rec.map(contentCard).join('');
      }
    }

    // 最近内容（刊物索引）
    var latest = (await DS.listPublishedContents()).slice(0, 3);
    var idxHtml = latest.map(function (c, i) {
      return '<div class="idx-row" onclick="Router.go(\'#/content/' + c.id + '\')">'
        + '<span class="n">' + ('0' + (i + 1)).slice(-2) + '</span>'
        + '<div style="flex:1;min-width:0"><div class="tt">' + esc(c.title) + '</div><div class="ss">' + esc(c.summary) + '</div></div>'
        + '<span class="d">' + U.fmtDate(c.updatedAt) + '</span></div>';
    }).join('');

    return '<div class="masthead">'
      + '<div class="mh-top"><span>' + it.ym + ' · 月刊</span>' + authHtml + '</div>'
      + '<div class="mh-name">鱼三药寮屋</div>'
      + '<div class="mh-issue"><span>' + it.sign + '月 · ' + it.range + '</span></div>'
      + '</div>'
      + '<div class="cover">'
      + '<div class="chart">' + global.Issue.chartSVG(430) + '</div>'
      + '<div class="c-sign"><div class="cs-glyph">' + it.glyph + '</div><div class="cs-month">' + it.sign + '月</div><div class="cs-en">' + (SIGN_EN[it.sign] || '') + ' SEASON</div></div>'
      + '<div class="c-slogan">把心事，说给星星听</div>'
      + '</div>'
      + '<div class="motto">'
      + '<div class="m-text">「' + esc(it.motto) + '」</div>'
      + '<div class="m-by">本月首语 · 十三</div>'
      + '</div>'
      + '<div class="nav-circles">' + circles + '</div>'
      + '<div class="page">'
      + '<div class="sec-head"><span class="t">本月推荐</span></div>'
      + testHtml
      + recommendHtml
      + '<div class="sec-head"><span class="t">最近内容</span></div>'
      + idxHtml
      + '<div style="text-align:center;margin-top:16px"><span style="font-size:12px;color:var(--ink-3);cursor:pointer;letter-spacing:2px" onclick="Router.go(\'#/content\')">全部内容 ›</span></div>'
      + '</div>';
  }
  // ================= 登录 =================
  function renderLogin() {
    return '<div class="auth-wrap">'
      + '<div class="logo"><div class="t">鱼三药寮屋</div><div class="s">用户登录</div></div>'
      + '<div class="form-group"><label>昵称</label><input type="text" id="nickname" placeholder="输入任意昵称进入"></div>'
      + '<button class="btn btn-primary" onclick="SiteActions.login()">进入</button>'
      + '<div style="height:12px"></div>'
      + '<button class="btn btn-ghost" onclick="SiteActions.loginWechat()">微信授权登录（预留）</button>'
      + '<div class="hint-list">本版为本地演示：<br>· 输入任意昵称即可进入，无需手机号；<br>· 演示昵称：小满 / Luna / 阿星（可查看预置数据）；<br>· 也可输入新昵称走完整「提问→审核→回复」流程。</div>'
      + '<div style="height:12px"></div>'
      + '<button class="btn btn-ghost" onclick="Router.go(\'#/\')">返回首页</button>'
      + '</div>';
  }

  // ================= 内容列表 =================
  async function renderContentList() {
    var list = await DS.listPublishedContents();
    var body = list.length ? list.map(contentCard).join('') : '<div class="empty">暂无内容</div>';
    return navbar('药寮方 · 内容', '') + '<div class="page">' + body + '</div>';
  }

  // ================= 内容详情 =================
  async function renderContentDetail(id) {
    var c = await DS.getPublishedContent(id);
    if (!c) { return navbar('内容详情', '') + '<div class="page"><div class="empty">内容不存在或已下架</div></div>'; }

    var body;
    if (c.type === 'article') {
      body = '<div class="article-body">' + esc(c.body) + '</div>';
    } else {
      body = '<div class="placeholder-panel">'
        + '<div class="p-title">视频内容接入中</div>'
        + '<div style="margin-top:8px">本内容将通过第三方平台（视频号 / 千聊 / 小鹅通）嵌入</div>'
        + '<div class="small" style="margin-top:12px">' + esc(c.summary) + '</div>'
        + '</div>';
    }

    return navbar('内容详情', '')
      + '<div class="page"><div class="card">'
      + '<div class="detail-meta">' + typeTag(c.type) + '<span class="li-nick">' + esc(c.author) + '</span><span class="small muted" style="margin-left:auto">' + U.fmt(c.updatedAt) + '</span></div>'
      + '<div class="h2" style="margin-bottom:14px">' + esc(c.title) + '</div>'
      + body
      + '</div></div>';
  }

  // ================= 良方铺（付费阶梯预告） =================
  async function renderPaid() {
    var tiers = [
      ['01', '小额单品', '一篇深度长文、一份月度指南，¥9.9 – 29.9 随手带走'],
      ['02', '付费视频', '主题视频内容，第三方平台观看'],
      ['03', '付费课程', '系统小课，学会看懂自己的星图'],
      ['04', '订阅会员', '每月更新，长期陪伴的基本盘']
    ];
    var tierHtml = tiers.map(function (x) {
      return '<div class="paid-card">'
        + '<div class="pc-cover">' + x[0] + '</div>'
        + '<div class="pc-body">'
        + '<div class="pc-title">' + x[1] + '</div>'
        + '<div class="pc-summary">' + x[2] + '</div>'
        + '<div class="pc-foot"><span class="lock-tag">即将上线</span></div>'
        + '</div></div>';
    }).join('');

    var list = await DS.listPaidContents();
    var previewHtml = '';
    if (list.length) {
      var cards = list.map(function (p) {
        return '<div class="paid-card" onclick="SiteActions.paidHint()">'
          + '<div class="pc-cover">' + esc(p.type === 'course' ? '课程' : p.type === 'consult' ? '咨询' : p.type === 'column' ? '专栏' : '回放') + '</div>'
          + '<div class="pc-body">'
          + '<div class="pc-title">' + esc(p.title) + '</div>'
          + '<div class="pc-summary">' + esc(p.summary) + '</div>'
          + '<div class="pc-foot"><span class="price">' + esc(p.price) + '</span><span class="lock-tag">未解锁</span></div>'
          + '</div></div>';
      }).join('');
      previewHtml = '<div class="sec-head"><span class="t">铺内预览</span></div>' + cards;
    }

    return navbar('良方铺', '')
      + '<div class="page">'
      + '<div class="test-hero" style="padding:24px 0 2px"><div class="th-title" style="font-size:22px">良方铺</div><div class="th-sub">知识付费内容即将上线，阶梯先睹为快</div></div>'
      + '<div class="sec-head"><span class="t">上架预告</span></div>'
      + tierHtml
      + previewHtml
      + '</div>';
  }
  // ================= 活动 =================
  async function renderActivity() {
    return navbar('活动', '')
      + '<div class="page">'
      + '<div class="test-hero" style="padding:24px 0 4px"><div class="th-title" style="font-size:22px">活动</div><div class="th-sub">线下沙龙与活动宣发</div></div>'
      + '<div class="placeholder-panel">'
      + '<div class="p-title">第一场线下沙龙，筹备中</div>'
      + '<div style="margin-top:8px">从线上到线下，想和你真正见一面。</div>'
      + '<div class="small" style="margin-top:12px">时间地点确定后，将在这里第一时间发布</div>'
      + '</div>'
      + '<div class="sec-head"><span class="t">报名与咨询</span></div>'
      + '<div class="card" style="text-align:center">'
      + '<div class="sub" style="margin-bottom:14px">活动报名信息将通过企业微信发布<br>添加企业微信，第一时间收到邀请</div>'
      + '<button class="btn btn-primary" onclick="SiteActions.wecomHint()">添加企业微信</button>'
      + '</div></div>';
  }
  // ================= 测一测（测试中心） =================
  var QuizState = { testId: null, idx: 0, answers: [] };
  function currentTest() { return global.Quiz.getTest(QuizState.testId); }

  // ---------- 测试列表页 ----------
  function renderTest() {
    QuizState.testId = null;
    var tests = global.Quiz.listTests();
    var cards = tests.map(function (t) {
      if (t.status === 'soon') {
        return '<div class="test-card soon"><div class="tc-badge">' + esc(t.badge) + '</div><div class="tc-title">' + esc(t.title) + '</div><div class="tc-sub">' + esc(t.sub) + '</div><div class="tc-soon">敬请期待</div></div>';
      }
      return '<div class="test-card" onclick="Router.go(\'#/test/' + t.id + '\')">'
        + '<div class="tc-badge">' + esc(t.badge) + '</div>'
        + '<div class="tc-title">' + esc(t.title) + '</div>'
        + '<div class="tc-sub">' + esc(t.sub) + '</div>'
        + '<div class="tc-meta">' + esc(t.meta) + '<span class="tc-go">开始 ›</span></div>'
        + '</div>';
    }).join('');
    return navbar('测一测', '')
      + '<div class="quiz-wrap">'
      + '<div class="test-hero"><div class="th-title">本月推荐</div><div class="th-sub">看见自己，从一次测试开始</div></div>'
      + cards
      + '</div>';
  }

  // ---------- 单个测试运行页（骨架） ----------
  function renderTestRun(testId) {
    var test = global.Quiz.getTest(testId);
    QuizState.testId = test ? testId : null;
    if (!test) {
      return navbar('测一测', '') + '<div class="page"><div class="empty">测试不存在或已下架</div></div>';
    }
    return navbar(test.title, '')
      + '<div class="quiz-wrap">'
      + '<div class="quiz-progress"><div class="quiz-bar" id="quizBar"></div></div>'
      + '<div class="quiz-body" id="quizBody"></div>'
      + '</div>';
  }

  // ---------- 介绍块渲染器（支持 items / levels / text） ----------
  function renderIntroBlock(b) {
    if (b.type === 'items') {
      return '<div class="qi-block"><div class="qi-h">' + esc(b.h) + '</div>' + b.items.map(function (it) {
        return '<div class="qi-item"><b>' + esc(it[0]) + '</b><span>' + esc(it[1]) + '</span></div>';
      }).join('') + '</div>';
    }
    if (b.type === 'levels') {
      return '<div class="qi-block"><div class="qi-h">' + esc(b.h) + '</div>' + b.rows.map(function (r) {
        return '<div class="qi-level-row"><span class="ql-dot lv-' + r[0] + '">' + r[0].toUpperCase() + '</span><div><b>' + esc(r[1]) + '</b>　' + esc(r[2]) + '</div></div>';
      }).join('') + '</div>';
    }
    if (b.type === 'text') {
      return '<div class="qi-block"><div class="qi-h">' + esc(b.h) + '</div><div class="qi-text">' + esc(b.text) + '</div></div>';
    }
    return '';
  }

  // ---------- 介绍页 ----------
  function renderQuizIntro(test) {
    var blocks = (test.intro || []).map(renderIntroBlock).join('');
    var html = '<div class="quiz-intro">'
      + '<div class="qi-title">' + esc(test.title) + '</div>'
      + '<div class="qi-sub">' + esc(test.sub) + '</div>'
      + blocks
      + '<div class="qi-note">' + esc(test.introNote || '') + '</div>'
      + '<button class="btn btn-primary" onclick="SiteActions.quizStart()">开始测试</button>'
      + '</div>';
    document.getElementById('quizBody').innerHTML = html;
    document.getElementById('quizBar').parentNode.style.display = 'none';
    window.scrollTo(0, 0);
  }

  // ---------- 答题页 ----------
  function renderQuizQuestion(test) {
    var qs = test.questions;
    var q = qs[QuizState.idx];
    var qd = test.quadrants[q.d];
    var opts = q.opts.map(function (o, i) {
      return '<div class="quiz-opt" onclick="SiteActions.quizAnswer(' + i + ')">' + esc(o) + '</div>';
    }).join('');
    document.getElementById('quizBody').innerHTML =
      '<div class="quiz-q-tag">' + esc(qd.label) + ' · ' + esc(qd.desc) + '</div>'
      + '<div class="quiz-q">' + esc(q.q) + '</div>'
      + '<div class="quiz-opts">' + opts + '</div>'
      + '<div class="quiz-count">第 ' + (QuizState.idx + 1) + ' / ' + qs.length + ' 题</div>';
    document.getElementById('quizBar').style.width = Math.round(QuizState.idx / qs.length * 100) + '%';
  }

  // ---------- 结果页 ----------
  function renderQuizResult(test) {
    var Q = global.Quiz;
    var levels = test.score(QuizState.answers);
    var tension = test.coreTension(levels);
    var actions = test.prescriptions(levels);
    var html = '<div class="quiz-result">'
      + '<div class="qr-title">' + esc(test.reportTitle) + '</div>'
      + '<div class="qr-sub">' + esc(test.title) + ' · 诊断报告</div>';
    test.quadOrder.forEach(function (d) {
      var qd = test.quadrants[d];
      var lv = levels[d];
      html += '<div class="qr-quad">'
        + '<div class="qr-qhead"><span class="qr-qname">' + esc(qd.label) + '</span><span class="qr-level lv-' + lv + '">' + lv.toUpperCase() + ' · ' + Q.LEVEL_NAME[lv] + '</span></div>'
        + '<div class="qr-qdesc">' + esc(qd.levels[lv]) + '</div>'
        + '</div>';
    });
    html += '<div class="qr-tension"><div class="qr-section-t">核心矛盾</div>' + esc(tension) + '</div>';
    if (actions.length) {
      html += '<div class="qr-section-t" style="margin-top:16px">本月行动（本周就能做）</div>';
      actions.forEach(function (a, i) {
        html += '<div class="qr-action"><span class="qr-an">' + (i + 1) + '</span>' + esc(a.text) + '</div>';
      });
    }
    html += '<div class="qr-hook">这个坐标，画出了你此刻的样貌。但你为什么会这样，答案往往写在更深的地方——来「来问」找飞鱼十三香聊聊，从你的星盘里，看见这些模式的来源。</div>'
      + '<div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" onclick="SiteActions.quizCopy()">复制报告</button><button class="btn btn-ghost" onclick="SiteActions.quizRestart()">重新测试</button></div>'
      + '<div style="height:12px"></div><button class="btn btn-ghost" onclick="Router.go(\'#/test\')">返回测试中心</button>'
      + '</div>';
    document.getElementById('quizBody').innerHTML = html;
    document.getElementById('quizBar').style.width = '100%';
    window.scrollTo(0, 0);
  }

  function quizReportText(test) {
    var Q = global.Quiz;
    var levels = test.score(QuizState.answers);
    var lines = ['【' + test.reportTitle + '】'];
    test.quadOrder.forEach(function (d) {
      lines.push(test.quadrants[d].label + '：' + levels[d].toUpperCase() + ' ' + Q.LEVEL_NAME[levels[d]]);
    });
    lines.push('');
    lines.push('核心矛盾：' + test.coreTension(levels));
    var acts = test.prescriptions(levels);
    if (acts.length) {
      lines.push('');
      lines.push('本月行动：');
      acts.forEach(function (a, i) { lines.push((i + 1) + '. ' + a.text); });
    }
    lines.push('');
    lines.push('—— 来自鱼三药寮屋');
    return lines.join('\n');
  }

  // ================= 我的（个人档案） =================
  async function renderProfile(s) {
    var user = await DS.getUserById(s.userId) || {};
    var credits = user.questionCredits || 0;
    var birth = user.birthInfo || { date: '', time: '', place: '' };

    return navbar('我的', '')
      + '<div class="page">'
      + '<div class="section-title"><span class="t">个人信息</span></div>'
      + '<div class="card">'
      + '<div class="form-group"><label>昵称</label><div style="font-size:15px;font-weight:600">' + esc(user.nickname || '') + '</div></div>'
      + '<div class="form-group"><label>太阳星座</label><select id="pSunSign">' + signOptions(user.sunSign || '') + '</select></div>'
      + '<div class="form-group"><label>上升星座</label><select id="pRisingSign">' + signOptions(user.risingSign || '') + '</select></div>'
      + '<div class="form-group"><label>出生信息（可选，帮助更准确判断）</label>'
      + '<input type="date" id="pBirthDate" value="' + esc(birth.date || '') + '" style="margin-bottom:8px">'
      + '<input type="time" id="pBirthTime" value="' + esc(birth.time || '') + '" style="margin-bottom:8px">'
      + '<input type="text" id="pBirthPlace" placeholder="出生地点" value="' + esc(birth.place || '') + '"></div>'
      + '<button class="btn btn-primary" onclick="SiteActions.saveProfile()">保存</button>'
      + '</div>'
      + '<div class="section-title"><span class="t">我的</span></div>'
      + '<div class="card" style="text-align:center"><div class="sub" style="margin-bottom:8px">剩余提问机会</div><div class="h1">' + credits + '</div></div>'
      + '<a class="list-item" href="#/qa/questions"><div class="li-top"><span class="li-nick">我的提问</span><span class="li-time">›</span></div><div class="li-content sub">查看历史提问与老师的回复</div></a>'
      + '<a class="list-item" href="#/redeem"><div class="li-top"><span class="li-nick">兑换提问机会</span><span class="li-time">›</span></div><div class="li-content sub">输入兑换码，获得 1 次提问机会</div></a>'
      + '<a class="list-item" href="#/qa/public"><div class="li-top"><span class="li-nick">精选问答</span><span class="li-time">›</span></div><div class="li-content sub">浏览公开的精选问答</div></a>'
      + '<button class="btn btn-ghost" style="margin-top:12px" onclick="Auth.logout()">退出登录</button>'
      + '</div>';
  }

  // ================= 答疑 =================
  async function renderQaHome() {
    var s = Auth.getSession();
    var quota = await DS.getQuotaRemaining();
    var user = s && s.role === 'user' ? await DS.getUserById(s.userId) : null;
    var credits = user ? (user.questionCredits || 0) : 0;

    var actionHtml;
    if (!user) {
      actionHtml = '<div class="card" style="text-align:center"><div class="sub" style="margin-bottom:12px">登录后即可提问</div><button class="btn btn-primary" onclick="Router.go(\'#/login\')">去登录</button></div>';
    } else if (credits > 0) {
      actionHtml = '<div class="card" style="text-align:center"><div class="sub" style="margin-bottom:12px">你还有 <strong style="color:var(--ink)">' + credits + '</strong> 次提问机会</div><button class="btn btn-primary" onclick="Router.go(\'#/qa/ask\')">我要提问</button></div>';
    } else {
      actionHtml = '<div class="card" style="text-align:center"><div class="sub" style="margin-bottom:12px">仅购买用户可提问，你还没有提问机会</div><button class="btn btn-primary" onclick="Router.go(\'#/redeem\')">兑换提问机会</button></div>';
    }

    var myHtml = user
      ? '<a class="list-item" href="#/qa/questions"><div class="li-top"><span class="li-nick">我的提问</span><span class="li-time">›</span></div><div class="li-content sub">查看历史提问与老师的回复</div></a>'
      : '';

    return navbar('来问', '')
      + '<div class="page">'
      + '<div class="test-hero" style="padding:22px 0 16px;text-align:center"><div class="th-sub" style="font-size:13px;letter-spacing:2px">把你的困惑交给飞鱼十三香，一对一慢慢聊</div><div style="margin-top:10px;font-size:12px;letter-spacing:2px;color:var(--ink-3)">剩余 <strong style="color:var(--accent-deep);font-size:17px">' + quota + '</strong> 个名额 · 限前 500 名</div></div>'
      + actionHtml
      + '<div class="section-title"><span class="t">入口</span></div>'
      + myHtml
      + '<a class="list-item" href="#/redeem"><div class="li-top"><span class="li-nick">兑换提问机会</span><span class="li-time">›</span></div><div class="li-content sub">输入兑换码，获得 1 次提问机会</div></a>'
      + '<a class="list-item" href="#/qa/public"><div class="li-top"><span class="li-nick">精选问答</span><span class="li-time">›</span></div><div class="li-content sub">浏览公开的精选问答（无需购买）</div></a>'
      + '<div class="section-title"><span class="t">答疑规则</span></div>'
      + '<div class="card"><ul class="rule-list">'
      + '<li>提问需消耗 1 次机会，仅购买用户可通过兑换码获得。</li>'
      + '<li>问题提交后需先经过审核，审核通过后老师才会回复。</li>'
      + '<li>公开提问会进入「精选问答」供大家浏览，私密提问仅你和老师可见。</li>'
      + '<li>公开提问请填写太阳与上升星座；私密提问可补充出生信息。</li>'
      + '<li>请勿提问超出答疑边界的内容（如投资、医疗、法律等）。</li>'
      + '</ul></div>'
      + '</div>';
  }

  async function renderRedeem(s) {
    var user = await DS.getUserById(s.userId);
    var quota = await DS.getQuotaRemaining();
    var credits = user ? (user.questionCredits || 0) : 0;
    return navbar('兑换提问机会', '')
      + '<div class="page">'
      + '<div class="card" style="text-align:center">'
      + '<div class="sub" style="margin-bottom:14px">当前剩余 <strong style="color:var(--ink)">' + credits + '</strong> 次提问机会</div>'
      + '<div class="form-group"><input type="text" id="redeemCode" placeholder="输入兑换码" style="text-align:center;letter-spacing:2px"></div>'
      + '<button class="btn btn-primary" onclick="SiteActions.redeem()">兑换</button>'
      + '</div>'
      + '<div class="hint-list">剩余 ' + quota + ' 个名额 · 限前 500 名购买用户<br>演示兑换码：YSYL0001 / YSYL0002（未使用）<br>每个码可兑换 1 次提问机会，用完失效。</div>'
      + '</div>';
  }

  async function renderAsk(qid, s) {
    var q = null, isResubmit = false;
    if (qid) {
      var found = await DS.getQuestionForUser(qid, s.userId);
      if (found && found.status === 'rejected') { q = found; isResubmit = true; }
    }
    // 新提问需有提问机会；重提（被拒修改）不消耗新机会
    if (!isResubmit) {
      var u = await DS.getUserById(s.userId);
      if (!u || (u.questionCredits || 0) <= 0) {
        return navbar('我要提问', '')
          + '<div class="page"><div class="card" style="text-align:center"><div class="sub" style="margin-bottom:12px">你还没有提问机会，仅购买用户可提问</div><button class="btn btn-primary" onclick="Router.go(\'#/redeem\')">去兑换提问机会</button></div></div>';
      }
    }
    var title = isResubmit ? '修改重提' : '我要提问';
    var content = q ? q.content : '';
    var visPublic = q ? q.visibility === 'public' : true;
    var nicknameVisible = q ? !!q.nicknameVisible : false;
    return navbar(title, '')
      + '<div class="page">'
      + (isResubmit ? '<div class="reject-box"><div class="r-label">上次被拒绝的原因</div><div class="r-text">' + esc(q.rejectReason) + '</div></div>' : '')
      + '<div class="sub" style="margin:8px 0 16px">星座信息取自你的个人档案，可在「我的」修改</div>'
      + '<form id="askForm" data-qid="' + (qid || '') + '" onsubmit="return false;">'
      + '<div class="form-group"><label class="req">问题内容</label><textarea id="content" placeholder="请描述你的困惑，越具体越好">' + esc(content) + '</textarea></div>'
      + '<div class="form-group"><label class="req">公开 / 私密</label>'
      + '<div class="radio-group">'
      + '<label class="radio-item' + (visPublic ? ' on' : '') + '" id="rPublic"><input type="radio" name="visibility" value="public" ' + (visPublic ? 'checked' : '') + ' onchange="SiteActions.onVisibilityChange()"><span class="dot"></span>公开</label>'
      + '<label class="radio-item' + (visPublic ? '' : ' on') + '" id="rPrivate"><input type="radio" name="visibility" value="private" ' + (visPublic ? '' : 'checked') + ' onchange="SiteActions.onVisibilityChange()"><span class="dot"></span>私密</label>'
      + '</div></div>'
      + '<div id="nickField" style="' + (visPublic ? '' : 'display:none') + '">'
      + '<div class="form-group"><div class="switch-row"><span class="sw-label">公开我的昵称（关闭则为匿名展示）</span>'
      + '<label class="switch' + (nicknameVisible ? ' on' : '') + '" id="nickSwitch"><input type="checkbox" id="nicknameVisible" ' + (nicknameVisible ? 'checked' : '') + ' onchange="SiteActions.onNickSwitch()"></label>'
      + '</div></div></div>'
      + '<button class="btn btn-primary" style="margin-top:8px" onclick="SiteActions.submit()">' + (isResubmit ? '重新提交' : '提交问题') + '</button>'
      + '<div class="form-hint" style="text-align:center;margin-top:12px">提交后将进入待审核状态</div>'
      + '</form></div>';
  }

  async function renderQuestions(s) {
    var list = await DS.listMyQuestions(s.userId);
    var body = '';
    if (!list.length) body = '<div class="empty"><div class="big">还没有提问</div>去提出你的第一个问题吧</div>';
    else list.forEach(function (q) {
      body += '<a class="list-item" href="#/qa/questions/' + q.id + '">'
        + '<div class="li-top">' + statusTag(q.status) + visTag(q.visibility) + '<span class="li-time">' + U.fmt(q.updatedAt) + '</span></div>'
        + '<div class="li-content">' + esc(q.content) + '</div></a>';
    });
    return navbar('我的提问', '') + '<div class="page">' + body + '</div>';
  }

  async function renderQuestionDetail(id, s) {
    var q = await DS.getQuestionForUser(id, s.userId);
    if (!q) { return navbar('提问详情', '') + '<div class="page"><div class="empty">问题不存在或无权查看</div></div>'; }

    var info = '<div class="kv"><span><span class="k">状态</span>' + U.statusLabel(q.status) + '</span><span><span class="k">公开/私密</span>' + (q.visibility === 'public' ? '公开' : '私密') + '</span>';
    if (q.sunSign) info += '<span><span class="k">太阳</span>' + esc(q.sunSign) + '</span>';
    if (q.risingSign) info += '<span><span class="k">上升</span>' + esc(q.risingSign) + '</span>';
    info += '</div>';

    var extra = '';
    if (q.status === 'answered') {
      extra = '<div class="answer-box"><div class="a-label">飞鱼十三香的回信 · ' + U.fmt(q.answerAt) + '</div><div class="a-text">' + esc(q.answer) + '</div></div>';
    } else if (q.status === 'rejected') {
      extra = '<div class="reject-box"><div class="r-label">审核未通过 · ' + U.fmt(q.reviewedAt) + '</div><div class="r-text">' + esc(q.rejectReason) + '</div></div>'
        + '<button class="btn btn-primary" style="margin-top:16px" onclick="Router.go(\'#/qa/ask/' + q.id + '\')">修改后重新提交</button>';
    } else if (q.status === 'pending') {
      extra = '<div class="answer-box"><div class="a-label">当前状态</div><div class="a-text muted">你的问题正在等待审核，请耐心等待。</div></div>';
    } else if (q.status === 'approved') {
      extra = '<div class="answer-box"><div class="a-label">当前状态</div><div class="a-text muted">已通过审核，老师正在准备回复。</div></div>';
    }

    return navbar('提问详情', '')
      + '<div class="page"><div class="card">'
      + '<div class="detail-meta">' + statusTag(q.status) + visTag(q.visibility) + '<span class="small muted">' + U.fmt(q.updatedAt) + '</span></div>'
      + info + '<div class="divider"></div>'
      + '<div style="font-size:15px;white-space:pre-wrap;word-break:break-word">' + esc(q.content) + '</div>'
      + extra + '</div></div>';
  }

  async function renderPublic() {
    var list = await DS.listPublicQA();
    var body = '';
    if (!list.length) body = '<div class="empty"><div class="big">暂无公开问答</div>老师回复后会展示在这里</div>';
    else list.forEach(function (q) {
      var nick = q.nicknameVisible ? q.nickname : '匿名用户';
      body += '<div class="card">'
        + '<div class="detail-meta"><span class="li-nick strong">' + esc(nick) + '</span>'
        + (q.sunSign ? '<span class="vis-tag">太阳 ' + esc(q.sunSign) + '</span>' : '')
        + (q.risingSign ? '<span class="vis-tag">上升 ' + esc(q.risingSign) + '</span>' : '')
        + '<span class="small muted" style="margin-left:auto">' + U.fmt(q.answerAt) + '</span></div>'
        + '<div style="font-size:15px;margin-bottom:12px">' + esc(q.content) + '</div>'
        + '<div class="answer-box"><div class="a-label">飞鱼十三香的回信</div><div class="a-text">' + esc(q.answer) + '</div></div>'
        + '</div>';
    });
    return navbar('精选问答', '') + '<div class="page">' + body + '</div>';
  }

  // ================= 交互 =================
  var SiteActions = {
    login: async function () {
      try { await Auth.loginUser(val('#nickname')); location.hash = '#/me'; }
      catch (e) { U.toast(e.message); }
    },
    loginWechat: async function () {
      try { await Auth.loginWithWechat(); } catch (e) { U.toast(e.message); }
    },
    paidHint: function () { U.toast('付费内容即将上线，敬请期待'); },
    wecomHint: function () { U.toast('企业微信号将在活动发布时公布'); },
    redeem: async function () {
      try {
        var code = val('#redeemCode').trim();
        if (!code) throw new Error('请输入兑换码');
        var s = Auth.getSession();
        var u = await DS.redeemCode(code, s.userId);
        U.toast('兑换成功，剩余 ' + u.questionCredits + ' 次提问机会');
        location.hash = '#/qa';
      } catch (e) { U.toast(e.message); }
    },
    onVisibilityChange: function () {
      var pub = document.querySelector('input[name="visibility"]:checked').value === 'public';
      var rp = document.getElementById('rPublic'), rv = document.getElementById('rPrivate');
      var nf = document.getElementById('nickField');
      if (rp) rp.classList.toggle('on', pub);
      if (rv) rv.classList.toggle('on', !pub);
      if (nf) nf.style.display = pub ? '' : 'none';
    },
    onNickSwitch: function () {
      var cb = document.getElementById('nicknameVisible'), sw = document.getElementById('nickSwitch');
      if (cb && sw) sw.classList.toggle('on', cb.checked);
    },
    submit: async function () {
      try {
        var form = document.getElementById('askForm');
        var qid = form ? form.getAttribute('data-qid') : '';
        var content = val('#content').trim();
        var visEl = document.querySelector('input[name="visibility"]:checked');
        var visibility = visEl ? visEl.value : 'public';
        var nicknameVisible = document.getElementById('nicknameVisible') ? document.getElementById('nicknameVisible').checked : false;

        if (!content) throw new Error('请填写问题内容');

        var s = Auth.getSession();
        var payload = { userId: s.userId, content: content, visibility: visibility, nicknameVisible: nicknameVisible };
        if (qid) { await DS.resubmitQuestion(qid, payload); U.toast('已重新提交，等待审核'); }
        else { await DS.createQuestion(payload); U.toast('提交成功，等待审核'); }
        location.hash = '#/qa/questions';
      } catch (e) { U.toast(e.message); }
    },
    saveProfile: async function () {
      try {
        var s = Auth.getSession();
        var profile = {
          sunSign: val('#pSunSign'),
          risingSign: val('#pRisingSign'),
          birthInfo: { date: val('#pBirthDate'), time: val('#pBirthTime'), place: val('#pBirthPlace').trim() }
        };
        await DS.updateUserProfile(s.userId, profile);
        U.toast('已保存');
        location.hash = '#/';
      } catch (e) { U.toast(e.message); }
    },
    // ---------- 测一测（测试中心） ----------
    testInit: function () {
      if (!QuizState.testId) return; // 测试列表页无需初始化
      var body = document.getElementById('quizBody');
      if (!body || body.getAttribute('data-init')) return;
      body.setAttribute('data-init', '1');
      QuizState.idx = 0;
      QuizState.answers = [];
      renderQuizIntro(currentTest());
    },
    quizStart: function () {
      document.getElementById('quizBar').parentNode.style.display = '';
      renderQuizQuestion(currentTest());
    },
    quizAnswer: function (optIdx) {
      var test = currentTest();
      QuizState.answers[QuizState.idx] = optIdx;
      QuizState.idx += 1;
      if (QuizState.idx < test.questions.length) {
        renderQuizQuestion(test);
      } else {
        renderQuizResult(test);
      }
    },
    quizRestart: function () {
      QuizState.idx = 0;
      QuizState.answers = [];
      renderQuizIntro(currentTest());
    },
    quizCopy: function () {
      var text = quizReportText(currentTest());
      var done = function () { U.toast('报告已复制，去分享吧'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { U.toast('复制失败，请长按截图保存'); });
      } else {
        U.toast('当前环境不支持复制，请长按截图保存');
      }
    }
  };

  global.SiteView = {
    renderHome: renderHome, renderLogin: renderLogin, renderContentList: renderContentList, renderContentDetail: renderContentDetail,
    renderPaid: renderPaid, renderActivity: renderActivity, renderTest: renderTest, renderTestRun: renderTestRun, renderProfile: renderProfile, renderQaHome: renderQaHome, renderRedeem: renderRedeem, renderAsk: renderAsk,
    renderQuestions: renderQuestions, renderQuestionDetail: renderQuestionDetail, renderPublic: renderPublic
  };
  global.SiteActions = SiteActions;
})(window);
