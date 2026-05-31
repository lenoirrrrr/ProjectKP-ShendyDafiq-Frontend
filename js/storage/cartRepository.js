import { appConfig } from "../config/config.js";
import { AppError, errorCategory, handleError } from "../utils/errorHandler.js";
import { sanitizeCartPayload } from "../utils/validation.js";

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

export function createLocalCartRepository(storageService) {
    const storageKey = appConfig.cart.storageKey;

    async function loadCart() {
        try {
            const fallbackCart = createCartPayload();
            const readResult = storageService.getJson(storageKey, fallbackCart);

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
                new AppError({
                    category: errorCategory.storage,
                    code: "CART_LOAD_FAILED",
                    message: "Cart gagal dimuat dan akan direset.",
                    severity: "warn",
                    cause: error,
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

            const writeResult = storageService.setJson(storageKey, cartResult.data);
            return writeResult.ok ? writeResult : result.ok(false, writeResult.meta);
        } catch (error) {
            return result.fail(
                "Cart gagal disimpan.",
                new AppError({
                    category: errorCategory.storage,
                    code: "CART_SAVE_FAILED",
                    message: "Cart gagal disimpan permanen.",
                    severity: "warn",
                    cause: error,
                })
            );
        }
    }

    async function clearCart() {
        try {
            return storageService.remove(storageKey);
        } catch (error) {
            return result.fail(
                "Cart gagal dihapus.",
                new AppError({
                    category: errorCategory.storage,
                    code: "CART_CLEAR_FAILED",
                    message: "Cart gagal dihapus.",
                    severity: "warn",
                    cause: error,
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
export function createFallbackCartRepository(primaryRepository, fallbackRepository) {
    return {
        async loadCart() {
            try {
                const primaryResult = await primaryRepository.loadCart();
                if (primaryResult.ok) return primaryResult;
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
                if (primaryResult.ok) return primaryResult;
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
                if (primaryResult.ok) return primaryResult;
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
