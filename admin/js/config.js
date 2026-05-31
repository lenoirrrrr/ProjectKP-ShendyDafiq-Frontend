export const appConfig = Object.freeze({
    locale: "id-ID",
    api: {
        enabled: true,
        baseUrl: "http://localhost:3000/api",
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
        username: "admin",
        password: "password123",
        storageKey: "toko-sembako:admin-auth"
    }
});

export const productSeedData = Object.freeze([]);
