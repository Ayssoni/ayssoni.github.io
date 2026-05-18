import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const fallbackProducts = Array.isArray(window.products) ? [...window.products] : [];

function normalizeProduct(id, data) {
    return {
        id,
        name: data.name || 'Untitled Product',
        category: data.category || 'Rings',
        price: Number(data.price) || 0,
        image: data.image || '',
        badge: data.badge || '',
        description: data.description || '',
        stock: Number(data.stock) || 0,
        active: data.active !== false,
        metal: data.metal || '',
        purity: data.purity || '',
        weightGrams: Number(data.weightGrams) || 0,
        makingChargesPercent: Number(data.makingChargesPercent) || 0,
        discountPercent: Number(data.discountPercent) || 0,
        installmentMonths: Number(data.installmentMonths) || 0,
        annualInterestPercent: Number(data.annualInterestPercent) || 0
    };
}

async function loadProducts() {
    try {
        const snapshot = await getDocs(collection(db, 'products'));
        const firestoreProducts = snapshot.docs
            .map((docSnap) => normalizeProduct(docSnap.id, docSnap.data()))
            .filter((product) => product.active);

        if (firestoreProducts.length) {
            window.products = firestoreProducts;
        } else {
            window.products = fallbackProducts;
        }
    } catch (error) {
        console.warn('Using static product fallback because Firebase products could not load:', error);
        window.products = fallbackProducts;
    }

    window.dispatchEvent(new CustomEvent('products-ready', { detail: { products: window.products } }));
}

loadProducts();
