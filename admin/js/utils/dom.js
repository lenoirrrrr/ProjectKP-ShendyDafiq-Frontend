import { createAppError, errorCategory } from "./error.js";
import { sanitizeInput } from "./sanitize.js";

export function getRequiredElement(selector, root = document) {
    const element = root.querySelector(selector);

    if (!element) {
        throw createAppError({
            category: errorCategory.dom,
            code: "MISSING_DOM_ELEMENT",
            message: "Komponen admin tidak lengkap. Silakan refresh browser.",
            technicalMessage: `Missing required DOM element: ${selector}`,
            details: { selector },
        });
    }

    return element;
}

export function createElement(tagName, options = {}, children = []) {
    const element = document.createElement(tagName);

    if (options.className) {
        element.className = options.className;
    }

    if (options.textContent !== undefined) {
        element.textContent = sanitizeInput(options.textContent, {
            maxLength: options.maxLength ?? 600,
            allowLineBreaks: options.allowLineBreaks ?? false,
        });
    }

    Object.entries(options.attributes ?? {}).forEach(([name, value]) => {
        if (value !== undefined && value !== null) {
            element.setAttribute(name, String(value));
        }
    });

    Object.entries(options.dataset ?? {}).forEach(([name, value]) => {
        if (value !== undefined && value !== null) {
            element.dataset[name] = String(value);
        }
    });

    Object.entries(options.events ?? {}).forEach(([name, handler]) => {
        if (typeof handler === "function") {
            element.addEventListener(name, handler);
        }
    });

    children.forEach((child) => {
        element.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });

    return element;
}

export function getEventTargetElement(event) {
    return event.target instanceof Element ? event.target : null;
}

export function fillForm(form, product) {
    Object.entries(product).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);

        if (field) {
            if (field.type === "file") {
                field.value = "";
            } else {
                field.value = value ?? "";
            }
        }
    });
}

export function clearFormErrors(form) {
    form.querySelectorAll("[data-js-error]").forEach((element) => {
        element.textContent = "";
    });
}

export function renderFormErrors(form, errors = {}) {
    clearFormErrors(form);
    Object.entries(errors).forEach(([field, message]) => {
        const target = form.querySelector(`[data-js-error="${field}"]`);

        if (target) {
            target.textContent = message;
        }
    });
}
