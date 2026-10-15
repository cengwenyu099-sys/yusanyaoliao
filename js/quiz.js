/* ============================================================
   quiz.js — 测试中心（注册表架构）
   「测一测」是一个板块，可挂多个测试。
   ★ 新增测试：在下方 TESTS 里加一个条目（题目 + 象限/维度 +
     计分 + 介绍结构）即可，前端列表与运行页自动展示，无需改 UI。
   ============================================================ */
(function (global) {
  'use strict';

  var LEVEL_NAME = { l1: '生存层', l2: '觉醒层', l3: '创造层' };
  var LEVEL_RANK = { l1: 1, l2: 2, l3: 3 };

  /* ============================================================
     测试 1：Human 3.0 四象限人生测试（Dan Koe Human 3.0）
     ============================================================ */
  var H30_QUESTIONS = [
    { d: 'mind', q: '遇到突发压力，你的第一反应是？', opts: ['情绪一下子上头，被当下牵着走', '能觉察到情绪，但要缓一缓才稳下来', '能快速抽身，观察并转化这股情绪'] },
    { d: 'mind', q: '做重要决定时，你更靠？', opts: ['直觉或惯性，做完才回头想', '会权衡利弊，有意识地选', '有自己的判断框架，还会不断迭代'] },
    { d: 'mind', q: '别人指出你的问题时，你通常？', opts: ['本能想反驳或防御', '当下不舒服，事后会反思', '能当场把「对错」和「成长」分开看'] },
    { d: 'mind', q: '一天结束后，你会？', opts: ['很少回头看，日子推着过', '偶尔想复盘，但常常不了了之', '有固定复盘习惯，并据此调整'] },

    { d: 'body', q: '你的睡眠状态更接近？', opts: ['熬夜成习，身体经常报警', '想规律但常破功，时好时坏', '有稳定作息，睡眠是主动管理项'] },
    { d: 'body', q: '运动这件事，你？', opts: ['基本不运动，靠底子撑着', '想坚持但三分钟热度', '有固定运动节律，把它当充电'] },
    { d: 'body', q: '精力管理上，你通常？', opts: ['硬扛，累了靠咖啡或硬顶', '知道自己会累，但恢复方式单一', '清楚自己的精力曲线，主动安排张弛'] },
    { d: 'body', q: '身体发出信号（疲惫、不适）时，你？', opts: ['忽略，直到扛不住', '会注意，但常拖到不得不处理', '及时响应，把身体当伙伴'] },

    { d: 'spirit', q: '谈到「我想要什么样的人生」，你？', opts: ['没太想过，走一步看一步', '有模糊方向，但说不清具体图景', '有清晰愿景，并据此做取舍'] },
    { d: 'spirit', q: '关于「意义感」，你更接近？', opts: ['常感空虚，忙却不知为什么忙', '偶尔思考，但没有稳定答案', '清楚什么对自己重要，并能安住于此'] },
    { d: 'spirit', q: '面对重要的人际关系，你？', opts: ['被动应对，随缘', '想经营，但常被情绪或忙碌打断', '主动选择并用心维护核心关系'] },
    { d: 'spirit', q: '当被外界声音淹没时，你？', opts: ['很容易被带偏，怀疑自己', '会挣扎，但最终常向外界妥协', '有自己的锚点，能守住而不对抗'] },

    { d: 'vocation', q: '你的工作状态更接近？', opts: ['为生计而做，谈不上喜不喜欢', '在努力提升，但方向仍有些模糊', '清楚为什么做，并主动设计路径'] },
    { d: 'vocation', q: '关于「能力成长」，你？', opts: ['靠工作要求被动学，够用就行', '会主动学，但常囤积不落地', '有明确的能力地图，边学边用'] },
    { d: 'vocation', q: '收入这件事，你的模式是？', opts: ['靠一份固定收入，随遇而安', '想开辟第二收入，但迟迟未动', '有意识构建多元收入，逐步拿回主动权'] },
    { d: 'vocation', q: '关于「自由度」，你更接近？', opts: ['时间被安排，渴望自由却无力改变', '在为自由努力，但还在积累阶段', '已能主动掌控节奏，逐步拿回自主权'] }
  ];

  var H30_QUADRANTS = {
    mind: {
      label: '心智 Mind',
      desc: '认知 · 情绪 · 思维 · 自我意识',
      levels: {
        l1: '你大多时候是被情绪和惯性推着走，念头来了就信，情绪起了就冲。好消息是，你并不缺少觉察的能力，只是还没把它用起来。',
        l2: '你已经能观察到自己的情绪和思维，不再完全被它们带着走；但「看清」和「转化」之间还有一段距离。下一步不是更用力地控制，而是建几套可复用的思维框架。',
        l3: '你已经能稳定地「看着」自己：情绪来了能接住，念头来了能辨别。心智这一环，是你的底盘，也是你最强的资产。'
      },
      actions: {
        l1: '本周每天睡前花 2 分钟，只写下一件「今天被情绪带走的事」，不评判、不解决。',
        l2: '挑一个反复出现的情绪，写下它出现前 30 秒，你的身体或环境发生了什么变化。',
        l3: '把你最常用的一条判断写下来，问自己一句：这是「框架」，还是「惯性」。'
      }
    },
    body: {
      label: '身体 Body',
      desc: '健康 · 睡眠 · 运动 · 精力',
      levels: {
        l1: '你的身体长期处在「被透支、被忽略」的状态，靠底子和硬撑在续命。这一环如果不补，其他三环再亮，也会被身体拖垮。',
        l2: '你已经知道身体重要，也断续在努力，但还没形成稳定的节律。缺的不是决心，是一套简单到「不费劲就能做」的固定动作。',
        l3: '你把身体当成了能量的来源而非消耗品，作息、运动、精力都有意识地管理着。这是很稀缺的长期主义。'
      },
      actions: {
        l1: '今晚比平时早睡 30 分钟，只做这一件，连续 7 天。',
        l2: '选定一个固定运动时间（哪怕 10 分钟），先坚持 7 天，不追求强度。',
        l3: '给自己设一个「精力红绿灯」，每周复盘一次：什么让你充电、什么让你漏电。'
      }
    },
    spirit: {
      label: '精神 Spirit',
      desc: '价值观 · 意义感 · 关系 · 方向',
      levels: {
        l1: '你更多是被外界推着走，关于「自己到底要什么」还是一片模糊。这不是缺陷，而是你还没有停下来问过自己这个问题。',
        l2: '你心里有方向，但还不够清晰，也常被外界声音干扰。你需要的是把那个模糊的图景，具体地写下来。',
        l3: '你有清晰的愿景和稳定的内核，知道什么对自己重要，也能守住不被带偏。精神这一环，是驱动你其他三环的燃料。'
      },
      actions: {
        l1: '写下「如果钱和时间都不是问题，我理想的一天长什么样」，只写画面，不写计划。',
        l2: '写下你最重视的 3 个价值观，然后给每一条打分：最近一个月，我真的在做吗？',
        l3: '选一个你最在意的核心关系，本周做一件「只有你才会为 TA 做」的小事。'
      }
    },
    vocation: {
      label: '事业 Vocation',
      desc: '工作 · 收入 · 技能 · 自由度',
      levels: {
        l1: '工作对你更多是「谋生」而非「选择」，自由和时间都不是你能说了算的。但请记住：被动不是你的错，只是你还没开始设计这一环。',
        l2: '你已经在努力，方向和能力都在积累，但还差临门一脚——把「想」变成「做」，把「学」变成「用」。',
        l3: '你清楚自己为什么工作，也在主动设计路径、构建能力与收入。事业这一环，你已经从「打工」走向了「经营自己」。'
      },
      actions: {
        l1: '把现在工作的「得」与「失」写下来，只分两类，不评判、不急着跳。',
        l2: '选一个你想发展的技能，本周只学一个最小单元，并立刻用一次。',
        l3: '把「自由」翻译成 3 个可衡量的具体指标，写下来，月底回看。'
      }
    }
  };

  var H30_ORDER = ['mind', 'body', 'spirit', 'vocation'];

  function h30Level(total) { return total <= 2 ? 'l1' : (total <= 5 ? 'l2' : 'l3'); }

  function h30Score(answers) {
    var sum = { mind: 0, body: 0, spirit: 0, vocation: 0 };
    for (var i = 0; i < H30_QUESTIONS.length; i++) {
      var a = answers[i];
      if (a === undefined || a === null) continue;
      sum[H30_QUESTIONS[i].d] += a;
    }
    var r = {};
    H30_ORDER.forEach(function (d) { r[d] = h30Level(sum[d]); });
    return r;
  }

  function h30Tension(levels) {
    var high = H30_ORDER[0], low = H30_ORDER[0];
    H30_ORDER.forEach(function (d) {
      if (LEVEL_RANK[levels[d]] > LEVEL_RANK[levels[high]]) high = d;
      if (LEVEL_RANK[levels[d]] < LEVEL_RANK[levels[low]]) low = d;
    });
    if (high === low) {
      var allL2 = H30_ORDER.every(function (d) { return levels[d] === 'l2'; });
      if (allL2) return '你的四个象限都停在 L2 觉醒层——你已全面醒来，却还没在任何一个维度上突破到创造层。缺的不是清醒，是「挑一个方向，死磕到底」。';
      return '你的四个象限都处在「' + LEVEL_NAME[levels[high]] + '」附近——内在比较均衡。真正要防的，是均衡变成平庸。';
    }
    return '你最亮的是【' + H30_QUADRANTS[high].label + '】(' + LEVEL_NAME[levels[high]] + ')，最拖后腿的是【' + H30_QUADRANTS[low].label + '】(' + LEVEL_NAME[levels[low]] + ')。你的愿景，正在被最薄弱的这一环悄悄拖住。';
  }

  function h30Actions(levels) {
    var order = H30_ORDER.slice().sort(function (a, b) { return LEVEL_RANK[levels[a]] - LEVEL_RANK[levels[b]]; });
    var list = [];
    order.forEach(function (d) {
      if (levels[d] === 'l3') return;
      list.push({ d: d, level: levels[d], text: H30_QUADRANTS[d].actions[levels[d]] });
    });
    return list.slice(0, 3);
  }

  /* ============================================================
     测试注册表
     ============================================================ */
  var TESTS = {
    human30: {
      id: 'human30',
      title: 'Human 3.0 四象限人生测试',
      badge: '人生规划',
      sub: '四个象限 × 三层级，照见你此刻的位置',
      meta: '16 题 · 约 2 分钟',
      status: 'online',          // online 可测 / soon 敬请期待
      reportTitle: 'Human 3.0 人生坐标',
      intro: [
        { type: 'items', h: '它从四个象限，照见你的状态', items: [
          ['心智 Mind', '认知 · 情绪 · 思维 · 自我意识'],
          ['身体 Body', '健康 · 睡眠 · 运动 · 精力'],
          ['精神 Spirit', '价值观 · 意义感 · 关系 · 方向'],
          ['事业 Vocation', '工作 · 收入 · 技能 · 自由度']
        ]},
        { type: 'levels', h: '每个象限，你会落在三个层级之一', rows: [
          ['l1', '生存层', '被情绪和环境推着走'],
          ['l2', '觉醒层', '开始观察自己，有策略地生活'],
          ['l3', '创造层', '按自己的愿景主动创造']
        ]}
      ],
      introNote: '16 道题，约 2 分钟。答完生成你的四象限坐标报告——不评判、不贴标签，只帮你看见自己此刻的位置。',
      questions: H30_QUESTIONS,
      quadrants: H30_QUADRANTS,
      quadOrder: H30_ORDER,
      score: h30Score,
      coreTension: h30Tension,
      prescriptions: h30Actions
    }

    /* 后期在这里追加新测试，例如：
    , attachment: {
        id: 'attachment', title: '亲密关系模式测试', badge: '关系',
        sub: '...', meta: '12 题 · 约 2 分钟', status: 'online',
        reportTitle: '...', intro: [...], introNote: '...',
        questions: [...], quadrants: {...}, quadOrder: [...],
        score: fn, coreTension: fn, prescriptions: fn
      }
    */
  };

  function listTests() { return Object.keys(TESTS).map(function (k) { return TESTS[k]; }); }
  function getTest(id) { return TESTS[id] || null; }

  global.Quiz = {
    LEVEL_NAME: LEVEL_NAME, LEVEL_RANK: LEVEL_RANK,
    listTests: listTests, getTest: getTest
  };
})(window);
