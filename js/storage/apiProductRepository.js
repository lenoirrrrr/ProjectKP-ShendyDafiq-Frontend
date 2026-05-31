import { apiClient } from "../utils/apiClient.js";
import { AppError, errorCategory, handleError } from "../utils/errorHandler.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

export function createApiProductRepository() {
    return {
        async findAll() {
            try {
                // Adjust pagination as needed, fetching up to 100 products for now
                const response = await apiClient.get('/products?page=1&limit=100');
                
                // Map the backend product to match the frontend expected structure
                const mappedProducts = response.data.map(p => ({
                    id: String(p.id),
                    name: p.name,
                    description: p.description || "",
                    price: p.price || 0,
                    stock: p.stock || 0,
                    category: p.category?.name || "Lain-lain",
                    image: p.imageUrl || p.image || "images/beras.jpg",
                    imageAlt: p.name,
                    isActive: true
                }));

                return result.ok(mappedProducts, response.meta);
            } catch (error) {
                return result.fail(
                    "Produk gagal dimuat dari server.",
                    new AppError({
                        category: errorCategory.api,
                        code: "PRODUCT_API_READ_FAILED",
                        message: "Produk gagal dimuat dari server.",
                        cause: error,
                    })
                );
            }
        },
        async findById(productId) {
            try {
                const response = await apiClient.get(`/products/${productId}`);
                const p = response.data;
                const mappedProduct = {
                    id: String(p.id),
                    name: p.name,
                    description: p.description || "",
                    price: p.price || 0,
                    stock: p.stock || 0,
                    category: p.category?.name || "Lain-lain",
                    image: p.imageUrl || p.image || "images/beras.jpg",
                    imageAlt: p.name,
                    isActive: true
                };
                return result.ok(mappedProduct);
            } catch (error) {
                return result.fail(
                    "Produk tidak ditemukan.",
                    new AppError({
                        category: errorCategory.api,
                        code: "PRODUCT_API_FIND_FAILED",
                        message: "Produk tidak ditemukan.",
                        cause: error,
                    })
                );
            }
        },
        async deductStock(items) {
            // Note: The backend automatically deducts stock during POST /orders.
            // Returning OK so the frontend doesn't break if it still calls this.
            return result.ok();
        }
    };
}

export function createFallbackProductRepository(primaryRepository, fallbackRepository) {
    return {
        async findAll() {
            try {
                const primaryResult = await primaryRepository.findAll();
                if (primaryResult.ok) return primaryResult;
                throw primaryResult.error;
            } catch (error) {
                handleError(error, {
                    category: errorCategory.api,
                    code: "PRODUCT_API_FALLBACK",
                    message: "Server tidak merespons, memuat data lokal sementara.",
                    severity: "warn",
                });
                return fallbackRepository.findAll();
            }
        },
        async findById(productId) {
            try {
                const primaryResult = await primaryRepository.findById(productId);
                if (primaryResult.ok) return primaryResult;
                throw primaryResult.error;
            } catch (error) {
                return fallbackRepository.findById(productId);
            }
        },
        async deductStock(items) {
            return result.ok();
        }
    };
}
