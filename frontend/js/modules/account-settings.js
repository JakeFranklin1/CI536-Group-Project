/**
 * Shows the account settings by redirecting to the account page
 */
export async function showAccountSettings() {
    // Just redirect to the account page
    window.location.href = "account.html";
}

// Keep hideAccountSettings for backward compatibility, though it won't be used much
export function hideAccountSettings() {
    // Redirect back to marketplace
    window.location.href = "marketplace.html";
}

// Export these utility functions for use in account-page.js
export function getInitials(firstName, lastName) {
    let initials = "";

    if (firstName) {
        initials += firstName.charAt(0).toUpperCase();
    }

    if (lastName) {
        initials += lastName.charAt(0).toUpperCase();
    }

    return initials || "?";
}

export function generateColorFromName(name) {
    if (!name) return "#6b00ff"; // Default purple

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 80%, 45%)`;
}

export function applyDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }
}
