function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function showNotification(msg, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        Object.assign(notification.style, {
            position: 'fixed',
            top: '30px',
            right: '30px',
            zIndex: '9999',
            padding: '16px 24px',
            borderRadius: '8px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: '16px',
            color: '#333'
        });
        document.body.appendChild(notification);
    }
    notification.textContent = msg;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    // Nếu cart không hợp lệ hoặc quantity <= 0 thì xóa luôn cart
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(cart) || cart.length === 0 || cart.every(item => !item.quantity || item.quantity <= 0)) {
        localStorage.removeItem('cart');
    }
    updateCartCountBadge();

    // --- Khai báo phần tử giao diện ---
    const productModal = document.getElementById('product-modal');
    const categoryFilter = document.getElementById('category-filter');
    const productsTableBody = document.getElementById('products-table-body');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productCategorySelect = document.getElementById('product-category');
    const cancelProductBtn = document.getElementById('cancel-product');
    const addProductMenuBtn = document.getElementById('add-product-menu-btn');
    const headerSearchInput = document.getElementById('header-search');
    const headerSearchBtn = document.getElementById('header-search-btn');

    // --- Biến trạng thái ---
    let currentPage = 1, itemsPerPage = 10, currentCategory = '', currentSearch = '';

    // --- Tiện ích ---
    function isValidId(id) {
        return id && id !== 'undefined' && !isNaN(Number(id));
    }
    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
    }

    // --- Sự kiện giao diện ---
    document.querySelector('.close-modal')?.addEventListener('click', () => productModal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === productModal) productModal.style.display = 'none'; });

    if (headerSearchBtn && headerSearchInput) {
        headerSearchBtn.addEventListener('click', () => loadMainProducts(headerSearchInput.value.trim()));
        headerSearchInput.addEventListener('keydown', e => { if (e.key === 'Enter') headerSearchBtn.click(); });
    }
    categoryFilter?.addEventListener('change', function () {
        currentCategory = categoryFilter.value; currentPage = 1; loadProducts();
    });
    productForm?.addEventListener('submit', function (e) { e.preventDefault(); saveProduct(); });
    cancelProductBtn?.addEventListener('click', function () {
        resetForm();
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.modal-tab[data-tab="product-list"]')?.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById('product-list')?.classList.add('active');
    });
    addProductMenuBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        openProductModal(false); // Luôn là false để hiện "Add New Product"
    });

    // --- Hàm xử lý chính ---
    async function loadCategories(selectedId = null) {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            const productCategorySelect = document.getElementById('product-category');
            if (productCategorySelect) {
                productCategorySelect.innerHTML = '<option value="">Select Category</option>';
                data.forEach(c => {
                    productCategorySelect.innerHTML += `<option value="${c.categoryID}">${c.name}</option>`;
                });
                if (selectedId) productCategorySelect.value = selectedId;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh mục:', error);
            showNotification('Failed to load categories', 'error');
        }
    }

    async function loadFeaturedProducts() {
        try {
            const response = await fetch('/api/products/featured');
            const products = await response.json();
            const productGrid = document.getElementById('featured-products');
            if (!productGrid) return;
            productGrid.innerHTML = products.length === 0 ? '<p>No featured products.</p>' : '';
            products.forEach(product => {
                if (!isValidId(product.productID)) return;
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.imageURL || 'images/placeholder.svg'}" alt="${product.name}">
                        ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.categoryName || ''}</div>
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">${formatCurrency(product.price)}</div>
                        <div class="product-action">
                            <button class="add-to-cart" onclick="addToCart(${product.productID})">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="view-detail-btn" data-id="${product.productID}">
                                <i class="fas fa-info-circle"></i> Chi tiết
                            </button>
                        </div>
                    </div>`;
                productGrid.appendChild(productCard);
            });
            productGrid.querySelectorAll('.view-detail-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    if (isValidId(id)) window.location.href = `/product-detail.html?id=${id}`;
                    else alert('ID sản phẩm không hợp lệ!');
                });
            });
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm nổi bật:', error);
            document.getElementById('featured-products').innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    function loadProducts() {
        let url = `/api/products?page=${currentPage}&limit=${itemsPerPage}`;
        if (currentCategory) url += `&category=${currentCategory}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        fetch(url)
            .then(res => res.json())
            .then((data) => {
                renderProducts(data.products || []);
            })
            .catch(err => {
                console.error('Lỗi khi tải sản phẩm:', err);
                showNotification('Failed to load products', 'error');
                productsTableBody.innerHTML = '<tr><td colspan="7">Error loading products.</td></tr>';
            });
    }

    function saveProduct() {
        const productId = productIdInput.value;
        let priceValue = document.getElementById('product-price').value.replace(',', '.');
        const formData = {
            name: document.getElementById('product-name').value,
            brand: document.getElementById('product-brand').value.trim() ? document.getElementById('product-brand').value.trim() : 'No Brand',
            categoryID: parseInt(document.getElementById('product-category').value),
            price: parseFloat(priceValue),
            stockQuantity: parseInt(document.getElementById('product-stock').value),
            imageURL: document.getElementById('product-image').value,
            featured: parseInt(document.getElementById('product-featured').value),
            description: document.getElementById('product-description').value
        };
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `/api/products/${productId}` : '/api/products';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                if (method === 'PUT') {
                    showNotification('Product edited successfully!', 'success');
                    document.getElementById('product-modal').style.display = 'none';
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000); 
                } else {
                    showNotification('Product added successfully!', 'success');
                    document.getElementById('product-modal').style.display = 'none';
                    loadMainProducts('');
                }
            })
            .catch(() => showNotification('An error occurred!', 'error'));
    }

    function renderProducts(products) {
        productsTableBody.innerHTML = '';
        if (!products || products.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
            return;
        }
        products.forEach(product => {
            if (!isValidId(product.productID)) return;
            const imageUrl = product.imageURL || '/images/placeholder.svg';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.productID}</td>
                <td><img src="${imageUrl}" class="product-thumbnail" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>${product.categoryName}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stockQuantity}</td>
                <td>
                    <button class="btn-icon edit-btn" data-id="${product.productID}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${product.productID}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            productsTableBody.appendChild(row);
        });
        productsTableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                if (isValidId(id)) editProduct(id);
                else alert('ID sản phẩm không hợp lệ!');
            });
        });
        productsTableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                if (isValidId(id)) deleteProduct(id);
                else alert('ID sản phẩm không hợp lệ!');
            });
        });
    }

    // --- Các hàm phụ ---
    function getProduct(id) {
        if (!isValidId(id)) return showNotification('Product ID không hợp lệ!', 'error');
        fetch(`/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                productIdInput.value = data.productID;
                document.getElementById('product-name').value = data.name;
                document.getElementById('product-category').value = data.categoryID;
                document.getElementById('product-price').value = data.price;
                document.getElementById('product-stock').value = data.stockQuantity;
                document.getElementById('product-image').value = data.imageURL || '';
                document.getElementById('product-featured').value = data.featured ? 1 : 0;
                document.getElementById('product-description').value = data.description || '';
                document.getElementById('product-brand').value = data.brand || ''; // thêm dòng này
                document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('.modal-tab[data-tab="add-product"]')?.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById('add-product')?.classList.add('active');
            });
    }
    function deleteProduct(id) {
        if (!isValidId(id)) return showNotification('Product ID is invalid!', 'error');
        if (!confirm('Are you sure you want to delete this product?')) return;
        fetch(`/api/products/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                showNotification('Product deleted successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000); // Đợi 1s cho user thấy thông báo
            })
            .catch(() => showNotification('Delete failed', 'error'));
    }

    function loadMainProducts(searchValue = '') {
        let url = `/api/products?page=1&limit=20`;
        if (searchValue) url += `&search=${encodeURIComponent(searchValue)}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const productGrid = document.getElementById('featured-products');
                if (!productGrid) return;
                const products = Array.isArray(data) ? data : (data.products || []);
                productGrid.innerHTML = products.length === 0 ? '<p>No matching products found.</p>' : '';
                products.forEach(product => {
                    if (!isValidId(product.productID)) return;
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    productCard.innerHTML = `
                        <div class="product-image">
                            <img src="${product.imageURL || 'images/placeholder.svg'}" alt="${product.name}">
                            ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
                        </div>
                        <div class="product-info">
                            <div class="product-category">${product.categoryName || ''}</div>
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-price">${formatCurrency(product.price)}</div>
                            <div class="product-action">
                                <button class="add-to-cart" onclick="addToCart(${product.productID})">
                                    <i class="fas fa-shopping-cart"></i> Add to Cart
                                </button>
                                <button class="view-detail-btn" data-id="${product.productID}">
                                    <i class="fas fa-info-circle"></i> Chi tiết
                                </button>
                            </div>
                        </div>`;
                    productGrid.appendChild(productCard);
                });
                productGrid.querySelectorAll('.view-detail-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const id = this.dataset.id;
                        if (isValidId(id)) window.location.href = `/product-detail.html?id=${id}`;
                        else alert('ID sản phẩm không hợp lệ!');
                    });
                });
            });
    }

    // --- Trang chi tiết sản phẩm ---
    const productDetail = document.getElementById('product-detail');
    if (productDetail) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!isValidId(id)) {
            productDetail.innerHTML = '<div class="error">Product not found (missing or invalid ID).</div>';
            return;
        }
        fetch(`/api/products/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Product not found');
                return res.json();
            })
            .then (product => {
                productDetail.innerHTML = `
                    <div class="product-detail-flex">
                        <div class="product-detail-img-wrap">
                            <img class="product-detail-img" src="${product.imageURL}" alt="${product.name}">
                        </div>
                        <div class="product-detail-info">
                            <h1 class="product-detail-title">${product.name}</h1>
                            <div class="product-detail_desc-main">${product.description}</div>
                            <div class="product-detail-price-row">
                                <span class="product-detail-price">${formatCurrency(product.price)}</span>
                            </div>
                            <table class="product-detail-table">
                                <tr><td><b>Brand:</b></td><td>${product.brand && product.brand.trim() ? product.brand : 'No Brand'}</td></tr>
                                <tr><td><b>Availability:</b></td><td>${product.stockQuantity}</td></tr>
                            </table>
                            <div class="product-detail-actions">
                                <button class="btn-icon edit-btn" data-id="${product.productID}"><i class="fas fa-edit"></i>Edit</button>
                                <button class="btn-icon delete-btn" data-id="${product.productID}"><i class="fas fa-trash"></i>Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => openProductModal(true, product));
                });
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        deleteProduct(product.productID);
                    });
                });
            })
            .catch(() => {
                productDetail.innerHTML = '<div class="error">Product not found or API error.</div>';
            });
    }

    // --- Hàm mở modal cho trang chi tiết ---
    async function openProductModal(isEdit = false, product = null) {
        productModal.style.display = 'block';
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Product' : 'Add New Product';

        if (isEdit && product) {
            document.getElementById('product-id').value = product.productID; // <-- Dòng này rất quan trọng!
            await loadCategories(product.categoryID);
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-brand').value = product.brand || '';
            document.getElementById('product-featured').value = product.featured;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stockQuantity;
            document.getElementById('product-image').value = product.imageURL || '';
            document.getElementById('product-description').value = product.description || '';
        } else {
            productForm.reset();
            productIdInput.value = '';
            await loadCategories();
        }
    }
    async function editProduct(productId) {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();
        await openProductModal(true, product);
    }

    // --- Khởi động ---
    loadCategories();
    loadFeaturedProducts();

    document.getElementById('view-all-btn')?.addEventListener('click', function() {
    loadMainProducts('');
});
    updateCartCountBadge();
});

// ==== GIỎ HÀNG ====

// Hàm addToCart dùng cho onclick
function addToCart(productId) {
    productId = Number(productId);
    showNotification('Product added to cart!', 'success');
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(item => Number(item.productID) === productId);
    if (idx > -1) {
        cart[idx].quantity += 1;
    } else {
        cart.push({ productID: productId, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountBadge(); // Thêm dòng này
}
window.addToCart = addToCart;

document.getElementById('cart-btn')?.addEventListener('click', function() {
    showCartModal(); // Phải gọi showCartModal() để render sản phẩm
});

// Đóng cart modal
document.getElementById('close-cart-modal')?.addEventListener('click', function() {
    document.getElementById('cart-modal').style.display = 'none';
});
window.addEventListener('click', function(e) {
    const cartModal = document.getElementById('cart-modal');
    if (e.target === cartModal) cartModal.style.display = 'none';
});

// Hiển thị giỏ hàng
function showCartModal() {
    renderCartItems();
    document.getElementById('cart-modal').style.display = 'block';
}

// Render sản phẩm trong giỏ hàng
function renderCartItems() {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    Promise.all(cart.map(item =>
        fetch(`/api/products/${item.productID}`).then(res => res.ok ? res.json() : null)
    )).then(products => {
        // Lọc bỏ sản phẩm không tồn tại (null)
        const validCart = cart.filter((item, i) => products[i]);
        if (validCart.length !== cart.length) {
            localStorage.setItem('cart', JSON.stringify(validCart));
            cart = validCart;
        }
        const cartItemsDiv = document.getElementById('cart-items');
        const cartTotalDiv = document.getElementById('cart-total');
        if (!cartItemsDiv || !cartTotalDiv) return;
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalDiv.textContent = '$0.00';
            localStorage.removeItem('cart');
            updateCartCountBadge();
            return;
        }
        cartItemsDiv.innerHTML =
            `<div class="cart-item cart-item-header">
                <span class="cart-item-checkbox-header"></span>
                <span class="cart-item-img-header">Image</span>
                <span class="cart-item-name-header">Product</span>
                <span class="cart-item-price-header">Price</span>
                <span class="cart-item-qty-header">Quantity</span>
                <span class="cart-item-remove-header">Remove</span>
            </div>`
            +
            products.map((product, i) => {
                // Nếu không lấy được product (API trả về null/undefined), bỏ qua
                if (!product) return '';
                const quantity = cart[i].quantity;
                return `
                    <div class="cart-item" data-id="${product.productID}">
                        <input type="checkbox" class="cart-item-checkbox" ${cart[i].checked !== false ? 'checked' : ''}>
                        <img class="cart-item-img" src="${product.imageURL || 'images/placeholder.svg'}" alt="${product.name}">
                        <span class="cart-item-name">${product.name}</span>
                        <span class="cart-item-price">${formatCurrency(product.price)}</span>
                        <div class="cart-item-qty">
                            <button class="cart-qty-btn cart-qty-minus">-</button>
                            <span class="cart-qty-value">${quantity}</span>
                            <button class="cart-qty-btn cart-qty-plus">+</button>
                        </div>
                        <button class="cart-item-remove" title="Remove from cart">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');

        // Tính lại tổng chỉ với sản phẩm được tick
        let total = 0;
        document.querySelectorAll('.cart-item:not(.cart-item-header)').forEach(itemDiv => {
            const productID = Number(itemDiv.getAttribute('data-id'));
            const cartIdx = cart.findIndex(item => Number(item.productID) === productID);
            const prodIdx = products.findIndex(p => p && Number(p.productID) === productID);
            if (cartIdx === -1 || prodIdx === -1 || !products[prodIdx]) return;
            const checkbox = itemDiv.querySelector('.cart-item-checkbox');
            const quantity = cart[cartIdx].quantity;
            if (checkbox && checkbox.checked) {
                total += products[prodIdx].price * quantity;
            }
            // Sự kiện cộng/trừ/xóa
            const minusBtn = itemDiv.querySelector('.cart-qty-minus');
            const plusBtn = itemDiv.querySelector('.cart-qty-plus');
            const removeBtn = itemDiv.querySelector('.cart-item-remove');
            if (minusBtn) minusBtn.onclick = function() { updateCartQuantity(productID, -1); };
            if (plusBtn) plusBtn.onclick = function() { updateCartQuantity(productID, 1); };
            if (removeBtn) removeBtn.onclick = function() { removeFromCart(productID); };
            // Sự kiện tick chọn
            if (checkbox) {
                checkbox.onchange = function() {
                    cart[cartIdx].checked = checkbox.checked;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    renderCartItems();
                };
            }
        });
        cartTotalDiv.textContent = formatCurrency(total);
    });
}

// Cập nhật số lượng
function updateCartQuantity(productID, delta) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(item => Number(item.productID) === Number(productID));
    if (idx > -1) {
        cart[idx].quantity += delta;
        if (cart[idx].quantity < 1) cart[idx].quantity = 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
    }
}

// Xóa sản phẩm khỏi giỏ
function removeFromCart(productID) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(item => item.productID !== productID);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartCountBadge();
}

// Cập nhật số lượng sản phẩm trong biểu tượng giỏ hàng
function updateCartCountBadge() {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const badge = document.getElementById('cart-count-badge');
    // Nếu cart không phải mảng, rỗng, hoặc mọi item quantity <= 0 thì xóa cart và badge = 0
    if (!Array.isArray(cart) || cart.length === 0 || cart.every(item => !item.quantity || item.quantity <= 0)) {
        localStorage.removeItem('cart');
        badge.textContent = '0';
        return;
    }
    const total = cart.reduce((sum, item) => sum + (item.quantity ? Number(item.quantity) : 0), 0);
    badge.textContent = total > 0 ? total : '0';
}


