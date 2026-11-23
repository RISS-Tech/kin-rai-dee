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
      { name: 'ซูดาน', flag: '🇸🇩' }
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
      soundOn: true,
      favorites: [],
      history: [],
      stamps: [],
      weeklyBudget: 1000,
      expenses: [],
      weeklyPlan: [],
      groceryChecked: [],
      customGroceries: [],
      customMenus: []
    };
    if (state.soundOn === undefined) state.soundOn = true;
    if (!Array.isArray(state.stamps)) state.stamps = [];
    if (!state.weeklyBudget) state.weeklyBudget = 1000;
    if (!Array.isArray(state.expenses)) state.expenses = [];
    if (!Array.isArray(state.weeklyPlan)) state.weeklyPlan = [];
    if (!Array.isArray(state.groceryChecked)) state.groceryChecked = [];
    if (!Array.isArray(state.customGroceries)) state.customGroceries = [];
    if (!Array.isArray(state.customMenus)) state.customMenus = [];

    function mergeCustomMenusIntoCatalog() {
      if (!Array.isArray(state.customMenus)) return;
      state.customMenus.forEach(cm => {
        if (!MENUS.some(m => m.id === cm.id)) {
          MENUS.unshift(cm);
        }
      });
    }

    let currentMode = 'main';
    let quickFilter = 'all';
    let exploreCat = 'all';
    let currentRotation = 0;
    let isSpinning = false;
    let activeWheelMenus = [];
    let selectedMenu = null;


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

    function setWheelMode(mode) {
      currentMode = mode;
      const btnMain = document.getElementById('btnModeMain');
      const btnPass = document.getElementById('btnModePassport');
      const btnSweet = document.getElementById('btnModeSweet');
      const btnFridge = document.getElementById('btnModeFridge');
      const spinBtn = document.getElementById('spinBtn');
      const passStrip = document.getElementById('passportStrip');
      const wheelArea = document.getElementById('wheelModeArea');
      const fridgeArea = document.getElementById('fridgeModeArea');

      btnMain.className = 'mode-btn' + (mode === 'main' ? ' active' : '');
      btnPass.className = 'mode-btn' + (mode === 'passport' ? ' passport-active' : '');
      btnSweet.className = 'mode-btn' + (mode === 'sweet' ? ' active' : '');
      btnFridge.className = 'mode-btn' + (mode === 'fridge' ? ' fridge-active' : '');

      if (mode === 'fridge') {
        wheelArea.style.display = 'none';
        passStrip.classList.remove('show');
        fridgeArea.classList.add('show');
        return;
      }

      wheelArea.style.display = 'block';
      fridgeArea.classList.remove('show');

      if (mode === 'passport') {
        spinBtn.className = 'spin-cta passport-btn';
        spinBtn.textContent = '✈️ บินสุ่มอาหารนานาชาติ!';
        passStrip.classList.add('show');
      } else {
        spinBtn.className = 'spin-cta';
        spinBtn.textContent = '🎯 หมุนสุ่มมื้อนี้!';
        passStrip.classList.remove('show');
      }
      prepareWheelSlices();
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

      const scoredMenus = MENUS.map(m => {
        const hay = (m.name + ' ' + (m.ingredients || []).join(' ') + ' ' + m.recipe_hint).toLowerCase();
        const matched = tokens.filter(t => hay.includes(t));
        return { menu: m, matchCount: matched.length, matchedTokens: matched };
      }).filter(x => x.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount || a.menu.budget - b.menu.budget)
        .slice(0, 6);

      let htmlOut = `
        <div class="fridge-result-item" style="border-left-color: #D97706; background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
            <span class="creativity-badge">🎨 คะแนนเมนูสร้างสรรค์: ${creativityScore}/100</span>
            <span style="font-size:12px; font-weight:700; color:#B45309;">${creativeBadge}</span>
          </div>
          <div style="font-size: 18px; font-weight: 700; color: var(--text-brown); line-height: 1.35; margin-bottom: 6px;">
            👨‍🍳 ${creativeTitle}
          </div>
          <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;">
            ${creativeDesc}
          </div>
          <button onclick="claimFridgeBonus('${creativeTitle.replace(/'/g, '')}')" class="btn-action btn-orange" style="width:100%; min-height:46px; font-size:15px;">
            ✅ ทำเมนูนี้เคลียร์ตู้เย็น! (+35 XP)
          </button>
          <button type="button" onclick="openQrModal()" style="width:100%; margin-top:8px; min-height:40px; border-radius:999px; border:1px solid #E5D5C3; background:#FFFFFF; color:var(--text-brown); font-size:13px; font-weight:600; cursor:pointer;">
            เลี้ยงข้าวผู้พัฒนา
          </button>
        </div>
      `;

      if (scoredMenus.length > 0) {
        htmlOut += `<div style="font-weight:700; font-size:16px; margin: 14px 4px 4px; color: var(--text-brown);">🍲 เมนูตรงสเปกในคลัง ${MENUS.length} รายการ (${scoredMenus.length} เมนู):</div>`;
        htmlOut += scoredMenus.map(item => {
          const m = item.menu;
          const pct = Math.round((item.matchCount / tokens.length) * 100);
          return `
            <div class="fridge-result-item" onclick="openMenuById('${m.id}')" style="cursor:pointer; display:flex; align-items:center; gap:12px;">
              <img src="${m.image_url}" alt="${m.name}" style="width:68px; height:68px; border-radius:14px; object-fit:cover; flex-shrink:0;" onerror="resolveWikiImage(this, '${m.id}')" />
              <div style="flex:1; min-width:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:4px;">
                  <span style="font-size:11px; font-weight:700; background:#CCFBF1; color:#0F766E; padding:2px 8px; border-radius:999px;">ตรง ${item.matchCount}/${tokens.length} อย่าง (${pct}%)</span>
                  <span style="font-size:12px; color:var(--text-muted); font-weight:600;">⏱️ ${m.prep_time} น.</span>
                </div>
                <div style="font-size:16px; font-weight:700; margin-top:4px; color:var(--text-brown);">${m.name}</div>
                <div style="font-size:12px; color:#0D9488; font-weight:600;">มีแล้ว: ${item.matchedTokens.join(', ')}</div>
              </div>
            </div>
          `;
        }).join('');
      }

      document.getElementById('fridgeResultsBox').innerHTML = htmlOut;
    }

    function claimFridgeBonus(dishName) {
      addXp(35);
      playWinChime();
      showToast(`เยี่ยมมาก! เคลียร์ตู้เย็นด้วย "${dishName.slice(0, 22)}..." (+35 XP) 🧊`);
    }

    function setQuickFilter(filter, btn) {
      quickFilter = filter;
      document.querySelectorAll('#quickFilters .chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      prepareWheelSlices();
    }

    function getBaseModePool() {
      if (currentMode === 'passport') {
        return MENUS.filter(m => m.category === 'อาหารนานาชาติ');
      }
      return MENUS.filter(m => m.mode === currentMode);
    }

    function getFilteredPool() {
      const excludeYest = document.getElementById('excludeYesterday').checked;
      let pool = getBaseModePool();

      if (quickFilter === 'budget50') pool = pool.filter(m => m.budget <= 50);
      if (quickFilter === 'fast15') pool = pool.filter(m => m.prep_time <= 15);
      if (quickFilter === 'spicy') pool = pool.filter(m => m.is_spicy);
      if (quickFilter === 'nonspicy') pool = pool.filter(m => !m.is_spicy);

      if (moodFilter === 'soup') pool = pool.filter(m => m.tags && m.tags.includes('ต้ม'));
      if (moodFilter === 'crispy') pool = pool.filter(m => m.tags && (m.tags.includes('ทอด') || m.name.includes('กรอบ')));
      if (moodFilter === 'healthy') pool = pool.filter(m => m.tags && m.tags.includes('สุขภาพ'));
      if (moodFilter === 'noodle') pool = pool.filter(m => m.tags && m.tags.includes('เส้น'));

      if (excludeYest && state.history.length > 0) {
        const filtered = pool.filter(m => !state.history.includes(m.id));
        if (filtered.length >= 2) pool = filtered;
      }
      return pool.length > 0 ? pool : getBaseModePool();
    }

    function prepareWheelSlices() {
      const pool = getFilteredPool();
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      activeWheelMenus = shuffled.slice(0, Math.min(8, shuffled.length));
      drawWheel();
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
      const colors = currentMode === 'passport' ? palettePassport : paletteMain;

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
        ctx.fillText(isMenusLoading ? 'กำลังโหลดเมนู...' : 'ไม่พบรายการเมนู', cx, cy - 64);
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

    function spinWheel() {
      if (isSpinning) return;
      prepareWheelSlices();
      if (activeWheelMenus.length === 0) {
        showToast(isMenusLoading ? 'กำลังโหลดรายการเมนู กรุณารอสักครู่...' : 'ไม่พบเมนูในหมวดนี้ ลองกดลองใหม่ด้านบนครับ');
        return;
      }
      getAudioCtx();
      isSpinning = true;

      const spinBtn = document.getElementById('spinBtn');
      const pointer = document.getElementById('wheelPointer');
      const canvas = document.getElementById('wheelCanvas');
      spinBtn.disabled = true;
      spinBtn.textContent = currentMode === 'passport' ? '✈️ กำลังบินข้ามประเทศ...' : '🎲 กำลังสุ่มความอร่อย...';

      if (navigator.vibrate) navigator.vibrate(40);

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
          pointer.classList.add('tick');
          setTimeout(() => pointer.classList.remove('tick'), 55);
        }

        if (t < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          isSpinning = false;
          spinBtn.disabled = false;
          spinBtn.textContent = currentMode === 'passport' ? '✈️ บินสุ่มอาหารนานาชาติ!' : '🎯 หมุนสุ่มมื้อนี้!';
          playWinChime();
          if (navigator.vibrate) navigator.vibrate([60, 40, 100]);

          const wonMenu = activeWheelMenus[winIndex];
          if (wonMenu.category === 'อาหารนานาชาติ' && !state.stamps.includes(wonMenu.region)) {
            state.stamps.push(wonMenu.region);
            showToast(`🛂 ปลดล็อกตราประทับประเทศ "${wonMenu.region}"!`);
          }
          addXp(15);
          openMenuResult(wonMenu);
        }
      }

      requestAnimationFrame(animateSpin);
    }

    function openMenuResult(menu) {
      selectedMenu = menu;
      const pairMain = MENUS.find(m => m.id === menu.pair_id) || MENUS[2] || MENUS[0] || menu;
      const pairSweet = MENUS.find(m => m.id === menu.dessert_pair_id) || MENUS[48] || MENUS[0] || menu;
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
      if (!state.history.includes(selectedMenu.id)) {
        state.history.unshift(selectedMenu.id);
        if (state.history.length > 15) state.history.pop();
      }
      state.expenses.unshift({
        id: 'EXP-' + Date.now(),
        name: selectedMenu.name,
        amount: Number(selectedMenu.budget) || 50,
        date: new Date().toISOString()
      });
      if (state.expenses.length > 120) state.expenses.pop();

      addXp(25);
      saveState();
      closeResultModal();
      showToast(`บันทึก "${selectedMenu.name}" (~${selectedMenu.budget}฿) +25 XP`);
      prepareWheelSlices();
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
      const pairMain = MENUS.find(m => m.id === selectedMenu.pair_id) || MENUS[2] || MENUS[0] || selectedMenu;
      const pairSweet = MENUS.find(m => m.id === selectedMenu.dessert_pair_id) || MENUS[48] || MENUS[0] || selectedMenu;
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

    function renderDailySamrub() {
      const box = document.getElementById('dailySamrubBox');
      if (!box) return;
      if (MENUS.length === 0) {
        box.innerHTML = isMenusLoading
          ? `<div style="width:100%; padding:6px 0;"><div class="skeleton-pulse" style="height:16px; width:70%; border-radius:8px; opacity:0.35; margin-bottom:6px;"></div><div class="skeleton-pulse" style="height:13px; width:45%; border-radius:8px; opacity:0.25;"></div></div>`
          : `<div style="font-size:14px; color:#FDE68A;">ยังโหลดข้อมูลสำรับไม่สำเร็จ กด "ลองใหม่" ด้านบนเพื่อดึงเมนูครับ</div>`;
        return;
      }
      const mainSample = MENUS.find(m => m.id === 'TH-C02') || MENUS[1] || MENUS[0];
      const pairSample = MENUS.find(m => m.id === mainSample.pair_id) || MENUS[2] || MENUS[0] || mainSample;
      const sweetSample = MENUS.find(m => m.id === mainSample.dessert_pair_id) || MENUS[48] || MENUS[0] || mainSample;
      const total = (mainSample.budget || 0) + (pairSample.budget || 0) + (sweetSample.budget || 0);

      box.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${mainSample.image_url}" alt="${mainSample.name}" style="width:52px; height:52px; border-radius:14px; object-fit:cover; flex-shrink:0;" onerror="resolveWikiImage(this, '${mainSample.id}')" />
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #FFFFFF; line-height:1.25;">${mainSample.name} + ${pairSample.name}</div>
            <div style="font-size: 13px; color: #FFC53D; margin-top:2px;">ตบท้าย: ${sweetSample.name} • ~${total}฿</div>
          </div>
        </div>
        <button onclick="openMenuById('${mainSample.id}')" style="border:none; background:#FFC53D; color:#3A2B22; border-radius:999px; padding:8px 14px; font-weight:700; font-size:14px; cursor:pointer; flex-shrink:0;">ดูชุดนี้</button>
      `;
    }

    function setExploreCat(cat, btn) {
      exploreCat = cat;
      document.querySelectorAll('#exploreCategories .chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderExplorer();
    }

    function resetExploreFilters() {
      const inp = document.getElementById('searchInput');
      if (inp) inp.value = '';
      exploreCat = 'all';
      document.querySelectorAll('#exploreCategories .chip-btn').forEach(b => b.classList.remove('active'));
      const allBtn = document.getElementById('catBtnAll');
      if (allBtn) allBtn.classList.add('active');
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
      let list = MENUS;
      if (exploreCat !== 'all') list = list.filter(m => m.category === exploreCat);
      if (q) {
        list = list.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q) ||
          m.protein.toLowerCase().includes(q) ||
          (Array.isArray(m.ingredients) && m.ingredients.some(i => i.toLowerCase().includes(q)))
        );
      }

      const filterBar = document.getElementById('exploreActiveFilterBar');
      const countText = document.getElementById('exploreResultCountText');
      if (filterBar && countText) {
        if (q || exploreCat !== 'all') {
          filterBar.style.display = 'flex';
          countText.textContent = `พบ ${list.length} เมนู${q ? ` สำหรับ "${rawQ}"` : ''}`;
        } else {
          filterBar.style.display = 'none';
        }
      }

      if (list.length === 0) {
        const popular = MENUS.slice(0, 3);
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
        return `
        <div class="menu-card reveal-card" style="transition-delay: ${(idx % 6) * 35}ms;" onclick="openMenuById('${m.id}')">
          <img src="${m.image_url}" alt="${m.name}" loading="lazy" class="menu-card-img" onerror="resolveWikiImage(this, '${m.id}')" />
          <div class="menu-card-body">
            <div>
              <span class="menu-badge">${badge}</span>
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
          const m = MENUS.find(x => x.id === id);
          return m ? `<div style="padding:8px 0; border-bottom:1px solid #F3ECE1; display:flex; justify-content:space-between;"><span>🍽️ ${m.name}</span><span style="font-size:14px; color:var(--chili-orange);">งดสุ่มซ้ำ</span></div>` : '';
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
      document.getElementById('yesterdayCount').textContent = state.history.length;
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
    }

    function initApp() {
      mergeCustomMenusIntoCatalog();
      syncCountriesFromMenus();
      if (MENUS.length > 0) {
        const totalEl = document.getElementById('totalMenuTitleCount');
        if (totalEl) totalEl.textContent = MENUS.length;
        const cAll = document.getElementById('catBtnAll');
        const cThai = document.getElementById('catBtnThai');
        const cIntl = document.getElementById('catBtnIntl');
        const cSweet = document.getElementById('catBtnSweet');
        const cBev = document.getElementById('catBtnBev');
        if (cAll) cAll.textContent = `ทั้งหมด (${MENUS.length})`;
        if (cThai) cThai.textContent = `ไทย 4 ภาค (${MENUS.filter(m => m.category === 'อาหารไทย 4 ภาค').length})`;
        if (cIntl) cIntl.textContent = `นานาชาติ (${MENUS.filter(m => m.category === 'อาหารนานาชาติ').length})`;
        if (cSweet) cSweet.textContent = `ของหวาน (${MENUS.filter(m => m.category === 'ของหวาน').length})`;
        if (cBev) cBev.textContent = `เครื่องดื่ม (${MENUS.filter(m => m.category === 'เครื่องดื่ม').length})`;
        const navExp = document.getElementById('navExploreLabel');
        if (navExp) navExp.textContent = `คลัง ${MENUS.length} เมนู`;
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
      let pool = MENUS.filter(m => m.mode === 'main');
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
          dinnerId: dinner.id
        });
      }
      state.weeklyPlan = plan;
      state.groceryChecked = [];
      saveState();
      playWinChime();
      renderWeeklyPlan();
      showToast(style === 'budget' ? 'จัดตาราง 7 วันโหมดประหยัดงบแล้ว! 💰' : 'จัดตารางมื้ออาหาร 7 วันเรียบร้อย! 📅');
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

      let totalWeek = 0;
      const allIngs = [];

      box.innerHTML = state.weeklyPlan.map((row, idx) => {
        const lunch = MENUS.find(m => m.id === row.lunchId) || MENUS[0];
        const dinner = MENUS.find(m => m.id === row.dinnerId) || MENUS[1];
        const daySum = (lunch.budget || 0) + (dinner.budget || 0);
        totalWeek += daySum;
        (lunch.ingredients || []).forEach(i => allIngs.push(i));
        (dinner.ingredients || []).forEach(i => allIngs.push(i));

        return `
          <div class="plan-day-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <strong style="color:var(--chili-orange); font-size:16px;">${row.day}</strong>
              <span style="font-size:13px; font-weight:700; color:var(--text-muted);">รวม ~${daySum}฿</span>
            </div>
            <div class="plan-meal-row">
              <span onclick="openMenuById('${lunch.id}')" style="cursor:pointer; flex:1;">☀️ กลางวัน: <strong>${lunch.name}</strong> (${lunch.budget}฿)</span>
              <button type="button" onclick="swapPlanMeal(${idx}, 'lunch')" style="border:none; background:#FFF1E6; color:var(--chili-orange); border-radius:999px; padding:3px 10px; font-size:12px; font-weight:700; cursor:pointer;">สลับ</button>
            </div>
            <div class="plan-meal-row">
              <span onclick="openMenuById('${dinner.id}')" style="cursor:pointer; flex:1;">🌙 เย็น: <strong>${dinner.name}</strong> (${dinner.budget}฿)</span>
              <button type="button" onclick="swapPlanMeal(${idx}, 'dinner')" style="border:none; background:#FFF1E6; color:var(--chili-orange); border-radius:999px; padding:3px 10px; font-size:12px; font-weight:700; cursor:pointer;">สลับ</button>
            </div>
          </div>
        `;
      }).join('');

      if (badge) badge.textContent = `รวม ~${totalWeek.toLocaleString()}฿`;
      renderGroceryList(allIngs);
    }

    function swapPlanMeal(dayIdx, slot) {
      const mains = MENUS.filter(m => m.mode === 'main');
      if (mains.length === 0) return;
      const pick = mains[Math.floor(Math.random() * mains.length)];
      if (!pick || !state.weeklyPlan[dayIdx]) return;
      if (slot === 'lunch') state.weeklyPlan[dayIdx].lunchId = pick.id;
      else state.weeklyPlan[dayIdx].dinnerId = pick.id;
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
            <div class="empty-state-desc">กรอกยอดด้านบน หรือกด "✅ กินเมนูนี้" หลังสุ่มเพื่อบันทึกค่ากินอัตโนมัติ</div>
            <button type="button" class="empty-state-cta" onclick="switchTab('home')">ไปสุ่มมื้อนี้เลย</button>
          </div>
        `;
      } else {
        logEl.innerHTML = state.expenses.slice(0, 25).map(e => {
          const d = new Date(e.date);
          const dateLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F3ECE1;">
              <div>
                <div style="font-weight:600; color:var(--text-brown);">${e.name}</div>
                <div class="tabular-nums" style="font-size:12px; color:var(--text-muted);">${dateLabel}</div>
              </div>
              <strong class="tabular-nums" style="color:var(--chili-orange); text-align:right;">-${Number(e.amount).toLocaleString()}฿</strong>
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
        category: mode === 'sweet' ? 'ของหวาน' : 'อาหารไทย 4 ภาค',
        region: 'เมนูส่วนตัว',
        protein: 'อื่นๆ',
        budget,
        budget_tier: budget <= 50 ? 'ประหยัด' : (budget <= 90 ? 'ปานกลาง' : 'พรีเมียม'),
        prep_time: 15,
        is_spicy: false,
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

    initApp();
    observeRevealCards();
