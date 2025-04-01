/**
 * @function showToast
 * @description Displays a toast message.
 * @param {string} message - The message to display in the toast.
 */
export function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
    }, 100);
    setTimeout(() => {
        toast.classList.remove("show");
        document.body.removeChild(toast);
    }, 3000);
}
