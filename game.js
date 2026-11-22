/* ==========================================================================
   比薩拼圖大冒險 (Pizza, Pizza!) - 幼兒園互動桌遊核心邏輯
   ========================================================================== */

(() => {
  'use strict';

  // ==================== 遊戲常數與資料 ====================
  const COLORS = [
    { id: 'red',    name: '紅色', hex: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
    { id: 'yellow', name: '黃色', hex: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
    { id: 'green',  name: '綠色', hex: '#22c55e', light: '#dcfce7', dark: '#15803d' },
    { id: 'blue',   name: '藍色', hex: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },
  ];

  const SHAPES = [
    { id: 'circle',   name: '圓形',   symbol: '●', wheelBg: '#fde68a' },
    { id: 'triangle', name: '三角形', symbol: '▲', wheelBg: '#fbcfe8' },
    { id: 'square',   name: '正方形', symbol: '■', wheelBg: '#bae6fd' },
    { id: 'star',     name: '星形',   symbol: '★', wheelBg: '#bbf7d0' },
  ];

  const AVATARS = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🐧', '🦄'];
  const DEFAULT_NAMES = ['小熊大廚', '兔兔大廚', '貓咪大廚', '狗狗大廚'];

  const YUMMY_TOPPINGS = [
    { id: 'tomato',       name: '起司番茄披薩',   desc: '紅通通的番茄配上香濃起司，好好吃！' },
    { id: 'pepperoni',    name: '義式臘腸披薩',   desc: '圓圓的香脆臘腸，烤得香噴噴！' },
    { id: 'hawaiian',     name: '夏威夷鳳梨披薩', desc: '酸酸甜甜的黃色鳳梨和火腿，超美味！' },
    { id: 'cornMushroom', name: '玉米蘑菇披薩',   desc: '金黃玉米粒和可愛小蘑菇，一口接一口！' },
    { id: 'broccoli',     name: '翠綠花椰菜披薩', desc: '滿滿的健康綠色花椰菜，營養滿分！' },
    { id: 'shrimp',       name: '鮮甜鮮蝦披薩',   desc: 'Q彈的粉紅小蝦仁，海味大爆發！' },
    { id: 'veggie',       name: '彩虹彩椒披薩',   desc: '繽紛彩椒和橄欖，像彩虹一樣漂亮！' },
    { id: 'cheese',       name: '雙倍牽絲起司',   desc: '拉得好長好長的濃郁起司，太讚了！' },
  ];

  const YUCKY_TOPPINGS = [
    { id: 'caterpillar', name: '扭扭毛毛蟲',   desc: '哎呀！披薩上爬著一條笑咪咪的毛毛蟲，不能吃啦！快丟進垃圾桶！' },
    { id: 'sock',        name: '臭呼呼襪子',   desc: '咦～是誰把臭襪子烤進披薩裡了？！哈哈，快丟進垃圾桶！' },
    { id: 'spider',      name: '害羞小蜘蛛',   desc: '哇啊！一隻大眼睛小蜘蛛在上面織網，快把它請進垃圾桶！' },
    { id: 'beetle',      name: '亮晶晶大甲蟲', desc: '噗哧！大甲蟲偷跑來吃披薩了，快丟進垃圾桶吧！' },
    { id: 'fishbone',    name: '吃剩魚骨頭',   desc: '喵～這片只剩魚骨頭啦！哈哈大笑，快丟進垃圾桶！' },
    { id: 'slug',        name: '黏呼呼小蛞蝓', desc: '黏答答的小蛞蝓爬過披薩了，好噁心喔！快丟進垃圾桶！' },
  ];

  const SLICES_TO_WIN = 6;

  // ==================== 狀態管理 ====================
  const state = {
    mode: 'either', // 'either' (基礎) | 'both' (挑戰)
    playerCount: 2,
    withBot: false,
    soundOn: true,
    voiceOn: true,
    playerConfigs: [
      { name: DEFAULT_NAMES[0], avatarIdx: 0 },
      { name: DEFAULT_NAMES[1], avatarIdx: 1 },
      { name: DEFAULT_NAMES[2], avatarIdx: 2 },
      { name: DEFAULT_NAMES[3], avatarIdx: 3 },
    ],

    // 遊戲進行中狀態
    players: [],
    currentPlayerIdx: 0,
    phase: 'spin', // 'spin' | 'spinning' | 'pick' | 'reveal' | 'victory'
    targetColor: null,
    targetShape: null,
    colorWheelAngle: 0,
    shapeWheelAngle: 0,
    tableSlices: [], // 16 個格子，每格放一個披薩片物件
    yuckyBag: [],
    yummyBag: [],
    trashCount: 0,
    turnsPlayed: 0,
    pendingReveal: null, // { sliceIdx, slice }
    botTimers: [],
  };

  // ==================== DOM 參照 ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const elScreenSetup = $('#screen-setup');
  const elScreenGame = $('#screen-game');
  const elHeroPizzaArt = $('#hero-pizza-art');
  const elPlayersConfigList = $('#players-config-list');
  const elChkWithBot = $('#chk-with-bot');
  const elBotToggleWrap = $('#bot-toggle-wrap');

  const elTurnAvatar = $('#turn-avatar');
  const elTurnTitle = $('#turn-title');
  const elTurnInstruction = $('#turn-instruction');
  const elBtnHint = $('#btn-hint');
  const elBtnSpin = $('#btn-spin');
  const elWheelColor = $('#wheel-color');
  const elWheelShape = $('#wheel-shape');
  const elSpinResultBox = $('#spin-result-box');

  const elTrashStation = $('#trash-station');
  const elTrashBinBtn = $('#trash-bin-btn');
  const elTrashCount = $('#trash-count');
  const elTrashHint = $('#trash-hint');

  const elSlicesGrid = $('#slices-grid');
  const elDeckStatus = $('#deck-status');
  const elPlayerBoards = $('#player-boards');

  const elModalReveal = $('#modal-reveal');
  const elRevealCard = $('#reveal-card');
  const elRevealBadge = $('#reveal-badge');
  const elRevealArt = $('#reveal-art');
  const elRevealTitle = $('#reveal-title');
  const elRevealDesc = $('#reveal-desc');
  const elRevealActions = $('#reveal-actions');

  const elModalVictory = $('#modal-victory');
  const elVictoryTitle = $('#victory-title');
  const elVictorySubtitle = $('#victory-subtitle');
  const elVictoryShowcase = $('#victory-pizza-showcase');
  const elVictoryStats = $('#victory-stats');

  const elModalHelp = $('#modal-help');
  const elToast = $('#toast');

  // ==================== 音效與語音引擎 ====================
  let audioCtx = null;

  function ensureAudio() {
    if (!state.soundOn) return null;
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.16, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playTickSound() {
    playTone(620 + Math.random() * 140, 0.045, 'triangle', 0.11);
  }

  function playYummySound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      playTone(f, 0.22, 'triangle', 0.16, idx * 0.08);
    });
  }

  function playYuckySound() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.18);
    osc.frequency.linearRampToValueAtTime(260, now + 0.28);
    osc.frequency.linearRampToValueAtTime(115, now + 0.62);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.68);
  }

  function playTrashSound() {
    playTone(300, 0.09, 'sine', 0.18, 0);
    playTone(170, 0.14, 'triangle', 0.2, 0.08);
    playTone(460, 0.12, 'sine', 0.13, 0.18);
  }

  function playWrongSound() {
    playTone(230, 0.12, 'sine', 0.13, 0);
    playTone(190, 0.14, 'sine', 0.12, 0.1);
  }

  function playVictorySound() {
    const notes = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5];
    const times = [0, 0.12, 0.24, 0.36, 0.48, 0.62];
    notes.forEach((f, i) => playTone(f, i === notes.length - 1 ? 0.55 : 0.18, 'triangle', 0.18, times[i]));
  }

  function speak(text) {
    if (!state.voiceOn || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-TW';
      utter.rate = 1.02;
      utter.pitch = 1.15;
      window.speechSynthesis.speak(utter);
    } catch {
      // 忽略部分瀏覽器語音限制
    }
  }

  let toastTimer = null;
  function showToast(msg, duration = 2200) {
    elToast.textContent = msg;
    elToast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elToast.classList.add('hidden');
    }, duration);
  }

  // ==================== SVG 繪圖工具 ====================
  function shapeSVGPath(shapeId, cx, cy, r) {
    switch (shapeId) {
      case 'circle':
        return `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
      case 'square': {
        const s = r * 1.72;
        return `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="${r * 0.22}" />`;
      }
      case 'triangle': {
        const p1 = `${cx},${cy - r * 1.12}`;
        const p2 = `${cx + r * 1.08},${cy + r * 0.88}`;
        const p3 = `${cx - r * 1.08},${cy + r * 0.88}`;
        return `<polygon points="${p1} ${p2} ${p3}" stroke-linejoin="round" />`;
      }
      case 'star': {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const rad = i % 2 === 0 ? r * 1.18 : r * 0.52;
          const a = (i * 36 - 90) * (Math.PI / 180);
          pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(' ')}" stroke-linejoin="round" />`;
      }
      default:
        return '';
    }
  }

  function renderShapeBadgeSVG(shapeId, fill = '#3c2618', size = 20) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="vertical-align:middle">
      <g fill="${fill}" stroke="#ffffff" stroke-width="2">${shapeSVGPath(shapeId, 20, 20, 14)}</g>
    </svg>`;
  }

  // 繪製雙轉盤 SVG（4 等份，每份 90°，第 0 份置中於 12 點鐘）
  function buildWheels() {
    const createWedgePath = (startDeg, endDeg, radius = 96) => {
      const rad1 = (startDeg * Math.PI) / 180;
      const rad2 = (endDeg * Math.PI) / 180;
      const x1 = 100 + radius * Math.cos(rad1);
      const y1 = 100 + radius * Math.sin(rad1);
      const x2 = 100 + radius * Math.cos(rad2);
      const y2 = 100 + radius * Math.sin(rad2);
      return `M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    };

    // 顏色轉盤
    let colorHtml = '';
    COLORS.forEach((c, i) => {
      const centerDeg = i * 90 - 90;
      const path = createWedgePath(centerDeg - 45, centerDeg + 45);
      const labelRad = (centerDeg * Math.PI) / 180;
      const lx = 100 + 58 * Math.cos(labelRad);
      const ly = 100 + 58 * Math.sin(labelRad);
      colorHtml += `
        <path d="${path}" fill="${c.hex}" stroke="#ffffff" stroke-width="4" />
        <g transform="rotate(${i * 90} ${lx.toFixed(1)} ${ly.toFixed(1)})">
          <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="16" fill="rgba(255,255,255,0.28)" />
          <text x="${lx.toFixed(1)}" y="${(ly + 6).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="16" font-weight="900">${c.name[0]}</text>
        </g>
      `;
    });
    colorHtml += `<circle cx="100" cy="100" r="22" fill="#fffdf8" stroke="#e8a756" stroke-width="5" />
                  <text x="100" y="106" text-anchor="middle" font-size="18">🎨</text>`;
    elWheelColor.innerHTML = colorHtml;

    // 形狀轉盤
    let shapeHtml = '';
    SHAPES.forEach((s, i) => {
      const centerDeg = i * 90 - 90;
      const path = createWedgePath(centerDeg - 45, centerDeg + 45);
      const rad = (centerDeg * Math.PI) / 180;
      const sx = 100 + 58 * Math.cos(rad);
      const sy = 100 + 58 * Math.sin(rad);
      shapeHtml += `
        <path d="${path}" fill="${s.wheelBg}" stroke="#ffffff" stroke-width="4" />
        <g transform="rotate(${i * 90} ${sx.toFixed(1)} ${sy.toFixed(1)})" fill="#3c2618" stroke="#ffffff" stroke-width="2.5">${shapeSVGPath(s.id, sx, sy, 16)}</g>
      `;
    });
    shapeHtml += `<circle cx="100" cy="100" r="22" fill="#fffdf8" stroke="#e8a756" stroke-width="5" />
                  <text x="100" y="106" text-anchor="middle" font-size="18">🔷</text>`;
    elWheelShape.innerHTML = shapeHtml;
  }

  // 繪製桌面「待翻開」披薩片（正面顯示顏色與形狀，像披薩盒切片背面）
  function renderMysterySliceSVG(colorObj, shapeObj) {
    return `
      <svg viewBox="0 0 120 124" aria-hidden="true">
        <!-- 披薩餅皮外緣 -->
        <path d="M 14 26 Q 60 4 106 26 L 60 116 Z" fill="#e8a756" stroke="#b56f22" stroke-width="4" stroke-linejoin="round" />
        <!-- 彩色披薩內層 -->
        <path d="M 22 33 Q 60 17 98 33 L 60 108 Z" fill="${colorObj.hex}" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
        <!-- 可愛圓點光澤 -->
        <circle cx="42" cy="40" r="3.5" fill="rgba(255,255,255,0.45)" />
        <circle cx="78" cy="40" r="3.5" fill="rgba(255,255,255,0.45)" />
        <!-- 中央大形狀標記 -->
        <g fill="#ffffff" stroke="${colorObj.dark}" stroke-width="3">
          ${shapeSVGPath(shapeObj.id, 60, 62, 16)}
        </g>
      </svg>
    `;
  }

  // 繪製配料細節（可供特寫卡片與披薩盤共用）
  function toppingDetailSVG(toppingId, isYucky) {
    if (!isYucky) {
      switch (toppingId) {
        case 'tomato':
          return `
            <circle cx="52" cy="52" r="11" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
            <circle cx="52" cy="52" r="5" fill="#fca5a5"/>
            <circle cx="72" cy="64" r="10" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
            <circle cx="72" cy="64" r="4.5" fill="#fca5a5"/>
            <ellipse cx="58" cy="82" rx="8" ry="4.5" transform="rotate(-25 58 82)" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
            <ellipse cx="44" cy="68" rx="6" ry="3.5" transform="rotate(20 44 68)" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
          `;
        case 'pepperoni':
          return `
            <circle cx="47" cy="48" r="10" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
            <circle cx="45" cy="46" r="2" fill="#fca5a5"/><circle cx="50" cy="51" r="1.8" fill="#fca5a5"/>
            <circle cx="74" cy="50" r="10" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
            <circle cx="72" cy="48" r="2" fill="#fca5a5"/><circle cx="77" cy="53" r="1.8" fill="#fca5a5"/>
            <circle cx="60" cy="76" r="10.5" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
            <circle cx="58" cy="74" r="2" fill="#fca5a5"/><circle cx="63" cy="79" r="1.8" fill="#fca5a5"/>
          `;
        case 'hawaiian':
          return `
            <polygon points="44,44 58,42 52,58" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>
            <polygon points="68,48 82,46 75,62" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>
            <polygon points="54,72 68,70 61,88" fill="#facc15" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>
            <rect x="55" y="50" width="13" height="11" rx="3" transform="rotate(14 61 55)" fill="#fb7185" stroke="#e11d48" stroke-width="1.8"/>
            <rect x="44" y="64" width="12" height="10" rx="3" transform="rotate(-12 50 69)" fill="#fb7185" stroke="#e11d48" stroke-width="1.8"/>
          `;
        case 'cornMushroom':
          return `
            <path d="M 42 52 Q 52 38 62 52 Z" fill="#d6c5b3" stroke="#856b52" stroke-width="2"/>
            <rect x="49" y="51" width="6" height="8" rx="2" fill="#e7dacb" stroke="#856b52" stroke-width="1.5"/>
            <path d="M 62 72 Q 71 60 80 72 Z" fill="#d6c5b3" stroke="#856b52" stroke-width="2"/>
            <rect x="68" y="71" width="6" height="7" rx="2" fill="#e7dacb" stroke="#856b52" stroke-width="1.5"/>
            <circle cx="72" cy="46" r="4.5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
            <circle cx="48" cy="70" r="4.5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
            <circle cx="58" cy="84" r="4.5" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
            <circle cx="64" cy="56" r="4" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
          `;
        case 'broccoli':
          return `
            <rect x="47" y="52" width="6" height="10" rx="2" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>
            <circle cx="45" cy="49" r="7" fill="#22c55e" stroke="#15803d" stroke-width="1.8"/>
            <circle cx="54" cy="48" r="7" fill="#16a34a" stroke="#15803d" stroke-width="1.8"/>
            <rect x="67" y="58" width="6" height="9" rx="2" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>
            <circle cx="66" cy="54" r="6.5" fill="#22c55e" stroke="#15803d" stroke-width="1.8"/>
            <circle cx="74" cy="54" r="6.5" fill="#16a34a" stroke="#15803d" stroke-width="1.8"/>
            <circle cx="58" cy="79" r="7" fill="#ef4444" stroke="#b91c1c" stroke-width="1.8"/>
          `;
        case 'shrimp':
          return `
            <path d="M 45 55 C 40 42, 60 39, 60 51 C 60 56, 54 58, 52 54" fill="none" stroke="#fb7185" stroke-width="9" stroke-linecap="round"/>
            <path d="M 45 55 C 40 42, 60 39, 60 51" fill="none" stroke="#fda4af" stroke-width="3" stroke-linecap="round"/>
            <path d="M 56 80 C 52 68, 72 65, 72 77 C 72 82, 66 84, 64 80" fill="none" stroke="#fb7185" stroke-width="8.5" stroke-linecap="round"/>
            <circle cx="74" cy="48" r="4" fill="#22c55e"/>
            <circle cx="48" cy="70" r="3.5" fill="#22c55e"/>
          `;
        case 'veggie':
          return `
            <circle cx="48" cy="50" r="9" fill="none" stroke="#22c55e" stroke-width="5"/>
            <circle cx="73" cy="52" r="9" fill="none" stroke="#f97316" stroke-width="5"/>
            <circle cx="60" cy="75" r="8" fill="none" stroke="#ef4444" stroke-width="5"/>
            <circle cx="59" cy="58" r="4.5" fill="#1f2937"/><circle cx="59" cy="58" r="1.8" fill="#fef08a"/>
            <circle cx="66" cy="87" r="4" fill="#1f2937"/><circle cx="66" cy="87" r="1.5" fill="#fef08a"/>
          `;
        case 'cheese':
        default:
          return `
            <circle cx="48" cy="50" r="10" fill="#fde047" stroke="#eab308" stroke-width="2"/>
            <circle cx="72" cy="54" r="11" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <circle cx="59" cy="78" r="9" fill="#fef08a" stroke="#eab308" stroke-width="2"/>
            <circle cx="58" cy="60" r="5" fill="#fb923c" opacity="0.6"/>
          `;
      }
    } else {
      // 搞笑可愛版噁心配料！
      switch (toppingId) {
        case 'caterpillar':
          return `
            <g>
              <circle cx="44" cy="52" r="9" fill="#84cc16" stroke="#3f6212" stroke-width="2.5"/>
              <circle cx="56" cy="58" r="9" fill="#a3e635" stroke="#3f6212" stroke-width="2.5"/>
              <circle cx="68" cy="52" r="9.5" fill="#84cc16" stroke="#3f6212" stroke-width="2.5"/>
              <circle cx="60" cy="72" r="11" fill="#65a30d" stroke="#3f6212" stroke-width="2.5"/>
              <circle cx="56" cy="70" r="3" fill="#fff"/><circle cx="56" cy="70" r="1.5" fill="#111"/>
              <circle cx="64" cy="70" r="3" fill="#fff"/><circle cx="64" cy="70" r="1.5" fill="#111"/>
              <path d="M 56 76 Q 60 80 64 76" fill="none" stroke="#3f6212" stroke-width="2" stroke-linecap="round"/>
              <line x1="55" y1="62" x2="50" y2="55" stroke="#3f6212" stroke-width="2"/>
              <line x1="65" y1="62" x2="70" y2="55" stroke="#3f6212" stroke-width="2"/>
            </g>
          `;
        case 'sock':
          return `
            <g>
              <path d="M 48 42 L 64 42 L 64 68 C 64 78, 76 74, 78 82 C 80 90, 56 90, 48 78 Z" fill="#a855f7" stroke="#581c87" stroke-width="2.5" stroke-linejoin="round"/>
              <line x1="49" y1="50" x2="63" y2="50" stroke="#fde047" stroke-width="4"/>
              <line x1="49" y1="58" x2="63" y2="58" stroke="#f472b6" stroke-width="4"/>
              <path d="M 70 40 Q 75 34 70 28" fill="none" stroke="#65a30d" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M 78 46 Q 84 40 78 34" fill="none" stroke="#65a30d" stroke-width="2.5" stroke-linecap="round"/>
            </g>
          `;
        case 'spider':
          return `
            <g>
              <g stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round">
                <path d="M 48 56 L 35 48"/><path d="M 47 62 L 34 62"/><path d="M 48 68 L 36 76"/>
                <path d="M 72 56 L 85 48"/><path d="M 73 62 L 86 62"/><path d="M 72 68 L 84 76"/>
              </g>
              <circle cx="60" cy="62" r="15" fill="#374151" stroke="#111827" stroke-width="2.5"/>
              <circle cx="54" cy="59" r="4.5" fill="#fff"/><circle cx="55" cy="59" r="2.2" fill="#111"/>
              <circle cx="66" cy="59" r="4.5" fill="#fff"/><circle cx="65" cy="59" r="2.2" fill="#111"/>
              <path d="M 55 68 Q 60 72 65 68" fill="none" stroke="#f9a8d4" stroke-width="2" stroke-linecap="round"/>
            </g>
          `;
        case 'beetle':
          return `
            <g>
              <ellipse cx="60" cy="64" rx="14" ry="18" fill="#7c3aed" stroke="#3b0764" stroke-width="2.5"/>
              <line x1="60" y1="48" x2="60" y2="82" stroke="#3b0764" stroke-width="2"/>
              <circle cx="53" cy="60" r="3" fill="#c4b5fd"/><circle cx="67" cy="68" r="3" fill="#c4b5fd"/>
              <circle cx="60" cy="46" r="8" fill="#4c1d95"/>
              <circle cx="57" cy="44" r="2.2" fill="#fff"/><circle cx="63" cy="44" r="2.2" fill="#fff"/>
              <path d="M 54 39 Q 48 31 53 29" fill="none" stroke="#3b0764" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M 66 39 Q 72 31 67 29" fill="none" stroke="#3b0764" stroke-width="2.5" stroke-linecap="round"/>
            </g>
          `;
        case 'fishbone':
          return `
            <g stroke="#475569" stroke-width="3" fill="#e2e8f0" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="40,56 54,48 54,64"/>
              <line x1="54" y1="56" x2="78" y2="74"/>
              <line x1="58" y1="50" x2="54" y2="66"/>
              <line x1="65" y1="55" x2="61" y2="71"/>
              <line x1="72" y1="60" x2="68" y2="76"/>
              <polygon points="78,74 86,68 82,82"/>
              <circle cx="48" cy="54" r="2" fill="#1e293b"/>
            </g>
          `;
        case 'slug':
        default:
          return `
            <g>
              <path d="M 42 74 C 42 54, 58 46, 68 58 C 76 68, 78 78, 66 80 C 54 82, 42 82, 42 74 Z" fill="#84cc16" stroke="#3f6212" stroke-width="2.5"/>
              <line x1="50" y1="54" x2="46" y2="42" stroke="#3f6212" stroke-width="2.5"/>
              <line x1="58" y1="52" x2="60" y2="40" stroke="#3f6212" stroke-width="2.5"/>
              <circle cx="46" cy="42" r="4" fill="#fff" stroke="#3f6212" stroke-width="1.8"/><circle cx="46" cy="42" r="1.8" fill="#111"/>
              <circle cx="60" cy="40" r="4" fill="#fff" stroke="#3f6212" stroke-width="1.8"/><circle cx="60" cy="40" r="1.8" fill="#111"/>
              <path d="M 52 68 Q 58 72 64 68" fill="none" stroke="#3f6212" stroke-width="2"/>
            </g>
          `;
      }
    }
  }

  // 繪製「翻開後」的特寫披薩片 SVG
  function renderRevealedSliceSVG(slice) {
    const baseFill = slice.isYucky ? '#d9f99d' : '#fde047';
    const sauceFill = slice.isYucky ? '#a3e635' : '#ef4444';
    return `
      <svg viewBox="0 0 120 124" aria-hidden="true">
        <path d="M 10 26 Q 60 2 110 26 L 60 118 Z" fill="#e8a756" stroke="#b56f22" stroke-width="4" stroke-linejoin="round" />
        <path d="M 19 33 Q 60 16 101 33 L 60 109 Z" fill="${sauceFill}" />
        <path d="M 23 36 Q 60 21 97 36 L 60 104 Z" fill="${baseFill}" />
        ${toppingDetailSVG(slice.topping.id, slice.isYucky)}
      </svg>
    `;
  }

  // 繪製玩家面前的 6 等份圓形木頭披薩盤
  function renderPlayerPlateSVG(collectedSlices, popLastIndex = -1) {
    let wedges = '';
    const cx = 100;
    const cy = 100;
    const rOuter = 82;
    const rCheese = 70;

    for (let i = 0; i < SLICES_TO_WIN; i++) {
      const startDeg = i * 60 - 90;
      const endDeg = startDeg + 60;
      const rad1 = (startDeg * Math.PI) / 180;
      const rad2 = (endDeg * Math.PI) / 180;
      const x1 = cx + rOuter * Math.cos(rad1);
      const y1 = cy + rOuter * Math.sin(rad1);
      const x2 = cx + rOuter * Math.cos(rad2);
      const y2 = cy + rOuter * Math.sin(rad2);

      const slice = collectedSlices[i];
      if (!slice) {
        wedges += `
          <path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z"
            fill="#f7e3c3" stroke="#d9b382" stroke-width="2.5" stroke-dasharray="5 4" />
        `;
      } else {
        const cx1 = cx + rCheese * Math.cos(rad1);
        const cy1 = cy + rCheese * Math.sin(rad1);
        const cx2 = cx + rCheese * Math.cos(rad2);
        const cy2 = cy + rCheese * Math.sin(rad2);
        const midRad = ((startDeg + 30) * Math.PI) / 180;
        const tx = cx + 44 * Math.cos(midRad);
        const ty = cy + 44 * Math.sin(midRad);
        const t2x = cx + 26 * Math.cos(midRad);
        const t2y = cy + 26 * Math.sin(midRad);

        const dotColors = {
          tomato: ['#ef4444', '#22c55e'],
          pepperoni: ['#dc2626', '#991b1b'],
          hawaiian: ['#facc15', '#fb7185'],
          cornMushroom: ['#d6c5b3', '#facc15'],
          broccoli: ['#22c55e', '#ef4444'],
          shrimp: ['#fb7185', '#22c55e'],
          veggie: ['#f97316', '#22c55e'],
          cheese: ['#fef08a', '#f59e0b'],
        }[slice.topping.id] || ['#ef4444', '#22c55e'];

        const cls = i === popLastIndex ? 'slice-pop' : '';
        wedges += `
          <g class="${cls}">
            <path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rOuter} ${rOuter} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z"
              fill="#e8a756" stroke="#b56f22" stroke-width="2.5" />
            <path d="M ${cx} ${cy} L ${cx1.toFixed(1)} ${cy1.toFixed(1)} A ${rCheese} ${rCheese} 0 0 1 ${cx2.toFixed(1)} ${cy2.toFixed(1)} Z"
              fill="#fde047" stroke="#ef4444" stroke-width="2" />
            <circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="9" fill="${dotColors[0]}" stroke="#fff" stroke-width="1.5" />
            <circle cx="${t2x.toFixed(1)}" cy="${t2y.toFixed(1)}" r="5.5" fill="${dotColors[1]}" />
          </g>
        `;
      }
    }

    return `
      <svg class="pizza-plate-svg" viewBox="0 0 200 200" aria-label="披薩盤">
        <circle cx="100" cy="100" r="95" fill="#d99b52" stroke="#a66a2c" stroke-width="4" />
        <circle cx="100" cy="100" r="87" fill="#ecd0a5" />
        ${wedges}
        <circle cx="100" cy="100" r="7" fill="#fffdf8" stroke="#c67f2b" stroke-width="2" />
      </svg>
    `;
  }

  // ==================== 牌堆與洗牌 ====================
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextTopping(isYucky) {
    if (isYucky) {
      if (state.yuckyBag.length === 0) state.yuckyBag = shuffle(YUCKY_TOPPINGS);
      return state.yuckyBag.pop();
    } else {
      if (state.yummyBag.length === 0) state.yummyBag = shuffle(YUMMY_TOPPINGS);
      return state.yummyBag.pop();
    }
  }

  function buildInitialTableSlices() {
    // 4 顏色 × 4 形狀 = 16 片，固定其中 4 片（25%）藏有噁心配料
    const yuckyFlags = shuffle([
      true, true, true, true,
      false, false, false, false,
      false, false, false, false,
      false, false, false, false,
    ]);

    const combos = [];
    COLORS.forEach((c) => {
      SHAPES.forEach((s) => {
        combos.push({ color: c, shape: s });
      });
    });

    const shuffledCombos = shuffle(combos);
    return shuffledCombos.map((combo, idx) => {
      const isYucky = yuckyFlags[idx];
      return {
        uid: `slice-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        color: combo.color,
        shape: combo.shape,
        isYucky,
        topping: nextTopping(isYucky),
      };
    });
  }

  function replenishSliceAt(index) {
    const old = state.tableSlices[index];
    // 維持桌上噁心配料大約 3~5 片（約 25%）
    const currentYuckyCount = state.tableSlices.filter((s, i) => i !== index && s.isYucky).length;
    let isYucky;
    if (currentYuckyCount <= 2) isYucky = Math.random() < 0.45;
    else if (currentYuckyCount >= 5) isYucky = false;
    else isYucky = Math.random() < 0.25;

    state.tableSlices[index] = {
      uid: `slice-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      color: old.color,
      shape: old.shape,
      isYucky,
      topping: nextTopping(isYucky),
    };
  }

  // ==================== 設定畫面邏輯 ====================
  function renderPlayerConfigs() {
    elPlayersConfigList.innerHTML = '';
    const count = state.playerCount;

    if (count === 1) {
      state.withBot = false;
      elChkWithBot.checked = false;
      elBotToggleWrap.classList.add('disabled');
    } else {
      elBotToggleWrap.classList.remove('disabled');
      elChkWithBot.checked = state.withBot;
    }

    for (let i = 0; i < count; i++) {
      const isBot = state.withBot && i === count - 1;
      const cfg = state.playerConfigs[i];
      const item = document.createElement('div');
      item.className = 'player-config-item';
      item.innerHTML = `
        <div class="player-config-top">
          <button type="button" class="avatar-pick-btn" data-pidx="${i}" title="點一下換可愛頭像" ${isBot ? 'disabled' : ''}>
            ${isBot ? '🤖' : AVATARS[cfg.avatarIdx]}
          </button>
          <input type="text" class="player-name-input" data-pidx="${i}" maxlength="10"
            value="${isBot ? '小熊電腦' : cfg.name}" ${isBot ? 'disabled' : ''} aria-label="第 ${i + 1} 位小廚師名字" />
        </div>
        <div class="player-config-tip">${isBot ? '電腦自動陪玩角色' : '點頭像可以換動物喔！'}</div>
      `;
      elPlayersConfigList.appendChild(item);
    }

    $$('.avatar-pick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.pidx);
        state.playerConfigs[idx].avatarIdx = (state.playerConfigs[idx].avatarIdx + 1) % AVATARS.length;
        playTone(540, 0.08, 'triangle', 0.12);
        renderPlayerConfigs();
      });
    });

    $$('.player-name-input').forEach((input) => {
      input.addEventListener('input', () => {
        const idx = Number(input.dataset.pidx);
        state.playerConfigs[idx].name = input.value.trim() || DEFAULT_NAMES[idx];
      });
    });
  }

  function showScreen(name) {
    clearBotTimers();
    elScreenSetup.classList.toggle('active', name === 'setup');
    elScreenGame.classList.toggle('active', name === 'game');
    if (name === 'setup') {
      stopConfetti();
    }
  }

  // ==================== 遊戲流程控制 ====================
  function clearBotTimers() {
    state.botTimers.forEach((t) => clearTimeout(t));
    state.botTimers = [];
  }

  function scheduleBot(fn, ms) {
    const id = setTimeout(fn, ms);
    state.botTimers.push(id);
  }

  function startNewGame() {
    clearBotTimers();
    stopConfetti();
    elModalReveal.classList.add('hidden');
    elModalVictory.classList.add('hidden');

    state.players = [];
    for (let i = 0; i < state.playerCount; i++) {
      const isBot = state.withBot && i === state.playerCount - 1;
      const cfg = state.playerConfigs[i];
      state.players.push({
        id: i,
        name: isBot ? '小熊電腦' : (cfg.name || DEFAULT_NAMES[i]),
        avatar: isBot ? '🤖' : AVATARS[cfg.avatarIdx],
        isBot,
        slices: [],
        yuckyCount: 0,
      });
    }

    state.currentPlayerIdx = 0;
    state.phase = 'spin';
    state.targetColor = null;
    state.targetShape = null;
    state.trashCount = 0;
    state.turnsPlayed = 0;
    state.pendingReveal = null;
    state.yummyBag = [];
    state.yuckyBag = [];
    state.tableSlices = buildInitialTableSlices();

    elTrashCount.textContent = '已丟 0 片';
    elTrashHint.textContent = '翻到毛毛蟲或臭襪子時，點我丟進來！';
    elTrashStation.classList.remove('highlight-trash');

    showScreen('game');
    renderGameUI();
    announceTurn();
  }

  function currentPlayer() {
    return state.players[state.currentPlayerIdx];
  }

  function isSliceMatching(slice) {
    if (!state.targetColor || !state.targetShape) return false;
    const matchColor = slice.color.id === state.targetColor.id;
    const matchShape = slice.shape.id === state.targetShape.id;
    return state.mode === 'both' ? (matchColor && matchShape) : (matchColor || matchShape);
  }

  function announceTurn() {
    const p = currentPlayer();
    elTurnAvatar.textContent = p.avatar;
    elTurnTitle.textContent = `輪到 ${p.name}！`;
    elTurnInstruction.textContent = p.isBot
      ? '小熊電腦正在準備轉動轉盤…'
      : '按一下「轉動轉盤」開始這一回合吧！';

    elSpinResultBox.innerHTML = `<span class="spin-placeholder">轉動雙轉盤，看看要找什麼配料！</span>`;
    elBtnSpin.disabled = p.isBot;
    elBtnSpin.classList.toggle('pulse-ready', !p.isBot);
    elBtnHint.disabled = true;

    renderSlicesGrid();
    renderPlayerBoards();

    if (p.isBot) {
      scheduleBot(() => spinWheels(), 900);
    } else {
      speak(`輪到${p.name}，請按轉動轉盤！`);
    }
  }

  function spinWheels() {
    if (state.phase !== 'spin') return;
    state.phase = 'spinning';
    state.turnsPlayed += 1;
    elBtnSpin.disabled = true;
    elBtnSpin.classList.remove('pulse-ready');
    elBtnHint.disabled = true;

    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const shapeIdx = Math.floor(Math.random() * SHAPES.length);
    state.targetColor = COLORS[colorIdx];
    state.targetShape = SHAPES[shapeIdx];

    // 精準計算目標角度（對應 12 點鐘指標）
    const calcNextAngle = (currentAngle, targetIdx) => {
      const jitter = (Math.random() * 44) - 22; // -22° ~ +22° 避開邊界
      const desiredMod = (360 - targetIdx * 90 + jitter + 360) % 360;
      const curMod = ((currentAngle % 360) + 360) % 360;
      const delta = (desiredMod - curMod + 360) % 360;
      const extraSpins = (4 + Math.floor(Math.random() * 2)) * 360;
      return currentAngle + extraSpins + delta;
    };

    state.colorWheelAngle = calcNextAngle(state.colorWheelAngle, colorIdx);
    state.shapeWheelAngle = calcNextAngle(state.shapeWheelAngle, shapeIdx);

    elWheelColor.style.transform = `rotate(${state.colorWheelAngle.toFixed(1)}deg)`;
    elWheelShape.style.transform = `rotate(${state.shapeWheelAngle.toFixed(1)}deg)`;

    elTurnInstruction.textContent = '轉盤轉轉轉…會轉到什麼呢？';
    elSpinResultBox.innerHTML = `<span class="spin-placeholder">轉動中…✨</span>`;

    // 轉盤減速滴答聲
    const tickDelays = [80, 170, 270, 390, 530, 690, 880, 1100, 1360, 1660];
    tickDelays.forEach((d) => setTimeout(() => playTickSound(), d));

    setTimeout(() => {
      if (state.phase !== 'spinning') return;
      state.phase = 'pick';
      onSpinFinished();
    }, 2150);
  }

  function onSpinFinished() {
    const c = state.targetColor;
    const s = state.targetShape;
    const p = currentPlayer();
    const joinWord = state.mode === 'both' ? '而且是' : '或';

    elSpinResultBox.innerHTML = `
      <span class="target-chip">
        <span class="color-dot" style="background:${c.hex}"></span>${c.name}
      </span>
      <span style="font-size:0.9rem;color:var(--ink-soft)">${joinWord}</span>
      <span class="target-chip">
        ${renderShapeBadgeSVG(s.id, '#3c2618', 18)}${s.name}
      </span>
    `;

    const promptText = state.mode === 'both'
      ? `找一片「${c.name}」而且是「${s.name}」的披薩翻開！`
      : `找一片「${c.name}」或「${s.name}」的披薩翻開！`;

    elTurnInstruction.textContent = p.isBot ? `小熊電腦正在找${c.name}${joinWord}${s.name}的披薩…` : promptText;
    elBtnHint.disabled = p.isBot;

    renderSlicesGrid();
    playTone(660, 0.14, 'triangle', 0.15);

    if (p.isBot) {
      const matchingIndices = state.tableSlices
        .map((sl, idx) => (isSliceMatching(sl) ? idx : -1))
        .filter((idx) => idx !== -1);
      const chosen = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
      scheduleBot(() => handleSliceClick(chosen, true), 1150);
    } else {
      speak(`轉到${c.name}${joinWord}${s.name}！請選一片披薩翻開看看！`);
    }
  }

  function renderGameUI(popSliceIdx = -1) {
    renderSlicesGrid();
    renderPlayerBoards(popSliceIdx);
  }

  function renderSlicesGrid() {
    elSlicesGrid.innerHTML = '';
    elDeckStatus.textContent = `桌上共有 ${state.tableSlices.length} 片`;
    const canPick = state.phase === 'pick' && !currentPlayer().isBot;

    state.tableSlices.forEach((slice, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slice-card';
      btn.dataset.idx = idx;
      if (state.phase === 'spin' || state.phase === 'spinning') {
        btn.classList.add('dimmed');
      }
      btn.disabled = !canPick;
      btn.setAttribute('aria-label', `${slice.color.name}${slice.shape.name}披薩片`);
      btn.innerHTML = `
        ${renderMysterySliceSVG(slice.color, slice.shape)}
        <span class="slice-tag">${slice.color.name}・${slice.shape.name}</span>
      `;
      btn.addEventListener('click', () => handleSliceClick(idx, false));
      elSlicesGrid.appendChild(btn);
    });
  }

  function renderPlayerBoards(popSliceIdx = -1) {
    elPlayerBoards.innerHTML = '';
    state.players.forEach((p, idx) => {
      const card = document.createElement('div');
      const isCurrent = idx === state.currentPlayerIdx;
      card.className = `player-board-card ${isCurrent ? 'active-player' : ''}`;
      const animIdx = isCurrent ? popSliceIdx : -1;
      card.innerHTML = `
        <div class="board-top">
          <div class="board-identity">
            <span class="board-avatar">${p.avatar}</span>
            <span>${p.name}</span>
          </div>
          <span class="board-progress">${p.slices.length} / ${SLICES_TO_WIN} 片</span>
        </div>
        ${renderPlayerPlateSVG(p.slices, animIdx)}
      `;
      elPlayerBoards.appendChild(card);
    });
  }

  function handleSliceClick(idx, byBot) {
    if (state.phase !== 'pick') return;
    const p = currentPlayer();
    if (p.isBot && !byBot) return;

    const slice = state.tableSlices[idx];
    if (!slice) return;

    if (!isSliceMatching(slice)) {
      playWrongSound();
      const cardEl = elSlicesGrid.querySelector(`[data-idx="${idx}"]`);
      if (cardEl) {
        cardEl.classList.remove('wrong-shake');
        void cardEl.offsetWidth;
        cardEl.classList.add('wrong-shake');
      }
      const c = state.targetColor;
      const s = state.targetShape;
      const tip = state.mode === 'both'
        ? `這片是${slice.color.name}${slice.shape.name}喔！我們要找「${c.name}」而且是「${s.name}」的！`
        : `這片是${slice.color.name}${slice.shape.name}喔！再找找看「${c.name}」或「${s.name}」的吧！`;
      showToast(tip, 2400);
      speak(`這片是${slice.color.name}${slice.shape.name}喔，再找找看！`);
      return;
    }

    // 配對成功！翻開卡片看驚喜
    state.phase = 'reveal';
    state.pendingReveal = { sliceIdx: idx, slice };
    elBtnHint.disabled = true;
    showRevealModal(slice, p);
  }

  function showRevealModal(slice, player) {
    elRevealCard.classList.remove('is-yummy', 'is-yucky');
    elRevealCard.classList.add(slice.isYucky ? 'is-yucky' : 'is-yummy');

    elRevealArt.innerHTML = renderRevealedSliceSVG(slice);
    elRevealTitle.textContent = slice.topping.name;
    elRevealDesc.textContent = slice.topping.desc;
    elRevealActions.innerHTML = '';

    if (slice.isYucky) {
      elRevealBadge.textContent = '😝 哎呀！噁心配料！';
      playYuckySound();
      speak(`哎呀哈哈！是${slice.topping.name}！快丟進垃圾桶！`);

      elTrashStation.classList.add('highlight-trash');
      elTrashHint.textContent = '快把這片噁心披薩丟進來！';

      const btnTrash = document.createElement('button');
      btnTrash.className = 'btn-primary btn-yucky btn-large';
      btnTrash.textContent = '🗑️ 丟進垃圾桶！';
      btnTrash.addEventListener('click', () => confirmTrashYucky());
      elRevealActions.appendChild(btnTrash);

      if (player.isBot) {
        btnTrash.disabled = true;
        btnTrash.textContent = '🤖 小熊電腦哈哈大笑，準備丟垃圾桶…';
        scheduleBot(() => confirmTrashYucky(), 1650);
      }
    } else {
      elRevealBadge.textContent = '😋 太棒了！美味配料！';
      playYummySound();
      speak(`太棒了！是${slice.topping.name}！放進披薩盤吧！`);

      const btnKeep = document.createElement('button');
      btnKeep.className = 'btn-primary btn-green btn-large';
      btnKeep.textContent = '🍕 放進我的披薩盤！';
      btnKeep.addEventListener('click', () => confirmKeepYummy());
      elRevealActions.appendChild(btnKeep);

      if (player.isBot) {
        btnKeep.disabled = true;
        btnKeep.textContent = '🤖 小熊電腦開心收下披薩…';
        scheduleBot(() => confirmKeepYummy(), 1550);
      }
    }

    elModalReveal.classList.remove('hidden');
  }

  function confirmKeepYummy() {
    if (!state.pendingReveal) return;
    const { sliceIdx, slice } = state.pendingReveal;
    state.pendingReveal = null;
    elModalReveal.classList.add('hidden');

    const p = currentPlayer();
    p.slices.push(slice);
    const newSlicePos = p.slices.length - 1;
    replenishSliceAt(sliceIdx);
    renderGameUI(newSlicePos);

    if (p.slices.length >= SLICES_TO_WIN) {
      triggerVictory(p);
      return;
    }

    showToast(`🍕 ${p.name} 收集到第 ${p.slices.length} 片美味披薩！`, 1600);
    advanceTurn();
  }

  function confirmTrashYucky() {
    if (!state.pendingReveal) return;
    const { sliceIdx, slice } = state.pendingReveal;
    state.pendingReveal = null;
    elModalReveal.classList.add('hidden');

    const p = currentPlayer();
    p.yuckyCount += 1;
    state.trashCount += 1;
    elTrashCount.textContent = `已丟 ${state.trashCount} 片`;
    elTrashHint.textContent = `咕嚕！剛剛吃掉了「${slice.topping.name}」！`;

    playTrashSound();
    elTrashBinBtn.classList.add('open');
    setTimeout(() => {
      elTrashBinBtn.classList.remove('open');
      elTrashStation.classList.remove('highlight-trash');
    }, 800);

    replenishSliceAt(sliceIdx);
    renderGameUI();
    showToast(`🗑️ 咚！把「${slice.topping.name}」丟進垃圾桶囉！`, 1800);
    advanceTurn();
  }

  function advanceTurn() {
    state.currentPlayerIdx = (state.currentPlayerIdx + 1) % state.players.length;
    state.phase = 'spin';
    state.targetColor = null;
    state.targetShape = null;
    announceTurn();
  }

  function triggerVictory(winner) {
    state.phase = 'victory';
    clearBotTimers();
    playVictorySound();
    startConfetti();

    elVictoryTitle.textContent = `${winner.avatar} ${winner.name} 完成了美味大披薩！`;
    elVictorySubtitle.textContent = '太厲害了！6 片美味配料全部拼滿，你是今天的披薩大冠軍！';
    elVictoryShowcase.innerHTML = renderPlayerPlateSVG(winner.slices);
    elVictoryStats.innerHTML = `
      <span class="stat-pill">🍕 收集 ${winner.slices.length} 片美味披薩</span>
      <span class="stat-pill">🗑️ 垃圾桶吃掉 ${state.trashCount} 片噁心配料</span>
      <span class="stat-pill">🎯 共轉了 ${state.turnsPlayed} 次轉盤</span>
    `;

    elModalVictory.classList.remove('hidden');
    speak(`恭喜${winner.name}！完成了六片美味大披薩，太厲害了！`);
  }

  // ==================== 溫柔小提示 ====================
  function showHint() {
    if (state.phase !== 'pick' || currentPlayer().isBot) return;
    playTone(740, 0.12, 'sine', 0.12);
    const cards = $$('.slice-card');
    cards.forEach((el) => {
      const idx = Number(el.dataset.idx);
      if (isSliceMatching(state.tableSlices[idx])) {
        el.classList.add('hint-glow');
      }
    });
    setTimeout(() => {
      $$('.slice-card.hint-glow').forEach((el) => el.classList.remove('hint-glow'));
    }, 2200);
  }

  // ==================== 五彩撒花動畫 ====================
  let confettiAnimId = null;
  const confettiCanvas = $('#confetti-canvas');
  const confettiCtx = confettiCanvas.getContext('2d');
  let particles = [];

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function startConfetti() {
    resizeConfetti();
    const palette = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    particles = Array.from({ length: 130 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * confettiCanvas.height * 0.6,
      w: 8 + Math.random() * 8,
      h: 6 + Math.random() * 10,
      color: palette[Math.floor(Math.random() * palette.length)],
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2.5 + Math.random() * 3.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.16,
    }));

    const loop = () => {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.rot += pt.vrot;
        if (pt.y > confettiCanvas.height + 20) {
          pt.y = -20;
          pt.x = Math.random() * confettiCanvas.width;
        }
        confettiCtx.save();
        confettiCtx.translate(pt.x, pt.y);
        confettiCtx.rotate(pt.rot);
        confettiCtx.fillStyle = pt.color;
        confettiCtx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
        confettiCtx.restore();
      });
      confettiAnimId = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(confettiAnimId);
    loop();
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiAnimId);
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  // ==================== 事件綁定與初始化 ====================
  function bindEvents() {
    window.addEventListener('resize', resizeConfetti);

    // 模式選擇
    $$('#mode-options .choice-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#mode-options .choice-card').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.mode = btn.dataset.mode;
        playTone(580, 0.07, 'triangle', 0.12);
      });
    });

    // 人數選擇
    $$('#player-count-pills .count-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#player-count-pills .count-pill').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.playerCount = Number(btn.dataset.count);
        playTone(620, 0.07, 'triangle', 0.12);
        renderPlayerConfigs();
      });
    });

    elChkWithBot.addEventListener('change', () => {
      state.withBot = elChkWithBot.checked;
      renderPlayerConfigs();
    });

    $('#btn-start-game').addEventListener('click', () => {
      ensureAudio();
      startNewGame();
    });

    $('#btn-home').addEventListener('click', () => {
      showScreen('setup');
    });

    $('#btn-restart').addEventListener('click', () => {
      startNewGame();
    });

    elBtnSpin.addEventListener('click', () => {
      ensureAudio();
      spinWheels();
    });

    elBtnHint.addEventListener('click', showHint);

    // 垃圾桶直接點擊也有可愛互動彩蛋！
    elTrashBinBtn.addEventListener('click', () => {
      if (state.pendingReveal && state.pendingReveal.slice.isYucky) {
        confirmTrashYucky();
      } else {
        playTrashSound();
        elTrashBinBtn.classList.add('open');
        showToast('😝 垃圾桶張開嘴巴等你丟噁心配料喔！', 1600);
        setTimeout(() => elTrashBinBtn.classList.remove('open'), 650);
      }
    });

    // 勝利彈窗按鈕
    $('#btn-play-again').addEventListener('click', startNewGame);
    $('#btn-back-setup').addEventListener('click', () => {
      elModalVictory.classList.add('hidden');
      showScreen('setup');
    });

    // 音效／語音／說明
    $('#btn-sound').addEventListener('click', (e) => {
      state.soundOn = !state.soundOn;
      const btn = e.currentTarget;
      btn.classList.toggle('active', state.soundOn);
      btn.querySelector('.pill-emoji').textContent = state.soundOn ? '🔊' : '🔇';
      btn.querySelector('.pill-label').textContent = state.soundOn ? '音效開' : '音效關';
      if (state.soundOn) playTone(660, 0.1, 'triangle', 0.14);
    });

    $('#btn-voice').addEventListener('click', (e) => {
      state.voiceOn = !state.voiceOn;
      const btn = e.currentTarget;
      btn.classList.toggle('active', state.voiceOn);
      btn.querySelector('.pill-emoji').textContent = state.voiceOn ? '🗣️' : '🤫';
      btn.querySelector('.pill-label').textContent = state.voiceOn ? '語音開' : '語音關';
      if (!state.voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      if (state.voiceOn) speak('語音小幫手開啟囉！');
    });

    $('#btn-help').addEventListener('click', () => elModalHelp.classList.remove('hidden'));
    $('#btn-close-help').addEventListener('click', () => elModalHelp.classList.add('hidden'));
    $('#btn-help-ok').addEventListener('click', () => elModalHelp.classList.add('hidden'));
    elModalHelp.addEventListener('click', (e) => {
      if (e.target === elModalHelp) elModalHelp.classList.add('hidden');
    });
  }

  function init() {
    // 首頁裝飾披薩圖
    elHeroPizzaArt.innerHTML = renderPlayerPlateSVG([
      { topping: YUMMY_TOPPINGS[0] },
      { topping: YUMMY_TOPPINGS[2] },
      { topping: YUMMY_TOPPINGS[4] },
      { topping: YUMMY_TOPPINGS[1] },
      { topping: YUMMY_TOPPINGS[5] },
      { topping: YUMMY_TOPPINGS[3] },
    ]);
    buildWheels();
    renderPlayerConfigs();
    bindEvents();
  }

  init();
})();
