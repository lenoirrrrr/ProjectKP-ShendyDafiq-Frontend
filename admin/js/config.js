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
    inventory: {
        storageKey: "toko-sembako-ibu-diana:admin-products:v1",
        schemaVersion: 1,
        lowStockThreshold: 10,
        currency: "IDR",
    },
    notification: {
        durationMs: 3000,
    },
    supabase: {
        url: "https://kbhctgtxxndmbjvvroje.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaGN0Z3R4eG5kbWJqdnZyb2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTA3MzEsImV4cCI6MjA5NTYyNjczMX0._DMaZq3sYG4liRhhKAeZqskBGVXeZ0t1WfD7FC5ZnEE",
        bucket: "ProductImage"
    },
    auth: {
        storageKey: "toko-sembako:auth",
        userKey: "toko-sembako:user",
        adminSessionKey: "toko-sembako:admin-auth",
    },
});

export const productSeedData = Object.freeze([]);
