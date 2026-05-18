import { auth, db, ADMIN_EMAILS } from './firebase-config.js';
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const loginRole = document.body.dataset.loginRole || 'customer';
const messageEl = document.getElementById('auth-message');
const provider = new GoogleAuthProvider();

function setMessage(message, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.classList.toggle('is-error', isError);
}

function cleanEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isApprovedAdmin(email) {
    return ADMIN_EMAILS.map(cleanEmail).includes(cleanEmail(email));
}

async function saveUserProfile(user, role, extra = {}) {
    const profileRef = doc(db, 'users', user.uid);
    const existing = await getDoc(profileRef);
    const existingRole = existing.exists() && existing.data().role;
    const finalRole = isApprovedAdmin(user.email) ? 'admin' : (existingRole || role);

    await setDoc(profileRef, {
        uid: user.uid,
        name: extra.name || user.displayName || existing.data()?.name || '',
        email: user.email || '',
        photoURL: user.photoURL || existing.data()?.photoURL || '',
        role: finalRole,
        updatedAt: serverTimestamp(),
        createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp()
    }, { merge: true });

    return finalRole;
}

async function routeUser(user, requestedRole, name = '') {
    const role = await saveUserProfile(user, requestedRole, { name });

    if (requestedRole === 'admin' && role !== 'admin') {
        await signOut(auth);
        setMessage('This email is not approved for admin access.', true);
        return;
    }

    window.location.href = role === 'admin' ? 'admin.html' : 'account.html';
}

function getErrorMessage(error) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Please log in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found for this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups.',
        'auth/unauthorized-domain': 'This domain is not authorized in Firebase Authentication.'
    };

    return messages[error.code] || error.message || 'Authentication failed.';
}

async function handleEmailLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        setMessage('Enter email and password.', true);
        return;
    }

    try {
        setMessage('Signing in...');
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await routeUser(credential.user, loginRole);
    } catch (error) {
        console.error(error);
        setMessage(getErrorMessage(error), true);
    }
}

async function handleEmailSignup() {
    const name = document.getElementById('full-name')?.value.trim();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (loginRole === 'admin') {
        setMessage('Admin accounts must be created in Firebase and approved by email.', true);
        return;
    }

    if (!name || !email || !password) {
        setMessage('Enter full name, email, and password.', true);
        return;
    }

    try {
        setMessage('Creating account...');
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await routeUser(credential.user, 'customer', name);
    } catch (error) {
        console.error(error);
        setMessage(getErrorMessage(error), true);
    }
}

async function handleGoogleLogin() {
    try {
        setMessage('Opening Google sign-in...');
        const credential = await signInWithPopup(auth, provider);
        await routeUser(credential.user, loginRole);
    } catch (error) {
        console.error(error);
        setMessage(getErrorMessage(error), true);
    }
}

document.getElementById('login-email-btn')?.addEventListener('click', handleEmailLogin);
document.getElementById('signup-email-btn')?.addEventListener('click', handleEmailSignup);
document.getElementById('google-login-btn')?.addEventListener('click', handleGoogleLogin);
