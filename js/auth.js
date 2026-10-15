/* ============================================================
   auth.js — 登录态管理
   ★ 微信授权【预留】：loginWithWechat() 空函数占位。
   角色：user / operator(运营) / reviewer(审核员) / teacher(老师)
   ============================================================ */
(function (global) {
  'use strict';

  var Store = global.Store;
  var KEYS = Store.KEYS;

  async function loginWithWechat() {
    // TODO 接入微信 OAuth：code -> openid -> 业务会话
    throw new Error('微信授权未接入，本版请使用模拟昵称登录');
  }

  async function loginUser(nickname) {
    var name = String(nickname || '').trim();
    if (!name) throw new Error('请输入昵称');
    var user = await global.DataService.createUser(name);
    Store.write(KEYS.session, { role: 'user', userId: user.id, nickname: user.nickname });
    return user;
  }

  async function loginAdmin(username, password) {
    var admin = await global.DataService.loginAdmin(String(username || '').trim(), String(password || ''));
    if (!admin) throw new Error('账号或密码错误');
    Store.write(KEYS.session, {
      role: admin.role, accountId: admin.id, username: admin.username, name: admin.name
    });
    return admin;
  }

  function getSession() { return Store.read(KEYS.session); }

  function logout() {
    Store.write(KEYS.session, null);
    location.hash = '#/';
  }

  global.Auth = {
    loginWithWechat: loginWithWechat, loginUser: loginUser, loginAdmin: loginAdmin,
    getSession: getSession, logout: logout
  };
})(window);
