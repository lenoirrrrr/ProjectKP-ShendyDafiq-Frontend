import { AppError, errorCategory, handleError } from "../utils/errorHandler.js";

const result = {
    ok(data = null, meta = {}) {
        return { ok: true, data, meta };
    },
    fail(message, error = null, meta = {}) {
        return { ok: false, message, error, meta };
    },
};

export function createStorageService() {
    const memoryStorage = new Map();
    let localStorageRef = null;

    try {
        const testKey = "__storage_test__";
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        localStorageRef = window.localStorage;
    } catch (error) {
        handleError(error, {
            category: errorCategory.storage,
            code: "LOCAL_STORAGE_UNAVAILABLE",
            message: "Storage browser tidak tersedia. Data cart hanya tersimpan sementara di RAM.",
            severity: "warn",
        });
    }

    function getJson(key, fallbackValue) {
        try {
            if (!localStorageRef) {
                return result.ok(memoryStorage.get(key) ?? fallbackValue, {
                    storage: "memory",
                    persistent: false,
                });
            }

            const rawValue = localStorageRef.getItem(key);

            if (!rawValue) {
                return result.ok(fallbackValue, {
                    storage: "localStorage",
                    persistent: true,
                });
            }

            try {
                const parsed = JSON.parse(rawValue);
                return result.ok(parsed, {
                    storage: "localStorage",
                    persistent: true,
                });
            } catch (parseError) {
                const appError = new AppError({
                    category: errorCategory.storage,
                    code: "MALFORMED_JSON",
                    message: "Data penyimpanan rusak dan akan direset.",
                    technicalMessage: "Malformed JSON in client storage.",
                    severity: "warn",
                    cause: parseError,
                });
                handleError(appError);
                localStorageRef.removeItem(key);
                return result.ok(fallbackValue, {
                    storage: "localStorage",
                    persistent: true,
                    recovered: true,
                });
            }
        } catch (error) {
            return result.fail(
                "Storage gagal dibaca.",
                new AppError({
                    category: errorCategory.storage,
                    code: "STORAGE_READ_FAILED",
                    message: "Data gagal dibaca.",
                    severity: "warn",
                    cause: error,
                })
            );
        }
    }

    function setJson(key, value) {
        try {
            if (!localStorageRef) {
                memoryStorage.set(key, value);
                return result.ok(false, { storage: "memory", persistent: false });
            }

            localStorageRef.setItem(key, JSON.stringify(value));
            return result.ok(true, { storage: "localStorage", persistent: true });
        } catch (error) {
            const appError = new AppError({
                category: errorCategory.storage,
                code: "STORAGE_WRITE_FAILED",
                message: "Data gagal disimpan secara permanen.",
                severity: "warn",
                cause: error,
            });
            handleError(appError);
            memoryStorage.set(key, value);
            return result.fail(appError.userMessage, appError, {
                storage: "memory",
                persistent: false,
                fallbackUsed: true,
            });
        }
    }

    function remove(key) {
        try {
            memoryStorage.delete(key);

            if (!localStorageRef) {
                return result.ok(false, { storage: "memory", persistent: false });
            }

            localStorageRef.removeItem(key);
            return result.ok(true, { storage: "localStorage", persistent: true });
        } catch (error) {
            return result.fail(
                "Storage gagal dihapus.",
                new AppError({
                    category: errorCategory.storage,
                    code: "STORAGE_REMOVE_FAILED",
                    message: "Data gagal dihapus.",
                    severity: "warn",
                    cause: error,
                })
            );
        }
    }

    return {
        kind: localStorageRef ? "localStorage" : "memory",
        isPersistent: Boolean(localStorageRef),
        getJson,
        setJson,
        remove,
    };
}
