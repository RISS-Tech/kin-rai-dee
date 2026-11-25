let MENUS = [];

    let isMenusLoading = true;
    let lastSystemRetryFn = null;

    function showSystemError(title, desc, retryFn) {
      const banner = document.getElementById('systemErrorBanner');
      if (!banner) return;
      document.getElementById('systemErrorTitle').textContent = title;
      document.getElementById('systemErrorDesc').textContent = desc;
      lastSystemRetryFn = retryFn || null;
      document.getElementById('systemErrorRetryBtn').style.display = retryFn ? 'inline-block' : 'none';
      banner.classList.add('show');
    }

    function hideSystemError() {
      const banner = document.getElementById('systemErrorBanner');
      if (banner) banner.classList.remove('show');
    }

    function retrySystemAction() {
      hideSystemError();
      if (typeof lastSystemRetryFn === 'function') lastSystemRetryFn();
    }

    function setFieldError(inputId, errorId, message) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errorId);
      if (inp) {
        inp.setAttribute('aria-invalid', 'true');
        inp.focus();
      }
      if (err) {
        err.textContent = '⚠️ ' + message;
        err.classList.add('show');
      }
    }

    function clearFieldError(inputId, errorId) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errorId);
      if (inp) inp.removeAttribute('aria-invalid');
      if (err) {
        err.textContent = '';
        err.classList.remove('show');
      }
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const NON_HALAL_KEYWORDS = [
      'หมู', 'เบคอน', 'แฮม', 'กุนเชียง', 'ขาหมู', 'คากิ', 'แคบหมู', 'ไส้อั่ว',
      'แหนม', 'ไส้กรอก', 'ซัมกยอบซัล', 'ชาชู', 'ทงคัตสึ', 'คัตสึด้ง',
      'ชนิทเซล', 'บราทเวิร์ส', 'โคชินิตา', 'หมูยอ', 'ตับบด',
      'ไวน์', 'เบียร์', 'เหล้า', 'มิริน', 'เลือด', 'น้ำตก', 'บาลุต', 'มดแดง', 'ปลาร้า'
    ];

    function detectIsHalalText(text, protein = '') {
      if (protein === 'หมู') return false;
      const lower = String(text || '').toLowerCase();
      return !NON_HALAL_KEYWORDS.some(k => lower.includes(k));
    }

    function isMenuHalal(menu) {
      if (!menu) return false;
      if (typeof menu.is_halal === 'boolean') return menu.is_halal;
      return detectIsHalalText(
        `${menu.name || ''} ${menu.recipe_hint || ''} ${(menu.ingredients || []).join(' ')}`,
        menu.protein || ''
      );
    }

    function isMenuExotic(menu) {
      return Boolean(menu && menu.is_exotic === true);
    }

    function getExoticLevelMeta(level) {
      const lvl = Number(level) || 1;
      if (lvl === 3) return { skulls: '💀💀💀', text: '💀💀💀 ตำนานระดับโลก', short: '💀💀💀 Lv.3' };
      if (lvl === 2) return { skulls: '💀💀', text: '💀💀 ฮาร์ดคอร์ท้องถิ่น', short: '💀💀 Lv.2' };
      return { skulls: '💀', text: '💀 แปลกแต่น่าลอง', short: '💀 Lv.1' };
    }

    function getAvailableMenus(opts = {}) {
      const allowExotic = typeof opts.allowExotic === 'boolean' ? opts.allowExotic : Boolean(state.exoticMode);
      return MENUS.filter(m => {
        if (state.halalMode && !isMenuHalal(m)) return false;
        if (!allowExotic && isMenuExotic(m)) return false;
        return true;
      });
    }

    function resolveMenuPair(menu, type) {
      // คู่จับคู่สำรับเลือกจากเมนูมาตรฐานที่ปลอดภัย (ไม่ดึงเมนูแปลกมาปน และเคารพโหมดฮาลาล 100%)
      const avail = getAvailableMenus({ allowExotic: false });
      if (!menu || avail.length === 0) return menu;

      if (type === 'main') {
        const direct = avail.find(m => m.id === menu.pair_id);
        if (direct && direct.id !== menu.id) return direct;
        const candidates = avail.filter(m =>
          m.mode === 'main' &&
          m.id !== menu.id &&
          m.protein !== menu.protein &&
          Array.isArray(m.tags) && m.tags.includes('กับข้าว')
        );
        if (candidates.length > 0) {
          const seed = String(menu.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          return candidates[seed % candidates.length];
        }
        return avail.find(m => m.mode === 'main' && m.id !== menu.id) || avail[0] || menu;
      }

      const directSweet = avail.find(m => m.id === menu.dessert_pair_id);
      if (directSweet && directSweet.id !== menu.id) return directSweet;
      const targetSweetMode = menu.mode === 'dessert' ? 'drink' : (menu.mode === 'drink' ? 'dessert' : null);
      let sweets = targetSweetMode
        ? avail.filter(m => m.mode === targetSweetMode && m.id !== menu.id)
        : [];
      if (sweets.length === 0) {
        sweets = avail.filter(m => (m.mode === 'dessert' || m.mode === 'drink') && m.id !== menu.id);
      }
      if (sweets.length > 0) {
        const seed = String(menu.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return sweets[seed % sweets.length];
      }
      return avail[0] || menu;
    }

    function recordEatenMeal({ menuId = null, name, amount = 0, xp = 25, source = 'wheel' }) {
      const cleanName = String(name || 'มื้ออาหาร').trim();
      const numericAmount = Math.max(0, Number(amount) || 0);

      // 1. บันทึกเข้าประวัติการกิน (รักษาโครงสร้าง string array เพื่อรองรับ Firestore เดิม)
      const histKey = menuId ? String(menuId) : `FRIDGE:${cleanName.slice(0, 60)}`;
      const existingIdx = state.history.indexOf(histKey);
      if (existingIdx >= 0) state.history.splice(existingIdx, 1);
      state.history.unshift(histKey);
      if (state.history.length > 15) state.history.pop();

      // 2. บันทึกเข้ากระเป๋าคุมงบค่ากิน
      state.expenses.unshift({
        id: 'EXP-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: cleanName,
        amount: numericAmount,
        source,
        date: new Date().toISOString()
      });
      if (state.expenses.length > 120) state.expenses.pop();

      // 3. เพิ่ม XP + บันทึก LocalStorage + ซิงก์คลาวด์ + อัปเดตทุกหน้าจอที่เกี่ยวข้อง
      addXp(xp);
      renderSaved();
      renderFoodWallet();
      prepareWheelSlices();
    }

    function loadMenusJson() {
      isMenusLoading = true;
      fetch('menus.json')
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(data => {
          isMenusLoading = false;
          hideSystemError();
          if (Array.isArray(data) && data.length > 0) {
            MENUS = data;
          }
          initApp();
        })
        .catch(() => {
          isMenusLoading = false;
          initApp();
          showSystemError(
            '⚠️ โหลดรายการเมนูไม่สำเร็จชั่วคราว',
            'อาจเกิดจากสัญญาณอินเทอร์เน็ตขัดข้อง แตะ "ลองใหม่" เพื่อโหลดฐานข้อมูลเมนูอีกครั้ง',
            loadMenusJson
          );
        });
    }
    loadMenusJson();

    const AVATARS = [
      { id: 'pinto', icon: '🍲', name: 'น้องปิ่นโต' },
      { id: 'wok', icon: '🔥', name: 'เชฟกระทะเหล็ก' },
      { id: 'somtum', icon: '👑', name: 'อาซิ่มส้มตำ' },
      { id: 'chathai', icon: '🧋', name: 'แก้วชาไทย' },
      { id: 'khaosoi', icon: '🍛', name: 'น้องข้าวซอย' },
      { id: 'bualoy', icon: '🥥', name: 'หมีบัวลอย' },
      { id: 'ramen', icon: '🍜', name: 'ซามูไรราเมน' },
      { id: 'passport', icon: '✈️', name: 'กัปตันพาสปอร์ต' }
    ];

    const COUNTRIES = [
      { name: 'ญี่ปุ่น', flag: '🇯🇵' },
      { name: 'เกาหลี', flag: '🇰🇷' },
      { name: 'อิตาลี', flag: '🇮🇹' },
      { name: 'อเมริกัน', flag: '🇺🇸' },
      { name: 'อินเดีย', flag: '🇮🇳' },
      { name: 'เวียดนาม', flag: '🇻🇳' },
      { name: 'จีน', flag: '🇨🇳' },
      { name: 'เม็กซิกัน', flag: '🇲🇽' },
      { name: 'ฝรั่งเศส', flag: '🇫🇷' },
      { name: 'เยอรมนี', flag: '🇩🇪' },
      { name: 'สเปน', flag: '🇪🇸' },
      { name: 'กรีซ', flag: '🇬🇷' },
      { name: 'ตุรกี', flag: '🇹🇷' },
      { name: 'ออสเตรเลีย', flag: '🇦🇺' },
      { name: 'ออสเตรีย', flag: '🇦🇹' },
      { name: 'เบลเยียม', flag: '🇧🇪' },
      { name: 'โปแลนด์', flag: '🇵🇱' },
      { name: 'สวีเดน', flag: '🇸🇪' },
      { name: 'ฮังการี', flag: '🇭🇺' },
      { name: 'ไอซ์แลนด์', flag: '🇮🇸' },
      { name: 'สกอตแลนด์', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
      { name: 'กรีนแลนด์', flag: '🇬🇱' },
      { name: 'บราซิล', flag: '🇧🇷' },
      { name: 'อาร์เจนตินา', flag: '🇦🇷' },
      { name: 'เปรู', flag: '🇵🇪' },
      { name: 'ชิลี', flag: '🇨🇱' },
      { name: 'เวเนซุเอลา', flag: '🇻🇪' },
      { name: 'มาเลเซีย', flag: '🇲🇾' },
      { name: 'อินโดนีเซีย', flag: '🇮🇩' },
      { name: 'ลาว', flag: '🇱🇦' },
      { name: 'เมียนมา', flag: '🇲🇲' },
      { name: 'ฟิลิปปินส์', flag: '🇵🇭' },
      { name: 'บรูไน', flag: '🇧🇳' },
      { name: 'ศรีลังกา', flag: '🇱🇰' },
      { name: 'ปากีสถาน', flag: '🇵🇰' },
      { name: 'อัฟกานิสถาน', flag: '🇦🇫' },
      { name: 'ทิเบต', flag: '🏔️' },
      { name: 'ซาอุดีอาระเบีย', flag: '🇸🇦' },
      { name: 'อิหร่าน', flag: '🇮🇷' },
      { name: 'อิรัก', flag: '🇮🇶' },
      { name: 'ตะวันออกกลาง', flag: '🕌' },
      { name: 'อียิปต์', flag: '🇪🇬' },
      { name: 'แอฟริกาใต้', flag: '🇿🇦' },
      { name: 'ไนจีเรีย', flag: '🇳🇬' },
      { name: 'กานา', flag: '🇬🇭' },
      { name: 'ซูดาน', flag: '🇸🇩' },
      { name: 'เดนมาร์ก', flag: '🇩🇰' },
      { name: 'ปาเลา', flag: '🇵🇼' },
      { name: 'นอร์เวย์', flag: '🇳🇴' },
      { name: 'แคนาดา', flag: '🇨🇦' },
      { name: 'อังกฤษ', flag: '🇬🇧' }
    ];
    let isPassportExpanded = false;
    function syncCountriesFromMenus() {
      MENUS.forEach(m => {
        if (m.category === 'อาหารนานาชาติ' && m.region && !COUNTRIES.some(c => c.name === m.region)) {
          COUNTRIES.push({ name: m.region, flag: '🌍' });
        }
      });
    }
    function togglePassportExpand() {
      isPassportExpanded = !isPassportExpanded;
      renderPassportStamps();
    }
    function renderPassportStamps() {
      const grid = document.getElementById('passportStampsGrid');
      const btn = document.getElementById('passportExpandBtn');
      if (!grid) return;
      const total = COUNTRIES.length;
      const ordered = [...COUNTRIES].sort((a, b) => {
        const ua = state.stamps.includes(a.name) ? 0 : 1;
        const ub = state.stamps.includes(b.name) ? 0 : 1;
        return ua - ub;
      });
      const visibleList = isPassportExpanded ? ordered : ordered.slice(0, 8);
      grid.innerHTML = visibleList.map(c => {
        const unlocked = state.stamps.includes(c.name);
        return `<div class="stamp-item ${unlocked ? 'unlocked' : ''}">
          <div style="font-size: 24px;">${c.flag}</div>
          <div style="font-size: 11px; line-height: 1.25; margin-top: 2px;">${c.name}</div>
          ${unlocked ? '<div style="font-size: 10px; color: #16A34A; margin-top: 2px;">✓ สะสมแล้ว</div>' : ''}
        </div>`;
      }).join('');
      if (btn) {
        const hiddenCount = Math.max(0, total - 8);
        if (hiddenCount === 0) {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'block';
          btn.textContent = isPassportExpanded
            ? `ย่อรายการตราประเทศ ▲`
            : `ขยายดูตราประเทศทั้งหมด (+${hiddenCount} ประเทศ / รวม ${total} ประเทศ) ▼`;
        }
      }
    }

    const RANKS = [
      { minXp: 0, title: 'มือใหม่หัดหิว' },
      { minXp: 100, title: 'นักชิมประจำซอย' },
      { minXp: 300, title: 'เซียนกะเพรา' },
      { minXp: 600, title: 'กูรูสำรับไทย' },
      { minXp: 1000, title: 'เชฟกระทะทองคำ' }
    ];

    let state = JSON.parse(localStorage.getItem('tookmue_state') || 'null') || {
      xp: 40,
      streak: 1,
      lastCheckIn: '',
      avatar: '🍲',
      isVip: false,
      halalMode: false,
      exoticMode: false,
      exoticEatenCount: 0,
      homePickerStyle: 'card',
      spinSource: 'all',
      spinTraySize: 5,
      customSpinIds: [],
      favAutoFill: false,
      soundOn: true,
      favorites: [],
      history: [],
      stamps: [],
      weeklyBudget: 1000,
      expenses: [],
      weeklyPlan: [],
      groceryChecked: [],
      customGroceries: [],
      customMenus: [],
      weeklyQuestClaims: {}
    };
    if (state.soundOn === undefined) state.soundOn = true;
    if (typeof state.halalMode !== 'boolean') state.halalMode = false;
    if (typeof state.exoticMode !== 'boolean') state.exoticMode = false;
    if (!state.exoticEatenCount) state.exoticEatenCount = 0;
    if (state.homePickerStyle !== 'card' && state.homePickerStyle !== 'wheel') state.homePickerStyle = 'card';
    if (!['all', 'favorites', 'custom'].includes(state.spinSource)) state.spinSource = 'all';
    if (state.spinTraySize !== 5 && state.spinTraySize !== 8) state.spinTraySize = 5;
    if (!Array.isArray(state.customSpinIds)) state.customSpinIds = [];
    if (typeof state.favAutoFill !== 'boolean') state.favAutoFill = false;
    if (!Array.isArray(state.stamps)) state.stamps = [];
    if (!state.weeklyBudget) state.weeklyBudget = 1000;
    if (!Array.isArray(state.expenses)) state.expenses = [];
    if (!Array.isArray(state.weeklyPlan)) state.weeklyPlan = [];
    if (!Array.isArray(state.groceryChecked)) state.groceryChecked = [];
    if (!Array.isArray(state.customGroceries)) state.customGroceries = [];
    if (!Array.isArray(state.customMenus)) state.customMenus = [];
    if (!state.weeklyQuestClaims || typeof state.weeklyQuestClaims !== 'object') state.weeklyQuestClaims = {};

    function mergeCustomMenusIntoCatalog() {
      if (!Array.isArray(state.customMenus)) return;
      state.customMenus.forEach(cm => {
        if (cm.mode === 'sweet') {
          cm.mode = cm.category === 'เครื่องดื่ม' ? 'drink' : 'dessert';
        }
        if (typeof cm.is_exotic !== 'boolean') cm.is_exotic = false;
        if (!MENUS.some(m => m.id === cm.id)) {
          MENUS.unshift(cm);
        }
      });
    }

    let currentMode = 'main';
    let quickFilter = 'all';
    let exploreCat = 'all';
    let exploreSpecialty = 'all';
    let isHomeFilterDrawerOpen = false;
    let exoticOnly = true;
    let exoticLevelFilter = 'all';
    let partyDareLevel = 'all';
    let latestPartyDare = null;
    let trayDraftIds = [];
    let trayModalSize = 5;
    let currentRotation = 0;
    let isSpinning = false;
    let activeWheelMenus = [];
    let selectedMenu = null;
    let currentPreviewMenu = null;
    let currentSamrubMainId = null;
    let samrubBudgetCap = 0;
    let currentSamrubTrio = null;
    let groupSpinTab = 'rules';
    let groupRules = { halal: false, nonspicy: false, fast: false, veg: false, maxBudget: 0 };
    let groupCustomPicks = [];
    let latestGroupResult = null;


    // Smart Wikimedia Commons Live API Fallback (Resolves exact dish photo automatically)

    function buildDishCardFallback(menu) {
      const emojiMap = {
        'หมู': '🥩', 'ไก่': '🍗', 'เนื้อ': '🥩', 'ทะเล': '🦐',
        'ปลา': '🐟', 'ปู': '🦀', 'หอย': '🐚', 'ไข่': '🍳',
        'เต้าหู้': '🧈', 'มังสวิรัติ': '🥗', 'อื่นๆ': '🧋'
      };
      const icon = (menu.category === 'เครื่องดื่ม') ? '🥤' : ((menu.category === 'ของหวาน') ? '🍨' : (emojiMap[menu.protein] || '🍽️'));
      const bg1 = (menu.category === 'ของหวาน' || menu.category === 'เครื่องดื่ม') ? '#FEF3C7' : '#FFEDD5';
      const bg2 = (menu.category === 'ของหวาน' || menu.category === 'เครื่องดื่ม') ? '#FDE68A' : '#FED7AA';
      const shortName = (menu.name || '').slice(0, 22);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
        <rect width="600" height="360" rx="24" fill="url(#g)"/>
        <circle cx="300" cy="140" r="68" fill="#FFFFFF" opacity="0.85"/>
        <text x="300" y="162" font-size="68" text-anchor="middle">${icon}</text>
        <text x="300" y="255" font-size="26" font-weight="bold" fill="#3A2B22" text-anchor="middle" font-family="Prompt, sans-serif">${shortName}</text>
        <text x="300" y="292" font-size="18" fill="#786458" text-anchor="middle" font-family="Prompt, sans-serif">${menu.region || menu.category}</text>
      </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    const wikiCache = {};
    async function resolveWikiImage(imgEl, menuId) {
      if (!imgEl || imgEl.dataset.triedWiki === '1') {
        if (imgEl) imgEl.style.display = 'none';
        return;
      }
      imgEl.dataset.triedWiki = '1';
      const menu = MENUS.find(m => m.id === menuId);
      if (!menu) { imgEl.style.display = 'none'; return; }

      if (wikiCache[menuId]) {
        imgEl.src = wikiCache[menuId];
        return;
      }

      const queries = [menu.wiki_query, menu.name].filter(Boolean);
      for (const q of queries) {
        try {
          const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap+${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*`;
          const res = await fetch(apiUrl);
          const data = await res.json();
          const pages = data?.query?.pages;
          if (pages) {
            const sorted = Object.values(pages).sort((a, b) => (a.index || 99) - (b.index || 99));
            for (const p of sorted) {
              const thumb = p?.imageinfo?.[0]?.thumburl;
              if (thumb) {
                wikiCache[menuId] = thumb;
                menu.image_url = thumb;
                imgEl.src = thumb;
                return;
              }
            }
          }
        } catch (e) {}
      }
      const fallbackSvg = buildDishCardFallback(menu);
      wikiCache[menuId] = fallbackSvg;
      menu.image_url = fallbackSvg;
      imgEl.src = fallbackSvg;
    }

    // Web Audio API Synthesizer
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playTickSound() {
      if (!state.soundOn) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }

    function playWinChime() {
      if (!state.soundOn) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = ctx.currentTime + idx * 0.09;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.2, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.36);
        });
      } catch (e) {}
    }

    function toggleSound() {
      state.soundOn = !state.soundOn;
      saveState();
      if (state.soundOn) playTickSound();
      showToast(state.soundOn ? 'เปิดเสียงเอฟเฟกต์แล้ว 🔊' : 'ปิดเสียงเอฟเฟกต์แล้ว 🔇');
    }

    function saveState() {
      localStorage.setItem('tookmue_state', JSON.stringify(state));
      updateProfileUI();
      if (typeof window.syncStateToCloud === 'function') window.syncStateToCloud();
    }

    function showToast(msg) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.style.display = 'block';
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2800);
    }

    function switchTab(tabName) {
      document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + tabName).classList.add('active');
      const navBtn = document.getElementById('nav-' + tabName);
      if (navBtn) navBtn.classList.add('active');

      if (tabName === 'explore') renderExplorer();
      if (tabName === 'saved') { renderSaved(); renderWeeklyPlan(); renderFoodWallet(); }
      if (tabName === 'quests') updateProfileUI();
    }

    function getWeeklyBudgetSummary() {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const curMonth = now.getMonth();
      const curYear = now.getFullYear();

      let weekSpent = 0;
      let monthSpent = 0;

      (state.expenses || []).forEach(e => {
        const d = new Date(e.date);
        const amt = Number(e.amount) || 0;
        if (d >= startOfWeek) weekSpent += amt;
        if (d.getMonth() === curMonth && d.getFullYear() === curYear) monthSpent += amt;
      });

      const goal = state.weeklyBudget || 1000;
      const remain = goal - weekSpent;
      const pct = Math.min(100, Math.round((weekSpent / goal) * 100));
      return { weekSpent, monthSpent, goal, remain, pct };
    }

    function getMealContextGreeting() {
      const h = new Date().getHours();
      if (h >= 5 && h < 11) return '🌅 มื้อเช้านี้กินอะไรดี?';
      if (h >= 11 && h < 15) return '☀️ มื้อเที่ยงนี้จัดอะไรดี?';
      if (h >= 15 && h < 17) return '🧋 บ่ายนี้หาอะไรรองท้องดี?';
      if (h >= 17 && h < 21) return '🌙 มื้อเย็นจัดสำรับอะไรดี?';
      return '🦉 มื้อดึกเบาๆ อะไรดี?';
    }

    function getTimeAwareActionSpec() {
      const h = new Date().getHours();
      if (h >= 5 && h < 11) {
        return { key: 'morning', label: '⚡ มื้อเช้าด่วน (≤15 น.)' };
      }
      if (h >= 11 && h < 15) {
        return { key: 'lunch', label: '💰 มื้อเที่ยงประหยัด (≤50฿)' };
      }
      if (h >= 15 && h < 17) {
        return { key: 'afternoon', label: '☕ แก้ง่วงยามบ่าย' };
      }
      if (h >= 17 && h < 21) {
        return { key: 'dinner', label: '🥢 สำรับเย็น ≤180฿' };
      }
      return { key: 'latenight', label: '🌙 มื้อดึกย่อยง่าย' };
    }

    function triggerTimeAwareAction() {
      const spec = getTimeAwareActionSpec();
      playTickSound();
      if (spec.key === 'morning') {
        state.spinSource = 'all';
        moodFilter = 'all';
        quickFilter = 'fast15';
        setWheelMode('main');
        document.querySelectorAll('#quickFilters .chip-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'fast15'));
        prepareWheelSlices();
        showToast('คัดเมนูเช้าทำไว ≤15 นาที พร้อมสุ่มแล้ว ⚡');
      } else if (spec.key === 'lunch') {
        state.spinSource = 'all';
        moodFilter = 'all';
        quickFilter = 'budget50';
        setWheelMode('main');
        document.querySelectorAll('#quickFilters .chip-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'budget50'));
        prepareWheelSlices();
        showToast('คัดมื้อเที่ยงประหยัด ≤50฿ พร้อมสุ่มแล้ว 💰');
      } else if (spec.key === 'afternoon') {
        state.spinSource = 'all';
        quickFilter = 'all';
        moodFilter = 'all';
        setWheelMode('drink');
        showToast('สลับสู่โหมดเครื่องดื่มแก้ง่วงยามบ่ายแล้ว ☕');
      } else if (spec.key === 'dinner') {
        const capBtn = document.querySelector('#samrubBudgetGroup .samrub-cap-chip[data-cap="180"]');
        setSamrubBudgetCap(180, capBtn);
        const card = document.getElementById('dailySamrubCard');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('จัดสำรับ 3 ชิ้นมื้อเย็น งบรวม ≤180฿ ให้แล้ว 🥢');
      } else {
        state.spinSource = 'all';
        moodFilter = 'all';
        quickFilter = 'nonspicy';
        setWheelMode('main');
        document.querySelectorAll('#quickFilters .chip-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'nonspicy'));
        prepareWheelSlices();
        showToast('คัดเมนูมื้อดึกไม่เผ็ด ย่อยง่าย พร้อมสุ่มแล้ว 🌙');
      }
    }

    function renderHomeContextStrip() {
      const greetEl = document.getElementById('homeMealGreeting');
      const pillEl = document.getElementById('homeBudgetPill');
      const timeBtn = document.getElementById('homeTimeActionBtn');
      if (greetEl) greetEl.textContent = getMealContextGreeting();
      if (timeBtn) {
        const spec = getTimeAwareActionSpec();
        timeBtn.innerHTML = `<span>${spec.label}</span>`;
      }
      if (!pillEl) return;

      const { remain, pct } = getWeeklyBudgetSummary();
      pillEl.classList.remove('warn', 'over');
      if (remain < 0) {
        pillEl.classList.add('over');
        pillEl.textContent = `🚨 เกินงบ ${Math.abs(remain).toLocaleString()}฿`;
      } else if (pct >= 80) {
        pillEl.classList.add('warn');
        pillEl.textContent = `⚠️ เหลือ ${remain.toLocaleString()}฿`;
      } else {
        pillEl.textContent = `💰 งบเหลือ ${remain.toLocaleString()}฿`;
      }
    }

    function getSpinCtaLabel() {
      if (state.spinSource === 'favorites') {
        return state.homePickerStyle === 'card' ? '❤️ สุ่มจากเมนูโปรด!' : '❤️ หมุนวงล้อเมนูโปรด!';
      }
      if (state.spinSource === 'custom') {
        return state.homePickerStyle === 'card' ? '🎯 สุ่มจากถาดคัดเอง!' : '🎯 หมุนถาดคัดเอง!';
      }
      if (state.exoticMode && exoticOnly && (currentMode === 'main' || currentMode === 'passport')) {
        return '🦂 สุ่มท้าลองเมนูแปลก!';
      }
      if (currentMode === 'passport') return '✈️ บินสุ่มอาหารนานาชาติ!';
      if (currentMode === 'dessert') return state.homePickerStyle === 'card' ? '🍨 สุ่มของหวานฮีลใจ!' : '🍨 หมุนสุ่มของหวาน!';
      if (currentMode === 'drink') return state.homePickerStyle === 'card' ? '🥤 สุ่มเครื่องดื่มสดชื่น!' : '🥤 หมุนสุ่มเครื่องดื่ม!';
      if (state.homePickerStyle === 'card') return '✨ สุ่มเมนูภาพจริง!';
      return '🎯 หมุนสุ่มมื้อนี้!';
    }

    function setHomePickerStyle(style) {
      if (isSpinning) return;
      state.homePickerStyle = (style === 'wheel') ? 'wheel' : 'card';
      saveState();
      syncHomePickerVisibility();
      const spinBtn = document.getElementById('spinBtn');
      if (spinBtn && !isSpinning) spinBtn.textContent = getSpinCtaLabel();
      if (state.homePickerStyle === 'wheel') {
        drawWheel();
      } else {
        renderPhotoDeckPreview(currentPreviewMenu || activeWheelMenus[0] || null);
        renderPhotoDeckStrip();
      }
    }

    function syncHomePickerVisibility() {
      const isCard = state.homePickerStyle !== 'wheel';
      const btnCard = document.getElementById('btnPickerCard');
      const btnWheel = document.getElementById('btnPickerWheel');
      const cardStage = document.getElementById('photoDeckStage');
      const wheelStage = document.getElementById('classicWheelStage');
      const emptyBox = document.getElementById('wheelEmptyState');
      const hasZero = emptyBox && emptyBox.style.display === 'block';

      if (btnCard) btnCard.classList.toggle('active', isCard);
      if (btnWheel) btnWheel.classList.toggle('active', !isCard);

      if (hasZero) {
        if (cardStage) cardStage.style.display = 'none';
        if (wheelStage) wheelStage.style.display = 'none';
      } else {
        if (cardStage) cardStage.style.display = isCard ? 'block' : 'none';
        if (wheelStage) wheelStage.style.display = isCard ? 'none' : 'flex';
      }
    }

    function renderPhotoDeckPreview(menu) {
      const skel = document.getElementById('deckSkeleton');
      const img = document.getElementById('deckHeroImg');
      const regBadge = document.getElementById('deckRegionBadge');
      const halalBadge = document.getElementById('deckHalalBadge');
      const exoticBadge = document.getElementById('deckExoticBadge');
      const nameEl = document.getElementById('deckDishName');
      const budgetEl = document.getElementById('deckDishBudget');
      const timeEl = document.getElementById('deckDishTime');
      const spicyEl = document.getElementById('deckDishSpicy');
      if (!nameEl || !img) return;

      if (!menu) {
        currentPreviewMenu = null;
        if (skel) skel.style.display = 'block';
        img.style.display = 'none';
        nameEl.textContent = isMenusLoading ? 'กำลังโหลดเมนูอร่อย...' : 'ไม่พบเมนูที่ตรงเงื่อนไข';
        if (budgetEl) budgetEl.textContent = '💰 --฿';
        if (timeEl) timeEl.textContent = '⏱️ -- นาที';
        if (spicyEl) spicyEl.textContent = '';
        if (halalBadge) halalBadge.style.display = 'none';
        if (exoticBadge) exoticBadge.style.display = 'none';
        return;
      }

      currentPreviewMenu = menu;
      if (skel) skel.style.display = 'none';
      img.style.display = 'block';
      img.dataset.triedWiki = '0';
      img.dataset.mid = menu.id;
      img.alt = menu.name;
      img.src = menu.image_url || '';

      const cObj = COUNTRIES.find(c => c.name === menu.region);
      const regPrefix = cObj ? cObj.flag : (menu.category === 'เครื่องดื่ม' ? '🥤' : (menu.category === 'ของหวาน' ? '🍨' : '🇹🇭'));
      if (regBadge) regBadge.textContent = `${regPrefix} ${menu.region || menu.category}`;
      if (halalBadge) halalBadge.style.display = (state.halalMode && isMenuHalal(menu)) ? 'inline-flex' : 'none';
      if (exoticBadge) {
        if (isMenuExotic(menu)) {
          exoticBadge.textContent = getExoticLevelMeta(menu.exotic_level).short;
          exoticBadge.style.display = 'inline-flex';
        } else {
          exoticBadge.style.display = 'none';
        }
      }

      nameEl.textContent = menu.name;
      if (budgetEl) budgetEl.textContent = `💰 ~${menu.budget}฿`;
      if (timeEl) timeEl.textContent = `⏱️ ${menu.prep_time} นาที`;
      const isSweetOrDrink = menu.mode === 'dessert' || menu.mode === 'drink' || menu.mode === 'sweet';
      if (spicyEl) spicyEl.textContent = isSweetOrDrink ? '' : (menu.is_spicy ? '• 🌶️ รสจัด' : '• 🌿 ไม่เผ็ด');
    }

    function renderPhotoDeckStrip() {
      const strip = document.getElementById('photoDeckStrip');
      if (!strip) return;
      if (!activeWheelMenus || activeWheelMenus.length === 0) {
        strip.innerHTML = '';
        return;
      }
      const maxThumbs = state.spinTraySize === 8 ? 8 : 5;
      const peekList = activeWheelMenus.slice(0, maxThumbs);
      strip.innerHTML = peekList.map((m, idx) => {
        const isActive = currentPreviewMenu && currentPreviewMenu.id === m.id;
        return `
          <button type="button" class="deck-thumb-btn ${isActive ? 'active' : ''}" onclick="previewDeckMenuByIndex(${idx})" title="${escapeHtml(m.name)}">
            <img src="${m.image_url}" alt="${escapeHtml(m.name)}" loading="lazy" onerror="resolveWikiImage(this, '${m.id}')" />
          </button>
        `;
      }).join('');
    }

    function previewDeckMenuByIndex(idx) {
      if (isSpinning) return;
      const m = activeWheelMenus[idx];
      if (!m) return;
      playTickSound();
      renderPhotoDeckPreview(m);
      renderPhotoDeckStrip();
    }

    function openCurrentPreviewMenu() {
      if (isSpinning || !currentPreviewMenu) return;
      openMenuResult(currentPreviewMenu);
    }

    function setWheelMode(mode) {
      if (mode === 'sweet') mode = 'dessert';
      currentMode = mode;
      const btnMain = document.getElementById('btnModeMain');
      const btnPass = document.getElementById('btnModePassport');
      const btnDessert = document.getElementById('btnModeDessert');
      const btnDrink = document.getElementById('btnModeDrink');
      const btnFridge = document.getElementById('btnModeFridge');
      const spinBtn = document.getElementById('spinBtn');
      const passStrip = document.getElementById('passportStrip');
      const wheelArea = document.getElementById('wheelModeArea');
      const fridgeArea = document.getElementById('fridgeModeArea');

      if (btnMain) btnMain.className = 'mode-btn' + (mode === 'main' ? ' active' : '');
      if (btnPass) btnPass.className = 'mode-btn' + (mode === 'passport' ? ' passport-active' : '');
      if (btnDessert) btnDessert.className = 'mode-btn' + (mode === 'dessert' ? ' active' : '');
      if (btnDrink) btnDrink.className = 'mode-btn' + (mode === 'drink' ? ' drink-active' : '');
      if (btnFridge) btnFridge.className = 'mode-btn' + (mode === 'fridge' ? ' fridge-active' : '');

      // เมื่อเปลี่ยนไปโหมดของหวาน/เครื่องดื่ม ให้สลับออกจาก exoticOnly อัตโนมัติเพื่อไม่ให้ติด 0 รายการ
      if ((mode === 'dessert' || mode === 'drink') && exoticOnly) {
        exoticOnly = false;
      }

      const filterToggleBtn = document.getElementById('homeFilterToggleBtn');
      const activeBar = document.getElementById('homeActiveFiltersBar');

      if (mode === 'fridge') {
        wheelArea.style.display = 'none';
        passStrip.classList.remove('show');
        fridgeArea.classList.add('show');
        if (filterToggleBtn) filterToggleBtn.style.display = 'none';
        if (activeBar) activeBar.style.display = 'none';
        updateExoticUI();
        toggleHomeFilterDrawer(false);
        return;
      }

      wheelArea.style.display = 'block';
      fridgeArea.classList.remove('show');
      if (filterToggleBtn) filterToggleBtn.style.display = 'inline-flex';

      if (mode === 'passport') {
        passStrip.classList.add('show');
      } else {
        passStrip.classList.remove('show');
      }

      updateSpinBtnTheme();
      updateExoticUI();
      prepareWheelSlices();
    }

    function updateSpinBtnTheme() {
      const spinBtn = document.getElementById('spinBtn');
      if (!spinBtn) return;
      if (state.exoticMode && exoticOnly && state.spinSource === 'all' && (currentMode === 'main' || currentMode === 'passport')) {
        spinBtn.className = 'spin-cta exotic-cta';
      } else if (currentMode === 'passport' && state.spinSource === 'all') {
        spinBtn.className = 'spin-cta passport-btn';
      } else if (currentMode === 'drink' && state.spinSource === 'all') {
        spinBtn.className = 'spin-cta drink-cta';
      } else {
        spinBtn.className = 'spin-cta';
      }
      if (!isSpinning) spinBtn.textContent = getSpinCtaLabel();
    }

    // --- FRIDGE-TO-TABLE ENGINE ("เมนู-ตู้เย็น") + CREATIVITY SCORE ---
    function appendFridgeIng(word) {
      const inp = document.getElementById('fridgeInput');
      const cur = inp.value.trim();
      if (!cur) {
        inp.value = word;
      } else if (!cur.includes(word)) {
        inp.value = cur + ' - ' + word;
      }
      inp.focus();
    }

    function cookFromFridge() {
      const raw = document.getElementById('fridgeInput').value.trim();
      clearFieldError('fridgeInput', 'fridgeError');
      if (!raw) {
        setFieldError('fridgeInput', 'fridgeError', 'กรุณาพิมพ์วัตถุดิบอย่างน้อย 1 อย่าง เช่น ไก่ - แตงกวา - พริก');
        return;
      }
      const tokens = raw.split(/[-,\s/]+/).map(s => s.trim().toLowerCase()).filter(s => s.length >= 1);
      if (tokens.length === 0) return;

      playWinChime();

      const proteins = ['ไก่', 'ปีกไก่', 'หมูสับ', 'หมูกรอบ', 'หมูสามชั้น', 'หมู', 'เนื้อ', 'กุ้ง', 'ปลาหมึก', 'ปลากะพง', 'ปลาทู', 'ปลากระป๋อง', 'ปลา', 'ปู', 'ไข่', 'เต้าหู้'];
      const veggies = ['แตงกวา', 'มะระ', 'ผักบุ้ง', 'คะน้า', 'กะหล่ำปลี', 'ผักรวม', 'หน่อไม้', 'สะตอ', 'ใบเหลียง', 'ฟักทอง', 'เห็ด', 'แครอท'];
      const spices = ['พริก', 'กระเทียม', 'ขิง', 'ขมิ้น', 'กิมจิ', 'มะนาว'];

      const foundProt = tokens.filter(t => proteins.some(p => t.includes(p) || p.includes(t)));
      const foundVeg = tokens.filter(t => veggies.some(v => t.includes(v) || v.includes(t)));
      const foundSpice = tokens.filter(t => spices.some(s => t.includes(s) || s.includes(t)));

      let creativityScore = Math.min(100, 45 + (tokens.length * 14) + (foundProt.length > 0 && foundVeg.length > 0 ? 15 : 0) + (foundSpice.length > 0 ? 10 : 0));
      let creativeTitle = '';
      let creativeDesc = '';
      let creativeBadge = creativityScore >= 85 ? '🏆 เชฟสร้างสรรค์ระดับเทพ' : (creativityScore >= 70 ? '✨ ไอเดียลงตัวสุดๆ' : '👍 จับคู่ง่ายประหยัดงบ');

      if (foundProt.length > 0 && foundVeg.length > 0) {
        const pName = foundProt[0];
        const vName = foundVeg[0];
        const hasChili = foundSpice.some(s => s.includes('พริก'));
        creativeTitle = `${pName}ทอดกระเทียม กินคู่${hasChili ? 'พริกน้ำปลา' : 'น้ำจิ้มรสเด็ด'} แกล้มด้วย${vName}สด (หรือผัด${pName}ใส่${vName})`;
        creativeDesc = `แยกทำ 2 สไตล์ได้ทันที: นำ "${pName}" มาทอดหรือรวนให้หอม เสิร์ฟแกล้มกับ "${vName}" แช่เย็นกรอบๆ ${hasChili ? 'พร้อมซอยพริกคลุกน้ำปลาบีบมะนาว' : ''} หรือโยนทุกอย่างลงผัดรวมในกระทะเดียวจบใน 10 นาที!`;
      } else if (foundProt.length >= 2) {
        creativeTitle = `ผัดรวมมิตร${foundProt.join(' + ')}ทรงเครื่อง`;
        creativeDesc = `นำ ${foundProt.join(' และ ')} มาผัดรวมกับกระเทียม ซอสหอยนางรม และพริกไทยป่น ได้จานโปรตีนแน่นเต็มอิ่ม!`;
      } else {
        creativeTitle = `สำรับประยุกต์จาก "${tokens.join(' + ')}"`;
        creativeDesc = `นำวัตถุดิบทั้งหมดมาผัดไฟแรงปรุงรสด้วยน้ำปลา ซอสหอยนางรม และพริกกระเทียม กินคู่ข้าวสวยร้อนๆ ประหยัดงบ 0 บาท!`;
      }

      if (state.halalMode && !detectIsHalalText(raw)) {
        setFieldError('fridgeInput', 'fridgeError', 'โหมดฮาลาลเปิดอยู่ ☪️ กรุณาหลีกเลี่ยงวัตถุดิบที่ไม่ฮาลาล หรือปิดโหมดฮาลาลด้านบนก่อนครับ');
        return;
      }

      const fridgePool = getAvailableMenus();
      const scoredMenus = fridgePool.map(m => {
        const hay = (m.name + ' ' + (m.ingredients || []).join(' ') + ' ' + m.recipe_hint).toLowerCase();
        const matched = tokens.filter(t => hay.includes(t));
        return { menu: m, matchCount: matched.length, matchedTokens: matched };
      }).filter(x => x.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount || a.menu.budget - b.menu.budget)
        .slice(0, 6);

      window._latestFridgeDishName = creativeTitle;
      window._latestFridgeLogged = false;

      let htmlOut = `
        <div class="fridge-result-item" style="border-left-color: #D97706; background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
            <span class="creativity-badge">🎨 คะแนนเมนูสร้างสรรค์: ${creativityScore}/100</span>
            <span style="font-size:12px; font-weight:700; color:#B45309;">${creativeBadge}</span>
          </div>
          <div style="font-size: 18px; font-weight: 700; color: var(--text-brown); line-height: 1.35; margin-bottom: 6px;">
            👨‍🍳 ${escapeHtml(creativeTitle)}
          </div>
          <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;">
            ${escapeHtml(creativeDesc)}
          </div>
          <div class="field-group" style="margin-bottom:10px;">
            <label for="fridgeExtraCostInput" class="field-label" style="color:#92400E;">ค่าของซื้อเพิ่ม (บาท) — ว่างไว้ = 0฿ ประหยัดจากตู้เย็น</label>
            <input type="text" id="fridgeExtraCostInput" class="v10-input tabular-nums" inputmode="numeric" placeholder="0" aria-describedby="fridgeCostError" oninput="clearFieldError('fridgeExtraCostInput','fridgeCostError'); document.getElementById('fridgeCostReassurance')?.classList.remove('show');" />
            <div id="fridgeCostError" class="field-error" role="alert"></div>
            <div id="fridgeCostReassurance" class="reassurance-note" role="status"></div>
          </div>
          <button type="button" id="fridgeClaimBtn" onclick="claimFridgeBonus()" class="btn-action btn-orange" style="width:100%; min-height:46px; font-size:15px;">
            ✅ ทำเมนูนี้ & บันทึกประวัติ/งบ (+35 XP)
          </button>
          <div id="fridgeLoggedActions" class="fridge-logged-bar" style="display:none;">
            <span>✓ บันทึกเข้าประวัติและกระเป๋าคุมงบแล้ว</span>
            <button type="button" onclick="switchTab('saved'); switchSavedSubTab('wallet');" class="fridge-wallet-link">ดูในกระเป๋างบ →</button>
          </div>
          <button type="button" onclick="openQrModal()" style="width:100%; margin-top:8px; min-height:40px; border-radius:999px; border:1px solid #E5D5C3; background:#FFFFFF; color:var(--text-brown); font-size:13px; font-weight:600; cursor:pointer;">
            เลี้ยงกาแฟผู้พัฒนา ☕
          </button>
        </div>
      `;

      if (scoredMenus.length > 0) {
        htmlOut += `<div style="font-weight:700; font-size:16px; margin: 14px 4px 4px; color: var(--text-brown);">🍲 เมนูตรงสเปก${state.halalMode ? ' (ฮาลาล ☪️)' : ''} ในคลัง ${fridgePool.length} รายการ (${scoredMenus.length} เมนู):</div>`;
        htmlOut += scoredMenus.map(item => {
          const m = item.menu;
          const pct = Math.round((item.matchCount / tokens.length) * 100);
          return `
            <div class="fridge-result-item" onclick="openMenuById('${m.id}')" style="cursor:pointer;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${m.image_url}" alt="${escapeHtml(m.name)}" style="width:68px; height:68px; border-radius:14px; object-fit:cover; flex-shrink:0;" onerror="resolveWikiImage(this, '${m.id}')" />
                <div style="flex:1; min-width:0;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                    <span style="font-size:11px; font-weight:700; background:#CCFBF1; color:#0F766E; padding:2px 8px; border-radius:999px;">ตรง ${item.matchCount}/${tokens.length} อย่าง (${pct}%)</span>
                    <span class="tabular-nums" style="font-size:12px; color:var(--text-muted); font-weight:600;">⏱️ ${m.prep_time} น.</span>
                  </div>
                  <div style="font-size:16px; font-weight:700; margin-top:4px; color:var(--text-brown);">${escapeHtml(m.name)}</div>
                  <div style="font-size:12px; color:#0D9488; font-weight:600;">มีแล้ว: ${escapeHtml(item.matchedTokens.join(', '))}</div>
                </div>
              </div>
              <div style="display:flex; justify-content:flex-end; margin-top:10px; padding-top:8px; border-top:1px dashed #CCFBF1;">
                <button type="button" class="fridge-quick-eat-btn" onclick="event.stopPropagation(); eatMatchedFridgeMenu('${m.id}', this)">
                  ✅ ทำกินเคลียร์ตู้เย็น (0฿ • +35 XP)
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      document.getElementById('fridgeResultsBox').innerHTML = htmlOut;
    }

    function claimFridgeBonus() {
      if (window._latestFridgeLogged) return;
      const dishName = window._latestFridgeDishName || 'เมนูเคลียร์ตู้เย็น';
      const costInp = document.getElementById('fridgeExtraCostInput');
      const reassEl = document.getElementById('fridgeCostReassurance');
      const rawCost = costInp ? costInp.value.replace(/,/g, '').trim() : '';

      clearFieldError('fridgeExtraCostInput', 'fridgeCostError');
      if (reassEl) reassEl.classList.remove('show');

      let extraCost = 0;
      if (rawCost !== '') {
        extraCost = parseFloat(rawCost);
        if (isNaN(extraCost) || extraCost < 0) {
          setFieldError('fridgeExtraCostInput', 'fridgeCostError', 'กรุณากรอกเป็นตัวเลขตั้งแต่ 0 บาทขึ้นไป หรือเว้นว่างไว้');
          if (reassEl) {
            reassEl.textContent = 'ℹ️ ยังไม่มีการบันทึกยอดใดๆ • งบค่ากินของคุณยังคงเดิม';
            reassEl.classList.add('show');
          }
          return;
        }
      }

      window._latestFridgeLogged = true;
      recordEatenMeal({
        menuId: null,
        name: `🧊 ${dishName}`,
        amount: extraCost,
        xp: 35,
        source: 'fridge'
      });

      const btn = document.getElementById('fridgeClaimBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = extraCost > 0
          ? `✓ บันทึกแล้ว (-${extraCost.toLocaleString()}฿ • +35 XP)`
          : '✓ บันทึกแล้ว (ประหยัดงบ 0฿ • +35 XP)';
      }
      if (costInp) costInp.disabled = true;
      const loggedBar = document.getElementById('fridgeLoggedActions');
      if (loggedBar) loggedBar.style.display = 'flex';

      playWinChime();
      const costText = extraCost > 0 ? `-${extraCost.toLocaleString()}฿` : '0฿ ประหยัดสุดๆ';
      showToast(`บันทึก "${dishName.slice(0, 20)}..." (${costText}) +35 XP 🧊`);
    }

    function eatMatchedFridgeMenu(menuId, btnEl) {
      if (btnEl && btnEl.disabled) return;
      const menu = MENUS.find(m => m.id === menuId);
      if (!menu) return;

      recordEatenMeal({
        menuId: menu.id,
        name: menu.name,
        amount: 0,
        xp: 35,
        source: 'fridge'
      });

      if (btnEl) {
        btnEl.disabled = true;
        btnEl.classList.add('logged');
        btnEl.textContent = '✓ บันทึกเข้าประวัติ & งบ (0฿) แล้ว';
      }
      playWinChime();
      showToast(`บันทึก "${menu.name}" จากตู้เย็น (0฿) +35 XP 🧊`);
    }

    const MOOD_LABELS = {
      clean: '🥗 สายคลีน',
      veg: '🥬 มังสวิรัติ',
      street: '🍢 สตรีทฟู้ด',
      soup: '🍲 ซดน้ำร้อนๆ',
      crispy: '🍗 ของทอดกรอบ',
      noodle: '🍜 เมนูเส้น'
    };

    const QUICK_LABELS = {
      budget50: '💰 ≤50฿',
      fast15: '⚡ ≤15 นาที',
      spicy: '🌶️ รสจัดจ้าน',
      nonspicy: '🌿 ไม่เผ็ด'
    };

    function toggleHalalMode() {
      state.halalMode = !state.halalMode;
      saveState();
      updateHalalUI();
      updateExoticUI();
      updateSpinSourceUI();
      initApp();
      renderWeeklyPlan();
      const fridgeBox = document.getElementById('fridgeResultsBox');
      if (fridgeBox && fridgeBox.innerHTML.trim() && document.getElementById('fridgeInput')?.value.trim()) {
        cookFromFridge();
      }
      const availCount = getAvailableMenus().length;
      showToast(state.halalMode
        ? `เปิดโหมดฮาลาลแล้ว ☪️ (แสดงเฉพาะเมนูฮาลาล ${availCount} รายการ)`
        : `ปิดโหมดฮาลาลแล้ว (แสดงเมนูทั้งหมด ${availCount} รายการ)`);
    }

    function updateHalalUI() {
      const isOn = Boolean(state.halalMode);
      const btns = [
        { btn: document.getElementById('homeHalalBtn'), stateEl: document.getElementById('homeHalalState') },
        { btn: document.getElementById('exploreHalalBtn'), stateEl: document.getElementById('exploreHalalState') }
      ];
      btns.forEach(({ btn, stateEl }) => {
        if (btn) {
          btn.classList.toggle('active', isOn);
          btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        }
        if (stateEl) stateEl.textContent = isOn ? 'เปิด' : 'ปิด';
      });

      updateExploreBannerText();

      const porkChip = document.getElementById('fridgePorkChip');
      if (porkChip) {
        porkChip.textContent = isOn ? '+ เนื้อ' : '+ หมูสับ';
      }
      const fridgeInp = document.getElementById('fridgeInput');
      if (fridgeInp) {
        fridgeInp.placeholder = isOn
          ? 'เช่น แตงกวา - ไก่ - พริก หรือ ไข่ เนื้อวัว'
          : 'เช่น แตงกวา - ไก่ - พริก หรือ ไข่ หมูสับ';
      }
    }

    function updateExploreBannerText() {
      const subBanner = document.getElementById('exploreSubBanner');
      if (!subBanner) return;
      if (state.halalMode && state.exoticMode) {
        subBanner.textContent = '☪️ ฮาลาล + 🦂 เมนูแปลกเปิดอยู่ — แสดงเฉพาะเมนูฮาลาลรวมเมนูแปลกฮาลาล';
      } else if (state.halalMode) {
        subBanner.textContent = '☪️ โหมดฮาลาลเปิดอยู่ — ซ่อนเมนูหมู แอลกอฮอล์ ไส้กรอก และปลาร้าอัตโนมัติ';
      } else if (state.exoticMode) {
        subBanner.textContent = '🦂 โหมดเมนูแปลกเปิดอยู่ — รวมเมนูแปลกไทยและทั่วโลกครบทุกระดับความโหด';
      } else {
        subBanner.textContent = 'พร้อมรูปภาพอาหารจริง ครบ 4 ภาค • นานาชาติ • ของหวาน & เครื่องดื่ม (ซ่อนเมนูแปลกไว้)';
      }
    }

    function toggleExoticMode() {
      state.exoticMode = !state.exoticMode;
      if (state.exoticMode) {
        exoticOnly = (currentMode === 'main' || currentMode === 'passport');
        exoticLevelFilter = 'all';
      } else {
        exoticOnly = false;
        exoticLevelFilter = 'all';
        if (exploreSpecialty === 'เมนูแปลก') {
          exploreSpecialty = 'all';
          document.querySelectorAll('#exploreSpecialties .mood-pill').forEach(b => {
            b.classList.toggle('active', b.dataset.spec === 'all');
          });
        }
      }
      saveState();
      updateExoticUI();
      initApp();
      const exCount = getAvailableMenus({ allowExotic: true }).filter(isMenuExotic).length;
      showToast(state.exoticMode
        ? `เปิดโหมดเมนูแปลกแล้ว 🦂 (พร้อมท้าลอง ${exCount} เมนู • กินจริงรับ +50 XP!)`
        : 'ปิดโหมดเมนูแปลกแล้ว (ซ่อนเมนูแปลกออกจากระบบเรียบร้อย)');
    }

    function updateExoticUI() {
      const isOn = Boolean(state.exoticMode);
      const btns = [
        { btn: document.getElementById('homeExoticBtn'), stateEl: document.getElementById('homeExoticState') },
        { btn: document.getElementById('exploreExoticBtn'), stateEl: document.getElementById('exploreExoticState') }
      ];
      btns.forEach(({ btn, stateEl }) => {
        if (btn) {
          btn.classList.toggle('active', isOn);
          btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        }
        if (stateEl) stateEl.textContent = isOn ? 'เปิด' : 'ปิด';
      });

      const strip = document.getElementById('exoticStrip');
      if (strip) {
        strip.classList.toggle('show', isOn && currentMode !== 'fridge');
      }
      const availExoticCnt = getAvailableMenus({ allowExotic: true }).filter(isMenuExotic).length;
      const cntEl = document.getElementById('exoticAvailCount');
      if (cntEl) cntEl.textContent = String(availExoticCnt);

      const btnOnly = document.getElementById('btnExoticOnly');
      const btnMix = document.getElementById('btnExoticMix');
      if (btnOnly) btnOnly.classList.toggle('active', exoticOnly);
      if (btnMix) btnMix.classList.toggle('active', !exoticOnly);

      document.querySelectorAll('#exoticStrip .exotic-lvl-chip').forEach(b => {
        b.classList.toggle('active', String(b.dataset.level) === String(exoticLevelFilter));
      });

      const specBtn = document.getElementById('exploreExoticSpecBtn');
      if (specBtn) specBtn.style.display = isOn ? 'inline-block' : 'none';

      updateExploreBannerText();
      updateSpinBtnTheme();
    }

    function setExoticScope(onlyExotic) {
      exoticOnly = Boolean(onlyExotic);
      if (exoticOnly && (currentMode === 'dessert' || currentMode === 'drink' || currentMode === 'fridge')) {
        setWheelMode('main');
      }
      if (exoticOnly && state.spinSource !== 'all') {
        state.spinSource = 'all';
        saveState();
      }
      updateExoticUI();
      prepareWheelSlices();
    }

    function setExoticLevel(level, btn) {
      exoticLevelFilter = level;
      if (level !== 'all') {
        exoticOnly = true;
        if (currentMode === 'dessert' || currentMode === 'drink' || currentMode === 'fridge') {
          setWheelMode('main');
        }
      }
      document.querySelectorAll('#exoticStrip .exotic-lvl-chip').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      updateExoticUI();
      prepareWheelSlices();
    }

    // --- SPIN SOURCE & CURATED TRAY (5 / 8 ITEMS) ---
    function setSpinSource(source) {
      if (source === 'favorites') {
        const availFavs = getAvailableMenus().filter(m => state.favorites.includes(m.id));
        if (state.favorites.length === 0) {
          showToast('ยังไม่มีเมนูโปรด ลองจิ้มคัดเมนูใส่ถาดสุ่มเองได้เลยครับ 🎯');
          openTrayBuilderModal();
          return;
        }
        if (availFavs.length === 0) {
          showToast('เมนูโปรดทั้งหมดถูกซ่อนตามโหมดฮาลาล/เมนูแปลก ลองคัดเมนูใส่ถาดเพิ่มครับ');
          openTrayBuilderModal();
          return;
        }
      }
      if (source === 'custom') {
        const availCustom = getAvailableMenus().filter(m => state.customSpinIds.includes(m.id));
        if (availCustom.length < 2) {
          openTrayBuilderModal();
          return;
        }
      }
      state.spinSource = source;
      saveState();
      updateSpinSourceUI();
      prepareWheelSlices();
    }

    function setSpinTraySize(size) {
      state.spinTraySize = size === 8 ? 8 : 5;
      saveState();
      updateSpinSourceUI();
      prepareWheelSlices();
    }

    function toggleFavAutoFill(checked) {
      state.favAutoFill = Boolean(checked);
      saveState();
      prepareWheelSlices();
    }

    function updateSpinSourceUI() {
      const availIds = new Set(getAvailableMenus().map(m => m.id));
      const availFavCount = state.favorites.filter(id => availIds.has(id)).length;
      const availCustomCount = state.customSpinIds.filter(id => availIds.has(id)).length;

      const favCntEl = document.getElementById('drawerFavCount');
      const cusCntEl = document.getElementById('drawerCustomCount');
      if (favCntEl) favCntEl.textContent = String(availFavCount);
      if (cusCntEl) cusCntEl.textContent = String(availCustomCount);

      document.querySelectorAll('#spinSourceGroup .drawer-chip').forEach(b => {
        b.classList.toggle('active', b.dataset.source === state.spinSource);
      });
      document.querySelectorAll('#traySizeGroup .tray-size-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.size) === state.spinTraySize);
      });

      const autoWrap = document.getElementById('favAutoFillWrap');
      const autoCheck = document.getElementById('favAutoFillCheck');
      const autoTarget = document.getElementById('favAutoFillTarget');
      if (autoWrap) autoWrap.style.display = state.spinSource === 'favorites' ? 'flex' : 'none';
      if (autoCheck) autoCheck.checked = Boolean(state.favAutoFill);
      if (autoTarget) autoTarget.textContent = String(state.spinTraySize);
    }

    function spinFavoritesNow() {
      if (state.favorites.length === 0) {
        showToast('ยังไม่มีเมนูโปรดครับ มาจิ้มคัดเมนูใส่ถาดสุ่มกันเลย 🎯');
        switchTab('home');
        openTrayBuilderModal();
        return;
      }
      const availFavs = getAvailableMenus().filter(m => state.favorites.includes(m.id));
      if (availFavs.length === 0) {
        showToast('เมนูโปรดทั้งหมดถูกซ่อนตามโหมดฮาลาล/เมนูแปลก ลองเปิดโหมดหรือคัดถาดใหม่ครับ');
        return;
      }
      state.spinSource = 'favorites';
      saveState();
      switchTab('home');
      if (currentMode === 'fridge') setWheelMode('main');
      updateSpinSourceUI();
      prepareWheelSlices();
      showToast(`ดึงเมนูโปรด ${availFavs.length} รายการเข้ากองสุ่มแล้ว ❤️`);
    }

    function toggleHomeFilterDrawer(forceState) {
      const drawer = document.getElementById('homeFilterDrawer');
      const btn = document.getElementById('homeFilterToggleBtn');
      const caret = document.getElementById('homeFilterCaret');
      if (!drawer || !btn) return;
      isHomeFilterDrawerOpen = typeof forceState === 'boolean' ? forceState : !isHomeFilterDrawerOpen;
      drawer.classList.toggle('open', isHomeFilterDrawerOpen);
      drawer.setAttribute('aria-hidden', isHomeFilterDrawerOpen ? 'false' : 'true');
      btn.classList.toggle('open', isHomeFilterDrawerOpen);
      btn.setAttribute('aria-expanded', isHomeFilterDrawerOpen ? 'true' : 'false');
      if (caret) caret.textContent = isHomeFilterDrawerOpen ? '▴' : '▾';
      if (isHomeFilterDrawerOpen) updateSpinSourceUI();
    }

    function removeSingleHomeFilter(type) {
      if (type === 'mood') {
        moodFilter = 'all';
        document.querySelectorAll('#moodBar .mood-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.mood === 'all');
        });
      } else if (type === 'quick') {
        quickFilter = 'all';
        document.querySelectorAll('#quickFilters .chip-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.filter === 'all');
        });
      } else if (type === 'source') {
        state.spinSource = 'all';
        saveState();
        updateSpinSourceUI();
      } else if (type === 'exoticLevel') {
        exoticLevelFilter = 'all';
        updateExoticUI();
      }
      prepareWheelSlices();
    }

    function resetHomeFilters() {
      moodFilter = 'all';
      quickFilter = 'all';
      exoticLevelFilter = 'all';
      if (state.spinSource !== 'all') {
        state.spinSource = 'all';
        saveState();
      }
      document.querySelectorAll('#moodBar .mood-pill').forEach(p => {
        p.classList.toggle('active', p.dataset.mood === 'all');
      });
      document.querySelectorAll('#quickFilters .chip-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === 'all');
      });
      updateSpinSourceUI();
      updateExoticUI();
      prepareWheelSlices();
      showToast('ล้างตัวกรองการสุ่มแล้ว ✨');
    }

    function updateHomeFilterBarUI(poolCount, hiddenNoticeCount = 0) {
      const badge = document.getElementById('homeFilterCountBadge');
      const bar = document.getElementById('homeActiveFiltersBar');
      const listEl = document.getElementById('homeActiveChipsList');
      const poolText = document.getElementById('homePoolCountText');
      const clearLink = bar ? bar.querySelector('.clear-filters-link') : null;

      let activeFilterCount = 0;
      const chips = [];

      if (state.halalMode) {
        chips.push(`<span class="active-filter-chip halal">☪️ ฮาลาล</span>`);
      }
      if (state.exoticMode) {
        const exText = exoticLevelFilter !== 'all'
          ? `🦂 เมนูแปลก ${getExoticLevelMeta(exoticLevelFilter).short}`
          : (exoticOnly ? '🦂 เฉพาะเมนูแปลก' : '🦂 รวมเมนูแปลก');
        chips.push(`<span class="active-filter-chip exotic">${exText}</span>`);
      }
      if (state.spinSource === 'favorites') {
        activeFilterCount++;
        chips.push(`<button type="button" class="active-filter-chip source" onclick="removeSingleHomeFilter('source')">❤️ เฉพาะโปรด (${state.spinTraySize}) ✕</button>`);
      } else if (state.spinSource === 'custom') {
        activeFilterCount++;
        chips.push(`<button type="button" class="active-filter-chip source" onclick="removeSingleHomeFilter('source')">🎯 ถาดคัดเอง (${poolCount}/${state.spinTraySize}) ✕</button>`);
      }
      if (moodFilter !== 'all' && MOOD_LABELS[moodFilter]) {
        activeFilterCount++;
        chips.push(`<button type="button" class="active-filter-chip" onclick="removeSingleHomeFilter('mood')">${MOOD_LABELS[moodFilter]} ✕</button>`);
      }
      if (quickFilter !== 'all' && QUICK_LABELS[quickFilter]) {
        activeFilterCount++;
        chips.push(`<button type="button" class="active-filter-chip" onclick="removeSingleHomeFilter('quick')">${QUICK_LABELS[quickFilter]} ✕</button>`);
      }
      if (hiddenNoticeCount > 0) {
        chips.push(`<span class="active-filter-chip muted">ซ่อน ${hiddenNoticeCount} เมนูตามโหมด</span>`);
      }

      if (badge) {
        badge.textContent = String(activeFilterCount);
        badge.style.display = activeFilterCount > 0 ? 'inline-flex' : 'none';
      }
      if (poolText) {
        poolText.textContent = `พร้อมสุ่ม ${poolCount} เมนู`;
      }
      if (bar && listEl) {
        if (currentMode !== 'fridge' && chips.length > 0) {
          bar.style.display = 'flex';
          listEl.innerHTML = chips.join('');
          if (clearLink) clearLink.style.display = activeFilterCount > 0 ? 'inline-block' : 'none';
        } else {
          bar.style.display = 'none';
        }
      }
    }

    function setQuickFilter(filter, btn) {
      quickFilter = filter;
      document.querySelectorAll('#quickFilters .chip-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      prepareWheelSlices();
    }

    function getBaseModePool() {
      const avail = getAvailableMenus();
      if (state.exoticMode && exoticOnly && (currentMode === 'main' || currentMode === 'passport')) {
        let exPool = avail.filter(isMenuExotic);
        if (currentMode === 'passport') {
          exPool = exPool.filter(m => m.category === 'อาหารนานาชาติ');
        }
        if (exoticLevelFilter !== 'all') {
          exPool = exPool.filter(m => Number(m.exotic_level) === Number(exoticLevelFilter));
        }
        return exPool;
      }
      if (currentMode === 'passport') {
        return avail.filter(m => m.category === 'อาหารนานาชาติ');
      }
      return avail.filter(m => m.mode === currentMode);
    }

    function getFilteredPool() {
      const excludeYest = document.getElementById('excludeYesterday')?.checked;
      let pool = getBaseModePool();

      if (quickFilter === 'budget50') pool = pool.filter(m => m.budget <= 50);
      if (quickFilter === 'fast15') pool = pool.filter(m => m.prep_time <= 15);
      if (quickFilter === 'spicy') pool = pool.filter(m => m.is_spicy);
      if (quickFilter === 'nonspicy') pool = pool.filter(m => !m.is_spicy);

      if (moodFilter === 'clean') pool = pool.filter(m => m.tags && (m.tags.includes('สายคลีน') || m.tags.includes('สุขภาพ')));
      if (moodFilter === 'veg') pool = pool.filter(m => m.protein === 'มังสวิรัติ' || (m.tags && m.tags.includes('มังสวิรัติ')));
      if (moodFilter === 'street') pool = pool.filter(m => m.tags && m.tags.includes('สตรีทฟู้ด'));
      if (moodFilter === 'soup') pool = pool.filter(m => m.tags && m.tags.includes('ต้ม'));
      if (moodFilter === 'crispy') pool = pool.filter(m => m.tags && (m.tags.includes('ทอด') || m.name.includes('กรอบ')));
      if (moodFilter === 'noodle') pool = pool.filter(m => m.tags && m.tags.includes('เส้น'));

      if (excludeYest && state.history.length > 0 && pool.length > 0) {
        const filtered = pool.filter(m => !state.history.includes(m.id));
        if (filtered.length >= 2) pool = filtered;
      }
      return pool;
    }

    function getActiveSpinContext() {
      const avail = getAvailableMenus();
      const availMap = new Map(avail.map(m => [m.id, m]));
      const trayLimit = state.spinTraySize === 8 ? 8 : 5;

      if (state.spinSource === 'custom') {
        const matched = state.customSpinIds.map(id => availMap.get(id)).filter(Boolean);
        const hiddenCount = Math.max(0, state.customSpinIds.length - matched.length);
        const tray = matched.slice(0, trayLimit);
        return { pool: tray, tray, hiddenCount, fixedTray: true };
      }

      if (state.spinSource === 'favorites') {
        const allAvailFavs = state.favorites.map(id => availMap.get(id)).filter(Boolean);
        const hiddenCount = Math.max(0, state.favorites.length - allAvailFavs.length);
        const modeFavs = currentMode === 'passport'
          ? allAvailFavs.filter(m => m.category === 'อาหารนานาชาติ')
          : allAvailFavs.filter(m => m.mode === currentMode);
        let picked = modeFavs.length > 0 ? [...modeFavs] : [...allAvailFavs];

        if (state.favAutoFill && picked.length > 0 && picked.length < trayLimit) {
          const pickedIds = new Set(picked.map(m => m.id));
          const extras = getFilteredPool().filter(m => !pickedIds.has(m.id)).sort(() => 0.5 - Math.random());
          picked = [...picked, ...extras.slice(0, trayLimit - picked.length)];
        }
        const tray = picked.length > trayLimit
          ? [...picked].sort(() => 0.5 - Math.random()).slice(0, trayLimit)
          : picked;
        return { pool: picked, tray, hiddenCount, fixedTray: true };
      }

      const pool = getFilteredPool();
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const tray = shuffled.slice(0, Math.min(trayLimit, shuffled.length));
      return { pool, tray, hiddenCount: 0, fixedTray: false };
    }

    function prepareWheelSlices() {
      updateSpinSourceUI();
      const ctx = getActiveSpinContext();
      const pool = ctx.pool;
      updateHomeFilterBarUI(pool.length, ctx.hiddenCount);

      const quickPoolEl = document.getElementById('homeQuickPoolLabel');
      if (quickPoolEl) {
        if (isMenusLoading && MENUS.length === 0) {
          quickPoolEl.textContent = 'กำลังโหลดคลังเมนู...';
        } else if (state.spinSource === 'custom') {
          quickPoolEl.textContent = `🎯 ถาดคัดเอง ${ctx.tray.length}/${state.spinTraySize} รายการ`;
        } else if (state.spinSource === 'favorites') {
          quickPoolEl.textContent = `❤️ เฉพาะเมนูโปรด ${ctx.tray.length} รายการ`;
        } else {
          const tags = [];
          if (state.halalMode) tags.push('ฮาลาล ☪️');
          if (state.exoticMode && exoticOnly && (currentMode === 'main' || currentMode === 'passport')) tags.push('แปลก 🦂');
          quickPoolEl.textContent = `พร้อมสุ่ม ${pool.length} เมนู${tags.length ? ' (' + tags.join(' • ') + ')' : ''}`;
        }
      }

      const emptyBox = document.getElementById('wheelEmptyState');
      const spinBtn = document.getElementById('spinBtn');
      const hasZeroMatches = !isMenusLoading && MENUS.length > 0 && pool.length === 0;

      if (emptyBox) emptyBox.style.display = hasZeroMatches ? 'block' : 'none';
      if (spinBtn && !isSpinning) {
        spinBtn.disabled = hasZeroMatches;
        updateSpinBtnTheme();
      }
      syncHomePickerVisibility();

      activeWheelMenus = ctx.tray;

      const cardStage = document.getElementById('photoDeckCard');
      if (cardStage) cardStage.classList.remove('winner', 'shuffling');

      drawWheel();
      renderPhotoDeckPreview(activeWheelMenus[0] || null);
      renderPhotoDeckStrip();
    }

    function drawWheel() {
      const canvas = document.getElementById('wheelCanvas');
      const ctx = canvas.getContext('2d');
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = cx - 6;
      const count = activeWheelMenus.length;
      const paletteMain = ['#C2410C', '#FFC53D', '#24442F', '#EA580C', '#F59E0B', '#2F573D', '#D97706', '#9A3412'];
      const palettePassport = ['#1D4ED8', '#FFC53D', '#0F766E', '#2563EB', '#EA580C', '#1E40AF', '#047857', '#D97706'];
      const paletteExotic = ['#7C2D12', '#F59E0B', '#4C1D95', '#B91C1C', '#D97706', '#581C87', '#9A3412', '#3B0764'];
      const colors = (state.exoticMode && exoticOnly && state.spinSource === 'all' && (currentMode === 'main' || currentMode === 'passport'))
        ? paletteExotic
        : (currentMode === 'passport' ? palettePassport : paletteMain);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (count === 0) {
        const placeholderArc = (2 * Math.PI) / 8;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, i * placeholderArc - Math.PI / 2, (i + 1) * placeholderArc - Math.PI / 2);
          ctx.closePath();
          ctx.fillStyle = i % 2 === 0 ? '#EFE6D8' : '#F8F1E5';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#FFFAF3';
          ctx.stroke();
        }
        ctx.fillStyle = '#786458';
        ctx.font = 'bold 22px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isMenusLoading ? 'กำลังโหลดเมนู...' : 'ไม่พบเมนูที่ตรงตัวกรอง', cx, cy - 64);
        return;
      }

      const arc = (2 * Math.PI) / count;

      activeWheelMenus.forEach((item, i) => {
        const startAngle = i * arc - Math.PI / 2;
        const endAngle = startAngle + arc;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFAF3';
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = (colors[i % colors.length] === '#FFC53D') ? '#3A2B22' : '#FFFFFF';
        ctx.font = 'bold 20px "Prompt", sans-serif';
        const countryObj = COUNTRIES.find(c => c.name === item.region);
        const prefix = (currentMode === 'passport' && countryObj) ? countryObj.flag + ' ' : '';
        const rawText = prefix + item.name;
        const label = rawText.length > 13 ? rawText.slice(0, 12) + '…' : rawText;
        ctx.fillText(label, radius - 24, 8);
        ctx.restore();
      });
    }

    function finishSpinWithWinner(wonMenu) {
      const spinBtn = document.getElementById('spinBtn');
      isSpinning = false;
      if (spinBtn) {
        spinBtn.disabled = false;
        spinBtn.textContent = getSpinCtaLabel();
      }
      playWinChime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 100]);

      if (wonMenu.category === 'อาหารนานาชาติ' && !state.stamps.includes(wonMenu.region)) {
        state.stamps.push(wonMenu.region);
        showToast(`🛂 ปลดล็อกตราประทับประเทศ "${wonMenu.region}"!`);
      }
      addXp(15);
      openMenuResult(wonMenu);
    }

    function runPhotoCardShuffle(pool) {
      const spinBtn = document.getElementById('spinBtn');
      const cardEl = document.getElementById('photoDeckCard');
      const winMenu = pool[Math.floor(Math.random() * pool.length)];

      // Build decelerating shuffle sequence ending on winMenu
      const steps = Math.min(15, Math.max(9, pool.length + 5));
      const seq = [];
      for (let i = 0; i < steps - 1; i++) {
        seq.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      seq.push(winMenu);

      if (cardEl) {
        cardEl.classList.remove('winner');
        cardEl.classList.add('shuffling');
      }

      let idx = 0;
      function nextTick() {
        const item = seq[idx];
        renderPhotoDeckPreview(item);
        playTickSound();
        if (cardEl) {
          cardEl.classList.remove('pop');
          void cardEl.offsetWidth;
          cardEl.classList.add('pop');
        }
        idx++;
        if (idx < seq.length) {
          const progress = idx / seq.length;
          const delay = Math.round(65 + Math.pow(progress, 2.3) * 230);
          setTimeout(nextTick, delay);
        } else {
          if (cardEl) {
            cardEl.classList.remove('shuffling', 'pop');
            cardEl.classList.add('winner');
          }
          const maxThumbs = state.spinTraySize === 8 ? 8 : 5;
          if (!activeWheelMenus.slice(0, maxThumbs).some(m => m.id === winMenu.id)) {
            activeWheelMenus = [winMenu, ...activeWheelMenus.filter(m => m.id !== winMenu.id)].slice(0, maxThumbs);
          }
          renderPhotoDeckStrip();
          setTimeout(() => {
            finishSpinWithWinner(winMenu);
          }, 420);
        }
      }
      nextTick();
    }

    function spinWheel() {
      if (isSpinning) return;
      const spinCtx = getActiveSpinContext();
      const pool = spinCtx.pool;
      if (pool.length === 0) {
        prepareWheelSlices();
        showToast(isMenusLoading ? 'กำลังโหลดรายการเมนู กรุณารอสักครู่...' : 'ไม่พบเมนูในหมวดนี้ ลองล้างตัวกรองก่อนครับ');
        return;
      }

      getAudioCtx();
      isSpinning = true;

      const spinBtn = document.getElementById('spinBtn');
      if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.textContent = (state.exoticMode && exoticOnly && state.spinSource === 'all')
          ? '🦂 กำลังสุ่มความท้าทาย...'
          : (currentMode === 'passport' ? '✈️ กำลังบินข้ามประเทศ...' : '🎲 กำลังสุ่มความอร่อย...');
      }
      if (navigator.vibrate) navigator.vibrate(40);

      // Photo-First Card Deck mode
      if (state.homePickerStyle !== 'wheel') {
        activeWheelMenus = spinCtx.tray;
        runPhotoCardShuffle(spinCtx.fixedTray ? spinCtx.tray : pool);
        return;
      }

      // Classic Wheel mode
      prepareWheelSlices();
      const pointer = document.getElementById('wheelPointer');
      const canvas = document.getElementById('wheelCanvas');
      const count = activeWheelMenus.length;
      const winIndex = Math.floor(Math.random() * count);
      const sliceDeg = 360 / count;
      const targetAngle = 360 - (winIndex * sliceDeg + sliceDeg / 2);
      const extraSpins = 360 * 6;
      const startRot = currentRotation;
      const endRot = currentRotation + extraSpins + ((targetAngle - (currentRotation % 360) + 360) % 360);

      const duration = 3800;
      const startTime = performance.now();
      let lastSlicePassed = Math.floor(startRot / sliceDeg);

      function animateSpin(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 4);
        currentRotation = startRot + (endRot - startRot) * ease;
        canvas.style.transform = `rotate(${currentRotation}deg)`;

        const currentSlice = Math.floor(currentRotation / sliceDeg);
        if (currentSlice !== lastSlicePassed) {
          lastSlicePassed = currentSlice;
          playTickSound();
          if (pointer) {
            pointer.classList.add('tick');
            setTimeout(() => pointer.classList.remove('tick'), 55);
          }
        }

        if (t < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          const wonMenu = activeWheelMenus[winIndex];
          finishSpinWithWinner(wonMenu);
        }
      }

      requestAnimationFrame(animateSpin);
    }

    function openMenuResult(menu) {
      selectedMenu = menu;
      const pairMain = resolveMenuPair(menu, 'main');
      const pairSweet = resolveMenuPair(menu, 'sweet');
      const countryObj = COUNTRIES.find(c => c.name === menu.region);
      const regionLabel = countryObj ? `${countryObj.flag} ${menu.region}` : menu.region;

      document.getElementById('resCategory').textContent = `${menu.category} • ${regionLabel}`;
      const heroImg = document.getElementById('resImage');
      heroImg.style.display = 'block';
      heroImg.dataset.triedWiki = '0';
      heroImg.src = menu.image_url || '';

      document.getElementById('resName').textContent = menu.name;
      document.getElementById('resBudget').textContent = menu.budget;
      document.getElementById('resTime').textContent = menu.prep_time;

      const resExoticEl = document.getElementById('resExoticBadge');
      const ateBtn = document.getElementById('confirmAteBtn');
      if (isMenuExotic(menu)) {
        const meta = getExoticLevelMeta(menu.exotic_level);
        if (resExoticEl) {
          resExoticEl.textContent = meta.text;
          resExoticEl.style.display = 'inline-flex';
        }
        if (ateBtn) ateBtn.textContent = '🔥 ใจถึง! กินจริง (+50 XP)';
      } else {
        if (resExoticEl) resExoticEl.style.display = 'none';
        if (ateBtn) ateBtn.textContent = '✅ กินเมนูนี้ (+25 XP)';
      }

      const pmImg = document.getElementById('resPairMainImg'); pmImg.style.display='block'; pmImg.dataset.triedWiki='0'; pmImg.dataset.mid=pairMain.id; pmImg.src = pairMain.image_url || '';
      document.getElementById('resPairMain').textContent = `${pairMain.name} (~${pairMain.budget}฿)`;

      const psImg = document.getElementById('resPairSweetImg'); psImg.style.display='block'; psImg.dataset.triedWiki='0'; psImg.dataset.mid=pairSweet.id; psImg.src = pairSweet.image_url || '';
      document.getElementById('resPairSweet').textContent = `${pairSweet.name} (~${pairSweet.budget}฿)`;

      document.getElementById('resRecipe').textContent = menu.recipe_hint;
      document.getElementById('mapsLink').href = `https://www.google.com/maps/search/${encodeURIComponent(menu.name + ' ใกล้ฉัน')}`;

      // Hide previous share preview box when opening new result
      document.getElementById('sharePreviewBox').classList.remove('open');

      const isFav = state.favorites.includes(menu.id);
      document.getElementById('resFavBtn').textContent = isFav ? '❤️ บันทึกแล้ว' : '🤍 บันทึกโปรด';

      document.getElementById('resultModal').classList.add('open');
    }

    function closeResultModal() {
      document.getElementById('resultModal').classList.remove('open');
    }

    function closeModal(e) {
      if (e.target.id === 'resultModal') closeResultModal();
    }

    function confirmAteMeal() {
      if (!selectedMenu) return;
      const dishName = selectedMenu.name;
      const dishBudget = Number(selectedMenu.budget) || 50;
      const isEx = isMenuExotic(selectedMenu);
      const rewardXp = isEx ? 50 : 25;
      if (isEx) {
        state.exoticEatenCount = (Number(state.exoticEatenCount) || 0) + 1;
      }
      recordEatenMeal({
        menuId: selectedMenu.id,
        name: dishName,
        amount: dishBudget,
        xp: rewardXp,
        source: 'wheel'
      });
      closeResultModal();
      showToast(isEx
        ? `🔥 ใจถึงมาก! พิชิตเมนูแปลก "${dishName}" (+50 XP)`
        : `บันทึก "${dishName}" (~${dishBudget.toLocaleString()}฿) +25 XP`);
    }

    function toggleFavoriteCurrent() {
      if (!selectedMenu) return;
      const idx = state.favorites.indexOf(selectedMenu.id);
      if (idx >= 0) {
        state.favorites.splice(idx, 1);
        document.getElementById('resFavBtn').textContent = '🤍 บันทึกโปรด';
      } else {
        state.favorites.push(selectedMenu.id);
        document.getElementById('resFavBtn').textContent = '❤️ บันทึกแล้ว';
        showToast('เพิ่มในรายการโปรดแล้ว ❤️');
      }
      saveState();
    }

    // --- Shareable Bento Card Image Generator (Compatible with Safari, Chrome & LINE In-App Browser) ---
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split('');
      let line = '';
      let curY = y;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        if (ctx.measureText(testLine).width > maxWidth && i > 0) {
          ctx.fillText(line, x, curY);
          line = words[i];
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, curY);
      return curY;
    }

    async function shareSamrubCard() {
      if (!selectedMenu) return;
      const pairMain = resolveMenuPair(selectedMenu, 'main');
      const pairSweet = resolveMenuPair(selectedMenu, 'sweet');
      const rankTitle = getCurrentRankTitle();

      const canvas = document.getElementById('shareCanvas');
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFAF3';
      ctx.fillRect(0, 0, 720, 900);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 38px "Prompt", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ทุกมื้อ TooKMUE', 54, 86);

      ctx.fillStyle = '#786458';
      ctx.font = '600 24px "Prompt", sans-serif';
      ctx.fillText(`${state.avatar} ${rankTitle}`, 54, 126);

      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, 48, 160, 624, 310, 36);
      ctx.fill();
      ctx.strokeStyle = '#F3E5D5';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#EA580C';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.fillText(`🎯 ผลการสุ่มมื้อนี้ • ${selectedMenu.region}`, 84, 216);

      ctx.fillStyle = '#3A2B22';
      ctx.font = 'bold 44px "Prompt", sans-serif';
      wrapCanvasText(ctx, selectedMenu.name, 84, 286, 550, 56);

      ctx.fillStyle = '#786458';
      ctx.font = '600 26px "Noto Sans Thai", sans-serif';
      ctx.fillText(`💰 งบประมาณ ~${selectedMenu.budget} บาท   |   ⏱️ เวลาปรุง ${selectedMenu.prep_time} นาที`, 84, 426);

      ctx.fillStyle = '#24442F';
      roundRect(ctx, 48, 500, 624, 260, 36);
      ctx.fill();

      ctx.fillStyle = '#FFC53D';
      ctx.font = 'bold 28px "Prompt", sans-serif';
      ctx.fillText('🥢 สำรับจับคู่แนะนำ (Food Pairing)', 84, 558);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 28px "Noto Sans Thai", sans-serif';
      ctx.fillText(`🍽️ คู่กับข้าว: ${pairMain.name}`, 84, 622);

      ctx.fillStyle = '#FDE68A';
      ctx.fillText(`🧋 ตบท้ายมื้อ: ${pairSweet.name}`, 84, 686);

      ctx.fillStyle = '#3A2B22';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('คิดไม่ออกว่าจะกินอะไร? มาสุ่มฟรีที่ tookmue.pages.dev', 360, 832);

      const shareText = `มื้อนี้ "ทุกมื้อ (TooKMUE)" เลือกให้: ${selectedMenu.name} 🍽️ จับคู่กับ ${pairMain.name} และตบท้ายด้วย ${pairSweet.name}! ลองสุ่มมื้อของคุณได้ที่ https://tookmue.pages.dev/`;
      const dataUrl = canvas.toDataURL('image/png');

      // Show inline image preview & direct LINE share link (works 100% inside LINE In-App Browser!)
      const previewBox = document.getElementById('sharePreviewBox');
      document.getElementById('sharePreviewImg').src = dataUrl;
      document.getElementById('directLineShareLink').href = `https://line.me/R/share?text=${encodeURIComponent(shareText)}`;
      previewBox.classList.add('open');
      previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      const isLineBrowser = /Line/i.test(navigator.userAgent);
      if (isLineBrowser) {
        addXp(10);
        showToast('สร้างการ์ดแล้ว! กดค้างที่รูปเพื่อบันทึก หรือกดปุ่มส่งเข้า LINE ด้านล่าง');
        return;
      }

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'tookmue-meal.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'ทุกมื้อ (TooKMUE) - ผลการสุ่มมื้อนี้',
              text: shareText,
              files: [file]
            });
            addXp(10);
            return;
          } catch (err) {}
        }
        const link = document.createElement('a');
        link.download = `TooKMUE_${selectedMenu.id}.png`;
        link.href = dataUrl;
        link.click();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareText).catch(() => {});
        }
        addXp(10);
        showToast('บันทึกรูปการ์ด & คัดลอกข้อความส่งเข้า LINE แล้ว! (+10 XP)');
      }, 'image/png');
    }

    function setSamrubBudgetCap(cap, btn) {
      samrubBudgetCap = Number(cap) || 0;
      document.querySelectorAll('#samrubBudgetGroup .samrub-cap-chip').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.cap) === samrubBudgetCap);
      });
      currentSamrubTrio = null;
      playTickSound();
      renderDailySamrub(true);
    }

    function pickSamrubTrio(budgetCap, forceRandom = false) {
      const avail = getAvailableMenus({ allowExotic: false });
      const mains = avail.filter(m => m.mode === 'main');
      const sides = mains.filter(m => Array.isArray(m.tags) && m.tags.includes('กับข้าว'));
      const sweets = avail.filter(m => m.mode === 'dessert' || m.mode === 'drink');
      if (mains.length === 0 || sweets.length === 0) return null;

      if (!budgetCap || budgetCap <= 0) {
        let mainSample = (!forceRandom && currentSamrubMainId)
          ? mains.find(m => m.id === currentSamrubMainId)
          : null;
        if (!mainSample) {
          if (!forceRandom && !currentSamrubMainId) {
            mainSample = mains.find(m => m.id === 'TH-C02') || mains[0];
          } else {
            const others = mains.filter(m => m.id !== currentSamrubMainId);
            const pool = others.length > 0 ? others : mains;
            mainSample = pool[Math.floor(Math.random() * pool.length)];
          }
        }
        const pairSample = resolveMenuPair(mainSample, 'main');
        const sweetSample = resolveMenuPair(mainSample, 'sweet');
        return { main: mainSample, side: pairSample, sweet: sweetSample, logged: false };
      }

      // สุ่มหาชุด 3 ชิ้น (จานหลัก + กับข้าวไม่ซ้ำโปรตีน + ของหวาน/เครื่องดื่ม) ที่ราคารวม <= budgetCap
      const shuffledMains = [...mains].sort(() => 0.5 - Math.random());
      const shuffledSides = [...(sides.length > 0 ? sides : mains)].sort(() => 0.5 - Math.random());
      const shuffledSweets = [...sweets].sort(() => 0.5 - Math.random());

      const minSweetBudget = Math.min(...sweets.map(s => Number(s.budget) || 0));
      for (const m of shuffledMains) {
        if (forceRandom && currentSamrubMainId && m.id === currentSamrubMainId && shuffledMains.length > 1) continue;
        const mCost = Number(m.budget) || 0;
        if (mCost + minSweetBudget >= budgetCap) continue;
        for (const s of shuffledSides) {
          if (s.id === m.id || s.protein === m.protein) continue;
          const pairCost = mCost + (Number(s.budget) || 0);
          if (pairCost + minSweetBudget > budgetCap) continue;
          const validSweet = shuffledSweets.find(sw => pairCost + (Number(sw.budget) || 0) <= budgetCap);
          if (validSweet) {
            return { main: m, side: s, sweet: validSweet, logged: false };
          }
        }
      }
      return null;
    }

    function shuffleDailySamrub() {
      playTickSound();
      renderDailySamrub(true);
    }

    function confirmAteSamrubTrio(btnEl) {
      if (!currentSamrubTrio || currentSamrubTrio.logged) return;
      const { main, side, sweet } = currentSamrubTrio;
      const total = (Number(main.budget) || 0) + (Number(side.budget) || 0) + (Number(sweet.budget) || 0);
      currentSamrubTrio.logged = true;
      recordEatenMeal({
        menuId: main.id,
        name: `🥢 สำรับ: ${main.name} + ${side.name}`,
        amount: total,
        xp: 40,
        source: 'wheel'
      });
      playWinChime();
      if (btnEl) {
        btnEl.disabled = true;
        btnEl.textContent = '✓ บันทึกสำรับแล้ว';
      }
      showToast(`บันทึกสำรับ 3 ชิ้น (~${total.toLocaleString()}฿) +40 XP 🥢`);
    }

    function renderDailySamrub(forceRandom = false) {
      const box = document.getElementById('dailySamrubBox');
      if (!box) return;
      if (MENUS.length === 0) {
        box.innerHTML = isMenusLoading
          ? `<div class="samrub-grid-3">${Array.from({ length: 3 }).map(() => `<div class="samrub-mini-tile"><div class="skeleton-pulse" style="width:52px; height:52px; border-radius:14px; opacity:0.35; margin:0 auto 6px;"></div><div class="skeleton-pulse" style="height:12px; width:80%; border-radius:6px; opacity:0.25; margin:0 auto;"></div></div>`).join('')}</div>`
          : `<div style="font-size:14px; color:#FDE68A;">ยังโหลดข้อมูลสำรับไม่สำเร็จ กด "ลองใหม่" ด้านบนเพื่อดึงเมนูครับ</div>`;
        return;
      }

      const availIds = new Set(getAvailableMenus({ allowExotic: false }).map(m => m.id));
      const existingValid = !forceRandom && currentSamrubTrio &&
        availIds.has(currentSamrubTrio.main.id) &&
        availIds.has(currentSamrubTrio.side.id) &&
        availIds.has(currentSamrubTrio.sweet.id) &&
        (samrubBudgetCap === 0 || ((currentSamrubTrio.main.budget || 0) + (currentSamrubTrio.side.budget || 0) + (currentSamrubTrio.sweet.budget || 0)) <= samrubBudgetCap);

      if (!existingValid) {
        currentSamrubTrio = pickSamrubTrio(samrubBudgetCap, forceRandom);
      }

      if (!currentSamrubTrio) {
        box.innerHTML = `
          <div style="background:rgba(255,255,255,0.1); border-radius:16px; padding:14px; text-align:center;">
            <div style="font-size:14px; font-weight:700; color:#FDE68A; margin-bottom:4px;">ไม่พบสำรับ 3 ชิ้นในงบ ≤${samrubBudgetCap}฿</div>
            <div style="font-size:12px; opacity:0.9; margin-bottom:8px;">ลองขยับเพดานงบเป็น ≤180฿ หรือไม่จำกัดดูครับ</div>
            <button type="button" onclick="setSamrubBudgetCap(180)" class="samrub-open-btn">ลองงบ ≤180฿</button>
          </div>
        `;
        return;
      }

      const { main: mainSample, side: pairSample, sweet: sweetSample, logged } = currentSamrubTrio;
      currentSamrubMainId = mainSample.id;
      const total = (mainSample.budget || 0) + (pairSample.budget || 0) + (sweetSample.budget || 0);
      const sweetRole = sweetSample.category === 'เครื่องดื่ม' ? '🥤 เครื่องดื่ม' : '🍨 ของหวาน';

      const items = [
        { role: '🍚 จานหลัก', dish: mainSample },
        { role: '🥘 คู่กับข้าว', dish: pairSample },
        { role: sweetRole, dish: sweetSample }
      ];

      box.innerHTML = `
        <div class="samrub-grid-3">
          ${items.map(it => `
            <button type="button" class="samrub-mini-tile" onclick="openMenuById('${it.dish.id}')">
              <img src="${it.dish.image_url}" alt="${escapeHtml(it.dish.name)}" class="samrub-mini-img" onerror="resolveWikiImage(this, '${it.dish.id}')" />
              <div class="samrub-mini-role">${it.role}</div>
              <div class="samrub-mini-name">${escapeHtml(it.dish.name)}</div>
              <div class="samrub-mini-price tabular-nums">~${it.dish.budget}฿</div>
            </button>
          `).join('')}
        </div>
        <div class="samrub-footer-row">
          <div class="tabular-nums" style="font-size:13px; color:#FDE68A; font-weight:600;">
            💰 รวม ~<strong style="color:#FFFFFF; font-size:15px;">${total.toLocaleString()}฿</strong>${samrubBudgetCap > 0 ? ' <span class="samrub-in-budget">✓ ในงบ</span>' : ''}
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button type="button" onclick="confirmAteSamrubTrio(this)" class="samrub-eat-btn" ${logged ? 'disabled' : ''}>${logged ? '✓ กินแล้ว' : '✅ กินชุดนี้ (+40 XP)'}</button>
          </div>
        </div>
      `;
    }

    function setExploreCat(cat, btn) {
      exploreCat = cat;
      document.querySelectorAll('#exploreCategories .chip-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderExplorer();
    }

    function setExploreSpecialty(spec, btn) {
      exploreSpecialty = spec;
      document.querySelectorAll('#exploreSpecialties .mood-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderExplorer();
    }

    function resetExploreFilters() {
      const inp = document.getElementById('searchInput');
      if (inp) inp.value = '';
      exploreCat = 'all';
      exploreSpecialty = 'all';
      document.querySelectorAll('#exploreCategories .chip-btn').forEach(b => b.classList.remove('active'));
      const allBtn = document.getElementById('catBtnAll');
      if (allBtn) allBtn.classList.add('active');
      document.querySelectorAll('#exploreSpecialties .mood-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.spec === 'all');
      });
      renderExplorer();
    }

    function renderExplorer() {
      const grid = document.getElementById('exploreGrid');
      if (!grid) return;

      if (isMenusLoading && MENUS.length === 0) {
        grid.innerHTML = Array.from({ length: 6 }).map(() => `
          <div class="skeleton-card">
            <div class="skeleton-pulse" style="height:112px; width:100%;"></div>
            <div style="padding:10px 12px;">
              <div class="skeleton-pulse" style="height:14px; width:55%; border-radius:8px; margin-bottom:8px;"></div>
              <div class="skeleton-pulse" style="height:18px; width:90%; border-radius:8px; margin-bottom:8px;"></div>
              <div class="skeleton-pulse" style="height:12px; width:65%; border-radius:8px;"></div>
            </div>
          </div>
        `).join('');
        return;
      }

      const rawQ = document.getElementById('searchInput').value.trim();
      const q = rawQ.toLowerCase();
      const baseAvail = getAvailableMenus();
      let list = baseAvail;
      if (exploreCat !== 'all') list = list.filter(m => m.category === exploreCat);
      if (exploreSpecialty !== 'all') {
        list = list.filter(m =>
          (Array.isArray(m.tags) && m.tags.includes(exploreSpecialty)) ||
          (exploreSpecialty === 'มังสวิรัติ' && m.protein === 'มังสวิรัติ') ||
          (exploreSpecialty === 'สายคลีน' && Array.isArray(m.tags) && m.tags.includes('สุขภาพ'))
        );
      }
      if (q) {
        list = list.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q) ||
          m.protein.toLowerCase().includes(q) ||
          (Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase().includes(q))) ||
          (Array.isArray(m.ingredients) && m.ingredients.some(i => i.toLowerCase().includes(q)))
        );
      }

      const filterBar = document.getElementById('exploreActiveFilterBar');
      const countText = document.getElementById('exploreResultCountText');
      if (filterBar && countText) {
        if (q || exploreCat !== 'all' || exploreSpecialty !== 'all') {
          filterBar.style.display = 'flex';
          const specLabel = exploreSpecialty !== 'all' ? ` • ${exploreSpecialty}` : '';
          countText.textContent = `พบ ${list.length} เมนู${specLabel}${q ? ` สำหรับ "${rawQ}"` : ''}`;
        } else {
          filterBar.style.display = 'none';
        }
      }

      if (list.length === 0) {
        const popular = baseAvail.slice(0, 3);
        grid.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-title">ไม่พบเมนูที่ตรงกับ "${rawQ || exploreCat}"</div>
            <div class="empty-state-desc">ลองค้นหาด้วยคำสั้นลง เช่น "กะเพรา", "ไก่", "ญี่ปุ่น" หรือเลือกเมนูแนะนำด้านล่างครับ</div>
            <div class="empty-state-suggestions">
              ${popular.map(p => `<button type="button" class="ing-tag-chip" onclick="openMenuById('${p.id}')">🍽️ ${p.name}</button>`).join('')}
            </div>
            <button type="button" class="empty-state-cta" onclick="resetExploreFilters()">ล้างคำค้นหาและตัวกรอง</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = list.map((m, idx) => {
        const cObj = COUNTRIES.find(c => c.name === m.region);
        const badge = cObj ? `${cObj.flag} ${m.region}` : m.region;
        const exBadge = isMenuExotic(m)
          ? `<span class="menu-badge exotic-mini-badge">${getExoticLevelMeta(m.exotic_level).short}</span>`
          : '';
        return `
        <div class="menu-card reveal-card" style="transition-delay: ${(idx % 6) * 35}ms;" onclick="openMenuById('${m.id}')">
          <img src="${m.image_url}" alt="${m.name}" loading="lazy" class="menu-card-img" onerror="resolveWikiImage(this, '${m.id}')" />
          <div class="menu-card-body">
            <div>
              <div style="display:flex; gap:4px; flex-wrap:wrap;">
                <span class="menu-badge">${badge}</span>${exBadge}
              </div>
              <div style="font-size: 16px; font-weight: 700; line-height: 1.3; margin-bottom: 6px;">${m.name}</div>
            </div>
            <div class="tabular-nums" style="font-size: 13px; color: var(--text-muted); font-weight: 600;">
              💰 ${m.budget}฿ • ⏱️ ${m.prep_time} น.
            </div>
          </div>
        </div>`;
      }).join('');
      observeRevealCards();
    }

    function openMenuById(id) {
      const found = MENUS.find(m => m.id === id);
      if (found) openMenuResult(found);
    }

    function renderSaved() {
      document.getElementById('favCount').textContent = state.favorites.length;
      const favEl = document.getElementById('favList');
      if (state.favorites.length === 0) {
        favEl.innerHTML = `
          <div class="empty-state-card" style="padding:18px 12px;">
            <div class="empty-state-icon">🤍</div>
            <div class="empty-state-title">ยังไม่มีเมนูโปรดที่บันทึกไว้</div>
            <div class="empty-state-desc">กดปุ่ม "บันทึกโปรด" ที่เมนูที่ถูกใจ เพื่อเก็บไว้ดูย้อนหลังได้ทันที</div>
            <button type="button" class="empty-state-cta" onclick="switchTab('explore')">ไปเลือกดูคลังเมนู</button>
          </div>
        `;
      } else {
        favEl.innerHTML = state.favorites.map(id => {
          const m = MENUS.find(x => x.id === id);
          return m ? `<div onclick="openMenuById('${m.id}')" style="padding:10px 0; border-bottom:1px solid #F3ECE1; display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer;"><div style="display:flex; align-items:center; gap:10px;"><img src="${m.image_url}" style="width:42px; height:42px; border-radius:10px; object-fit:cover;" onerror="resolveWikiImage(this, '${m.id}')"/><strong>❤️ ${m.name}</strong></div><span class="tabular-nums">${m.budget}฿</span></div>` : '';
        }).join('');
      }

      const histEl = document.getElementById('historyList');
      if (state.history.length === 0) {
        histEl.innerHTML = `
          <div class="empty-state-card" style="padding:16px 12px;">
            <div class="empty-state-icon">🕒</div>
            <div class="empty-state-title">ยังไม่มีประวัติมื้อที่กินไป</div>
            <div class="empty-state-desc">เมื่อกด "✅ กินเมนูนี้" ระบบจะบันทึกไว้ช่วยตัดเมนูซ้ำในวันถัดไป</div>
            <button type="button" class="empty-state-cta" onclick="switchTab('home')">ไปหมุนสุ่มมื้อแรก</button>
          </div>
        `;
      } else {
        histEl.innerHTML = state.history.map(id => {
          const strId = String(id || '');
          if (strId.startsWith('FRIDGE:')) {
            const label = strId.slice(7).replace(/^🧊\s*/, '');
            return `<div style="padding:8px 0; border-bottom:1px solid #F3ECE1; display:flex; justify-content:space-between; align-items:center; gap:8px;"><span>🧊 ${escapeHtml(label)}</span><span class="source-badge source-fridge">เมนูตู้เย็น</span></div>`;
          }
          const m = MENUS.find(x => x.id === strId);
          return m ? `<div onclick="openMenuById('${m.id}')" style="padding:8px 0; border-bottom:1px solid #F3ECE1; display:flex; justify-content:space-between; align-items:center; gap:8px; cursor:pointer;"><span>🍽️ ${escapeHtml(m.name)}</span><span style="font-size:13px; color:var(--chili-orange); font-weight:600; flex-shrink:0;">งดสุ่มซ้ำ</span></div>` : '';
        }).join('');
      }
    }

    function clearHistory() {
      state.history = [];
      saveState();
      renderSaved();
      prepareWheelSlices();
      showToast('ล้างประวัติเมนูเมื่อวานแล้ว');
    }

    function addXp(amount) {
      const mult = state.isVip ? 1.5 : 1;
      state.xp += Math.round(amount * mult);
      saveState();
    }

    function dailyCheckIn() {
      const today = new Date().toISOString().slice(0, 10);
      if (state.lastCheckIn === today) {
        showToast('วันนี้คุณเช็กอินรับแต้มไปแล้วครับ 🍱');
        return;
      }
      state.lastCheckIn = today;
      state.streak = (state.streak % 7) + 1;
      addXp(10);
      saveState();
      playWinChime();
      showToast('เช็กอินสำเร็จ! รับ +10 XP 🍱');
    }

    function selectAvatar(icon) {
      state.avatar = icon;
      saveState();
      showToast('เปลี่ยนอวตารสายกินแล้ว!');
    }



    function getCurrentRankTitle() {
      let rank = RANKS[0].title;
      for (let i = 0; i < RANKS.length; i++) {
        if (state.xp >= RANKS[i].minXp) rank = RANKS[i].title;
      }
      return state.isVip ? `⭐ ${rank}` : rank;
    }

    function updateProfileUI() {
      let rank = RANKS[0].title;
      let nextXp = 100;
      for (let i = 0; i < RANKS.length; i++) {
        if (state.xp >= RANKS[i].minXp) {
          rank = RANKS[i].title;
          nextXp = RANKS[i + 1] ? RANKS[i + 1].minXp : 1500;
        }
      }
      const displayRank = state.isVip ? `⭐ ${rank}` : rank;
      document.getElementById('headerAvatar').textContent = state.avatar;
      document.getElementById('headerRank').textContent = displayRank;
      document.getElementById('headerStreak').textContent = state.streak;
      document.getElementById('soundToggleBtn').textContent = state.soundOn ? '🔊' : '🔇';
      document.getElementById('yesterdayCount').textContent = state.history.filter(id => !String(id).startsWith('FRIDGE:')).length;
      const totalCountries = COUNTRIES.length;
      const stripTotalEl = document.getElementById('passportTotalCountriesStrip');
      const titleTotalEl = document.getElementById('passportTotalCountriesTitle');
      if (stripTotalEl) stripTotalEl.textContent = totalCountries;
      if (titleTotalEl) titleTotalEl.textContent = totalCountries;
      document.getElementById('passportProgressBadge').textContent = `${state.stamps.length}/${totalCountries} ดวง`;

      document.getElementById('profileAvatarBig').textContent = state.avatar;
      document.getElementById('profileRankTitle').textContent = displayRank;
      document.getElementById('xpText').textContent = `${state.xp} / ${nextXp} XP`;
      document.getElementById('xpBar').style.width = `${Math.min(100, (state.xp / nextXp) * 100)}%`;
      document.getElementById('streakText').textContent = `${state.streak} วันต่อเนื่อง`;
      document.getElementById('stampCountText').textContent = `${state.stamps.length} / ${totalCountries} ดวง`;
      renderCuteLeaderboard();



      document.getElementById('avatarGrid').innerHTML = AVATARS.map(a => `
        <div class="avatar-option ${state.avatar === a.icon ? 'selected' : ''}" onclick="selectAvatar('${a.icon}')">
          <div style="font-size: 26px;">${a.icon}</div>
          <div style="margin-top: 2px;">${a.name}</div>
        </div>
      `).join('');

      renderPassportStamps();

      let daysHtml = '';
      for (let d = 1; d <= 7; d++) {
        const done = d <= state.streak;
        daysHtml += `<div class="day-box ${done ? 'done' : ''}"><div>${d === 7 ? '🎁' : '🍱'}</div><div>วันที่ ${d}</div></div>`;
      }
      document.getElementById('streakDaysGrid').innerHTML = daysHtml;
      renderWeeklyQuests();
      renderHomeContextStrip();
    }

    function initApp() {
      mergeCustomMenusIntoCatalog();
      syncCountriesFromMenus();
      updateHalalUI();
      updateExoticUI();
      updateSpinSourceUI();
      const avail = getAvailableMenus();
      if (MENUS.length > 0) {
        const totalEl = document.getElementById('totalMenuTitleCount');
        if (totalEl) totalEl.textContent = avail.length;
        const cAll = document.getElementById('catBtnAll');
        const cThai = document.getElementById('catBtnThai');
        const cIntl = document.getElementById('catBtnIntl');
        const cSweet = document.getElementById('catBtnSweet');
        const cBev = document.getElementById('catBtnBev');
        if (cAll) cAll.textContent = `ทั้งหมด (${avail.length})`;
        if (cThai) cThai.textContent = `ไทย 4 ภาค (${avail.filter(m => m.category === 'อาหารไทย 4 ภาค').length})`;
        if (cIntl) cIntl.textContent = `นานาชาติ (${avail.filter(m => m.category === 'อาหารนานาชาติ').length})`;
        if (cSweet) cSweet.textContent = `ของหวาน (${avail.filter(m => m.category === 'ของหวาน').length})`;
        if (cBev) cBev.textContent = `เครื่องดื่ม (${avail.filter(m => m.category === 'เครื่องดื่ม').length})`;
        const navExp = document.getElementById('navExploreLabel');
        if (navExp) navExp.textContent = `คลัง ${avail.length} เมนู`;
      }

      updateProfileUI();
      renderDailySamrub();
      prepareWheelSlices();
      renderExplorer();
    }

    document.getElementById('excludeYesterday').addEventListener('change', prepareWheelSlices);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }


    // --- v9 Interactive Mood Filter ---
    let moodFilter = 'all';
    function applyMoodFilter(mood, btn) {
      moodFilter = mood;
      document.querySelectorAll('#moodBar .mood-pill').forEach(p => p.classList.remove('active'));
      if (btn) btn.classList.add('active');
      if (navigator.vibrate) navigator.vibrate(15);
      playTickSound();
      if (currentMode === 'fridge') setWheelMode('main');
      prepareWheelSlices();
    }

    // --- v9 Smooth Scroll Animation (IntersectionObserver) ---
    let cardObserver = null;
    function observeRevealCards() {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal-card').forEach(el => el.classList.add('is-visible'));
        return;
      }
      if (!cardObserver) {
        cardObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              cardObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
      }
      document.querySelectorAll('.reveal-card:not(.is-visible)').forEach(el => cardObserver.observe(el));
    }

    // --- v9 Subtle Parallax Effect (Scroll & Interactive Card Tilt) ---
    window.addEventListener('scroll', () => {
      const y = window.scrollY || 0;
      const wheelRing = document.querySelector('.wheel-outer-ring');
      if (wheelRing && !isSpinning) {
        wheelRing.style.transform = `translateY(${Math.min(18, y * 0.08)}px)`;
      }
    }, { passive: true });

    const resultSheetEl = document.querySelector('.result-sheet');
    if (resultSheetEl) {
      resultSheetEl.addEventListener('scroll', () => {
        const sTop = resultSheetEl.scrollTop || 0;
        const heroImg = document.getElementById('resImage');
        if (heroImg) {
          heroImg.style.transform = `translateY(${sTop * 0.22}px) scale(${1 + Math.min(0.06, sTop * 0.0004)})`;
        }
      }, { passive: true });
    }

    // Interactive 3D tilt on Hero Food Photo
    const heroWrapEl = document.querySelector('.food-hero-wrap');
    if (heroWrapEl) {
      heroWrapEl.addEventListener('pointermove', (e) => {
        const rect = heroWrapEl.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        const heroImg = document.getElementById('resImage');
        if (heroImg) {
          heroImg.style.transform = `scale(1.04) translate(${nx * -10}px, ${ny * -10}px)`;
        }
      });
      heroWrapEl.addEventListener('pointerleave', () => {
        const heroImg = document.getElementById('resImage');
        if (heroImg) heroImg.style.transform = 'scale(1) translate(0, 0)';
      });
    }

    // --- v9 Interactive Touch Drag / Flick to Spin Wheel ---
    (function setupWheelDrag() {
      const wheelEl = document.getElementById('wheelCanvas');
      if (!wheelEl) return;
      let dragging = false;
      let startAngle = 0;
      let startRot = 0;
      let movedDeg = 0;

      function getPointerAngle(e) {
        const rect = wheelEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      }

      wheelEl.addEventListener('pointerdown', (e) => {
        if (isSpinning) return;
        dragging = true;
        movedDeg = 0;
        startAngle = getPointerAngle(e);
        startRot = currentRotation;
      });

      window.addEventListener('pointermove', (e) => {
        if (!dragging || isSpinning) return;
        const curAngle = getPointerAngle(e);
        const delta = curAngle - startAngle;
        movedDeg = Math.abs(delta);
        currentRotation = startRot + delta;
        wheelEl.style.transform = `rotate(${currentRotation}deg)`;
      });

      window.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (movedDeg > 18 && !isSpinning) {
          spinWheel();
        }
      });
    })();

    // --- Plan B: Swipe Left/Right on Photo Card to Shuffle ---
    (function setupPhotoDeckSwipe() {
      const cardEl = document.getElementById('photoDeckCard');
      if (!cardEl) return;
      let startX = 0;
      let startY = 0;
      let swiped = false;

      cardEl.addEventListener('pointerdown', (e) => {
        if (isSpinning) return;
        startX = e.clientX;
        startY = e.clientY;
        swiped = false;
      });

      cardEl.addEventListener('pointerup', (e) => {
        if (isSpinning) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          swiped = true;
          spinWheel();
        }
      });

      cardEl.addEventListener('click', (e) => {
        if (swiped) {
          e.preventDefault();
          e.stopPropagation();
          swiped = false;
        }
      }, true);
    })();


    function openQrModal() {
      const m = document.getElementById('qrModal');
      if (m) m.classList.add('open');
    }
    function closeQrModal(e) {
      if (!e || e.target.id === 'qrModal') {
        const m = document.getElementById('qrModal');
        if (m) m.classList.remove('open');
      }
    }


    // --- v10 FULL SYSTEM: SUB-TABS, 7-DAY PLANNER, GROCERY LIST, FOOD WALLET & CUSTOM MENUS ---
    function switchSavedSubTab(sub) {
      ['saved', 'plan', 'wallet'].forEach(k => {
        const viewEl = document.getElementById('subView-' + k);
        const btnEl = document.getElementById('subTab' + k.charAt(0).toUpperCase() + k.slice(1) + 'Btn');
        if (viewEl) viewEl.style.display = (k === sub) ? 'block' : 'none';
        if (btnEl) btnEl.classList.toggle('active', k === sub);
      });
      if (sub === 'saved') renderSaved();
      if (sub === 'plan') renderWeeklyPlan();
      if (sub === 'wallet') renderFoodWallet();
    }

    const DAY_NAMES = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];

    function generateWeeklyPlan(style) {
      let pool = getAvailableMenus({ allowExotic: false }).filter(m => m.mode === 'main');
      if (pool.length === 0) {
        showToast(isMenusLoading ? 'กำลังโหลดรายการเมนู กรุณารอสักครู่...' : 'ไม่พบเมนูสำหรับจัดตาราง ลองกดลองใหม่ด้านบนครับ');
        return;
      }
      if (style === 'budget') {
        const cheap = pool.filter(m => m.budget <= 65);
        if (cheap.length >= 14) pool = cheap;
      }
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const plan = [];
      for (let d = 0; d < 7; d++) {
        const lunch = shuffled[(d * 2) % shuffled.length];
        const dinner = shuffled[(d * 2 + 1) % shuffled.length];
        plan.push({
          day: DAY_NAMES[d],
          lunchId: lunch.id,
          dinnerId: dinner.id,
          lunchLogged: false,
          dinnerLogged: false
        });
      }
      state.weeklyPlan = plan;
      state.groceryChecked = [];
      saveState();
      playWinChime();
      renderWeeklyPlan();
      showToast(style === 'budget' ? `จัดตาราง 7 วันโหมดประหยัด${state.halalMode ? ' (ฮาลาล ☪️)' : ''} แล้ว! 💰` : `จัดตารางมื้ออาหาร 7 วัน${state.halalMode ? ' (ฮาลาล ☪️)' : ''} เรียบร้อย! 📅`);
    }

    function renderWeeklyPlan() {
      const box = document.getElementById('weeklyPlanContainer');
      const badge = document.getElementById('planTotalEstBadge');
      if (!box) return;

      if (MENUS.length === 0 && isMenusLoading) {
        box.innerHTML = `<div class="soft-card"><div class="skeleton-pulse" style="height:18px; width:50%; border-radius:8px; margin-bottom:10px;"></div><div class="skeleton-pulse" style="height:14px; width:85%; border-radius:8px;"></div></div>`;
        return;
      }
      if (!state.weeklyPlan || state.weeklyPlan.length === 0) {
        box.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-title">ยังไม่ได้จัดตารางมื้ออาหาร 7 วัน</div>
            <div class="empty-state-desc">ให้ระบบช่วยจัดมื้อกลางวันและเย็นครบทั้งสัปดาห์ พร้อมสรุปรายการจ่ายตลาดอัตโนมัติ</div>
            <button type="button" class="empty-state-cta" onclick="generateWeeklyPlan('all')">✨ จัดตาราง 7 วันเลย</button>
          </div>
        `;
        if (badge) badge.textContent = '~0฿';
        renderGroceryList([]);
        return;
      }

      if (MENUS.length === 0) {
        box.innerHTML = `
          <div class="empty-state-card">
            <div class="empty-state-icon">⚠️</div>
            <div class="empty-state-title">ยังโหลดข้อมูลเมนูไม่สำเร็จ</div>
            <div class="empty-state-desc">แตะปุ่ม "ลองใหม่" ด้านบนเพื่อโหลดข้อมูลตาราง 7 วันครับ</div>
          </div>
        `;
        return;
      }

      let totalWeek = 0;
      let loggedMealsCount = 0;
      const totalSlots = state.weeklyPlan.length * 2;
      const allIngs = [];

      const cardsHtml = state.weeklyPlan.map((row, idx) => {
        const lunch = MENUS.find(m => m.id === row.lunchId) || MENUS[0];
        const dinner = MENUS.find(m => m.id === row.dinnerId) || MENUS[1] || MENUS[0];
        const lunchDone = Boolean(row.lunchLogged);
        const dinnerDone = Boolean(row.dinnerLogged);
        if (lunchDone) loggedMealsCount++;
        if (dinnerDone) loggedMealsCount++;

        const daySum = (lunch.budget || 0) + (dinner.budget || 0);
        totalWeek += daySum;
        (lunch.ingredients || []).forEach(i => allIngs.push(i));
        (dinner.ingredients || []).forEach(i => allIngs.push(i));

        return `
          <div class="plan-day-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <strong style="color:var(--chili-orange); font-size:16px;">${row.day}</strong>
              <span class="tabular-nums" style="font-size:13px; font-weight:700; color:var(--text-muted);">รวม ~${daySum.toLocaleString()}฿</span>
            </div>
            <div class="plan-meal-row ${lunchDone ? 'is-logged' : ''}">
              <span onclick="openMenuById('${lunch.id}')" style="cursor:pointer; flex:1; min-width:0;">☀️ กลางวัน: <strong>${escapeHtml(lunch.name)}</strong> <span class="tabular-nums" style="color:var(--text-muted);">(${lunch.budget}฿)</span></span>
              <div class="plan-meal-actions">
                ${lunchDone
                  ? `<span class="plan-eat-btn logged">✓ กินแล้ว</span>`
                  : `<button type="button" class="plan-eat-btn" onclick="logPlanMeal(${idx}, 'lunch')">✅ กินแล้ว</button>
                     <button type="button" class="plan-swap-btn" onclick="swapPlanMeal(${idx}, 'lunch')">สลับ</button>`
                }
              </div>
            </div>
            <div class="plan-meal-row ${dinnerDone ? 'is-logged' : ''}">
              <span onclick="openMenuById('${dinner.id}')" style="cursor:pointer; flex:1; min-width:0;">🌙 เย็น: <strong>${escapeHtml(dinner.name)}</strong> <span class="tabular-nums" style="color:var(--text-muted);">(${dinner.budget}฿)</span></span>
              <div class="plan-meal-actions">
                ${dinnerDone
                  ? `<span class="plan-eat-btn logged">✓ กินแล้ว</span>`
                  : `<button type="button" class="plan-eat-btn" onclick="logPlanMeal(${idx}, 'dinner')">✅ กินแล้ว</button>
                     <button type="button" class="plan-swap-btn" onclick="swapPlanMeal(${idx}, 'dinner')">สลับ</button>`
                }
              </div>
            </div>
          </div>
        `;
      }).join('');

      const hasNonHalalInPlan = state.halalMode && state.weeklyPlan.some(row => {
        const l = MENUS.find(m => m.id === row.lunchId);
        const d = MENUS.find(m => m.id === row.dinnerId);
        return (l && !isMenuHalal(l)) || (d && !isMenuHalal(d));
      });

      const halalWarnBanner = hasNonHalalInPlan ? `
        <div class="plan-halal-warn">
          <span>☪️ โหมดฮาลาลเปิดอยู่ แต่ตารางเดิมยังมีเมนูที่ไม่ใช่ฮาลาล</span>
          <button type="button" onclick="generateWeeklyPlan('all')" class="plan-halal-refresh-btn">จัดตารางฮาลาลใหม่</button>
        </div>
      ` : '';

      const progressBanner = loggedMealsCount > 0 ? `
        <div class="plan-progress-bar">
          <span class="tabular-nums">🍽️ บันทึกจากตารางแล้ว <strong>${loggedMealsCount}/${totalSlots} มื้อ</strong></span>
          <button type="button" onclick="switchSavedSubTab('wallet')" class="fridge-wallet-link">ดูยอดในกระเป๋างบ →</button>
        </div>
      ` : '';

      box.innerHTML = halalWarnBanner + progressBanner + cardsHtml;

      if (badge) badge.textContent = `รวม ~${totalWeek.toLocaleString()}฿`;
      renderGroceryList(allIngs);
    }

    function logPlanMeal(dayIdx, slot) {
      const row = state.weeklyPlan[dayIdx];
      if (!row) return;
      const loggedKey = slot === 'lunch' ? 'lunchLogged' : 'dinnerLogged';
      if (row[loggedKey]) return;

      const menuId = slot === 'lunch' ? row.lunchId : row.dinnerId;
      const menu = MENUS.find(m => m.id === menuId);
      if (!menu) return;

      row[loggedKey] = true;
      recordEatenMeal({
        menuId: menu.id,
        name: menu.name,
        amount: Number(menu.budget) || 50,
        xp: 25,
        source: 'plan'
      });

      playWinChime();
      renderWeeklyPlan();
      showToast(`บันทึก "${menu.name}" (-${Number(menu.budget || 50).toLocaleString()}฿) +25 XP 📅`);
    }

    function swapPlanMeal(dayIdx, slot) {
      const mains = getAvailableMenus({ allowExotic: false }).filter(m => m.mode === 'main');
      if (mains.length === 0) return;
      const pick = mains[Math.floor(Math.random() * mains.length)];
      if (!pick || !state.weeklyPlan[dayIdx]) return;
      if (slot === 'lunch') {
        state.weeklyPlan[dayIdx].lunchId = pick.id;
        state.weeklyPlan[dayIdx].lunchLogged = false;
      } else {
        state.weeklyPlan[dayIdx].dinnerId = pick.id;
        state.weeklyPlan[dayIdx].dinnerLogged = false;
      }
      playTickSound();
      saveState();
      renderWeeklyPlan();
    }

    function renderGroceryList(planIngredients) {
      const gBox = document.getElementById('groceryListContainer');
      if (!gBox) return;

      const counts = {};
      (planIngredients || []).forEach(ing => {
        if (!ing || ing === 'อื่นๆ' || ing === 'มังสวิรัติ') return;
        counts[ing] = (counts[ing] || 0) + 1;
      });
      (state.customGroceries || []).forEach(ing => {
        counts[ing] = (counts[ing] || 0) + 1;
      });

      const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (items.length === 0) {
        gBox.innerHTML = `
          <div class="empty-state-card" style="padding:16px 12px;">
            <div class="empty-state-icon">🛒</div>
            <div class="empty-state-title">ยังไม่มีรายการจ่ายตลาด</div>
            <div class="empty-state-desc">จัดตาราง 7 วันเพื่อรวมวัตถุดิบอัตโนมัติ หรือพิมพ์ของที่ต้องซื้อเพิ่มด้านบนได้เลยครับ</div>
          </div>
        `;
        return;
      }

      const allChecked = items.every(([name]) => state.groceryChecked.includes(name));
      const caughtUpBanner = allChecked ? `
        <div style="background:#DCFCE7; border:1.5px solid #86EFAC; color:#166534; border-radius:16px; padding:10px 14px; margin-bottom:10px; font-size:13px; font-weight:700; text-align:center;">
          🎉 เยี่ยมมาก! ซื้อวัตถุดิบครบทุกรายการแล้ว
        </div>
      ` : '';

      gBox.innerHTML = caughtUpBanner + items.map(([name, cnt]) => {
        const isDone = state.groceryChecked.includes(name);
        return `
          <div class="grocery-item ${isDone ? 'checked' : ''}" onclick="toggleGroceryItem('${name.replace(/'/g, '')}')">
            <span style="font-weight:600;">${isDone ? '☑️' : '⬜'} ${name}</span>
            <span style="font-size:12px; color:var(--text-muted); font-weight:600;">ใช้ ${cnt} มื้อ</span>
          </div>
        `;
      }).join('');
    }

    function toggleGroceryItem(name) {
      const idx = state.groceryChecked.indexOf(name);
      if (idx >= 0) state.groceryChecked.splice(idx, 1);
      else state.groceryChecked.push(name);
      saveState();
      renderWeeklyPlan();
    }

    function addCustomGrocery() {
      const inp = document.getElementById('customGroceryInput');
      const val = inp.value.trim();
      if (!val) return;
      if (!state.customGroceries.includes(val)) {
        state.customGroceries.push(val);
      }
      inp.value = '';
      saveState();
      renderWeeklyPlan();
      showToast(`เพิ่ม "${val}" ในรายการจ่ายตลาดแล้ว`);
    }

    function clearCheckedGroceries() {
      state.customGroceries = state.customGroceries.filter(g => !state.groceryChecked.includes(g));
      state.groceryChecked = [];
      saveState();
      renderWeeklyPlan();
    }

    // --- FOOD BUDGET WALLET ---
    function toggleBudgetEditor() {
      const box = document.getElementById('budgetEditorBox');
      const inp = document.getElementById('weeklyBudgetInput');
      if (!box) return;
      const willOpen = !box.classList.contains('open');
      box.classList.toggle('open', willOpen);
      clearFieldError('weeklyBudgetInput', 'weeklyBudgetError');
      if (willOpen && inp) {
        inp.value = String(state.weeklyBudget || 1000);
        inp.focus();
      }
    }

    function saveWeeklyBudgetInline() {
      const inp = document.getElementById('weeklyBudgetInput');
      const raw = (inp.value || '').replace(/,/g, '').trim();
      const num = parseInt(raw, 10);
      clearFieldError('weeklyBudgetInput', 'weeklyBudgetError');
      if (isNaN(num) || num < 100) {
        setFieldError('weeklyBudgetInput', 'weeklyBudgetError', `กรุณากรอกตัวเลขตั้งแต่ 100 บาทขึ้นไป (ยังไม่มีการเปลี่ยนแปลง • เป้าเดิมยังคงเป็น ${(state.weeklyBudget || 1000).toLocaleString()}฿)`);
        return;
      }
      state.weeklyBudget = num;
      saveState();
      renderFoodWallet();
      document.getElementById('budgetEditorBox').classList.remove('open');
      showToast(`ตั้งงบค่ากินสัปดาห์ละ ${num.toLocaleString()}฿ แล้ว`);
    }

    function addManualExpense() {
      const nameEl = document.getElementById('expDishInput');
      const priceEl = document.getElementById('expPriceInput');
      const reassEl = document.getElementById('expReassurance');
      const name = nameEl.value.trim() || 'ค่าอาหารมื้อพิเศษ';
      const rawPrice = (priceEl.value || '').replace(/,/g, '').trim();
      const amount = parseFloat(rawPrice);

      clearFieldError('expPriceInput', 'expPriceError');
      if (reassEl) reassEl.classList.remove('show');

      if (!rawPrice || isNaN(amount) || amount <= 0) {
        setFieldError('expPriceInput', 'expPriceError', 'กรุณากรอกราคาเป็นตัวเลขมากกว่า 0 บาท (เช่น 55)');
        if (reassEl) {
          const curRemain = document.getElementById('walletWeekRemain')?.textContent || '';
          reassEl.textContent = `ℹ️ ยังไม่มีการหักยอดใดๆ • ยอดคงเหลือสัปดาห์นี้ยังคงเป็น ${curRemain}`;
          reassEl.classList.add('show');
        }
        return;
      }
      state.expenses.unshift({
        id: 'EXP-' + Date.now(),
        name,
        amount,
        source: 'manual',
        date: new Date().toISOString()
      });
      nameEl.value = '';
      priceEl.value = '';
      addXp(10);
      saveState();
      renderFoodWallet();
      showToast(`บันทึกรายจ่าย "${name}" ${amount.toLocaleString()}฿ แล้ว (+10 XP)`);
    }

    function clearExpenses() {
      if (!confirm('ต้องการล้างประวัติรายจ่ายค่าอาหารทั้งหมดใช่ไหมครับ?')) return;
      state.expenses = [];
      saveState();
      renderFoodWallet();
    }

    function renderFoodWallet() {
      const { weekSpent, monthSpent, goal, remain, pct } = getWeeklyBudgetSummary();
      renderHomeContextStrip();

      document.getElementById('walletWeekSpent').textContent = `${weekSpent.toLocaleString()}฿`;
      document.getElementById('walletWeekGoal').textContent = `${goal.toLocaleString()}฿`;
      document.getElementById('walletMonthSpent').textContent = `${monthSpent.toLocaleString()}฿`;

      const remEl = document.getElementById('walletWeekRemain');
      remEl.textContent = remain >= 0 ? `${remain.toLocaleString()}฿` : `เกินงบ ${Math.abs(remain).toLocaleString()}฿`;
      remEl.style.color = remain >= 0 ? '#16A34A' : '#DC2626';

      const bar = document.getElementById('walletBudgetBar');
      bar.style.width = `${pct}%`;
      bar.className = 'budget-bar-fill' + (pct >= 100 ? ' over' : (pct >= 80 ? ' warn' : ''));

      const logEl = document.getElementById('expenseLogList');
      if (!state.expenses || state.expenses.length === 0) {
        logEl.innerHTML = `
          <div class="empty-state-card" style="padding:16px 12px;">
            <div class="empty-state-icon">🧾</div>
            <div class="empty-state-title">ยังไม่มีประวัติรายจ่ายค่าอาหาร</div>
            <div class="empty-state-desc">กรอกยอดด้านบน หรือกดบันทึกจากหน้าสุ่ม โหมดตู้เย็น หรือตาราง 7 วันได้ในคลิกเดียว</div>
            <button type="button" class="empty-state-cta" onclick="switchTab('home')">ไปสุ่มมื้อนี้เลย</button>
          </div>
        `;
      } else {
        const SOURCE_LABELS = {
          wheel: { text: '🎯 สุ่มมื้อ', cls: 'source-wheel' },
          fridge: { text: '🧊 ตู้เย็น', cls: 'source-fridge' },
          plan: { text: '📅 ตาราง 7 วัน', cls: 'source-plan' },
          manual: { text: '✍️ จดเอง', cls: 'source-manual' }
        };
        logEl.innerHTML = state.expenses.slice(0, 25).map(e => {
          const d = new Date(e.date);
          const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const amt = Number(e.amount) || 0;
          const srcMeta = SOURCE_LABELS[e.source];
          const srcBadge = srcMeta ? `<span class="source-badge ${srcMeta.cls}">${srcMeta.text}</span>` : '';
          const amtHtml = amt === 0
            ? `<strong class="tabular-nums" style="color:#0D9488; text-align:right;">0฿ (ประหยัด!)</strong>`
            : `<strong class="tabular-nums" style="color:var(--chili-orange); text-align:right;">-${amt.toLocaleString()}฿</strong>`;
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid #F3ECE1;">
              <div style="min-width:0;">
                <div style="font-weight:600; color:var(--text-brown);">${escapeHtml(e.name)}</div>
                <div class="tabular-nums" style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:2px;">
                  <span>${dateLabel}</span>
                  ${srcBadge}
                </div>
              </div>
              ${amtHtml}
            </div>
          `;
        }).join('');
      }
    }

    // --- CUSTOM USER MENU ---
    function openCustomMenuModal() {
      document.getElementById('customMenuModal').classList.add('open');
    }
    function closeCustomMenuModal(e) {
      if (!e || e.target.id === 'customMenuModal') {
        document.getElementById('customMenuModal').classList.remove('open');
      }
    }
    function saveCustomMenu() {
      const name = document.getElementById('customMenuName').value.trim();
      const mode = document.getElementById('customMenuMode').value;
      const rawBudget = (document.getElementById('customMenuBudget').value || '').replace(/,/g, '').trim();
      const budget = parseInt(rawBudget, 10);
      const rawIng = document.getElementById('customMenuIngredients').value.trim();

      clearFieldError('customMenuName', 'customMenuNameError');
      clearFieldError('customMenuBudget', 'customMenuBudgetError');

      if (!name) {
        setFieldError('customMenuName', 'customMenuNameError', 'กรุณาพิมพ์ชื่อเมนูส่วนตัวก่อนบันทึก');
        return;
      }
      if (!rawBudget || isNaN(budget) || budget <= 0) {
        setFieldError('customMenuBudget', 'customMenuBudgetError', 'กรุณากรอกราคาเป็นตัวเลขมากกว่า 0 บาท');
        return;
      }

      const ings = rawIng ? rawIng.split(/[-,\s/]+/).filter(Boolean) : [name];
      const newMenu = {
        id: 'USR-' + Date.now(),
        name,
        mode,
        category: mode === 'drink' ? 'เครื่องดื่ม' : (mode === 'dessert' ? 'ของหวาน' : 'อาหารไทย 4 ภาค'),
        region: 'เมนูส่วนตัว',
        protein: 'อื่นๆ',
        budget,
        budget_tier: budget <= 50 ? 'ประหยัด' : (budget <= 90 ? 'ปานกลาง' : 'พรีเมียม'),
        prep_time: 15,
        is_spicy: false,
        is_halal: detectIsHalalText(`${name} ${rawIng}`),
        is_exotic: false,
        tags: ['เมนูส่วนตัว'],
        pair_id: 'TH-C06',
        dessert_pair_id: 'BEV-001',
        image_url: 'icon-512.png',
        wiki_query: name,
        recipe_hint: 'เมนูส่วนตัวที่เพิ่มโดยคุณเอง',
        ingredients: ings
      };

      state.customMenus.unshift(newMenu);
      MENUS.unshift(newMenu);
      addXp(20);
      saveState();

      document.getElementById('customMenuName').value = '';
      document.getElementById('customMenuIngredients').value = '';
      closeCustomMenuModal();
      initApp();
      showToast(`เพิ่มเมนู "${name}" ลงคลังและวงล้อแล้ว! (+20 XP)`);
    }


    // --- v11 Cute User Leaderboard ---
    const SAMPLE_PLAYERS = [
      { name: 'พี่ปิ่นโตสายชิม', avatar: '🍱', rank: 'ผู้สนับสนุน • เชฟกระทะทองคำ', score: 940, isPayTop: true },
      { name: 'น้องกะเพรา', avatar: '☕', rank: 'ผู้สนับสนุน • เซียนกะเพรา', score: 680, isPayTop: false },
      { name: 'คนอยู่หอสายคลีน', avatar: '🧊', rank: 'เล่นฟรี • กูรูสำรับไทย', score: 520, isPayTop: false },
      { name: 'นักชิมตั๋วทิพย์', avatar: '✈️', rank: 'เล่นฟรี • นักชิมประจำซอย', score: 340, isPayTop: false }
    ];

    function computeUserFeatureScore() {
      const baseXp = Number(state.xp) || 0;
      const planBonus = (Array.isArray(state.weeklyPlan) && state.weeklyPlan.length > 0) ? 80 : 0;
      const expenseBonus = (Array.isArray(state.expenses) ? state.expenses.length : 0) * 15;
      const stampBonus = (Array.isArray(state.stamps) ? state.stamps.length : 0) * 25;
      const customBonus = (Array.isArray(state.customMenus) ? state.customMenus.length : 0) * 20;
      return baseXp + planBonus + expenseBonus + stampBonus + customBonus;
    }

    function renderCuteLeaderboard() {
      const tbody = document.getElementById('cuteLeaderboardBody');
      if (!tbody) return;

      const myScore = computeUserFeatureScore();
      const myTitle = (state.isSupporter ? '💚 ผู้สนับสนุน • ' : 'เล่นฟรี • ') + getCurrentRankTitle().replace(/^⭐\s*/, '');
      const rows = [
        ...SAMPLE_PLAYERS,
        {
          name: 'คุณ (Me)',
          avatar: state.avatar || '🍲',
          rank: myTitle,
          score: myScore,
          isMe: true,
          isPayTop: Boolean(state.isSupporter)
        }
      ].sort((a, b) => b.score - a.score);

      tbody.innerHTML = rows.map((r, idx) => {
        const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : (idx + 1)));
        const trClass = r.isMe ? 'is-me' : (r.isPayTop ? 'is-top-pay' : '');
        const payTag = r.isPayTop ? ' <span class="pay-pill">ผู้สนับสนุน</span>' : '';
        return `
          <tr class="${trClass}">
            <td style="font-weight:700;">${medal}</td>
            <td>
              <div style="font-weight:700; color:var(--text-brown);">${r.avatar} ${r.name}${payTag}</div>
              <div style="font-size:11px; color:var(--text-muted);">${r.rank}</div>
            </td>
            <td class="tabular-nums" style="text-align:right; font-weight:700; color:var(--chili-orange);">${r.score.toLocaleString()}</td>
          </tr>
        `;
      }).join('');


    }


    // --- v12 User Feedback & Auto Profanity / Spam Filter ---
    let selectedFbCategory = 'ขอเมนูเพิ่ม';
    const PROFANITY_LIST = [
      'ควย', 'เหี้ย', 'สัตว์', 'สัส', 'เย็ด', 'หี', 'แตด', 'มึง', 'กู', 'ดอกทอง',
      'ระยำ', 'จัญไร', 'สถุล', 'ส้นตีน', 'ตอแหล', 'อีดอก', 'ไอ้เวร', 'ชิบหาย',
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'slut'
    ];

    function selectFbCat(cat, btn) {
      selectedFbCategory = cat;
      document.querySelectorAll('#fbCatGroup .mood-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    }

    function checkProfanityOrSpam(text) {
      const lower = text.toLowerCase();
      const hasUrl = /(https?:\/\/|www\.|\.com|\.net|\.bet|line\.me\/ti)/i.test(lower);
      if (hasUrl) return { blocked: true, reason: 'ไม่อนุญาตให้ใส่ลิงก์ในกล่องข้อเสนอแนะครับ' };
      const hasBadWord = PROFANITY_LIST.some(w => lower.includes(w));
      if (hasBadWord) return { blocked: true, reason: 'กรุณาใช้ถ้อยคำสุภาพในการส่งข้อเสนอแนะนะครับ 🙏' };
      return { blocked: false };
    }

    let isSubmittingFeedback = false;
    async function submitUserFeedback() {
      if (isSubmittingFeedback) return;
      const inp = document.getElementById('fbTextInput');
      const btn = document.getElementById('fbSubmitBtn');
      const raw = (inp.value || '').trim();
      clearFieldError('fbTextInput', 'fbError');

      if (raw.length < 3) {
        setFieldError('fbTextInput', 'fbError', 'กรุณาพิมพ์ข้อความอย่างน้อย 3 ตัวอักษรครับ');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const fbLog = JSON.parse(localStorage.getItem('tookmue_fb_log') || '{"date":"","count":0,"rewarded":false}');
      if (fbLog.date !== today) {
        fbLog.date = today;
        fbLog.count = 0;
      }
      if (fbLog.count >= 3) {
        setFieldError('fbTextInput', 'fbError', 'วันนี้คุณส่งข้อเสนอแนะครบ 3 ครั้งแล้ว ขอบคุณมากครับ 🙏');
        return;
      }

      const check = checkProfanityOrSpam(raw);
      if (check.blocked) {
        setFieldError('fbTextInput', 'fbError', check.reason);
        return;
      }

      isSubmittingFeedback = true;
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> กำลังส่ง...';
      }

      try {
        if (typeof window.saveFeedbackToCloud === 'function') {
          await window.saveFeedbackToCloud({
            category: selectedFbCategory,
            text: raw,
            flagged: false
          });
        }
        fbLog.count += 1;
        localStorage.setItem('tookmue_fb_log', JSON.stringify(fbLog));
        inp.value = '';

        if (!fbLog.rewarded) {
          fbLog.rewarded = true;
          localStorage.setItem('tookmue_fb_log', JSON.stringify(fbLog));
          addXp(15);
          showToast('ขอบคุณสำหรับไอเดียครับ! รับโบนัส +15 XP 🎉');
        } else {
          showToast('ส่งข้อเสนอแนะถึงผู้พัฒนาเรียบร้อยแล้วครับ 🙏');
        }
      } finally {
        isSubmittingFeedback = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'ส่งข้อเสนอแนะ';
        }
      }
    }


    // --- M1-3: PARTY DARE MODAL (สุ่มท้าเพื่อนชิมเมนูแปลก) ---
    function openPartyDareModal() {
      const m = document.getElementById('partyDareModal');
      if (!m) return;
      clearFieldError('partyNamesInput', 'partyNamesError');
      m.classList.add('open');
      const inp = document.getElementById('partyNamesInput');
      if (inp && !inp.value.trim()) inp.focus();
    }

    function closePartyDareModal(e) {
      if (!e || e.target.id === 'partyDareModal') {
        const m = document.getElementById('partyDareModal');
        if (m) m.classList.remove('open');
      }
    }

    function setPartyDareLevel(lvl, btn) {
      partyDareLevel = lvl;
      document.querySelectorAll('#partyLevelGroup .exotic-lvl-chip').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    }

    function runPartyDareSpin() {
      const inp = document.getElementById('partyNamesInput');
      const raw = (inp ? inp.value : '').trim();
      clearFieldError('partyNamesInput', 'partyNamesError');

      const names = raw.split(/[,\n\s]+/).map(s => s.trim()).filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      if (uniqueNames.length < 2) {
        setFieldError('partyNamesInput', 'partyNamesError', 'กรุณาใส่ชื่อเพื่อนอย่างน้อย 2 คน (คั่นด้วยเว้นวรรค หรือ ,) เช่น บอส, แพรว');
        return;
      }
      if (uniqueNames.length > 8) {
        setFieldError('partyNamesInput', 'partyNamesError', 'ใส่ได้สูงสุด 8 คนต่อรอบครับ กรุณาลดจำนวนชื่อลงเล็กน้อย');
        return;
      }

      let pool = getAvailableMenus({ allowExotic: true }).filter(isMenuExotic);
      if (partyDareLevel !== 'all') {
        pool = pool.filter(m => Number(m.exotic_level) === Number(partyDareLevel));
      }
      if (pool.length === 0) {
        setFieldError('partyNamesInput', 'partyNamesError', state.halalMode
          ? 'ไม่พบเมนูแปลกฮาลาลในระดับนี้ ลองเลือก "🎲 ทุกระดับ" ดูครับ'
          : 'ไม่พบเมนูแปลกในระดับที่เลือก');
        return;
      }

      const btn = document.getElementById('partySpinBtn');
      const box = document.getElementById('partyDareResultBox');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> กำลังสุ่มผู้กล้า...';
      }
      getAudioCtx();
      playTickSound();

      setTimeout(() => {
        const chosenFriend = uniqueNames[Math.floor(Math.random() * uniqueNames.length)];
        const chosenDish = pool[Math.floor(Math.random() * pool.length)];
        const meta = getExoticLevelMeta(chosenDish.exotic_level);
        latestPartyDare = { friend: chosenFriend, dish: chosenDish, meta };

        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔄 สุ่มผู้กล้าคนถัดไป!';
        }
        playWinChime();
        if (navigator.vibrate) navigator.vibrate([50, 30, 90]);

        if (box) {
          box.style.display = 'block';
          box.innerHTML = `
            <div class="party-winner-tag">🎯 ผู้กล้าประจำโต๊ะที่โดนสุ่มได้</div>
            <div class="party-winner-name">${escapeHtml(chosenFriend)}</div>
            <div class="party-dish-row" onclick="openMenuById('${chosenDish.id}')">
              <img src="${chosenDish.image_url}" alt="${escapeHtml(chosenDish.name)}" class="party-dish-thumb" onerror="resolveWikiImage(this, '${chosenDish.id}')" />
              <div style="flex:1; min-width:0; text-align:left;">
                <span class="exotic-res-pill" style="font-size:11px; padding:2px 8px; display:inline-block; margin-bottom:4px;">${meta.text}</span>
                <div style="font-size:16px; font-weight:700; color:var(--text-brown); line-height:1.25;">${escapeHtml(chosenDish.name)}</div>
                <div class="tabular-nums" style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHtml(chosenDish.region)} • ~${chosenDish.budget}฿</div>
              </div>
            </div>
            <button type="button" onclick="sharePartyDareCard()" class="btn-action btn-line" style="min-height:44px; font-size:14px; margin-top:10px;">
              📤 แชร์ภารกิจท้าเพื่อนเข้า LINE
            </button>
            <div id="partySharePreview" class="share-preview-container" style="margin-top:10px;">
              <div style="font-size:13px; font-weight:700; color:#06C755; margin-bottom:6px;">📸 แตะค้างที่รูปเพื่อบันทึก หรือส่งเข้าแชต LINE ด้านล่าง</div>
              <img id="partyShareImg" src="" alt="การ์ดท้าเพื่อน TooKMUE" style="width:100%; max-width:240px; border-radius:14px;" />
              <a id="partyLineLink" href="#" target="_blank" rel="noopener" class="btn-action btn-line" style="margin-top:8px; min-height:42px; font-size:14px;">💬 ส่งคำท้าเข้าแชต LINE</a>
            </div>
          `;
          box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 520);
    }

    function sharePartyDareCard() {
      if (!latestPartyDare) return;
      const { friend, dish, meta } = latestPartyDare;
      const canvas = document.getElementById('shareCanvas');
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#2B1410';
      ctx.fillRect(0, 0, 720, 900);

      ctx.fillStyle = '#FFC53D';
      ctx.font = 'bold 36px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🦂 ภารกิจท้าชิมเมนูแปลก • TooKMUE', 360, 88);

      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, 48, 130, 624, 620, 36);
      ctx.fill();

      ctx.fillStyle = '#9A3412';
      ctx.font = 'bold 26px "Prompt", sans-serif';
      ctx.fillText('🎯 ผู้กล้าประจำโต๊ะที่โดนสุ่มได้', 360, 200);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 54px "Prompt", sans-serif';
      ctx.fillText(friend.slice(0, 16), 360, 280);

      ctx.fillStyle = '#FEF3C7';
      roundRect(ctx, 88, 325, 544, 62, 31);
      ctx.fill();
      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 26px "Prompt", sans-serif';
      ctx.fillText(meta.text, 360, 366);

      ctx.fillStyle = '#3A2B22';
      ctx.font = 'bold 38px "Prompt", sans-serif';
      ctx.textAlign = 'left';
      wrapCanvasText(ctx, `ภารกิจ: ${dish.name}`, 88, 455, 544, 52);

      ctx.fillStyle = '#786458';
      ctx.font = '600 24px "Noto Sans Thai", sans-serif';
      ctx.fillText(`🌍 แหล่งที่มา: ${dish.region}  |  💰 ~${dish.budget} บาท`, 88, 610);
      ctx.fillText('🔥 กินจริงรับโบนัส +50 XP ในแอปทุกมื้อ!', 88, 665);

      ctx.fillStyle = '#FEF3C7';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ท้าเพื่อนเล่นฟรีได้ที่ tookmue.pages.dev', 360, 825);

      const shareText = `🦂 ภารกิจท้าชิมเมนูแปลกจาก TooKMUE! ผู้กล้าประจำโต๊ะ: "${friend}" โดนสุ่มให้กิน "${dish.name}" (${meta.text})! มาสุ่มท้าเพื่อนกันที่ https://tookmue.pages.dev/`;
      const dataUrl = canvas.toDataURL('image/png');

      const preview = document.getElementById('partySharePreview');
      const imgEl = document.getElementById('partyShareImg');
      const linkEl = document.getElementById('partyLineLink');
      if (imgEl) imgEl.src = dataUrl;
      if (linkEl) linkEl.href = `https://line.me/R/share?text=${encodeURIComponent(shareText)}`;
      if (preview) preview.classList.add('open');

      if (!/Line/i.test(navigator.userAgent)) {
        const a = document.createElement('a');
        a.download = `TooKMUE_Dare_${dish.id}.png`;
        a.href = dataUrl;
        a.click();
        if (navigator.clipboard) navigator.clipboard.writeText(shareText).catch(() => {});
      }
      addXp(10);
      showToast('สร้างการ์ดท้าเพื่อนแล้ว! (+10 XP) 🦂');
    }

    // --- M1-4: CURATED TRAY BUILDER MODAL (จัดถาดสุ่มเอง 5 หรือ 8 รายการ) ---
    function openTrayBuilderModal() {
      trayModalSize = state.spinTraySize === 8 ? 8 : 5;
      const availIds = new Set(getAvailableMenus().map(m => m.id));
      trayDraftIds = state.customSpinIds.filter(id => availIds.has(id)).slice(0, trayModalSize);

      const hiddenCount = Math.max(0, state.customSpinIds.length - trayDraftIds.length);
      const notice = document.getElementById('trayHiddenNotice');
      if (notice) {
        if (hiddenCount > 0) {
          notice.textContent = `ℹ️ ซ่อน ${hiddenCount} เมนูเดิมในถาดที่ไม่ตรงกับโหมดฮาลาล/เมนูแปลกปัจจุบัน`;
          notice.style.display = 'block';
        } else {
          notice.style.display = 'none';
        }
      }

      const searchInp = document.getElementById('traySearchInput');
      if (searchInp) searchInp.value = '';
      const errEl = document.getElementById('trayBuilderError');
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }

      updateTrayModalHeader();
      renderTrayBuilderList();
      const modal = document.getElementById('trayBuilderModal');
      if (modal) modal.classList.add('open');
    }

    function closeTrayBuilderModal(e) {
      if (!e || e.target.id === 'trayBuilderModal') {
        const modal = document.getElementById('trayBuilderModal');
        if (modal) modal.classList.remove('open');
      }
    }

    function setTrayModalSize(size) {
      trayModalSize = size === 8 ? 8 : 5;
      if (trayDraftIds.length > trayModalSize) {
        trayDraftIds = trayDraftIds.slice(0, trayModalSize);
      }
      updateTrayModalHeader();
      renderTrayBuilderList();
    }

    function updateTrayModalHeader() {
      document.querySelectorAll('#trayModalSizeGroup .tray-size-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.msize) === trayModalSize);
      });
      const counter = document.getElementById('trayModalCounter');
      if (counter) {
        counter.textContent = `เลือกแล้ว ${trayDraftIds.length}/${trayModalSize}`;
        counter.classList.toggle('full', trayDraftIds.length === trayModalSize);
      }
    }

    function toggleTrayMenuItem(menuId) {
      const errEl = document.getElementById('trayBuilderError');
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }

      const idx = trayDraftIds.indexOf(menuId);
      if (idx >= 0) {
        trayDraftIds.splice(idx, 1);
      } else {
        if (trayDraftIds.length >= trayModalSize) {
          showToast(`เลือกครบ ${trayModalSize} รายการแล้วครับ (แตะเมนูเดิมเพื่อเอาออก หรือเปลี่ยนเป็น 8 รายการ)`);
          return;
        }
        trayDraftIds.push(menuId);
      }
      updateTrayModalHeader();
      renderTrayBuilderList();
    }

    function fillTrayFromFavorites() {
      const availIds = new Set(getAvailableMenus().map(m => m.id));
      const validFavs = state.favorites.filter(id => availIds.has(id));
      if (validFavs.length === 0) {
        showToast('ยังไม่มีเมนูโปรดที่พร้อมใช้งานในโหมดปัจจุบันครับ');
        return;
      }
      trayDraftIds = validFavs.slice(0, trayModalSize);
      updateTrayModalHeader();
      renderTrayBuilderList();
      showToast(`ดึงจากเมนูโปรดแล้ว ${trayDraftIds.length} รายการ ❤️`);
    }

    function clearTrayDraft() {
      trayDraftIds = [];
      updateTrayModalHeader();
      renderTrayBuilderList();
    }

    function renderTrayBuilderList() {
      const box = document.getElementById('trayBuilderList');
      if (!box) return;
      const q = (document.getElementById('traySearchInput')?.value || '').trim().toLowerCase();
      let list = getAvailableMenus();
      if (q) {
        list = list.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.region || '').toLowerCase().includes(q) ||
          (m.category || '').toLowerCase().includes(q) ||
          (Array.isArray(m.ingredients) && m.ingredients.some(i => i.toLowerCase().includes(q)))
        );
      }

      // Show selected items first, then favorites, then others (cap render at 60 for fast mobile scroll)
      const selectedSet = new Set(trayDraftIds);
      const favSet = new Set(state.favorites);
      const sorted = [...list].sort((a, b) => {
        const sa = selectedSet.has(a.id) ? 0 : (favSet.has(a.id) ? 1 : 2);
        const sb = selectedSet.has(b.id) ? 0 : (favSet.has(b.id) ? 1 : 2);
        return sa - sb;
      }).slice(0, 60);

      if (sorted.length === 0) {
        box.innerHTML = `
          <div class="empty-state-card" style="padding:18px 12px;">
            <div class="empty-state-icon" style="font-size:28px;">🔍</div>
            <div class="empty-state-title">ไม่พบเมนูที่ค้นหา</div>
            <div class="empty-state-desc">ลองพิมพ์คำสั้นลง เช่น "กะเพรา", "ไก่", "ชาไทย" ครับ</div>
          </div>
        `;
        return;
      }

      box.innerHTML = sorted.map(m => {
        const checked = selectedSet.has(m.id);
        const isFav = favSet.has(m.id);
        const exTag = isMenuExotic(m) ? ` • ${getExoticLevelMeta(m.exotic_level).short}` : '';
        return `
          <button type="button" class="tray-pick-row ${checked ? 'selected' : ''}" onclick="toggleTrayMenuItem('${m.id}')">
            <img src="${m.image_url}" alt="${escapeHtml(m.name)}" class="tray-pick-thumb" loading="lazy" onerror="resolveWikiImage(this, '${m.id}')" />
            <div style="flex:1; min-width:0; text-align:left;">
              <div style="font-size:14px; font-weight:700; color:var(--text-brown); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${isFav ? '❤️ ' : ''}${escapeHtml(m.name)}
              </div>
              <div class="tabular-nums" style="font-size:12px; color:var(--text-muted);">
                ${escapeHtml(m.region || m.category)} • ~${m.budget}฿${exTag}
              </div>
            </div>
            <span class="tray-check-circle">${checked ? '✓' : '+'}</span>
          </button>
        `;
      }).join('');
    }

    function applyCuratedTray() {
      const errEl = document.getElementById('trayBuilderError');
      if (trayDraftIds.length < 2) {
        if (errEl) {
          errEl.textContent = '⚠️ กรุณาเลือกอย่างน้อย 2 เมนูขึ้นไปก่อนนำไปสุ่มครับ';
          errEl.classList.add('show');
        }
        return;
      }
      state.customSpinIds = [...trayDraftIds];
      state.spinTraySize = trayModalSize;
      state.spinSource = 'custom';
      saveState();
      closeTrayBuilderModal();
      switchTab('home');
      if (currentMode === 'fridge') setWheelMode('main');
      updateSpinSourceUI();
      prepareWheelSlices();
      showToast(`จัดถาดสุ่มเอง ${state.customSpinIds.length} รายการเรียบร้อย! 🎯`);
    }


    // --- M2-3: WEEKLY FOOD QUESTS & BADGES (ภารกิจนักชิมประจำสัปดาห์) ---
    function getCurrentWeekStartDate() {
      const now = new Date();
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    function getCurrentWeekKey() {
      const d = getCurrentWeekStartDate();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    function getWeeklyQuestsList() {
      const weekStart = getCurrentWeekStartDate();
      const budgetMealsThisWeek = (state.expenses || []).filter(e => {
        const dt = new Date(e.date);
        const amt = Number(e.amount) || 0;
        return dt >= weekStart && amt <= 50;
      }).length;

      const stampCount = Array.isArray(state.stamps) ? state.stamps.length : 0;

      const planLoggedCount = (state.weeklyPlan || []).reduce((acc, row) => {
        return acc + (row.lunchLogged ? 1 : 0) + (row.dinnerLogged ? 1 : 0);
      }, 0);

      const exoticCount = Number(state.exoticEatenCount) || 0;
      const favCount = Array.isArray(state.favorites) ? state.favorites.length : 0;
      const explorerDone = exoticCount >= 1 || favCount >= 3;

      return [
        {
          id: 'q_budget',
          icon: '💰',
          title: 'สายประหยัดประจำสัปดาห์',
          desc: 'บันทึกมื้ออาหารงบ ≤50฿ หรือเมนูตู้เย็น 0฿ ครบ 3 มื้อในสัปดาห์นี้',
          progress: Math.min(3, budgetMealsThisWeek),
          target: 3,
          xp: 35
        },
        {
          id: 'q_passport',
          icon: '✈️',
          title: 'นักเดินทางสายชิม',
          desc: 'สะสมตราประทับพาสปอร์ตนานาชาติอย่างน้อย 3 ประเทศ',
          progress: Math.min(3, stampCount),
          target: 3,
          xp: 40
        },
        {
          id: 'q_planner',
          icon: '📅',
          title: 'นักวางแผนมือโปร',
          desc: 'จัดตารางมื้อ 7 วัน และกดบันทึกกินแล้วอย่างน้อย 2 มื้อ',
          progress: Math.min(2, planLoggedCount),
          target: 2,
          xp: 45
        },
        {
          id: 'q_explorer',
          icon: '🌟',
          title: 'ผู้กล้า / นักสะสมเมนูโปรด',
          desc: 'พิชิตเมนูแปลก 1 จาน หรือบันทึกเมนูโปรดครบ 3 เมนู',
          progress: explorerDone ? 3 : Math.min(3, favCount),
          target: 3,
          xp: 50
        }
      ];
    }

    function renderWeeklyQuests() {
      const box = document.getElementById('weeklyQuestsList');
      const pill = document.getElementById('weeklyQuestSummaryPill');
      if (!box) return;

      const weekKey = getCurrentWeekKey();
      const claimed = Array.isArray(state.weeklyQuestClaims?.[weekKey]) ? state.weeklyQuestClaims[weekKey] : [];
      const quests = getWeeklyQuestsList();
      const doneCount = quests.filter(q => claimed.includes(q.id)).length;

      if (pill) {
        pill.textContent = `${doneCount}/${quests.length} สำเร็จ`;
        pill.classList.toggle('all-done', doneCount === quests.length);
      }

      const celebBanner = doneCount === quests.length ? `
        <div class="quest-all-done-banner">
          🎉 สุดยอด! คุณเคลียร์ภารกิจประจำสัปดาห์ครบทั้ง ${quests.length} ข้อแล้ว
        </div>
      ` : '';

      box.innerHTML = celebBanner + quests.map(q => {
        const isClaimed = claimed.includes(q.id);
        const canClaim = !isClaimed && q.progress >= q.target;
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
        let actionHtml = '';
        if (isClaimed) {
          actionHtml = `<span class="quest-btn claimed">✓ รับแล้ว</span>`;
        } else if (canClaim) {
          actionHtml = `<button type="button" class="quest-btn claimable" onclick="claimWeeklyQuest('${q.id}', ${q.xp})">🎁 รับ +${q.xp} XP</button>`;
        } else {
          actionHtml = `<span class="quest-btn pending tabular-nums">${q.progress}/${q.target}</span>`;
        }
        return `
          <div class="quest-item-row ${isClaimed ? 'is-claimed' : (canClaim ? 'is-ready' : '')}">
            <div class="quest-icon-box">${q.icon}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px; font-weight:700; color:var(--text-brown);">${q.title}</div>
              <div style="font-size:12px; color:var(--text-muted); line-height:1.3;">${q.desc}</div>
              <div class="quest-bar-track">
                <div class="quest-bar-fill" style="width:${isClaimed ? 100 : pct}%;"></div>
              </div>
            </div>
            ${actionHtml}
          </div>
        `;
      }).join('');
    }

    function claimWeeklyQuest(questId, rewardXp) {
      const weekKey = getCurrentWeekKey();
      if (!state.weeklyQuestClaims || typeof state.weeklyQuestClaims !== 'object') {
        state.weeklyQuestClaims = {};
      }
      if (!Array.isArray(state.weeklyQuestClaims[weekKey])) {
        state.weeklyQuestClaims[weekKey] = [];
      }
      if (state.weeklyQuestClaims[weekKey].includes(questId)) return;

      const quest = getWeeklyQuestsList().find(q => q.id === questId);
      if (!quest || quest.progress < quest.target) return;

      state.weeklyQuestClaims[weekKey].push(questId);
      addXp(Number(rewardXp) || 35);
      playWinChime();
      showToast(`🏅 เคลียร์ภารกิจ "${quest.title}" สำเร็จ! รับ +${rewardXp} XP`);
    }

    // --- M2-1: GROUP LUNCH & OFFICE SPIN MODAL (วงล้อกลุ่มเพื่อน / ออฟฟิศ) ---
    function openGroupSpinModal() {
      groupRules.halal = Boolean(state.halalMode);
      const modal = document.getElementById('groupSpinModal');
      if (!modal) return;
      syncGroupRuleChipsUI();
      updateGroupRuleHint();
      renderGroupPicksList();
      const resBox = document.getElementById('groupSpinResultBox');
      if (resBox && !latestGroupResult) resBox.style.display = 'none';
      modal.classList.add('open');
    }

    function closeGroupSpinModal(e) {
      if (!e || e.target.id === 'groupSpinModal') {
        const modal = document.getElementById('groupSpinModal');
        if (modal) modal.classList.remove('open');
      }
    }

    function switchGroupSpinTab(tab) {
      groupSpinTab = tab === 'picks' ? 'picks' : 'rules';
      const btnRules = document.getElementById('groupTabRulesBtn');
      const btnPicks = document.getElementById('groupTabPicksBtn');
      const viewRules = document.getElementById('groupView-rules');
      const viewPicks = document.getElementById('groupView-picks');
      if (btnRules) btnRules.classList.toggle('active', groupSpinTab === 'rules');
      if (btnPicks) btnPicks.classList.toggle('active', groupSpinTab === 'picks');
      if (viewRules) viewRules.style.display = groupSpinTab === 'rules' ? 'block' : 'none';
      if (viewPicks) viewPicks.style.display = groupSpinTab === 'picks' ? 'block' : 'none';
      if (groupSpinTab === 'picks') {
        renderGroupPicksList();
        document.getElementById('groupPickInput')?.focus();
      } else {
        updateGroupRuleHint();
      }
    }

    function syncGroupRuleChipsUI() {
      document.getElementById('grpRuleHalal')?.classList.toggle('active', groupRules.halal);
      document.getElementById('grpRuleNonSpicy')?.classList.toggle('active', groupRules.nonspicy);
      document.getElementById('grpRuleFast')?.classList.toggle('active', groupRules.fast);
      document.getElementById('grpRuleVeg')?.classList.toggle('active', groupRules.veg);
      document.querySelectorAll('#groupBudgetChips .drawer-chip').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.gcap) === Number(groupRules.maxBudget));
      });
    }

    function toggleGroupRule(ruleKey) {
      groupRules[ruleKey] = !groupRules[ruleKey];
      syncGroupRuleChipsUI();
      updateGroupRuleHint();
    }

    function setGroupBudgetCap(cap, btn) {
      groupRules.maxBudget = Number(cap) || 0;
      document.querySelectorAll('#groupBudgetChips .drawer-chip').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      updateGroupRuleHint();
    }

    function getGroupRulePool() {
      let pool = MENUS.filter(m => m.mode === 'main' && !isMenuExotic(m));
      if (groupRules.halal) pool = pool.filter(isMenuHalal);
      if (groupRules.nonspicy) pool = pool.filter(m => !m.is_spicy);
      if (groupRules.fast) pool = pool.filter(m => (Number(m.prep_time) || 99) <= 15);
      if (groupRules.veg) pool = pool.filter(m => m.protein === 'มังสวิรัติ' || (Array.isArray(m.tags) && m.tags.includes('มังสวิรัติ')));
      if (groupRules.maxBudget > 0) pool = pool.filter(m => (Number(m.budget) || 999) <= groupRules.maxBudget);
      return pool;
    }

    function updateGroupRuleHint() {
      const hint = document.getElementById('groupRulePoolHint');
      const btn = document.getElementById('groupRuleSpinBtn');
      const pool = getGroupRulePool();
      if (hint) {
        hint.textContent = pool.length > 0
          ? `✅ พบ ${pool.length} เมนูที่ทุกคนในโต๊ะกินได้ร่วมกัน`
          : '⚠️ เงื่อนไขเข้มเกินไป (พบ 0 เมนู) ลองปลดบางเงื่อนไขหรือเพิ่มงบต่อคนครับ';
        hint.classList.toggle('empty', pool.length === 0);
      }
      if (btn) btn.disabled = pool.length === 0;
    }

    function runGroupRuleSpin() {
      const pool = getGroupRulePool();
      if (pool.length === 0) {
        showToast('ไม่พบเมนูที่ตรงทุกเงื่อนไข ลองปรับเงื่อนไขก่อนครับ');
        return;
      }
      const btn = document.getElementById('groupRuleSpinBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> กำลังสุ่มเมนูกลาง...';
      }
      getAudioCtx();
      playTickSound();

      setTimeout(() => {
        const winDish = pool[Math.floor(Math.random() * pool.length)];
        const activeRuleLabels = [];
        if (groupRules.halal) activeRuleLabels.push('☪️ ฮาลาล');
        if (groupRules.nonspicy) activeRuleLabels.push('🌿 ไม่เผ็ด');
        if (groupRules.fast) activeRuleLabels.push('⚡ ≤15 น.');
        if (groupRules.veg) activeRuleLabels.push('🥬 มังสวิรัติ');
        if (groupRules.maxBudget > 0) activeRuleLabels.push(`💰 ≤${groupRules.maxBudget}฿`);

        latestGroupResult = {
          mode: 'rules',
          title: winDish.name,
          subtitle: activeRuleLabels.length ? activeRuleLabels.join(' • ') : 'รวมมิตรทั้งโต๊ะ',
          dish: winDish
        };

        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔄 สุ่มเมนูกลางอีกรอบ!';
        }
        playWinChime();
        if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
        renderGroupSpinResult();
      }, 480);
    }

    function addGroupPick() {
      const inp = document.getElementById('groupPickInput');
      const raw = (inp ? inp.value : '').trim();
      clearFieldError('groupPickInput', 'groupPickError');
      if (!raw) {
        setFieldError('groupPickInput', 'groupPickError', 'กรุณาพิมพ์ชื่อเมนูหรือร้านที่เพื่อนอยากกินก่อนกดเพิ่ม');
        return;
      }
      const pieces = raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      for (const p of pieces) {
        if (groupCustomPicks.length >= 8) {
          setFieldError('groupPickInput', 'groupPickError', 'ใส่ได้สูงสุด 8 ตัวเลือกต่อรอบครับ');
          break;
        }
        if (!groupCustomPicks.includes(p)) {
          groupCustomPicks.push(p);
        }
      }
      if (inp) inp.value = '';
      renderGroupPicksList();
    }

    function removeGroupPick(idx) {
      groupCustomPicks.splice(idx, 1);
      renderGroupPicksList();
    }

    function quickFillGroupPicks() {
      const pool = getAvailableMenus({ allowExotic: false }).filter(m => m.mode === 'main');
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const needed = Math.max(0, 5 - groupCustomPicks.length);
      for (const m of shuffled) {
        if (groupCustomPicks.length >= 5) break;
        if (!groupCustomPicks.includes(m.name)) groupCustomPicks.push(m.name);
      }
      clearFieldError('groupPickInput', 'groupPickError');
      renderGroupPicksList();
      if (needed > 0) showToast('เติมไอเดียเมนูลงวงล้อกลุ่มให้แล้ว 🎲');
    }

    function clearGroupPicks() {
      groupCustomPicks = [];
      clearFieldError('groupPickInput', 'groupPickError');
      renderGroupPicksList();
    }

    function renderGroupPicksList() {
      const box = document.getElementById('groupPicksChips');
      if (!box) return;
      if (groupCustomPicks.length === 0) {
        box.innerHTML = `<div style="font-size:13px; color:var(--text-muted); text-align:center; padding:10px 4px;">ยังไม่มีตัวเลือก พิมพ์เมนูที่เพื่อนโหวตด้านบน หรือกด "🎲 เติมไอเดียเมนูด่วน" ได้เลยครับ</div>`;
        return;
      }
      box.innerHTML = groupCustomPicks.map((name, idx) => `
        <span class="group-pick-chip">
          <span>${idx + 1}. ${escapeHtml(name)}</span>
          <button type="button" onclick="removeGroupPick(${idx})" aria-label="ลบตัวเลือก">✕</button>
        </span>
      `).join('');
    }

    function runGroupPickSpin() {
      clearFieldError('groupPickInput', 'groupPickError');
      if (groupCustomPicks.length < 2) {
        setFieldError('groupPickInput', 'groupPickError', 'กรุณาเพิ่มตัวเลือกอย่างน้อย 2 รายการขึ้นไปก่อนสุ่มตัดสินครับ');
        return;
      }
      const btn = document.getElementById('groupPickSpinBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> กำลังหมุนตัดสิน...';
      }
      getAudioCtx();
      playTickSound();

      setTimeout(() => {
        const winnerName = groupCustomPicks[Math.floor(Math.random() * groupCustomPicks.length)];
        const matchedDish = MENUS.find(m => m.name === winnerName) || null;
        latestGroupResult = {
          mode: 'picks',
          title: winnerName,
          subtitle: `สุ่มตัดสินจาก ${groupCustomPicks.length} ตัวเลือกของกลุ่ม`,
          dish: matchedDish
        };
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔄 สุ่มตัดสินใหม่!';
        }
        playWinChime();
        if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
        renderGroupSpinResult();
      }, 520);
    }

    function renderGroupSpinResult() {
      const box = document.getElementById('groupSpinResultBox');
      if (!box || !latestGroupResult) return;
      const { title, subtitle, dish } = latestGroupResult;
      const dishDetailHtml = dish ? `
        <div class="party-dish-row" onclick="openMenuById('${dish.id}')" style="margin-top:8px;">
          <img src="${dish.image_url}" alt="${escapeHtml(dish.name)}" class="party-dish-thumb" onerror="resolveWikiImage(this, '${dish.id}')" />
          <div style="flex:1; min-width:0; text-align:left;">
            <div style="font-size:15px; font-weight:700; color:var(--text-brown);">${escapeHtml(dish.name)}</div>
            <div class="tabular-nums" style="font-size:12px; color:var(--text-muted); margin-top:2px;">💰 ~${dish.budget}฿ • ⏱️ ${dish.prep_time} น. • ${escapeHtml(dish.region)}</div>
            <div style="font-size:11px; color:var(--chili-orange); font-weight:700; margin-top:3px;">แตะเพื่อดูรายละเอียด & หาร้านใกล้ฉัน →</div>
          </div>
        </div>
      ` : '';

      box.style.display = 'block';
      box.innerHTML = `
        <div class="group-winner-tag">🎉 มติเอกฉันท์จากวงล้อกลุ่ม!</div>
        <div class="group-winner-title">${escapeHtml(title)}</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">${escapeHtml(subtitle)}</div>
        ${dishDetailHtml}
        <button type="button" onclick="shareGroupSpinCard()" class="btn-action btn-line" style="min-height:44px; font-size:14px; margin-top:10px;">
          📤 แชร์ผลโหวตเข้ากลุ่ม LINE
        </button>
        <div id="groupSharePreview" class="share-preview-container" style="margin-top:10px;">
          <div style="font-size:13px; font-weight:700; color:#06C755; margin-bottom:6px;">📸 แตะค้างที่รูปเพื่อบันทึก หรือส่งเข้าแชตกลุ่ม LINE ด้านล่าง</div>
          <img id="groupShareImg" src="" alt="การ์ดผลโหวตกลุ่ม TooKMUE" style="width:100%; max-width:240px; border-radius:14px;" />
          <a id="groupLineLink" href="#" target="_blank" rel="noopener" class="btn-action btn-line" style="margin-top:8px; min-height:42px; font-size:14px;">💬 ส่งมติเข้าแชตกลุ่ม LINE</a>
        </div>
      `;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function shareGroupSpinCard() {
      if (!latestGroupResult) return;
      const { title, subtitle, dish } = latestGroupResult;
      const canvas = document.getElementById('shareCanvas');
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(0, 0, 720, 900);

      ctx.fillStyle = '#FFC53D';
      ctx.font = 'bold 36px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👥 มติวงล้อกลุ่มเพื่อน • TooKMUE', 360, 92);

      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, 48, 136, 624, 600, 36);
      ctx.fill();

      ctx.fillStyle = '#2563EB';
      ctx.font = 'bold 26px "Prompt", sans-serif';
      ctx.fillText('🎯 มื้อนี้ทั้งโต๊ะตกลงกิน...', 360, 210);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 46px "Prompt", sans-serif';
      ctx.textAlign = 'left';
      wrapCanvasText(ctx, title, 88, 295, 544, 60);

      ctx.fillStyle = '#475569';
      ctx.font = '600 24px "Noto Sans Thai", sans-serif';
      wrapCanvasText(ctx, `เงื่อนไข: ${subtitle}`, 88, 485, 544, 38);

      if (dish) {
        ctx.fillStyle = '#0F766E';
        ctx.font = 'bold 26px "Prompt", sans-serif';
        ctx.fillText(`💰 งบเฉลี่ย ~${dish.budget} บาท/คน  |  ⏱️ ${dish.prep_time} นาที`, 88, 620);
      }

      ctx.fillStyle = '#DBEAFE';
      ctx.font = 'bold 24px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('หมดปัญหา "กินไรดี?" ทั้งออฟฟิศที่ tookmue.pages.dev', 360, 822);

      const shareText = `👥 มติวงล้อกลุ่ม TooKMUE ออกแล้ว! มื้อนี้กิน "${title}" (${subtitle}) 🍽️ มาสุ่มกับเพื่อนฟรีที่ https://tookmue.pages.dev/`;
      const dataUrl = canvas.toDataURL('image/png');

      const preview = document.getElementById('groupSharePreview');
      const imgEl = document.getElementById('groupShareImg');
      const linkEl = document.getElementById('groupLineLink');
      if (imgEl) imgEl.src = dataUrl;
      if (linkEl) linkEl.href = `https://line.me/R/share?text=${encodeURIComponent(shareText)}`;
      if (preview) preview.classList.add('open');

      if (!/Line/i.test(navigator.userAgent)) {
        const a = document.createElement('a');
        a.download = `TooKMUE_GroupSpin.png`;
        a.href = dataUrl;
        a.click();
        if (navigator.clipboard) navigator.clipboard.writeText(shareText).catch(() => {});
      }
      addXp(10);
      showToast('สร้างการ์ดผลโหวตกลุ่มแล้ว! (+10 XP) 👥');
    }

    initApp();
    observeRevealCards();
