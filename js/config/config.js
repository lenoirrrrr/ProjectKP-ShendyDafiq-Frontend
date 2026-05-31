export const appConfig = Object.freeze({
    locale: "id-ID",
    api: {
        enabled: true,
        baseUrl: "http://localhost:3000/api",
        timeoutMs: 8000,
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
