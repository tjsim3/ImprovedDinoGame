// ===== FIREBASE INIT + GLOBAL LEADERBOARD =====
// Owns the Firebase app, anonymous auth, Firestore score storage, and the
// player's display identity (name/guest id). Renders into #leaderboardList.

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkzOLdZWuYo1SXBsb1ZNTaF9JjBB0YqgM",
  authDomain: "dinogame-affb7.firebaseapp.com",
  projectId: "dinogame-affb7",
  storageBucket: "dinogame-affb7.firebasestorage.app",
  messagingSenderId: "101872105597",
  appId: "1:101872105597:web:469611e93a3a59c1071914",
  measurementId: "G-X78XS9MLZC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firestore + Auth (leaderboard)
const db = getFirestore(app);
const auth = getAuth();

// Try anonymous sign-in so clients can write scores under auth.uid
signInAnonymously(auth).catch(() => {});

onAuthStateChanged(auth, () => {
    refreshLeaderboard().catch(() => {});
});

// ===== PLAYER IDENTITY =====
function getPlayerId() {
    try {
        let id = localStorage.getItem('dinoPlayerId');
        if (!id) {
            id = 'player-' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem('dinoPlayerId', id);
        }
        return id;
    } catch (e) {
        return 'player-' + Math.random().toString(36).slice(2, 8);
    }
}

function normalizeName(name) {
    return String(name || '')
        .trim()
        .replace(/[^\w\-]/g, '')
        .slice(0, 8);
}

function getStoredName() {
    try {
        return normalizeName(localStorage.getItem('dinoPlayerName'));
    } catch (e) {
        return '';
    }
}

function getPlayerName() {
    const inputEl = document.getElementById('playerName');
    const fromInput = normalizeName(inputEl ? inputEl.value : '');
    return fromInput || getStoredName();
}

// ===== LEADERBOARD =====
let leaderboardRefresh = null;

async function refreshLeaderboard() {
    if (leaderboardRefresh) return leaderboardRefresh;
    leaderboardRefresh = (async () => {
        try {
            const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(5));
            const snap = await getDocs(q);
            const list = document.getElementById('leaderboardList');
            if (!list) return;
            list.innerHTML = '';
            if (snap.empty) {
                list.innerHTML = '<li>No scores yet</li>';
                return;
            }
            snap.forEach(doc => {
                const d = doc.data();
                const li = document.createElement('li');
                const id = d.playerId ? String(d.playerId).substring(0, 8) : 'anon';
                li.textContent = `${id} — ${d.score}`;
                list.appendChild(li);
            });
        } catch (e) {
            console.error('refreshLeaderboard failed', e);
            const list = document.getElementById('leaderboardList');
            if (list) list.innerHTML = '<li class="error">Failed to load</li>';
        }
    })();
    try {
        await leaderboardRefresh;
    } finally {
        leaderboardRefresh = null;
    }
}

async function submitScore(score) {
    const finalScore = Math.floor(score);
    if (finalScore <= 0) return;

    try {
        if (!auth.currentUser) {
            try {
                await signInAnonymously(auth);
            } catch (e) {
                // Anonymous auth unavailable; fall back to local player id
            }
        }

        const playerLabel = getPlayerName() || (auth.currentUser ? auth.currentUser.uid.slice(0, 8) : getPlayerId());

        await addDoc(collection(db, 'scores'), {
            playerId: playerLabel,
            score: finalScore,
            createdAt: serverTimestamp()
        });

        await refreshLeaderboard();
    } catch (e) {
        console.error('submitScore failed:', e);
    }
}

export { submitScore, refreshLeaderboard, normalizeName, getStoredName, getPlayerName };
