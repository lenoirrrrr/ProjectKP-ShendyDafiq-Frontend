import { fail, ok } from "../utils/result.js";
import { cloneJson } from "../utils/sanitize.js";
import { createAppError, errorCategory, handleError, normalizeError } from "../utils/error.js";

function parseJson(value) {
    try {
        return ok(JSON.parse(value));
    } catch (error) {
        return fail(
            "Storage JSON rusak.",
            createAppError({
                category: errorCategory.storage,
                code: "MALFORMED_JSON",
                message: "Data tersimpan rusak dan akan direset.",
                technicalMessage: "Malformed JSON in localStorage.",
                severity: "warn",
                cause: error,
            })
        );
    }
}

export function createStorageService() {
    const memoryStorage = new Map();
    let localStorageRef = null;

    try {
        const testKey = "__admin_storage_test__";
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        localStorageRef = window.localStorage;
    } catch (error) {
        handleError(error, {
            category: errorCategory.storage,
            code: "LOCAL_STORAGE_UNAVAILABLE",
            message: "Storage browser tidak tersedia. Data hanya tersimpan sementara.",
            severity: "warn",
        });
    }

    function getJson(key, fallbackValue) {
        try {
            if (!localStorageRef) {
                return ok(cloneJson(memoryStorage.get(key) ?? fallbackValue), {
                    storage: "memory",
                    persistent: false,
                });
            }

            const rawValue = localStorageRef.getItem(key);

            if (!rawValue) {
                return ok(cloneJson(fallbackValue), {
                    storage: "localStorage",
                    persistent: true,
                });
            }

            const parsed = parseJson(rawValue);

            if (!parsed.ok) {
                handleError(parsed.error);
                localStorageRef.removeItem(key);
                return ok(cloneJson(fallbackValue), {
                    storage: "localStorage",
                    persistent: true,
                    recovered: true,
                });
            }

            return ok(parsed.data, {
                storage: "localStorage",
                persistent: true,
            });
        } catch (error) {
            return fail(
                "Storage gagal dibaca.",
                normalizeError(error, {
                    category: errorCategory.storage,
                    code: "STORAGE_READ_FAILED",
                    message: "Storage gagal dibaca.",
                    severity: "warn",
                })
            );
        }
    }

    function setJson(key, value) {
        try {
            const safeValue = cloneJson(value);

            if (!localStorageRef) {
                memoryStorage.set(key, safeValue);
                return ok(false, { storage: "memory", persistent: false });
            }

            localStorageRef.setItem(key, JSON.stringify(safeValue));
            return ok(true, { storage: "localStorage", persistent: true });
        } catch (error) {
            const appError = normalizeError(error, {
                category: errorCategory.storage,
                code: "STORAGE_WRITE_FAILED",
                message: "Storage gagal menyimpan data.",
                severity: "warn",
            });
            handleError(appError);
            memoryStorage.set(key, cloneJson(value));
            return fail(appError.userMessage, appError, {
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
                return ok(false, { storage: "memory", persistent: false });
            }

            localStorageRef.removeItem(key);
            return ok(true, { storage: "localStorage", persistent: true });
        } catch (error) {
            return fail(
                "Storage gagal menghapus data.",
                normalizeError(error, {
                    category: errorCategory.storage,
                    code: "STORAGE_REMOVE_FAILED",
                    message: "Storage gagal menghapus data.",
                    severity: "warn",
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
