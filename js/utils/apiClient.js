import { appConfig } from "../config/config.js";
import { AppError, errorCategory } from "./errorHandler.js";

function getStoredToken() {
    return localStorage.getItem(appConfig.auth.storageKey);
}

function clearAuthSession() {
    localStorage.removeItem(appConfig.auth.storageKey);
    localStorage.removeItem(appConfig.auth.userKey);
}

function handleAuthorizationFailure(status) {
    clearAuthSession();
    window.dispatchEvent(
        new CustomEvent("auth:expired", {
            detail: {
                status,
                reason: status === 403 ? "FORBIDDEN" : "UNAUTHORIZED",
            },
        })
    );
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = appConfig.api.timeoutMs } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    return response;
}

export const apiClient = {
    async request(endpoint, options = {}) {
        const {
            authRequired = true,
            baseUrl = appConfig.api.baseUrl,
            skipAuthFailureRedirect = false,
            ...requestOptions
        } = options;

        if (!appConfig.api.enabled && baseUrl === appConfig.api.baseUrl) {
            throw new AppError({
                category: errorCategory.api,
                code: "API_DISABLED",
                message: "API saat ini dinonaktifkan.",
            });
        }

        const url = `${baseUrl}${endpoint}`;
        
        const defaultHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        const token = requestOptions.token || getStoredToken();
        if (authRequired && token) {
            defaultHeaders["Authorization"] = `Bearer ${token}`;
        }

        const config = {
            ...requestOptions,
            headers: {
                ...defaultHeaders,
                ...requestOptions.headers
            }
        };

        try {
            const response = await fetchWithTimeout(url, config);

            if ((response.status === 401 || response.status === 403) && authRequired) {
                handleAuthorizationFailure(response.status);
                if (!skipAuthFailureRedirect) {
                    throw new AppError({
                        category: errorCategory.api,
                        code: response.status === 403 ? "AUTH_FORBIDDEN" : "AUTH_EXPIRED",
                        message: response.status === 403
                            ? "Anda tidak memiliki akses ke resource ini."
                            : "Sesi login Anda sudah berakhir. Silakan login kembali.",
                        details: { status: response.status, endpoint }
                    });
                }
            }

            let responseData;
            
            try {
                responseData = await response.json();
            } catch (err) {
                // Not a JSON response
                throw new AppError({
                    category: errorCategory.api,
                    code: "INVALID_JSON_RESPONSE",
                    message: "Respons server tidak valid.",
                    technicalMessage: "Failed to parse JSON response",
                    cause: err
                });
            }

            if (!response.ok || (responseData.success !== undefined && !responseData.success)) {
                throw new AppError({
                    category: errorCategory.api,
                    code: `API_ERROR_${response.status}`,
                    message: responseData.message || "Terjadi kesalahan pada server.",
                    details: { status: response.status, endpoint }
                });
            }

            return {
                data: responseData.data || responseData, // Handle both wrapped and unwrapped data
                meta: responseData.meta
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            if (error.name === 'AbortError') {
                throw new AppError({
                    category: errorCategory.network,
                    code: "API_TIMEOUT",
                    message: "Koneksi ke server terputus karena terlalu lama.",
                    cause: error
                });
            }

            throw new AppError({
                category: errorCategory.network,
                code: "API_NETWORK_ERROR",
                message: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
                cause: error
            });
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: "GET" });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body)
        });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: "DELETE" });
    }
};
