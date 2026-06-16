function resolveEnvValue(key, fallback) {
    const runtimeEnv = globalThis.__APP_ENV__ ?? {};
    const metaTag = document.querySelector(`meta[name="${key}"]`);

    if (typeof runtimeEnv[key] === "string" && runtimeEnv[key].trim().length > 0) {
        return runtimeEnv[key].trim();
    }

    if (metaTag?.content?.trim()) {
        return metaTag.content.trim();
    }

    return fallback;
}

export const appConfig = Object.freeze({
    locale: "id-ID",
    api: {
        enabled: true,
        baseUrl: resolveEnvValue("APP_API_BASE_URL", "https://projectkp-shendydafiq-backend-production.up.railway.app/api"),
        authBaseUrl: resolveEnvValue("APP_AUTH_BASE_URL", "http://localhost:3000/api/auth"),
        timeoutMs: 8000,
    },
    auth: {
        storageKey: "toko-sembako:auth",
        userKey: "toko-sembako:user",
    },
    cart: {
        storageKey: "toko-sembako-ibu-diana:cart:v1",
        schemaVersion: 1,
        currency: "IDR",
        maxQuantityPerItem: 99,
        remoteEnabled: false,
    },
    inventory: {
        storageKey: "toko-sembako-ibu-diana:admin-products:v1",
        schemaVersion: 1,
        lowStockThreshold: 10,
    },
    notification: {
        durationMs: 3200,
    },
});
