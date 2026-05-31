import { appConfig } from "../config/config.js";
import { AppError, errorCategory, handleError } from "../utils/errorHandler.js";
import { validateCartItem, validateQuantity } from "../utils/validation.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

function createCartPayload(items = []) {
    return {
        schemaVersion: appConfig.cart.schemaVersion,
        source: "client",
        currency: appConfig.cart.currency,
        items: items,
        updatedAt: new Date().toISOString(),
    };
}

export function createCartStore(cartRepository) {
    let cartState = createCartPayload();
    const subscribers = new Set();

    function getSnapshot() {
        return JSON.parse(JSON.stringify(cartState)) ?? createCartPayload();
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
            const appError = new AppError({
                category: errorCategory.storage,
                code: "CART_STORE_INIT_FAILED",
                message: "Cart gagal dimuat dan direset.",
                severity: "warn",
                cause: error,
            });
            handleError(appError);
            notify({ type: "init:error", error: appError, persistent: false });
            return result.fail(appError.userMessage, appError);
        }
    }

    async function setCart(nextCartPayload) {
        try {
            cartState = nextCartPayload;
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
            const appError = new AppError({
                category: errorCategory.validation,
                code: "CART_STATE_REJECTED",
                message: "Perubahan cart tidak valid.",
                severity: "warn",
                cause: error,
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

export function createCartService({ cartStore, productService }) {
    function getItems() {
        return cartStore.getSnapshot().items;
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
            return result.fail("Cart gagal dimuat.", error);
        }
    }

    async function addProduct(productId) {
        try {
            const productResult = await productService.getProductById(productId);

            if (!productResult.ok) {
                throw productResult.error;
            }

            const product = productResult.data;

            const items = getItems();
            const existingItem = items.find((item) => item.id === product.id);
            const currentQty = existingItem ? existingItem.quantity : 0;

            // Defensive Stock Limit Check
            if (product.stock !== undefined && currentQty >= product.stock) {
                return result.fail(
                    "Stok produk tidak mencukupi.",
                    new AppError({
                        category: errorCategory.validation,
                        code: "OUT_OF_STOCK",
                        message: "Stok produk tidak mencukupi untuk ditambah.",
                        severity: "warn",
                    })
                );
            }

            const candidateItem = createCartItemFromProduct(product);
            const candidateResult = validateCartItem(candidateItem);

            if (!candidateResult.ok) {
                throw candidateResult.error;
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
            const appError = new AppError({
                category: errorCategory.validation,
                code: "ADD_TO_CART_FAILED",
                message: "Produk gagal ditambahkan.",
                severity: "warn",
                cause: error,
            });
            return result.fail(appError.userMessage, appError);
        }
    }

    async function increaseItem(itemId) {
        try {
            const items = getItems();
            const item = items.find((cartItem) => cartItem.id === itemId);

            if (!item) {
                throw new AppError({
                    category: errorCategory.validation,
                    code: "CART_ITEM_NOT_FOUND",
                    message: "Item cart tidak ditemukan.",
                    technicalMessage: `Cart item not found: ${itemId}`,
                    severity: "warn",
                });
            }

            const productResult = await productService.getProductById(itemId);
            
            // Defensive Stock Limit Check
            if (productResult.ok && productResult.data.stock !== undefined) {
                if (item.quantity >= productResult.data.stock) {
                    return result.fail(
                        "Stok produk tidak mencukupi.",
                        new AppError({
                            category: errorCategory.validation,
                            code: "OUT_OF_STOCK",
                            message: "Stok produk tidak mencukupi untuk ditambah.",
                            severity: "warn",
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
            return result.fail("Jumlah gagal ditambah.", error);
        }
    }

    async function decreaseItem(itemId) {
        try {
            const items = getItems()
                .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0);

            return await cartStore.setCart(createCartPayload(items));
        } catch (error) {
            return result.fail("Jumlah gagal dikurangi.", error);
        }
    }

    async function removeItem(itemId) {
        try {
            return await cartStore.setCart(createCartPayload(getItems().filter((item) => item.id !== itemId)));
        } catch (error) {
            return result.fail("Item gagal dihapus.", error);
        }
    }

    async function clearItems() {
        try {
            return await cartStore.setCart(createCartPayload());
        } catch (error) {
            return result.fail("Cart gagal dikosongkan.", error);
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
