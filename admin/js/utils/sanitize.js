export function sanitizeInput(value, options = {}) {
    const { maxLength = 255, allowLineBreaks = false } = options;
    const controlChars = allowLineBreaks ? /[\u0000-\u0008\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
    const whitespace = allowLineBreaks ? /[ \t]+/g : /\s+/g;

    return String(value ?? "")
        .replace(controlChars, "")
        .replace(whitespace, " ")
        .trim()
        .slice(0, maxLength);
}

export function toNumber(value, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function toInteger(value, fallback = 0) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? Math.trunc(numberValue) : fallback;
}

export function createSlug(value) {
    return sanitizeInput(value, { maxLength: 120 })
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function cloneJson(value) {
    if (value === undefined) {
        return undefined;
    }

    return JSON.parse(JSON.stringify(value));
}
