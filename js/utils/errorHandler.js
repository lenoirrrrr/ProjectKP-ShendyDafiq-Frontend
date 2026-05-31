export const errorCategory = Object.freeze({
    app: "app",
    api: "api",
    dom: "dom",
    network: "network",
    order: "order",
    storage: "storage",
    validation: "validation",
});

export class AppError extends Error {
    constructor({
        category = errorCategory.app,
        code = "UNKNOWN_ERROR",
        message = "Terjadi kesalahan. Silakan coba lagi.",
        technicalMessage = message,
        severity = "error",
        cause = null,
        details = {},
    }) {
        super(technicalMessage);
        this.name = "AppError";
        this.category = category;
        this.code = code;
        this.userMessage = message;
        this.severity = severity;
        this.cause = cause;
        this.details = details;
    }
}

export function normalizeError(error, fallback = {}) {
    if (error instanceof AppError) {
        return error;
    }

    return new AppError({
        category: fallback.category ?? errorCategory.app,
        code: fallback.code ?? "UNHANDLED_ERROR",
        message: fallback.message ?? "Terjadi kesalahan. Silakan coba lagi.",
        technicalMessage: error?.message ?? "Unhandled error",
        severity: fallback.severity ?? "error",
        cause: error,
        details: fallback.details ?? {},
    });
}

export function logError(error) {
    const appError = normalizeError(error);
    const label = `[${appError.category.toUpperCase()}:${appError.code}]`;
    const payload = {
        message: appError.message,
        userMessage: appError.userMessage,
        details: appError.details,
        cause: appError.cause,
    };

    if (appError.severity === "warn") {
        console.warn(label, payload);
    } else {
        console.error(label, payload);
    }
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

export function createErrorBoundary({ productRenderer, elements, notificationService }) {
    async function run(scope, task) {
        try {
            return await task();
        } catch (error) {
            handleError(
                error,
                {
                    category: errorCategory.app,
                    code: "ERROR_BOUNDARY",
                    message: "Terjadi kesalahan. Silakan coba lagi.",
                    details: { scope },
                },
                {
                    notify: notificationService ? notificationService.show : null,
                    render:
                        scope === "app:init" && productRenderer && elements
                            ? (message) => productRenderer.renderError(elements.productsGrid, message)
                            : null,
                }
            );
            return null;
        }
    }

    return { run };
}
