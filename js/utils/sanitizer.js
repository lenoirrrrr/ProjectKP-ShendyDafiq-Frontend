/**
 * Membersihkan input teks dari karakter kontrol berbahaya untuk mencegah XSS & simple HTML injection.
 * @param {string} value 
 * @param {Object} options 
 * @returns {string}
 */
export function sanitizeText(value, options = {}) {
    const { maxLength = 255, allowLineBreaks = false } = options;
    const controlCharsPattern = allowLineBreaks ? /[\u0000-\u0008\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
    const whitespacePattern = allowLineBreaks ? /[ \t]+/g : /\s+/g;

    return String(value ?? "")
        .replace(controlCharsPattern, "")
        .replace(whitespacePattern, " ")
        .trim()
        .slice(0, maxLength);
}
