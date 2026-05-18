import { auth, db, ADMIN_EMAILS } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

function cleanEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isApprovedAdmin(email) {
    return ADMIN_EMAILS.map(cleanEmail).includes(cleanEmail(email));
}

onAuthStateChanged(auth, async (user) => {
    const links = document.querySelectorAll('[data-auth-link]');
    if (!links.length) return;

    if (!user) {
        links.forEach((link) => {
            link.textContent = 'Login';
            link.href = 'login.html';
        });
        return;
    }

    let role = isApprovedAdmin(user.email) ? 'admin' : 'customer';
    try {
        const profile = await getDoc(doc(db, 'users', user.uid));
        if (profile.exists() && profile.data().role) {
            role = profile.data().role;
        }
    } catch (error) {
        console.warn('Could not read user role:', error);
    }

    links.forEach((link) => {
        link.textContent = role === 'admin' ? 'Admin' : 'Account';
        link.href = role === 'admin' ? 'admin.html' : 'account.html';
    });
});
