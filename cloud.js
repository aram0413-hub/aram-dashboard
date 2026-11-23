/* =========================================================
   우리집 대시보드 · cloud.js
   Google 로그인(Firebase Auth) + 실시간 동기화(Firestore)
   - 여기에는 공개용 웹 앱 설정만 둡니다. (개인정보 없음)
   - 누가 읽고 쓸 수 있는지는 Firebase 콘솔의 Firestore 보안 규칙이 정합니다.
   - 이 파일은 app.js 보다 늦게(모듈) 실행되고, 준비가 끝나면
     'dashboard-cloud-ready' 이벤트로 app.js 에 알려 줍니다.
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence,
  signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

/* 공개용 웹 앱 설정 (비밀 키가 아니라 공개되어도 되는 클라이언트 설정) */
const firebaseConfig = {
  apiKey: 'AIzaSyDd-DjaJtGy_3l7ztk39jhnwepQiQLhYl8',
  authDomain: 'aram-dashboard-sync.firebaseapp.com',
  projectId: 'aram-dashboard-sync',
  storageBucket: 'aram-dashboard-sync.firebasestorage.app',
  messagingSenderId: '542007783819',
  appId: '1:542007783819:web:054eef5d1a5eb8ed8eff8e'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const COLLECTION = 'dashboard';
const DOC_ID = 'state';
const stateDoc = (uid) => doc(db, 'users', uid, COLLECTION, DOC_ID);

let currentUser = null;
let unwatch = null;
const authCbs = [];

const api = {
  ready: false,
  error: '',
  kind: '',
  user: () => currentUser,
  name: () => (currentUser ? (currentUser.displayName || '로그인됨') : ''),
  onAuth(cb) {
    if (typeof cb !== 'function') return;
    authCbs.push(cb);
    if (api.ready) {
      try { cb(currentUser); } catch (err) { console.warn(err); }
    }
  },
  async signIn() {
    try { await setPersistence(auth, browserLocalPersistence); } catch (err) { /* 무시 */ }
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err && err.code) || '';
      if (code === 'auth/popup-blocked'
        || code === 'auth/operation-not-supported-in-this-environment'
        || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  },
  async signOutNow() { await signOut(auth); },
  async read() {
    if (!currentUser) return null;
    const snap = await getDoc(stateDoc(currentUser.uid));
    return snap.exists() ? snap.data() : null;
  },
  async write(state) {
    if (!currentUser) return;
    await setDoc(stateDoc(currentUser.uid), {
      state,
      updatedAt: state.updatedAt || new Date().toISOString(),
      device: (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || 'web'
    });
  },
  watch(cb) {
    if (!currentUser) return;
    if (unwatch) { unwatch(); unwatch = null; }
    unwatch = onSnapshot(stateDoc(currentUser.uid), (snap) => {
      let data = null;
      try { data = snap.exists() ? snap.data() : null; } catch (err) { console.warn(err); }
      cb(data, { pending: !!(snap.metadata && snap.metadata.hasPendingWrites) });
    }, (err) => {
      api.error = (err && err.code) || 'snapshot_error';
      window.dispatchEvent(new CustomEvent('dashboard-cloud-error', { detail: api.error }));
    });
  },
  unwatch() {
    if (unwatch) { unwatch(); unwatch = null; }
  }
};
window.DashboardSync = api;

/* 첫 로그인 상태를 확인하고 앱에 준비 완료를 알린다 */
(async () => {
  let resolveFirst = null;
  const firstAuth = new Promise((resolve) => { resolveFirst = resolve; });

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    api.error = '';
    if (!user) api.unwatch();
    authCbs.forEach((cb) => { try { cb(currentUser); } catch (err) { console.warn(err); } });
    if (resolveFirst) { resolveFirst(currentUser); resolveFirst = null; }
  });

  try { await setPersistence(auth, browserLocalPersistence); } catch (err) { /* 무시 */ }
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) currentUser = res.user;
  } catch (err) {
    api.error = (err && err.code) || 'redirect_error';
  }

  await Promise.race([firstAuth, new Promise((resolve) => setTimeout(resolve, 6000))]);
  api.ready = true;
  window.dispatchEvent(new CustomEvent('dashboard-cloud-ready'));
})().catch((err) => {
  api.error = (err && err.code) || String(err);
  api.ready = false;
  window.dispatchEvent(new CustomEvent('dashboard-cloud-failed', { detail: api.error }));
});
