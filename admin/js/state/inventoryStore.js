import { fail, ok } from "../utils/result.js";
import { cloneJson } from "../utils/sanitize.js";
import { normalizeError, errorCategory, handleError } from "../utils/error.js";

export function createInventoryStore(inventoryService) {
    let state = {
        products: [],
        searchQuery: "",
        isLoading: false,
    };
    const subscribers = new Set();

    function getState() {
        return cloneJson(state);
    }

    function getVisibleProducts() {
        const query = state.searchQuery.toLowerCase();

        if (!query) {
            return state.products.map((product) => cloneJson(product));
        }

        return state.products
            .filter((product) => {
                return (
                    product.name.toLowerCase().includes(query) ||
                    product.category.toLowerCase().includes(query) ||
                    product.description.toLowerCase().includes(query)
                );
            })
            .map((product) => cloneJson(product));
    }

    function notify(meta = {}) {
        const snapshot = getState();
        subscribers.forEach((subscriber) => {
            try {
                subscriber({ state: snapshot, meta });
            } catch (error) {
                handleError(error, {
                    category: errorCategory.app,
                    code: "INVENTORY_SUBSCRIBER_FAILED",
                    message: "UI inventory gagal diperbarui.",
                    severity: "warn",
                });
            }
        });
    }

    async function refresh() {
        state = { ...state, isLoading: true };
        notify({ type: "loading" });

        const productsResult = await inventoryService.getProducts();

        if (!productsResult.ok) {
            state = { ...state, isLoading: false };
            notify({ type: "load:error", error: productsResult.error });
            return productsResult;
        }

        state = {
            ...state,
            products: productsResult.data,
            isLoading: false,
        };
        notify({ type: "load:success" });
        return ok(getState());
    }

    function setSearchQuery(query) {
        state = {
            ...state,
            searchQuery: String(query ?? "").trim(),
        };
        notify({ type: "search" });
    }

    async function createProduct(input) {
        const result = await inventoryService.createProduct(input);

        if (!result.ok) {
            notify({ type: "create:error", error: result.error, errors: result.meta.errors });
            return result;
        }

        await refresh();
        notify({ type: "create:success", product: result.data });
        return result;
    }

    async function updateProduct(productId, input) {
        const result = await inventoryService.updateProduct(productId, input);

        if (!result.ok) {
            notify({ type: "update:error", error: result.error, errors: result.meta.errors });
            return result;
        }

        await refresh();
        notify({ type: "update:success", product: result.data });
        return result;
    }

    async function deleteProduct(productId) {
        const result = await inventoryService.deleteProduct(productId);

        if (!result.ok) {
            notify({ type: "delete:error", error: result.error });
            return result;
        }

        await refresh();
        notify({ type: "delete:success", product: result.data });
        return result;
    }

    async function resetProducts() {
        const result = await inventoryService.resetProducts();

        if (!result.ok) {
            notify({ type: "reset:error", error: result.error });
            return result;
        }

        await refresh();
        notify({ type: "reset:success" });
        return result;
    }

    function getProductById(productId) {
        return state.products.find((product) => product.id === productId) ?? null;
    }

    function getStats() {
        try {
            return inventoryService.calculateStats(state.products);
        } catch (error) {
            throw normalizeError(error, {
                category: errorCategory.inventory,
                code: "STATS_CALCULATION_FAILED",
                message: "Statistik inventory gagal dihitung.",
            });
        }
    }

    function subscribe(callback) {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    }

    return {
        refresh,
        subscribe,
        getState,
        getVisibleProducts,
        getProductById,
        getStats,
        setSearchQuery,
        createProduct,
        updateProduct,
        deleteProduct,
        resetProducts,
    };
}
