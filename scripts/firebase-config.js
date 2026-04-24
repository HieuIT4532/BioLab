/* ============================================================
   BioLab X — Firebase Configuration (Client-side)
   Kết nối Frontend ↔ Firebase Realtime Database / Auth
   ============================================================ */

/**
 * 🔥 HƯỚNG DẪN CÀI ĐẶT FIREBASE:
 *
 * BƯỚC 1: Tạo Firebase Project
 *   1. Vào https://console.firebase.google.com
 *   2. Click "Add Project" → Đặt tên "BioLab-X"
 *   3. Bỏ chọn Google Analytics (không cần) → Create Project
 *
 * BƯỚC 2: Lấy Firebase Config
 *   1. Trong project → Click ⚙️ Settings → Project Settings
 *   2. Kéo xuống "Your apps" → Click icon "</>" (Web)
 *   3. Đặt tên app: "BioLab Web" → Register
 *   4. Copy đoạn firebaseConfig bên dưới
 *   5. Paste vào object FIREBASE_CONFIG bên dưới
 *
 * BƯỚC 3: Bật Realtime Database
 *   1. Sidebar → Build → Realtime Database → Create Database
 *   2. Chọn region: asia-southeast1 (Singapore)
 *   3. Chọn "Start in TEST MODE" (cho dev)
 *   4. Click Enable
 *
 * BƯỚC 4: Bật Authentication
 *   1. Sidebar → Build → Authentication → Get Started
 *   2. Sign-in method → Enable "Email/Password"
 *   3. (Optional) Enable "Google" sign-in
 *
 * BƯỚC 5: Cập nhật Security Rules (cho production)
 *   Realtime Database → Rules:
 *   {
 *     "rules": {
 *       "students": {
 *         "$uid": {
 *           ".read": "$uid === auth.uid || root.child('teachers').child(auth.uid).exists()",
 *           ".write": "$uid === auth.uid"
 *         }
 *       },
 *       "teachers": {
 *         "$uid": {
 *           ".read": "$uid === auth.uid",
 *           ".write": "$uid === auth.uid"
 *         }
 *       },
 *       "classes": {
 *         "$classId": {
 *           ".read": "auth != null",
 *           ".write": "root.child('teachers').child(auth.uid).exists()"
 *         }
 *       },
 *       "leaderboard": {
 *         ".read": true,
 *         ".write": "auth != null"
 *       },
 *       "citizenScience": {
 *         ".read": true,
 *         ".write": "auth != null"
 *       }
 *     }
 *   }
 */

// ══════════════════════════════════════════════
// FIREBASE CONFIG — THAY THẾ BẰNG CONFIG CỦA BẠN
// ══════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ══════════════════════════════════════════════
// FIREBASE CLIENT MODULE
// ══════════════════════════════════════════════
const BioLabFirebase = (() => {
  let app = null;
  let db = null;
  let auth = null;
  let currentUser = null;
  let initialized = false;
  let offlineMode = true; // Default to offline/localStorage

  // ── Initialize Firebase ──
  async function init() {
    if (initialized) return;
    
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
      console.warn('🔥 Firebase SDK not loaded — using localStorage mode');
      offlineMode = true;
      initialized = true;
      return;
    }

    // Check if config is set
    if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      console.warn('🔥 Firebase config not set — using localStorage mode');
      console.info('💡 Xem hướng dẫn tại scripts/firebase-config.js');
      offlineMode = true;
      initialized = true;
      return;
    }

    try {
      app = firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      auth = firebase.auth();
      offlineMode = false;
      initialized = true;

      // Listen for auth changes
      auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
          console.log(`🔥 Logged in as: ${user.email}`);
          window.dispatchEvent(new CustomEvent('biolab:auth', { detail: { user, loggedIn: true } }));
        } else {
          window.dispatchEvent(new CustomEvent('biolab:auth', { detail: { user: null, loggedIn: false } }));
        }
      });

      console.log('🔥 Firebase initialized successfully');
    } catch (err) {
      console.error('🔥 Firebase init error:', err);
      offlineMode = true;
      initialized = true;
    }
  }

  // ══════════════════════════════════════════════
  // AUTH METHODS
  // ══════════════════════════════════════════════
  const Auth = {
    async signUp(email, password, displayName) {
      if (offlineMode) return _offlineAuth('signup', email, displayName);
      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName });
        // Create user profile in DB
        await DB.set(`students/${cred.user.uid}/profile`, {
          name: displayName,
          email,
          role: 'student',
          createdAt: Date.now()
        });
        return { success: true, user: cred.user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    async signIn(email, password) {
      if (offlineMode) return _offlineAuth('signin', email);
      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: cred.user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    async signOut() {
      if (offlineMode) {
        currentUser = null;
        sessionStorage.removeItem('biolab_user');
        window.dispatchEvent(new CustomEvent('biolab:auth', { detail: { user: null, loggedIn: false } }));
        return;
      }
      await auth.signOut();
    },

    getUser() {
      if (offlineMode) {
        const stored = sessionStorage.getItem('biolab_user');
        return stored ? JSON.parse(stored) : null;
      }
      return currentUser;
    },

    isTeacher() {
      const user = this.getUser();
      return user?.role === 'teacher' || user?.email?.includes('teacher');
    }
  };

  // ══════════════════════════════════════════════
  // DATABASE METHODS (works offline too)
  // ══════════════════════════════════════════════
  const DB = {
    async set(path, data) {
      if (offlineMode) {
        const store = _getLocalStore();
        _setNested(store, path, data);
        _saveLocalStore(store);
        return true;
      }
      await db.ref(path).set(data);
      return true;
    },

    async get(path) {
      if (offlineMode) {
        const store = _getLocalStore();
        return _getNested(store, path);
      }
      const snap = await db.ref(path).once('value');
      return snap.val();
    },

    async push(path, data) {
      if (offlineMode) {
        const store = _getLocalStore();
        const arr = _getNested(store, path) || [];
        const id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        data._id = id;
        data._timestamp = Date.now();
        arr.push(data);
        _setNested(store, path, arr);
        _saveLocalStore(store);
        return id;
      }
      const ref = await db.ref(path).push(data);
      return ref.key;
    },

    async update(path, data) {
      if (offlineMode) {
        const store = _getLocalStore();
        const current = _getNested(store, path) || {};
        _setNested(store, path, { ...current, ...data });
        _saveLocalStore(store);
        return true;
      }
      await db.ref(path).update(data);
      return true;
    },

    async remove(path) {
      if (offlineMode) {
        const store = _getLocalStore();
        _setNested(store, path, null);
        _saveLocalStore(store);
        return true;
      }
      await db.ref(path).remove();
      return true;
    },

    // Real-time listener (offline: poll every 2s)
    onValue(path, callback) {
      if (offlineMode) {
        // Initial call
        const store = _getLocalStore();
        callback(_getNested(store, path));
        // Polling fallback
        const interval = setInterval(() => {
          const s = _getLocalStore();
          callback(_getNested(s, path));
        }, 2000);
        return () => clearInterval(interval);
      }
      const ref = db.ref(path);
      ref.on('value', snap => callback(snap.val()));
      return () => ref.off();
    }
  };

  // ══════════════════════════════════════════════
  // OFFLINE HELPERS
  // ══════════════════════════════════════════════
  const LOCAL_STORE_KEY = 'biolab_firebase_local';

  function _getLocalStore() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORE_KEY) || '{}');
    } catch { return {}; }
  }

  function _saveLocalStore(store) {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
  }

  function _getNested(obj, path) {
    return path.split('/').reduce((o, k) => o && o[k], obj);
  }

  function _setNested(obj, path, value) {
    const keys = path.split('/');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    if (value === null) {
      delete current[keys[keys.length - 1]];
    } else {
      current[keys[keys.length - 1]] = value;
    }
  }

  function _offlineAuth(action, email, name) {
    const user = {
      uid: 'local_' + btoa(email).replace(/=/g, ''),
      email,
      displayName: name || email.split('@')[0],
      role: email.includes('teacher') ? 'teacher' : 'student'
    };
    currentUser = user;
    sessionStorage.setItem('biolab_user', JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('biolab:auth', {
      detail: { user, loggedIn: true }
    }));
    return { success: true, user };
  }

  // ── Public API ──
  return {
    init,
    Auth,
    DB,
    isOnline: () => !offlineMode,
    getConfig: () => FIREBASE_CONFIG
  };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => BioLabFirebase.init());

if (typeof window !== 'undefined') {
  window.BioLabFirebase = BioLabFirebase;
}
