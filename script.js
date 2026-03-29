const CONFIG = {
    EMAILJS: {
        PUBLIC_KEY: 'cgv4N-1uJJsKQLEOL',
        SERVICE_ID: 'service_n1bgsxi',
        TEMPLATE_ID: 'template_bmkxtbd'
    },
    CURRENCY: {
        SYMBOL: '₱',
        DECIMALS: 2
    },
    EMAIL: 'kyuukatzukii@gmail.com'
};

const PRODUCTS = [
    { id: 1, name: "Croissant", price: 200, image: "images/Croissants .webp" },
    { id: 2, name: "Pain A ail", price: 100, image: "images/Pain A I'ail.jpg" },
    { id: 3, name: "Eclair", price: 300, image: "images/Eclair.jpg" }
];

class ShoppingCart {
    constructor() {
        this.items = this.loadFromStorage();
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('shoppingCart');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveToStorage() {
        localStorage.setItem('shoppingCart', JSON.stringify(this.items));
    }
    
    addItem(productId) {
        const product = PRODUCTS.find(p => p.id === productId);
        if (!product) return false;
        
        const existingItem = this.items.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveToStorage();
        return true;
    }
    
    updateQuantity(index, change) {
        if (!this.items[index]) return false;
        
        const newQuantity = this.items[index].quantity + change;
        
        if (newQuantity <= 0) {
            this.removeItem(index);
        } else {
            this.items[index].quantity = newQuantity;
        }
        
        this.saveToStorage();
        return true;
    }
    
    removeItem(index) {
        this.items.splice(index, 1);
        this.saveToStorage();
    }
    
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getFormattedItems() {
        return this.items.map(item => 
            `${item.name} - Quantity: ${item.quantity} - ${this.formatPrice(item.price * item.quantity)}`
        ).join('\n');
    }
    
    formatPrice(amount) {
        return `${CONFIG.CURRENCY.SYMBOL}${amount.toFixed(CONFIG.CURRENCY.DECIMALS)}`;
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    clear() {
        this.items = [];
        this.saveToStorage();
    }
    
    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }
}

class CartUI {
    constructor(cart) {
        this.cart = cart;
        this.createCartModal();
        this.updateCartIcon();
    }
    
    createCartModal() {
        const modalHTML = `
            <div id="cartModal" class="cart-modal">
                <div class="cart-modal-content">
                    <div class="cart-modal-header">
                        <h2><i class="fas fa-shopping-cart"></i> Your Cart</h2>
                        <span class="cart-modal-close">&times;</span>
                    </div>
                    <div id="cartItemsContainer" class="cart-items-container"></div>
                    <div class="cart-modal-footer">
                        <button id="checkoutBtn" class="checkout-btn">Place Order</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.modal = document.getElementById('cartModal');
        this.closeBtn = document.querySelector('.cart-modal-close');
        this.cartContainer = document.getElementById('cartItemsContainer');
        
        this.closeBtn.onclick = () => this.closeModal();
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        };
    }
    
    openModal() {
        this.displayCartItems();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    displayCartItems() {
        if (this.cart.isEmpty()) {
            this.cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Your cart is empty</p>
                    <button class="continue-shopping-btn" onclick="app.cartUI.closeModal()">Continue Shopping</button>
                </div>
            `;
            return;
        }
        
        const itemsHTML = this.cart.items.map((item, index) => `
            <div class="cart-item-modal">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">${this.cart.formatPrice(item.price)}</p>
                    <div class="cart-item-quantity">
                        <button onclick="app.updateQuantity(${index}, -1)" class="qty-btn">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="app.updateQuantity(${index}, 1)" class="qty-btn">+</button>
                        <button onclick="app.removeFromCart(${index})" class="remove-item-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-subtotal">
                    ${this.cart.formatPrice(item.price * item.quantity)}
                </div>
            </div>
        `).join('');
        
        const totalHTML = `
            <div class="cart-total-modal">
                <strong>Total:</strong>
                <span>${this.cart.formatPrice(this.cart.getTotal())}</span>
            </div>
        `;
        
        this.cartContainer.innerHTML = itemsHTML + totalHTML;
    }
    
    updateCartIcon() {
        const totalItems = this.cart.getTotalItems();
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    showAlert(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${isError ? 'toast-error' : 'toast-success'}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

class EmailService {
    static async sendOrderNotification(orderData) {
        const templateParams = {
            to_email: CONFIG.OWNER_EMAIL,
            customer_name: orderData.customerName,
            customer_email: orderData.customerEmail,
            order_items: orderData.items,
            order_total: orderData.total,
            order_date: orderData.date
        };
        
        return await emailjs.send(
            CONFIG.EMAILJS.SERVICE_ID,
            CONFIG.EMAILJS.TEMPLATE_ID,
            templateParams
        );
    }
}

class OrderProcessor {
    constructor(cart, ui) {
        this.cart = cart;
        this.ui = ui;
    }
    
    async process() {
        if (this.cart.isEmpty()) {
            this.ui.showAlert('Your cart is empty. Please add items before proceeding.', true);
            return false;
        }
        
        const customerInfo = this.getCustomerInfo();
        if (!customerInfo) return false;
        
        const orderData = {
            ...customerInfo,
            items: this.cart.getFormattedItems(),
            total: this.cart.formatPrice(this.cart.getTotal()),
            date: new Date().toLocaleString()
        };
        
        const emailSent = await this.sendOrderNotification(orderData);
        
        if (emailSent) {
            this.completeOrder(orderData);
            return true;
        }
        
        return false;
    }
    
    getCustomerInfo() {
        const name = this.getUserInput('Please enter your name:', 'Name is required');
        if (!name) return null;
        
        const email = this.getUserInput('Enter your email address:', 'Email address is required');
        if (!email) return null;
        
        return {
            customerName: name,
            customerEmail: email
        };
    }
    
    getUserInput(promptText, errorMessage, optional = false) {
        const input = prompt(promptText, '');
        
        if (input === null) return null;
        
        const trimmed = input.trim();
        if (!optional && !trimmed) {
            alert(errorMessage);
            return null;
        }
        
        return trimmed;
    }
    
    async sendOrderNotification(orderData) {
        const checkoutBtn = document.getElementById('checkoutBtn');
        const originalText = checkoutBtn.textContent;
        checkoutBtn.textContent = 'Placing Order...';
        checkoutBtn.disabled = true;
        
        try {
            await EmailService.sendOrderNotification(orderData);
            this.ui.showAlert('Order placed successfully! We will contact you soon.');
            return true;
        } catch (error) {
            console.error('Failed to send order:', error);
            this.ui.showAlert(
                `Failed to place order. Please try again.`,
                true
            );
            return false;
        } finally {
            checkoutBtn.textContent = originalText;
            checkoutBtn.disabled = false;
        }
    }
    
    completeOrder(orderData) {
        this.cart.clear();
        this.ui.displayCartItems();
        this.ui.updateCartIcon();
        this.ui.showAlert(`Thank you ${orderData.customerName}! Your order has been received.`);
    }
}

class AppController {
    constructor() {
        this.cart = new ShoppingCart();
        this.cartUI = new CartUI(this.cart);
        this.orderProcessor = new OrderProcessor(this.cart, this.cartUI);
        
        this.init();
    }
    
    init() {
        emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);
        
        this.createCartIcon();
        this.attachEventListeners();
        this.cartUI.updateCartIcon();
    }
    
    createCartIcon() {
        const header = document.querySelector('.header');
        const cartHTML = `
            <div class="cart-icon-container" onclick="app.openCart()">
                <div class="cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-count">0</span>
                </div>
            </div>
        `;
        header.insertAdjacentHTML('beforeend', cartHTML);
    }
    
    attachEventListeners() {
        const orderButtons = document.querySelectorAll('.order-now-btn');
        orderButtons.forEach((btn, index) => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(index + 1);
            });
        });
    }
    
    addToCart(productId) {
        if (this.cart.addItem(productId)) {
            const product = PRODUCTS.find(p => p.id === productId);
            this.cartUI.updateCartIcon();
            this.cartUI.showAlert(`${product.name} added to cart!`);
            
            const cartIcon = document.querySelector('.cart-icon');
            cartIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cartIcon.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    openCart() {
        this.cartUI.openModal();
        this.cartUI.displayCartItems();
        this.reattachCartButtons();
    }
    
    reattachCartButtons() {
        setTimeout(() => {
            const checkoutBtn = document.getElementById('checkoutBtn');
            if (checkoutBtn) {
                const newCheckoutBtn = checkoutBtn.cloneNode(true);
                checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);
                newCheckoutBtn.addEventListener('click', () => this.proceedToCheckout());
            }
            
            const continueBtn = document.querySelector('.continue-shopping-btn');
            if (continueBtn) {
                const newContinueBtn = continueBtn.cloneNode(true);
                continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
                newContinueBtn.addEventListener('click', () => this.cartUI.closeModal());
            }
        }, 100);
    }
    
    updateQuantity(index, change) {
        if (this.cart.updateQuantity(index, change)) {
            this.cartUI.displayCartItems();
            this.cartUI.updateCartIcon();
            this.reattachCartButtons();
        }
    }
    
    removeFromCart(index) {
        this.cart.removeItem(index);
        this.cartUI.displayCartItems();
        this.cartUI.updateCartIcon();
        this.reattachCartButtons();
        
        if (this.cart.isEmpty()) {
            setTimeout(() => {
                if (this.cartUI.modal.style.display === 'block') {
                    this.cartUI.closeModal();
                }
            }, 1500);
        }
    }
    
    async proceedToCheckout() {
        await this.orderProcessor.process();
        if (this.cart.isEmpty()) {
            this.cartUI.closeModal();
        }
        this.cartUI.displayCartItems();
        this.cartUI.updateCartIcon();
        this.reattachCartButtons();
    }
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        closeMenu();
    }
});

window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        closeMenu();
    }
});

let app = null;

document.addEventListener('DOMContentLoaded', () => {
    app = new AppController();
});