/* eslint-disable no-unused-vars */
/**
 * @module marketplace
 * @description This module handles the logic for the marketplace page, including authentication checks,
 *              user data fetching, and displaying user information.
 */

import { updateCartCount, updateCartTotal } from "./components/SideCart.js";
import { signOut, checkAuth } from "./services/auth-service.js";
import { escapeHTML } from "./utils/sanitise.js";
import supabase from "./supabase-client.js";
import { createFilterParams } from "./services/FilterService.js";
import { loadGames } from "./services/GameDisplayService.js";

/**
 * Global axios from CDN
 * @type {import('axios').AxiosStatic}
 */
const axios = window.axios;

const API_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://gamestore-backend-9v90.onrender.com";

/**
 * @function handleSignOut
 * @description Signs out the user and redirects them to the index page.
 *              This function is made globally available so it can be called from the HTML.
 * @async
 * @returns {Promise<void>}
 */
window.handleSignOut = async () => {
    await signOut();
};

/**
 * @function initializeMarketplace
 * @description Initializes the marketplace page by checking authentication status and fetching user data.
 *              If the user is authenticated, their information is displayed.
 *              If not, the authentication modal is shown.
 * @async
 * @returns {Promise<void>}
 */
async function initializeMarketplace() {
    try {
        /**
         * @constant {boolean} isAuthenticated
         * @description Checks if the user is authenticated. If not, the function returns early,
         *              preventing further execution.
         */
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        /**
         * @constant {object} userResponse
         * @description Fetches the user data from Supabase.
         */
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
            // Extract only needed user data
            const filteredUserData = {
                email: user.email,
                id: user.id,
                confirmed_at: user.confirmed_at,
            };

            console.log("User Data:", filteredUserData);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * @function handleBrandClick
 * @description Handles the click event on the brand container. Navigates to marketplace.html if not already there,
 *              otherwise displays a toast message.
 */
function handleBrandClick() {
    if (window.location.pathname.endsWith("marketplace.html")) {
        showToast("You are already on the marketplace page.");
    } else {
        window.location.href = "marketplace.html";
    }
}

/**
 * @function showToast
 * @description Displays a toast message.
 * @param {string} message - The message to display in the toast.
 */
function showToast(message) {
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

/**
 * @function setSelectedNavItem
 * @description Sets the selected state for navigation items based on current page
 */
function setSelectedNavItem() {
    const currentPath = window.location.pathname;
    const allNavItems = document.querySelectorAll(".filter-section ul li");

    // Remove selected class from all items
    allNavItems.forEach((item) => item.classList.remove("selected"));

    // Set selected based on current path
    if (currentPath.includes("about.html")) {
        document
            .querySelector('a[href="about.html"]')
            ?.parentElement.classList.add("selected");
    } else if (currentPath.includes("profile.html")) {
        document
            .querySelector('a[href="profile.html"]')
            ?.parentElement.classList.add("selected");
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

            // Get filter type and value
            const filterSection = button.closest(".filter-section");
            const filterType = getFilterTypeFromSection(filterSection);
            const filterValue = button.textContent.trim();

            // Update the marketplace content
            handleFilterSelection(filterType, filterValue);
        });
    });
}

/**
 * Helper function to determine filter type from section
 */
function getFilterTypeFromSection(section) {
    const sectionTitle = section.querySelector("h3").textContent.toLowerCase();

    if (sectionTitle.includes("platforms")) return "platform";
    if (sectionTitle.includes("categories")) return "category";
    if (sectionTitle.includes("top games")) return "timeframe";
    if (sectionTitle.includes("community")) return "community";

    return "general";
}

function initializeMobileMenu() {
    const hamburger = document.querySelector(".hamburger-menu");
    const sideNav = document.querySelector(".side-nav");

    hamburger?.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        sideNav?.classList.toggle("active");

        // Remove box-shadow when active
        if (hamburger.classList.contains("active")) {
            hamburger.style.boxShadow = "none";
        } else {
            hamburger.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"; // Restore default shadow
        }
    });
}

/**
 * @function handleFilterSelection
 * @description Updates the marketplace content based on the selected filter
 * @param {string} filterType - The type of filter (platform, category, timeframe)
 * @param {string} filterValue - The specific value of the filter
 */
function handleFilterSelection(filterType, filterValue) {
    // Update the page header to show the current filter
    const currentSectionHeader = document.getElementById("current-section");
    if (currentSectionHeader) {
        currentSectionHeader.textContent = filterValue;
    }

    // Create filter parameters using the service
    const filterParams = createFilterParams(filterType, filterValue);

    // Load games with the specified filters using the GameDisplayService
    // Use full-screen loader for filter changes
    loadGames(filterParams, 12, true, addItemToCart);
}

/**
 * Adds an item to the shopping cart with animation
 * @param {HTMLElement} gameCard - The game card element to add to cart
 */
function addItemToCart(gameCard) {
    // Create flying animation element
    const addToCartBtn = gameCard.querySelector(".add-to-cart");
    const cartIcon = document.querySelector(".cart-btn");

    if (!addToCartBtn || !cartIcon) {
        console.error("Required elements for cart animation not found");
        return;
    }

    // Get the coordinates
    const start = addToCartBtn.getBoundingClientRect();
    const end = cartIcon.getBoundingClientRect();

    // Create the animation element
    const circle = document.createElement("div");
    circle.className = "add-to-cart-animation";

    // Set initial position
    circle.style.left = `${start.left + start.width / 2}px`;
    circle.style.top = `${start.top + start.height / 2}px`;

    // Calculate the animation path
    const keyframes = [
        {
            left: `${start.left + start.width / 2}px`,
            top: `${start.top + start.height / 2}px`,
            transform: "scale(1)",
            opacity: 1,
        },
        {
            left: `${end.left + end.width / 2}px`,
            top: `${end.top + end.height / 2}px`,
            transform: "scale(0.1)",
            opacity: 0,
        },
    ];

    document.body.appendChild(circle);

    // Animate the circle
    const animation = circle.animate(keyframes, {
        duration: 1000,
        easing: "cubic-bezier(0.47, 0, 0.745, 0.715)",
    });

    // Add the item to cart after animation
    animation.onfinish = () => {
        circle.remove();

        const gameTitle = gameCard.querySelector(".game-title").textContent;
        const gamePrice = gameCard.querySelector(".price").textContent;
        const gameImage = gameCard.querySelector(".game-image").src;

        const cartItemHTML = `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-title">${gameTitle}</div>
                    <div class="cart-item-info">
                        <img src="${gameImage}" alt="${gameTitle}" class="cart-item-image">
                        <div>
                            <div class="cart-item-platform">Platform</div>
                            <div class="cart-item-price">${gamePrice}</div>
                            <div class="cart-item-quantity">
                                <label>Qty:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-decrement">-</button>
                                    <span class="quantity-value">1</span>
                                    <button class="quantity-increment">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="cart-remove" title="Remove item">
                    <i class="fa fa-times"></i>
                </button>
            </div>
        `;

        const cartItemsContainer = document.querySelector(".cart-items");
        const emptyCart = cartItemsContainer?.querySelector(".empty-cart");
        if (emptyCart) {
            emptyCart.remove();
            document.querySelector(".cart-summary").style.display = "block";
        }

        cartItemsContainer?.insertAdjacentHTML("beforeend", cartItemHTML);
        updateCartTotal();
        updateCartCount();

        // Add event listener to the new remove button
        const newRemoveButton = cartItemsContainer?.querySelector(
            ".cart-item:last-child .cart-remove"
        );
        newRemoveButton?.addEventListener("click", function () {
            this.closest(".cart-item").remove();
            updateCartTotal();
            updateCartCount();
        });

        // Add event listeners to new quantity buttons
        const newIncrementButton = cartItemsContainer?.querySelector(
            ".cart-item:last-child .quantity-increment"
        );
        newIncrementButton?.addEventListener("click", function () {
            const quantityValue = this.previousElementSibling;
            quantityValue.textContent = parseInt(quantityValue.textContent) + 1;
            updateCartTotal();
        });

        const newDecrementButton = cartItemsContainer?.querySelector(
            ".cart-item:last-child .quantity-decrement"
        );
        newDecrementButton?.addEventListener("click", function () {
            const quantityValue = this.nextElementSibling;
            if (parseInt(quantityValue.textContent) > 1) {
                quantityValue.textContent =
                    parseInt(quantityValue.textContent) - 1;
                updateCartTotal();
            }
        });
    };
}
/**
 * Sets up event listeners for cart item controls
 */
function setupCartItemEventListeners() {
    // Add event listeners to quantity inputs and buttons
    const quantityInputs = document.querySelectorAll(".quantity-input");
    quantityInputs.forEach((input) => {
        input.addEventListener("change", updateCartTotal);
    });

    const incrementButtons = document.querySelectorAll(".quantity-increment");
    incrementButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const input = this.previousElementSibling;
            input.textContent = parseInt(input.textContent) + 1;
            updateCartTotal();
        });
    });

    const decrementButtons = document.querySelectorAll(".quantity-decrement");
    decrementButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const input = this.nextElementSibling;
            if (parseInt(input.textContent) > 1) {
                input.textContent = parseInt(input.textContent) - 1;
                updateCartTotal();
            }
        });
    });

    const removeButtons = document.querySelectorAll(".cart-remove");
    removeButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const cartItem = this.closest(".cart-item");
            cartItem.remove();
            updateCartTotal();
            updateCartCount();
        });
    });
}

/**
 * @listens DOMContentLoaded
 * @description Initializes the marketplace when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
    initializeMarketplace();

    // Load initial games using the GameDisplayService
    // Pass the addItemToCart function as the callback for the "Add to Cart" button
    loadGames({ timeframe: "Popular in 2025" }, 24, false, addItemToCart);

    initializeMobileMenu();
    setSelectedNavItem();
    updateCartCount();

    const brandContainer = document.querySelector(".brand-container");
    if (brandContainer) {
        brandContainer.addEventListener("click", handleBrandClick);
    }

    // Add event listeners to existing cart items
    setupCartItemEventListeners();
    window.addItemToCart = addItemToCart;
});
