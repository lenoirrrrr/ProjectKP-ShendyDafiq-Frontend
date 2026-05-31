import { appConfig, productSeedData } from "../config.js";
import { fail, ok } from "../utils/result.js";
import { createAppError, errorCategory, normalizeError } from "../utils/error.js";
import { cloneJson, createSlug, sanitizeInput } from "../utils/sanitize.js";
import { validateProduct } from "../utils/validation.js";

function createProductId(name) {
    const slug = createSlug(name) || "produk";
    return `${slug}-${Date.now().toString(36)}`;
}

function normalizeProductForSave(product) {
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        image: product.image,
        description: product.description,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

export function createInventoryService(productRepository) {
    async function getProducts() {
        try {
            const result = await productRepository.findAll();

            if (!result.ok) {
                throw result.error;
            }

            return ok(result.data.map((product) => cloneJson(product)));
        } catch (error) {
            return fail(
                "Produk gagal dimuat.",
                normalizeError(error, {
                    category: errorCategory.inventory,
                    code: "PRODUCTS_LOAD_FAILED",
                    message: "Produk gagal dimuat.",
                })
            );
        }
    }

    async function createProduct(input) {
        try {
            const productsResult = await getProducts();

            if (!productsResult.ok) {
                throw productsResult.error;
            }

            const now = new Date().toISOString();
            const validation = validateProduct(
                {
                    ...input,
                    id: createProductId(input.name),
                    createdAt: now,
                    updatedAt: now,
                },
                { existingProducts: productsResult.data }
            );

            if (!validation.ok) {
                return validation;
            }

            const saveResult = await productRepository.create(normalizeProductForSave(validation.data));

            if (!saveResult.ok) {
                throw saveResult.error;
            }

            return ok(validation.data);
        } catch (error) {
            return fail(
                "Produk gagal ditambahkan.",
                normalizeError(error, {
                    category: errorCategory.inventory,
                    code: "PRODUCT_CREATE_FAILED",
                    message: "Produk gagal ditambahkan.",
                })
            );
        }
    }

    async function updateProduct(productId, input) {
        try {
            const safeProductId = sanitizeInput(productId, { maxLength: 120 });
            const productsResult = await getProducts();

            if (!productsResult.ok) {
                throw productsResult.error;
            }

            const existingProduct = productsResult.data.find((product) => product.id === safeProductId);

            if (!existingProduct) {
                throw createAppError({
                    category: errorCategory.inventory,
                    code: "PRODUCT_NOT_FOUND",
                    message: "Produk tidak ditemukan.",
                    technicalMessage: `Product not found: ${safeProductId}`,
                    severity: "warn",
                });
            }

            const validation = validateProduct(
                {
                    ...existingProduct,
                    ...input,
                    id: existingProduct.id,
                    createdAt: existingProduct.createdAt,
                    updatedAt: new Date().toISOString(),
                },
                {
                    existingProducts: productsResult.data,
                    currentId: existingProduct.id,
                }
            );

            if (!validation.ok) {
                return validation;
            }

            const saveResult = await productRepository.update(existingProduct.id, normalizeProductForSave(validation.data));

            if (!saveResult.ok) {
                throw saveResult.error;
            }

            return ok(validation.data);
        } catch (error) {
            return fail(
                "Produk gagal diperbarui.",
                normalizeError(error, {
                    category: errorCategory.inventory,
                    code: "PRODUCT_UPDATE_FAILED",
                    message: "Produk gagal diperbarui.",
                })
            );
        }
    }

    async function deleteProduct(productId) {
        try {
            const safeProductId = sanitizeInput(productId, { maxLength: 120 });
            const productsResult = await getProducts();

            if (!productsResult.ok) {
                throw productsResult.error;
            }

            const existingProduct = productsResult.data.find((product) => product.id === safeProductId);

            if (!existingProduct) {
                throw createAppError({
                    category: errorCategory.inventory,
                    code: "PRODUCT_NOT_FOUND",
                    message: "Produk tidak ditemukan.",
                    severity: "warn",
                });
            }

            const deleteResult = await productRepository.remove(safeProductId);

            if (!deleteResult.ok) {
                throw deleteResult.error;
            }

            return ok(existingProduct);
        } catch (error) {
            return fail(
                "Produk gagal dihapus.",
                normalizeError(error, {
                    category: errorCategory.inventory,
                    code: "PRODUCT_DELETE_FAILED",
                    message: "Produk gagal dihapus.",
                })
            );
        }
    }

    async function resetProducts() {
        try {
            const products = productSeedData.map((product) => cloneJson(product));
            const resetResult = await productRepository.replaceAll(products);

            if (!resetResult.ok) {
                throw resetResult.error;
            }

            return ok(products);
        } catch (error) {
            return fail(
                "Data demo gagal direset.",
                normalizeError(error, {
                    category: errorCategory.inventory,
                    code: "PRODUCT_RESET_FAILED",
                    message: "Data demo gagal direset.",
                })
            );
        }
    }

    function calculateStats(products) {
        const totalProducts = products.length;
        const totalStock = products.reduce((total, product) => total + product.stock, 0);
        const lowStockProducts = products.filter((product) => {
            return product.stock > 0 && product.stock <= appConfig.inventory.lowStockThreshold;
        }).length;
        const emptyStockProducts = products.filter((product) => product.stock === 0).length;
        const inventoryValue = products.reduce((total, product) => total + product.price * product.stock, 0);

        return {
            totalProducts,
            totalStock,
            lowStockProducts,
            emptyStockProducts,
            inventoryValue,
        };
    }

    return {
        getProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
        calculateStats,
    };
}
