/* ============================================================
   router.js — hash 路由 + 登录守卫
   ============================================================ */
(function (global) {
  'use strict';

  var U = global.Utils;

  function parse() {
    var raw = (location.hash || '#/').replace(/^#/, '');
    var query = {};
    var qIdx = raw.indexOf('?');
    if (qIdx >= 0) {
      var qs = raw.slice(qIdx + 1); raw = raw.slice(0, qIdx);
      qs.split('&').forEach(function (p) {
        var kv = p.split('=');
        if (kv[0]) query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    var path = raw.split('/').filter(Boolean);
    return { path: path, query: query };
  }

  function go(hash) { location.hash = hash; }
  function back() { history.back(); }

  async function dispatch() {
    var r = parse();
    var app = document.getElementById('app');
    var s = global.Auth.getSession();
    var root = r.path[0] || 'home';

    function require(role, loginHash) {
      if (!s || s.role !== role) { location.hash = loginHash; return false; }
      return true;
    }

    var html = '';
    try {
      if (root === 'login') {
        if (s && s.role === 'user') { location.hash = '#/'; return; }
        html = global.SiteView.renderLogin();
      } else if (root === 'content') {
        html = r.path[1] ? await global.SiteView.renderContentDetail(r.path[1]) : await global.SiteView.renderContentList();
      } else if (root === 'activity') {
        html = await global.SiteView.renderActivity();
      } else if (root === 'test') {
        html = r.path[1] ? global.SiteView.renderTestRun(r.path[1]) : global.SiteView.renderTest();
      } else if (root === 'paid') {
        html = await global.SiteView.renderPaid();
      } else if (root === 'redeem') {
        if (!require('user', '#/login')) return;
        html = await global.SiteView.renderRedeem(s);
      } else if (root === 'me') {
        if (!require('user', '#/login')) return;
        html = await global.SiteView.renderProfile(s);
      } else if (root === 'qa') {
        var sub = r.path[1];
        if (sub === 'public') {
          html = await global.SiteView.renderPublic();
        } else if (sub === 'ask') {
          if (!require('user', '#/login')) return;
          html = await global.SiteView.renderAsk(r.path[2] || null, s);
        } else if (sub === 'questions') {
          if (!require('user', '#/login')) return;
          html = r.path[2] ? await global.SiteView.renderQuestionDetail(r.path[2], s) : await global.SiteView.renderQuestions(s);
        } else {
          html = await global.SiteView.renderQaHome();
        }
      } else if (root === 'ops') {
        if (!require('operator', '#/admin/login')) return;
        if (r.path[1] === 'new') { html = await global.AdminView.renderOpsEditor(s, null); }
        else if (r.path[1] === 'codes') { html = await global.AdminView.renderOpsCodes(s); }
        else if (r.path[1] && r.path[2] === 'edit') { html = await global.AdminView.renderOpsEditor(s, r.path[1]); }
        else { html = await global.AdminView.renderOpsList(s); }
      } else if (root === 'admin') {
        if (r.path[1] === 'login') { html = global.AdminView.renderAdminLogin(); }
        else {
          if (!require('reviewer', '#/admin/login')) return;
          html = r.path[1] ? await global.AdminView.renderReviewerDetail(r.path[1], s) : await global.AdminView.renderReviewerList(s, r.query.status || 'all');
        }
      } else if (root === 'teacher') {
        if (!require('teacher', '#/admin/login')) return;
        html = r.path[1] ? await global.AdminView.renderTeacherDetail(r.path[1], s) : await global.AdminView.renderTeacherList(s, r.query.status || 'all');
      } else {
        html = await global.SiteView.renderHome();
      }
    } catch (e) {
      html = '<div class="page" style="padding-top:60px"><div class="empty">加载失败：' + U.escapeHtml(e.message) + '</div></div>';
    }

    app.innerHTML = html;
    window.scrollTo(0, 0);
    // AI 测试页：渲染后初始化聊天（恢复历史 / 触发开场）
    if (root === 'test' && global.SiteActions && global.SiteActions.testInit) {
      global.SiteActions.testInit();
    }
  }

  function start() {
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  global.Router = { start: start, go: go, back: back, parse: parse, dispatch: dispatch };
})(window);
