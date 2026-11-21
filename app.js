/* =========================================================
   우리집 대시보드 · app.js
   - 모든 입력은 브라우저 localStorage 에 자동 저장
   - 설정(⚙️)에서 JSON 내보내기 / 가져오기 / 초기화
   ========================================================= */
(() => {
  'use strict';

  const STORAGE_KEY = 'uri-jip-dashboard.v1';
  const KIDS = ['c5', 'c3'];
  const EXPENSE_CATS = ['식비', '외식·카페', '마트·식자재', '편의점', '생활', '교통', '주유', '의료·약국', '여가·아이', '교육', '문화', '통신·구독', '온라인쇼핑', '주거', '기타'];
  const INCOME_CATS = ['급여', '부수입', '사업', '기타'];
  const PRIORITY = { high: '중요', mid: '보통', low: '여유' };
  const PRIORITY_ORDER = { high: 0, mid: 1, low: 2 };
  const EMOJIS = ['🪥', '👕', '🍚', '🎒', '🧼', '✏️', '📚', '🧺', '🚌', '🥛', '🧦', '🛁', '🍎', '🧸', '🌙', '⏰'];

  /* ---------- 날짜/시간 ---------- */
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayISO = () => dayFmt.format(new Date());
  const monthKey = (iso) => (iso || todayISO()).slice(0, 7);

  const dateFmtKo = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' });
  const timeFmtKo = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit', hour12: true });

  const pad2 = (n) => String(n).padStart(2, '0');
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const won = (n) => (Number(n) || 0).toLocaleString('ko-KR') + '원';

  /* ---------- 기본 데이터 ---------- */
  const defaultState = () => ({
    version: 1,
    updatedAt: null,
    settings: {
      departTime: '08:50',
      goalLabel: '출발',
      kidsLabels: { c5: '초5', c3: '초3' }
    },
    kids: {
      c5: {
        avatar: '🧒',
        morning: [
          { id: uid(), icon: '🪥', title: '세수·양치', note: '3분', done: false, doneDate: null },
          { id: uid(), icon: '👕', title: '옷 입기', note: '교복·양말', done: false, doneDate: null },
          { id: uid(), icon: '🍚', title: '아침 먹기', note: '천천히', done: false, doneDate: null },
          { id: uid(), icon: '🎒', title: '가방 챙기기', note: '알림장·물통', done: false, doneDate: null }
        ],
        after: [
          { id: uid(), icon: '🧼', title: '손 씻기', note: '', done: false, doneDate: null },
          { id: uid(), icon: '✏️', title: '숙제 하기', note: '', done: false, doneDate: null },
          { id: uid(), icon: '📚', title: '책 읽기', note: '20분', done: false, doneDate: null },
          { id: uid(), icon: '🎒', title: '내일 가방 싸기', note: '', done: false, doneDate: null }
        ]
      },
      c3: {
        avatar: '👧',
        morning: [
          { id: uid(), icon: '🪥', title: '세수·양치', note: '3분', done: false, doneDate: null },
          { id: uid(), icon: '👕', title: '옷 입기', note: '스스로', done: false, doneDate: null },
          { id: uid(), icon: '🍚', title: '아침 먹기', note: '골고루', done: false, doneDate: null },
          { id: uid(), icon: '🎒', title: '가방 챙기기', note: '알림장·물통', done: false, doneDate: null }
        ],
        after: [
          { id: uid(), icon: '🧼', title: '손 씻기', note: '', done: false, doneDate: null },
          { id: uid(), icon: '✏️', title: '숙제 하기', note: '', done: false, doneDate: null },
          { id: uid(), icon: '🧸', title: '정리 정돈', note: '가방·신발', done: false, doneDate: null },
          { id: uid(), icon: '🎒', title: '내일 가방 싸기', note: '', done: false, doneDate: null }
        ]
      }
    },
    work: {
      todos: [
        { id: uid(), text: '주간 업무 보고 정리', priority: 'high', when: 'today', note: '', done: false },
        { id: uid(), text: '회의 자료 확인', priority: 'mid', when: 'today', note: '', done: false },
        { id: uid(), text: '메일함 정리', priority: 'low', when: 'week', note: '', done: false },
        { id: uid(), text: '다음 주 일정 잡기', priority: 'mid', when: 'week', note: '', done: false }
      ],
      memo: ''
    },
    biz: {
      todos: [
        { id: uid(), text: '거래처 연락 정리', priority: 'high', when: 'today', note: '', done: false },
        { id: uid(), text: '재고·발주 확인', priority: 'mid', when: 'today', note: '', done: false },
        { id: uid(), text: '월 매출 정리', priority: 'mid', when: 'week', note: '', done: false },
        { id: uid(), text: '세금계산서 챙기기', priority: 'low', when: 'week', note: '', done: false }
      ],
      memo: ''
    },
    money: { budgets: {}, entries: [] },
    ui: { tab: 'home', kidsView: 'c5', month: monthKey() }
  });

  /* ---------- 저장/불러오기 ---------- */
  function mergeState(saved) {
    const base = defaultState();
    if (!saved || typeof saved !== 'object') return base;
    const s = {
      ...base,
      ...saved,
      settings: { ...base.settings, ...(saved.settings || {}), kidsLabels: { ...base.settings.kidsLabels, ...((saved.settings || {}).kidsLabels || {}) } },
      kids: { ...base.kids, ...(saved.kids || {}) },
      work: { ...base.work, ...(saved.work || {}) },
      biz: { ...base.biz, ...(saved.biz || {}) },
      money: { ...base.money, ...(saved.money || {}) },
      ui: { ...base.ui, ...(saved.ui || {}) }
    };
    KIDS.forEach((k) => {
      const kk = (saved.kids && saved.kids[k]) || {};
      s.kids[k] = { ...base.kids[k], ...kk };
      s.kids[k].morning = Array.isArray(kk.morning) ? kk.morning : base.kids[k].morning;
      s.kids[k].after = Array.isArray(kk.after) ? kk.after : base.kids[k].after;
    });
    ['work', 'biz'].forEach((key) => {
      s[key].todos = Array.isArray((saved[key] || {}).todos) ? saved[key].todos : base[key].todos;
      s[key].todos = s[key].todos.map((t) => ({ id: t.id || uid(), done: !!t.done, priority: t.priority || 'mid', when: t.when || 'today', note: t.note || '', text: t.text || '' }));
    });
    s.money.entries = Array.isArray((saved.money || {}).entries) ? saved.money.entries : [];
    s.money.budgets = (saved.money && saved.money.budgets) || {};
    s.money.entries = s.money.entries.map(normalizeEntry).filter(Boolean);
    return s;
  }

  /* 가계부 한 줄 맞추기 (카드 내역 파일에서 온 card·time·discount 도 함께 보존) */
  function normalizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    const raw = String(e.amount == null ? 0 : e.amount).replace(/[^0-9.-]/g, '');
    const amount = Number(raw);
    const row = {
      id: e.id || uid(),
      date: String(e.date || '').slice(0, 10) || todayISO(),
      type: e.type === 'income' ? 'income' : 'expense',
      category: e.category || '기타',
      text: e.text || '',
      amount: Number.isFinite(amount) ? amount : 0
    };
    if (e.card) row.card = String(e.card).slice(0, 24);
    if (e.time) row.time = String(e.time).slice(0, 5);
    if (Number(e.discount)) row.discount = Number(e.discount) || 0;
    return row;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? mergeState(JSON.parse(raw)) : defaultState();
    } catch (err) {
      console.warn('저장된 데이터를 읽지 못했어요.', err);
      return defaultState();
    }
  }

  let state = load();

  function save() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('저장 공간이 가득 찼어요. 설정에서 백업 후 초기화해 주세요.');
      console.warn(err);
    }
  }

  /* ---------- 작은 도구 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  const kidName = (k) => state.settings.kidsLabels[k] || (k === 'c5' ? '초5' : '초3');

  const isDoneToday = (item) => !!item.done && item.doneDate === todayISO();

  /* ---------- 시계 ---------- */
  function renderClock() {
    const now = new Date();
    $('#todayDate').textContent = dateFmtKo.format(now);

    const parts = timeFmtKo.formatToParts(now);
    const ampm = (parts.find((p) => p.type === 'dayPeriod') || {}).value || '';
    const hh = (parts.find((p) => p.type === 'hour') || {}).value || '--';
    const mm = (parts.find((p) => p.type === 'minute') || {}).value || '--';
    $('#clockAmpm').textContent = ampm;
    $('#clockTime').textContent = `${pad2(parseInt(hh, 10) || 0)}:${mm}`;
  }

  /* ---------- 날씨 (통영) ---------- */
  const WMO = {
    0: ['맑음', '☀️'], 1: ['대체로 맑음', '🌤️'], 2: ['구름 조금', '⛅'], 3: ['흐림', '☁️'],
    45: ['안개', '🌫️'], 48: ['서리 안개', '🌫️'],
    51: ['약한 이슬비', '🌦️'], 53: ['이슬비', '🌦️'], 55: ['강한 이슬비', '🌦️'],
    56: ['어는 이슬비', '🌧️'], 57: ['어는 이슬비', '🌧️'],
    61: ['약한 비', '🌧️'], 63: ['비', '🌧️'], 65: ['강한 비', '🌧️'],
    66: ['어는 비', '🌧️'], 67: ['어는 비', '🌧️'],
    71: ['약한 눈', '🌨️'], 73: ['눈', '🌨️'], 75: ['많은 눈', '❄️'], 77: ['눈날림', '🌨️'],
    80: ['약한 소나기', '🌦️'], 81: ['소나기', '🌦️'], 82: ['강한 소나기', '⛈️'],
    85: ['눈 소나기', '🌨️'], 86: ['많은 눈', '❄️'],
    95: ['뇌우', '⛈️'], 96: ['뇌우·우박', '⛈️'], 99: ['뇌우·우박', '⛈️']
  };
  const wmo = (code) => WMO[code] || ['—', '🌡️'];

  function pmGrade(pm10, pm25) {
    const g10 = pm10 == null ? null : pm10 <= 30 ? '좋음' : pm10 <= 80 ? '보통' : pm10 <= 150 ? '나쁨' : '매우나쁨';
    const g25 = pm25 == null ? null : pm25 <= 15 ? '좋음' : pm25 <= 35 ? '보통' : pm25 <= 75 ? '나쁨' : '매우나쁨';
    const rank = { '좋음': 0, '보통': 1, '나쁨': 2, '매우나쁨': 3 };
    const worst = [g10, g25].filter(Boolean).sort((a, b) => rank[b] - rank[a])[0] || null;
    const cls = worst === '좋음' ? 'good' : worst === '보통' ? 'soso' : worst ? 'bad' : '';
    return { grade: worst, cls };
  }

  async function loadWeather() {
    const main = $('#weatherMain');
    const row = $('#forecastRow');

    const forecastUrl = 'https://api.open-meteo.com/v1/forecast?latitude=34.8544&longitude=128.4332'
      + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
      + '&timezone=Asia%2FSeoul&forecast_days=7&wind_speed_unit=ms';
    const airUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=34.8544&longitude=128.4332'
      + '&current=pm10,pm2_5&timezone=Asia%2FSeoul';

    main.innerHTML = '<p class="weather-loading">🌤️ 날씨를 불러오는 중…</p>';
    row.innerHTML = '';

    const [fc, aq] = await Promise.allSettled([
      fetch(forecastUrl).then((r) => { if (!r.ok) throw new Error('forecast ' + r.status); return r.json(); }),
      fetch(airUrl).then((r) => { if (!r.ok) throw new Error('air ' + r.status); return r.json(); })
    ]);

    if (fc.status !== 'fulfilled' || !fc.value || !fc.value.current) {
      main.innerHTML = '<div class="weather-error"><span>🌧️ 통영 날씨를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</span>'
        + '<button type="button" id="weatherRetry">다시 시도</button></div>';
      const btn = $('#weatherRetry');
      if (btn) btn.addEventListener('click', loadWeather);
      return;
    }

    const cur = fc.value.current;
    const [desc, icon] = wmo(cur.weather_code);
    const temp = Math.round(cur.temperature_2m);
    const feel = Math.round(cur.apparent_temperature);
    const hum = Math.round(cur.relative_humidity_2m);
    const wind = Math.round(cur.wind_speed_10m * 10) / 10;

    let pmHtml = '';
    if (aq.status === 'fulfilled' && aq.value && aq.value.current) {
      const pm10 = aq.value.current.pm10;
      const pm25 = aq.value.current.pm2_5;
      const g = pmGrade(pm10, pm25);
      if (g.grade) {
        pmHtml = `<span class="pm-chip ${g.cls}" title="초미세먼지 ${pm25 != null ? pm25 + '㎍/㎥' : '-'}">`
          + `미세먼지 ${g.grade}</span>`;
      }
    }

    main.innerHTML = `
      <div class="weather-now">
        <span class="weather-icon" aria-hidden="true">${icon}</span>
        <span class="weather-temp">${temp}<small>℃</small></span>
        <div class="weather-meta">
          <p class="weather-desc">${escapeHtml(desc)} · 통영</p>
          <p class="weather-sub">체감 ${feel}℃ · 습도 ${hum}% · 바람 ${wind}m/s</p>
        </div>
      </div>
      <div class="pm-chips">${pmHtml}</div>`;

    const daily = fc.value.daily;
    if (daily && daily.time) {
      const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
      const today = todayISO();
      row.innerHTML = daily.time.map((d, i) => {
        const [dDesc, dIcon] = wmo(daily.weather_code[i]);
        const dt = new Date(d + 'T00:00:00+09:00');
        const nm = d === today ? '오늘' : DAYS[dt.getDay()];
        const hi = Math.round(daily.temperature_2m_max[i]);
        const lo = Math.round(daily.temperature_2m_min[i]);
        const rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : null;
        return `<div class="fc-day${d === today ? ' is-today' : ''}" title="${escapeHtml(dDesc)}${rain != null ? ' · 강수 ' + rain + '%' : ''}">
          <span class="fc-name">${nm}</span>
          <span class="fc-ico" aria-hidden="true">${dIcon}</span>
          <span class="fc-temp"><b>${hi}°</b> ${lo}°</span>
        </div>`;
      }).join('');
    }
  }

  /* ---------- 집계 ---------- */
  function allItems() {
    const out = [];
    KIDS.forEach((k) => {
      ['morning', 'after'].forEach((g) => {
        (state.kids[k][g] || []).forEach((s) => out.push({ done: isDoneToday(s) }));
      });
    });
    state.work.todos.forEach((t) => out.push({ done: !!t.done }));
    state.biz.todos.forEach((t) => out.push({ done: !!t.done }));
    return out;
  }

  function kidStats(k, group) {
    const list = state.kids[k][group] || [];
    const done = list.filter(isDoneToday).length;
    return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0, list };
  }

  function entryTotals(month) {
    const rows = state.money.entries.filter((e) => monthKey(e.date) === month);
    const income = rows.filter((e) => e.type === 'income').reduce((a, e) => a + Number(e.amount || 0), 0);
    const expense = rows.filter((e) => e.type === 'expense').reduce((a, e) => a + Number(e.amount || 0), 0);
    return { rows, income, expense };
  }

  /* ---------- 대시보드 ---------- */
  function renderHome() {
    const items = allItems();
    const total = items.length;
    const done = items.filter((i) => i.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const overallFill = $('#overallFill');
    overallFill.style.width = pct + '%';
    $('#overallPct').textContent = pct + '%';
    $('#overallCount').textContent = `${done} / ${total} 완료`;
    const bar = $('#overallBar');
    bar.setAttribute('aria-valuenow', String(pct));

    const kidItems = [];
    let kidDone = 0;
    let kidTotal = 0;
    KIDS.forEach((k) => ['morning', 'after'].forEach((g) => {
      const st = kidStats(k, g);
      kidItems.push(`${st.done}`);
      kidDone += st.done;
      kidTotal += st.total;
    }));

    const workDone = state.work.todos.filter((t) => t.done).length;
    const bizDone = state.biz.todos.filter((t) => t.done).length;
    $('#overallBreak').innerHTML = [
      `아이 <b>${kidDone}/${kidTotal}</b>`,
      `업무 <b>${workDone}/${state.work.todos.length}</b>`,
      `사업 <b>${bizDone}/${state.biz.todos.length}</b>`
    ].join(' · ');

    renderCountdown();

    // 아이들 요약
    const homeKids = $('#homeKids');
    homeKids.innerHTML = KIDS.map((k) => {
      const m = kidStats(k, 'morning');
      const a = kidStats(k, 'after');
      const next = m.list.find((s) => !isDoneToday(s)) || a.list.find((s) => !isDoneToday(s));
      return `<div class="kid-row">
        <div class="kid-row-top">
          <span class="kid-name">${escapeHtml(state.kids[k].avatar || '🧒')} ${escapeHtml(kidName(k))}</span>
          <span class="pill ${m.done === m.total && m.total ? 'pill-mint' : 'pill-sky'}">등원 ${m.done}/${m.total}</span>
        </div>
        <div class="bar pink"><span style="width:${m.pct}%"></span></div>
        <p class="kid-next">${next ? `다음: <b>${escapeHtml(next.title)}</b>` : (m.total ? '등원 준비 끝! 🎉' : '루틴을 추가해 보세요')} · 하원 ${a.done}/${a.total}</p>
      </div>`;
    }).join('');

    // 업무 요약
    renderTodoSummary($('#homeWork'), state.work.todos, '할 일을 추가해 보세요');

    // 사업 요약
    renderTodoSummary($('#homeBiz'), state.biz.todos, '할 일을 추가해 보세요');
    $('#home-biz-h').textContent = '📦 에이치엠유통';

    // 가계부 요약
    const m = monthKey();
    const t = entryTotals(m);
    const budget = Number(state.money.budgets[m] || 0);
    const remain = budget - t.expense;
    const usedPct = budget > 0 ? Math.min(100, Math.round((t.expense / budget) * 100)) : 0;
    if (!budget && !t.rows.length) {
      $('#homeMoney').innerHTML = `
        <div class="empty-box">예산을 설정하면 이번 달 지출과 남은 금액을 한눈에 보여드려요.</div>
        <button type="button" class="link-btn" data-goto="money">＋ 예산 설정하러 가기</button>`;
      return;
    }
    $('#homeMoney').innerHTML = `
      <div>
        <p class="money-big">${won(t.expense)}<small>이번 달 지출</small></p>
        <div class="bar ${budget > 0 && t.expense > budget ? 'pink' : ''}" style="margin-top:8px"><span style="width:${usedPct}%"></span></div>
      </div>
      <div class="money-rows">
        <span>예산 <b>${budget > 0 ? won(budget) : '미설정'}</b></span>
        <span>${budget > 0 ? (remain >= 0 ? '남은 금액' : '초과') + ` <b class="${remain < 0 ? 'over' : ''}">${won(Math.abs(remain))}</b>` : '수입 <b>' + won(t.income) + '</b>'}</span>
      </div>`;
  }

  function renderTodoSummary(el, todos, emptyMsg) {
    const undone = todos.filter((t) => !t.done)
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
    const done = todos.filter((t) => t.done).length;
    if (!todos.length) {
      el.innerHTML = `<div class="empty-box">${emptyMsg}</div>`;
      return;
    }
    const list = undone.slice(0, 3);
    el.innerHTML = `
      <div class="kid-row-top">
        <span class="kid-name">오늘 남은 일</span>
        <span class="pill pill-lav">${done}/${todos.length} 완료</span>
      </div>
      ${list.length ? `<ul class="mini-list">${list.map((t) => `
        <li class="mini-item"><span class="pdot ${t.priority || 'mid'}"></span><span class="txt">${escapeHtml(t.text)}</span></li>`).join('')}
      </ul>` : '<p class="kid-next">모두 끝났어요 🎉</p>'}
      ${undone.length > 3 ? `<p class="kid-next">+ ${undone.length - 3}개 더 있어요</p>` : ''}`;
  }

  function renderCountdown() {
    const el = $('#countdown');
    const hint = $('#heroHint');
    const nowParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const nowH = Number((nowParts.find((p) => p.type === 'hour') || {}).value || 0);
    const nowM = Number((nowParts.find((p) => p.type === 'minute') || {}).value || 0);
    const [th, tm] = String(state.settings.departTime || '08:50').split(':').map(Number);
    const cur = nowH * 60 + nowM;
    const target = (th || 0) * 60 + (tm || 0);
    const diff = target - cur;
    const label = state.settings.goalLabel || '출발';

    $$('[data-goal-label]').forEach((n) => { n.textContent = label; });

    if (diff > 60) {
      const h = Math.floor(diff / 60), m = diff % 60;
      el.innerHTML = `<b>${h}시간${m ? ' ' + m + '분' : ''}</b> 남았어요`;
      hint.textContent = `오늘 ${label} 시간 ${pad2(th)}:${pad2(tm)}`;
    } else if (diff > 0) {
      el.innerHTML = `<b>${diff}분</b> 남았어요`;
      hint.textContent = `오늘 ${label} 시간 ${pad2(th)}:${pad2(tm)}`;
    } else if (diff === 0) {
      el.innerHTML = `지금 <b>${label}</b> 시간이에요!`;
      hint.textContent = '준비물 한 번 더 확인해요';
    } else {
      const over = -diff;
      el.innerHTML = `${label} 시간이 <b>${over >= 60 ? Math.floor(over / 60) + '시간 ' : ''}${over % 60}분</b> 지났어요`;
      hint.textContent = '오늘도 수고 많았어요 🌷';
    }
    const m = KIDS.map((k) => kidStats(k, 'morning'));
    const d = m.reduce((a, s) => a + s.done, 0);
    const t = m.reduce((a, s) => a + s.total, 0);
    el.title = `아침 준비 ${d}/${t}`;
  }

  /* ---------- 아이들 케어 ---------- */
  function renderKids() {
    const view = state.ui.kidsView || 'c5';
    $$('#kidsSwitch .seg-btn').forEach((b) => {
      const on = b.dataset.kid === view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const targets = view === 'both' ? KIDS : [view];
    $('#kidsBody').innerHTML = targets.map((k) => {
      const m = kidStats(k, 'morning');
      const a = kidStats(k, 'after');
      const avatar = state.kids[k].avatar || (k === 'c5' ? '🧒' : '👧');
      return `<section class="kid-block theme-${k}">
        <header class="kid-block-head">
          <div class="kid-block-title"><span class="kid-avatar" aria-hidden="true">${escapeHtml(avatar)}</span>${escapeHtml(kidName(k))}</div>
          <div class="kid-progress">
            <span class="pill pill-mint">등원 ${m.done}/${m.total}</span>
            <div class="bar"><span style="width:${m.pct}%"></span></div>
            <span class="pct">${m.pct}%</span>
          </div>
        </header>
        ${routineBlock(k, 'morning', '🌤️ 등원 준비', '아침에 하나씩')}
        ${routineBlock(k, 'after', '🏡 하원·숙제 루틴', '집에 와서 하나씩')}
      </section>`;
    }).join('');
  }

  function routineBlock(k, group, title, hint) {
    const st = kidStats(k, group);
    const steps = st.list.map((s, i) => {
      const done = isDoneToday(s);
      return `<div class="step${done ? ' is-done' : ''}" role="button" tabindex="0" aria-pressed="${done}" data-toggle-step data-kid="${k}" data-group="${group}" data-id="${s.id}">
        <span class="step-no">${i + 1}</span>
        <span class="step-check" aria-hidden="true">✓</span>
        <span class="step-ico" aria-hidden="true">${escapeHtml(s.icon || '⭐')}</span>
        <span class="step-title">${escapeHtml(s.title)}</span>
        ${s.note ? `<span class="step-note">${escapeHtml(s.note)}</span>` : ''}
        <span class="step-tools">
          <button type="button" data-edit-step data-kid="${k}" data-group="${group}" data-id="${s.id}" aria-label="${escapeHtml(s.title)} 수정">✎</button>
          <button type="button" data-del-step data-kid="${k}" data-group="${group}" data-id="${s.id}" aria-label="${escapeHtml(s.title)} 삭제">🗑</button>
        </span>
      </div>`;
    }).join('');

    return `<div class="routine-block">
      <div class="routine-head">
        <div class="routine-title">${title} <span class="cnt">${st.done}/${st.total}</span></div>
        <span class="hint">${hint}</span>
      </div>
      <div class="steps">
        ${steps}
        <button type="button" class="add-step" data-add-step data-kid="${k}" data-group="${group}">
          <span aria-hidden="true" style="font-size:20px">＋</span>
          <span>단계 추가</span>
        </button>
      </div>
    </div>`;
  }

  /* ---------- 업무 / 사업 ---------- */
  function renderWorkAll() {
    renderTodoList($('#workToday'), state.work.todos.filter((t) => (t.when || 'today') === 'today'), '오늘 할 일', 'work', 'today');
    renderTodoList($('#workWeek'), state.work.todos.filter((t) => t.when === 'week'), '이번 주 할 일', 'work', 'week');
    renderMemo($('#workMemo'), 'work', '💡 빠른 메모', '여기에 자유롭게 메모하세요. 입력하면 자동 저장돼요.');
  }

  function renderBizAll() {
    renderTodoList($('#bizToday'), state.biz.todos.filter((t) => (t.when || 'today') === 'today'), '오늘 할 일', 'biz', 'today');
    renderTodoList($('#bizWeek'), state.biz.todos.filter((t) => t.when === 'week'), '이번 주 할 일', 'biz', 'week');
    renderMemo($('#bizMemo'), 'biz', '📝 사업 메모', '거래처, 발주, 일정 등 챙길 내용을 적어 두세요.');
  }

  function renderTodoList(el, todos, title, key, when) {
    if (!el) return;
    const done = todos.filter((t) => t.done).length;
    const sorted = todos.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    });
    const rows = sorted.map((t) => `
      <div class="todo${t.done ? ' is-done' : ''}">
        <button type="button" class="todo-check" data-toggle-todo="${key}" data-id="${t.id}" aria-pressed="${t.done}" aria-label="${escapeHtml(t.text)} 완료 표시">✓</button>
        <div class="todo-main">
          <span class="todo-text">${escapeHtml(t.text)}</span>
          <span class="todo-sub">
            <span class="tag ${t.priority || 'mid'}">${PRIORITY[t.priority] || '보통'}</span>
            ${t.when === 'week' ? '<span class="tag date">이번 주</span>' : '<span class="tag date">오늘</span>'}
            ${t.note ? `<span class="todo-note">${escapeHtml(t.note)}</span>` : ''}
          </span>
        </div>
        <div class="todo-tools">
          <button type="button" data-edit-todo="${key}" data-id="${t.id}" aria-label="수정">✎</button>
          <button type="button" data-del-todo="${key}" data-id="${t.id}" aria-label="삭제">🗑</button>
        </div>
      </div>`).join('');

    el.innerHTML = `
      <div class="list-head">
        <h3>${title} <span class="count">${done}/${todos.length}</span></h3>
        <div style="display:flex;gap:4px">
          ${done ? `<button type="button" class="link-btn" data-clear-done="${key}">완료 지우기</button>` : ''}
          <button type="button" class="link-btn" data-add-todo="${key}" data-when="${when}">＋ 추가</button>
        </div>
      </div>
      ${rows || '<div class="empty-box">아직 없어요. ＋ 추가로 하나 만들어 보세요.</div>'}`;
  }

  function renderMemo(el, key, title, placeholder) {
    if (!el) return;
    const val = state[key].memo || '';
    if (el.dataset.rendered === '1' && document.activeElement && el.contains(document.activeElement)) return;
    el.innerHTML = `
      <div class="list-head"><h3>${title}</h3><span class="count" data-memo-count>${val.length}자</span></div>
      <textarea data-memo="${key}" placeholder="${placeholder}" aria-label="${title}">${escapeHtml(val)}</textarea>
      <p class="memo-hint">입력하는 대로 자동 저장돼요.</p>`;
    el.dataset.rendered = '1';
  }

  /* ---------- 가계부 ---------- */
  function renderMoney() {
    const month = state.ui.month || monthKey();
    const t = entryTotals(month);
    const budget = Number(state.money.budgets[month] || 0);
    const remain = budget - t.expense;
    const pct = budget > 0 ? Math.min(100, Math.round((t.expense / budget) * 100)) : 0;

    const [y, mm] = month.split('-');
    $('#monthLabel').textContent = `${y}년 ${Number(mm)}월`;

    $('#budgetCard').innerHTML = `
      <div class="budget-head">
        <h3>${Number(mm)}월 예산</h3>
        <button type="button" class="link-btn" data-set-budget>예산 ${budget > 0 ? '수정' : '설정'}</button>
      </div>
      <div class="budget-line">
        <span class="money-big">${won(t.expense)}</span>
        <small class="hint">이번 달 지출</small>
      </div>
      <div class="bar ${remain < 0 ? 'pink' : ''}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
      <div class="budget-meta">
        <span>${budget > 0 ? `예산 ${won(budget)}` : '예산을 설정해 보세요'}</span>
        <span>${budget > 0 ? (remain >= 0 ? `남은 금액 <b>${won(remain)}</b>` : `<b class="over">${won(-remain)} 초과</b>`) : ''}</span>
      </div>
      <div class="money-rows">
        <span>수입 <b>${won(t.income)}</b></span>
        <span>지출 <b>${won(t.expense)}</b></span>
        <span>기록 <b>${t.rows.length}건</b></span>
      </div>`;

    const today = todayISO();
    $('#moneyForm').innerHTML = `
      <div class="list-head"><h3>＋ 빠른 기록</h3><span class="hint">금액을 입력하고 추가</span></div>
      <form class="add-form" id="quickForm" autocomplete="off">
        <div class="field full">
          <div class="type-toggle" id="typeToggle">
            <button type="button" class="is-active expense" data-type="expense">지출</button>
            <button type="button" data-type="income">수입</button>
          </div>
        </div>
        <div class="field"><label for="q-date">날짜</label><input type="date" id="q-date" value="${today}" max="2099-12-31"></div>
        <div class="field"><label for="q-cat">분류</label><select id="q-cat">${EXPENSE_CATS.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="field full"><label for="q-text">내용</label><input type="text" id="q-text" placeholder="예: 마트 장보기" maxlength="60"></div>
        <div class="field full"><label for="q-amount">금액</label><input type="number" id="q-amount" placeholder="0" min="0" step="1" inputmode="numeric"></div>
        <div class="field full"><button type="submit" class="btn btn-pink" style="width:100%">기록 추가</button></div>
      </form>`;

    // 카테고리 합계
    const byCat = {};
    t.rows.filter((e) => e.type === 'expense').forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0);
    });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const max = cats.length ? cats[0][1] : 0;
    $('#catCard').innerHTML = `
      <div class="list-head"><h3>📊 분류별 지출</h3><span class="count">${won(t.expense)}</span></div>
      <div class="cat-rows">
        ${cats.length ? cats.map(([c, amt]) => `
          <div class="cat-row">
            <span class="cat-name">${escapeHtml(c)}</span>
            <div class="cat-bar"><span style="width:${max ? Math.max(4, Math.round((amt / max) * 100)) : 0}%"></span></div>
            <span class="cat-amount">${won(amt)}</span>
          </div>`).join('') : '<p class="empty">이번 달 지출 기록이 없어요.</p>'}
      </div>`;

    // 내역 목록
    const groups = {};
    t.rows.forEach((e) => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dates = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));
    $('#moneyList').innerHTML = `
      <div class="list-head"><h3>🧾 ${Number(mm)}월 내역</h3><span class="count">${t.rows.length}건</span></div>
      ${dates.length ? dates.map((d) => {
        const list = groups[d].slice().sort((a, b) => b.id.localeCompare(a.id));
        const dayExp = list.filter((e) => e.type === 'expense').reduce((a, e) => a + Number(e.amount || 0), 0);
        const dayInc = list.filter((e) => e.type === 'income').reduce((a, e) => a + Number(e.amount || 0), 0);
        const dt = new Date(d + 'T00:00:00+09:00');
        const head = `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${'일월화수목금토'[dt.getDay()]})`;
        return `<div class="day-group">
          <div class="day-head"><span>${head}</span><span>${[dayInc ? '+' + won(dayInc) : '', dayExp ? '-' + won(dayExp) : ''].filter(Boolean).join(' · ')}</span></div>
          ${list.map((e) => `
            <div class="entry">
              <span class="entry-cat">${escapeHtml(e.category)}</span>
              <div class="entry-main">
                <span class="entry-memo">${escapeHtml(e.text || e.category)}</span>
                <span class="entry-date">${[e.card, e.type === 'income' ? '수입' : '지출'].filter(Boolean).map(escapeHtml).join(' · ')}</span>
              </div>
              <span class="entry-amount ${e.type}">${e.type === 'income' ? '+' : '-'}${won(e.amount)}</span>
              <button type="button" class="entry-del" data-del-entry="${e.id}" aria-label="삭제">🗑</button>
            </div>`).join('')}
        </div>`;
      }).join('') : '<div class="empty-box">아직 기록이 없어요. 위에서 첫 기록을 추가해 보세요.</div>'}`;
  }

  /* ---------- 탭 전환 ---------- */
  const RENDERERS = { home: renderHome, kids: renderKids, work: renderWorkAll, biz: renderBizAll, money: renderMoney };

  function showTab(tab, opts) {
    if (!RENDERERS[tab]) tab = 'home';
    state.ui.tab = tab;
    save();
    $$('.tab').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && b.scrollIntoView) {
        try { b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) { /* noop */ }
      }
    });
    $$('.panel').forEach((p) => { p.hidden = p.id !== 'panel-' + tab; });
    RENDERERS[tab]();
    if (!opts || opts.hash !== false) {
      try {
        if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
      } catch (e) { /* noop */ }
    }
  }

  function renderAll() {
    renderClock();
    renderHome();
    renderKids();
    renderWorkAll();
    renderBizAll();
    renderMoney();
  }

  /* ---------- 모달 ---------- */
  const modal = $('#modal');
  const modalForm = $('#modalForm');
  const modalBody = $('#modalBody');
  let modalSubmit = null;

  function openModal({ title, body, submitLabel = '저장', onSubmit, onMount }) {
    $('#modalTitle').textContent = title;
    modalBody.innerHTML = body;
    $('#modalSubmit').textContent = submitLabel;
    modalSubmit = onSubmit;
    if (modal.showModal) { if (!modal.open) modal.showModal(); } else modal.setAttribute('open', '');
    if (onMount) onMount(modalBody);
    const first = modalBody.querySelector('input, textarea, select');
    if (first) setTimeout(() => first.focus(), 60);
  }

  function closeModal() {
    if (modal.close) modal.close(); else modal.removeAttribute('open');
    modalSubmit = null;
  }

  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!modalSubmit) { closeModal(); return; }
    const keep = modalSubmit(modalBody);
    if (keep === false) return;
    closeModal();
  });
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('cancel', () => { modalSubmit = null; });

  const fieldHtml = ({ label, id, type = 'text', value = '', placeholder = '', min, max, step, full = true, rows }) => {
    const common = `id="${id}" name="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"`;
    const control = type === 'textarea'
      ? `<textarea id="${id}" name="${id}" placeholder="${escapeHtml(placeholder)}" rows="${rows || 3}">${escapeHtml(value)}</textarea>`
      : `<input type="${type}" ${common} ${min != null ? `min="${min}"` : ''} ${max != null ? `max="${max}"` : ''} ${step != null ? `step="${step}"` : ''}>`;
    return `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}</label>${control}</div>`;
  };

  function emojiPickerHtml(current) {
    return `<div class="field full"><label>아이콘</label>
      <input type="hidden" id="f-icon" value="${escapeHtml(current || '⭐')}">
      <div class="emoji-pick" id="emojiPick">
        ${EMOJIS.map((e) => `<button type="button" data-emoji="${e}" class="${e === current ? 'is-active' : ''}">${e}</button>`).join('')}
      </div></div>`;
  }

  function bindEmojiPicker(root) {
    const hidden = root.querySelector('#f-icon');
    const wrap = root.querySelector('#emojiPick');
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-emoji]');
      if (!b) return;
      hidden.value = b.dataset.emoji;
      $$('[data-emoji]', wrap).forEach((x) => x.classList.toggle('is-active', x === b));
    });
  }

  /* ---------- 아이들 단계 CRUD ---------- */
  function openStepModal({ kid, group, step }) {
    const isEdit = !!step;
    openModal({
      title: isEdit ? '단계 수정' : '단계 추가',
      body: `
        ${fieldHtml({ label: '단계 이름', id: 'f-title', value: step ? step.title : '', placeholder: '예: 세수·양치' })}
        ${emojiPickerHtml(step ? step.icon : '⭐')}
        ${fieldHtml({ label: '짧은 메모 (선택)', id: 'f-note', value: step ? step.note : '', placeholder: '예: 3분 안에' })}
        <p class="hint">${escapeHtml(kidName(kid))} · ${group === 'morning' ? '등원 준비' : '하원·숙제 루틴'}</p>`,
      submitLabel: isEdit ? '수정' : '추가',
      onMount: bindEmojiPicker,
      onSubmit: (root) => {
        const title = root.querySelector('#f-title').value.trim();
        if (!title) { toast('단계 이름을 입력해 주세요.'); return false; }
        const icon = root.querySelector('#f-icon').value || '⭐';
        const note = root.querySelector('#f-note').value.trim();
        if (isEdit) {
          Object.assign(step, { title, icon, note });
        } else {
          state.kids[kid][group].push({ id: uid(), title, icon, note, done: false, doneDate: null });
        }
        save(); renderKids(); renderHome();
        toast(isEdit ? '단계를 수정했어요.' : '단계를 추가했어요.');
      }
    });
  }

  function confirmModal({ title, message, confirmLabel = '삭제', onConfirm }) {
    openModal({
      title,
      body: `<p class="hint" style="font-size:13.5px;color:var(--ink-2);line-height:1.6">${escapeHtml(message)}</p>`,
      submitLabel: confirmLabel,
      onSubmit: () => { onConfirm(); }
    });
    const btn = $('#modalSubmit');
    btn.classList.remove('btn-pink');
    btn.classList.add('btn-danger');
    const reset = () => { btn.classList.add('btn-pink'); btn.classList.remove('btn-danger'); };
    setTimeout(() => {
      const closeBtn = $('#modalCancel');
      const obs = () => { reset(); };
      modal.addEventListener('close', obs, { once: true });
      closeBtn.addEventListener('click', () => setTimeout(reset, 0), { once: true });
    }, 0);
  }

  /* ---------- 업무/사업 CRUD ---------- */
  function openTodoModal({ key, todo, when }) {
    const isEdit = !!todo;
    const label = key === 'biz' ? '에이치엠유통' : '내 업무';
    openModal({
      title: (isEdit ? '할 일 수정' : '할 일 추가') + ' · ' + label,
      body: `
        ${fieldHtml({ label: '할 일', id: 'f-text', value: todo ? todo.text : '', placeholder: '예: 주간 보고서 정리' })}
        <div class="field"><label for="f-priority">중요도</label>
          <select id="f-priority">
            ${Object.entries(PRIORITY).map(([v, t]) => `<option value="${v}" ${(todo ? todo.priority : 'mid') === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="f-when">시기</label>
          <select id="f-when">
            <option value="today" ${((todo ? todo.when : when) || 'today') === 'today' ? 'selected' : ''}>오늘</option>
            <option value="week" ${(todo && todo.when === 'week') || (!todo && when === 'week') ? 'selected' : ''}>이번 주</option>
          </select>
        </div>
        ${fieldHtml({ label: '메모 (선택)', id: 'f-note', type: 'textarea', value: todo ? todo.note : '', placeholder: '자세한 내용이나 챙길 것' })}`,
      submitLabel: isEdit ? '수정' : '추가',
      onSubmit: (root) => {
        const text = root.querySelector('#f-text').value.trim();
        if (!text) { toast('할 일 내용을 입력해 주세요.'); return false; }
        const priority = root.querySelector('#f-priority').value;
        const whenV = root.querySelector('#f-when').value;
        const note = root.querySelector('#f-note').value.trim();
        if (isEdit) Object.assign(todo, { text, priority, when: whenV, note });
        else state[key].todos.push({ id: uid(), text, priority, when: whenV, note, done: false });
        save(); renderWorkAll(); renderBizAll(); renderHome();
        toast(isEdit ? '수정했어요.' : '추가했어요.');
      }
    });
  }

  /* ---------- 가계부 ---------- */
  function openBudgetModal() {
    const month = state.ui.month || monthKey();
    const [y, mm] = month.split('-');
    openModal({
      title: `${y}년 ${Number(mm)}월 예산`,
      body: `${fieldHtml({ label: '이번 달 예산 (원)', id: 'f-budget', type: 'number', value: state.money.budgets[month] || '', placeholder: '예: 1500000', min: 0, step: 10000 })}
        <p class="hint">0으로 저장하면 예산 설정이 해제돼요.</p>`,
      submitLabel: '저장',
      onSubmit: (root) => {
        const v = Number(root.querySelector('#f-budget').value) || 0;
        if (v > 0) state.money.budgets[month] = v; else delete state.money.budgets[month];
        save(); renderMoney(); renderHome();
        toast(v > 0 ? '예산을 저장했어요.' : '예산 설정을 해제했어요.');
      }
    });
  }

  /* 카드 내역 파일 불러오기 — 기존 기록은 남기고 새 내역만 더함 */
  const entryKey = (e) => [e.date, e.time || '', e.type || 'expense', e.card || '', e.category || '', e.text || '', Number(e.amount) || 0].join('|');

  const entryId = (date, time) => 'hc' + String(date || '').replace(/-/g, '') + String(time || '').replace(/:/g, '') + Math.random().toString(36).slice(2, 5);

  function importMoneyFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    input.value = '';
    const reader = new FileReader();
    reader.onerror = () => toast('파일을 읽지 못했어요.');
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(String(reader.result)); } catch (err) { parsed = null; }
      if (!parsed) { toast('JSON 파일을 읽지 못했어요. 파일을 확인해 주세요.'); return; }

      const list = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.entries) ? parsed.entries
        : (parsed.money && Array.isArray(parsed.money.entries)) ? parsed.money.entries
        : null;
      if (!list) { toast('가계부 내역(entries)을 찾지 못했어요. 카드 내역 파일인지 확인해 주세요.'); return; }

      const incoming = list.map(normalizeEntry).filter((e) => e && e.amount > 0);
      if (!incoming.length) { toast('불러올 내역이 없어요.'); return; }

      const seen = new Set(state.money.entries.map(entryKey));
      const fresh = [];
      incoming.forEach((e) => {
        const key = entryKey(e);
        if (seen.has(key)) return;
        seen.add(key);
        fresh.push(e);
      });
      const skipped = incoming.length - fresh.length;
      const sum = fresh.reduce((a, e) => a + e.amount, 0);
      const month = String(parsed.month || (fresh[0] && monthKey(fresh[0].date)) || state.ui.month || monthKey()).slice(0, 7);
      const title = parsed.title || '카드 내역 파일';

      openModal({
        title: '📥 가계부 파일 불러오기',
        body: `
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">${escapeHtml(title)}<br>파일: ${escapeHtml(file.name)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12.5px;color:var(--ink-3);margin:12px 0 8px">
            <span>읽은 내역 <b>${incoming.length}건</b></span>
            <span>새로 추가 <b>${fresh.length}건</b></span>
            ${skipped ? `<span>이미 있어 건너뜀 <b>${skipped}건</b></span>` : ''}
            <span>합계 <b>${won(sum)}</b></span>
          </div>
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">기존 기록과 예산은 그대로 두고 ${Number(month.split('-')[1])}월 가계부에 위 내역만 더해요.</p>`,
        submitLabel: fresh.length ? `${fresh.length}건 추가` : '닫기',
        onSubmit: () => {
          if (!fresh.length) return;
          state.money.entries = state.money.entries.concat(fresh.map((e) => ({ ...e, id: entryId(e.date, e.time) })));
          state.ui.month = month;
          save();
          renderMoney();
          renderHome();
          toast(`${fresh.length}건을 가계부에 더했어요.`);
        }
      });
    };
    reader.readAsText(file);
  }

  /* ---------- 설정 ---------- */
  function openSettings() {
    openModal({
      title: '⚙️ 설정',
      body: `
        <div class="field"><label for="s-depart">출발 시간</label>
          <input type="time" id="s-depart" value="${escapeHtml(state.settings.departTime)}">
        </div>
        <div class="field"><label for="s-goal">카운트다운 이름</label>
          <input type="text" id="s-goal" value="${escapeHtml(state.settings.goalLabel)}" placeholder="출발" maxlength="12">
        </div>
        <div class="field"><label for="s-c5">아이 1 이름표</label>
          <input type="text" id="s-c5" value="${escapeHtml(kidName('c5'))}" maxlength="10">
        </div>
        <div class="field"><label for="s-c3">아이 2 이름표</label>
          <input type="text" id="s-c3" value="${escapeHtml(kidName('c3'))}" maxlength="10">
        </div>
        <p class="hint">이름표는 이 기기에만 저장돼요. (인터넷에 올라가지 않아요)</p>

        <div class="settings-block">
          <h3>📦 데이터 백업 / 복원</h3>
          <p class="hint">입력한 내용은 이 브라우저에 저장돼요. 다른 기기로 옮기려면 아래에서 파일로 내보낸 뒤, 그 기기에서 가져오기를 눌러 주세요.</p>
          <div class="data-btns">
            <button type="button" class="btn btn-ghost" id="btnExport">⬇️ 파일로 내보내기</button>
            <button type="button" class="btn btn-ghost" id="btnImport">⬆️ 파일 가져오기</button>
            <button type="button" class="btn btn-danger" id="btnReset">초기화</button>
          </div>
          <input type="file" id="fileInput" accept="application/json,.json" class="file-input">
        </div>`,
      submitLabel: '저장',
      onMount: (root) => {
        root.querySelector('#btnExport').addEventListener('click', exportJson);
        const fileInput = root.querySelector('#fileInput');
        root.querySelector('#btnImport').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => importJson(fileInput));
        root.querySelector('#btnReset').addEventListener('click', () => {
          if (!window.confirm('모든 입력 내용을 지우고 처음 상태로 돌아갈까요? (되돌릴 수 없어요)')) return;
          localStorage.removeItem(STORAGE_KEY);
          state = defaultState();
          save();
          closeModal();
          showTab('home');
          renderAll();
          toast('처음 상태로 초기화했어요.');
        });
      },
      onSubmit: (root) => {
        const t = root.querySelector('#s-depart').value || '08:50';
        const goal = root.querySelector('#s-goal').value.trim() || '출발';
        const c5 = root.querySelector('#s-c5').value.trim() || '초5';
        const c3 = root.querySelector('#s-c3').value.trim() || '초3';
        Object.assign(state.settings, { departTime: t, goalLabel: goal, kidsLabels: { c5, c3 } });
        save(); renderAll();
        toast('설정을 저장했어요.');
      }
    });
  }

  function exportJson() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `우리집-대시보드-백업-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('백업 파일을 내려받았어요.');
  }

  function importJson(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!window.confirm('지금 기기의 내용을 이 파일로 바꿀까요? (현재 내용은 덮어써져요)')) return;
        state = mergeState(parsed);
        save();
        closeModal();
        renderAll();
        showTab(state.ui.tab || 'home');
        toast('파일을 가져왔어요.');
      } catch (err) {
        toast('파일을 읽지 못했어요. 백업 파일인지 확인해 주세요.');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;

    const tabBtn = t.closest('.tab');
    if (tabBtn) { showTab(tabBtn.dataset.tab); return; }

    const goto = t.closest('[data-goto]');
    if (goto) { showTab(goto.dataset.goto); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    // 아이 전환
    const seg = t.closest('#kidsSwitch .seg-btn');
    if (seg) { state.ui.kidsView = seg.dataset.kid; save(); renderKids(); return; }

    // 단계 완료 토글 (수정·삭제 버튼은 제외)
    const step = t.closest('[data-toggle-step]');
    if (step && !t.closest('[data-edit-step]') && !t.closest('[data-del-step]')) {
      const { kid, group, id } = step.dataset;
      const item = (state.kids[kid][group] || []).find((s) => s.id === id);
      if (!item) return;
      const nowDone = !isDoneToday(item);
      item.done = nowDone;
      item.doneDate = nowDone ? todayISO() : null;
      save(); renderKids(); renderHome();
      if (nowDone) toast(`✓ ${item.title} 완료!`);
      return;
    }

    const editStep = t.closest('[data-edit-step]');
    if (editStep) {
      const { kid, group, id } = editStep.dataset;
      const item = (state.kids[kid][group] || []).find((s) => s.id === id);
      if (item) openStepModal({ kid, group, step: item });
      return;
    }

    const delStep = t.closest('[data-del-step]');
    if (delStep) {
      const { kid, group, id } = delStep.dataset;
      const list = state.kids[kid][group] || [];
      const item = list.find((s) => s.id === id);
      if (!item) return;
      confirmModal({
        title: '단계 삭제',
        message: `'${item.title}' 단계를 지울까요?`,
        onConfirm: () => {
          state.kids[kid][group] = list.filter((s) => s.id !== id);
          save(); renderKids(); renderHome(); toast('삭제했어요.');
        }
      });
      return;
    }

    const addStep = t.closest('[data-add-step]');
    if (addStep) { openStepModal({ kid: addStep.dataset.kid, group: addStep.dataset.group }); return; }

    // 업무/사업
    const addTodo = t.closest('[data-add-todo]');
    if (addTodo) { openTodoModal({ key: addTodo.dataset.addTodo, when: addTodo.dataset.when || 'today' }); return; }

    const toggleTodo = t.closest('[data-toggle-todo]');
    if (toggleTodo) {
      const key = toggleTodo.dataset.toggleTodo;
      const item = state[key].todos.find((x) => x.id === toggleTodo.dataset.id);
      if (!item) return;
      item.done = !item.done;
      item.doneAt = item.done ? new Date().toISOString() : null;
      save(); renderWorkAll(); renderBizAll(); renderHome();
      return;
    }

    const editTodo = t.closest('[data-edit-todo]');
    if (editTodo) {
      const key = editTodo.dataset.editTodo;
      const item = state[key].todos.find((x) => x.id === editTodo.dataset.id);
      if (item) openTodoModal({ key, todo: item });
      return;
    }

    const delTodo = t.closest('[data-del-todo]');
    if (delTodo) {
      const key = delTodo.dataset.delTodo;
      const item = state[key].todos.find((x) => x.id === delTodo.dataset.id);
      if (!item) return;
      confirmModal({
        title: '할 일 삭제',
        message: `'${item.text}' 을(를) 지울까요?`,
        onConfirm: () => {
          state[key].todos = state[key].todos.filter((x) => x.id !== item.id);
          save(); renderWorkAll(); renderBizAll(); renderHome(); toast('삭제했어요.');
        }
      });
      return;
    }

    const clearDone = t.closest('[data-clear-done]');
    if (clearDone) {
      const key = clearDone.dataset.clearDone;
      state[key].todos = state[key].todos.filter((x) => !x.done);
      save(); renderWorkAll(); renderBizAll(); renderHome(); toast('완료한 일을 정리했어요.');
      return;
    }

    // 가계부
    const setBudget = t.closest('[data-set-budget]');
    if (setBudget) { openBudgetModal(); return; }

    if (t.closest('#moneyImportBtn')) {
      const fi = $('#moneyFileInput');
      if (fi) fi.click();
      return;
    }

    const delEntry = t.closest('[data-del-entry]');
    if (delEntry) {
      const item = state.money.entries.find((x) => x.id === delEntry.dataset.delEntry);
      if (!item) return;
      confirmModal({
        title: '기록 삭제',
        message: `${item.date} ${item.category} ${won(item.amount)} 기록을 지울까요?`,
        onConfirm: () => {
          state.money.entries = state.money.entries.filter((x) => x.id !== item.id);
          save(); renderMoney(); renderHome(); toast('삭제했어요.');
        }
      });
      return;
    }

    const typeBtn = t.closest('#typeToggle button');
    if (typeBtn) {
      const wrap = $('#typeToggle');
      $$('button', wrap).forEach((b) => {
        b.classList.toggle('is-active', b === typeBtn);
        b.classList.toggle('expense', b === typeBtn && typeBtn.dataset.type === 'expense');
        b.classList.toggle('income', b === typeBtn && typeBtn.dataset.type === 'income');
      });
      const cats = typeBtn.dataset.type === 'income' ? INCOME_CATS : EXPENSE_CATS;
      const sel = $('#q-cat');
      if (sel) sel.innerHTML = cats.map((c) => `<option>${c}</option>`).join('');
      return;
    }

    if (t.id === 'settingsBtn' || t.closest('#settingsBtn')) { openSettings(); return; }

    if (t.id === 'prevMonth') {
      state.ui.month = shiftMonth(state.ui.month || monthKey(), -1);
      save(); renderMoney(); return;
    }
    if (t.id === 'nextMonth') {
      state.ui.month = shiftMonth(state.ui.month || monthKey(), 1);
      save(); renderMoney(); return;
    }
  });

  // 빠른 기록 폼
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'quickForm') return;
    e.preventDefault();
    const type = ($('#typeToggle .is-active') || {}).dataset ? $('#typeToggle .is-active').dataset.type : 'expense';
    const date = $('#q-date').value || todayISO();
    const category = $('#q-cat').value;
    const text = $('#q-text').value.trim();
    const amount = Number($('#q-amount').value);
    if (!amount || amount <= 0) { toast('금액을 입력해 주세요.'); return; }
    state.money.entries.push({ id: uid(), date, type, category, text, amount });
    if (monthKey(date) !== (state.ui.month || monthKey())) state.ui.month = monthKey(date);
    save(); renderMoney(); renderHome();
    toast('기록을 추가했어요.');
  });

  // 메모 자동 저장
  document.addEventListener('input', (e) => {
    const ta = e.target.closest('[data-memo]');
    if (!ta) return;
    const key = ta.dataset.memo;
    state[key].memo = ta.value;
    const cnt = ta.parentElement.querySelector('[data-memo-count]');
    if (cnt) cnt.textContent = ta.value.length + '자';
    clearTimeout(window.__memoTimer);
    window.__memoTimer = setTimeout(save, 350);
  });

  // 단계 카드 키보드 조작
  document.addEventListener('keydown', (e) => {
    const step = e.target.closest && e.target.closest('[data-toggle-step]');
    if (step && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      step.click();
    }
  });

  function shiftMonth(month, delta) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
  }

  /* ---------- 시작 ---------- */
  renderAll();
  const hashTab = (location.hash || '').replace('#', '');
  showTab(RENDERERS[hashTab] ? hashTab : (state.ui.tab || 'home'));
  window.addEventListener('hashchange', () => {
    const t = (location.hash || '').replace('#', '');
    if (RENDERERS[t] && t !== state.ui.tab) showTab(t);
  });
  loadWeather();

  const moneyFileInput = $('#moneyFileInput');
  if (moneyFileInput) moneyFileInput.addEventListener('change', () => importMoneyFile(moneyFileInput));

  setInterval(() => { renderClock(); renderCountdown(); }, 1000 * 20);

  let lastDay = todayISO();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      renderClock();
      if (todayISO() !== lastDay) {
        lastDay = todayISO();
        renderAll();
      }
    }
  });

  // 날씨는 30분마다 갱신
  setInterval(loadWeather, 1000 * 60 * 30);
})();
