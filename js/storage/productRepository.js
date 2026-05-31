import { appConfig } from "../config/config.js";
import { AppError, errorCategory } from "../utils/errorHandler.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

export function createLocalProductRepository(storageService, seedProducts) {
    const storageKey = appConfig.inventory.storageKey;

    function readProducts() {
        const fallbackPayload = {
            schemaVersion: appConfig.inventory.schemaVersion,
            products: seedProducts.map((p) => {
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
            updatedAt: new Date().toISOString(),
        };

        const readResult = storageService.getJson(storageKey, fallbackPayload);

        if (!readResult.ok) {
            return result.fail(readResult.message, readResult.error, readResult.meta);
        }

        const payload = readResult.data;

        // Seeding database jika belum ada atau skema tidak cocok
        if (!payload || !Array.isArray(payload.products) || payload.schemaVersion !== appConfig.inventory.schemaVersion) {
            storageService.setJson(storageKey, fallbackPayload);
            return result.ok(fallbackPayload.products, { recovered: true, ...readResult.meta });
        }

        return result.ok(payload.products, readResult.meta);
    }

    function writeProducts(products) {
        const payload = {
            schemaVersion: appConfig.inventory.schemaVersion,
            products: products,
            updatedAt: new Date().toISOString(),
        };

        const writeResult = storageService.setJson(storageKey, payload);

        if (!writeResult.ok) {
            return result.fail(writeResult.message, writeResult.error, writeResult.meta);
        }

        return result.ok(products, writeResult.meta);
    }

    return {
        async findAll() {
            try {
                return readProducts();
            } catch (error) {
                return result.fail(
                    "Produk gagal dimuat.",
                    new AppError({
                        category: errorCategory.storage,
                        code: "PRODUCT_READ_FAILED",
                        message: "Produk gagal dimuat.",
                        cause: error,
                    })
                );
            }
        },
        async findById(productId) {
            try {
                const readResult = readProducts();
                if (!readResult.ok) return readResult;

                const product = readResult.data.find((item) => item.id === productId);
                return product ? result.ok(product) : result.fail("Produk tidak ditemukan.");
            } catch (error) {
                return result.fail(
                    "Produk tidak ditemukan.",
                    new AppError({
                        category: errorCategory.storage,
                        code: "PRODUCT_FIND_FAILED",
                        message: "Produk tidak ditemukan.",
                        cause: error,
                    })
                );
            }
        },
        async updateStock(productId, newStock) {
            try {
                const readResult = readProducts();
                if (!readResult.ok) return readResult;

                const nextProducts = readResult.data.map((product) => {
                    if (product.id === productId) {
                        return {
                            ...product,
                            stock: Math.max(0, newStock),
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return product;
                });

                return writeProducts(nextProducts);
            } catch (error) {
                return result.fail("Gagal memperbarui stok.", error);
            }
        },
        async deductStock(items) {
            try {
                const readResult = readProducts();
                if (!readResult.ok) return readResult;

                const nextProducts = readResult.data.map((product) => {
                    const cartItem = items.find((item) => item.id === product.id);
                    if (cartItem) {
                        return {
                            ...product,
                            stock: Math.max(0, product.stock - cartItem.quantity),
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return product;
                });

                return writeProducts(nextProducts);
            } catch (error) {
                return result.fail("Gagal memotong stok.", error);
            }
        }
    };
}
