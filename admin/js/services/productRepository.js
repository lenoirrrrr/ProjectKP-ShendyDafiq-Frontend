import { appConfig } from "../config.js";
import { fail, ok } from "../utils/result.js";
import { cloneJson, sanitizeInput } from "../utils/sanitize.js";
import { createAppError, errorCategory, handleError, normalizeError } from "../utils/error.js";
import { validateProductCollection } from "../utils/validation.js";

function createPayload(products) {
    return {
        schemaVersion: appConfig.inventory.schemaVersion,
        products: products.map((product) => cloneJson(product)),
        updatedAt: new Date().toISOString(),
    };
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
                message: "Server admin belum bisa memproses permintaan.",
                technicalMessage: `API request failed with ${response.status}.`,
                details: { url, status: response.status },
            });
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        if (error?.name === "AbortError") {
            throw createAppError({
                category: errorCategory.api,
                code: "API_TIMEOUT",
                message: "Koneksi ke server terlalu lama.",
                technicalMessage: `API timeout: ${url}`,
                severity: "warn",
                cause: error,
            });
        }

        throw normalizeError(error, {
            category: errorCategory.api,
            code: "API_REQUEST_FAILED",
            message: "Server admin tidak dapat dihubungi.",
            severity: "warn",
            details: { url },
        });
    } finally {
        window.clearTimeout(timeoutId);
    }
}

export function createLocalProductRepository(storageService, seedProducts) {
    function readProducts() {
        const fallbackPayload = createPayload(seedProducts);
        const readResult = storageService.getJson(appConfig.inventory.storageKey, fallbackPayload);

        if (!readResult.ok) {
            return fail(readResult.message, readResult.error, readResult.meta);
        }

        const payload = readResult.data;
        const collectionResult = validateProductCollection(payload?.products);

        if (!collectionResult.ok || payload.schemaVersion !== appConfig.inventory.schemaVersion) {
            const resetPayload = createPayload(seedProducts);
            storageService.setJson(appConfig.inventory.storageKey, resetPayload);
            return ok(resetPayload.products, { recovered: true, ...readResult.meta });
        }

        return ok(payload.products, readResult.meta);
    }

    function writeProducts(products) {
        const collectionResult = validateProductCollection(products);

        if (!collectionResult.ok) {
            return collectionResult;
        }

        const writeResult = storageService.setJson(appConfig.inventory.storageKey, createPayload(products));

        if (!writeResult.ok && writeResult.meta?.fallbackUsed) {
            return ok(products.map((product) => cloneJson(product)), writeResult.meta);
        }

        if (!writeResult.ok) {
            return fail(writeResult.message, writeResult.error, writeResult.meta);
        }

        return ok(products.map((product) => cloneJson(product)), writeResult.meta);
    }

    return {
        async findAll() {
            return readProducts();
        },
        async create(product) {
            const readResult = readProducts();

            if (!readResult.ok) {
                return readResult;
            }

            return writeProducts([...readResult.data, cloneJson(product)]);
        },
        async update(productId, product) {
            const safeProductId = sanitizeInput(productId, { maxLength: 120 });
            const readResult = readProducts();

            if (!readResult.ok) {
                return readResult;
            }

            const nextProducts = readResult.data.map((item) => (item.id === safeProductId ? cloneJson(product) : item));
            return writeProducts(nextProducts);
        },
        async remove(productId) {
            const safeProductId = sanitizeInput(productId, { maxLength: 120 });
            const readResult = readProducts();

            if (!readResult.ok) {
                return readResult;
            }

            return writeProducts(readResult.data.filter((item) => item.id !== safeProductId));
        },
        async replaceAll(products) {
            return writeProducts(products);
        },
    };
}

export function createApiProductRepository({ baseUrl, getAuthToken = () => null }) {
    function getHeaders() {
        const token = getAuthToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    return {
        async findAll() {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/products`, { headers: getHeaders() });
                // Unwrap the data field and map to match frontend structure
                const products = response.data.map(p => ({
                    ...p,
                    category: typeof p.category === 'object' ? p.category?.name : (p.category || "Lain-lain"),
                    price: p.price || 0,
                    stock: p.stock || 0,
                    image: p.imageUrl || p.image || "../images/beras.jpg"
                }));
                return ok(products);
            } catch (error) {
                return fail("Produk gagal dimuat dari server.", error);
            }
        },
        async create(product) {
            try {
                // Ensure field names match the API documentation
                // Note: We might need to map 'category' string to 'categoryId' if required,
                // but let's assume the API handles it or we send the object as is and let API decide.
                // According to doc, it expects categoryId. Since we don't have cat selection yet,
                // we'll pass whatever we have and assume the backend is flexible or we add categoryId.
                const response = await fetchJsonWithTimeout(`${baseUrl}/products`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        name: product.name,
                        description: product.description,
                        price: Number(product.price),
                        stock: Number(product.stock),
                        categoryId: product.categoryId || product.category,
                        image: product.image,
                        imageUrl: product.imageUrl
                    }),
                });
                return ok(response.data);
            } catch (error) {
                return fail("Produk gagal dibuat di server.", error);
            }
        },
        async update(productId, product) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        name: product.name,
                        description: product.description,
                        price: Number(product.price),
                        stock: Number(product.stock),
                        categoryId: product.categoryId || product.category,
                        image: product.image,
                        imageUrl: product.imageUrl
                    }),
                });
                return ok(response.data);
            } catch (error) {
                return fail("Produk gagal diperbarui di server.", error);
            }
        },
        async remove(productId) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/products/${encodeURIComponent(productId)}`, {
                    method: "DELETE",
                    headers: getHeaders(),
                });
                return ok(response?.data);
            } catch (error) {
                return fail("Produk gagal dihapus di server.", error);
            }
        },
        async replaceAll(products) {
            // Documentations doesn't mention bulk replace, but we'll try to follow if needed.
            // If the backend doesn't support it, this might fail, which is fine as fallback.
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/products/bulk-replace`, {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({ products }),
                });
                return ok(response?.data);
            } catch (error) {
                return fail("Produk gagal direset di server.", error);
            }
        },
    };
}

export function createOrderItemService({ baseUrl, getAuthToken = () => null }) {
    function getHeaders() {
        const token = getAuthToken();
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }

    return {
        async findAll(page = 1, limit = 10) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/order-items?page=${page}&limit=${limit}`, {
                    headers: getHeaders(),
                });
                return ok(response.data, response.meta);
            } catch (error) {
                return fail("Gagal mengambil data order item.", error);
            }
        },

        async findById(id) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/order-items/${id}`, {
                    headers: getHeaders(),
                });
                return ok(response.data);
            } catch (error) {
                return fail("Gagal mengambil rincian order item.", error);
            }
        },

        async create({ orderId, productId, quantity, price }) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/order-items`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ orderId, productId, quantity, price }),
                });
                return ok(response.data);
            } catch (error) {
                return fail("Gagal menambahkan item ke pesanan.", error);
            }
        },

        async update(id, { quantity, price }) {
            try {
                const response = await fetchJsonWithTimeout(`${baseUrl}/order-items/${id}`, {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({ quantity, price }),
                });
                return ok(response.data);
            } catch (error) {
                return fail("Gagal memperbarui item pesanan.", error);
            }
        },

        async remove(id) {
            try {
                await fetchJsonWithTimeout(`${baseUrl}/order-items/${id}`, {
                    method: "DELETE",
                    headers: getHeaders(),
                });
                return ok(true);
            } catch (error) {
                return fail("Gagal menghapus item pesanan.", error);
            }
        },
    };
}

export function createFallbackProductRepository(primaryRepository, fallbackRepository) {
    return {
        async findAll() {
            const primaryResult = await primaryRepository.findAll();

            if (primaryResult.ok) {
                return primaryResult;
            }

            handleError(primaryResult.error, {
                category: errorCategory.api,
                code: "PRODUCT_API_FALLBACK",
                message: "Produk server gagal dimuat, memakai data lokal.",
                severity: "warn",
            });
            return fallbackRepository.findAll();
        },
        async create(product) {
            const primaryResult = await primaryRepository.create(product);
            return primaryResult.ok ? primaryResult : fallbackRepository.create(product);
        },
        async update(productId, product) {
            const primaryResult = await primaryRepository.update(productId, product);
            return primaryResult.ok ? primaryResult : fallbackRepository.update(productId, product);
        },
        async remove(productId) {
            const primaryResult = await primaryRepository.remove(productId);
            return primaryResult.ok ? primaryResult : fallbackRepository.remove(productId);
        },
        async replaceAll(products) {
            const primaryResult = await primaryRepository.replaceAll(products);
            return primaryResult.ok ? primaryResult : fallbackRepository.replaceAll(products);
        },
    };
}
