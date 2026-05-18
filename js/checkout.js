import { auth, db } from './firebase-config.js';
import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

function orderTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const tax = subtotal * 0.08;
    return { subtotal, tax, total: subtotal + tax };
}

function getCheckoutDetails() {
    return {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
        paymentMethod: document.querySelector('input[name="payment"]:checked')?.value || 'cod'
    };
}

function renderCheckoutSummary() {
    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = 'shop.html';
        return;
    }

    let html = '<div style="margin-bottom: 20px;">';
    cart.forEach((item) => {
        html += `
            <div style="display:flex; justify-content:space-between; margin-bottom: 10px; font-size: 0.9rem;">
                <span>${item.name} x ${item.quantity}</span>
                <span>${formatPrice(Number(item.price) * Number(item.quantity))}</span>
            </div>
        `;
    });
    html += '</div>';

    const totals = orderTotals(cart);
    html += `
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
        <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(totals.tax)}</span></div>
        <div class="summary-total"><span>Total</span><span style="color:var(--color-primary);">${formatPrice(totals.total)}</span></div>
    `;

    document.getElementById('checkout-summary-content').innerHTML = html;
}

window.handleCheckout = async function handleCheckout(event) {
    event.preventDefault();

    const cart = getCart();
    if (!cart.length) {
        window.location.href = 'shop.html';
        return;
    }

    const details = getCheckoutDetails();
    const totals = orderTotals(cart);
    const user = auth.currentUser;

    try {
        await addDoc(collection(db, 'orders'), {
            customer: details,
            userId: user?.uid || null,
            userEmail: user?.email || details.email,
            items: cart,
            totals,
            status: 'new',
            createdAt: serverTimestamp()
        });

        if (user) {
            await setDoc(doc(db, 'users', user.uid), {
                name: `${details.firstName} ${details.lastName}`.trim(),
                email: details.email,
                phone: details.phone,
                address: details.address,
                city: details.city,
                pincode: details.pincode,
                role: 'customer',
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        document.getElementById('success-modal').style.display = 'flex';
        localStorage.removeItem('jewellery_cart');
        updateCartBadge();
    } catch (error) {
        console.error('Checkout failed:', error);
        alert('Could not save your order. Please try again or contact the shop directly.');
    }
};

document.addEventListener('DOMContentLoaded', renderCheckoutSummary);
