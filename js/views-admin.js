/* ============================================================
   views-admin.js — 管理端视图与交互
   运营(内容管理) / 审核员(答疑审核) / 老师(答疑回复)
   ============================================================ */
(function (global) {
  'use strict';

  var U = global.Utils;
  var DS = global.DataService;
  var Auth = global.Auth;
  var Store = global.Store;

  function $(sel) { return document.querySelector(sel); }
  function val(sel) { var el = $(sel); return el ? el.value : ''; }
  function esc(s) { return U.escapeHtml(s); }

  function navbar(title, rightHtml, back) {
    var backBtn = back === false ? '' : '<button class="back" onclick="Router.back()">‹</button>';
    return '<div class="navbar">' + backBtn + '<div class="title">' + esc(title) + '</div><div class="right">' + (rightHtml || '') + '</div></div>';
  }

  function statusTag(status) { return '<span class="status ' + U.statusCls(status) + '">' + U.statusLabel(status) + '</span>'; }
  function visTag(v) { return '<span class="vis-tag">' + (v === 'public' ? '公开' : '私密') + '</span>'; }
  function typeTag(t) { return '<span class="type-tag ' + U.typeCls(t) + '">' + U.typeLabel(t) + '</span>'; }

  function contentStatusTag(st) {
    if (st === 'published') return '<span class="status st-answered">已发布</span>';
    if (st === 'draft') return '<span class="status st-pending">草稿</span>';
    return '<span class="status st-rejected">已下架</span>';
  }

  function tabsHtml(base, status, tabs, names) {
    var html = '<div class="tabs">';
    tabs.forEach(function (t) {
      html += '<div class="tab' + (status === t ? ' on' : '') + '" onclick="Router.go(\'' + base + '?status=' + t + '\')">' + names[t] + '</div>';
    });
    return html + '</div>';
  }

  // ================= 管理端登录 =================
  function renderAdminLogin() {
    return '<div class="auth-wrap">'
      + '<div class="logo"><div class="t">鱼三药寮屋</div><div class="s">管理端登录</div></div>'
      + '<div class="form-group"><label>账号</label><input type="text" id="username" placeholder="ops / admin / teacher"></div>'
      + '<div class="form-group"><label>密码</label><input type="password" id="password" placeholder="123456"></div>'
      + '<button class="btn btn-primary" onclick="AdminActions.adminLogin()">登录</button>'
      + '<div class="hint-list">演示账号：<br>运营 ops / 123456（内容管理）<br>审核员 admin / 123456（答疑审核）<br>老师 teacher / 123456（答疑回复）</div>'
      + '<div style="height:12px"></div>'
      + '<button class="btn btn-ghost" onclick="Router.go(\'#/\')">返回首页</button>'
      + '</div>';
  }

  // ================= 运营：内容管理 =================
  async function renderOpsList(s) {
    var list = await DS.listAllContents();
    var body = '';
    if (!list.length) body = '<div class="empty">暂无内容</div>';
    else list.forEach(function (c) {
      var toggleBtn = c.status === 'published'
        ? '<button class="btn btn-sm btn-ghost" onclick="AdminActions.setContentStatus(\'' + c.id + '\',\'offline\')">下架</button>'
        : '<button class="btn btn-sm btn-primary" onclick="AdminActions.setContentStatus(\'' + c.id + '\',\'published\')">上架</button>';
      body += '<div class="card" style="padding:16px">'
        + '<div class="li-top">' + typeTag(c.type) + contentStatusTag(c.status) + '<span class="li-time">' + U.fmt(c.updatedAt) + '</span></div>'
        + '<div class="content-title" style="font-size:15px;margin:8px 0 4px">' + esc(c.title) + '</div>'
        + '<div class="content-summary">' + esc(c.summary) + '</div>'
        + '<div class="btn-row" style="margin-top:12px">'
        + '<button class="btn btn-sm btn-ghost" style="flex:1" onclick="Router.go(\'#/ops/' + c.id + '/edit\')">编辑</button>'
        + '<button class="btn btn-sm btn-ghost" style="flex:1" onclick="event.stopPropagation();' + (c.status === 'published' ? 'AdminActions.setContentStatus(\'' + c.id + '\',\'offline\')' : 'AdminActions.setContentStatus(\'' + c.id + '\',\'published\')') + '">' + (c.status === 'published' ? '下架' : '上架') + '</button>'
        + '</div></div>';
    });

    var toolbar = '<div class="toolbar">'
      + '<button class="btn btn-primary btn-sm" onclick="Router.go(\'#/ops/new\')">＋ 发布内容</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="Router.go(\'#/ops/codes\')">兑换码管理</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="Router.go(\'#/ops/issue\')">期刊设置</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="AdminActions.reset()">重置演示数据</button>'
      + '</div>';

    return navbar('运营 · 内容管理', '<span onclick="Auth.logout()">退出</span>', false)
      + '<div class="page">' + toolbar + body + '</div>';
  }

  async function renderOpsCodes(s) {
    var list = await DS.listRedeemCodes();
    var body = '';
    if (!list.length) body = '<div class="empty">暂无兑换码</div>';
    else list.forEach(function (c) {
      body += '<div class="card" style="padding:14px;display:flex;align-items:center;gap:10px">'
        + '<div style="flex:1"><div style="font-size:16px;letter-spacing:2px;font-weight:600">' + esc(c.code) + '</div>'
        + '<div class="small muted">生成于 ' + U.fmt(c.createdAt) + '</div></div>'
        + (c.status === 'used' ? '<span class="status st-rejected">已使用</span>' : '<span class="status st-answered">未使用</span>')
        + '</div>';
    });

    var toolbar = '<div class="toolbar">'
      + '<button class="btn btn-primary btn-sm" onclick="AdminActions.generateCodes()">＋ 批量生成</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="AdminActions.exportCodes()">导出兑换码</button>'
      + '</div>';

    return navbar('运营 · 兑换码管理', '<span onclick="Auth.logout()">退出</span>', false)
      + '<div class="page">'
      + '<div class="sub" style="margin:8px 0 12px">兑换码发给合作方/购买用户，用户在「来问」输入兑换，获得 1 次提问机会（用完失效）</div>'
      + toolbar + body + '</div>';
  }

  async function renderOpsEditor(s, id) {
    var c = id ? await DS.getContent(id) : null;
    var isNew = !c;
    var title = isNew ? '发布内容' : '编辑内容';
    var ctitle = c ? c.title : '', ctype = c ? c.type : 'article', csummary = c ? c.summary : '', cbody = c ? c.body : '';
    var sunTags = c ? (c.sunTags || []) : [];
    var riseTags = c ? (c.riseTags || []) : [];

    function signGroup(name, selected) {
      var html = '<div class="tag-box">';
      U.SIGN_LIST.forEach(function (sign) {
        var checked = selected.indexOf(sign) >= 0 ? ' checked' : '';
        html += '<label class="sign-check"><input type="checkbox" name="' + name + '" value="' + sign + '"' + checked + '>' + sign + '</label>';
      });
      return html + '</div>';
    }

    return navbar(title, '')
      + '<div class="page">'
      + '<form id="contentForm" data-id="' + (id || '') + '" onsubmit="return false;">'
      + '<div class="form-group"><label class="req">标题</label><input type="text" id="ctitle" value="' + esc(ctitle) + '" placeholder="内容标题"></div>'
      + '<div class="form-group"><label class="req">类型</label><select id="ctype">'
      + '<option value="article"' + (ctype === 'article' ? ' selected' : '') + '>图文</option>'
      + '<option value="video"' + (ctype === 'video' ? ' selected' : '') + '>视频（第三方嵌入占位）</option>'
      + '</select></div>'
      + '<div class="form-group"><label>摘要</label><textarea id="csummary" style="min-height:60px" placeholder="一句话摘要，展示在列表">' + esc(csummary) + '</textarea></div>'
      + '<div class="form-group"><label>正文</label><textarea id="cbody" style="min-height:160px" placeholder="正文内容（图文类型）">' + esc(cbody) + '</textarea></div>'
      + '<div class="form-group"><label>太阳星座标签（优先推给这些太阳星座的用户）</label>' + signGroup('sunTag', sunTags) + '</div>'
      + '<div class="form-group"><label>上升星座标签（优先推给这些上升星座的用户）</label>' + signGroup('riseTag', riseTags) + '</div>'
      + '<div class="btn-row">'
      + '<button class="btn btn-ghost" onclick="AdminActions.saveContent(\'draft\')">存为草稿</button>'
      + '<button class="btn btn-primary" onclick="AdminActions.saveContent(\'published\')">' + (isNew ? '发布上架' : '保存并上架') + '</button>'
      + '</div>'
      + '</form></div>';
  }

  // ================= 审核员：答疑 =================
  async function renderReviewerList(s, status) {
    var list = await DS.listAllForReviewer(status);
    var tabs = ['all', 'pending', 'approved', 'answered', 'rejected'];
    var names = { all: '全部', pending: '待审核', approved: '待回复', answered: '已回复', rejected: '已拒绝' };

    var body = '';
    if (!list.length) body = '<div class="empty">暂无' + (names[status] || '') + '问题</div>';
    else list.forEach(function (q) {
      body += '<a class="list-item" href="#/admin/' + q.id + '">'
        + '<div class="li-top">' + statusTag(q.status) + visTag(q.visibility) + '<span class="li-nick">' + esc(q.nickname) + '</span><span class="li-time">' + U.fmt(q.updatedAt) + '</span></div>'
        + '<div class="li-content">' + esc(q.content) + '</div></a>';
    });

    var toolbar = '<div class="toolbar">'
      + '<button class="btn btn-ghost btn-sm" onclick="AdminActions.exportCsv()">导出 CSV</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="AdminActions.reset()">重置演示数据</button>'
      + '</div>';

    return navbar('审核员 · ' + s.name, '<span onclick="Auth.logout()">退出</span>', false)
      + '<div class="page">' + toolbar + tabsHtml('#/admin', status, tabs, names) + body + '</div>';
  }

  async function renderReviewerDetail(id, s) {
    var q = await DS.getQuestionForAdmin(id);
    if (!q) { return navbar('问题详情', '') + '<div class="page"><div class="empty">问题不存在</div></div>'; }

    var birthHtml = '';
    if (q.birthInfo && (q.birthInfo.date || q.birthInfo.time || q.birthInfo.place)) {
      birthHtml = '<span><span class="k">出生信息</span>' + esc([q.birthInfo.date, q.birthInfo.time, q.birthInfo.place].filter(Boolean).join(' ')) + '</span>';
    }

    var info = '<div class="kv">'
      + '<span><span class="k">昵称</span>' + esc(q.nickname) + '</span>'
      + '<span><span class="k">公开/私密</span>' + (q.visibility === 'public' ? '公开' : '私密') + '</span>'
      + (q.nicknameVisible ? '<span><span class="k">昵称展示</span>显示昵称</span>' : '<span><span class="k">昵称展示</span>匿名</span>')
      + (q.sunSign ? '<span><span class="k">太阳</span>' + esc(q.sunSign) + '</span>' : '')
      + (q.risingSign ? '<span><span class="k">上升</span>' + esc(q.risingSign) + '</span>' : '')
      + birthHtml + '<span><span class="k">提问时间</span>' + U.fmt(q.createdAt) + '</span>'
      + (q.resubmitCount ? '<span><span class="k">重提次数</span>' + q.resubmitCount + '</span>' : '')
      + '</div>';

    var actions = '';
    if (q.status === 'pending') {
      actions = '<div class="divider"></div><div class="btn-row">'
        + '<button class="btn btn-primary" onclick="AdminActions.approve(\'' + q.id + '\')">通过</button>'
        + '<button class="btn btn-danger" onclick="AdminActions.showReject()">拒绝</button>'
        + '</div>'
        + '<div id="rejectPanel" style="display:none;margin-top:16px">'
        + '<div class="form-group"><label>拒绝理由（可选模板）</label><select id="rejectTemplate" onchange="AdminActions.applyTemplate()"><option value="">选择模板…</option>'
        + U.REJECT_TEMPLATES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="form-group"><textarea id="rejectReason" placeholder="请填写拒绝理由"></textarea></div>'
        + '<button class="btn btn-danger" onclick="AdminActions.reject(\'' + q.id + '\')">确认拒绝</button></div>';
    } else if (q.status === 'answered') {
      actions = '<div class="answer-box"><div class="a-label">老师回复 · ' + U.fmt(q.answerAt) + '（' + esc(q.answeredBy || '') + '）</div><div class="a-text">' + esc(q.answer) + '</div></div>';
    } else if (q.status === 'rejected') {
      actions = '<div class="reject-box"><div class="r-label">已拒绝 · ' + U.fmt(q.reviewedAt) + '</div><div class="r-text">' + esc(q.rejectReason) + '</div></div>';
    } else if (q.status === 'approved') {
      actions = '<div class="answer-box"><div class="a-label">当前状态</div><div class="a-text muted">已通过审核，等待老师回复。</div></div>';
    }

    var visToggle = '<div class="divider"></div><div class="form-group"><label>公开 / 私密状态</label><div class="btn-row">'
      + '<button class="btn btn-sm ' + (q.visibility === 'public' ? 'btn-primary' : 'btn-ghost') + '" onclick="AdminActions.setVisibility(\'' + q.id + '\',\'public\')">公开</button>'
      + '<button class="btn btn-sm ' + (q.visibility === 'private' ? 'btn-primary' : 'btn-ghost') + '" onclick="AdminActions.setVisibility(\'' + q.id + '\',\'private\')">私密</button>'
      + '</div></div>';

    return navbar('问题详情', '')
      + '<div class="page"><div class="card">'
      + '<div class="detail-meta">' + statusTag(q.status) + visTag(q.visibility) + '<span class="small muted">' + U.fmt(q.updatedAt) + '</span></div>'
      + info + '<div class="divider"></div>'
      + '<div style="font-size:15px;white-space:pre-wrap;word-break:break-word">' + esc(q.content) + '</div>'
      + actions + visToggle + '</div></div>';
  }

  // ================= 老师：回复 =================
  async function renderTeacherList(s, status) {
    var list = await DS.listForTeacher(status);
    var tabs = ['all', 'approved', 'answered'];
    var names = { all: '全部', approved: '待回复', answered: '已回复' };

    var body = '';
    if (!list.length) body = '<div class="empty">暂无' + (names[status] || '') + '问题</div>';
    else list.forEach(function (q) {
      body += '<a class="list-item" href="#/teacher/' + q.id + '">'
        + '<div class="li-top">' + statusTag(q.status) + visTag(q.visibility) + '<span class="li-nick">' + esc(q.nickname) + '</span><span class="li-time">' + U.fmt(q.updatedAt) + '</span></div>'
        + '<div class="li-content">' + esc(q.content) + '</div></a>';
    });

    return navbar('老师 · ' + s.name, '<span onclick="Auth.logout()">退出</span>', false)
      + '<div class="page">' + tabsHtml('#/teacher', status, tabs, names) + body + '</div>';
  }

  async function renderTeacherDetail(id, s) {
    var q = await DS.getQuestionForTeacher(id);
    if (!q) { return navbar('回复', '') + '<div class="page"><div class="empty">问题不存在或不可见</div></div>'; }

    var birthHtml = '';
    if (q.birthInfo && (q.birthInfo.date || q.birthInfo.time || q.birthInfo.place)) {
      birthHtml = '<span><span class="k">出生信息</span>' + esc([q.birthInfo.date, q.birthInfo.time, q.birthInfo.place].filter(Boolean).join(' ')) + '</span>';
    }

    var info = '<div class="kv">'
      + '<span><span class="k">昵称</span>' + esc(q.nickname) + '</span>'
      + '<span><span class="k">公开/私密</span>' + (q.visibility === 'public' ? '公开' : '私密') + '</span>'
      + (q.sunSign ? '<span><span class="k">太阳</span>' + esc(q.sunSign) + '</span>' : '')
      + (q.risingSign ? '<span><span class="k">上升</span>' + esc(q.risingSign) + '</span>' : '')
      + birthHtml + '</div>';

    var replyArea = '';
    if (q.status === 'approved') {
      replyArea = '<div class="divider"></div>'
        + '<div class="form-group"><label>回复内容</label><textarea id="answer" placeholder="请输入回复…"></textarea></div>'
        + '<button class="btn btn-primary" onclick="AdminActions.submitAnswer(\'' + q.id + '\')">提交回复</button>';
    } else if (q.status === 'answered') {
      replyArea = '<div class="answer-box"><div class="a-label">已回复 · ' + U.fmt(q.answerAt) + '</div><div class="a-text">' + esc(q.answer) + '</div></div>';
    }

    return navbar('问题回复', '')
      + '<div class="page"><div class="card">'
      + '<div class="detail-meta">' + statusTag(q.status) + visTag(q.visibility) + '<span class="small muted">' + U.fmt(q.updatedAt) + '</span></div>'
      + info + '<div class="divider"></div>'
      + '<div style="font-size:15px;white-space:pre-wrap;word-break:break-word">' + esc(q.content) + '</div>'
      + replyArea + '</div></div>';
  }

  // ================= 交互 =================
  var AdminActions = {
    adminLogin: async function () {
      try {
        var admin = await Auth.loginAdmin(val('#username'), val('#password'));
        location.hash = admin.role === 'operator' ? '#/ops' : (admin.role === 'reviewer' ? '#/admin' : '#/teacher');
      } catch (e) { U.toast(e.message); }
    },
    saveContent: async function (mode) {
      try {
        var form = document.getElementById('contentForm');
        var id = form ? form.getAttribute('data-id') : '';
        var title = val('#ctitle').trim();
        var ctype = val('#ctype');
        var summary = val('#csummary').trim();
        var body = val('#cbody').trim();
        if (!title) throw new Error('请填写标题');
        var sunTags = [], riseTags = [];
        document.querySelectorAll('input[name="sunTag"]:checked').forEach(function (el) { sunTags.push(el.value); });
        document.querySelectorAll('input[name="riseTag"]:checked').forEach(function (el) { riseTags.push(el.value); });
        var payload = { title: title, type: ctype, summary: summary, body: body, sunTags: sunTags, riseTags: riseTags, status: mode };
        if (id) { await DS.updateContent(id, payload); U.toast(mode === 'published' ? '已保存并上架' : '已存为草稿'); }
        else { await DS.createContent(payload); U.toast(mode === 'published' ? '已发布' : '已存为草稿'); }
        location.hash = '#/ops';
      } catch (e) { U.toast(e.message); }
    },
    setContentStatus: async function (id, status) {
      try { await DS.setContentStatus(id, status); U.toast(status === 'published' ? '已上架' : '已下架'); Router.dispatch(); }
      catch (e) { U.toast(e.message); }
    },
    generateCodes: async function () {
      var n = parseInt(prompt('生成多少个兑换码？', '10'), 10);
      if (!n || n <= 0) return;
      var codes = await DS.generateRedeemCodes(n);
      U.toast('已生成 ' + codes.length + ' 个兑换码');
      Router.dispatch();
    },
    exportCodes: async function () {
      var list = await DS.listRedeemCodes();
      var rows = [['兑换码', '状态', '使用者', '使用时间', '生成时间']];
      list.forEach(function (c) {
        rows.push([c.code, c.status === 'used' ? '已使用' : '未使用', c.usedBy || '', c.usedAt ? U.fmt(c.usedAt) : '', U.fmt(c.createdAt)]);
      });
      U.downloadCsv('兑换码_' + U.fmtDate(Date.now()).replace(/-/g, '') + '.csv', rows);
      U.toast('已导出兑换码');
    },
    exportCsv: async function () {
      var rows = await DS.exportRows();
      U.downloadCsv('答疑数据_' + U.fmtDate(Date.now()).replace(/-/g, '') + '.csv', rows);
      U.toast('已导出 CSV');
    },
    saveIssue: async function () {
      try {
        await DS.setIssueSettings({ sign: val('#isSign'), motto: val('#isMotto') });
        global.Issue.apply();
        U.toast('已换刊'); Router.dispatch();
      } catch (e) { U.toast(e.message); }
    },
    reset: function () { Store.resetAll(); U.toast('已重置演示数据'); Router.dispatch(); },
    approve: async function (id) {
      try { await DS.approveQuestion(id, Auth.getSession().username); U.toast('已通过，进入待回复'); location.hash = '#/admin'; }
      catch (e) { U.toast(e.message); }
    },
    showReject: function () { var p = document.getElementById('rejectPanel'); if (p) p.style.display = 'block'; },
    applyTemplate: function () { var t = val('#rejectTemplate'), r = document.getElementById('rejectReason'); if (t && r) r.value = t; },
    reject: async function (id) {
      try {
        var reason = val('#rejectReason').trim();
        if (!reason) throw new Error('请填写拒绝理由');
        await DS.rejectQuestion(id, Auth.getSession().username, reason);
        U.toast('已拒绝'); location.hash = '#/admin';
      } catch (e) { U.toast(e.message); }
    },
    setVisibility: async function (id, vis) {
      try { await DS.setVisibility(id, vis); U.toast('已改为' + (vis === 'public' ? '公开' : '私密')); Router.dispatch(); }
      catch (e) { U.toast(e.message); }
    },
    submitAnswer: async function (id) {
      try { await DS.answerQuestion(id, Auth.getSession().username, val('#answer')); U.toast('回复成功'); location.hash = '#/teacher'; }
      catch (e) { U.toast(e.message); }
    }
  };
  // ================= 运营：期刊设置（星座月刊） =================
  async function renderOpsIssue(s) {
    var cur = await DS.getIssueSettings();
    var it = global.Issue.current();
    var opts = '<option value="auto"' + (cur.sign === 'auto' || !cur.sign ? ' selected' : '') + '>自动（按公历日期切换）</option>';
    global.Issue.ISSUES.forEach(function (i) {
      opts += '<option value="' + i.sign + '"' + (cur.sign === i.sign ? ' selected' : '') + '>' + i.sign + '月（' + i.start[0] + '月' + i.start[1] + '日起）</option>';
    });
    return navbar('运营 · 期刊设置', '<span onclick="Auth.logout()">退出</span>')
      + '<div class="page">'
      + '<div class="sub" style="margin:8px 0 16px">当前生效：<strong style="color:var(--accent-deep)">' + esc(it.label) + ' · ' + esc(it.ym) + '</strong>' + (it.overridden ? '（手动覆盖中）' : '（自动）') + '</div>'
      + '<div class="card">'
      + '<div class="form-group"><label>期号（星座月）</label><select id="isSign">' + opts + '</select></div>'
      + '<div class="form-group"><label>卷首语（留空则使用该月默认）</label><textarea id="isMotto" placeholder="' + esc(it.motto) + '">' + esc(cur.motto || '') + '</textarea></div>'
      + '<button class="btn btn-primary" onclick="AdminActions.saveIssue()">保存并换刊</button>'
      + '</div>'
      + '<div class="hint-list">换刊只更换整站主题色、封面星盘与卷首语，页面结构不变。</div>'
      + '</div>';
  }


  global.AdminView = {
    renderAdminLogin: renderAdminLogin, renderOpsList: renderOpsList, renderOpsCodes: renderOpsCodes, renderOpsEditor: renderOpsEditor, renderOpsIssue: renderOpsIssue,
    renderReviewerList: renderReviewerList, renderReviewerDetail: renderReviewerDetail,
    renderTeacherList: renderTeacherList, renderTeacherDetail: renderTeacherDetail
  };
  global.AdminActions = AdminActions;
})(window);
