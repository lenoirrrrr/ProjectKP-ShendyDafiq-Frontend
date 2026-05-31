import { AppError, errorCategory } from "./errorHandler.js";

/**
 * Mengambil elemen DOM berdasarkan selector secara defensif.
 * Melempar AppError jika elemen tidak ditemukan, mencegah error 'Cannot read properties of null' yang membingungkan.
 * @param {string} selector 
 * @param {HTMLElement} root 
 * @returns {HTMLElement}
 */
export function getRequiredElement(selector, root = document) {
    const element = root.querySelector(selector);

    if (!element) {
        throw new AppError({
            category: errorCategory.dom,
            code: "MISSING_DOM_ELEMENT",
            message: "Halaman tidak lengkap. Silakan refresh browser.",
            technicalMessage: `Missing required DOM element: ${selector}`,
            details: { selector },
        });
    }

    return element;
}

/**
 * Membuat elemen DOM baru secara aman.
 * @param {string} tagName 
 * @param {Object} options 
 * @param {Array} children 
 * @returns {HTMLElement}
 */
export function createElement(tagName, options = {}, children = []) {
    const element = document.createElement(tagName);

    if (options.className) {
        element.className = options.className;
    }

    if (options.textContent !== undefined) {
        element.textContent = options.textContent;
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

    children.forEach((child) => {
        element.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });

    return element;
}

export function getCheckedRadioValue(inputs, fallbackValue = "") {
    const checkedInput = [...inputs].find((input) => input.checked);
    return checkedInput?.value ?? fallbackValue;
}
