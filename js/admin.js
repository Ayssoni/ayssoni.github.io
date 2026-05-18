import { auth, db, ADMIN_EMAILS } from './firebase-config.js';
import {
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const adminGuard = document.getElementById('admin-guard');
const dashboard = document.getElementById('admin-dashboard');
const adminUser = document.getElementById('admin-user');
const form = document.getElementById('product-form');
const messageEl = document.getElementById('admin-message');
const productList = document.getElementById('admin-product-list');
const productsRef = collection(db, 'products');
const ordersRef = collection(db, 'orders');
const orderList = document.getElementById('admin-order-list');

let products = [];
let orders = [];
let currentUser = null;

function cleanEmail(email) {
    return (email || '').trim().toLowerCase();
}

function isApprovedAdmin(email) {
    return ADMIN_EMAILS.map(cleanEmail).includes(cleanEmail(email));
}

function setMessage(message, isError = false) {
    messageEl.textContent = message;
    messageEl.classList.toggle('is-error', isError);
}

function value(id) {
    return document.getElementById(id).value.trim();
}

function numberValue(id) {
    const raw = document.getElementById(id).value;
    return raw === '' ? 0 : Number(raw);
}

async function ensureAdmin(user) {
    if (!user) return false;

    const profileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    const data = profileSnap.exists() ? profileSnap.data() : {};
    const adminByEmail = isApprovedAdmin(user.email);

    if (adminByEmail) {
        await setDoc(profileRef, {
            uid: user.uid,
            name: user.displayName || data.name || 'Admin',
            email: user.email,
            role: 'admin',
            updatedAt: serverTimestamp(),
            createdAt: data.createdAt || serverTimestamp()
        }, { merge: true });
        return true;
    }

    return data.role === 'admin';
}

function getProductPayload() {
    return {
        name: value('product-name'),
        category: value('product-category'),
        price: numberValue('product-price'),
        stock: numberValue('product-stock'),
        badge: value('product-badge'),
        image: value('product-image'),
        metal: value('product-metal'),
        purity: value('product-purity'),
        weightGrams: numberValue('product-weight'),
        makingChargesPercent: numberValue('product-making'),
        discountPercent: numberValue('product-discount'),
        installmentMonths: numberValue('product-installments'),
        annualInterestPercent: numberValue('product-interest'),
        active: document.getElementById('product-active').checked,
        description: value('product-description'),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.email || ''
    };
}

function resetForm() {
    form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-active').checked = true;
    document.getElementById('save-product-btn').textContent = 'Save Product';
    setMessage('');
}

function fillForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-category').value = product.category || 'Rings';
    document.getElementById('product-price').value = product.price || 0;
    document.getElementById('product-stock').value = product.stock || 0;
    document.getElementById('product-badge').value = product.badge || '';
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-metal').value = product.metal || '';
    document.getElementById('product-purity').value = product.purity || '';
    document.getElementById('product-weight').value = product.weightGrams || '';
    document.getElementById('product-making').value = product.makingChargesPercent || '';
    document.getElementById('product-discount').value = product.discountPercent || '';
    document.getElementById('product-installments').value = product.installmentMonths || '';
    document.getElementById('product-interest').value = product.annualInterestPercent || '';
    document.getElementById('product-active').checked = product.active !== false;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('save-product-btn').textContent = 'Update Product';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatINR(price) {
    return '₹' + Math.round(Number(price) || 0).toLocaleString('en-IN');
}

function renderStats() {
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('active-products').textContent = products.filter((product) => product.active !== false).length;
    document.getElementById('low-stock-products').textContent = products.filter((product) => Number(product.stock) <= 2).length;
}

function renderProducts() {
    renderStats();

    if (!products.length) {
        productList.innerHTML = '<p class="admin-empty">No Firebase products yet. Add your first product above.</p>';
        return;
    }

    productList.innerHTML = products.map((product) => `
        <article class="admin-product-card">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div>
                <h3>${product.name}</h3>
                <p>${product.category} · ${formatINR(product.price)} · Stock ${product.stock ?? 0}</p>
                <p>${product.active === false ? 'Hidden' : 'Visible'}${product.installmentMonths ? ` · ${product.installmentMonths} months @ ${product.annualInterestPercent || 0}%` : ''}</p>
            </div>
            <div class="admin-product-actions">
                <button class="btn btn-outline" type="button" data-edit="${product.id}">Edit</button>
                <button class="btn btn-primary" type="button" data-delete="${product.id}">Delete</button>
            </div>
        </article>
    `).join('');
}

async function loadProducts() {
    productList.textContent = 'Loading products...';
    const snapshot = await getDocs(productsRef);
    products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    renderProducts();
}

function renderOrders() {
    if (!orderList) return;

    if (!orders.length) {
        orderList.innerHTML = '<p class="admin-empty">No customer orders yet.</p>';
        return;
    }

    orderList.innerHTML = orders.map((order) => {
        const customer = order.customer || {};
        const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : 0;
        return `
            <article class="admin-order-card">
                <div>
                    <h3>${customer.firstName || ''} ${customer.lastName || ''}</h3>
                    <p>${customer.phone || ''} · ${customer.email || order.userEmail || ''}</p>
                    <p>${itemCount} item(s) · ${formatINR(order.totals?.total || 0)} · ${order.status || 'new'}</p>
                </div>
            </article>
        `;
    }).join('');
}

async function loadOrders() {
    if (!orderList) return;
    orderList.textContent = 'Loading orders...';
    const snapshot = await getDocs(ordersRef);
    orders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderOrders();
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const productId = document.getElementById('product-id').value;
    const payload = getProductPayload();

    if (!payload.name || !payload.image || !payload.description || !payload.price) {
        setMessage('Name, image URL, price, and description are required.', true);
        return;
    }

    try {
        setMessage('Saving product...');
        if (productId) {
            await updateDoc(doc(db, 'products', productId), payload);
            setMessage('Product updated.');
        } else {
            await addDoc(productsRef, {
                ...payload,
                createdAt: serverTimestamp(),
                createdBy: currentUser?.email || ''
            });
            setMessage('Product added.');
        }

        resetForm();
        await loadProducts();
        await loadOrders();
    } catch (error) {
        console.error(error);
        setMessage(error.message || 'Could not save product.', true);
    }
});

productList.addEventListener('click', async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    if (editId) {
        const product = products.find((item) => item.id === editId);
        if (product) fillForm(product);
    }

    if (deleteId) {
        const product = products.find((item) => item.id === deleteId);
        if (!confirm(`Delete ${product?.name || 'this product'}?`)) return;

        await deleteDoc(doc(db, 'products', deleteId));
        await loadProducts();
        setMessage('Product deleted.');
    }
});

document.getElementById('reset-form-btn').addEventListener('click', resetForm);
document.getElementById('refresh-products-btn').addEventListener('click', loadProducts);
document.getElementById('refresh-orders-btn')?.addEventListener('click', loadOrders);
document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'admin-login.html';
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
        return;
    }

    currentUser = user;

    try {
        const allowed = await ensureAdmin(user);
        if (!allowed) {
            await signOut(auth);
            window.location.href = 'admin-login.html';
            return;
        }

        adminUser.textContent = user.email || 'Admin';
        adminGuard.hidden = true;
        dashboard.hidden = false;
        await loadProducts();
        await loadOrders();
    } catch (error) {
        console.error(error);
        adminGuard.textContent = error.message || 'Could not verify admin access.';
        adminGuard.classList.add('is-error');
    }
});
