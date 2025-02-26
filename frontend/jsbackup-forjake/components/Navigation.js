/**
 * @module Navigation
 * @description Manages navigation UI components and interactions
 */

import { showToast } from "../utils/notifications.js";

/**
 * Sets selected state for navigation items based on current page
 */
export function setSelectedNavItem() {
    const currentPath = window.location.pathname;
    const allNavItems = document.querySelectorAll(".filter-section ul li");

    // Remove selected class from all items
    allNavItems.forEach((item) => item.classList.remove("selected"));

    // Set selected based on current path
    if (currentPath.includes("about.html")) {
        document
            .querySelector('a[href="about.html"]')
            ?.parentElement?.classList.add("selected");
    } else if (currentPath.includes("profile.html")) {
        document
            .querySelector('a[href="profile.html"]')
            ?.parentElement?.classList.add("selected");
    }

    // Add click handlers for filter buttons
    const filterButtons = document.querySelectorAll(".filter-section button");
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove selected from ALL items across ALL filter sections
            const allListItems =
                document.querySelectorAll(".filter-section li");
            allListItems.forEach((item) => item.classList.remove("selected"));

            // Add selected to clicked item
            button.parentElement.classList.add("selected");
        });
    });
}

/**
 * Initialize mobile menu functionality
 */
export function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger-menu");
    const sideNav = document.querySelector(".side-nav");

    hamburger?.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        sideNav?.classList.toggle("active");

        // Remove box-shadow when active
        if (hamburger.classList.contains("active")) {
            hamburger.style.boxShadow = "none";
        } else {
            hamburger.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }
    });
}

/**
 * Handles the click event on the brand container
 */
export function handleBrandClick() {
    if (window.location.pathname.endsWith("marketplace.html")) {
        showToast("You are already on the marketplace page.");
    } else {
        window.location.href = "marketplace.html";
    }
}
