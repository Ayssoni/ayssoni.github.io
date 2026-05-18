import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const nameEl = document.getElementById('account-name');
const emailEl = document.getElementById('account-email');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'customer-login.html';
        return;
    }

    const profile = await getDoc(doc(db, 'users', user.uid));
    const data = profile.exists() ? profile.data() : {};

    nameEl.textContent = data.name || user.displayName || 'Customer';
    emailEl.textContent = user.email || '';
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});
