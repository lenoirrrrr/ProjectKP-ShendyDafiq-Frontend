export const errorCategory = Object.freeze({
    api: "api",
    app: "app",
    dom: "dom",
    inventory: "inventory",
    storage: "storage",
    validation: "validation",
});

export function createAppError({
    category = errorCategory.app,
    code = "UNKNOWN_ERROR",
    message = "Terjadi kesalahan. Silakan coba lagi.",
    technicalMessage = message,
    severity = "error",
    cause = null,
    details = {},
} = {}) {
    const error = new Error(technicalMessage);
    error.name = "AppError";
    error.category = category;
    error.code = code;
    error.userMessage = message;
    error.severity = severity;
    error.cause = cause;
    error.details = details;
    return error;
}

export function normalizeError(error, fallback = {}) {
    if (error?.name === "AppError") {
        return error;
    }

    return createAppError({
        category: fallback.category,
        code: fallback.code ?? "UNHANDLED_ERROR",
        message: fallback.message,
        severity: fallback.severity,
        cause: error,
        technicalMessage: error?.message ?? "Unhandled error",
        details: fallback.details,
    });
}

export function logError(error) {
    const appError = normalizeError(error);
    const label = `[${appError.category}:${appError.code}]`;
    const payload = {
        userMessage: appError.userMessage,
        details: appError.details,
        cause: appError.cause,
    };

    if (appError.severity === "warn") {
        console.warn(label, payload);
        return appError;
    }

    console.error(label, payload);
    return appError;
}

export function handleError(error, context = {}, options = {}) {
    const appError = logError(
        normalizeError(error, {
            category: context.category,
            code: context.code,
            message: context.message,
            severity: context.severity,
            details: context.details,
        })
    );

    if (typeof options.notify === "function") {
        options.notify(appError.userMessage, appError.severity === "warn" ? "warning" : "error");
    }

    if (typeof options.render === "function") {
        options.render(appError.userMessage);
    }

    return appError;
}
