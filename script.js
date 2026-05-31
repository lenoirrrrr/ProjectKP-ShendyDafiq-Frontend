(() => {
    "use strict";

    const appConfig = Object.freeze({
        locale: "id-ID",
        api: {
            enabled: true,
            baseUrl: "https://projectkp-shendydafiq-backend-production.up.railway.app/api",
            timeoutMs: 8000,
        },
        cart: {
            storageKey: "toko-sembako-ibu-diana:cart:v1",
            schemaVersion: 1,
            currency: "IDR",
            maxQuantityPerItem: 99,
            remoteEnabled: false,
        },
        notification: {
            durationMs: 3200,
        },
    });

    const errorCategory = Object.freeze({
        app: "app",
        api: "api",
        dom: "dom",
        network: "network",
        order: "order",
        storage: "storage",
        validation: "validation",
    });

    const productSeedData = Object.freeze([
        {
            id: "beras-premium-5kg",
            name: "Beras Premium 5kg",
            price: 75000,
            image: "images/beras.jpg",
            imageAlt: "Beras premium kemasan 5 kilogram",
            category: "Kebutuhan pokok",
            isActive: true,
        },
        {
            id: "gula-pasir-gulaku",
            name: "Gula Pasir Gulaku",
            price: 13000,
            image: "images/Gula.jpg",
            imageAlt: "Gula pasir kemasan 1 kilogram",
            category: "Dapur",
            isActive: true,
        },
        {
            id: "minyak-goreng-2l",
            name: "Minyak Goreng 2L",
            price: 28000,
            image: "images/Minyak.jpg",
            imageAlt: "Minyak goreng kemasan 2 liter",
            category: "Dapur",
            isActive: true,
        },
        {
            id: "telur-ayam-10-butir",
            name: "Telur Ayam 10 Butir",
            price: 32000,
            image: "images/Telur.jpg",
            imageAlt: "Telur ayam segar isi 10 butir",
            category: "Segar",
            isActive: true,
        },
        {
            id: "mie-instan-1-dus-40-pcs",
            name: "Mie Instan 1 Dus (40 Pcs)",
            price: 35000,
            image: "images/Mie.jpg",
            imageAlt: "Mie instan satu dus isi 40 pcs",
            category: "Paket hemat",
            isActive: true,
        },
        {
            id: "tepung-terigu-1kg",
            name: "Tepung Terigu 1kg",
            price: 12000,
            image: "images/Tepung.jpg",
            imageAlt: "Tepung terigu kemasan 1 kilogram",
            category: "Bahan masak",
            isActive: true,
        },
    ]);

    const domSelectors = Object.freeze({
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
        toast: '[data-js="toast"]',
        pickupInput: 'input[name="pengambilan"]',
        paymentInput: 'input[name="pembayaran"]',
        anchorLink: 'a[href^="#"]',
    });

    const result = {
        ok(data = null, meta = {}) {
            return { ok: true, data, meta };
        },
        fail(message, error = null, meta = {}) {
            return { ok: false, message, error, meta };
        },
    };

    function createAppError({
        category = errorCategory.app,
        code = "UNKNOWN_ERROR",
        message = "Terjadi kesalahan. Silakan coba lagi.",
        technicalMessage = message,
        severity = "error",
        cause = null,
        details = {},
    }) {
        const error = new Error(technicalMessage);
        error.name = "AppError";
        error.category = category;
        error.code = code;
        error.userMessage = message;
        error.severity = severity;
        error.cause = cause;
        error.details = details;
        return error;
    }

    function normalizeError(error, fallback = {}) {
        if (error?.name === "AppError") {
            return error;
        }

        return createAppError({
            category: fallback.category ?? errorCategory.app,
            code: fallback.code ?? "UNHANDLED_ERROR",
            message: fallback.message ?? "Terjadi kesalahan. Silakan coba lagi.",
            technicalMessage: error?.message ?? "Unhandled error",
            severity: fallback.severity ?? "error",
            cause: error,
            details: fallback.details ?? {},
        });
    }

    function logError(error) {
        const appError = normalizeError(error);
        const label = `[${appError.category}:${appError.code}]`;
        const payload = {
            message: appError.message,
            userMessage: appError.userMessage,
            details: appError.details,
            cause: appError.cause,
        };

        if (appError.severity === "warn") {
            console.warn(label, payload);
            return appError;
        }

        console.error(label, payload);
        return appError;
    }

    function handleError(error, context = {}, options = {}) {
        const appError = logError(
            normalizeError(error, {
                category: context.category,
                code: context.code,
                message: context.message,
                severity: context.severity,
                details: context.details,
            })
        );

        if (typeof options.notify === "function") {
            options.notify(appError.userMessage, appError.severity === "warn" ? "warning" : "error");
        }

        if (typeof options.render === "function") {
            options.render(appError.userMessage);
        }

        return appError;
    }

    function sanitizeInput(value, options = {}) {
        const { maxLength = 255, allowLineBreaks = false } = options;
        const controlCharsPattern = allowLineBreaks ? /[\u0000-\u0008\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
        const whitespacePattern = allowLineBreaks ? /[ \t]+/g : /\s+/g;

        return String(value ?? "")
            .replace(controlCharsPattern, "")
            .replace(whitespacePattern, " ")
            .trim()
            .slice(0, maxLength);
    }

    function showNotification(targetElement, { message, type = "info", durationMs = appConfig.notification.durationMs } = {}) {
        const safeMessage = sanitizeInput(message || "Terjadi kesalahan. Silakan coba lagi.", { maxLength: 220 });

        if (!targetElement) {
            console.warn("[notification:MISSING_TARGET]", { message: safeMessage, type });
            return;
        }

        window.clearTimeout(targetElement.notificationTimer);
        targetElement.textContent = safeMessage;
        targetElement.className = `toast active toast-${type}`;

        targetElement.notificationTimer = window.setTimeout(() => {
            targetElement.classList.remove("active");
        }, durationMs);
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function isValidDateString(value) {
        return typeof value === "string" && !Number.isNaN(Date.parse(value));
    }

    function cloneJson(value) {
        if (value === undefined) {
            return undefined;
        }

        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            handleError(error, {
                category: errorCategory.validation,
                code: "CLONE_FAILED",
                message: "Data gagal diproses.",
                severity: "warn",
            });
            return null;
        }
    }

    function safeJsonParse(value) {
        try {
            return result.ok(JSON.parse(value));
        } catch (error) {
            return result.fail(
                "Data penyimpanan tidak valid.",
                createAppError({
                    category: errorCategory.storage,
                    code: "MALFORMED_JSON",
                    message: "Data tersimpan rusak dan akan direset.",
                    technicalMessage: "Malformed JSON in client storage.",
                    severity: "warn",
                    cause: error,
                })
            );
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat(appConfig.locale, {
            style: "currency",
            currency: appConfig.cart.currency,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function createElement(tagName, options = {}, children = []) {
        const element = document.createElement(tagName);

        if (options.className) {
            element.className = options.className;
        }

        if (options.textContent !== undefined) {
            element.textContent = sanitizeInput(options.textContent, {
                maxLength: options.maxLength ?? 500,
                allowLineBreaks: options.allowLineBreaks ?? false,
            });
        }

        Object.entries(options.attributes ?? {}).forEach(([name, value]) => {
            if (value !== undefined && value !== null) {
                element.setAttribute(name, String(value));
            }
        });

        Object.entries(options.dataset ?? {}).forEach(([name, value]) => {
            if (value !== undefined && value !== null) {
                element.dataset[name] = String(value);
            }
        });

        children.forEach((child) => {
            element.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
        });

        return element;
    }

    function getRequiredElement(selector, root = document) {
        const element = root.querySelector(selector);

        if (!element) {
            throw createAppError({
                category: errorCategory.dom,
                code: "MISSING_DOM_ELEMENT",
                message: "Halaman tidak lengkap. Silakan refresh browser.",
                technicalMessage: `Missing required DOM element: ${selector}`,
                details: { selector },
            });
        }

        return element;
    }

    function getCheckedRadioValue(inputs, fallbackValue = "") {
        const checkedInput = [...inputs].find((input) => input.checked);
        return checkedInput?.value ?? fallbackValue;
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
                toast: getRequiredElement(domSelectors.toast),
                pickupInputs: document.querySelectorAll(domSelectors.pickupInput),
                paymentInputs: document.querySelectorAll(domSelectors.paymentInput),
                anchorLinks: document.querySelectorAll(domSelectors.anchorLink),
            };
        } catch (error) {
            throw normalizeError(error, {
                category: errorCategory.dom,
                code: "DOM_CACHE_FAILED",
                message: "Komponen halaman gagal dimuat.",
            });
        }
    }

    function validatePrice(price) {
        const normalizedPrice = Number(price);

        if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
            return result.fail(
                "Harga produk tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_PRICE",
                    message: "Harga produk tidak valid.",
                    technicalMessage: `Invalid price: ${price}`,
                    severity: "warn",
                })
            );
        }

        return result.ok(normalizedPrice);
    }

    function validateQuantity(quantity) {
        const normalizedQuantity = Number(quantity);

        if (
            !Number.isFinite(normalizedQuantity) ||
            !Number.isInteger(normalizedQuantity) ||
            normalizedQuantity <= 0 ||
            normalizedQuantity > appConfig.cart.maxQuantityPerItem
        ) {
            return result.fail(
                "Jumlah produk tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_QUANTITY",
                    message: "Jumlah produk tidak valid.",
                    technicalMessage: `Invalid quantity: ${quantity}`,
                    severity: "warn",
                })
            );
        }

        return result.ok(normalizedQuantity);
    }

    function validateProduct(product) {
        if (!isPlainObject(product)) {
            return result.fail(
                "Format produk tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_PRODUCT_SCHEMA",
                    message: "Sebagian produk tidak valid dan dilewati.",
                    technicalMessage: "Product is not an object.",
                    severity: "warn",
                })
            );
        }

        const priceResult = validatePrice(product.price);
        let safeImage = sanitizeInput(product.image, { maxLength: 280 });
        if (safeImage.startsWith("../")) {
            safeImage = safeImage.replace("../", "");
        }

        const normalizedProduct = {
            id: sanitizeInput(product.id, { maxLength: 120 }),
            name: sanitizeInput(product.name, { maxLength: 160 }),
            price: priceResult.ok ? priceResult.data : Number.NaN,
            image: safeImage,
            imageAlt: sanitizeInput(product.imageAlt || product.name, { maxLength: 220 }),
            category: sanitizeInput(product.category, { maxLength: 80 }),
            isActive: product.isActive !== false,
            stock: product.stock !== undefined ? Number(product.stock) : 99,
            description: sanitizeInput(product.description || "", { maxLength: 600, allowLineBreaks: true }),
        };

        const missingFields = ["id", "name", "image", "imageAlt", "category"].filter(
            (field) => normalizedProduct[field].length === 0
        );

        if (missingFields.length > 0 || !priceResult.ok) {
            return result.fail(
                "Format produk tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_PRODUCT_SCHEMA",
                    message: "Sebagian produk tidak valid dan dilewati.",
                    technicalMessage: "Product schema validation failed.",
                    severity: "warn",
                    cause: priceResult.error,
                    details: { missingFields, productId: normalizedProduct.id || product.id },
                })
            );
        }

        return result.ok(normalizedProduct);
    }

    function cloneProduct(product) {
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            imageAlt: product.imageAlt,
            category: product.category,
            isActive: Boolean(product.isActive),
            stock: product.stock !== undefined ? Number(product.stock) : 99,
            description: product.description || "",
        };
    }

    function createCartPayload(items = []) {
        return {
            schemaVersion: appConfig.cart.schemaVersion,
            source: "client",
            currency: appConfig.cart.currency,
            items: items.map(cloneCartItem),
            updatedAt: new Date().toISOString(),
        };
    }

    function cloneCartItem(item) {
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            createdAt: item.createdAt,
        };
    }

    function validateCartItem(item) {
        if (!isPlainObject(item)) {
            return result.fail(
                "Format item keranjang tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_CART_ITEM_SCHEMA",
                    message: "Data keranjang tidak valid dan sebagian item dihapus.",
                    technicalMessage: "Cart item is not an object.",
                    severity: "warn",
                })
            );
        }

        const priceResult = validatePrice(item.price);
        const quantityResult = validateQuantity(item.quantity);
        const normalizedItem = {
            id: sanitizeInput(item.id, { maxLength: 120 }),
            name: sanitizeInput(item.name, { maxLength: 160 }),
            price: priceResult.ok ? priceResult.data : Number.NaN,
            quantity: quantityResult.ok ? quantityResult.data : Number.NaN,
            image: sanitizeInput(item.image, { maxLength: 280 }),
            createdAt: isValidDateString(item.createdAt) ? item.createdAt : "",
        };

        const missingFields = ["id", "name", "image", "createdAt"].filter((field) => {
            return String(normalizedItem[field] ?? "").length === 0;
        });

        if (missingFields.length > 0 || !priceResult.ok || !quantityResult.ok) {
            return result.fail(
                "Format item keranjang tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_CART_ITEM_SCHEMA",
                    message: "Data keranjang tidak valid dan sebagian item dihapus.",
                    technicalMessage: "Cart item schema validation failed.",
                    severity: "warn",
                    cause: priceResult.error || quantityResult.error,
                    details: { missingFields, itemId: normalizedItem.id || item.id },
                })
            );
        }

        return result.ok(normalizedItem);
    }

    function normalizeCartItem(item) {
        return {
            id: sanitizeInput(item?.id, { maxLength: 120 }),
            name: sanitizeInput(item?.name, { maxLength: 160 }),
            price: Number(item?.price),
            quantity: Math.trunc(Number(item?.quantity)),
            image: sanitizeInput(item?.image, { maxLength: 280 }),
            createdAt: typeof item?.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        };
    }

    function sanitizeCartPayload(payload) {
        if (!isPlainObject(payload) || !Array.isArray(payload.items)) {
            return result.fail(
                "Format keranjang tidak valid.",
                createAppError({
                    category: errorCategory.validation,
                    code: "INVALID_CART_SCHEMA",
                    message: "Data keranjang tidak valid dan akan direset.",
                    technicalMessage: "Cart payload is not a valid object.",
                    severity: "warn",
                })
            );
        }

        const mergedItems = new Map();
        const droppedItems = [];
        const duplicateItems = [];

        payload.items.forEach((item) => {
            const itemResult = validateCartItem(normalizeCartItem(item));

            if (!itemResult.ok) {
                droppedItems.push(item?.id ?? "unknown");
                handleError(itemResult.error, {
                    category: errorCategory.validation,
                    code: "DROPPED_INVALID_CART_ITEM",
                    message: "Data keranjang tidak valid dan sebagian item dihapus.",
                    severity: "warn",
                });
                return;
            }

            const existingItem = mergedItems.get(itemResult.data.id);

            if (existingItem) {
                duplicateItems.push(itemResult.data.id);
                existingItem.quantity = Math.min(
                    existingItem.quantity + itemResult.data.quantity,
                    appConfig.cart.maxQuantityPerItem
                );
                return;
            }

            mergedItems.set(itemResult.data.id, itemResult.data);
        });

        if (duplicateItems.length > 0) {
            handleError(
                createAppError({
                    category: errorCategory.validation,
                    code: "DUPLICATE_CART_ITEM",
                    message: "Item duplikat di keranjang digabungkan.",
                    technicalMessage: "Duplicate cart items were merged.",
                    severity: "warn",
                    details: { duplicateItems },
                })
            );
        }

        return result.ok(createCartPayload([...mergedItems.values()]), {
            droppedItems,
            duplicateItems,
        });
    }

    async function fetchJsonWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), appConfig.api.timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers ?? {}),
                },
            });

            if (!response.ok) {
                throw createAppError({
                    category: errorCategory.api,
                    code: "API_RESPONSE_ERROR",
                    message: "Server belum bisa memproses permintaan.",
                    technicalMessage: `API request failed with ${response.status}.`,
                    details: { url, status: response.status },
                });
            }

            const responseText = await response.text();

            if (!responseText) {
                return null;
            }

            const parseResult = safeJsonParse(responseText);

            if (!parseResult.ok) {
                throw parseResult.error;
            }

            return parseResult.data;
        } catch (error) {
            if (error?.name === "AbortError") {
                throw createAppError({
                    category: errorCategory.network,
                    code: "NETWORK_TIMEOUT",
                    message: "Koneksi ke server terlalu lama. Menggunakan data sementara.",
                    technicalMessage: `Network timeout: ${url}`,
                    severity: "warn",
                    cause: error,
                });
            }

            throw normalizeError(error, {
                category: errorCategory.network,
                code: "NETWORK_FAILURE",
                message: "Server tidak dapat dihubungi.",
                severity: "warn",
                details: { url },
            });
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    function createLocalProductRepository(products) {
        const storageKey = "toko-sembako-ibu-diana:admin-products:v1";

        return {
            async findAll() {
                try {
                    const raw = window.localStorage.getItem(storageKey);
                    if (!raw) {
                        const seeded = {
                            schemaVersion: 1,
                            products: products.map((p) => {
                                let stock = 20;
                                if (p.id === "beras-premium-5kg") stock = 24;
                                else if (p.id === "gula-pasir-gulaku") stock = 8;
                                else if (p.id === "minyak-goreng-2l") stock = 18;
                                else if (p.id === "telur-ayam-10-butir") stock = 5;
                                else if (p.id === "mie-instan-1-dus-40-pcs") stock = 16;
                                else if (p.id === "tepung-terigu-1kg") stock = 30;

                                return {
                                    id: p.id,
                                    name: p.name,
                                    category: p.category,
                                    price: p.price,
                                    stock: stock,
                                    image: p.image,
                                    description: p.name + " berkualitas tinggi.",
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                };
                            }),
                            updatedAt: new Date().toISOString()
                        };
                        window.localStorage.setItem(storageKey, JSON.stringify(seeded));
                        return seeded.products.map((product) => cloneJson(product));
                    }
                    const parsed = JSON.parse(raw);
                    return (parsed.products || []).map((product) => cloneJson(product));
                } catch (error) {
                    throw normalizeError(error, {
                        category: errorCategory.validation,
                        code: "LOCAL_PRODUCT_READ_FAILED",
                        message: "Produk lokal gagal dimuat.",
                    });
                }
            },
            async findById(productId) {
                try {
                    const safeProductId = sanitizeInput(productId, { maxLength: 120 });
                    const list = await this.findAll();
                    const product = list.find((item) => item.id === safeProductId);
                    return product ? cloneJson(product) : null;
                } catch (error) {
                    throw normalizeError(error, {
                        category: errorCategory.validation,
                        code: "LOCAL_PRODUCT_FIND_FAILED",
                        message: "Produk lokal gagal dicari.",
                    });
                }
            },
        };
    }

    function createApiProductRepository({ baseUrl, getAuthToken = () => null }) {
        async function request(path) {
            try {
                const token = getAuthToken();
                return await fetchJsonWithTimeout(`${baseUrl}${path}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
            } catch (error) {
                throw normalizeError(error, {
                    category: errorCategory.api,
                    code: "PRODUCT_API_FAILED",
                    message: "Produk gagal dimuat dari server.",
                    severity: "warn",
                });
            }
        }

        return {
            findAll() {
                return request("/products");
            },
            findById(productId) {
                return request(`/products/${encodeURIComponent(sanitizeInput(productId, { maxLength: 120 }))}`);
            },
        };
    }

    function createFallbackRepository({ primaryRepository, fallbackRepository, category, code, message }) {
        return {
            async findAll() {
                try {
                    return await primaryRepository.findAll();
                } catch (error) {
                    handleError(error, { category, code, message, severity: "warn" });
                    return fallbackRepository.findAll();
                }
            },
            async findById(id) {
                try {
                    return await primaryRepository.findById(id);
                } catch (error) {
                    handleError(error, { category, code, message, severity: "warn" });
                    return fallbackRepository.findById(id);
                }
            },
        };
    }

    function createProductService(productRepository) {
        let productCache = [];

        async function getProducts() {
            try {
                const products = await productRepository.findAll();

                if (!Array.isArray(products)) {
                    throw createAppError({
                        category: errorCategory.validation,
                        code: "INVALID_PRODUCT_LIST",
                        message: "Daftar produk tidak valid.",
                        technicalMessage: "Product repository did not return an array.",
                        severity: "warn",
                    });
                }

                const validProducts = [];

                products.forEach((product) => {
                    const validation = validateProduct(product);

                    if (!validation.ok) {
                        handleError(validation.error);
                        return;
                    }

                    if (validation.data.isActive) {
                        validProducts.push(validation.data);
                    }
                });

                productCache = validProducts;
                return result.ok(productCache.map(cloneProduct));
            } catch (error) {
                return result.fail(
                    "Produk gagal dimuat.",
                    normalizeError(error, {
                        category: errorCategory.validation,
                        code: "PRODUCT_SERVICE_FAILED",
                        message: "Produk gagal dimuat.",
                    })
                );
            }
        }

        async function getProductById(productId) {
            try {
                const safeProductId = sanitizeInput(productId, { maxLength: 120 });

                if (!safeProductId) {
                    throw createAppError({
                        category: errorCategory.validation,
                        code: "MISSING_PRODUCT_ID",
                        message: "Produk tidak valid.",
                        technicalMessage: "Missing product id.",
                        severity: "warn",
                    });
                }

                if (productCache.length === 0) {
                    const productsResult = await getProducts();

                    if (!productsResult.ok) {
                        throw productsResult.error;
                    }
                }

                const cachedProduct = productCache.find((product) => product.id === safeProductId);

                if (cachedProduct) {
                    return result.ok(cloneProduct(cachedProduct));
                }

                const product = await productRepository.findById(safeProductId);
                const validation = validateProduct(product);

                if (!validation.ok || !validation.data.isActive) {
                    return result.fail("Produk tidak ditemukan.", validation.error);
                }

                return result.ok(cloneProduct(validation.data));
            } catch (error) {
                return result.fail(
                    "Produk tidak ditemukan.",
                    normalizeError(error, {
                        category: errorCategory.validation,
                        code: "PRODUCT_LOOKUP_FAILED",
                        message: "Produk tidak ditemukan.",
                        severity: "warn",
                    })
                );
            }
        }

        return { getProducts, getProductById };
    }

    function createStorageService() {
        const memoryStorage = new Map();
        let localStorageRef = null;

        try {
            const testKey = "__storage_test__";
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            localStorageRef = window.localStorage;
        } catch (error) {
            handleError(error, {
                category: errorCategory.storage,
                code: "LOCAL_STORAGE_UNAVAILABLE",
                message: "Storage browser tidak tersedia. Data cart hanya sementara.",
                severity: "warn",
            });
        }

        function getJson(key, fallbackValue) {
            try {
                if (!localStorageRef) {
                    return result.ok(cloneJson(memoryStorage.get(key) ?? fallbackValue), {
                        storage: "memory",
                        persistent: false,
                    });
                }

                const rawValue = localStorageRef.getItem(key);

                if (!rawValue) {
                    return result.ok(cloneJson(fallbackValue), {
                        storage: "localStorage",
                        persistent: true,
                    });
                }

                const parseResult = safeJsonParse(rawValue);

                if (!parseResult.ok) {
                    handleError(parseResult.error);
                    localStorageRef.removeItem(key);
                    return result.ok(cloneJson(fallbackValue), {
                        storage: "localStorage",
                        persistent: true,
                        recovered: true,
                    });
                }

                return result.ok(parseResult.data, {
                    storage: "localStorage",
                    persistent: true,
                });
            } catch (error) {
                return result.fail(
                    "Storage gagal dibaca.",
                    normalizeError(error, {
                        category: errorCategory.storage,
                        code: "STORAGE_READ_FAILED",
                        message: "Data cart gagal dibaca.",
                        severity: "warn",
                    })
                );
            }
        }

        function setJson(key, value) {
            try {
                const safeValue = cloneJson(value);

                if (!localStorageRef) {
                    memoryStorage.set(key, safeValue);
                    return result.ok(false, { storage: "memory", persistent: false });
                }

                localStorageRef.setItem(key, JSON.stringify(safeValue));
                return result.ok(true, { storage: "localStorage", persistent: true });
            } catch (error) {
                const appError = normalizeError(error, {
                    category: errorCategory.storage,
                    code: "STORAGE_WRITE_FAILED",
                    message: "Data cart gagal disimpan permanen.",
                    severity: "warn",
                });
                handleError(appError);
                memoryStorage.set(key, cloneJson(value));
                return result.fail(appError.userMessage, appError, {
                    storage: "memory",
                    persistent: false,
                    fallbackUsed: true,
                });
            }
        }

        function remove(key) {
            try {
                memoryStorage.delete(key);

                if (!localStorageRef) {
                    return result.ok(false, { storage: "memory", persistent: false });
                }

                localStorageRef.removeItem(key);
                return result.ok(true, { storage: "localStorage", persistent: true });
            } catch (error) {
                return result.fail(
                    "Storage gagal dihapus.",
                    normalizeError(error, {
                        category: errorCategory.storage,
                        code: "STORAGE_REMOVE_FAILED",
                        message: "Data cart gagal dihapus.",
                        severity: "warn",
                    })
                );
            }
        }

        return {
            kind: localStorageRef ? "localStorage" : "memory",
            isPersistent: Boolean(localStorageRef),
            getJson,
            setJson,
            remove,
        };
    }

    function createLocalCartRepository(storageService) {
        async function loadCart() {
            try {
                const fallbackCart = createCartPayload();
                const readResult = storageService.getJson(appConfig.cart.storageKey, fallbackCart);

                if (!readResult.ok) {
                    throw readResult.error;
                }

                const storedCart = readResult.data;
                const cartResult = sanitizeCartPayload(storedCart);

                if (!cartResult.ok || storedCart.schemaVersion !== appConfig.cart.schemaVersion) {
                    await clearCart();
                    return result.ok(fallbackCart, { recovered: true, ...readResult.meta });
                }

                if (
                    cartResult.meta.droppedItems.length > 0 ||
                    cartResult.meta.duplicateItems.length > 0 ||
                    storedCart.items.length !== cartResult.data.items.length
                ) {
                    await saveCart(cartResult.data);
                }

                return result.ok(cartResult.data, readResult.meta);
            } catch (error) {
                return result.fail(
                    "Cart gagal dimuat.",
                    normalizeError(error, {
                        category: errorCategory.storage,
                        code: "CART_LOAD_FAILED",
                        message: "Cart gagal dimuat dan akan direset.",
                        severity: "warn",
                    })
                );
            }
        }

        async function saveCart(cartPayload) {
            try {
                const cartResult = sanitizeCartPayload(cartPayload);

                if (!cartResult.ok) {
                    throw cartResult.error;
                }

                const writeResult = storageService.setJson(appConfig.cart.storageKey, cartResult.data);
                return writeResult.ok ? writeResult : result.ok(false, writeResult.meta);
            } catch (error) {
                return result.fail(
                    "Cart gagal disimpan.",
                    normalizeError(error, {
                        category: errorCategory.storage,
                        code: "CART_SAVE_FAILED",
                        message: "Cart gagal disimpan permanen.",
                        severity: "warn",
                    })
                );
            }
        }

        async function clearCart() {
            try {
                return storageService.remove(appConfig.cart.storageKey);
            } catch (error) {
                return result.fail(
                    "Cart gagal dihapus.",
                    normalizeError(error, {
                        category: errorCategory.storage,
                        code: "CART_CLEAR_FAILED",
                        message: "Cart gagal dihapus.",
                        severity: "warn",
                    })
                );
            }
        }

        return {
            loadCart,
            saveCart,
            clearCart,
            storageInfo: {
                kind: storageService.kind,
                isPersistent: storageService.isPersistent,
            },
        };
    }

    function createApiCartRepository({ baseUrl, getAuthToken = () => null }) {
        function getHeaders() {
            const token = getAuthToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
        }

        return {
            async loadCart() {
                try {
                    const data = await fetchJsonWithTimeout(`${baseUrl}/cart`, { headers: getHeaders() });
                    const cartResult = sanitizeCartPayload(data);

                    if (!cartResult.ok) {
                        throw cartResult.error;
                    }

                    return result.ok(cartResult.data, { storage: "api", persistent: true });
                } catch (error) {
                    return result.fail(
                        "Cart gagal dimuat dari server.",
                        normalizeError(error, {
                            category: errorCategory.api,
                            code: "API_CART_LOAD_FAILED",
                            message: "Cart gagal dimuat dari server.",
                            severity: "warn",
                        })
                    );
                }
            },
            async saveCart(cartPayload) {
                try {
                    const cartResult = sanitizeCartPayload(cartPayload);

                    if (!cartResult.ok) {
                        throw cartResult.error;
                    }

                    await fetchJsonWithTimeout(`${baseUrl}/cart`, {
                        method: "PUT",
                        headers: getHeaders(),
                        body: JSON.stringify(cartResult.data),
                    });
                    return result.ok(true, { storage: "api", persistent: true });
                } catch (error) {
                    return result.fail(
                        "Cart gagal disimpan ke server.",
                        normalizeError(error, {
                            category: errorCategory.api,
                            code: "API_CART_SAVE_FAILED",
                            message: "Cart gagal disimpan ke server.",
                            severity: "warn",
                        })
                    );
                }
            },
            async clearCart() {
                try {
                    await fetchJsonWithTimeout(`${baseUrl}/cart`, {
                        method: "DELETE",
                        headers: getHeaders(),
                    });
                    return result.ok(true, { storage: "api", persistent: true });
                } catch (error) {
                    return result.fail(
                        "Cart gagal dihapus dari server.",
                        normalizeError(error, {
                            category: errorCategory.api,
                            code: "API_CART_CLEAR_FAILED",
                            message: "Cart gagal dihapus dari server.",
                            severity: "warn",
                        })
                    );
                }
            },
            storageInfo: {
                kind: "api",
                isPersistent: true,
            },
        };
    }

    function createFallbackCartRepository(primaryRepository, fallbackRepository) {
        return {
            async loadCart() {
                try {
                    const primaryResult = await primaryRepository.loadCart();

                    if (primaryResult.ok) {
                        return primaryResult;
                    }

                    throw primaryResult.error;
                } catch (error) {
                    handleError(error, {
                        category: errorCategory.api,
                        code: "CART_PRIMARY_FALLBACK",
                        message: "Cart server gagal, memakai storage browser.",
                        severity: "warn",
                    });
                    return fallbackRepository.loadCart();
                }
            },
            async saveCart(cartPayload) {
                try {
                    const primaryResult = await primaryRepository.saveCart(cartPayload);

                    if (primaryResult.ok) {
                        return primaryResult;
                    }

                    throw primaryResult.error;
                } catch (error) {
                    handleError(error, {
                        category: errorCategory.api,
                        code: "CART_SAVE_FALLBACK",
                        message: "Cart server gagal disimpan, memakai storage browser.",
                        severity: "warn",
                    });
                    return fallbackRepository.saveCart(cartPayload);
                }
            },
            async clearCart() {
                try {
                    const primaryResult = await primaryRepository.clearCart();

                    if (primaryResult.ok) {
                        return primaryResult;
                    }

                    throw primaryResult.error;
                } catch (error) {
                    handleError(error, {
                        category: errorCategory.api,
                        code: "CART_CLEAR_FALLBACK",
                        message: "Cart server gagal dihapus, memakai storage browser.",
                        severity: "warn",
                    });
                    return fallbackRepository.clearCart();
                }
            },
            storageInfo: {
                kind: "api+fallback",
                isPersistent: true,
            },
        };
    }

    function createCartStore(cartRepository) {
        let cartState = createCartPayload();
        const subscribers = new Set();

        function getSnapshot() {
            return cloneJson(cartState) ?? createCartPayload();
        }

        function notify(meta = {}) {
            const snapshot = getSnapshot();
            subscribers.forEach((subscriber) => {
                try {
                    subscriber({ cart: snapshot, meta });
                } catch (error) {
                    handleError(error, {
                        category: errorCategory.app,
                        code: "CART_SUBSCRIBER_FAILED",
                        message: "UI cart gagal diperbarui.",
                        severity: "warn",
                    });
                }
            });
        }

        async function initialize() {
            try {
                const loadResult = await cartRepository.loadCart();

                if (!loadResult.ok) {
                    throw loadResult.error;
                }

                cartState = loadResult.data;
                notify({ type: "init", ...loadResult.meta });
                return result.ok(getSnapshot(), loadResult.meta);
            } catch (error) {
                cartState = createCartPayload();
                const appError = normalizeError(error, {
                    category: errorCategory.storage,
                    code: "CART_STORE_INIT_FAILED",
                    message: "Cart gagal dimuat dan direset.",
                    severity: "warn",
                });
                handleError(appError);
                notify({ type: "init:error", error: appError, persistent: false });
                return result.fail(appError.userMessage, appError);
            }
        }

        async function setCart(nextCartPayload) {
            try {
                const cartResult = sanitizeCartPayload(nextCartPayload);

                if (!cartResult.ok) {
                    throw cartResult.error;
                }

                cartState = cartResult.data;
                const persistenceResult =
                    cartState.items.length > 0
                        ? await cartRepository.saveCart(cartState)
                        : await cartRepository.clearCart();

                if (!persistenceResult.ok) {
                    handleError(persistenceResult.error, {
                        category: errorCategory.storage,
                        code: "CART_PERSISTENCE_FAILED",
                        message: "Cart tersimpan sementara saja.",
                        severity: "warn",
                    });
                }

                notify({
                    type: "change",
                    persisted: persistenceResult.ok && persistenceResult.meta.persistent !== false,
                    ...persistenceResult.meta,
                });

                return result.ok(getSnapshot(), persistenceResult.meta);
            } catch (error) {
                const appError = normalizeError(error, {
                    category: errorCategory.validation,
                    code: "CART_STATE_REJECTED",
                    message: "Perubahan cart tidak valid.",
                    severity: "warn",
                });
                handleError(appError);
                notify({ type: "change:error", error: appError });
                return result.fail(appError.userMessage, appError);
            }
        }

        function subscribe(callback) {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        }

        return { initialize, getSnapshot, setCart, subscribe };
    }

    function createCartService({ cartStore, productService }) {
        function getItems() {
            return cartStore.getSnapshot().items.map(cloneCartItem);
        }

        function getItemCount() {
            return getItems().reduce((total, item) => total + item.quantity, 0);
        }

        function getTotal() {
            return getItems().reduce((total, item) => total + item.price * item.quantity, 0);
        }

        function createCartItemFromProduct(product) {
            return {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image,
                createdAt: new Date().toISOString(),
            };
        }

        async function initialize() {
            try {
                return await cartStore.initialize();
            } catch (error) {
                return result.fail("Cart gagal dimuat.", normalizeError(error));
            }
        }

        async function addProduct(productId) {
            try {
                const productResult = await productService.getProductById(productId);

                if (!productResult.ok) {
                    throw productResult.error;
                }

                const candidateItem = createCartItemFromProduct(productResult.data);
                const candidateResult = validateCartItem(candidateItem);

                if (!candidateResult.ok) {
                    throw candidateResult.error;
                }

                const items = getItems();
                const existingItem = items.find((item) => item.id === candidateResult.data.id);
                
                const currentQty = existingItem ? existingItem.quantity : 0;
                const product = productResult.data;
                if (product.stock !== undefined && currentQty >= product.stock) {
                    return result.fail(
                        "Stok produk tidak mencukupi.",
                        createAppError({
                            category: errorCategory.validation,
                            code: "OUT_OF_STOCK",
                            message: "Stok produk tidak mencukupi untuk ditambah.",
                            severity: "warn"
                        })
                    );
                }

                const duplicate = Boolean(existingItem);

                if (existingItem) {
                    existingItem.quantity = Math.min(
                        existingItem.quantity + 1,
                        appConfig.cart.maxQuantityPerItem
                    );
                } else {
                    items.push(candidateResult.data);
                }

                const updateResult = await cartStore.setCart(createCartPayload(items));

                if (!updateResult.ok) {
                    throw updateResult.error;
                }

                return result.ok(candidateResult.data, { duplicate });
            } catch (error) {
                const appError = normalizeError(error, {
                    category: errorCategory.validation,
                    code: "ADD_TO_CART_FAILED",
                    message: "Produk gagal ditambahkan.",
                    severity: "warn",
                });
                return result.fail(appError.userMessage, appError);
            }
        }

        async function increaseItem(itemId) {
            try {
                const safeItemId = sanitizeInput(itemId, { maxLength: 120 });
                const items = getItems();
                const item = items.find((cartItem) => cartItem.id === safeItemId);

                if (!item) {
                    throw createAppError({
                        category: errorCategory.validation,
                        code: "CART_ITEM_NOT_FOUND",
                        message: "Item cart tidak ditemukan.",
                        technicalMessage: `Cart item not found: ${safeItemId}`,
                        severity: "warn",
                    });
                }

                const productResult = await productService.getProductById(itemId);
                if (productResult.ok && productResult.data.stock !== undefined) {
                    if (item.quantity >= productResult.data.stock) {
                        return result.fail(
                            "Stok produk tidak mencukupi.",
                            createAppError({
                                category: errorCategory.validation,
                                code: "OUT_OF_STOCK",
                                message: "Stok produk tidak mencukupi untuk ditambah.",
                                severity: "warn"
                            })
                        );
                    }
                }

                const quantityResult = validateQuantity(item.quantity + 1);

                if (!quantityResult.ok) {
                    throw quantityResult.error;
                }

                item.quantity = quantityResult.data;
                return await cartStore.setCart(createCartPayload(items));
            } catch (error) {
                return result.fail("Jumlah gagal ditambah.", normalizeError(error));
            }
        }

        async function decreaseItem(itemId) {
            try {
                const safeItemId = sanitizeInput(itemId, { maxLength: 120 });
                const items = getItems()
                    .map((item) => (item.id === safeItemId ? { ...item, quantity: item.quantity - 1 } : item))
                    .filter((item) => item.quantity > 0);

                return await cartStore.setCart(createCartPayload(items));
            } catch (error) {
                return result.fail("Jumlah gagal dikurangi.", normalizeError(error));
            }
        }

        async function removeItem(itemId) {
            try {
                const safeItemId = sanitizeInput(itemId, { maxLength: 120 });
                return await cartStore.setCart(createCartPayload(getItems().filter((item) => item.id !== safeItemId)));
            } catch (error) {
                return result.fail("Item gagal dihapus.", normalizeError(error));
            }
        }

        async function clearItems() {
            try {
                return await cartStore.setCart(createCartPayload());
            } catch (error) {
                return result.fail("Cart gagal dikosongkan.", normalizeError(error));
            }
        }

        return {
            initialize,
            subscribe: cartStore.subscribe,
            addProduct,
            increaseItem,
            decreaseItem,
            removeItem,
            clearItems,
            getItems,
            getItemCount,
            getTotal,
        };
    }

    function createOrderService({ cartService }) {
        function createCheckoutDraft({ pickupMethod, paymentMethod, address }) {
            const items = cartService.getItems();
            const safePickupMethod = sanitizeInput(pickupMethod, { maxLength: 24 });
            const safePaymentMethod = sanitizeInput(paymentMethod, { maxLength: 24 });
            const safeAddress = sanitizeInput(address, { maxLength: 500, allowLineBreaks: true });

            if (items.length === 0) {
                return result.fail(
                    "Keranjang masih kosong.",
                    createAppError({
                        category: errorCategory.order,
                        code: "EMPTY_CART",
                        message: "Keranjang masih kosong.",
                        technicalMessage: "Checkout attempted with empty cart.",
                        severity: "warn",
                    })
                );
            }

            if (!["takeaway", "delivery"].includes(safePickupMethod)) {
                return result.fail(
                    "Metode pengambilan tidak valid.",
                    createAppError({
                        category: errorCategory.validation,
                        code: "INVALID_PICKUP_METHOD",
                        message: "Metode pengambilan tidak valid.",
                        severity: "warn",
                    })
                );
            }

            if (!["qris", "transfer"].includes(safePaymentMethod)) {
                return result.fail(
                    "Metode pembayaran tidak valid.",
                    createAppError({
                        category: errorCategory.validation,
                        code: "INVALID_PAYMENT_METHOD",
                        message: "Metode pembayaran tidak valid.",
                        severity: "warn",
                    })
                );
            }

            if (safePickupMethod === "delivery" && safeAddress.length === 0) {
                return result.fail(
                    "Alamat pengiriman perlu diisi.",
                    createAppError({
                        category: errorCategory.validation,
                        code: "MISSING_DELIVERY_ADDRESS",
                        message: "Alamat pengiriman perlu diisi.",
                        severity: "warn",
                    })
                );
            }

            return result.ok({
                items,
                pickupMethod: safePickupMethod,
                paymentMethod: safePaymentMethod,
                address: safePickupMethod === "delivery" ? safeAddress : "",
                totalAmount: cartService.getTotal(),
                currency: appConfig.cart.currency,
                createdAt: new Date().toISOString(),
            });
        }

        async function submitCheckout(formData) {
            try {
                return createCheckoutDraft(formData);
            } catch (error) {
                return result.fail(
                    "Pesanan gagal dibuat.",
                    normalizeError(error, {
                        category: errorCategory.order,
                        code: "ORDER_SUBMIT_FAILED",
                        message: "Pesanan gagal dibuat.",
                    })
                );
            }
        }

        return { submitCheckout };
    }

    function createProductRenderer() {
        function renderState(container, message, type = "info") {
            container.replaceChildren(
                createElement("p", {
                    className: `state-message state-${type}`,
                    textContent: message,
                })
            );
        }

        function createProductCard(product) {
            let imageSrc = product.image;
            if (imageSrc && imageSrc.startsWith("../")) {
                imageSrc = imageSrc.replace("../", "");
            }

            const productImage = createElement("div", { className: "product-image" }, [
                createElement("img", {
                    attributes: {
                        src: imageSrc,
                        alt: product.imageAlt || product.name,
                        loading: "lazy",
                        decoding: "async",
                    },
                }),
            ]);

            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 10;
            
            let stockBadgeText = `Stok: ${product.stock}`;
            let stockClass = "stock-status-ok";
            if (isOutOfStock) {
                stockBadgeText = "Stok Habis";
                stockClass = "stock-status-empty";
            } else if (isLowStock) {
                stockBadgeText = `Stok Menipis (${product.stock})`;
                stockClass = "stock-status-low";
            }

            const stockBadge = createElement("span", {
                className: `product-stock-badge ${stockClass}`,
                textContent: stockBadgeText
            });

            const productInfo = createElement("div", { className: "product-info" }, [
                createElement("div", { className: "product-meta-row" }, [
                    createElement("span", { className: "product-tag", textContent: product.category }),
                    stockBadge
                ]),
                createElement("h3", { className: "product-name", textContent: product.name }),
                createElement("p", { className: "product-price", textContent: formatCurrency(product.price) }),
                createElement("button", {
                    className: `btn btn-order ${isOutOfStock ? "disabled" : ""}`,
                    textContent: isOutOfStock ? "Habis" : "Pesan",
                    attributes: { 
                        type: "button",
                        ...(isOutOfStock ? { disabled: "true" } : {})
                    },
                    dataset: {
                        action: "add-to-cart",
                        productId: product.id,
                    },
                }),
            ]);

            return createElement("article", { className: "product-card" }, [productImage, productInfo]);
        }

        function renderProducts(container, products) {
            if (!Array.isArray(products) || products.length === 0) {
                renderState(container, "Produk belum tersedia.", "warning");
                return;
            }

            const fragment = document.createDocumentFragment();
            products.forEach((product) => {
                fragment.appendChild(createProductCard(product));
            });

            container.replaceChildren(fragment);
        }

        return {
            renderLoading(container) {
                renderState(container, "Memuat produk...", "info");
            },
            renderError(container, message = "Produk gagal dimuat.") {
                renderState(container, message, "error");
            },
            renderProducts,
        };
    }

    function createCartRenderer({ elements }) {
        function updateCartBadge(count) {
            const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
            elements.cartBadge.textContent = safeCount;
            elements.cartBadge.classList.toggle("is-empty", safeCount === 0);
            elements.cartBtn.setAttribute("aria-label", `Buka keranjang, ${safeCount} item`);
        }

        function renderCartItems(items) {
            elements.cartItems.replaceChildren();

            if (!Array.isArray(items) || items.length === 0) {
                elements.cartItems.appendChild(
                    createElement("p", {
                        className: "cart-empty",
                        textContent: "Keranjang kosong.",
                    })
                );
                return;
            }

            items.forEach((item) => {
                const itemImage = createElement("img", {
                    className: "cart-item-image",
                    attributes: {
                        src: item.image,
                        alt: item.name,
                        loading: "lazy",
                    },
                });

                const itemInfo = createElement("div", {}, [
                    createElement("p", { className: "cart-item-name", textContent: item.name }),
                    createElement("p", {
                        className: "cart-item-price",
                        textContent: `${formatCurrency(item.price)} x ${item.quantity}`,
                    }),
                ]);

                const cartActions = createElement("div", { className: "cart-actions" }, [
                    createElement("button", {
                        className: "qty-btn",
                        textContent: "-",
                        attributes: { type: "button", "aria-label": `Kurangi ${item.name}` },
                        dataset: { action: "decrease", itemId: item.id },
                    }),
                    createElement("span", { className: "cart-qty", textContent: item.quantity }),
                    createElement("button", {
                        className: "qty-btn",
                        textContent: "+",
                        attributes: { type: "button", "aria-label": `Tambah ${item.name}` },
                        dataset: { action: "increase", itemId: item.id },
                    }),
                    createElement("button", {
                        className: "remove-btn",
                        textContent: "x",
                        attributes: { type: "button", "aria-label": `Hapus ${item.name}` },
                        dataset: { action: "remove", itemId: item.id },
                    }),
                ]);

                elements.cartItems.appendChild(
                    createElement("div", { className: "cart-item" }, [itemImage, itemInfo, cartActions])
                );
            });
        }

        function renderSummary(cartService) {
            renderCartItems(cartService.getItems());
            elements.totalPrice.textContent = formatCurrency(cartService.getTotal());
            updateCartBadge(cartService.getItemCount());
        }

        return { updateCartBadge, renderCartItems, renderSummary };
    }

    function createNotificationService(toastElement) {
        return {
            show(message, type = "info") {
                showNotification(toastElement, { message, type });
            },
            success(message) {
                showNotification(toastElement, { message, type: "success" });
            },
            warning(message) {
                showNotification(toastElement, { message, type: "warning" });
            },
            error(message) {
                showNotification(toastElement, { message, type: "error" });
            },
        };
    }

    function createModalController({ elements }) {
        function isOpen() {
            return elements.checkoutModal.classList.contains("active");
        }

        function open() {
            elements.checkoutModal.hidden = false;
            elements.modalOverlay.hidden = false;
            elements.checkoutModal.classList.add("active");
            elements.modalOverlay.classList.add("active");
            elements.checkoutModal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
            elements.modalCloseBtn.focus();
        }

        function close() {
            elements.checkoutModal.classList.remove("active");
            elements.modalOverlay.classList.remove("active");
            elements.checkoutModal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("modal-open");
            elements.checkoutModal.hidden = true;
            elements.modalOverlay.hidden = true;
        }

        function updateDeliveryOptions() {
            const pickupMethod = getCheckedRadioValue(elements.pickupInputs, "takeaway");
            const isDelivery = pickupMethod === "delivery";
            elements.deliveryAddressSection.hidden = !isDelivery;

            if (!isDelivery) {
                elements.deliveryAddress.value = "";
            }
        }

        function getCheckoutFormData() {
            return {
                pickupMethod: getCheckedRadioValue(elements.pickupInputs, "takeaway"),
                paymentMethod: getCheckedRadioValue(elements.paymentInputs, "qris"),
                address: elements.deliveryAddress.value,
            };
        }

        return { isOpen, open, close, updateDeliveryOptions, getCheckoutFormData };
    }

    function createErrorBoundary({ productRenderer, elements, notificationService }) {
        async function run(scope, task) {
            try {
                return await task();
            } catch (error) {
                handleError(
                    error,
                    {
                        category: errorCategory.app,
                        code: "ERROR_BOUNDARY",
                        message: "Terjadi kesalahan. Silakan coba lagi.",
                        details: { scope },
                    },
                    {
                        notify: notificationService.show,
                        render:
                            scope === "app:init"
                                ? (message) => productRenderer.renderError(elements.productsGrid, message)
                                : null,
                    }
                );
                return null;
            }
        }

        return { run };
    }

    function renderFatalError(message) {
        const fallback = createElement("div", {
            className: "app-fatal",
            textContent: message,
        });

        document.body.prepend(fallback);
    }

    function getEventTargetElement(event) {
        return event.target instanceof Element ? event.target : null;
    }

    async function deductStock(items) {
        try {
            const key = "toko-sembako-ibu-diana:admin-products:v1";
            const raw = window.localStorage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.products)) return;

            parsed.products = parsed.products.map(product => {
                const cartItem = items.find(item => item.id === product.id);
                if (cartItem) {
                    product.stock = Math.max(0, product.stock - cartItem.quantity);
                    product.updatedAt = new Date().toISOString();
                }
                return product;
            });
            parsed.updatedAt = new Date().toISOString();
            window.localStorage.setItem(key, JSON.stringify(parsed));
        } catch (e) {
            console.error("Gagal mengurangi stok", e);
        }
    }

    function bindAppEvents({
        elements,
        cartService,
        orderService,
        cartRenderer,
        modalController,
        notificationService,
        errorBoundary,
        productService,
        productRenderer,
    }) {
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
        elements.modalOverlay.addEventListener("click", modalController.close);

        elements.cartItems.addEventListener("click", (event) => {
            const target = getEventTargetElement(event);
            const button = target?.closest("button[data-action]");

            if (!button) {
                return;
            }

            void errorBoundary.run("cart:item-action", async () => {
                const { action, itemId } = button.dataset;
                let actionResult = result.ok();

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

                // Deduct stock in localStorage
                await deductStock(orderResult.data.items);

                const clearResult = await cartService.clearItems();

                if (!clearResult.ok) {
                    handleError(clearResult.error, {}, { notify: notificationService.show });
                    return;
                }

                modalController.close();
                notificationService.success(
                    `Pesanan berhasil dibuat. Total ${formatCurrency(orderResult.data.totalAmount)}.`
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
    }

    async function initializeApp() {
        const elements = cacheDomElements();
        const notificationService = createNotificationService(elements.toast);
        const storageService = createStorageService();
        const localProductRepository = createLocalProductRepository(productSeedData);
        const apiProductRepository = createApiProductRepository({ baseUrl: appConfig.api.baseUrl });
        const productRepository = appConfig.api.enabled
            ? createFallbackRepository({
                  primaryRepository: apiProductRepository,
                  fallbackRepository: localProductRepository,
                  category: errorCategory.api,
                  code: "PRODUCT_API_FALLBACK",
                  message: "Produk server gagal, memakai data lokal.",
              })
            : localProductRepository;
        const productService = createProductService(productRepository);
        const localCartRepository = createLocalCartRepository(storageService);
        const apiCartRepository = createApiCartRepository({ baseUrl: appConfig.api.baseUrl });
        const cartRepository =
            appConfig.cart.remoteEnabled && appConfig.api.enabled
                ? createFallbackCartRepository(apiCartRepository, localCartRepository)
                : localCartRepository;
        const cartStore = createCartStore(cartRepository);
        const cartService = createCartService({ cartStore, productService });
        const orderService = createOrderService({ cartService });
        const productRenderer = createProductRenderer();
        const cartRenderer = createCartRenderer({ elements });
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

        bindAppEvents({
            elements,
            cartService,
            orderService,
            cartRenderer,
            modalController,
            notificationService,
            errorBoundary,
            productService,
            productRenderer,
        });

        window.addEventListener("storage", (event) => {
            if (event.key === "toko-sembako-ibu-diana:admin-products:v1") {
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
            renderFatalError(appError.userMessage);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }
})();
