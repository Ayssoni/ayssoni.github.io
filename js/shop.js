// Shop Filter and Search Logic
const productFallbackImages = {
    Rings: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600",
    Necklaces: "https://images.unsplash.com/photo-1599643478514-4a11011d31ed?auto=format&fit=crop&q=80&w=600",
    Earrings: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
    Bracelets: "https://images.unsplash.com/photo-1611591437243-7f21226841dd?auto=format&fit=crop&q=80&w=600"
};

function getProductFallbackImage(category) {
    return productFallbackImages[category] || productFallbackImages.Rings;
}

function applyProductImageFallbacks(scope = document) {
    scope.querySelectorAll('img[data-fallback]').forEach((img) => {
        const useFallback = () => {
            if (img.src !== img.dataset.fallback) {
                img.src = img.dataset.fallback;
            }
        };

        img.addEventListener('error', useFallback, { once: true });

        if (img.complete && img.naturalWidth === 0) {
            useFallback();
        }
    });
}

// Generate Product Cards HTML
function createProductCard(product) {
    const badgeHtml = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
    const fallbackImage = getProductFallbackImage(product.category);
    const productId = String(product.id);
    const productIdForHandler = productId.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const productHref = `product.html?id=${encodeURIComponent(productId)}`;
    
    return `
        <div class="product-card" data-category="${product.category}" data-price="${product.price}">
            ${badgeHtml}
            <div class="product-img">
                <a href="${productHref}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" data-fallback="${fallbackImage}">
                </a>
                <div class="product-action">
                    <button class="btn btn-primary" onclick="addToCart('${productIdForHandler}')">Add to Cart</button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title"><a href="${productHref}">${product.name}</a></h3>
                <div class="product-price">${formatPrice(product.price)}</div>
            </div>
        </div>
    `;
}

// Render Products
function renderProducts(productsToRender, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px 0;">No products found matching your criteria.</p>';
        return;
    }

    let html = '';
    productsToRender.forEach(p => {
        html += createProductCard(p);
    });
    container.innerHTML = html;
    applyProductImageFallbacks(container);
}

// Render Home Page Featured Products
function renderHomeProducts() {
    // Just take first 4 for featured
    const featured = products.slice(0, 4);
    renderProducts(featured, 'featured-products');
}

// Shop Page Filtering Logic
let shopFiltersBound = false;
let applyShopFilters = null;

function initShopFilters() {
    const shopContainer = document.getElementById('shop-products');
    if (!shopContainer) return;

    const searchInput = document.getElementById('search-input');
    const categoryCheckboxes = document.querySelectorAll('.category-filter');
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');

    function filterProducts() {
        const searchTerm = (searchInput?.value || '').toLowerCase();
        const checkedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        const maxPrice = parseInt(priceSlider?.value || '999999999', 10);

        const filtered = products.filter(p => {
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm);
            const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(p.category);
            const matchesPrice = Number(p.price) <= maxPrice;
            return matchesSearch && matchesCategory && matchesPrice;
        });

        renderProducts(filtered, 'shop-products');
    }

    applyShopFilters = filterProducts;

    if (!shopFiltersBound) {
        searchInput?.addEventListener('input', filterProducts);
        categoryCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
        priceSlider?.addEventListener('input', (e) => {
            priceDisplay.textContent = `₹0 - ₹${parseInt(e.target.value, 10).toLocaleString('en-IN')}`;
            filterProducts();
        });
        shopFiltersBound = true;
    }

    filterProducts();
}

// Product Detail Page Logic
function initProductDetail() {
    const detailContainer = document.getElementById('product-detail-container');
    if (!detailContainer) return; // Not on product page

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }

    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
        detailContainer.innerHTML = '<h2>Product not found</h2>';
        return;
    }

    // Update page title
    document.title = `${product.name} | Soni Jewellers`;

    detailContainer.innerHTML = `
        <div class="pd-img-container">
            <img src="${product.image}" alt="${product.name}" data-fallback="${getProductFallbackImage(product.category)}">
        </div>
        <div class="pd-info">
            <div class="breadcrumb">
                <a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ${product.category}
            </div>
            <h1 style="margin-top: 15px;">${product.name}</h1>
            <div class="pd-price">${formatPrice(product.price)}</div>
            <p class="pd-desc">${product.description}</p>
            
            <div class="pd-actions">
                <div class="qty-selector">
                    <button class="qty-btn" onclick="decrementDetailQty()">-</button>
                    <input type="number" id="detail-qty" class="qty-input" value="1" min="1" readonly>
                    <button class="qty-btn" onclick="incrementDetailQty()">+</button>
                </div>
                <button class="btn btn-primary" onclick="addDetailToCart('${String(product.id).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')">Add to Cart</button>
            </div>
            
            <div class="pd-meta">
                <p><span>Category:</span> ${product.category}</p>
                <p><span>Availability:</span> In Stock</p>
            </div>
        </div>
    `;
    applyProductImageFallbacks(detailContainer);

    // Render Related Products (same category, excluding current)
    const related = products.filter(p => p.category === product.category && String(p.id) !== String(product.id)).slice(0, 4);
    renderProducts(related, 'related-products');
}

// Helper functions for product detail page
window.decrementDetailQty = function() {
    const input = document.getElementById('detail-qty');
    let val = parseInt(input.value);
    if (val > 1) input.value = val - 1;
};

window.incrementDetailQty = function() {
    const input = document.getElementById('detail-qty');
    input.value = parseInt(input.value) + 1;
};

window.addDetailToCart = function(productId) {
    const qty = parseInt(document.getElementById('detail-qty').value);
    addToCart(productId, qty);
};

function initializeProductViews() {
    renderHomeProducts();
    initShopFilters();
    initProductDetail();
}

// Initialize on page load and rerender when Firebase products arrive.
document.addEventListener('DOMContentLoaded', initializeProductViews);
window.addEventListener('products-ready', initializeProductViews);
