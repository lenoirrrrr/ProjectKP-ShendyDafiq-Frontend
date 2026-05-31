import { appConfig } from "../config/config.js";
import { sanitizeText } from "./sanitizer.js";

/**
 * Menampilkan notifikasi toast dinamis di halaman web.
 * @param {HTMLElement} targetElement 
 * @param {string} message 
 * @param {string} type 
 * @param {number} durationMs 
 */
export function showNotification(targetElement, { message, type = "info", durationMs = appConfig.notification.durationMs } = {}) {
    const safeMessage = sanitizeText(message || "Terjadi kesalahan. Silakan coba lagi.", { maxLength: 220 });

    if (!targetElement) {
        console.warn("[notification:MISSING_TARGET]", { message: safeMessage, type });
        return;
    }

    // Hindari konflik timer dengan membersihkan timer lama jika ada
    window.clearTimeout(targetElement.notificationTimer);
    
    targetElement.textContent = safeMessage;
    targetElement.className = `toast active toast-${type}`;

    targetElement.notificationTimer = window.setTimeout(() => {
        targetElement.classList.remove("active");
    }, durationMs);
}

export function createNotificationService(toastElement) {
    return {
        show(message, type = "info") {
            showNotification(toastElement, { message, type });
        },
        success(message) {
            showNotification(toastElement, { message, type: "success" });
        },
        warning(message) {
            showNotification(toastElement, { message, type: "warning" });
        },
        error(message) {
            showNotification(toastElement, { message, type: "error" });
        },
    };
}
