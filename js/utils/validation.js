import { appConfig } from "../config/config.js";
import { AppError, errorCategory } from "./errorHandler.js";
import { sanitizeText } from "./sanitizer.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

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
        return null;
    }
}

export function validatePrice(price) {
    const normalizedPrice = Number(price);

    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
        return result.fail(
            "Harga produk tidak valid.",
            new AppError({
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

export function validateQuantity(quantity) {
    const normalizedQuantity = Number(quantity);

    if (
        !Number.isFinite(normalizedQuantity) ||
        !Number.isInteger(normalizedQuantity) ||
        normalizedQuantity <= 0 ||
        normalizedQuantity > appConfig.cart.maxQuantityPerItem
    ) {
        return result.fail(
            "Jumlah produk tidak valid.",
            new AppError({
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

export function validateProduct(product) {
    if (!isPlainObject(product)) {
        return result.fail(
            "Format produk tidak valid.",
            new AppError({
                category: errorCategory.validation,
                code: "INVALID_PRODUCT_SCHEMA",
                message: "Sebagian produk tidak valid dan dilewati.",
                technicalMessage: "Product is not an object.",
                severity: "warn",
            })
        );
    }

    const priceResult = validatePrice(product.price);
    
    let safeImage = sanitizeText(product.image, { maxLength: 280 });
    if (safeImage.startsWith("../")) {
        safeImage = safeImage.replace("../", "");
    }

    const normalizedProduct = {
        id: sanitizeText(product.id, { maxLength: 120 }),
        name: sanitizeText(product.name, { maxLength: 160 }),
        price: priceResult.ok ? priceResult.data : Number.NaN,
        image: safeImage,
        imageAlt: sanitizeText(product.imageAlt || product.name, { maxLength: 220 }),
        category: sanitizeText(product.category, { maxLength: 80 }),
        isActive: product.isActive !== false,
        stock: product.stock !== undefined ? Number(product.stock) : 99,
        description: sanitizeText(product.description || "", { maxLength: 600, allowLineBreaks: true }),
    };

    const missingFields = ["id", "name", "image", "imageAlt", "category"].filter(
        (field) => normalizedProduct[field].length === 0
    );

    if (missingFields.length > 0 || !priceResult.ok) {
        return result.fail(
            "Format produk tidak valid.",
            new AppError({
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

export function validateCartItem(item) {
    if (!isPlainObject(item)) {
        return result.fail(
            "Format item keranjang tidak valid.",
            new AppError({
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
        id: sanitizeText(item.id, { maxLength: 120 }),
        name: sanitizeText(item.name, { maxLength: 160 }),
        price: priceResult.ok ? priceResult.data : Number.NaN,
        quantity: quantityResult.ok ? quantityResult.data : Number.NaN,
        image: sanitizeText(item.image, { maxLength: 280 }),
        createdAt: isValidDateString(item.createdAt) ? item.createdAt : "",
    };

    const missingFields = ["id", "name", "image", "createdAt"].filter((field) => {
        return String(normalizedItem[field] ?? "").length === 0;
    });

    if (missingFields.length > 0 || !priceResult.ok || !quantityResult.ok) {
        return result.fail(
            "Format item keranjang tidak valid.",
            new AppError({
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
        id: sanitizeText(item?.id, { maxLength: 120 }),
        name: sanitizeText(item?.name, { maxLength: 160 }),
        price: Number(item?.price),
        quantity: Math.trunc(Number(item?.quantity)),
        image: sanitizeText(item?.image, { maxLength: 280 }),
        createdAt: typeof item?.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    };
}

export function sanitizeCartPayload(payload) {
    if (!isPlainObject(payload) || !Array.isArray(payload.items)) {
        return result.fail(
            "Format keranjang tidak valid.",
            new AppError({
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

    const cleanItems = [...mergedItems.values()];
    const cleanPayload = {
        schemaVersion: appConfig.cart.schemaVersion,
        source: "client",
        currency: appConfig.cart.currency,
        items: cleanItems,
        updatedAt: new Date().toISOString(),
    };

    return result.ok(cleanPayload, {
        droppedItems,
        duplicateItems,
    });
}
