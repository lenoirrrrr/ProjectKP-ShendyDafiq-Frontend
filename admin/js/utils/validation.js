import { fail, ok } from "./result.js";
import { createAppError, errorCategory } from "./error.js";
import { sanitizeInput, toInteger, toNumber } from "./sanitize.js";

function isDuplicateName(products, name, currentId = "") {
    const normalizedName = name.toLowerCase();
    return products.some((product) => {
        return product.id !== currentId && product.name.toLowerCase() === normalizedName;
    });
}

export function validateProduct(input, options = {}) {
    const { existingProducts = [], currentId = "" } = options;
    const errors = {};
    const product = {
        id: sanitizeInput(input.id, { maxLength: 120 }),
        name: sanitizeInput(input.name, { maxLength: 160 }),
        category: sanitizeInput(input.category, { maxLength: 80 }),
        price: toNumber(input.price, Number.NaN),
        stock: toInteger(input.stock, Number.NaN),
        image: sanitizeInput(input.image || "../images/beras.jpg", { maxLength: 280 }),
        description: sanitizeInput(input.description, { maxLength: 600, allowLineBreaks: true }),
        createdAt: sanitizeInput(input.createdAt, { maxLength: 40 }),
        updatedAt: sanitizeInput(input.updatedAt, { maxLength: 40 }),
    };

    if (!product.name) {
        errors.name = "Nama produk wajib diisi.";
    }

    if (!product.category) {
        errors.category = "Kategori wajib diisi.";
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
        errors.price = "Harga tidak boleh negatif.";
    }

    if (!Number.isInteger(product.stock) || product.stock < 0) {
        errors.stock = "Stok tidak boleh minus.";
    }

    if (product.name && isDuplicateName(existingProducts, product.name, currentId)) {
        errors.name = "Nama produk sudah ada.";
    }

    if (Object.keys(errors).length > 0) {
        return fail(
            "Data produk tidak valid.",
            createAppError({
                category: errorCategory.validation,
                code: "INVALID_PRODUCT_INPUT",
                message: "Periksa kembali data produk.",
                severity: "warn",
                details: { errors },
            }),
            { errors }
        );
    }

    return ok(product);
}

export function validateProductCollection(products) {
    if (!Array.isArray(products)) {
        return fail(
            "Format data produk tidak valid.",
            createAppError({
                category: errorCategory.validation,
                code: "INVALID_PRODUCT_COLLECTION",
                message: "Data produk tidak valid dan akan direset.",
                severity: "warn",
            })
        );
    }

    return ok(products);
}
