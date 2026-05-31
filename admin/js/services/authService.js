import { appConfig } from "../config.js";

export const authService = {
    login(username, password) {
        if (username === appConfig.auth.username && password === appConfig.auth.password) {
            const session = {
                username,
                loginTime: new Date().toISOString(),
                token: "hardcoded-admin-token"
            };
            localStorage.setItem(appConfig.auth.storageKey, JSON.stringify(session));
            return { success: true };
        }
        return { success: false, message: "Username atau password salah." };
    },

    logout() {
        localStorage.removeItem(appConfig.auth.storageKey);
        window.location.reload();
    },

    isAuthenticated() {
        const session = localStorage.getItem(appConfig.auth.storageKey);
        if (!session) return false;
        
        try {
            const data = JSON.parse(session);
            return !!data.token;
        } catch (e) {
            return false;
        }
    }
};
