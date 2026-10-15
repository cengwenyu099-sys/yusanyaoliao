/* ============================================================
   seed.js — 种子演示数据
   账号：ops(运营) / admin(审核员) / teacher(老师)
   内容：图文 + 视频占位 + 付费内容墙 + 答疑
   ============================================================ */
(function (global) {
  'use strict';

  var Store = global.Store;
  var KEYS = Store.KEYS;

  // 种子数据版本号：改动 seed 内容后 bump 此值，用户刷新即自动刷新演示数据
  var SEED_VERSION = '2026-10-15-v3';

  function seedIfNeeded() {
    if (Store.read(KEYS.seeded) === SEED_VERSION) return;

    var now = Date.now();
    var d = function (n) { return now - n * 86400000; };

    // 账号
    var admins = [
      { id: 'a_ops', username: 'ops', password: '123456', role: 'operator', name: '运营' },
      { id: 'a_admin', username: 'admin', password: '123456', role: 'reviewer', name: '审核员' },
      { id: 'a_teacher', username: 'teacher', password: '123456', role: 'teacher', name: '老师' }
    ];

    // 用户（questionCredits = 剩余提问机会；sunSign/risingSign/birthInfo = 个人档案，在「我的」设置）
    var users = [
      { id: 'u_xiaoman', nickname: '小满', openid: null, questionCredits: 1, sunSign: '天蝎座', risingSign: '狮子座', birthInfo: { date: '', time: '', place: '' }, createdAt: d(30) },
      { id: 'u_luna', nickname: 'Luna', openid: null, questionCredits: 0, sunSign: '天秤座', risingSign: '射手座', birthInfo: { date: '1998-06-14', time: '14:30', place: '杭州' }, createdAt: d(28) },
      { id: 'u_axing', nickname: '阿星', openid: null, questionCredits: 0, sunSign: '双子座', risingSign: '摩羯座', birthInfo: { date: '', time: '', place: '' }, createdAt: d(25) }
    ];

    // 兑换码（运营后台批量生成，此处预置几个未使用码供演示兑换）
    var redeemCodes = [
      { id: 'rc_001', code: 'YSYL0001', status: 'unused', usedBy: null, usedAt: null, createdAt: d(0.1) },
      { id: 'rc_002', code: 'YSYL0002', status: 'unused', usedBy: null, usedAt: null, createdAt: d(0.1) },
      { id: 'rc_003', code: 'YSYL0003', status: 'used', usedBy: 'u_xiaoman', usedAt: d(5), createdAt: d(6) }
    ];

    // 内容（主干）—— sunTags/riseTags 为星座标签，用于「为您推荐」按用户太阳/上升星座匹配
    var contents = [
      {
        id: 'c_001', title: '十月运势指南：在变局里安顿自己',
        type: 'article', summary: '十月天象纷扰，本月的关键词是「收」而非「进」。逐星座聊聊这一个月适合做什么、避开什么。',
        body: '十月天象纷扰，本月的关键词是「收」而非「进」。\n\n木星仍在金牛缓慢行进，提醒我们关注身体与财务的基本盘；月中水星进入天蝎，思维容易钻牛角尖，也容易翻旧账。\n\n给十二星座一句话：\n火象（白羊、狮子、射手）：把冲劲用在清理，而不是开新局。\n土象（金牛、处女、摩羯）：财务上少做决定，多复盘。\n风象（双子、天秤、水瓶）：沟通容易擦枪走火，先听后说。\n水象（巨蟹、天蝎、双鱼）：情绪起伏大，给自己留白。\n\n药寮一方：这个月，先照顾好身体，再谈其他。',
        sunTags: ['天蝎座'], riseTags: [],
        status: 'published', author: '飞鱼十三香', createdAt: d(1), updatedAt: d(1)
      },
      {
        id: 'c_002', title: '你的星盘里，藏着哪种「情绪模式」',
        type: 'article', summary: '月亮星座决定了你如何消化情绪。看不懂没关系，这篇带你对号入座。',
        body: '我们常说太阳星座是「你想成为的样子」，而月亮星座，是你情绪本能的底色。\n\n月亮落在火象：情绪来得快去得也快，需要行动来释放。\n月亮落在土象：情绪被压在身体里，容易累积成疲惫。\n月亮落在风象：习惯用「讲道理」来回避感受。\n月亮落在水象：情绪是海，需要独处的时间来退潮。\n\n药寮一方：认识自己的情绪模式，不是为了改掉它，而是为了不再被它牵着走。',
        sunTags: ['天秤座'], riseTags: [],
        status: 'published', author: '飞鱼十三香', createdAt: d(3), updatedAt: d(3)
      },
      {
        id: 'c_003', title: '水逆来了，先别慌，也别乱做决定',
        type: 'article', summary: '水逆期间最该做的三件事，和最容易犯的三个错。',
        body: '水逆从来不是「倒霉」，它更像一次系统的例行检修。\n\n最该做的三件事：\n1. 备份、核对、确认——重要的事留痕。\n2. 复盘旧项目、联系旧朋友。\n3. 慢下来，给判断留缓冲。\n\n最容易犯的三个错：\n1. 冲动签约或做重大决定。\n2. 因为沟通误会翻脸。\n3. 把「不顺」都归咎于水逆。\n\n药寮一方：真正的转运，是学会在动荡里稳住自己的节奏。',
        sunTags: ['双子座'], riseTags: [],
        status: 'published', author: '飞鱼十三香', createdAt: d(5), updatedAt: d(5)
      },
      {
        id: 'c_004', title: '本周星象回顾（视频）',
        type: 'video', summary: '上周末的星象视频，聊了满月与关系议题。',
        body: '视频内容通过第三方平台接入，本版为占位演示。',
        sunTags: [], riseTags: ['狮子座'],
        status: 'published', author: '飞鱼十三香', createdAt: d(2), updatedAt: d(2)
      },
      {
        id: 'c_005', title: '十月天象视频解读',
        type: 'video', summary: '十月满月与新月的能量节奏，视频讲解本月重点。',
        body: '视频内容通过第三方平台接入，本版为占位演示。',
        sunTags: ['白羊座'], riseTags: [],
        status: 'published', author: '飞鱼十三香', createdAt: d(0.5), updatedAt: d(0.5)
      },
      {
        id: 'c_006', title: '草稿：关于「上升星座」的误区',
        type: 'article', summary: '（运营后台草稿，前端不展示）',
        body: '上升星座不是「面具」，它是你与世界打交道的方式。草稿内容，待完善后上架。',
        sunTags: ['摩羯座'], riseTags: [],
        status: 'draft', author: '飞鱼十三香', createdAt: d(0.2), updatedAt: d(0.2)
      }
    ];

    // 付费内容墙（预留，不接支付）
    var paidContents = [
      { id: 'p_001', title: '星盘精读课（录播）', type: 'course', price: '¥199', summary: '系统讲清你的星盘，12 节课 + 作业批改', thirdPartyLink: null, createdAt: d(6) },
      { id: 'p_002', title: '一对一深度咨询', type: 'consult', price: '¥399', summary: '60 分钟语音咨询，只聊你当下的卡点', thirdPartyLink: null, createdAt: d(6) },
      { id: 'p_003', title: '月度运势专栏', type: 'column', price: '¥29.9', summary: '每月一封运势长文 + 重点提醒', thirdPartyLink: null, createdAt: d(7) },
      { id: 'p_004', title: '星象视频合集', type: 'replay', price: '¥49', summary: '过往星象视频精剪，永久回看', thirdPartyLink: null, createdAt: d(7) }
    ];

    // 答疑（钩子）
    var questions = [
      { id: 'q_001', userId: 'u_xiaoman', content: '我和巨蟹座男友最近总是冷战，感觉他越来越冷淡。太阳天蝎、上升狮子，这段感情还能走下去吗？', visibility: 'public', nicknameVisible: true, sunSign: '天蝎座', risingSign: '狮子座', birthInfo: { date: '', time: '', place: '' }, status: 'pending', rejectReason: '', answer: '', answerAt: null, answeredBy: null, reviewedAt: null, reviewedBy: null, resubmitCount: 0, createdAt: d(0.1), updatedAt: d(0.1) },
      { id: 'q_002', userId: 'u_luna', content: '最近工作变动很迷茫，想看看事业方向。私密提问，附了出生信息。', visibility: 'private', nicknameVisible: false, sunSign: '天秤座', risingSign: '', birthInfo: { date: '1998-06-14', time: '14:30', place: '杭州' }, status: 'pending', rejectReason: '', answer: '', answerAt: null, answeredBy: null, reviewedAt: null, reviewedBy: null, resubmitCount: 0, createdAt: d(0.2), updatedAt: d(0.2) },
      { id: 'q_003', userId: 'u_axing', content: '水逆期间适合提离职吗？太阳双子、上升摩羯，纠结很久了。', visibility: 'public', nicknameVisible: false, sunSign: '双子座', risingSign: '摩羯座', birthInfo: { date: '', time: '', place: '' }, status: 'approved', rejectReason: '', answer: '', answerAt: null, answeredBy: null, reviewedAt: d(0.5), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(0.6), updatedAt: d(0.5) },
      { id: 'q_004', userId: 'u_xiaoman', content: '家里催婚压力很大，感情方面有什么建议？私密提问。', visibility: 'private', nicknameVisible: false, sunSign: '天蝎座', risingSign: '狮子座', birthInfo: { date: '', time: '', place: '' }, status: 'approved', rejectReason: '', answer: '', answerAt: null, answeredBy: null, reviewedAt: d(1), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(1.2), updatedAt: d(1) },
      { id: 'q_005', userId: 'u_luna', content: '太阳天秤、上升射手，最近桃花运如何？', visibility: 'public', nicknameVisible: true, sunSign: '天秤座', risingSign: '射手座', birthInfo: { date: '', time: '', place: '' }, status: 'answered', rejectReason: '', answer: '你的金星近期与木星有柔和相位，确实容易吸引到人。但上升射手的人，心容易飘，先想清楚自己要的是「心动」还是「安稳」。这个秋天，适合慢热一点。', answerAt: d(2), answeredBy: 'teacher', reviewedAt: d(2.1), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(2.5), updatedAt: d(2) },
      { id: 'q_006', userId: 'u_axing', content: '为什么我总是吸引到不对的人？太阳双子、上升摩羯。', visibility: 'public', nicknameVisible: false, sunSign: '双子座', risingSign: '摩羯座', birthInfo: { date: '', time: '', place: '' }, status: 'answered', rejectReason: '', answer: '上升摩羯的人容易在关系里过度负责，把「可靠」误当成「被爱」。你吸引来的，往往是你习惯扮演的角色，而不是你真正需要的人。先学会在关系里松一口气。', answerAt: d(3), answeredBy: 'teacher', reviewedAt: d(3.1), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(3.5), updatedAt: d(3) },
      { id: 'q_007', userId: 'u_luna', content: '帮我算算我什么时候能发财。', visibility: 'public', nicknameVisible: false, sunSign: '', risingSign: '', birthInfo: { date: '', time: '', place: '' }, status: 'rejected', rejectReason: '超出答疑边界', answer: '', answerAt: null, answeredBy: null, reviewedAt: d(1.5), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(1.8), updatedAt: d(1.5) },
      { id: 'q_008', userId: 'u_xiaoman', content: '一句话告诉我明天该不该表白。', visibility: 'private', nicknameVisible: false, sunSign: '', risingSign: '', birthInfo: { date: '', time: '', place: '' }, status: 'rejected', rejectReason: '信息不完整', answer: '', answerAt: null, answeredBy: null, reviewedAt: d(2.2), reviewedBy: 'admin', resubmitCount: 0, createdAt: d(2.4), updatedAt: d(2.2) }
    ];

    Store.writeList(KEYS.admins, admins);
    Store.writeList(KEYS.users, users);
    Store.writeList(KEYS.contents, contents);
    Store.writeList(KEYS.paidContents, paidContents);
    Store.writeList(KEYS.redeemCodes, redeemCodes);
    Store.writeList(KEYS.questions, questions);
    Store.write(KEYS.seeded, SEED_VERSION);
    Store.write(KEYS.session, null); // 用户列表已重置，同步清空登录态，避免 session 指向已删除用户
  }

  global.Seed = { seedIfNeeded: seedIfNeeded };
})(window);
