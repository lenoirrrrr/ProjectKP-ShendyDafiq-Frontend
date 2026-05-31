import { appConfig } from "../config.js";
import { sanitizeInput } from "../utils/sanitize.js";

export function createNotificationService(toastElement) {
    let timer;

    function show(message, type = "info") {
        if (!toastElement) {
            console.warn("[notification:MISSING_TARGET]", { message, type });
            return;
        }

        window.clearTimeout(timer);
        toastElement.textContent = sanitizeInput(message, { maxLength: 220 });
        toastElement.className = `toast active toast-${type}`;

        timer = window.setTimeout(() => {
            toastElement.classList.remove("active");
        }, appConfig.notification.durationMs);
    }

    return {
        show,
        success(message) {
            show(message, "success");
        },
        warning(message) {
            show(message, "warning");
        },
        error(message) {
            show(message, "error");
        },
    };
}
