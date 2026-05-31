import { appConfig } from "../config/config.js";
import { AppError, errorCategory } from "./errorHandler.js";

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
        if (!appConfig.api.enabled) {
            throw new AppError({
                category: errorCategory.api,
                code: "API_DISABLED",
                message: "API saat ini dinonaktifkan.",
            });
        }

        const url = `${appConfig.api.baseUrl}${endpoint}`;
        
        const defaultHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (options.token) {
            defaultHeaders["Authorization"] = `Bearer ${options.token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetchWithTimeout(url, config);
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

            if (!response.ok || !responseData.success) {
                throw new AppError({
                    category: errorCategory.api,
                    code: `API_ERROR_${response.status}`,
                    message: responseData.message || "Terjadi kesalahan pada server.",
                    details: { status: response.status, endpoint }
                });
            }

            return {
                data: responseData.data,
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
