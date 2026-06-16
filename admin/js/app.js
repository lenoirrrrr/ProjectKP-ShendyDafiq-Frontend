import { appConfig, productSeedData } from "./config.js";
import { handleError, errorCategory } from "./utils/error.js";
import { getEventTargetElement, getRequiredElement, renderFormErrors } from "./utils/dom.js";
import { createStorageService } from "./services/storageService.js";
import {
    createApiProductRepository,
    createFallbackProductRepository,
    createLocalProductRepository,
    createOrderItemService,
} from "./services/productRepository.js";
import { createInventoryService } from "./services/inventoryService.js";
import { createInventoryStore } from "./state/inventoryStore.js";
import { createNotificationService } from "./ui/notification.js";
import { createModalController } from "./ui/modal.js";
import { renderProductsTable, renderStats, renderOrdersTable, renderOrderItems } from "./ui/renderers.js";
import { authService } from "./services/authService.js";

const selectors = Object.freeze({
    openCreateProductBtn: '[data-js="openCreateProductBtn"]',
    resetSeedBtn: '[data-js="resetSeedBtn"]',
    searchInput: '[data-js="searchInput"]',
    statsGrid: '[data-js="statsGrid"]',
    productsTableBody: '[data-js="productsTableBody"]',
    emptyState: '[data-js="emptyState"]',
    productModal: '[data-js="productModal"]',
    modalOverlay: '[data-js="modalOverlay"]',
    orderModal: '[data-js="orderModal"]',
    orderItemsTableBody: '[data-js="orderItemsTableBody"]',
    closeOrderModalBtn: '[data-js="closeOrderModalBtn"]',
    closeOrderModalBtn2: '[data-js="closeOrderModalBtn2"]',
    productForm: '[data-js="productForm"]',
    productModalTitle: '[data-js="productModalTitle"]',
    productIdInput: '[data-js="productIdInput"]',
    closeModalBtn: '[data-js="closeModalBtn"]',
    cancelModalBtn: '[data-js="cancelModalBtn"]',
    toast: '[data-js="toast"]',
    loginScreen: '[data-js="loginScreen"]',
    loginForm: '[data-js="loginForm"]',
    loginError: '[data-js="loginError"]',
    logoutBtn: '[data-js="logoutBtn"]',
    sidebarNav: '[data-js="sidebarNav"]',
    ordersTableBody: '[data-js="ordersTableBody"]',
    emptyOrdersState: '[data-js="emptyOrdersState"]',
});

function cacheDomElements() {
    return {
        openCreateProductBtn: getRequiredElement(selectors.openCreateProductBtn),
        resetSeedBtn: getRequiredElement(selectors.resetSeedBtn),
        searchInput: getRequiredElement(selectors.searchInput),
        statsGrid: getRequiredElement(selectors.statsGrid),
        productsTableBody: getRequiredElement(selectors.productsTableBody),
        emptyState: getRequiredElement(selectors.emptyState),
        productModal: getRequiredElement(selectors.productModal),
        modalOverlay: getRequiredElement(selectors.modalOverlay),
        orderModal: getRequiredElement(selectors.orderModal),
        orderItemsTableBody: getRequiredElement(selectors.orderItemsTableBody),
        closeOrderModalBtn: getRequiredElement(selectors.closeOrderModalBtn),
        closeOrderModalBtn2: getRequiredElement(selectors.closeOrderModalBtn2),
        productForm: getRequiredElement(selectors.productForm),
        productModalTitle: getRequiredElement(selectors.productModalTitle),
        productIdInput: getRequiredElement(selectors.productIdInput),
        closeModalBtn: getRequiredElement(selectors.closeModalBtn),
        cancelModalBtn: getRequiredElement(selectors.cancelModalBtn),
        toast: getRequiredElement(selectors.toast),
        loginScreen: getRequiredElement(selectors.loginScreen),
        loginForm: getRequiredElement(selectors.loginForm),
        loginError: getRequiredElement(selectors.loginError),
        logoutBtn: getRequiredElement(selectors.logoutBtn),
        sidebarNav: getRequiredElement(selectors.sidebarNav),
        ordersTableBody: getRequiredElement(selectors.ordersTableBody),
        emptyOrdersState: getRequiredElement(selectors.emptyOrdersState),
    };
}

function getFormPayload(form) {
    const formData = new FormData(form);

    return {
        id: String(formData.get("id") ?? ""),
        name: String(formData.get("name") ?? ""),
        category: String(formData.get("category") ?? ""),
        price: String(formData.get("price") ?? ""),
        stock: String(formData.get("stock") ?? ""),
        description: String(formData.get("description") ?? ""),
    };
}

function getSupabase() {
    return window.supabase.createClient(appConfig.supabase.url, appConfig.supabase.anonKey);
}

function renderApp(elements, store) {
    renderStats(elements.statsGrid, store.getStats());
    renderProductsTable(elements.productsTableBody, elements.emptyState, store.getVisibleProducts());
}

async function loadOrders(elements, store) {
    try {
        const supabase = getSupabase();
        console.log("Memuat rincian pesanan dari Supabase (OrderItem & Order)...");
        
        // Strategi: Tarik dari tabel 'Order' terlebih dahulu sebagai sumber utama transaksi
        let { data, error } = await supabase
            .from('Order')
            .select('*')
            .order('createdAt', { ascending: false });

        // Jika tabel 'Order' (PascalCase) tidak ditemukan atau kosong, coba 'order' (lowercase)
        if (error || !data || data.length === 0) {
            console.warn("Tabel 'Order' kosong/error, mencoba 'order'...");
            const { data: dataAlt, error: errorAlt } = await supabase
                .from('order')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!errorAlt && dataAlt?.length > 0) {
                data = dataAlt;
                error = null;
            }
        }

        // Jika masih kosong, baru fallback ke 'OrderItem' sebagai usaha terakhir
        if (!data || data.length === 0) {
            console.warn("Tabel Order tetap kosong, mencoba menarik dari OrderItem...");
            const { data: dataItems, error: errorItems } = await supabase
                .from('OrderItem')
                .select('*');
            
            if (!errorItems && dataItems?.length > 0) {
                data = dataItems;
            }
        }

        if (error && !data) throw error;

        // Normalisasi data untuk tabel dashboard
        const processedOrders = (data || []).map(order => ({
            id: order.id || "",
            createdAt: order.createdAt || order.created_at || new Date().toISOString(),
            totalAmount: order.totalAmount || order.total_amount || (order.price * order.quantity) || 0,
            status: order.status || order.Status || "COMPLETED",
            ...order
        }));

        console.log("Data pesanan berhasil ditarik:", processedOrders);
        renderOrdersTable(elements.ordersTableBody, elements.emptyOrdersState, processedOrders);
        
    } catch (err) {
        console.error("Gagal memuat pesanan:", err);
        // Fallback ke backend local
        try {
            const response = await fetch(`${appConfig.api.baseUrl}/orders`, {
                headers: authService.getToken()
                    ? { Authorization: `Bearer ${authService.getToken()}` }
                    : {},
            });

            if (response.status === 401 || response.status === 403) {
                authService.handleUnauthorized(response.status);
                return;
            }

            const result = await response.json();
            if (result.success) {
                renderOrdersTable(elements.ordersTableBody, elements.emptyOrdersState, result.data);
            }
        } catch (backendErr) {
            console.error("Gagal memuat pesanan dari backend:", backendErr);
        }
    }
}

function createRepositories() {
    const storageService = createStorageService();
    const localRepository = createLocalProductRepository(storageService, productSeedData);

    if (!appConfig.api.enabled) {
        return localRepository;
    }

    const apiRepository = createApiProductRepository({
        baseUrl: appConfig.api.baseUrl,
        getAuthToken: () => authService.getToken(),
    });

    return createFallbackProductRepository(apiRepository, localRepository);
}

async function uploadImageToSupabase(file) {
    const { url, anonKey, bucket } = appConfig.supabase;
    if (url === "YOUR_SUPABASE_URL") {
        throw new Error("Supabase URL belum dikonfigurasi.");
    }

    const supabase = window.supabase.createClient(url, anonKey);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

    if (error) {
        throw error;
    }

    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
}

function bindEvents({ elements, store, modalController, notificationService }) {
    elements.openCreateProductBtn.addEventListener("click", () => {
        modalController.openCreate();
    });

    elements.closeModalBtn.addEventListener("click", modalController.close);
    elements.cancelModalBtn.addEventListener("click", modalController.close);
    elements.modalOverlay.addEventListener("click", modalController.close);

    elements.searchInput.addEventListener("input", () => {
        store.setSearchQuery(elements.searchInput.value);
    });

    elements.resetSeedBtn.addEventListener("click", () => {
        void (async () => {
            const resetResult = await store.resetProducts();

            if (!resetResult.ok) {
                handleError(resetResult.error, {}, { notify: notificationService.show });
                return;
            }

            notificationService.success("Data demo berhasil direset.");
        })();
    });

    elements.productsTableBody.addEventListener("click", (event) => {
        const target = getEventTargetElement(event);
        const button = target?.closest("button[data-action]");

        if (!button) {
            return;
        }

        const { action, productId } = button.dataset;

        if (action === "edit") {
            const product = store.getProductById(productId);

            if (!product) {
                notificationService.warning("Produk tidak ditemukan.");
                return;
            }

            modalController.openEdit(product);
            return;
        }

        if (action === "delete") {
            void (async () => {
                const deleteResult = await store.deleteProduct(productId);

                if (!deleteResult.ok) {
                    handleError(deleteResult.error, {}, { notify: notificationService.show });
                    return;
                }

                notificationService.success(`${deleteResult.data.name} berhasil dihapus.`);
            })();
        }
    });

    elements.closeOrderModalBtn.onclick = () => { elements.orderModal.hidden = true; elements.modalOverlay.hidden = true; };
    elements.closeOrderModalBtn2.onclick = () => { elements.orderModal.hidden = true; elements.modalOverlay.hidden = true; };

    const orderItemService = createOrderItemService({
        baseUrl: appConfig.api.baseUrl,
        getAuthToken: () => authService.getToken()
    });

    elements.orderItemsTableBody.addEventListener("click", async (e) => {
        const btn = e.target.closest('button[data-action="deleteItem"]');
        if (!btn) return;

        const { itemId } = btn.dataset;
        if (!confirm("Hapus item ini dari pesanan?")) return;

        const result = await orderItemService.remove(itemId);
        if (result.ok) {
            notificationService.success("Item berhasil dihapus.");
            // Refresh detail list
            btn.closest("tr").remove();
        } else {
            notificationService.error(result.message);
        }
    });

    elements.ordersTableBody.addEventListener("click", async (e) => {
        const btn = e.target.closest('button[data-action="viewItems"]');
        if (!btn) return;
        
        const orderId = btn.dataset.orderId;
        try {
            const supabase = getSupabase();
            console.log(`Mengambil item untuk order: ${orderId}`);
            
            // Urutan Pencarian Item Pesanan:
            // 1. OrderItem (PascalCase) + Product
            let { data: items, error } = await supabase
                .from('OrderItem')
                .select('*, product:Product(name)')
                .eq('orderId', orderId);

            // 2. OrderItems (Plural PascalCase) + Products
            if (error || !items || items.length === 0) {
                const { data: alt, error: altErr } = await supabase
                    .from('OrderItems')
                    .select('*, product:Products(name)')
                    .eq('orderId', orderId);
                if (!altErr && alt?.length > 0) { items = alt; error = null; }
            }

            // 3. order_items (snake_case) + products
            if (error || !items || items.length === 0) {
                const { data: alt, error: altErr } = await supabase
                    .from('order_items')
                    .select('*, product:products(name)')
                    .eq('order_id', orderId);
                if (!altErr && alt?.length > 0) { items = alt; error = null; }
            }

            renderOrderItems(elements.orderItemsTableBody, items || []);
            elements.orderModal.hidden = false;
            elements.modalOverlay.hidden = false;
        } catch (err) {
            console.error("Gagal memuat detail pesanan dari Supabase:", err);
            // Fallback to backend
            try {
                const response = await fetch(`${appConfig.api.baseUrl}/orders/${orderId}`, {
                    headers: authService.getToken()
                        ? { Authorization: `Bearer ${authService.getToken()}` }
                        : {},
                });

                if (response.status === 401 || response.status === 403) {
                    authService.handleUnauthorized(response.status);
                    return;
                }

                const result = await response.json();
                if (result.success) {
                    renderOrderItems(elements.orderItemsTableBody, result.data.items || []);
                    elements.orderModal.hidden = false;
                    elements.modalOverlay.hidden = false;
                }
            } catch (backendErr) {
                console.error("Gagal memuat detail dari backend:", backendErr);
            }
        }
    });

    elements.ordersTableBody.addEventListener("change", async (e) => {
        const select = e.target.closest('select[data-action="updateStatus"]');
        if (!select) return;

        const { orderId } = select.dataset;
        const newStatus = select.value;

        try {
            const response = await fetch(`${appConfig.api.baseUrl}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authService.getToken() ? { Authorization: `Bearer ${authService.getToken()}` } : {}),
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.status === 401 || response.status === 403) {
                authService.handleUnauthorized(response.status);
                return;
            }

            const result = await response.json();
            if (result.success) {
                notificationService.success(`Status pesanan #${orderId.substring(0, 8)} diperbarui ke ${newStatus}`);
                // Refresh list to ensure consistency
                await loadOrders(elements, store);
            } else {
                notificationService.error(result.message || "Gagal memperbarui status.");
            }
        } catch (err) {
            console.error("Error updating order status:", err);
            notificationService.error("Gagal terhubung ke server untuk memperbarui status.");
        }
    });

    elements.logoutBtn.addEventListener("click", () => {
        authService.logout();
    });

    elements.productForm.addEventListener("submit", (event) => {
        event.preventDefault();

        void (async () => {
            const imageInput = document.getElementById("imageInput");
            const file = imageInput?.files ? imageInput.files[0] : null;
            
            const payload = getFormPayload(elements.productForm);
            const isEditMode = modalController.getMode() === "edit";
            const existingProduct = isEditMode ? store.getProductById(elements.productIdInput.value) : null;

            let imageUrl = existingProduct?.image || ""; // Keep old image if editing

            if (file) {
                try {
                    notificationService.show("Sedang mengupload gambar...");
                    imageUrl = await uploadImageToSupabase(file);
                } catch (error) {
                    console.error("Upload error:", error);
                    notificationService.error("Gagal mengupload gambar: " + error.message);
                    return;
                }
            }

            // Set final image URL
            payload.image = imageUrl || "../images/beras.jpg";
            payload.imageUrl = payload.image;
            
            const result = isEditMode
                ? await store.updateProduct(elements.productIdInput.value, payload)
                : await store.createProduct(payload);

            if (!result.ok) {
                renderFormErrors(elements.productForm, result.meta.errors ?? result.error?.details?.errors ?? {});
                handleError(result.error, {}, { notify: notificationService.show });
                return;
            }

            modalController.close();
            // Reset image input
            if (imageInput) imageInput.value = "";
            
            notificationService.success(isEditMode ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
        })();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modalController.isOpen()) {
            modalController.close();
        }
    });
}

async function initializeAdminApp() {
    const elements = cacheDomElements();
    const user = authService.getUser();

    if (authService.isAuthenticated() && user?.role !== "ADMIN") {
        window.location.href = "../index.html?unauthorized=1";
        return;
    }

    // LOGIN SCREEN SUBMIT EVENT
    elements.loginForm.onsubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const emailInput = elements.loginForm.querySelector('input[name="username"]');
        const passwordInput = elements.loginForm.querySelector('input[name="password"]');
        
        const result = await authService.login(emailInput.value, passwordInput.value);

        if (result.success) {
            elements.loginScreen.style.setProperty("display", "none", "important");
            elements.loginError.style.display = "none";
            window.location.reload();
        } else {
            elements.loginError.textContent = result.message;
            elements.loginError.style.setProperty("display", "block", "important");
            elements.loginError.style.setProperty("color", "#d32f2f", "important");
        }
        return false;
    };

    const notificationService = createNotificationService(elements.toast);
    const productRepository = createRepositories();
    const inventoryService = createInventoryService(productRepository);
    const store = createInventoryStore(inventoryService);
    const modalController = createModalController(elements);

    store.subscribe(({ meta }) => {
        try {
            renderApp(elements, store);

            if (meta.error) {
                handleError(meta.error, {}, { notify: notificationService.show });
            }
        } catch (error) {
            handleError(error, {
                category: errorCategory.app,
                code: "ADMIN_RENDER_FAILED",
                message: "Admin panel gagal diperbarui.",
            });
        }
    });

    bindEvents({ elements, store, modalController, notificationService });

    // Handle initial navigation based on URL hash
    const handleNavigation = () => {
        const hash = window.location.hash || '#dashboard';
        const targetId = hash.substring(1);
        
        const link = elements.sidebarNav.querySelector(`a[href="${hash}"]`);
        if (link) {
            elements.sidebarNav.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("is-active"));
            link.classList.add("is-active");

            document.querySelectorAll(".dashboard-section").forEach(s => s.hidden = true);
            const section = document.getElementById(targetId);
            if (section) section.hidden = false;

            if (targetId === "orders") {
                loadOrders(elements, store);
            }
        }
    };

    // Check Authentication
    if (authService.isAuthenticated()) {
        elements.loginScreen.style.setProperty("display", "none", "important");
        const refreshResult = await store.refresh();
        if (!refreshResult.ok) {
            handleError(refreshResult.error, {}, { notify: notificationService.show });
        }
        handleNavigation();
    } else {
        elements.loginScreen.style.setProperty("display", "flex", "important");
    }

    window.addEventListener("hashchange", handleNavigation);

    window.addEventListener("storage", (event) => {
        if (event.key === appConfig.inventory.storageKey) {
            void store.refresh();
        }
    });
}

function bootstrap() {
    void initializeAdminApp().catch((error) => {
        handleError(error, {
            category: errorCategory.app,
            code: "ADMIN_BOOTSTRAP_FAILED",
            message: "Admin panel gagal dimuat. Silakan refresh browser.",
        });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
} else {
    bootstrap();
}
