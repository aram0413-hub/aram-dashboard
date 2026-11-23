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
  const fmtNum = (n) => (Number(n) || 0).toLocaleString('ko-KR');

  /* ---------- 기본 데이터 ---------- */
  /* 설정 기본값 (⚙️ 설정 > 기본값으로 되돌리기의 기준) */
  const DEFAULT_SETTINGS = () => ({
    appName: '우리집 대시보드',
    bizName: '에이치엠유통',
    moneyLabel: '집 가계부',
    departTime: '08:50',
    goalLabel: '출발',
    kidsLabels: { c5: '초5', c3: '초3' }
  });

  const defaultState = () => ({
    version: 1,
    updatedAt: null,
    settings: DEFAULT_SETTINGS(),
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
    fixed: { items: [], months: {} },
    sales: {
      activeYear: Number(monthKey().slice(0, 4)),
      business: { name: '', regNo: '' },
      source: '',
      updatedAt: null,
      months: {},
      partners: { sales: [], purchase: [] },
      vatReturns: [],
      notes: []
    },
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

    /* 고정지출: 항목 + 달마다의 실제 금액·납부 완료 표시 */
    s.fixed = { items: [], months: {}, ...(saved.fixed || {}) };
    s.fixed.items = Array.isArray((saved.fixed || {}).items)
      ? saved.fixed.items.map((i) => normalizeFixedItem(i)).filter(Boolean) : [];
    const fxMonths = {};
    const rawMonths = (saved.fixed && saved.fixed.months) || {};
    Object.keys(rawMonths).forEach((m) => {
      if (!/^\d{4}-\d{2}$/.test(m)) return;
      const src = rawMonths[m] || {};
      const actual = {};
      const paid = {};
      Object.keys(src.actual || {}).forEach((id) => {
        const v = Number(src.actual[id]);
        if (Number.isFinite(v)) actual[id] = v;
      });
      Object.keys(src.paid || {}).forEach((id) => { if (src.paid[id]) paid[id] = true; });
      if (Object.keys(actual).length || Object.keys(paid).length) fxMonths[m] = { actual, paid };
    });
    s.fixed.months = fxMonths;

    /* 매출·매입: 파일에서 온 값도 같은 모양으로 (실제 금액은 이 기기에만) */
    s.sales = normalizeSalesState(saved.sales);
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

  /* 고정지출 항목 한 줄 맞추기 (파일에서 온 값도 같은 모양으로) */
  function normalizeFixedItem(raw, defaultScope) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.name || raw.title || raw.text || '').trim().slice(0, 40);
    if (!name) return null;
    const toNum = (v) => {
      const n = Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    };
    const scope = raw.scope === 'home' || raw.scope === 'biz' ? raw.scope : (defaultScope || 'biz');
    return {
      id: String(raw.id || uid()).slice(0, 40),
      scope,
      name,
      amount: toNum(raw.amount),
      day: String(raw.day == null ? '' : raw.day).trim().slice(0, 12),
      method: String(raw.method || raw.pay || raw.memo || '').trim().slice(0, 40),
      due: String(raw.due || '').trim().slice(0, 12),
      note: String(raw.note || '').trim().slice(0, 80),
      kind: raw.kind === 'annual' ? 'annual' : 'month'
    };
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
    cloudSchedulePush();
  }

  /* ---------- ☁️ 클라우드 동기화 (Google 로그인 · Firestore) ---------- */
  const CLOUD = {
    ready: false, user: null, status: 'off', lastSync: null,
    error: '', applying: false, pushing: false, pending: false
  };
  const CLOUD_BACKUP_KEY = STORAGE_KEY + '.cloud-backup';
  const CLOUD_META_KEY = STORAGE_KEY + '.cloud-meta';
  let cloudPushTimer = null;
  let lastPushedJson = '';
  let pendingRemote = null;
  let pendingRemoteTimer = null;
  let cloudRetryTimer = null;
  let cloudRetryCount = 0;

  const cloudApi = () => window.DashboardSync || null;

  /* 키 순서에 흔들리지 않는 비교용 문자열 */
  function stableStringify(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
  }

  function cloudPayloadKey(s) {
    try {
      const copy = JSON.parse(JSON.stringify(s));
      delete copy.ui;
      delete copy.updatedAt;
      return stableStringify(copy);
    } catch (err) {
      return String(Date.now());
    }
  }

  /* 이 기기·클라우드 내용을 같은 규칙으로 정규화한 뒤 비교한다 */
  function cloudKeyOf(s) {
    let norm = s;
    try { norm = mergeState(s); } catch (err) { /* 원본 사용 */ }
    return cloudPayloadKey(norm);
  }

  function backupLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.setItem(CLOUD_BACKUP_KEY, raw);
    } catch (err) { console.warn(err); }
  }

  /* 이 기기가 마지막으로 클라우드와 맞춘 내용(내용 서명)을 기억해 둔다 */
  function cloudMetaRead() {
    try { return JSON.parse(localStorage.getItem(CLOUD_META_KEY) || '{}') || {}; } catch (err) { return {}; }
  }
  function cloudMetaWrite(uid, key) {
    try {
      localStorage.setItem(CLOUD_META_KEY, JSON.stringify({ uid: uid || '', key: key || '', at: new Date().toISOString() }));
    } catch (err) { console.warn(err); }
  }

  function cloudStatusLabel() {
    if (!CLOUD.ready) return '동기화 연결 준비 중…';
    if (CLOUD.error === 'permission-denied' || CLOUD.status === 'denied') return '이 계정으로는 동기화할 수 없어요';
    if (!CLOUD.user) return '로그인하면 폰·패드가 같은 내용을 봐요';
    if (CLOUD.status === 'saving' || CLOUD.status === 'dirty') return '저장하는 중…';
    if (CLOUD.status === 'offline') return '연결되면 다시 저장할게요';
    if (CLOUD.lastSync) return '마지막 동기화 ' + timeFmtKo.format(CLOUD.lastSync);
    return '동기화 준비됨';
  }

  function cloudBtnLabel() {
    if (!CLOUD.ready) return '동기화';
    if (CLOUD.error === 'permission-denied' || CLOUD.status === 'denied') return '계정 확인';
    if (!CLOUD.user) return '로그인';
    if (CLOUD.status === 'saving' || CLOUD.status === 'dirty') return '저장 중';
    if (CLOUD.status === 'offline') return '오프라인';
    return '동기화';
  }

  function cloudDotState() {
    if (!CLOUD.ready) return 'idle';
    if (CLOUD.error === 'permission-denied' || CLOUD.status === 'denied') return 'warn';
    if (!CLOUD.user) return 'off';
    if (CLOUD.status === 'saving' || CLOUD.status === 'dirty') return 'busy';
    if (CLOUD.status === 'offline') return 'warn';
    return 'on';
  }

  function renderCloudUi() {
    const btn = $('#cloudBtn');
    if (btn) {
      const dot = btn.querySelector('.cloud-dot');
      const label = btn.querySelector('.cloud-btn-label');
      if (dot) {
        dot.className = 'cloud-dot is-' + cloudDotState();
      }
      if (label) label.textContent = cloudBtnLabel();
      const ico = btn.querySelector('.cloud-ico');
      if (ico) ico.textContent = (CLOUD.user ? '☁️' : '🔐');
      btn.classList.toggle('is-signed-in', !!CLOUD.user);
      btn.setAttribute('title', CLOUD.user
        ? `${CLOUD.user.displayName || '로그인됨'} · ${cloudStatusLabel()}`
        : 'Google 로그인으로 폰·패드 실시간 동기화');
      btn.setAttribute('aria-label', CLOUD.user ? '동기화 상태: ' + cloudStatusLabel() : 'Google 로그인(동기화)');
    }
    const panel = $('#cloudPanel');
    if (panel) renderCloudPanel(panel);
  }

  function renderCloudPanel(root) {
    const signedIn = !!CLOUD.user;
    const denied = CLOUD.error === 'permission-denied' || CLOUD.status === 'denied';
    let html = `<p class="hint">${escapeHtml(cloudStatusLabel())}</p>`;
    if (denied) {
      html += `<p class="hint" style="color:#d4532f">로그인한 Google 계정에는 이 대시보드의 저장 공간 권한이 없어요. 평소 쓰는 계정으로 다시 로그인해 주세요.</p>`;
    }
    if (signedIn) {
      html += `<div class="cloud-who"><span class="cloud-avatar" aria-hidden="true">☁️</span><span><b>${escapeHtml(CLOUD.user.displayName || '로그인됨')}</b><br><span class="hint">이 계정으로만 동기화돼요</span></span></div>`;
      html += `<div class="data-btns">
        <button type="button" class="btn btn-ghost" data-cloud="push">⬆️ 지금 올리기</button>
        <button type="button" class="btn btn-ghost" data-cloud="pull">⬇️ 클라우드에서 가져오기</button>
        <button type="button" class="btn btn-danger" data-cloud="out">로그아웃</button>
      </div>`;
      html += `<p class="hint">로그아웃해도 이 기기에 저장된 내용은 그대로 남아요. 다른 기기와 같은 내용을 보려면 같은 Google 계정으로 로그인하세요.</p>`;
    } else {
      html += `<p class="hint">이 기기 내용은 그대로 두고, 같은 Google 계정으로 로그인하면 폰·패드가 같은 내용을 실시간으로 봐요.</p>`;
      html += `<div class="data-btns">
        <button type="button" class="btn btn-pink" data-cloud="in">🔐 Google 로그인(동기화)</button>
      </div>`;
      html += `<p class="hint">로그인하지 않아도 지금처럼 이 기기에만 저장돼요.</p>`;
    }
    root.innerHTML = html;
    $$('[data-cloud]', root).forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.dataset.cloud;
        if (act === 'in') cloudSignIn();
        else if (act === 'out') cloudSignOutNow();
        else if (act === 'push') cloudPushNow();
        else if (act === 'pull') cloudPullNow();
      });
    });
  }

  async function cloudSignIn() {
    const S = cloudApi();
    if (!S || !CLOUD.ready) { toast('동기화 연결을 준비하고 있어요. 잠시 후 다시 눌러 주세요.'); return; }
    toast('Google 로그인 창을 열었어요…');
    try {
      await S.signIn();
    } catch (err) {
      const code = (err && err.code) || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        toast('로그인 창을 닫았어요.');
        return;
      }
      if (code === 'auth/unauthorized-domain') {
        toast('이 주소에서는 로그인할 수 없어요. (도메인 승인 필요)');
      } else if (code === 'auth/network-request-failed') {
        toast('인터넷 연결을 확인하고 다시 눌러 주세요.');
      } else {
        toast('로그인하지 못했어요. (' + (code || '알 수 없는 오류') + ')');
      }
      console.warn(err);
    }
  }

  async function cloudSignOutNow() {
    const S = cloudApi();
    if (!S || !CLOUD.user) return;
    if (!window.confirm('이 기기에서만 로그아웃할까요? 저장된 내용은 그대로 남아요.')) return;
    try {
      await S.signOutNow();
      if (CLOUD.status !== 'off') toast('로그아웃했어요. 이 기기 내용은 그대로예요.');
    } catch (err) {
      toast('로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.');
      console.warn(err);
    }
  }

  function onCloudBtnClick() {
    if (!CLOUD.ready) { toast('동기화 연결을 준비하고 있어요. 잠시 후 다시 눌러 주세요.'); return; }
    if (!CLOUD.user) { cloudSignIn(); return; }
    if (CLOUD.error === 'permission-denied' || CLOUD.status === 'denied') { openSettings(); return; }
    cloudPush({ force: true }).then(() => toast('☁️ ' + cloudStatusLabel()));
  }

  async function cloudPushNow() {
    if (!CLOUD.user) { cloudSignIn(); return; }
    await cloudPush({ force: true });
    if (CLOUD.status === 'synced') toast('☁️ 이 기기 내용을 클라우드에 올렸어요.');
  }

  async function cloudPullNow() {
    const S = cloudApi();
    if (!S || !CLOUD.user) { cloudSignIn(); return; }
    if (!window.confirm('클라우드에 저장된 내용으로 이 기기를 맞출까요? (지금 이 기기 내용은 자동으로 백업해 둬요)')) return;
    try {
      const remote = await S.read();
      if (!remote || !remote.state) { toast('클라우드에 저장된 내용이 아직 없어요.'); return; }
      applyRemoteState(remote.state, remote.updatedAt, { silent: false });
    } catch (err) {
      CLOUD.error = (err && err.code) || 'error';
      CLOUD.status = CLOUD.error === 'permission-denied' ? 'denied' : 'offline';
      renderCloudUi();
      toast('클라우드 내용을 가져오지 못했어요.');
      console.warn(err);
    }
  }

  function cloudSchedulePush() {
    if (!CLOUD.user || CLOUD.applying) return;
    clearTimeout(cloudPushTimer);
    CLOUD.status = 'dirty';
    renderCloudUi();
    cloudPushTimer = setTimeout(() => { cloudPush({}); }, 1500);
  }

  async function cloudPush(opts) {
    const S = cloudApi();
    const o = opts || {};
    if (!S || !CLOUD.user || CLOUD.applying) return;
    if (CLOUD.pushing) { CLOUD.pending = true; return; }
    const key = cloudKeyOf(state);
    if (!o.force && key === lastPushedJson) {
      CLOUD.status = 'synced';
      renderCloudUi();
      return;
    }
    CLOUD.pushing = true;
    CLOUD.status = 'saving';
    renderCloudUi();
    try {
      await S.write(state);
      lastPushedJson = key;
      if (CLOUD.user) cloudMetaWrite(CLOUD.user.uid, key);
      CLOUD.error = '';
      CLOUD.status = 'synced';
      CLOUD.lastSync = new Date();
    } catch (err) {
      CLOUD.error = (err && err.code) || 'error';
      CLOUD.status = CLOUD.error === 'permission-denied' ? 'denied' : 'offline';
      if (CLOUD.error !== 'permission-denied') {
        clearTimeout(cloudPushTimer);
        cloudPushTimer = setTimeout(() => { cloudPush({}); }, 8000);
      }
      console.warn(err);
    } finally {
      CLOUD.pushing = false;
      renderCloudUi();
      if (CLOUD.pending) {
        CLOUD.pending = false;
        clearTimeout(cloudPushTimer);
        cloudPushTimer = setTimeout(() => { cloudPush({}); }, 600);
      }
    }
  }

  function applyRemoteState(remote, at, opts) {
    const o = opts || {};
    CLOUD.applying = true;
    backupLocalState();
    const localUi = { ...state.ui };
    const next = mergeState(remote);
    next.ui = localUi;
    next.updatedAt = at || new Date().toISOString();
    state = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { console.warn(err); }
    const tab = (state.ui && RENDERERS[state.ui.tab]) ? state.ui.tab : 'home';
    applyLabels();
    renderAll();
    showTab(tab);
    CLOUD.applying = false;
    CLOUD.status = 'synced';
    CLOUD.lastSync = new Date();
    lastPushedJson = cloudKeyOf(state);
    if (CLOUD.user) cloudMetaWrite(CLOUD.user.uid, lastPushedJson);
    renderCloudUi();
    if (!o.silent) toast('☁️ 클라우드 내용으로 맞췄어요. (이전 내용은 백업해 뒀어요)');
  }

  function cloudIsTyping() {
    const el = document.activeElement;
    return !!(el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  function cloudDrainRemote() {
    clearTimeout(pendingRemoteTimer);
    const item = pendingRemote;
    if (!item) return;
    if (cloudIsTyping()) { pendingRemoteTimer = setTimeout(cloudDrainRemote, 3000); return; }
    pendingRemote = null;
    const remoteKey = cloudKeyOf(item.state);
    const localKey = cloudKeyOf(state);
    if (remoteKey === localKey) return;
    if (lastPushedJson && localKey !== lastPushedJson) { cloudSchedulePush(); return; }
    applyRemoteState(item.state, item.updatedAt, { silent: true });
    toast('☁️ 다른 기기의 변경을 불러왔어요.');
  }

  function cloudOnRemote(data, meta) {
    if (!data || !data.state || !data.updatedAt) return;
    if (meta && meta.pending) return;
    if (CLOUD.applying) return;
    const remoteKey = cloudKeyOf(data.state);
    const localKey = cloudKeyOf(state);
    if (remoteKey === localKey) return;
    /* 이 기기에서 아직 올리지 않은 수정이 있으면 그쪽을 올린다 */
    if (lastPushedJson && localKey !== lastPushedJson) { cloudSchedulePush(); return; }
    pendingRemote = { state: data.state, updatedAt: data.updatedAt };
    if (cloudIsTyping()) {
      clearTimeout(pendingRemoteTimer);
      pendingRemoteTimer = setTimeout(cloudDrainRemote, 3000);
      return;
    }
    cloudDrainRemote();
  }

  /* 처음 연결할 때: 이 기기와 클라우드 내용이 다르면 어느 쪽으로 맞출지 물어본다 */
  function cloudAskDirection() {
    return new Promise((resolve) => {
      try {
        openModal({
        title: '☁️ 클라우드에 저장된 내용이 있어요',
        body: `
          <p class="hint" style="font-size:13px;color:var(--ink-2);line-height:1.7">이 기기 내용과 클라우드 내용이 달라요. 어느 쪽으로 맞출까요?<br>맞추기 전 이 기기 내용은 자동으로 백업해 둬요.</p>
          <div class="data-btns" style="margin-top:4px">
            <button type="button" class="btn btn-ghost" id="cloudPickLocal">⬆️ 이 기기 내용 올리기</button>
          </div>`,
        submitLabel: '⬇️ 클라우드 내용으로 맞추기',
        onSubmit: () => resolve('cloud'),
        onMount: (root) => {
          const localBtn = root.querySelector('#cloudPickLocal');
          if (localBtn) localBtn.addEventListener('click', () => { closeModal(); resolve('local'); });
        }
        });
        modal.addEventListener('close', () => resolve('cloud'), { once: true });
      } catch (err) {
        console.warn(err);
        resolve('cloud');
      }
    });
  }

  function scheduleCloudRetry() {
    if (!CLOUD.user || cloudRetryCount >= 4) return;
    clearTimeout(cloudRetryTimer);
    cloudRetryCount += 1;
    cloudRetryTimer = setTimeout(() => {
      if (CLOUD.user) cloudReconcile();
    }, 5000 * cloudRetryCount);
  }

  async function cloudReconcile() {
    const S = cloudApi();
    if (!S || !CLOUD.user) return;
    CLOUD.status = 'saving';
    renderCloudUi();
    const uid = CLOUD.user.uid;
    try {
      const remote = await S.read();
      const remoteKey = (remote && remote.state) ? cloudKeyOf(remote.state) : '';
      const localKey = cloudKeyOf(state);
      const meta = cloudMetaRead();
      const linked = meta.uid === uid && !!meta.key;
      if (!remoteKey) {
        /* 클라우드가 비어 있다 → 이 기기 내용 올리기 */
        await S.write(state);
        lastPushedJson = localKey;
        cloudMetaWrite(uid, localKey);
        CLOUD.status = 'synced';
        CLOUD.lastSync = new Date();
        toast('☁️ 이 기기 내용을 클라우드에 올렸어요.');
      } else if (remoteKey === localKey) {
        lastPushedJson = localKey;
        cloudMetaWrite(uid, localKey);
        CLOUD.status = 'synced';
        CLOUD.lastSync = new Date();
      } else if (linked && localKey !== meta.key) {
        /* 이미 연결된 기기인데 마지막 저장 이후 이 기기에서 바뀐 내용이 있다 → 올리기 */
        await S.write(state);
        lastPushedJson = localKey;
        cloudMetaWrite(uid, localKey);
        CLOUD.status = 'synced';
        CLOUD.lastSync = new Date();
      } else if (linked) {
        /* 연결된 기기이고 이 기기에서 바뀐 것이 없다 → 클라우드 내용으로 맞추기 */
        lastPushedJson = remoteKey;
        applyRemoteState(remote.state, remote.updatedAt, { silent: true });
      } else {
        /* 처음 연결하는 기기 → 어느 쪽으로 맞출지 물어보기 */
        const pick = await cloudAskDirection();
        if (pick === 'local') {
          await S.write(state);
          lastPushedJson = localKey;
          cloudMetaWrite(uid, localKey);
          CLOUD.status = 'synced';
          CLOUD.lastSync = new Date();
          toast('☁️ 이 기기 내용을 클라우드에 올렸어요.');
        } else {
          lastPushedJson = remoteKey;
          applyRemoteState(remote.state, remote.updatedAt, { silent: false });
        }
      }
      S.watch(cloudOnRemote);
      cloudRetryCount = 0;
      clearTimeout(cloudRetryTimer);
    } catch (err) {
      CLOUD.error = (err && err.code) || 'error';
      CLOUD.status = CLOUD.error === 'permission-denied' ? 'denied' : 'offline';
      if (CLOUD.error === 'permission-denied') toast('이 Google 계정으로는 동기화할 수 없어요.');
      else scheduleCloudRetry();
      console.warn(err);
    }
    renderCloudUi();
  }

  async function cloudOnAuth(user) {
    CLOUD.user = user || null;
    CLOUD.error = '';
    if (!user) {
      CLOUD.status = 'off';
      CLOUD.lastSync = null;
      lastPushedJson = '';
      pendingRemote = null;
      try { const S = cloudApi(); if (S) S.unwatch(); } catch (err) { console.warn(err); }
      renderCloudUi();
      return;
    }
    await cloudReconcile();
  }

  function cloudBoot() {
    const S = cloudApi();
    if (!S) { renderCloudUi(); return; }
    CLOUD.ready = true;
    S.onAuth(cloudOnAuth);
    renderCloudUi();
  }

  window.addEventListener('dashboard-cloud-ready', cloudBoot);
  window.addEventListener('online', () => {
    if (!CLOUD.user) return;
    cloudRetryCount = 0;
    cloudReconcile();
  });
  window.addEventListener('dashboard-cloud-failed', (e) => {
    CLOUD.ready = false;
    CLOUD.error = 'load_failed';
    console.warn('동기화 모듈을 불러오지 못했어요.', e && e.detail);
    renderCloudUi();
  });
  window.addEventListener('dashboard-cloud-error', (e) => {
    CLOUD.error = (e && e.detail) || 'error';
    if (CLOUD.error === 'permission-denied') CLOUD.status = 'denied';
    renderCloudUi();
  });
  if (window.DashboardSync && window.DashboardSync.ready) cloudBoot();
  setTimeout(() => { if (!CLOUD.ready) renderCloudUi(); }, 9000);

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

  /* 설정값 (비어 있으면 기본값 사용) */
  const settingText = (key, fallback) => {
    const v = state.settings[key];
    return (typeof v === 'string' && v.trim()) ? v.trim() : fallback;
  };
  const appName = () => settingText('appName', '우리집 대시보드');
  const companyName = () => settingText('bizName', '에이치엠유통');
  const ledgerLabel = () => settingText('moneyLabel', '집 가계부');

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
    renderHomeFixed();
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
    $('#home-biz-h').textContent = '📦 ' + companyName();

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
    renderFixed('biz');
    renderBizSales();
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

    renderFixed('home');
  }

  /* =========================================================
     고정지출 (사업 / 주거)
     - 예상 금액과 실제 나간 금액을 항목별로 나란히 기록
     - 월간 고정과 연납·비정기(재산세·주민세 등)를 분리 집계
     - 실제 금액·완료 표시는 달마다 따로 보관 (새 달은 자동으로 비어 있음)
     ========================================================= */
  const FX_SCOPES = {
    biz: { label: '사업', icon: '📦', tab: 'biz', container: '#bizFixed' },
    home: { label: '주거', icon: '💰', tab: 'money', container: '#moneyFixed' }
  };
  let fxSaveTimer = null;

  const fxMonth = () => state.ui.month || monthKey();
  const fxItemsOf = (scope) => state.fixed.items.filter((i) => i.scope === scope);

  function fxRecord(month) {
    const m = month || fxMonth();
    const rec = state.fixed.months[m] || {};
    if (!rec.actual || typeof rec.actual !== 'object') rec.actual = {};
    if (!rec.paid || typeof rec.paid !== 'object') rec.paid = {};
    state.fixed.months[m] = rec;
    return rec;
  }

  function fxActualOf(id, month) {
    const rec = state.fixed.months[month || fxMonth()];
    const v = rec && rec.actual ? rec.actual[id] : undefined;
    return v === undefined || v === null || v === '' ? null : Number(v);
  }

  function fxPaidOf(id, month) {
    const rec = state.fixed.months[month || fxMonth()];
    return !!(rec && rec.paid && rec.paid[id]);
  }

  function fxDayRank(day) {
    const s = String(day || '').trim();
    const md = s.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
    if (md) return 100 + Number(md[1]) * 32 + Number(md[2]);
    if (s === '말일' || s === '말') return 92;
    if (/^\d{1,2}$/.test(s)) return Number(s);
    if (s === '연납') return 510;
    return 500;
  }

  const fxDayLabel = (day) => {
    const s = String(day || '').trim();
    if (!s) return '—';
    return /^\d{1,2}$/.test(s) ? s + '일' : s;
  };

  const fxSort = (a, b) => fxDayRank(a.day) - fxDayRank(b.day)
    || String(a.name).localeCompare(String(b.name), 'ko');

  /* 같은 항목인지 판단하는 열쇠 — 다시 불러와도 중복되지 않게 */
  const fxKey = (i) => [i.scope, i.kind || 'month', String(i.name).trim(), String(i.day || '').trim()].join('|');

  function fxTotals(scope, month) {
    const m = month || fxMonth();
    const rec = state.fixed.months[m] || {};
    const actuals = rec.actual || {};
    const paids = rec.paid || {};
    const hasActual = (id) => actuals[id] !== undefined && actuals[id] !== null && actuals[id] !== '';

    const all = fxItemsOf(scope);
    const monthly = all.filter((i) => (i.kind || 'month') !== 'annual').sort(fxSort);
    const annual = all.filter((i) => i.kind === 'annual').sort(fxSort);

    let actual = 0;
    let planEntered = 0;
    let entered = 0;
    let paid = 0;
    monthly.forEach((i) => {
      if (hasActual(i.id)) {
        actual += Number(actuals[i.id]) || 0;
        planEntered += Number(i.amount) || 0;
        entered++;
      }
      if (paids[i.id]) paid++;
    });
    const pending = monthly.filter((i) => !hasActual(i.id));

    let annualActual = 0;
    let annualEntered = 0;
    annual.forEach((i) => {
      if (hasActual(i.id)) { annualActual += Number(actuals[i.id]) || 0; annualEntered++; }
    });

    return {
      month: m,
      monthly,
      annual,
      plan: monthly.reduce((a, i) => a + (Number(i.amount) || 0), 0),
      actual,
      diff: actual - planEntered,
      entered,
      paid,
      count: monthly.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((a, i) => a + (Number(i.amount) || 0), 0),
      annualPlan: annual.reduce((a, i) => a + (Number(i.amount) || 0), 0),
      annualActual,
      annualEntered,
      annualCount: annual.length
    };
  }

  function fxDiffInfo(item, actual) {
    const plan = Number(item.amount) || 0;
    if (actual == null) {
      return { cls: 'wait', text: plan > 0 ? '대기' : '금액 입력 필요' };
    }
    if (plan <= 0) return { cls: 'wait', text: '예상 미입력' };
    const d = Number(actual) - plan;
    if (d === 0) return { cls: 'same', text: '예상과 같음' };
    if (d < 0) return { cls: 'save', text: won(-d) + ' 절약' };
    return { cls: 'over', text: '+' + won(d) + ' 초과' };
  }

  const fxDiffHtml = (item, actual) => {
    const info = fxDiffInfo(item, actual);
    return `<span class="fx-${info.cls}">${escapeHtml(info.text)}</span>`;
  };

  function fxKpiHtml(t) {
    const entered = t.entered > 0;
    const diffText = entered
      ? (t.diff === 0 ? '예상과 같아요' : (t.diff < 0 ? won(-t.diff) + ' 절약' : won(t.diff) + ' 초과'))
      : '입력 전';
    const diffCls = entered ? (t.diff < 0 ? 'save' : t.diff > 0 ? 'over' : '') : '';
    return `
      <div class="fx-kpi plan"><span>매달 예상 합계</span><b data-fx-out="plan">${won(t.plan)}</b><small>${t.count}건 · 월간 고정</small></div>
      <div class="fx-kpi actual"><span>실제 나간 금액</span><b data-fx-out="actual">${won(t.actual)}</b><small data-fx-out="actualSub">${t.entered}건 입력 · ${t.paid}건 완료</small></div>
      <div class="fx-kpi diff"><span>차액 (실제 − 예상)</span><b class="${diffCls}" data-fx-out="diff">${escapeHtml(diffText)}</b><small>입력한 항목 기준</small></div>
      <div class="fx-kpi pending"><span>아직 미입력</span><b data-fx-out="pending">${t.pendingCount}건</b><small data-fx-out="pendingAmount">${won(t.pendingAmount)} 남음</small></div>`;
  }

  function fxRowHtml(item, m) {
    const a = fxActualOf(item.id, m);
    const paid = fxPaidOf(item.id, m);
    const tags = [];
    if (item.method) tags.push(`<span class="tag date">${escapeHtml(item.method)}</span>`);
    if (item.due) tags.push(`<span class="tag plain">만기 ${escapeHtml(item.due)}</span>`);
    if (item.note) tags.push(`<span class="tag plain">${escapeHtml(item.note)}</span>`);
    return `<div class="fx-row${paid ? ' is-paid' : ''}" data-fx-row="${item.id}">
      <button type="button" class="fx-check" data-fx-paid="${item.id}" aria-pressed="${paid}" aria-label="${escapeHtml(item.name)} 납부 완료 표시">✓</button>
      <div class="fx-main">
        <div class="fx-line1">
          <span class="fx-day">${escapeHtml(fxDayLabel(item.day))}</span>
          <span class="fx-name">${escapeHtml(item.name)}</span>
          ${tags.length ? `<span class="fx-tags">${tags.join('')}</span>` : ''}
        </div>
        <div class="fx-line2">
          <label class="fx-money"><span>예상</span><input type="text" inputmode="numeric" autocomplete="off" value="${item.amount ? fmtNum(item.amount) : ''}" placeholder="0" data-fx-plan="${item.id}" aria-label="${escapeHtml(item.name)} 예상 금액"><span class="fx-unit">원</span></label>
          <label class="fx-money actual"><span>실제</span><input type="text" inputmode="numeric" autocomplete="off" value="${a == null ? '' : fmtNum(a)}" placeholder="미입력" data-fx-actual="${item.id}" aria-label="${escapeHtml(item.name)} 실제 금액"><span class="fx-unit">원</span></label>
          <span class="fx-diff" data-fx-diff="${item.id}">${fxDiffHtml(item, a)}</span>
        </div>
      </div>
      <div class="fx-tools">
        <button type="button" data-fx-edit="${item.id}" aria-label="${escapeHtml(item.name)} 수정">✎</button>
        <button type="button" data-fx-del="${item.id}" aria-label="${escapeHtml(item.name)} 삭제">🗑</button>
      </div>
    </div>`;
  }

  function renderFixed(scope) {
    const meta = FX_SCOPES[scope];
    if (!meta) return;
    const el = $(meta.container);
    if (!el) return;
    const m = fxMonth();
    const [y, mm] = m.split('-');
    const t = fxTotals(scope, m);

    const scopeLabel = scope === 'biz' ? companyName() : meta.label;

    el.innerHTML = `<div class="card fixed-card" id="fx-${scope}" data-scope="${scope}">
      <header class="fixed-head">
        <div class="fixed-title">
          <h3>${meta.icon} ${escapeHtml(scopeLabel)} 고정지출</h3>
          <span class="fx-month">${y}년 ${Number(mm)}월</span>
        </div>
        <div class="fixed-tools">
          <div class="month-picker fx-monthpick">
            <button class="icon-btn sm" type="button" data-fx-month="-1" aria-label="이전 달">◀</button>
            <strong>${Number(mm)}월</strong>
            <button class="icon-btn sm" type="button" data-fx-month="1" aria-label="다음 달">▶</button>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" data-fx-import="${scope}">📥 고정지출 불러오기</button>
          <button class="btn btn-ghost btn-sm" type="button" data-fx-export="${scope}">⬇️ 내보내기</button>
          <button class="btn btn-ghost btn-sm" type="button" data-fx-reset="${scope}">🔄 이번 달 초기화</button>
          <button class="btn ${scope === 'biz' ? 'btn-mint' : 'btn-pink'} btn-sm" type="button" data-fx-add="${scope}">＋ 항목</button>
        </div>
      </header>
      <div class="fx-kpis">${fxKpiHtml(t)}</div>
      <p class="fx-note">매달 나가는 월간 고정만 위 합계에 넣었어요. 연납·비정기는 아래에 따로 모았어요.</p>
      <div class="fx-group">
        <div class="fx-group-head">
          <h4>매달 고정 <span class="count">${t.count}건</span></h4>
          <span class="hint">예상 옆에 실제 나간 금액을 적으면 차액을 바로 보여드려요</span>
        </div>
        ${t.monthly.length ? t.monthly.map((i) => fxRowHtml(i, m)).join('') : '<div class="empty-box">아직 항목이 없어요. 📥 불러오기로 파일을 읽거나 ＋ 항목으로 추가해 보세요.</div>'}
      </div>
      <div class="fx-group annual">
        <div class="fx-group-head">
          <h4>연납·비정기 <span class="count">${t.annualCount}건</span></h4>
          <span class="hint">매달 필요액에는 넣지 않아요</span>
        </div>
        <div class="fx-annual-line">
          <span>연납·비정기 예상 <b data-fx-out="annualPlan">${won(t.annualPlan)}</b></span>
          <span>실제 <b data-fx-out="annualActual">${won(t.annualActual)}</b></span>
          <span class="hint" data-fx-out="annualSub">${t.annualEntered}건 입력</span>
        </div>
        ${t.annual.length ? t.annual.map((i) => fxRowHtml(i, m)).join('') : '<div class="empty-box">연납·비정기 항목이 없어요.</div>'}
      </div>
    </div>`;
  }

  const renderFixedBoth = () => { renderFixed('biz'); renderFixed('home'); };

  /* 값을 입력하는 동안에는 행을 다시 그리지 않고 숫자만 갱신 (입력 중 커서가 튀지 않게) */
  function updateFixedTotals(scope) {
    const root = $('#fx-' + scope);
    if (!root) return;
    const m = fxMonth();
    const t = fxTotals(scope, m);
    const put = (key, html) => { const n = root.querySelector(`[data-fx-out="${key}"]`); if (n) n.innerHTML = html; };
    put('plan', won(t.plan));
    put('actual', won(t.actual));
    put('actualSub', `${t.entered}건 입력 · ${t.paid}건 완료`);
    const dEl = root.querySelector('[data-fx-out="diff"]');
    if (dEl) {
      const entered = t.entered > 0;
      dEl.textContent = entered
        ? (t.diff === 0 ? '예상과 같아요' : (t.diff < 0 ? won(-t.diff) + ' 절약' : won(t.diff) + ' 초과'))
        : '입력 전';
      dEl.className = entered ? (t.diff < 0 ? 'save' : t.diff > 0 ? 'over' : '') : '';
    }
    put('pending', `${t.pendingCount}건`);
    put('pendingAmount', `${won(t.pendingAmount)} 남음`);
    put('annualPlan', won(t.annualPlan));
    put('annualActual', won(t.annualActual));
    put('annualSub', `${t.annualEntered}건 입력`);
    root.querySelectorAll('[data-fx-diff]').forEach((el) => {
      const item = state.fixed.items.find((i) => i.id === el.dataset.fxDiff);
      if (item) el.innerHTML = fxDiffHtml(item, fxActualOf(item.id, m));
    });
    renderHomeFixed();
  }

  function renderHomeFixed() {
    const el = $('#homeFixed');
    if (!el) return;
    const m = monthKey();
    const lbl = $('#homeFixedMonth');
    if (lbl) lbl.textContent = `${Number(m.split('-')[1])}월 기준`;
    if (!state.fixed.items.length) {
      el.innerHTML = '<div class="empty-box">📥 고정지출 파일을 불러오면 사업·주거 매달 필요액을 나란히 보여드려요.</div>';
      return;
    }
    el.innerHTML = Object.keys(FX_SCOPES).map((scope) => {
      const meta = FX_SCOPES[scope];
      const t = fxTotals(scope, m);
      const entered = t.entered > 0;
      const diffText = entered
        ? (t.diff === 0 ? '예상과 같음' : (t.diff < 0 ? won(-t.diff) + ' 절약' : won(t.diff) + ' 초과'))
        : '입력 전';
      const diffCls = entered ? (t.diff < 0 ? 'save' : t.diff > 0 ? 'over' : 'same') : 'wait';
      const scopeLabel = scope === 'biz' ? companyName() : meta.label;
      return `<button type="button" class="fx-mini" data-goto="${meta.tab}" aria-label="${escapeHtml(scopeLabel)} 고정지출 자세히 보기">
        <span class="fx-mini-top">${meta.icon} ${escapeHtml(scopeLabel)} <span class="pill ${scope === 'biz' ? 'pill-lav' : 'pill-pink'}">${t.count}건</span></span>
        <b>${won(t.plan)}</b>
        <span class="fx-mini-sub">실제 ${won(t.actual)} · <span class="fx-${diffCls}">${escapeHtml(diffText)}</span></span>
        <span class="fx-mini-sub">${t.pendingCount ? `미입력 ${t.pendingCount}건 · ${won(t.pendingAmount)}` : '모두 입력했어요'}</span>
      </button>`;
    }).join('');
  }

  function openFixedModal({ scope, item }) {
    const isEdit = !!item;
    const cur = item || { scope: scope || 'biz', kind: 'month' };
    openModal({
      title: isEdit ? '고정지출 수정' : '고정지출 추가',
      body: `
        <div class="field"><label for="f-scope">구분</label>
          <select id="f-scope">
            <option value="biz" ${cur.scope === 'biz' ? 'selected' : ''}>📦 ${escapeHtml(companyName())}</option>
            <option value="home" ${cur.scope === 'home' ? 'selected' : ''}>💰 주거</option>
          </select>
        </div>
        ${fieldHtml({ label: '이름', id: 'f-name', value: cur.name || '', placeholder: '예: 통신비' })}
        ${fieldHtml({ label: '예상 금액 (원)', id: 'f-amount', type: 'number', value: cur.amount || '', placeholder: '예: 30000', min: 0, step: 1 })}
        <div class="field"><label for="f-kind">주기</label>
          <select id="f-kind">
            <option value="month" ${(cur.kind || 'month') === 'month' ? 'selected' : ''}>매달 고정</option>
            <option value="annual" ${cur.kind === 'annual' ? 'selected' : ''}>연납·비정기</option>
          </select>
        </div>
        ${fieldHtml({ label: '결제일', id: 'f-day', value: cur.day || '', placeholder: '13 · 말일 · 8/31 · 비정기' })}
        ${fieldHtml({ label: '결제수단·메모', id: 'f-method', value: cur.method || '', placeholder: '예: 자동이체, 카드결제' })}
        ${fieldHtml({ label: '만기일 (선택)', id: 'f-due', value: cur.due || '', placeholder: '예: 27.05.27' })}
        ${fieldHtml({ label: '추가 메모 (선택)', id: 'f-note', value: cur.note || '', placeholder: '예: 만기 확인' })}`,
      submitLabel: isEdit ? '수정' : '추가',
      onSubmit: (root) => {
        const name = root.querySelector('#f-name').value.trim();
        if (!name) { toast('이름을 입력해 주세요.'); return false; }
        const payload = {
          scope: root.querySelector('#f-scope').value === 'home' ? 'home' : 'biz',
          name: name.slice(0, 40),
          amount: Math.max(0, Math.round(Number(root.querySelector('#f-amount').value) || 0)),
          kind: root.querySelector('#f-kind').value === 'annual' ? 'annual' : 'month',
          day: root.querySelector('#f-day').value.trim().slice(0, 12),
          method: root.querySelector('#f-method').value.trim().slice(0, 40),
          due: root.querySelector('#f-due').value.trim().slice(0, 12),
          note: root.querySelector('#f-note').value.trim().slice(0, 80)
        };
        if (isEdit) Object.assign(item, payload);
        else state.fixed.items.push({ id: uid(), ...payload });
        save();
        renderFixedBoth();
        renderHomeFixed();
        toast(isEdit ? '고정지출을 수정했어요.' : '고정지출을 추가했어요.');
      }
    });
  }

  function resetFixedMonth(scope) {
    const m = fxMonth();
    const meta = FX_SCOPES[scope];
    const [y, mm] = m.split('-');
    const rec = fxRecord(m);
    const ids = fxItemsOf(scope).map((i) => i.id);
    const target = ids.filter((id) => (rec.actual[id] !== undefined && rec.actual[id] !== '') || rec.paid[id]).length;
    confirmModal({
      title: '이번 달 초기화',
      message: `${y}년 ${Number(mm)}월 ${scope === 'biz' ? companyName() : meta.label} 고정지출의 실제 금액과 납부 완료 표시를 지울까요? 예상 금액은 그대로 남아요. (${target}건)`,
      confirmLabel: '초기화',
      onConfirm: () => {
        ids.forEach((id) => { delete rec.actual[id]; delete rec.paid[id]; });
        save();
        renderFixedBoth();
        renderHomeFixed();
        toast('실제 금액과 완료 표시를 지웠어요. 예상 금액은 그대로예요.');
      }
    });
  }

  function exportFixed(scope) {
    const meta = FX_SCOPES[scope];
    const m = fxMonth();
    const items = fxItemsOf(scope);
    const months = {};
    Object.keys(state.fixed.months).forEach((key) => {
      const rec = state.fixed.months[key] || {};
      const actual = {};
      const paid = {};
      items.forEach((i) => {
        if (rec.actual && rec.actual[i.id] !== undefined && rec.actual[i.id] !== '') actual[i.id] = rec.actual[i.id];
        if (rec.paid && rec.paid[i.id]) paid[i.id] = true;
      });
      if (Object.keys(actual).length || Object.keys(paid).length) months[key] = { actual, paid };
    });
    const t = fxTotals(scope, m);
    const data = {
      type: 'uri-jip-dashboard.fixed-expenses',
      version: 1,
      title: `${meta.label} 고정지출 ${m}`,
      month: m,
      summary: { monthlyCount: t.count, monthlyPlanTotal: t.plan, annualCount: t.annualCount, annualPlanTotal: t.annualPlan },
      fixed: { items, months }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `고정지출-${meta.label}-${m}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('고정지출 파일을 내려받았어요.');
  }

  /* 고정지출 파일 불러오기 — 기존 루틴·카드 내역·예산은 그대로 두고 항목만 더함 */
  function importFixedFile(input, defaultScope) {
    const file = input.files && input.files[0];
    if (!file) return;
    input.value = '';
    const reader = new FileReader();
    reader.onerror = () => toast('파일을 읽지 못했어요.');
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(String(reader.result)); } catch (err) { parsed = null; }
      if (!parsed) { toast('JSON 파일을 읽지 못했어요. 파일을 확인해 주세요.'); return; }

      const src = Array.isArray(parsed) ? parsed
        : (parsed.fixed && Array.isArray(parsed.fixed.items)) ? parsed.fixed.items
        : Array.isArray(parsed.items) ? parsed.items
        : (parsed.fixed && Array.isArray(parsed.fixed)) ? parsed.fixed
        : null;
      if (!src) { toast('고정지출 항목(items)을 찾지 못했어요. 고정지출 파일인지 확인해 주세요.'); return; }

      const incoming = [];
      src.forEach((raw) => {
        const item = normalizeFixedItem(raw, defaultScope);
        if (!item) return;
        item._srcActual = raw && raw.actual !== undefined && raw.actual !== null && raw.actual !== '' ? raw.actual : null;
        item._srcPaid = !!(raw && raw.paid);
        incoming.push(item);
      });
      if (!incoming.length) { toast('불러올 고정지출 항목이 없어요.'); return; }

      const byKey = new Map(state.fixed.items.map((i) => [fxKey(i), i]));
      const fresh = [];
      const matches = [];
      incoming.forEach((i) => {
        const key = fxKey(i);
        const found = byKey.get(key);
        if (found) { matches.push([i, found]); return; }
        const withId = { ...i, id: state.fixed.items.some((x) => x.id === i.id) ? uid() : i.id };
        delete withId._srcActual;
        delete withId._srcPaid;
        fresh.push(withId);
        byKey.set(key, withId);
        matches.push([i, withId]);
      });

      const month = String(parsed.month || fxMonth()).slice(0, 7);
      const srcMonths = (parsed.fixed && parsed.fixed.months) || parsed.months || null;
      const skipped = incoming.length - fresh.length;
      const sumOf = (scope) => incoming
        .filter((i) => i.scope === scope && i.kind !== 'annual')
        .reduce((a, i) => a + (Number(i.amount) || 0), 0);
      const countOf = (scope) => incoming.filter((i) => i.scope === scope && i.kind !== 'annual').length;

      openModal({
        title: '📥 고정지출 파일 불러오기',
        body: `
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">${escapeHtml(parsed.title || '고정지출 파일')}<br>파일: ${escapeHtml(file.name)}</p>
          <div class="fx-import-grid">
            <span>읽은 항목 <b>${incoming.length}건</b></span>
            <span>새로 추가 <b>${fresh.length}건</b></span>
            ${skipped ? `<span>이미 있어 건너뜀 <b>${skipped}건</b></span>` : ''}
          </div>
          <div class="fx-import-grid">
            <span>📦 사업 월간 <b>${countOf('biz')}건 · ${won(sumOf('biz'))}</b></span>
            <span>💰 주거 월간 <b>${countOf('home')}건 · ${won(sumOf('home'))}</b></span>
          </div>
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">기존 루틴·카드 내역·예산은 그대로 두고 고정지출 항목만 더해요. 실제 금액과 완료 표시는 비어 있는 칸만 채워요. 이 내용은 이 기기 브라우저에만 저장되고 인터넷에 올라가지 않아요.</p>`,
        submitLabel: fresh.length ? `${fresh.length}건 추가` : '닫기',
        onSubmit: () => {
          if (fresh.length) state.fixed.items = state.fixed.items.concat(fresh);
          const rec = fxRecord(month);
          matches.forEach(([srcItem, target]) => {
            const srcRec = (srcMonths && srcMonths[month]) || {};
            const srcActual = srcRec.actual ? srcRec.actual[srcItem.id] : undefined;
            const inlineActual = srcItem._srcActual;
            const value = srcActual !== undefined && srcActual !== null && srcActual !== ''
              ? srcActual
              : (inlineActual !== undefined && inlineActual !== null && inlineActual !== '' ? inlineActual : null);
            if (value !== null) {
              const has = rec.actual[target.id] !== undefined && rec.actual[target.id] !== '';
              if (!has) rec.actual[target.id] = Math.max(0, Math.round(Number(value) || 0));
            }
            if ((srcRec.paid && srcRec.paid[srcItem.id]) || srcItem._srcPaid) rec.paid[target.id] = true;
          });
          state.ui.month = month;
          save();
          renderFixedBoth();
          renderHomeFixed();
          if (RENDERERS[state.ui.tab]) RENDERERS[state.ui.tab]();
          toast(fresh.length ? `${fresh.length}건을 고정지출에 더했어요.` : '이미 있는 항목이라 새로 더하지 않았어요.');
        }
      });
    };
    reader.readAsText(file);
  }

  /* =========================================================
     매출·매입 현황 (사업)
     - 홈택스 등에서 받은 월별 매출·매입을 파일로 불러와 이 기기에만 보관
     - 실제 금액·거래처·사업자번호는 저장소(GitHub)에 넣지 않고 localStorage에만 저장
     ========================================================= */
  const SALES_FILE_TYPE = 'uri-jip-dashboard.biz-sales';

  function salesDefault() {
    return {
      activeYear: Number(monthKey().slice(0, 4)),
      business: { name: '', regNo: '' },
      source: '',
      updatedAt: null,
      months: {},
      partners: { sales: [], purchase: [] },
      vatReturns: [],
      notes: []
    };
  }

  function salesNum(v) {
    const n = Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
  }

  function salesTriple(raw) {
    if (raw == null) return { supply: 0, vat: 0, count: 0 };
    if (typeof raw === 'number' || typeof raw === 'string') return { supply: salesNum(raw), vat: 0, count: 0 };
    if (typeof raw !== 'object') return { supply: 0, vat: 0, count: 0 };
    return {
      supply: salesNum(raw.supply != null ? raw.supply : raw.amount),
      vat: salesNum(raw.vat != null ? raw.vat : raw.tax),
      count: salesNum(raw.count != null ? raw.count : raw.cnt)
    };
  }

  function salesMonthRec(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const card = raw.card && typeof raw.card === 'object' ? raw.card : {};
    const ded = card.deductible || card.deduction || card.ded || card['공제'] || null;
    const all = card.total || card.all || card.whole || card['전체'] || null;
    return {
      sales: salesTriple(raw.sales != null ? raw.sales : raw.revenue),
      purchase: salesTriple(raw.purchase != null ? raw.purchase : raw.buy),
      card: { deductible: salesTriple(ded), total: salesTriple(all) },
      memo: String(raw.memo || raw.note || '').trim().slice(0, 120)
    };
  }

  function salesPartyList(raw) {
    const list = Array.isArray(raw) ? raw : [];
    const out = [];
    const seen = new Set();
    list.forEach((p) => {
      if (!p) return;
      const name = String(typeof p === 'string' ? p : (p.name || p.title || '')).trim().slice(0, 40);
      if (!name || seen.has(name)) return;
      seen.add(name);
      out.push({
        name,
        amount: salesNum(p.amount != null ? p.amount : p.supply),
        count: salesNum(p.count != null ? p.count : p.cnt)
      });
    });
    return out.sort((a, b) => b.amount - a.amount);
  }

  function normalizeSalesState(raw) {
    const base = salesDefault();
    if (!raw || typeof raw !== 'object') return base;
    const biz = raw.business && typeof raw.business === 'object' ? raw.business : {};
    const out = {
      activeYear: base.activeYear,
      business: {
        name: String(biz.name || raw.bizName || '').trim().slice(0, 40),
        regNo: String(biz.regNo || raw.regNo || '').trim().slice(0, 20)
      },
      source: String(raw.source || '').trim().slice(0, 200),
      updatedAt: raw.updatedAt || null,
      months: {},
      partners: { sales: [], purchase: [] },
      vatReturns: [],
      notes: []
    };

    const rawMonths = raw.months || raw.monthly || null;
    const rows = Array.isArray(rawMonths)
      ? rawMonths
      : (rawMonths && typeof rawMonths === 'object')
        ? Object.keys(rawMonths).map((k) => Object.assign({ month: k }, rawMonths[k] || {}))
        : [];
    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const key = String(row.month || row.key || '').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(key)) return;
      const rec = salesMonthRec(row);
      if (rec) out.months[key] = rec;
    });
    const yearsInData = Object.keys(out.months).map((m) => m.slice(0, 4)).sort();
    const wantYear = Number(raw.year || raw.activeYear || yearsInData[yearsInData.length - 1] || base.activeYear);
    out.activeYear = wantYear > 1900 ? wantYear : base.activeYear;

    const partners = raw.partners && typeof raw.partners === 'object' ? raw.partners : {};
    out.partners.sales = salesPartyList(partners.sales || partners.sellers || raw.salesPartners);
    out.partners.purchase = salesPartyList(partners.purchase || partners.buyers || raw.purchasePartners);

    const vats = Array.isArray(raw.vatReturns) ? raw.vatReturns : (Array.isArray(raw.vat) ? raw.vat : []);
    vats.forEach((v) => {
      if (!v || typeof v !== 'object') return;
      const period = String(v.period || v.name || '').trim().slice(0, 40);
      if (!period) return;
      out.vatReturns.push({
        period,
        range: String(v.range || v.months || '').trim().slice(0, 20),
        paid: salesNum(v.paid != null ? v.paid : v.amount),
        note: String(v.note || v.memo || '').trim().slice(0, 80)
      });
    });

    const notes = Array.isArray(raw.notes) ? raw.notes : [];
    const seenNotes = new Set();
    notes.forEach((n) => {
      const text = String(typeof n === 'string' ? n : (n && (n.text || n.note)) || '').trim();
      if (!text || seenNotes.has(text)) return;
      seenNotes.add(text);
      out.notes.push(text.slice(0, 200));
    });
    return out;
  }

  const salesRecEmpty = (rec) => {
    if (!rec) return true;
    const parts = [rec.sales, rec.purchase, rec.card && rec.card.deductible, rec.card && rec.card.total];
    return !rec.memo && !parts.some((x) => x && (x.supply || x.vat || x.count));
  };

  function salesYears() {
    const set = new Set(Object.keys(state.sales.months).map((m) => m.slice(0, 4)));
    set.add(String(state.sales.activeYear || new Date().getFullYear()));
    return Array.from(set).sort();
  }

  function salesYear() {
    const years = salesYears();
    const want = String(state.sales.activeYear || '');
    return years.indexOf(want) >= 0 ? want : years[years.length - 1];
  }

  function salesYearTotals(year) {
    const t = {
      sales: { supply: 0, vat: 0, count: 0 },
      purchase: { supply: 0, vat: 0, count: 0 },
      card: { deductible: { supply: 0, vat: 0, count: 0 }, total: { supply: 0, vat: 0, count: 0 } },
      filled: 0
    };
    for (let i = 1; i <= 12; i++) {
      const rec = state.sales.months[year + '-' + pad2(i)];
      if (!rec) continue;
      if (!salesRecEmpty(rec)) t.filled++;
      ['sales', 'purchase'].forEach((k) => {
        t[k].supply += rec[k].supply;
        t[k].vat += rec[k].vat;
        t[k].count += rec[k].count;
      });
      t.card.deductible.supply += rec.card.deductible.supply;
      t.card.deductible.vat += rec.card.deductible.vat;
      t.card.deductible.count += rec.card.deductible.count;
      t.card.total.supply += rec.card.total.supply;
      t.card.total.vat += rec.card.total.vat;
      t.card.total.count += rec.card.total.count;
    }
    t.net = t.sales.supply - t.purchase.supply - t.card.deductible.supply;
    return t;
  }

  const salesNetOf = (rec) => rec ? (rec.sales.supply - rec.purchase.supply - rec.card.deductible.supply) : 0;
  const salesNetHtml = (n) => `<span class="sales-net ${n < 0 ? 'neg' : 'pos'}">${n < 0 ? '−' : '+'}${fmtNum(Math.abs(n))}</span>`;

  function salesKpiHtml(t) {
    return `
      <div class="sales-kpi k-sales"><span>연간 매출 합계</span><b>${won(t.sales.supply + t.sales.vat)}</b><small>공급가액 ${fmtNum(t.sales.supply)} · 세액 ${fmtNum(t.sales.vat)}</small><small>${t.sales.count}건 · 부가세 포함</small></div>
      <div class="sales-kpi k-buy"><span>세금계산서 매입</span><b>${won(t.purchase.supply + t.purchase.vat)}</b><small>공급가액 ${fmtNum(t.purchase.supply)} · 세액 ${fmtNum(t.purchase.vat)}</small><small>${t.purchase.count}건 · 부가세 포함</small></div>
      <div class="sales-kpi k-card"><span>사업용카드 매입</span><b>${won(t.card.deductible.supply)}</b><small>전체 ${won(t.card.total.supply)}</small><small>공제 ${t.card.deductible.count}건 / 전체 ${t.card.total.count}건</small></div>
      <div class="sales-kpi k-net"><span>매출 − 매입 차액</span><b class="${t.net < 0 ? 'minus' : ''}">${t.net < 0 ? '−' : ''}${won(Math.abs(t.net))}</b><small>세금(부가세) 제외 · 공급가액 기준</small><small>차액 = 매출 − 세금계산서 매입 − 카드 공제</small></div>`;
  }

  function salesChartHtml(year) {
    let max = 0;
    const cells = [];
    for (let i = 1; i <= 12; i++) {
      const rec = state.sales.months[year + '-' + pad2(i)];
      const s = rec ? rec.sales.supply : 0;
      const p = rec ? rec.purchase.supply + rec.card.deductible.supply : 0;
      max = Math.max(max, s, p);
      cells.push({ i, s, p, rec });
    }
    const cols = cells.map((c) => {
      const hs = max ? Math.round((c.s / max) * 100) : 0;
      const hp = max ? Math.round((c.p / max) * 100) : 0;
      return `<div class="sc-col" title="${c.i}월 매출 ${fmtNum(c.s)}원 · 매입 ${fmtNum(c.p)}원">
        <div class="sc-bars">
          <span class="sc-bar sales" style="height:${c.s > 0 ? Math.max(3, hs) : 0}%"></span>
          <span class="sc-bar buy" style="height:${c.p > 0 ? Math.max(3, hp) : 0}%"></span>
        </div>
        <span class="sc-x${c.rec && !salesRecEmpty(c.rec) ? ' on' : ''}">${c.i}</span>
      </div>`;
    }).join('');
    return `<div class="sales-chart">
      <div class="sales-legend"><span><i class="dot sales"></i>매출</span><span><i class="dot buy"></i>매입 (세금계산서 + 카드 공제)</span></div>
      <div class="sales-chart-grid">${cols}</div>
    </div>`;
  }

  function salesTableHtml(year, t) {
    const label = (m) => Number(m.slice(5, 7)) + '월';
    const nowM = monthKey();
    const rows = [];
    for (let i = 1; i <= 12; i++) {
      const key = year + '-' + pad2(i);
      const rec = state.sales.months[key];
      const net = salesNetOf(rec);
      const dash = '<span class="dash">—</span>';
      rows.push(`<tr class="${key === nowM ? 'now' : ''}">
        <td class="m"><button type="button" class="sales-mbtn" data-sales-edit="${key}" aria-label="${label(key)} 입력·수정">${label(key)}</button></td>
        <td>${rec ? fmtNum(rec.sales.supply) : dash}</td>
        <td>${rec ? fmtNum(rec.sales.vat) : dash}</td>
        <td>${rec ? rec.sales.count : dash}</td>
        <td>${rec ? fmtNum(rec.purchase.supply) : dash}</td>
        <td>${rec ? fmtNum(rec.purchase.vat) : dash}</td>
        <td>${rec ? rec.purchase.count : dash}</td>
        <td>${rec && (rec.card.deductible.supply || rec.card.deductible.count) ? fmtNum(rec.card.deductible.supply) : dash}</td>
        <td>${rec && (rec.card.total.supply || rec.card.total.count) ? fmtNum(rec.card.total.supply) : dash}</td>
        <td>${rec ? salesNetHtml(net) : dash}</td>
      </tr>`);
      if (rec && rec.memo) {
        rows.push(`<tr class="sales-memo"><td colspan="10">⚠️ ${escapeHtml(rec.memo)}</td></tr>`);
      }
    }
    return `<div class="sales-table-wrap">
      <table class="sales-table">
        <thead>
          <tr>
            <th rowspan="2" class="m">월</th>
            <th colspan="3" class="grp">매출 · 전자세금계산서</th>
            <th colspan="3" class="grp">매입 · 전자세금계산서</th>
            <th colspan="2" class="grp">사업용카드 매입</th>
            <th rowspan="2">월 순수지</th>
          </tr>
          <tr>
            <th>공급가액</th><th>세액</th><th>건수</th>
            <th>공급가액</th><th>세액</th><th>건수</th>
            <th>공제대상</th><th>전체</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
        <tfoot>
          <tr class="total">
            <td class="m">합계</td>
            <td>${fmtNum(t.sales.supply)}</td><td>${fmtNum(t.sales.vat)}</td><td>${t.sales.count}</td>
            <td>${fmtNum(t.purchase.supply)}</td><td>${fmtNum(t.purchase.vat)}</td><td>${t.purchase.count}</td>
            <td>${fmtNum(t.card.deductible.supply)}</td><td>${fmtNum(t.card.total.supply)}</td>
            <td>${salesNetHtml(t.net)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
  }

  function salesCardsHtml(year, t) {
    const label = (m) => Number(m.slice(5, 7)) + '월';
    const nowM = monthKey();
    const cards = [];
    for (let i = 1; i <= 12; i++) {
      const key = year + '-' + pad2(i);
      const rec = state.sales.months[key];
      const net = salesNetOf(rec);
      const cardOn = !!rec && !!(rec.card.deductible.supply || rec.card.deductible.count || rec.card.total.supply || rec.card.total.count);
      cards.push(`<div class="sales-mcard${key === nowM ? ' now' : ''}">
        <div class="sc-head">
          <b>${label(key)}${rec && !salesRecEmpty(rec) ? '' : ' <span class="dash">기록 없음</span>'}</b>
          <button type="button" class="link-btn" data-sales-edit="${key}">${rec ? '수정' : '입력'}</button>
        </div>
        <div class="sc-grid">
          <div class="sc-cell"><span>매출</span><b>${rec ? fmtNum(rec.sales.supply) : '—'}</b><small>세액 ${rec ? fmtNum(rec.sales.vat) : '—'}</small><small>건수 ${rec ? rec.sales.count : 0}</small></div>
          <div class="sc-cell"><span>매입(세금계산서)</span><b>${rec ? fmtNum(rec.purchase.supply) : '—'}</b><small>세액 ${rec ? fmtNum(rec.purchase.vat) : '—'}</small><small>건수 ${rec ? rec.purchase.count : 0}</small></div>
          <div class="sc-cell"><span>사업용카드</span><b>${cardOn ? fmtNum(rec.card.deductible.supply) : '—'}</b><small>전체 ${cardOn ? fmtNum(rec.card.total.supply) : '—'}</small></div>
        </div>
        <div class="sc-foot">순수지 ${rec ? salesNetHtml(net) : '<span class="dash">—</span>'}${rec && rec.memo ? ` · <span class="sc-memo">⚠️ ${escapeHtml(rec.memo)}</span>` : ''}</div>
      </div>`);
    }
    return `<div class="sales-cards">${cards.join('')}</div>`;
  }

  function salesPartyHtml(list, kind) {
    const total = list.reduce((a, p) => a + p.amount, 0);
    const rows = list.map((p) => {
      const pct = total ? Math.max(2, Math.round((p.amount / total) * 100)) : 0;
      return `<div class="sp-row">
        <div class="sp-top">
          <span class="sp-name">${escapeHtml(p.name)}</span>
          <span class="sp-amt">${fmtNum(p.amount)}<small>${p.count}건</small></span>
        </div>
        <div class="sp-bar"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join('');
    return `<div class="sales-panel ${kind}">
      <h4>${kind === 'sales' ? '📤 매출처' : '📥 매입처'} <span class="count">${list.length}곳 · ${won(total)}</span></h4>
      ${rows || '<div class="empty-box">아직 없어요.</div>'}
    </div>`;
  }

  function renderBizSales() {
    const el = $('#bizSales');
    if (!el) return;
    if (!state.sales || typeof state.sales !== 'object') state.sales = salesDefault();
    const years = salesYears();
    const year = salesYear();
    const t = salesYearTotals(year);
    const filled = Object.keys(state.sales.months).length;
    const bizName = state.sales.business.name;
    const regNo = state.sales.business.regNo;

    const yearNav = years.length > 1
      ? `<div class="month-picker fx-monthpick">
          <button class="icon-btn sm" type="button" data-sales-year="-1" aria-label="이전 연도">◀</button>
          <strong>${year}년</strong>
          <button class="icon-btn sm" type="button" data-sales-year="1" aria-label="다음 연도">▶</button>
        </div>`
      : `<span class="fx-month">${year}년</span>`;

    const buttons = `
      <button class="btn btn-ghost btn-sm" type="button" data-sales-import>📥 매출·매입 불러오기</button>
      <button class="btn btn-ghost btn-sm" type="button" data-sales-export>⬇️ 내보내기</button>
      <button class="btn btn-mint btn-sm" type="button" data-sales-add>＋ 월 입력</button>`;

    const bizTitle = `📊 ${escapeHtml(companyName())} 월별 매출·매입 현황`;
    const bizMeta = [bizName && bizName !== companyName() ? bizName : '', regNo].filter(Boolean).join(' · ');

    if (!filled) {
      el.innerHTML = `<div class="card sales-card">
        <header class="fixed-head">
          <div class="fixed-title">
            <h3>${bizTitle}</h3>
            ${yearNav}
          </div>
          <div class="fixed-tools">${buttons}</div>
        </header>
        <div class="empty-box sales-empty">
          <b>📥 매출·매입 파일을 불러와 주세요.</b><br>
          홈택스에서 정리한 월별 매출·매입 JSON을 읽으면 연간 요약, 월별 표, 매출처·매입처, 부가세 신고 기록이 여기에 나와요.<br>
          금액은 이 기기 브라우저에만 저장되고 인터넷(GitHub)에는 올라가지 않아요.
        </div>
      </div>`;
      return;
    }

    const partners = state.sales.partners;
    const hasPartners = partners.sales.length || partners.purchase.length;
    const vatRows = state.sales.vatReturns.map((v) => `
      <div class="svat-row">
        <span class="svat-p">${escapeHtml(v.period)}${v.range ? `<small>${escapeHtml(v.range)}</small>` : ''}</span>
        <span class="svat-a">${won(v.paid)}${v.note ? `<small>${escapeHtml(v.note)}</small>` : ''}</span>
      </div>`).join('');
    const noteRows = state.sales.notes.map((n) => `<p class="snote">💡 <span>${escapeHtml(n)}</span></p>`).join('');

    el.innerHTML = `<div class="card sales-card">
      <header class="fixed-head">
        <div class="fixed-title">
          <h3>${bizTitle}</h3>
          ${yearNav}
          ${bizMeta ? `<span class="sales-biz">${escapeHtml(bizMeta)}</span>` : ''}
        </div>
        <div class="fixed-tools">${buttons}</div>
      </header>
      <div class="sales-kpis">${salesKpiHtml(t)}</div>
      ${salesChartHtml(year)}
      ${salesTableHtml(year, t)}
      ${salesCardsHtml(year, t)}
      ${hasPartners ? `<div class="sales-sub">
        ${salesPartyHtml(partners.sales, 'sales')}
        ${salesPartyHtml(partners.purchase, 'purchase')}
      </div>` : ''}
      ${state.sales.vatReturns.length ? `<div class="sales-sub one"><div class="sales-panel vat">
        <h4>🧾 부가세 신고 기록 <span class="count">${state.sales.vatReturns.length}건</span></h4>
        ${vatRows}
      </div></div>` : ''}
      ${state.sales.notes.length ? `<div class="sales-sub one"><div class="sales-panel notes">
        <h4>📌 챙길 메모 <span class="count">${state.sales.notes.length}개</span></h4>
        ${noteRows}
      </div></div>` : ''}
      <p class="fx-note">${state.sales.source ? escapeHtml(state.sales.source) + ' · ' : ''}금액은 공급가액·세액(원) 기준이에요. 실제 금액은 이 기기 브라우저에만 저장되고, ⬇️ 내보내기 파일로 다른 기기로 옮길 수 있어요.</p>
    </div>`;
  }

  /* ---------- 월 입력·수정 ---------- */
  function openSalesMonthModal({ month } = {}) {
    const year = salesYear();
    const fallback = monthKey().slice(0, 4) === year ? monthKey() : year + '-01';
    const key0 = /^\d{4}-\d{2}$/.test(String(month || '')) ? month : fallback;
    const isEdit = !!state.sales.months[key0];
    const rec = state.sales.months[key0] || {
      sales: { supply: 0, vat: 0, count: 0 },
      purchase: { supply: 0, vat: 0, count: 0 },
      card: { deductible: { supply: 0, vat: 0, count: 0 }, total: { supply: 0, vat: 0, count: 0 } },
      memo: ''
    };
    const val = (n) => (n ? fmtNum(n) : '');
    const money = (id, label, v) => `<div class="field"><label for="${id}">${label}</label>
      <input type="text" id="${id}" inputmode="numeric" autocomplete="off" value="${val(v)}" placeholder="0"></div>`;

    openModal({
      title: isEdit ? '📊 매출·매입 수정' : '📊 월 매출·매입 입력',
      body: `
        <div class="sales-form">
          <div class="field"><label for="sd-month">월</label>
            <input type="month" id="sd-month" value="${key0}">
          </div>
          <div class="sf-group">
            <p class="sf-title">매출 (전자세금계산서)</p>
            <div class="sf-grid">
              ${money('sd-s-sup', '공급가액', rec.sales.supply)}
              ${money('sd-s-vat', '세액', rec.sales.vat)}
              ${money('sd-s-cnt', '건수', rec.sales.count)}
            </div>
          </div>
          <div class="sf-group">
            <p class="sf-title">매입 (전자세금계산서)</p>
            <div class="sf-grid">
              ${money('sd-p-sup', '공급가액', rec.purchase.supply)}
              ${money('sd-p-vat', '세액', rec.purchase.vat)}
              ${money('sd-p-cnt', '건수', rec.purchase.count)}
            </div>
          </div>
          <div class="sf-group">
            <p class="sf-title">사업용카드 매입</p>
            <div class="sf-grid">
              ${money('sd-cd-sup', '공제대상 공급가액', rec.card.deductible.supply)}
              ${money('sd-cd-vat', '공제대상 세액', rec.card.deductible.vat)}
              ${money('sd-cd-cnt', '공제 건수', rec.card.deductible.count)}
            </div>
            <div class="sf-grid">
              ${money('sd-ca-sup', '전체 공급가액', rec.card.total.supply)}
              ${money('sd-ca-vat', '전체 세액', rec.card.total.vat)}
              ${money('sd-ca-cnt', '전체 건수', rec.card.total.count)}
            </div>
          </div>
          <div class="field"><label for="sd-memo">메모 (선택)</label>
            <input type="text" id="sd-memo" maxlength="120" value="${escapeHtml(rec.memo || '')}" placeholder="예: 카드 공제 변경 확인 필요">
          </div>
          <p class="hint">세액을 비워 두고 공급가액만 적으면 10%로 채워 드려요. 입력한 내용은 이 기기 브라우저에만 저장돼요.</p>
          ${isEdit ? '<button type="button" class="btn btn-ghost btn-sm" id="sdClear">🗑 이 달 기록 비우기</button>' : ''}
        </div>`,
      submitLabel: isEdit ? '수정 저장' : '저장',
      onMount: (root) => {
        const pairs = [['sd-s-sup', 'sd-s-vat'], ['sd-p-sup', 'sd-p-vat'], ['sd-cd-sup', 'sd-cd-vat'], ['sd-ca-sup', 'sd-ca-vat']];
        pairs.forEach(([supId, vatId]) => {
          const sup = root.querySelector('#' + supId);
          const vat = root.querySelector('#' + vatId);
          if (!sup || !vat) return;
          sup.addEventListener('blur', () => {
            const digits = String(sup.value).replace(/[^0-9]/g, '');
            if (!digits || String(vat.value).trim()) return;
            vat.value = fmtNum(Math.round(Number(digits) * 0.1));
          });
        });
        const clear = root.querySelector('#sdClear');
        if (clear) {
          clear.addEventListener('click', () => {
            closeModal();
            confirmModal({
              title: '이 달 기록 비우기',
              message: `${key0.slice(0, 4)}년 ${Number(key0.slice(5, 7))}월 매출·매입 기록을 지울까요?`,
              confirmLabel: '비우기',
              onConfirm: () => {
                delete state.sales.months[key0];
                save();
                renderBizSales();
                toast('이 달 기록을 비웠어요.');
              }
            });
          });
        }
      },
      onSubmit: (root) => {
        const m = String(root.querySelector('#sd-month').value || '').slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(m)) { toast('월을 골라 주세요.'); return false; }
        const num = (id) => salesNum(root.querySelector('#' + id).value);
        const rec2 = {
          sales: { supply: num('sd-s-sup'), vat: num('sd-s-vat'), count: num('sd-s-cnt') },
          purchase: { supply: num('sd-p-sup'), vat: num('sd-p-vat'), count: num('sd-p-cnt') },
          card: {
            deductible: { supply: num('sd-cd-sup'), vat: num('sd-cd-vat'), count: num('sd-cd-cnt') },
            total: { supply: num('sd-ca-sup'), vat: num('sd-ca-vat'), count: num('sd-ca-cnt') }
          },
          memo: String(root.querySelector('#sd-memo').value || '').trim().slice(0, 120)
        };
        if (m !== key0 && state.sales.months[m] && !salesRecEmpty(state.sales.months[m])) {
          toast(m.slice(0, 4) + '년 ' + Number(m.slice(5, 7)) + '월에 이미 기록이 있어요.');
          return false;
        }
        if (salesRecEmpty(rec2)) {
          delete state.sales.months[key0];
        } else {
          if (m !== key0) delete state.sales.months[key0];
          state.sales.months[m] = rec2;
        }
        state.sales.activeYear = Number(m.slice(0, 4));
        state.sales.updatedAt = new Date().toISOString();
        save();
        renderBizSales();
        toast(`${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월 매출·매입을 저장했어요.`);
      }
    });
  }

  /* ---------- 내보내기 / 불러오기 ---------- */
  function exportSales() {
    const year = salesYear();
    const months = {};
    Object.keys(state.sales.months).sort().forEach((k) => { months[k] = state.sales.months[k]; });
    const data = {
      type: SALES_FILE_TYPE,
      version: 1,
      title: `${state.sales.business.name || '사업'} ${year}년 매출·매입 현황`,
      year: Number(year),
      business: state.sales.business,
      source: state.sales.source,
      exportedAt: new Date().toISOString(),
      months,
      partners: state.sales.partners,
      vatReturns: state.sales.vatReturns,
      notes: state.sales.notes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `매출매입-${year}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('매출·매입 파일을 내려받았어요.');
  }

  /* 매출·매입 파일 불러오기 — 기존 고정지출·가계부·루틴은 그대로 두고 매출 기록만 더함 */
  function importSalesFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    input.value = '';
    const reader = new FileReader();
    reader.onerror = () => toast('파일을 읽지 못했어요.');
    reader.onload = () => {
      let parsed = null;
      try { parsed = JSON.parse(String(reader.result)); } catch (err) { parsed = null; }
      if (!parsed || typeof parsed !== 'object') { toast('JSON 파일을 읽지 못했어요. 파일을 확인해 주세요.'); return; }

      const src = (parsed.sales && typeof parsed.sales === 'object' &&
        (parsed.sales.months || parsed.sales.partners)) ? Object.assign({}, parsed, parsed.sales) : parsed;
      const incoming = normalizeSalesState(src);
      const inMonths = Object.keys(incoming.months);
      if (!inMonths.length && !incoming.partners.sales.length && !incoming.partners.purchase.length && !incoming.vatReturns.length) {
        toast('매출·매입 기록(months)을 찾지 못했어요. 파일을 확인해 주세요.');
        return;
      }

      const fresh = [];
      const dup = [];
      inMonths.sort().forEach((k) => {
        if (salesRecEmpty(incoming.months[k])) return;
        if (state.sales.months[k] && !salesRecEmpty(state.sales.months[k])) dup.push(k);
        else fresh.push(k);
      });
      const inYear = inMonths.length ? Number(inMonths[inMonths.length - 1].slice(0, 4)) : incoming.activeYear;
      const yTotals = { sales: 0, purchase: 0 };
      inMonths.forEach((k) => {
        yTotals.sales += incoming.months[k].sales.supply;
        yTotals.purchase += incoming.months[k].purchase.supply;
      });

      openModal({
        title: '📥 매출·매입 파일 불러오기',
        body: `
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">${escapeHtml(parsed.title || '매출·매입 파일')}<br>파일: ${escapeHtml(file.name)}${incoming.source ? '<br>' + escapeHtml(incoming.source) : ''}</p>
          <div class="fx-import-grid">
            <span>읽은 달 <b>${inMonths.length}개</b></span>
            <span>새로 추가 <b>${fresh.length}개</b></span>
            ${dup.length ? `<span>이미 있어 건너뜀 <b>${dup.length}개</b></span>` : ''}
          </div>
          <div class="fx-import-grid">
            <span>매출 공급가액 <b>${won(yTotals.sales)}</b></span>
            <span>매입 공급가액 <b>${won(yTotals.purchase)}</b></span>
          </div>
          <div class="fx-import-grid">
            <span>매출처 <b>${incoming.partners.sales.length}곳</b></span>
            <span>매입처 <b>${incoming.partners.purchase.length}곳</b></span>
            <span>부가세 신고 <b>${incoming.vatReturns.length}건</b></span>
            <span>메모 <b>${incoming.notes.length}개</b></span>
          </div>
          ${dup.length ? `<label class="sf-check"><input type="checkbox" id="sd-overwrite"> 이미 기록된 달도 파일 값으로 바꾸기 (${dup.length}개)</label>` : ''}
          <p class="hint" style="font-size:12.5px;color:var(--ink-2);line-height:1.7">기존 루틴·고정지출·가계부는 그대로 두고 매출·매입 기록만 더해요. 이 내용은 이 기기 브라우저에만 저장되고 인터넷에 올라가지 않아요.</p>`,
        submitLabel: fresh.length || dup.length ? '불러오기' : '닫기',
        onSubmit: (root) => {
          const ow = !!(root.querySelector('#sd-overwrite') || {}).checked;
          let added = 0;
          let replaced = 0;
          fresh.forEach((k) => { state.sales.months[k] = incoming.months[k]; added++; });
          if (ow) dup.forEach((k) => { state.sales.months[k] = incoming.months[k]; replaced++; });

          const mergeParties = (key, list) => {
            const cur = state.sales.partners[key];
            list.forEach((p) => {
              const hit = cur.find((x) => x.name === p.name);
              if (!hit) cur.push(p);
              else if (ow) { hit.amount = p.amount; hit.count = p.count; }
            });
            state.sales.partners[key] = cur.sort((a, b) => b.amount - a.amount);
          };
          mergeParties('sales', incoming.partners.sales);
          mergeParties('purchase', incoming.partners.purchase);

          incoming.vatReturns.forEach((v) => {
            const hit = state.sales.vatReturns.find((x) => x.period === v.period);
            if (!hit) state.sales.vatReturns.push(v);
            else if (ow) Object.assign(hit, v);
          });

          incoming.notes.forEach((n) => {
            if (state.sales.notes.indexOf(n) < 0) state.sales.notes.push(n);
          });

          if (!state.sales.business.name && incoming.business.name) state.sales.business = incoming.business;
          if (!state.sales.source || ow) state.sales.source = incoming.source || state.sales.source;
          state.sales.activeYear = inYear;
          state.sales.updatedAt = new Date().toISOString();
          save();
          renderBizSales();
          toast(added || replaced
            ? `매출·매입 ${added + replaced}개월을 ${replaced ? '바꾸고 더했어요' : '더했어요'}.`
            : '이미 있는 기록이라 새로 더하지 않았어요.');
        }
      });
    };
    reader.readAsText(file);
  }

  /* ---------- 탭 전환 ---------- */
  const RENDERERS = { home: renderHome, kids: renderKids, work: renderWorkAll, biz: renderBizAll, money: renderMoney };

  /* 설정한 이름표를 탭·화면 제목·상단 이름에 반영 */
  function applyLabels() {
    const setText = (sel, txt) => { const n = $(sel); if (n && n.textContent !== txt) n.textContent = txt; };
    const biz = companyName();
    const led = ledgerLabel();
    setText('#tab-biz', '📦 ' + biz);
    setText('#tab-money', '💰 ' + led);
    setText('#panel-biz .panel-title', '📦 ' + biz);
    setText('#panel-money .panel-title', '💰 ' + led);
    setText('#home-biz-h', '📦 ' + biz);
    setText('#home-money-h', '💰 ' + led);
    setText('.brand-text', appName());
    if (document.title !== appName()) document.title = appName();
  }

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
    applyLabels();
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
    if (modal.open) { try { modal.close(); } catch (err) { /* 무시 */ } }
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
    const label = key === 'biz' ? companyName() : '내 업무';
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
    const d = DEFAULT_SETTINGS();
    openModal({
      title: '⚙️ 설정',
      body: `
        <div class="settings-block">
          <h3>🏷️ 화면에 보이는 이름</h3>
          <div class="field"><label for="s-app">대시보드 이름</label>
            <input type="text" id="s-app" value="${escapeHtml(appName())}" placeholder="${escapeHtml(d.appName)}" maxlength="20">
          </div>
          <div class="field"><label for="s-biz">회사(사업) 이름</label>
            <input type="text" id="s-biz" value="${escapeHtml(companyName())}" placeholder="${escapeHtml(d.bizName)}" maxlength="16">
          </div>
          <div class="field"><label for="s-money">가계부 탭 이름</label>
            <input type="text" id="s-money" value="${escapeHtml(ledgerLabel())}" placeholder="${escapeHtml(d.moneyLabel)}" maxlength="16">
          </div>
          <div class="field-pair">
            <div class="field"><label for="s-c5">아이 1 이름표</label>
              <input type="text" id="s-c5" value="${escapeHtml(kidName('c5'))}" placeholder="${escapeHtml(d.kidsLabels.c5)}" maxlength="10">
            </div>
            <div class="field"><label for="s-c3">아이 2 이름표</label>
              <input type="text" id="s-c3" value="${escapeHtml(kidName('c3'))}" placeholder="${escapeHtml(d.kidsLabels.c3)}" maxlength="10">
            </div>
          </div>
          <p class="hint">바꾼 이름은 상단 탭과 화면 제목에 바로 반영돼요. 로그인하지 않으면 이 기기에만, 로그인하면 클라우드에도 함께 저장돼요.</p>
        </div>

        <div class="settings-block">
          <h3>⏰ 출발 카운트다운</h3>
          <div class="field-pair">
            <div class="field"><label for="s-depart">출발 시간</label>
              <input type="time" id="s-depart" value="${escapeHtml(state.settings.departTime || d.departTime)}">
            </div>
            <div class="field"><label for="s-goal">카운트다운 이름</label>
              <input type="text" id="s-goal" value="${escapeHtml(state.settings.goalLabel || d.goalLabel)}" placeholder="${escapeHtml(d.goalLabel)}" maxlength="12">
            </div>
          </div>
          <p class="hint">홈 위쪽 카운트다운이 이 시간까지 남은 시간을 보여줘요.</p>
        </div>

        <div class="settings-block">
          <h3>↩️ 설정만 기본값으로</h3>
          <p class="hint">이름표·시간을 처음 값으로 되돌려요. 아이들 루틴·업무·가계부·매출 기록은 그대로 남아요.</p>
          <div class="data-btns">
            <button type="button" class="btn btn-ghost" id="btnResetSettings">↩️ 설정 기본값으로</button>
          </div>
        </div>

        <div class="settings-block">
          <h3>☁️ 클라우드 동기화 (Google 로그인)</h3>
          <div class="cloud-panel" id="cloudPanel"></div>
        </div>

        <div class="settings-block">
          <h3>📦 데이터 백업 / 복원</h3>
          <p class="hint">입력한 내용은 이 브라우저에 저장되고, Google 로그인하면 클라우드에도 함께 저장돼요. 다른 기기로 옮기려면 아래에서 파일로 내보낸 뒤, 그 기기에서 가져오기를 눌러 주세요.</p>
          <div class="data-btns">
            <button type="button" class="btn btn-ghost" id="btnExport">⬇️ 파일로 내보내기</button>
            <button type="button" class="btn btn-ghost" id="btnImport">⬆️ 파일 가져오기</button>
            <button type="button" class="btn btn-danger" id="btnReset">전체 초기화</button>
          </div>
          <input type="file" id="fileInput" accept="application/json,.json" class="file-input">
        </div>`,
      submitLabel: '저장',
      onMount: (root) => {
        const cloudPanel = root.querySelector('#cloudPanel');
        if (cloudPanel) renderCloudPanel(cloudPanel);
        root.querySelector('#btnExport').addEventListener('click', exportJson);
        const fileInput = root.querySelector('#fileInput');
        root.querySelector('#btnImport').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => importJson(fileInput));
        root.querySelector('#btnResetSettings').addEventListener('click', () => {
          if (!window.confirm('이름표와 시간 설정을 처음 값으로 돌릴까요? 저장된 기록은 그대로 남아요.')) return;
          state.settings = DEFAULT_SETTINGS();
          save();
          applyLabels();
          renderAll();
          const now = { 's-app': appName(), 's-biz': companyName(), 's-money': ledgerLabel(), 's-c5': kidName('c5'), 's-c3': kidName('c3'), 's-depart': state.settings.departTime, 's-goal': state.settings.goalLabel };
          Object.entries(now).forEach(([id, v]) => { const el = root.querySelector('#' + id); if (el) el.value = v; });
          toast('설정을 기본값으로 되돌렸어요.');
        });
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
        const t = root.querySelector('#s-depart').value || d.departTime;
        const goal = root.querySelector('#s-goal').value.trim() || d.goalLabel;
        const c5 = root.querySelector('#s-c5').value.trim() || d.kidsLabels.c5;
        const c3 = root.querySelector('#s-c3').value.trim() || d.kidsLabels.c3;
        const app = root.querySelector('#s-app').value.trim().slice(0, 20) || d.appName;
        const biz = root.querySelector('#s-biz').value.trim().slice(0, 16) || d.bizName;
        const led = root.querySelector('#s-money').value.trim().slice(0, 16) || d.moneyLabel;
        Object.assign(state.settings, { appName: app, bizName: biz, moneyLabel: led, departTime: t, goalLabel: goal, kidsLabels: { c5, c3 } });
        save();
        applyLabels();
        renderAll();
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
    a.download = `${appName().replace(/\s+/g, '-')}-백업-${todayISO()}.json`;
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

    // 고정지출
    const fxPaidBtn = t.closest('[data-fx-paid]');
    if (fxPaidBtn) {
      const id = fxPaidBtn.dataset.fxPaid;
      const rec = fxRecord(fxMonth());
      if (rec.paid[id]) delete rec.paid[id]; else rec.paid[id] = true;
      save();
      const row = fxPaidBtn.closest('.fx-row');
      if (row) row.classList.toggle('is-paid', !!rec.paid[id]);
      fxPaidBtn.setAttribute('aria-pressed', rec.paid[id] ? 'true' : 'false');
      const card = fxPaidBtn.closest('[data-scope]');
      if (card) updateFixedTotals(card.dataset.scope);
      return;
    }

    const fxAddBtn = t.closest('[data-fx-add]');
    if (fxAddBtn) { openFixedModal({ scope: fxAddBtn.dataset.fxAdd }); return; }

    const fxEditBtn = t.closest('[data-fx-edit]');
    if (fxEditBtn) {
      const item = state.fixed.items.find((i) => i.id === fxEditBtn.dataset.fxEdit);
      if (item) openFixedModal({ scope: item.scope, item });
      return;
    }

    const fxDelBtn = t.closest('[data-fx-del]');
    if (fxDelBtn) {
      const item = state.fixed.items.find((i) => i.id === fxDelBtn.dataset.fxDel);
      if (!item) return;
      confirmModal({
        title: '고정지출 삭제',
        message: `'${item.name}' 항목을 지울까요? 기록된 실제 금액과 완료 표시도 함께 지워져요.`,
        onConfirm: () => {
          state.fixed.items = state.fixed.items.filter((i) => i.id !== item.id);
          Object.keys(state.fixed.months).forEach((m) => {
            const rec = state.fixed.months[m] || {};
            if (rec.actual) delete rec.actual[item.id];
            if (rec.paid) delete rec.paid[item.id];
          });
          save();
          renderFixedBoth();
          renderHomeFixed();
          toast('삭제했어요.');
        }
      });
      return;
    }

    const fxMonthBtn = t.closest('[data-fx-month]');
    if (fxMonthBtn) {
      state.ui.month = shiftMonth(fxMonth(), Number(fxMonthBtn.dataset.fxMonth) || 0);
      save();
      renderFixedBoth();
      renderMoney();
      renderHomeFixed();
      return;
    }

    const fxResetBtn = t.closest('[data-fx-reset]');
    if (fxResetBtn) { resetFixedMonth(fxResetBtn.dataset.fxReset); return; }

    const fxExportBtn = t.closest('[data-fx-export]');
    if (fxExportBtn) { exportFixed(fxExportBtn.dataset.fxExport); return; }

    const fxImportBtn = t.closest('[data-fx-import]');
    if (fxImportBtn) {
      const fi = $('#fixedFileInput');
      if (fi) { fi.dataset.scope = fxImportBtn.dataset.fxImport; fi.click(); }
      return;
    }

    // 매출·매입
    const salesImportBtn = t.closest('[data-sales-import]');
    if (salesImportBtn) {
      const si = $('#salesFileInput');
      if (si) si.click();
      return;
    }

    const salesExportBtn = t.closest('[data-sales-export]');
    if (salesExportBtn) { exportSales(); return; }

    const salesAddBtn = t.closest('[data-sales-add]');
    if (salesAddBtn) { openSalesMonthModal({}); return; }

    const salesEditBtn = t.closest('[data-sales-edit]');
    if (salesEditBtn) { openSalesMonthModal({ month: salesEditBtn.dataset.salesEdit }); return; }

    const salesYearBtn = t.closest('[data-sales-year]');
    if (salesYearBtn) {
      const years = salesYears();
      const cur = years.indexOf(salesYear());
      const next = years[(cur + Number(salesYearBtn.dataset.salesYear) + years.length) % years.length];
      state.sales.activeYear = Number(next);
      save();
      renderBizSales();
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

    if (t.id === 'cloudBtn' || t.closest('#cloudBtn')) { onCloudBtnClick(); return; }

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

  // 메모 자동 저장 / 고정지출 금액 입력
  document.addEventListener('input', (e) => {
    const fxInput = e.target.closest('[data-fx-plan], [data-fx-actual]');
    if (fxInput) {
      const card = fxInput.closest('[data-scope]');
      const scope = card ? card.dataset.scope : 'biz';
      const digits = String(fxInput.value).replace(/[^0-9]/g, '');
      const raw = digits === '' ? '' : Math.min(9.99e12, Number(digits) || 0);
      if (fxInput.dataset.fxPlan) {
        const item = state.fixed.items.find((i) => i.id === fxInput.dataset.fxPlan);
        if (item) item.amount = raw === '' ? 0 : raw;
      } else {
        const id = fxInput.dataset.fxActual;
        const rec = fxRecord(fxMonth());
        if (raw === '') delete rec.actual[id]; else rec.actual[id] = raw;
      }
      clearTimeout(fxSaveTimer);
      fxSaveTimer = setTimeout(save, 400);
      updateFixedTotals(scope);
      return;
    }

    const ta = e.target.closest('[data-memo]');
    if (!ta) return;
    const key = ta.dataset.memo;
    state[key].memo = ta.value;
    const cnt = ta.parentElement.querySelector('[data-memo-count]');
    if (cnt) cnt.textContent = ta.value.length + '자';
    clearTimeout(window.__memoTimer);
    window.__memoTimer = setTimeout(save, 350);
  });

  // 금액 칸에서 손을 떼면 1,000 단위로 보기 좋게 (값 자체는 그대로)
  document.addEventListener('change', (e) => {
    const fxInput = e.target.closest('[data-fx-plan], [data-fx-actual]');
    if (!fxInput) return;
    const digits = String(fxInput.value).replace(/[^0-9]/g, '');
    fxInput.value = digits ? fmtNum(Number(digits)) : '';
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

  const salesFileInput = $('#salesFileInput');
  if (salesFileInput) salesFileInput.addEventListener('change', () => importSalesFile(salesFileInput));

  const fixedFileInput = $('#fixedFileInput');
  if (fixedFileInput) fixedFileInput.addEventListener('change', () => importFixedFile(fixedFileInput, fixedFileInput.dataset.scope || 'biz'));

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
