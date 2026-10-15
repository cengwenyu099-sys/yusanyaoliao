/* ============================================================
   service.js — service 层（数据唯一入口 + 权限硬过滤 + 状态机）
   页面/视图不直接碰存储；接入真实 API 时只改本层实现。
   ============================================================ */
(function (global) {
  'use strict';

  var Store = global.Store;
  var KEYS = Store.KEYS;
  var U = global.Utils;

  function _list(key) { return Store.readList(key); }
  function _save(key, list) { Store.writeList(key, list); }

  function _sort(qs) { return qs.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt); }); }

  function _withNickname(q) {
    var u = _list(KEYS.users).filter(function (x) { return x.id === q.userId; })[0];
    var copy = Object.assign({}, q);
    copy.nickname = u ? u.nickname : '';
    return copy;
  }

  // ================= 用户 =================
  async function createUser(nickname) {
    var users = _list(KEYS.users);
    var user = users.filter(function (u) { return u.nickname === nickname; })[0];
    if (!user) {
      user = { id: U.uid('u'), nickname: nickname, openid: null, questionCredits: 0, sunSign: '', risingSign: '', birthInfo: { date: '', time: '', place: '' }, createdAt: Date.now() };
      users.push(user);
      _save(KEYS.users, users);
    }
    return user;
  }

  // 更新用户档案（星座/出生信息）
  async function updateUserProfile(userId, profile) {
    var users = _list(KEYS.users);
    var u = users.filter(function (x) { return x.id === userId; })[0];
    if (!u) throw new Error('用户不存在');
    u.sunSign = profile.sunSign || '';
    u.risingSign = profile.risingSign || '';
    u.birthInfo = profile.birthInfo || { date: '', time: '', place: '' };
    _save(KEYS.users, users);
    return u;
  }

  async function loginAdmin(username, password) {
    var admins = _list(KEYS.admins);
    return admins.filter(function (a) { return a.username === username && a.password === password; })[0] || null;
  }

  // ================= 内容（主干） =================
  // 前端只取已发布（硬过滤，草稿/下架不外泄）
  async function listPublishedContents() {
    return _sort(_list(KEYS.contents).filter(function (c) { return c.status === 'published'; }));
  }

  // 运营后台：取全部（含草稿/下架）
  async function listAllContents() {
    return _sort(_list(KEYS.contents));
  }

  async function getContent(id) {
    return _list(KEYS.contents).filter(function (c) { return c.id === id; })[0] || null;
  }

  async function getPublishedContent(id) {
    var c = _list(KEYS.contents).filter(function (x) { return x.id === id; })[0];
    if (!c || c.status !== 'published') return null;
    return c;
  }

  async function createContent(payload) {
    var list = _list(KEYS.contents);
    var c = {
      id: U.uid('c'),
      title: payload.title,
      type: payload.type || 'article',
      summary: payload.summary || '',
      body: payload.body || '',
      sunTags: payload.sunTags || [],
      riseTags: payload.riseTags || [],
      status: payload.status || 'draft',
      author: payload.author || '飞鱼十三香',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    list.push(c);
    _save(KEYS.contents, list);
    return c;
  }

  async function updateContent(id, payload) {
    var list = _list(KEYS.contents);
    var c = list.filter(function (x) { return x.id === id; })[0];
    if (!c) throw new Error('内容不存在');
    c.title = payload.title; c.type = payload.type || c.type;
    c.summary = payload.summary || ''; c.body = payload.body || '';
    c.sunTags = payload.sunTags || [];
    c.riseTags = payload.riseTags || [];
    c.status = payload.status || c.status;
    c.updatedAt = Date.now();
    _save(KEYS.contents, list);
    return c;
  }

  // 按用户太阳/上升星座推荐：标签命中的优先，其余按时间排
  async function listRecommendedContents(sunSign, risingSign) {
    var list = _list(KEYS.contents).filter(function (c) { return c.status === 'published'; });
    var hit = [], rest = [];
    list.forEach(function (c) {
      var s = c.sunTags || [], r = c.riseTags || [];
      var matched = (sunSign && s.indexOf(sunSign) >= 0) || (risingSign && r.indexOf(risingSign) >= 0);
      if (matched) hit.push(c); else rest.push(c);
    });
    return _sort(hit).concat(_sort(rest));
  }

  async function setContentStatus(id, status) {
    var list = _list(KEYS.contents);
    var c = list.filter(function (x) { return x.id === id; })[0];
    if (!c) throw new Error('内容不存在');
    c.status = status;
    c.updatedAt = Date.now();
    _save(KEYS.contents, list);
    return c;
  }

  // ================= 付费内容墙 =================
  async function listPaidContents() {
    return _sort(_list(KEYS.paidContents));
  }

  // ================= 兑换码 =================
  function _genCode() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 8; i++) { s += chars[Math.floor(Math.random() * chars.length)]; }
    return s;
  }

  async function generateRedeemCodes(n) {
    var list = _list(KEYS.redeemCodes);
    var codes = [];
    for (var i = 0; i < n; i++) {
      var c = { id: U.uid('rc'), code: _genCode(), status: 'unused', usedBy: null, usedAt: null, createdAt: Date.now() };
      list.push(c); codes.push(c);
    }
    _save(KEYS.redeemCodes, list);
    return codes;
  }

  async function listRedeemCodes() {
    return _list(KEYS.redeemCodes).slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  async function redeemCode(code, userId) {
    var list = _list(KEYS.redeemCodes);
    var c = list.filter(function (x) { return x.code === String(code).toUpperCase() && x.status === 'unused'; })[0];
    if (!c) throw new Error('兑换码无效或已使用');
    c.status = 'used'; c.usedBy = userId; c.usedAt = Date.now();
    _save(KEYS.redeemCodes, list);
    var users = _list(KEYS.users);
    var u = users.filter(function (x) { return x.id === userId; })[0];
    if (!u) throw new Error('用户不存在');
    u.questionCredits = (u.questionCredits || 0) + 1;
    _save(KEYS.users, users);
    return u;
  }

  async function getUserById(id) {
    return _list(KEYS.users).filter(function (x) { return x.id === id; })[0] || null;
  }

  // ================= 答疑（钩子） =================
  async function createQuestion(payload) {
    var users = _list(KEYS.users);
    var u = users.filter(function (x) { return x.id === payload.userId; })[0];
    if (!u) throw new Error('用户不存在，请先登录');
    if ((u.questionCredits || 0) <= 0) throw new Error('没有提问机会，请先兑换');
    if (payload.visibility === 'public') {
      if (!u.sunSign) throw new Error('公开提问请先在「我的」设置太阳星座');
      if (!u.risingSign) throw new Error('公开提问请先在「我的」设置上升星座');
    }
    var qs = _list(KEYS.questions);
    var q = {
      id: U.uid('q'), userId: payload.userId, content: payload.content,
      visibility: payload.visibility, nicknameVisible: !!payload.nicknameVisible,
      sunSign: u.sunSign || '', risingSign: u.risingSign || '',
      birthInfo: u.birthInfo || { date: '', time: '', place: '' },
      status: 'pending', rejectReason: '', answer: '', answerAt: null, answeredBy: null,
      reviewedAt: null, reviewedBy: null, resubmitCount: 0, createdAt: Date.now(), updatedAt: Date.now()
    };
    qs.push(q); _save(KEYS.questions, qs);
    u.questionCredits -= 1; _save(KEYS.users, users);
    return q;
  }

  async function resubmitQuestion(id, payload) {
    var qs = _list(KEYS.questions);
    var q = qs.filter(function (x) { return x.id === id; })[0];
    if (!q || q.status !== 'rejected') throw new Error('仅被拒绝的问题可修改重提');
    var u = _list(KEYS.users).filter(function (x) { return x.id === q.userId; })[0];
    if (payload.visibility === 'public') {
      if (!u.sunSign) throw new Error('公开提问请先在「我的」设置太阳星座');
      if (!u.risingSign) throw new Error('公开提问请先在「我的」设置上升星座');
    }
    q.content = payload.content; q.visibility = payload.visibility;
    q.nicknameVisible = !!payload.nicknameVisible;
    q.sunSign = u.sunSign || ''; q.risingSign = u.risingSign || '';
    q.birthInfo = u.birthInfo || { date: '', time: '', place: '' };
    q.status = 'pending'; q.rejectReason = ''; q.reviewedAt = null; q.reviewedBy = null;
    q.resubmitCount = (q.resubmitCount || 0) + 1; q.updatedAt = Date.now();
    _save(KEYS.questions, qs); return q;
  }

  async function listMyQuestions(userId) {
    return _sort(_list(KEYS.questions).filter(function (q) { return q.userId === userId; }).map(_withNickname));
  }

  async function listPublicQA() {
    return _sort(_list(KEYS.questions).filter(function (q) { return q.status === 'answered' && q.visibility === 'public'; }).map(_withNickname));
  }

  async function listAllForReviewer(status) {
    var qs = _list(KEYS.questions);
    if (status && status !== 'all') qs = qs.filter(function (q) { return q.status === status; });
    return _sort(qs.map(_withNickname));
  }

  async function listForTeacher(status) {
    var qs = _list(KEYS.questions).filter(function (q) { return q.status === 'approved' || q.status === 'answered'; });
    if (status && status !== 'all') qs = qs.filter(function (q) { return q.status === status; });
    return _sort(qs.map(_withNickname));
  }

  async function getQuestionForUser(id, userId) {
    var q = _list(KEYS.questions).filter(function (x) { return x.id === id; })[0];
    if (!q || q.userId !== userId) return null;
    return q;
  }
  async function getQuestionForAdmin(id) {
    return _list(KEYS.questions).filter(function (x) { return x.id === id; })[0] || null;
  }
  async function getQuestionForTeacher(id) {
    var q = _list(KEYS.questions).filter(function (x) { return x.id === id; })[0];
    if (!q || (q.status !== 'approved' && q.status !== 'answered')) return null;
    return q;
  }

  async function approveQuestion(id, reviewer) {
    var qs = _list(KEYS.questions);
    var q = qs.filter(function (x) { return x.id === id; })[0];
    if (!q || q.status !== 'pending') throw new Error('仅待审核问题可执行通过');
    q.status = 'approved'; q.reviewedAt = Date.now(); q.reviewedBy = reviewer; q.updatedAt = Date.now();
    _save(KEYS.questions, qs); return q;
  }

  async function rejectQuestion(id, reviewer, reason) {
    var qs = _list(KEYS.questions);
    var q = qs.filter(function (x) { return x.id === id; })[0];
    if (!q || q.status !== 'pending') throw new Error('仅待审核问题可执行拒绝');
    q.status = 'rejected'; q.rejectReason = reason || ''; q.reviewedAt = Date.now(); q.reviewedBy = reviewer; q.updatedAt = Date.now();
    _save(KEYS.questions, qs); return q;
  }

  async function setVisibility(id, visibility) {
    var qs = _list(KEYS.questions);
    var q = qs.filter(function (x) { return x.id === id; })[0];
    if (!q) throw new Error('问题不存在');
    q.visibility = visibility; q.updatedAt = Date.now();
    _save(KEYS.questions, qs); return q;
  }

  async function answerQuestion(id, teacher, answer) {
    var qs = _list(KEYS.questions);
    var q = qs.filter(function (x) { return x.id === id; })[0];
    if (!q) throw new Error('问题不存在');
    if (q.status !== 'approved') throw new Error('仅待回复（已通过）问题可回复');
    q.answer = answer; q.status = 'answered'; q.answerAt = Date.now(); q.answeredBy = teacher; q.updatedAt = Date.now();
    _save(KEYS.questions, qs); return q;
  }
  // ================= 期刊设置（星座月刊） =================
  function getIssueSettingsSync() {
    return Store.read(KEYS.issue) || { sign: 'auto', motto: '' };
  }
  async function getIssueSettings() { return getIssueSettingsSync(); }
  async function setIssueSettings(payload) {
    var s = { sign: payload.sign || 'auto', motto: String(payload.motto || '').trim() };
    Store.write(KEYS.issue, s);
    return s;
  }

  // ================= 答疑名额（前 500 名） =================
  var QUOTA_TOTAL = 500;
  async function getQuotaRemaining() {
    var used = _list(KEYS.redeemCodes).filter(function (c) { return c.status === 'used'; }).length;
    return Math.max(0, QUOTA_TOTAL - used);
  }


  // ================= 导出 =================
  async function exportRows() {
    var qs = _list(KEYS.questions);
    var users = _list(KEYS.users);
    var rows = [['问题ID', '昵称', '太阳星座', '上升星座', '公开/私密', '昵称展示', '状态', '问题内容', '回复', '拒绝理由', '提问时间', '回复时间', '审核人', '回复老师']];
    qs.forEach(function (q) {
      var u = users.filter(function (x) { return x.id === q.userId; })[0] || {};
      rows.push([q.id, u.nickname || '', q.sunSign || '', q.risingSign || '', q.visibility === 'public' ? '公开' : '私密', q.nicknameVisible ? '显示昵称' : '匿名', U.statusLabel(q.status), q.content, q.answer || '', q.rejectReason || '', U.fmt(q.createdAt), q.answerAt ? U.fmt(q.answerAt) : '', q.reviewedBy || '', q.answeredBy || '']);
    });
    return rows;
  }

  global.DataService = {
    createUser: createUser, loginAdmin: loginAdmin, getUserById: getUserById, updateUserProfile: updateUserProfile,
    listPublishedContents: listPublishedContents, listAllContents: listAllContents, listRecommendedContents: listRecommendedContents,
    getContent: getContent, getPublishedContent: getPublishedContent,
    createContent: createContent, updateContent: updateContent, setContentStatus: setContentStatus,
    listPaidContents: listPaidContents,
    generateRedeemCodes: generateRedeemCodes, listRedeemCodes: listRedeemCodes, redeemCode: redeemCode,
    createQuestion: createQuestion, resubmitQuestion: resubmitQuestion,
    listMyQuestions: listMyQuestions, listPublicQA: listPublicQA,
    listAllForReviewer: listAllForReviewer, listForTeacher: listForTeacher,
    getQuestionForUser: getQuestionForUser, getQuestionForAdmin: getQuestionForAdmin, getQuestionForTeacher: getQuestionForTeacher,
    approveQuestion: approveQuestion, rejectQuestion: rejectQuestion, setVisibility: setVisibility, answerQuestion: answerQuestion,
    getIssueSettingsSync: getIssueSettingsSync, getIssueSettings: getIssueSettings, setIssueSettings: setIssueSettings, getQuotaRemaining: getQuotaRemaining,
    exportRows: exportRows
  };
})(window);
