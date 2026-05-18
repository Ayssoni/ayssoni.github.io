// Cart Logic using localStorage

function getCart() {
    return JSON.parse(localStorage.getItem('jewellery_cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('jewellery_cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(productId, quantity = 1) {
    // Find product details from products.js (assuming it's loaded before this script)
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;

    let cart = getCart();
    
    // Check if item already in cart
    const existingItemIndex = cart.findIndex(item => String(item.id) === String(productId));
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    saveCart(cart);
    showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart(cart);
    
    // If we are on cart page, re-render
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;
    
    let cart = getCart();
    const itemIndex = cart.findIndex(item => String(item.id) === String(productId));
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart(cart);
        
        // If we are on cart page, re-render
        if (document.getElementById('cart-items-container')) {
            renderCartPage();
        }
    }
}

// Render Cart Page specific logic
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');
    
    if (!container) return; // Not on cart page

    const cart = getCart();
    
    if (cart.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cart-msg">
                    <h2>Your cart is empty</h2>
                    <br>
                    <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
                </td>
            </tr>
        `;
        subtotalEl.textContent = formatPrice(0);
        taxEl.textContent = formatPrice(0);
        totalEl.textContent = formatPrice(0);
        document.querySelector('.checkout-btn').style.display = 'none';
        return;
    }

    document.querySelector('.checkout-btn').style.display = 'block';

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <tr>
                <td>
                    <div class="cart-item-info">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <span style="font-family: var(--font-body); font-weight:500;">${item.name}</span>
                    </div>
                </td>
                <td>${formatPrice(item.price)}</td>
                <td>
                    <div class="qty-selector" style="width: fit-content;">
                        <button class="qty-btn" onclick="updateQuantity('${String(item.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', ${item.quantity - 1})">-</button>
                        <input type="number" class="qty-input" value="${item.quantity}" readonly>
                        <button class="qty-btn" onclick="updateQuantity('${String(item.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}', ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td style="font-weight: 600;">${formatPrice(itemTotal)}</td>
                <td>
                    <button class="remove-btn" onclick="removeFromCart('${String(item.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">🗑️</button>
                </td>
            </tr>
        `;
    });

    container.innerHTML = html;

    // Calculate totals
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    subtotalEl.textContent = formatPrice(subtotal);
    taxEl.textContent = formatPrice(tax);
    totalEl.textContent = formatPrice(total);
}

// Initialize if on cart page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }
});
