// ============================================
// BELLEZA & ESTILO - JAVASCRIPT PRINCIPAL
// ============================================

// Variables globales
let cart = [];
let cartTotal = 0;
let isMenuOpen = false;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadCartFromStorage();
    setupEventListeners();
    setupSmoothScrolling();
    setupIntersectionObserver();
    addFloatingAnimations();
});

function initializeApp() {
    console.log('🛍️ Belleza & Estilo - App iniciada');
    updateCartDisplay();
    
    // Animate hero section on load
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }
    }, 500);
}

// ============================================
// NAVEGACIÓN Y MENÚ MÓVIL
// ============================================
function setupEventListeners() {
    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking on nav links
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', closeMobileMenu);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (isMenuOpen && !hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processCheckout);
    }
}

function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
        navLinks.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (isMenuOpen) {
        isMenuOpen = false;
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// CARRITO DE COMPRAS
// ============================================
function addToCart(productName, price, buttonElement) {
    // Add loading effect to button
    buttonElement.classList.add('loading');
    buttonElement.innerHTML = '⏳ Agregando...';
    
    setTimeout(() => {
        // Check if product already exists in cart
        const existingProductIndex = cart.findIndex(item => item.name === productName);
        
        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += 1;
        } else {
            cart.push({
                id: Date.now(),
                name: productName,
                price: price,
                quantity: 1
            });
        }
        
        updateCartDisplay();
        saveCartToStorage();
        showToast('✅ Producto añadido al carrito');
        
        // Reset button
        buttonElement.classList.remove('loading');
        buttonElement.innerHTML = '🛒 Añadir al carrito';
        
        // Add success animation to button
        buttonElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
            buttonElement.style.transform = 'scale(1)';
        }, 150);
        
    }, 800);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveCartToStorage();
    showToast('🗑️ Producto eliminado del carrito', 'info');
}

function updateQuantity(productId, newQuantity) {
    const productIndex = cart.findIndex(item => item.id === productId);
    
    if (productIndex > -1) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            cart[productIndex].quantity = newQuantity;
            updateCartDisplay();
            saveCartToStorage();
        }
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    // Update cart items display
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <p>🛒 Tu carrito está vacío</p>
                    <p>¡Agrega algunos productos de belleza!</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">$${item.price.toLocaleString()}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
        cartTotal.textContent = total.toLocaleString();
    }
}

function openCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        const cartContent = cartModal.querySelector('.cart-content');
        cartContent.style.transform = 'scale(0.8) translateY(-50px)';
        cartContent.style.opacity = '0';
        
        setTimeout(() => {
            cartContent.style.transform = 'scale(1) translateY(0)';
            cartContent.style.opacity = '1';
        }, 100);
    }
}

function closeCart() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        const cartContent = cartModal.querySelector('.cart-content');
        
        // Add exit animation
        cartContent.style.transform = 'scale(0.8) translateY(-50px)';
        cartContent.style.opacity = '0';
        
        setTimeout(() => {
            cartModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function processCheckout() {
    if (cart.length === 0) {
        showToast('❌ Tu carrito está vacío', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let message = '🛍️ *Hola! Quiero hacer un pedido:*%0A%0A';
    
    cart.forEach(item => {
        message += `• ${item.name}%0A`;
        message += `  Cantidad: ${item.quantity}%0A`;
        message += `  Precio: $${item.price.toLocaleString()} c/u%0A`;
        message += `  Subtotal: $${(item.price * item.quantity).toLocaleString()}%0A%0A`;
    });
    
    message += `💰 *Total: $${total.toLocaleString()}*%0A%0A`;
    message += '📍 Por favor, confirme disponibilidad y método de envío.%0A';
    message += '¡Gracias! 💄✨';
    
    const whatsappUrl = `https://wa.me/573001234567?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    // Show success message and clear cart after a delay
    showToast('📱 Redirigiendo a WhatsApp...', 'success');
    
    setTimeout(() => {
        clearCart();
        closeCart();
        showToast('🎉 ¡Gracias por tu compra!', 'success');
    }, 2000);
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
}

// ============================================
// ALMACENAMIENTO LOCAL
// ============================================
function saveCartToStorage() {
    try {
        localStorage.setItem('bellezaCart', JSON.stringify(cart));
    } catch (e) {
        console.warn('No se pudo guardar el carrito en localStorage');
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('bellezaCart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartDisplay();
        }
    } catch (e) {
        console.warn('No se pudo cargar el carrito desde localStorage');
        cart = [];
    }
}

// ============================================
// NOTIFICACIONES TOAST
// ============================================
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ============================================
// SMOOTH SCROLLING
// ============================================
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
}

// ============================================
// INTERSECTION OBSERVER (ANIMACIONES)
// ============================================
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements
    const elementsToObserve = document.querySelectorAll('.product-card, .section-title, .feature-badges, .nosotros-contenido p');
    elementsToObserve.forEach(el => observer.observe(el));
}

// ============================================
// ANIMACIONES FLOTANTES
// ============================================
function addFloatingAnimations() {
    // Add floating animation to product cards
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-10px) scale(1)';
        });
    });
    
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        
        if (hero) {
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}

// ============================================
// UTILIDADES
// ============================================
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// BÚSQUEDA DE PRODUCTOS (FUNCIONALIDAD EXTRA)
// ============================================
function setupProductSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        const debouncedSearch = debounce(filterProducts, 300);
        searchInput.addEventListener('input', debouncedSearch);
    }
}

function filterProducts(event) {
    const searchTerm = event.target.value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productTitle = card.querySelector('.product-title').textContent.toLowerCase();
        const productDescription = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (productTitle.includes(searchTerm) || productDescription.includes(searchTerm)) {
            card.style.display = 'block';
            card.classList.add('search-match');
        } else {
            card.style.display = 'none';
            card.classList.remove('search-match');
        }
    });
    
    // Show "no results" message if needed
    const visibleCards = document.querySelectorAll('.product-card[style*="block"], .product-card:not([style*="none"])');
    if (visibleCards.length === 0 && searchTerm.trim() !== '') {
        showNoResultsMessage(searchTerm);
    } else {
        hideNoResultsMessage();
    }
}

function showNoResultsMessage(searchTerm) {
    let noResultsDiv = document.querySelector('.no-results');
    if (!noResultsDiv) {
        noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        const productGrid = document.querySelector('.products-grid');
        productGrid.parentNode.insertBefore(noResultsDiv, productGrid.nextSibling);
    }
    
    noResultsDiv.innerHTML = `
        <div class="no-results-content">
            <h3>🔍 No encontramos productos</h3>
            <p>No hay productos que coincidan con "${searchTerm}"</p>
            <p>Intenta con otros términos de búsqueda</p>
        </div>
    `;
    noResultsDiv.style.display = 'block';
}

function hideNoResultsMessage() {
    const noResultsDiv = document.querySelector('.no-results');
    if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
    }
}

// ============================================
// MANEJO DE ERRORES GLOBALES
// ============================================
window.addEventListener('error', function(e) {
    console.error('Error global capturado:', e.error);
    showToast('❌ Ocurrió un error. Intenta recargar la página.', 'error');
});

// ============================================
// PERFORMANCE MONITORING
// ============================================
window.addEventListener('load', function() {
    const loadTime = performance.now();
    console.log(`⚡ Página cargada en ${Math.round(loadTime)}ms`);
    
    if (loadTime > 3000) {
        console.warn('⚠️ La página tardó más de 3 segundos en cargar');
    }
});

// ============================================
// FUNCIONES EXPUESTAS GLOBALMENTE
// ============================================
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.openCart = openCart;
window.closeCart = closeCart;
window.processCheckout = processCheckout;