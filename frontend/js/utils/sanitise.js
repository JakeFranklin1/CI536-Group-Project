export function escapeHTML(str) {
    if (!str || typeof str !== "string") return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafeText - Text that may contain HTML special characters
 * @returns {string} - HTML-escaped text
 */
// export function escapeHTML(unsafeText) {
//     if (typeof unsafeText !== 'string') {
//         return unsafeText;
//     }

//     const div = document.createElement('div');
//     div.textContent = unsafeText;
//     return div.innerHTML;
// }
