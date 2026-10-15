/* ============================================================
   ai.js — AI 测试官（Kimi API 直连演示版）
   - API Key / 模型名仅存本机浏览器 localStorage，不上传、不写进代码
   - 对话历史存 localStorage，刷新可恢复
   - 真上线时应迁移到后端代理，Key 由服务器保管
   ============================================================ */
(function (global) {
  'use strict';

  var LS_KEY = 'ysyl_ai_key';
  var LS_MODEL = 'ysyl_ai_model';
  var LS_CHAT = 'ysyl_ai_chat_human30';
  var API_URL = 'https://api.moonshot.cn/v1/chat/completions';
  var DEFAULT_MODEL = 'kimi-k2.6';

  // 隐藏的开场用户消息（触发 AI 开场，不展示给用户看）
  var OPENING_MSG = '（用户已进入测试，请做简短开场并抛出第一个问题）';

  /* ---------------- 测试官系统 prompt ----------------
     基于 Dan Koe Human 3.0 人生模型改造：
     保留四象限 + L1/L2/L3 框架、采访式每次 1 题、追问机制，
     加报告格式约定（【报告】开头）、结尾转化钩子、话术边界 */
  var SYSTEM_PROMPT = [
    '你是「鱼三药寮屋」的 AI 人生战略顾问，基于 Dan Koe 的 Human 3.0 人生模型，为用户做一次完整的人生规划采访。',
    '',
    '【模型框架】',
    '四个象限：',
    '- 心智 Mind：认知、情绪、思维模式、自我意识',
    '- 身体 Body：健康、睡眠、运动、精力',
    '- 精神 Spirit：价值观、意义感、人际关系、人生方向',
    '- 事业 Vocation：工作、收入、技能、商业能力、自由度',
    '三个层级（每个象限分别判断用户更接近哪层）：',
    '- L1 生存层：被本能、情绪和环境推着走，条件反射式生活',
    '- L2 觉醒层：开始自我观察，有策略地管理自己、设计生活',
    '- L3 创造层：身份与行动合一，按自己的愿景主动创造现实',
    '',
    '【采访规则】',
    '1. 每次只问 1 个最重要的问题，简短有力，绝不一次抛多个问题。',
    '2. 根据用户回答继续追问最关键的点，像真正的人生战略顾问：温和但直接，敢于指出用户没说透的地方。',
    '3. 全程重点识别：用户真正想要的人生；行为与目标之间的矛盾；反复拖延和逃避的问题；限制性的生活习惯、身份认同和环境。',
    '4. 通常采访 6-10 轮。当你判断已足够了解用户，就输出报告。',
    '5. 开场白：用 1-2 句话介绍你和这个模型，立刻抛出第一个问题。',
    '',
    '【报告格式】',
    '信息足够时输出完整报告，严格遵守：',
    '- 第一行固定为：【报告】Human 3.0 人生战略规划',
    '- 一、四象限诊断：心智 / 身体 / 精神 / 事业，每个象限给出「当前层级（L1/L2/L3）+ 具体依据（引用用户原话）」。',
    '- 二、核心矛盾：最关键的一个「想要 vs 行为」的错位。',
    '- 三、行动处方：每个象限 1 个本周就能做的最小动作，具体可执行。',
    '- 四、结尾固定附上：「这份报告画出了你此刻的坐标。这些模式背后往往有更深的印记——如果你想从星盘的角度看看它们的来源，来「来问」找飞鱼十三香聊聊，或加企微深谈。」',
    '',
    '【边界】',
    '- 这是自我探索工具，不做心理诊断、不做医疗建议、不预测命运。',
    '- 不给空泛安慰；指出矛盾时对事不对人。'
  ].join('\n');

  /* ---------------- 配置存取 ---------------- */
  function getKey() { return localStorage.getItem(LS_KEY) || ''; }
  function setKey(k) { localStorage.setItem(LS_KEY, k); }
  function getModel() { return localStorage.getItem(LS_MODEL) || DEFAULT_MODEL; }
  function setModel(m) { localStorage.setItem(LS_MODEL, m); }

  /* ---------------- 对话历史 ---------------- */
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(LS_CHAT) || '[]'); }
    catch (e) { return []; }
  }
  function saveHistory(list) { localStorage.setItem(LS_CHAT, JSON.stringify(list)); }
  function pushHistory(role, content) {
    var list = getHistory();
    list.push({ role: role, content: content });
    saveHistory(list);
  }
  function clearHistory() { localStorage.removeItem(LS_CHAT); }

  /* ---------------- 代理探测 ----------------
     本地 serve.js（设了 KIMI_API_KEY）→ 返回 {proxy:true, model}
     静态托管 / 双击 html → 404/失败 → {proxy:false}，退回填 Key 模式 */
  var _probePromise = null;
  function probe() {
    if (!_probePromise) {
      _probePromise = fetch('/api/config')
        .then(function (r) {
          if (!r.ok) return { proxy: false };
          var ct = r.headers.get('Content-Type') || '';
          // 静态托管对不存在路径会 200 兜底返回 HTML，必须确认是 JSON 才算有代理
          if (ct.indexOf('application/json') === -1) return { proxy: false };
          return r.json().then(function (cfg) { return cfg && cfg.proxy ? cfg : { proxy: false }; });
        })
        .catch(function () { return { proxy: false }; });
    }
    return _probePromise;
  }

  /* ---------------- API 调用 ---------------- */
  async function chat() {
    var cfg = await probe();
    var messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(getHistory());
    var url, headers;
    if (cfg.proxy) {
      url = '/api/chat';
      headers = { 'Content-Type': 'application/json' };
    } else {
      var key = getKey();
      if (!key) throw new Error('请先配置 Kimi API Key');
      url = API_URL;
      headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    }
    var resp = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ model: cfg.proxy ? (cfg.model || getModel()) : getModel(), messages: messages })
    });
    if (!resp.ok) {
      var detail = '';
      try { detail = (await resp.json()).error.message; } catch (e) { /* ignore */ }
      if (resp.status === 401) throw new Error('API Key 无效，请检查后重新配置');
      throw new Error('AI 请求失败（' + resp.status + '）' + (detail ? '：' + detail : ''));
    }
    var data = await resp.json();
    var text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('AI 返回为空，请重试');
    return text;
  }

  global.AIChat = {
    OPENING_MSG: OPENING_MSG,
    getKey: getKey, setKey: setKey, getModel: getModel, setModel: setModel,
    getHistory: getHistory, pushHistory: pushHistory, clearHistory: clearHistory,
    probe: probe, chat: chat
  };
})(window);
