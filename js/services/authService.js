import { appConfig } from "../config/config.js";
import { apiClient } from "../utils/apiClient.js";
import { AppError, errorCategory } from "../utils/errorHandler.js";

const AUTH_STORAGE_KEY = appConfig.auth.storageKey;
const USER_STORAGE_KEY = appConfig.auth.userKey;

function readStoredUser() {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        localStorage.removeItem(USER_STORAGE_KEY);
        return null;
    }
}

function createGuestState() {
    return {
        token: null,
        user: null,
        role: null,
        isAuthenticated: false,
        isAdmin: false,
    };
}

function createAuthState() {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    const user = readStoredUser();

    if (!token || !user) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        return createGuestState();
    }

    return {
        token,
        user,
        role: user.role ?? "USER",
        isAuthenticated: true,
        isAdmin: user.role === "ADMIN",
    };
}

function persistAuthSession(token, user) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function createAuthService() {
    let authState = createAuthState();
    const subscribers = new Set();

    function getSnapshot() {
        return { ...authState };
    }

    function notify() {
        const snapshot = getSnapshot();
        subscribers.forEach((subscriber) => subscriber(snapshot));
    }

    function updateAuthState(token, user) {
        persistAuthSession(token, user);
        authState = {
            token,
            user,
            role: user.role ?? "USER",
            isAuthenticated: true,
            isAdmin: user.role === "ADMIN",
        };
        notify();
        return getSnapshot();
    }

    function clearAuthState() {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        authState = createGuestState();
        notify();
        return getSnapshot();
    }

    async function authenticate(endpoint, payload, errorCode, fallbackMessage) {
        try {
            const response = await apiClient.post(endpoint, payload, {
                baseUrl: appConfig.api.authBaseUrl,
                authRequired: false,
            });

            const token = response.data?.token;
            const user = response.data?.user;

            if (!token || !user) {
                throw new AppError({
                    category: errorCategory.api,
                    code: `${errorCode}_INVALID_RESPONSE`,
                    message: "Respons autentikasi tidak lengkap.",
                });
            }

            const snapshot = updateAuthState(token, user);

            return {
                success: true,
                token,
                user,
                state: snapshot,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError({
                category: errorCategory.network,
                code: errorCode,
                message: fallbackMessage,
                cause: error,
            });
        }
    }

    function subscribe(callback) {
        subscribers.add(callback);
        callback(getSnapshot());
        return () => subscribers.delete(callback);
    }

    return {
        login(email, password) {
            return authenticate(
                "/login",
                { email, password },
                "LOGIN_NETWORK_ERROR",
                "Gagal menghubungkan ke server untuk login."
            );
        },
        register(name, email, password, role = "USER") {
            return authenticate(
                "/register",
                { name, email, password, role },
                "REGISTER_NETWORK_ERROR",
                "Gagal menghubungkan ke server untuk registrasi."
            );
        },
        logout() {
            return clearAuthState();
        },
        refresh() {
            authState = createAuthState();
            notify();
            return getSnapshot();
        },
        subscribe,
        getSnapshot,
        getToken: () => authState.token,
        getUser: () => authState.user,
        getRole: () => authState.role,
        isAuthenticated: () => authState.isAuthenticated,
        isAdmin: () => authState.isAdmin,
    };
}
