import { appConfig } from "./config/config.js";
import { getRequiredElement } from "./utils/dom.js";
import { createStorageService } from "./storage/storageService.js";
import { createApiProductRepository, createFallbackProductRepository } from "./storage/apiProductRepository.js";
import { createLocalProductRepository } from "./storage/productRepository.js";
import { createLocalCartRepository } from "./storage/cartRepository.js";
import { createProductService } from "./services/productService.js";
import { createCartStore, createCartService } from "./services/cartService.js";
import { createOrderService } from "./services/orderService.js";
import { createProductRenderer, createCartRenderer, createUserOrderRenderer } from "./ui/renderers.js";
import { createModalController } from "./ui/modalController.js";
import { createNotificationService } from "./utils/notification.js";
import { createErrorBoundary, handleError, errorCategory } from "./utils/errorHandler.js";
import { createAuthService } from "./services/authService.js";
import { Layout } from "./components/Layout.js";

const domSelectors = Object.freeze({
    app: "#app",
    hero: ".hero",
    productsGrid: '[data-js="productsGrid"]',
    cartBtn: '[data-js="cartBtn"]',
    cartBadge: '[data-js="cartBadge"]',
    checkoutModal: '[data-js="checkoutModal"]',
    modalOverlay: '[data-js="modalOverlay"]',
    modalCloseBtn: '[data-js="modalCloseBtn"]',
    cancelCheckoutBtn: '[data-js="cancelCheckoutBtn"]',
    submitOrderBtn: '[data-js="submitOrderBtn"]',
    cartItems: '[data-js="cartItems"]',
    totalPrice: '[data-js="totalPrice"]',
    deliveryAddressSection: '[data-js="deliveryAddressSection"]',
    deliveryAddress: '[data-js="deliveryAddress"]',
    customerName: '[data-js="customerName"]',
    toast: '[data-js="toast"]',
    pickupInput: 'input[name="pengambilan"]',
    paymentInput: 'input[name="pembayaran"]',
    anchorLink: 'a[href^="#"]',
    myOrdersBtn: '[data-js="myOrdersBtn"]',
    userOrderModal: '[data-js="userOrderModal"]',
    userOrderList: '[data-js="userOrderList"]',
    closeUserOrderBtn: '[data-js="closeUserOrderBtn"]',
    closeUserOrderBtn2: '[data-js="closeUserOrderBtn2"]',
    authModal: '[data-js="authModal"]',
    authModalTitle: '[data-js="authModalTitle"]',
    loginTab: '[data-js="loginTab"]',
    registerTab: '[data-js="registerTab"]',
    loginForm: '[data-js="loginForm"]',
    registerForm: '[data-js="registerForm"]',
    openAuthBtn: '[data-js="openAuthBtn"]',
    closeAuthBtn: '[data-js="closeAuthBtn"]',
    logoutBtn: '[data-js="logoutBtn"]',
    switchToRegister: '[data-js="switchToRegister"]',
    switchToLogin: '[data-js="switchToLogin"]',
});

function renderLayout(user = null) {
    const app = document.querySelector(domSelectors.app);
    if (app) {
        app.innerHTML = Layout(user);
        initHeroSlider();
    }
}

function initHeroSlider() {
    const hero = document.querySelector(domSelectors.hero);
    if (!hero) return;

    const images = [
        "images/background1.jpeg",
        "images/background2.jpeg",
        "images/background3.jpeg"
    ];
    
    let currentIndex = 0;

    function updateBackground() {
        const nextImage = images[currentIndex];
        hero.style.backgroundImage = `url("${nextImage}")`;
        hero.style.backgroundSize = "cover";
        hero.style.backgroundPosition = "center";
        hero.style.backgroundRepeat = "no-repeat";
        
        currentIndex = (currentIndex + 1) % images.length;
    }

    // Set initial background
    updateBackground();
    
    // Change every 5 seconds
    setInterval(updateBackground, 5000);
}

function cacheDomElements() {
    try {
        return {
            productsGrid: getRequiredElement(domSelectors.productsGrid),
            cartBtn: getRequiredElement(domSelectors.cartBtn),
            cartBadge: getRequiredElement(domSelectors.cartBadge),
            checkoutModal: getRequiredElement(domSelectors.checkoutModal),
            modalOverlay: getRequiredElement(domSelectors.modalOverlay),
            modalCloseBtn: getRequiredElement(domSelectors.modalCloseBtn),
            cancelCheckoutBtn: getRequiredElement(domSelectors.cancelCheckoutBtn),
            submitOrderBtn: getRequiredElement(domSelectors.submitOrderBtn),
            cartItems: getRequiredElement(domSelectors.cartItems),
            totalPrice: getRequiredElement(domSelectors.totalPrice),
            deliveryAddressSection: getRequiredElement(domSelectors.deliveryAddressSection),
            deliveryAddress: getRequiredElement(domSelectors.deliveryAddress),
            customerName: getRequiredElement(domSelectors.customerName),
            toast: getRequiredElement(domSelectors.toast),
            myOrdersBtn: getRequiredElement(domSelectors.myOrdersBtn),
            userOrderModal: getRequiredElement(domSelectors.userOrderModal),
            userOrderList: getRequiredElement(domSelectors.userOrderList),
            closeUserOrderBtn: getRequiredElement(domSelectors.closeUserOrderBtn),
            closeUserOrderBtn2: getRequiredElement(domSelectors.closeUserOrderBtn2),
            authModal: document.querySelector(domSelectors.authModal),
            authModalTitle: document.querySelector(domSelectors.authModalTitle),
            loginTab: document.querySelector(domSelectors.loginTab),
            registerTab: document.querySelector(domSelectors.registerTab),
            loginForm: document.querySelector(domSelectors.loginForm),
            registerForm: document.querySelector(domSelectors.registerForm),
            openAuthBtn: document.querySelector(domSelectors.openAuthBtn),
            closeAuthBtn: document.querySelector(domSelectors.closeAuthBtn),
            logoutBtn: document.querySelector(domSelectors.logoutBtn),
            switchToRegister: document.querySelector(domSelectors.switchToRegister),
            switchToLogin: document.querySelector(domSelectors.switchToLogin),
            pickupInputs: document.querySelectorAll(domSelectors.pickupInput),
            paymentInputs: document.querySelectorAll(domSelectors.paymentInput),
            anchorLinks: document.querySelectorAll(domSelectors.anchorLink),
        };
    } catch (error) {
        throw new Error("Komponen halaman gagal dimuat.");
    }
}

function getEventTargetElement(event) {
    return event.target instanceof Element ? event.target : null;
}

function bindAppEvents({
    elements,
    cartService,
    orderService,
    cartRenderer,
    modalController,
    notificationService,
    errorBoundary,
    productRepository,
    productService,
    productRenderer,
    userOrderRenderer,
    authService,
}) {
    const openAuthModal = (defaultTab = "login") => {
        if (!elements.authModal || !elements.modalOverlay) {
            return;
        }

        switchTab(defaultTab);
        elements.authModal.hidden = false;
        elements.modalOverlay.hidden = false;
        elements.authModal.classList.add("active");
        elements.modalOverlay.classList.add("active");
        elements.authModal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    };

    const closeAuthModal = () => {
        if (!elements.authModal || !elements.modalOverlay) {
            return;
        }

        if (!authService.isAuthenticated()) {
            return;
        }

        elements.authModal.classList.remove("active");
        elements.modalOverlay.classList.remove("active");
        elements.authModal.hidden = true;
        elements.modalOverlay.hidden = true;
        elements.authModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    };

    // Auth Events
    if (elements.openAuthBtn) {
        elements.openAuthBtn.addEventListener("click", () => {
            openAuthModal("login");
        });
    }

    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", () => {
            authService.logout();
            window.location.href = "./index.html";
        });
    }

    if (elements.closeAuthBtn) {
        elements.closeAuthBtn.addEventListener("click", closeAuthModal);
    }

    const switchTab = (tab) => {
        if (tab === 'login') {
            elements.loginTab.classList.add('active');
            elements.registerTab.classList.remove('active');
            elements.loginForm.hidden = false;
            elements.registerForm.hidden = true;
            if (elements.authModalTitle) {
                elements.authModalTitle.textContent = 'Login';
            }
        } else {
            elements.loginTab.classList.remove('active');
            elements.registerTab.classList.add('active');
            elements.loginForm.hidden = true;
            elements.registerForm.hidden = false;
            if (elements.authModalTitle) {
                elements.authModalTitle.textContent = 'Register';
            }
        }
    };

    if (elements.loginTab) elements.loginTab.addEventListener('click', () => switchTab('login'));
    if (elements.registerTab) elements.registerTab.addEventListener('click', () => switchTab('register'));
    if (elements.switchToRegister) elements.switchToRegister.addEventListener('click', () => switchTab('register'));
    if (elements.switchToLogin) elements.switchToLogin.addEventListener('click', () => switchTab('login'));

    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(elements.loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            void errorBoundary.run("auth:login", async () => {
                const result = await authService.login(email, password);
                if (result.success) {
                    notificationService.success(`Selamat datang kembali, ${result.user.name}!`);
                    closeAuthModal();
                    setTimeout(() => window.location.reload(), 400);
                }
            });
        });
    }

    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(elements.registerForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const password = formData.get('password');

            void errorBoundary.run("auth:register", async () => {
                const result = await authService.register(name, email, password);
                if (result.success) {
                    notificationService.success(`Registrasi berhasil. Selamat datang, ${result.user.name}!`);
                    closeAuthModal();
                    setTimeout(() => window.location.reload(), 400);
                }
            });
        });
    }

    elements.productsGrid.addEventListener("click", (event) => {
        const target = getEventTargetElement(event);
        const button = target?.closest('[data-action="add-to-cart"]');

        if (!button) {
            return;
        }

        void errorBoundary.run("cart:add", async () => {
            const addResult = await cartService.addProduct(button.dataset.productId);

            if (!addResult.ok) {
                handleError(addResult.error, {}, { notify: notificationService.show });
                return;
            }

            notificationService.success(
                addResult.meta.duplicate
                    ? `${addResult.data.name} sudah ada. Jumlah diperbarui.`
                    : `${addResult.data.name} ditambahkan ke keranjang.`
            );
        });
    });

    elements.cartBtn.addEventListener("click", () => {
        if (!authService.isAuthenticated()) {
            notificationService.warning("Silakan login terlebih dahulu.");
            openAuthModal("login");
            return;
        }

        if (cartService.getItemCount() === 0) {
            notificationService.warning("Keranjang masih kosong.");
            cartRenderer.renderCartItems([]);
            return;
        }

        cartRenderer.renderSummary(cartService);
        modalController.open();
    });

    elements.modalCloseBtn.addEventListener("click", modalController.close);
    elements.cancelCheckoutBtn.addEventListener("click", modalController.close);
    elements.closeUserOrderBtn.addEventListener("click", modalController.close);
    elements.closeUserOrderBtn2.addEventListener("click", modalController.close);
    elements.modalOverlay.addEventListener("click", () => {
        if (elements.authModal?.classList.contains("active")) {
            closeAuthModal();
            return;
        }

        modalController.close();
    });

    elements.myOrdersBtn.addEventListener("click", () => {
        if (!authService.isAuthenticated()) {
            notificationService.warning("Silakan login terlebih dahulu.");
            openAuthModal("login");
            return;
        }

        void errorBoundary.run("orders:load", async () => {
            modalController.openUserOrders();
            
            const savedName = localStorage.getItem('kp_customer_name');
            if (!savedName) {
                elements.userOrderList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <p>Anda belum pernah melakukan pemesanan.</p>
                        <p style="font-size: 13px; margin-top: 8px;">Riwayat akan muncul setelah Anda memesan.</p>
                    </div>`;
                return;
            }

            elements.userOrderList.innerHTML = '<div style="text-align: center; padding: 2rem;">Memuat riwayat pesanan...</div>';
            
            const result = await orderService.getOrders();
            if (result.ok) {
                userOrderRenderer.renderOrders(result.data);
            } else {
                handleError(result.error, {}, { notify: notificationService.show });
            }
        });
    });

    elements.cartItems.addEventListener("click", (event) => {
        const target = getEventTargetElement(event);
        const button = target?.closest("button[data-action]");

        if (!button) {
            return;
        }

        void errorBoundary.run("cart:item-action", async () => {
            const { action, itemId } = button.dataset;
            let actionResult = { ok: true };

            if (action === "increase") {
                actionResult = await cartService.increaseItem(itemId);
            } else if (action === "decrease") {
                actionResult = await cartService.decreaseItem(itemId);
            } else if (action === "remove") {
                actionResult = await cartService.removeItem(itemId);
            }

            if (!actionResult.ok) {
                handleError(actionResult.error, {}, { notify: notificationService.show });
            }
        });
    });

    elements.submitOrderBtn.addEventListener("click", () => {
        void errorBoundary.run("order:submit", async () => {
            const orderResult = await orderService.submitCheckout(modalController.getCheckoutFormData());

            if (!orderResult.ok) {
                handleError(orderResult.error, {}, { notify: notificationService.show });

                if (orderResult.error?.code === "MISSING_DELIVERY_ADDRESS") {
                    elements.deliveryAddress.focus();
                }

                return;
            }

            // Note: Deduct stock is handled automatically by the backend API on POST /orders.
            // We just need to clear the local cart.

            const clearResult = await cartService.clearItems();

            if (!clearResult.ok) {
                handleError(clearResult.error, {}, { notify: notificationService.show });
                return;
            }

            modalController.close();
            notificationService.success(
                `Pesanan berhasil dibuat. Ketersediaan stok inventaris diperbarui.`
            );

            // Re-render product grid with updated stock values
            const productsResult = await productService.getProducts();
            if (productsResult.ok) {
                productRenderer.renderProducts(elements.productsGrid, productsResult.data);
            }
        });
    });

    elements.pickupInputs.forEach((input) => {
        input.addEventListener("change", modalController.updateDeliveryOptions);
    });

    elements.anchorLinks.forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
            const href = anchor.getAttribute("href");
            const target = href ? document.querySelector(href) : null;

            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalController.isOpen()) {
            modalController.close();
        }
    });

    return { openAuthModal, closeAuthModal };
}

async function initializeApp() {
    const authService = createAuthService();
    const user = authService.getUser();
    
    renderLayout(user); // Render modular layout before caching elements
    
    const elements = cacheDomElements();
    const notificationService = createNotificationService(elements.toast);
    const storageService = createStorageService();
    const apiProductRepo = createApiProductRepository();
    // Using an empty array as seed data since we want to follow API and not mockup
    const localProductRepo = createLocalProductRepository(storageService, []);
    const productRepository = createFallbackProductRepository(apiProductRepo, localProductRepo);
    const productService = createProductService(productRepository);
    const cartRepository = createLocalCartRepository(storageService);
    const cartStore = createCartStore(cartRepository);
    const cartService = createCartService({ cartStore, productService });
    const orderService = createOrderService({ cartService });
    const productRenderer = createProductRenderer();
    const cartRenderer = createCartRenderer({ elements });
    const userOrderRenderer = createUserOrderRenderer({ elements });
    const modalController = createModalController({ elements });
    const errorBoundary = createErrorBoundary({ productRenderer, elements, notificationService });
    let storageWarningShown = false;

    productRenderer.renderLoading(elements.productsGrid);
    cartRenderer.updateCartBadge(0);

    cartService.subscribe(({ cart, meta }) => {
        const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
        cartRenderer.updateCartBadge(itemCount);

        if (modalController.isOpen()) {
            cartRenderer.renderSummary(cartService);
        }

        if (cart.items.length === 0 && modalController.isOpen()) {
            modalController.close();
        }

        if (meta.type === "change" && meta.persistent === false && !storageWarningShown) {
            storageWarningShown = true;
            notificationService.warning("Cart aktif sementara karena storage tidak tersedia.");
        }
    });

    const { openAuthModal } = bindAppEvents({
        elements,
        cartService,
        orderService,
        cartRenderer,
        modalController,
        notificationService,
        errorBoundary,
        productRepository,
        productService,
        productRenderer,
        userOrderRenderer,
        authService
    });

    if (!authService.isAuthenticated()) {
        openAuthModal("login");
    }

    window.addEventListener("auth:expired", () => {
        notificationService.warning("Sesi login berakhir. Silakan masuk kembali.");
        openAuthModal("login");
    });

    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("unauthorized") === "1") {
        notificationService.warning("Akun Anda tidak memiliki akses ke halaman admin.");
        currentUrl.searchParams.delete("unauthorized");
        window.history.replaceState({}, "", currentUrl);
    }

    // Real-Time Cross-Tab Sync
    window.addEventListener("storage", (event) => {
        if (event.key === appConfig.inventory.storageKey) {
            void errorBoundary.run("storage:update", async () => {
                const productsResult = await productService.getProducts();
                if (productsResult.ok) {
                    productRenderer.renderProducts(elements.productsGrid, productsResult.data);
                }
            });
        }
    });

    await errorBoundary.run("app:init", async () => {
        const initResult = await cartService.initialize();

        if (!initResult.ok) {
            handleError(initResult.error, {}, { notify: notificationService.show });
        }

        const productsResult = await productService.getProducts();

        if (!productsResult.ok) {
            throw productsResult.error;
        }

        productRenderer.renderProducts(elements.productsGrid, productsResult.data);
        cartRenderer.updateCartBadge(cartService.getItemCount());
        modalController.updateDeliveryOptions();
    });
}

function bootstrap() {
    void initializeApp().catch((error) => {
        const appError = handleError(error, {
            category: errorCategory.app,
            code: "APP_BOOTSTRAP_FAILED",
            message: "Aplikasi gagal dimuat. Silakan refresh browser.",
        });
        const fallback = document.createElement("div");
        fallback.className = "app-fatal";
        fallback.textContent = appError.userMessage;
        document.body.prepend(fallback);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
} else {
    bootstrap();
}
