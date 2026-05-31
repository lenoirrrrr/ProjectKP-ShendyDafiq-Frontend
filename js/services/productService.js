import { validateProduct } from "../utils/validation.js";
import { AppError, errorCategory, handleError } from "../utils/errorHandler.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

export function createProductService(productRepository) {
    let productCache = [];

    async function getProducts() {
        try {
            const repoResult = await productRepository.findAll();

            if (!repoResult.ok) {
                throw repoResult.error;
            }

            const products = repoResult.data;

            if (!Array.isArray(products)) {
                throw new AppError({
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
            return result.ok(productCache);
        } catch (error) {
            return result.fail(
                "Produk gagal dimuat.",
                new AppError({
                    category: errorCategory.validation,
                    code: "PRODUCT_SERVICE_FAILED",
                    message: "Produk gagal dimuat.",
                    cause: error,
                })
            );
        }
    }

    async function getProductById(productId) {
        try {
            if (!productId) {
                throw new AppError({
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

            const cachedProduct = productCache.find((product) => product.id === productId);

            if (cachedProduct) {
                return result.ok(cachedProduct);
            }

            const repoResult = await productRepository.findById(productId);
            if (!repoResult.ok) {
                return result.fail("Produk tidak ditemukan.", repoResult.error);
            }

            const validation = validateProduct(repoResult.data);

            if (!validation.ok || !validation.data.isActive) {
                return result.fail("Produk tidak ditemukan.", validation.error);
            }

            return result.ok(validation.data);
        } catch (error) {
            return result.fail(
                "Produk tidak ditemukan.",
                new AppError({
                    category: errorCategory.validation,
                    code: "PRODUCT_LOOKUP_FAILED",
                    message: "Produk tidak ditemukan.",
                    severity: "warn",
                    cause: error,
                })
            );
        }
    }

    return { getProducts, getProductById };
}
