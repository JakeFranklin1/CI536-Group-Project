import { showToast } from "./toast.js";

/**
 * Attaches click event listeners to footer links that are for demonstration purposes.
 */
export function initializeFooterLinks() {
    const demoLinks = document.querySelectorAll(".demo-link");

    demoLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault(); // Prevent any default behavior
            showToast("This link is for demonstration purposes.", "info");
        });
    });
}

// Automatically initialize the footer links when the script is loaded
initializeFooterLinks();
