import { appConfig } from "../config.js";

function readUser() {
    const rawUser = localStorage.getItem(appConfig.auth.userKey);

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        localStorage.removeItem(appConfig.auth.userKey);
        return null;
    }
}

function clearSessionStorage() {
    localStorage.removeItem(appConfig.auth.storageKey);
    localStorage.removeItem(appConfig.auth.userKey);
    localStorage.removeItem(appConfig.auth.adminSessionKey);
}

export const authService = {
    async login(email, password) {
        try {
            const response = await fetch(`${appConfig.api.authBaseUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: data.message || "Email atau password salah.",
                };
            }

            if (data.user?.role !== "ADMIN") {
                clearSessionStorage();
                return {
                    success: false,
                    message: "Akses ditolak. Anda bukan Admin.",
                };
            }

            const session = {
                user: data.user,
                token: data.token,
                loginTime: new Date().toISOString(),
            };

            localStorage.setItem(appConfig.auth.storageKey, data.token);
            localStorage.setItem(appConfig.auth.userKey, JSON.stringify(data.user));
            localStorage.setItem(appConfig.auth.adminSessionKey, JSON.stringify(session));

            return { success: true, user: data.user, token: data.token };
        } catch (error) {
            return { success: false, message: "Gagal terhubung ke server." };
        }
    },

    logout() {
        clearSessionStorage();
        window.location.href = "../index.html";
    },

    handleUnauthorized(status = 401) {
        clearSessionStorage();
        if (status === 403) {
            window.location.href = "../index.html?unauthorized=1";
            return;
        }
        window.location.reload();
    },

    getToken() {
        return localStorage.getItem(appConfig.auth.storageKey);
    },

    isAuthenticated() {
        const token = this.getToken();
        const user = readUser();
        return Boolean(token && user);
    },

    isAdmin() {
        const user = readUser();
        return user?.role === "ADMIN";
    },

    getUser() {
        return readUser();
    }
};
